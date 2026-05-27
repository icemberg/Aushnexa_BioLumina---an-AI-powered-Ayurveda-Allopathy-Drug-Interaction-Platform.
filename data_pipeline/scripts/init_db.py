"""
Initialize Postgres DB and Neo4j Graph.
"""
import asyncio
from loguru import logger
import sys
import os

# Add the project root to python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from backend.app.db.connection import init_db, create_tables
from data_pipeline.loaders.neo4j_loader import GraphLoader

async def main():
    logger.info("Initializing Postgres DB...")
    await init_db()
    await create_tables()
    logger.info("Postgres DB tables created.")
    
    logger.info("Loading Neo4j Data...")
    loader = GraphLoader()
    try:
        loader.clear_database()
        loader.load_herbs()
        loader.load_drugs()
        loader.load_interactions()
        logger.info("Neo4j data loaded.")
    except Exception as e:
        logger.error(f"Error loading Neo4j data: {e}")
    finally:
        loader.close()

if __name__ == "__main__":
    asyncio.run(main())
