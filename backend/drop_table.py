import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from app.config import get_settings

async def drop_query_history():
    settings = get_settings()
    engine = create_async_engine(settings.database_url, echo=True)
    async with engine.begin() as conn:
        print("Dropping query_history table...")
        await conn.run_sync(lambda sync_conn: sync_conn.execute(
            __import__('sqlalchemy').text("DROP TABLE IF EXISTS query_history CASCADE")
        ))
        print("Dropped.")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(drop_query_history())
