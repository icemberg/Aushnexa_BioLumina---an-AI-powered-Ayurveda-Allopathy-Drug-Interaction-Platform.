import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.config import get_settings
from app.db.models import Base

async def reset_db():
    settings = get_settings()
    engine = create_async_engine(settings.database_url, echo=True, isolation_level="AUTOCOMMIT")
    async with engine.connect() as conn:
        print("Dropping query_history...")
        await conn.execute(text("DROP TABLE IF EXISTS query_history CASCADE;"))
        print("Dropped.")
    
    # Recreate tables
    async with engine.begin() as conn:
        print("Recreating tables...")
        await conn.run_sync(Base.metadata.create_all)
        print("Done.")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(reset_db())
