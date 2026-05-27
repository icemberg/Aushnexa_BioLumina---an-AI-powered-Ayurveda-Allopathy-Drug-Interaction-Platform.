"""
Authentication API Endpoints

POST /auth/register — Create a new user account
POST /auth/login    — Authenticate and receive JWT
GET  /auth/profile  — Get current user profile
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.connection import get_db
from app.db.models import User, QueryHistory
from app.core.security import hash_password, verify_password, create_access_token
from app.core.exceptions import DuplicateUserError, InvalidCredentialsError, AushNexaException
from app.cache.redis import get_redis
from fastapi import Request
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
    UserInfo,
    ProfileResponse,
)
from app.api.deps import get_current_user

router = APIRouter()

async def check_rate_limit(request: Request, endpoint: str):
    """Check Redis-based rate limit for auth endpoints."""
    redis_client = get_redis()
    if not redis_client:
        return
    ip = request.client.host
    key = f"ratelimit:{endpoint}:{ip}"
    
    current = await redis_client.incr(key)
    if current == 1:
        await redis_client.expire(key, 600)  # 10 minutes
        
    if current > 5:
        raise HTTPException(
            status_code=429,
            detail={"code": "TOO_MANY_REQUESTS", "error": "Too many login attempts. Try again in 10 minutes"}
        )


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user account."""
    await check_rate_limit(request, "register")
    
    # Check for duplicate email
    existing = await db.execute(
        select(User).where(User.email == payload.email)
    )
    if existing.scalar_one_or_none():
        raise DuplicateUserError()

    # Create user
    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name or None,
        role=payload.role,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate and return a JWT access token."""
    await check_rate_limit(request, "login")
    
    result = await db.execute(
        select(User).where(User.email == payload.email)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise InvalidCredentialsError(error_msg="No account found with this email address.")
        
    if not verify_password(payload.password, user.password_hash):
        raise InvalidCredentialsError(error_msg="Incorrect password.")

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "ACCOUNT_INACTIVE", "error": "Account has been deactivated. Contact support."}
        )

    access_token = create_access_token(data={"sub": str(user.id)})

    return TokenResponse(
        access_token=access_token,
        user=UserInfo(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            role=user.role,
        ),
    )


@router.get("/profile", response_model=ProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the authenticated user's profile with query stats."""
    # Count total queries
    result = await db.execute(
        select(func.count(QueryHistory.id)).where(
            QueryHistory.user_id == current_user.id
        )
    )
    total_queries = result.scalar() or 0

    return ProfileResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
        total_queries=total_queries,
        created_at=current_user.created_at.isoformat(),
    )
