"""
Redis Cache Manager

Provides async Redis connection, caching helpers,
and key management for the Aushnexa platform.
"""

import json
from typing import Any

import redis.asyncio as aioredis
from loguru import logger

from app.config import get_settings

# Module-level Redis client
_redis_client = None

# Cache TTL defaults (in seconds)
CACHE_TTL_SHORT = 300       # 5 minutes
CACHE_TTL_MEDIUM = 1800     # 30 minutes
CACHE_TTL_LONG = 86400      # 24 hours
CACHE_TTL_ENTITY = 604800   # 7 days (entity normalizations rarely change)


async def init_redis():
    """Initialize the async Redis connection."""
    global _redis_client

    settings = get_settings()
    _redis_client = aioredis.from_url(
        settings.redis_url,
        encoding="utf-8",
        decode_responses=True,
        max_connections=20,
    )

    # Verify connection
    await _redis_client.ping()
    logger.info(f"Redis connected: {settings.redis_host}:{settings.redis_port}")


async def close_redis():
    """Close the Redis connection."""
    global _redis_client
    if _redis_client:
        await _redis_client.close()
        logger.info("Redis disconnected")


def get_redis() -> aioredis.Redis:
    """Get the Redis client instance."""
    if _redis_client is None:
        raise RuntimeError("Redis not initialized. Call init_redis() first.")
    return _redis_client


# ─── Cache Helper Functions ───

async def cache_get(key: str) -> Any | None:
    """
    Get a cached value by key.
    Returns None if key doesn't exist or Redis is unavailable.
    """
    try:
        client = get_redis()
        value = await client.get(key)
        if value:
            return json.loads(value)
        return None
    except Exception as e:
        logger.warning(f"Redis cache_get error for key={key}: {e}")
        return None


async def cache_set(key: str, value: Any, ttl: int = CACHE_TTL_MEDIUM):
    """
    Set a cached value with TTL.
    Silently fails if Redis is unavailable.
    """
    try:
        client = get_redis()
        serialized = json.dumps(value, default=str)
        await client.setex(key, ttl, serialized)
    except Exception as e:
        logger.warning(f"Redis cache_set error for key={key}: {e}")


async def cache_delete(key: str):
    """Delete a cached key."""
    try:
        client = get_redis()
        await client.delete(key)
    except Exception as e:
        logger.warning(f"Redis cache_delete error for key={key}: {e}")


async def cache_exists(key: str) -> bool:
    """Check if a key exists in cache."""
    try:
        client = get_redis()
        return await client.exists(key) > 0
    except Exception:
        return False


# ─── Key Generators ───

def interaction_cache_key(items: list[str], language: str = "en") -> str:
    """Generate a cache key for an interaction check query."""
    sorted_items = sorted([item.lower().strip() for item in items])
    items_str = "|".join(sorted_items)
    return f"interaction:{items_str}:lang:{language}"


def normalize_cache_key(entity_name: str) -> str:
    """Generate a cache key for an entity normalization result."""
    return f"normalize:{entity_name.lower().strip()}"


def evidence_cache_key(item1: str, item2: str) -> str:
    """Generate a cache key for evidence retrieval."""
    pair = sorted([item1.lower().strip(), item2.lower().strip()])
    return f"evidence:{pair[0]}:{pair[1]}"
