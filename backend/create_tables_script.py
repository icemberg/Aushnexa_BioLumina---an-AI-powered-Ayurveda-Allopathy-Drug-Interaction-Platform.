import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from app.config import get_settings
from app.db.models import Base

async def create_tables():
    settings = get_settings()
    engine = create_async_engine(settings.database_url, echo=True)
    async with engine.begin() as conn:
        print("Recreating tables...")
        await conn.run_sync(Base.metadata.create_all)
        print("Done.")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(create_tables())
