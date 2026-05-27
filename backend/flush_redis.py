import asyncio
from app.cache.redis import init_redis, get_redis, close_redis

async def flush():
    await init_redis()
    redis = get_redis()
    await redis.flushdb()
    await close_redis()

if __name__ == "__main__":
    asyncio.run(flush())
