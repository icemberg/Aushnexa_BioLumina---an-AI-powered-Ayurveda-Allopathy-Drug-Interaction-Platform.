"""
PostgreSQL Async Connection Manager

Uses SQLAlchemy 2.0 async engine with asyncpg driver.
"""

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from loguru import logger
import uuid

from app.config import get_settings

# Module-level engine and session factory
_engine = None
_async_session_factory = None


async def init_db():
    """Initialize the async PostgreSQL engine and session factory."""
    global _engine, _async_session_factory

    settings = get_settings()

    _engine = create_async_engine(
        settings.database_url,
        echo=settings.debug,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        pool_recycle=3600,
        connect_args={
            "statement_cache_size": 0,
            "prepared_statement_name_func": lambda: f"__asyncpg_{uuid.uuid4()}__",
        }
    )

    _async_session_factory = async_sessionmaker(
        bind=_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    logger.info(f"PostgreSQL connected: {settings.postgres_host}:{settings.postgres_port}/{settings.postgres_db}")


async def create_tables():
    """Create all tables if they do not exist."""
    global _engine
    if _engine is None:
        raise RuntimeError("Database engine not initialized. Call init_db() first.")
    from app.db.models import Base
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """Close the database engine."""
    global _engine
    if _engine:
        await _engine.dispose()
        logger.info("PostgreSQL disconnected")


async def get_db() -> AsyncSession:
    """
    Dependency that yields an async database session.
    Automatically commits on success, rolls back on exception.
    """
    if _async_session_factory is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")

    async with _async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
