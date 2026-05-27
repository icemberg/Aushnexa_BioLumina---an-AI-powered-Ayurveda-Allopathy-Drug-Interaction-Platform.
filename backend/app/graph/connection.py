"""
Neo4j Async Connection Manager

Uses the official neo4j Python async driver for Cypher queries.
"""

from neo4j import AsyncGraphDatabase
from loguru import logger

from app.config import get_settings

# Module-level driver
_driver = None


async def init_driver():
    """Initialize the Neo4j async driver."""
    global _driver

    settings = get_settings()

    _driver = AsyncGraphDatabase.driver(
        settings.neo4j_uri,
        auth=(settings.neo4j_user, settings.neo4j_password),
        max_connection_pool_size=50,
        connection_timeout=30,
    )

    # Verify connectivity
    async with _driver.session() as session:
        result = await session.run("RETURN 1 AS connected")
        record = await result.single()
        assert record["connected"] == 1

    logger.info(f"Neo4j connected: {settings.neo4j_uri}")


async def close_driver():
    """Close the Neo4j driver."""
    global _driver
    if _driver:
        await _driver.close()
        logger.info("Neo4j disconnected")


async def get_session():
    """
    Dependency that yields an async Neo4j session.
    Used by graph query functions.
    """
    if _driver is None:
        raise RuntimeError("Neo4j not initialized. Call init_driver() first.")

    async with _driver.session() as session:
        yield session


def get_driver():
    """Get the raw Neo4j driver for direct use."""
    if _driver is None:
        raise RuntimeError("Neo4j not initialized. Call init_driver() first.")
    return _driver
