"""
Aushnexa — FastAPI Application Entry Point

Initializes the FastAPI app with CORS, lifespan management,
and all API route mounting.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.middleware.gzip import GZipMiddleware
from loguru import logger
import sys
import uuid
import contextvars
import json

import asyncio
from datetime import datetime

from app.config import get_settings
from app.db.connection import init_db, close_db, create_tables
from app.graph.connection import init_driver, close_driver
from app.cache.redis import init_redis, close_redis, get_redis
from app.api.v1 import interactions, auth, history, translate, evidence, herb, ai, knowledge, admin
from app.core.exceptions import AushNexaException, ErrorResponse
from app.core.tasks import start_background_tasks
from fastapi.responses import JSONResponse
from fastapi import Request, Response
from fastapi.exceptions import RequestValidationError

# Context variable for request ID tracking across async calls
request_id_ctx_var = contextvars.ContextVar("request_id", default="-")

# Configure loguru to include request_id from contextvar
logger.configure(
    handlers=[
        {
            "sink": sys.stdout,
            "format": "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - [<yellow>{extra[request_id]}</yellow>] - <level>{message}</level>",
            "filter": lambda record: record["extra"].update(request_id=request_id_ctx_var.get()) or True
        }
    ]
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup: initialize database connections.
    Shutdown: close all connections gracefully.
    """
    settings = get_settings()
    logger.info(f"Starting {settings.app_name} in {settings.app_env} mode")

    # Initialize connections
    await init_db()
    await create_tables()
    await init_driver()
    await init_redis()
    
    # Store start time in Redis
    redis_client = get_redis()
    if redis_client:
        start_time_iso = datetime.utcnow().isoformat()
        await redis_client.set("system:start_time", start_time_iso)
        
    # Start background tasks
    task = asyncio.create_task(start_background_tasks())

    logger.info("All services connected successfully")
    yield

    # Cleanup
    logger.info("Shutting down services...")
    await close_redis()
    await close_driver()
    await close_db()
    logger.info("All services disconnected")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        description=(
            "AI-powered multilingual clinical decision-support platform "
            "for detecting interactions between Ayurvedic herbs and "
            "allopathic medicines."
        ),
        version="1.0.0",
        lifespan=lifespan,
        docs_url="/v1/docs" if settings.debug else None,
        redoc_url="/v1/redoc" if settings.debug else None,
    )

    # ─── CORS Middleware ───
    # Register CORS first so it handles preflight before any other middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ─── Security Headers Middleware ───
    class SecurityHeadersMiddleware(BaseHTTPMiddleware):
        async def dispatch(self, request: Request, call_next) -> Response:
            response = await call_next(request)
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["Content-Security-Policy"] = "default-src 'self'"
            return response

    app.add_middleware(SecurityHeadersMiddleware)

    # ─── Sanitization Middleware Removed ───
    # (BaseHTTPMiddleware hanging fix)

    # ─── Request ID Tracing Middleware ───
    class RequestIDMiddleware(BaseHTTPMiddleware):
        async def dispatch(self, request: Request, call_next) -> Response:
            request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
            request_id_ctx_var.set(request_id)
            
            response = await call_next(request)
            response.headers["X-Request-ID"] = request_id
            return response
            
    app.add_middleware(RequestIDMiddleware)

    # ─── GZip Middleware ───
    # Compress large payloads (min 1000 bytes)
    app.add_middleware(GZipMiddleware, minimum_size=1000)

    # ─── Mount API Routers ───
    app.include_router(
        auth.router,
        prefix="/v1/auth",
        tags=["Authentication"],
    )
    app.include_router(
        interactions.router,
        prefix="/v1",
        tags=["Interactions"],
    )
    app.include_router(history.router, prefix="/v1", tags=["history"])
    app.include_router(translate.router, prefix="/v1", tags=["translate"])
    app.include_router(evidence.router, prefix="/v1/evidence", tags=["evidence"])
    app.include_router(herb.router, prefix="/v1/herb", tags=["herb"])
    app.include_router(ai.router, prefix="/v1/ai", tags=["ai"])
    app.include_router(knowledge.router, prefix="/v1/knowledge", tags=["knowledge"])
    app.include_router(admin.router, prefix="/v1/admin", tags=["admin"])

    # ─── Health Check ───
    @app.get("/health", tags=["System"])
    async def health_check():
        return {
            "status": "healthy",
            "service": settings.app_name,
            "version": "1.0.0",
        }

    # ─── Exception Handlers ───
    @app.exception_handler(AushNexaException)
    async def aushnexa_exception_handler(request: Request, exc: AushNexaException):
        response_data = ErrorResponse(
            error=exc.message,
            code=exc.code,
            status=exc.status_code
        ).model_dump()
        return JSONResponse(status_code=exc.status_code, content=response_data)

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        if isinstance(exc.detail, dict) and "code" in exc.detail and "error" in exc.detail:
            # Custom HTTP exceptions already formatted
            response_data = ErrorResponse(
                error=exc.detail["error"],
                code=exc.detail["code"],
                status=exc.status_code
            ).model_dump()
        else:
            # Generic HTTP exceptions (like 404 Not Found, 422 Validation Error)
            response_data = ErrorResponse(
                error=str(exc.detail),
                code="HTTP_ERROR",
                status=exc.status_code
            ).model_dump()
            
        return JSONResponse(status_code=exc.status_code, content=response_data)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        # Extract the first error message, usually the most relevant
        error_msg = exc.errors()[0].get("msg", "Validation Error")
        # Clean up Pydantic "Value error, " prefix if present
        if error_msg.startswith("Value error, "):
            error_msg = error_msg.replace("Value error, ", "")
            
        response_data = ErrorResponse(
            error=error_msg,
            code="VALIDATION_ERROR",
            status=422
        ).model_dump()
        return JSONResponse(status_code=422, content=response_data)

    return app


app = create_app()

# Trigger reload
# Trigger reload 3
