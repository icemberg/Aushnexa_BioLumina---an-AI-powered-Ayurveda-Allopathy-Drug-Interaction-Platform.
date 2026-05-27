import asyncio
from app.graph.connection import init_driver, close_driver, get_driver
from app.graph.queries import check_all_pairs
from app.services.normalization_service import NormalizationService
from app.core.exceptions import EntityNormalizationError

async def test():
    await init_driver()
    driver = get_driver()
    try:
        norm_service = NormalizationService()
        
        all_entities = ["te_verde", "tiroideos"]
        canonical_entities = []
        for entity in all_entities:
            try:
                norm = await norm_service.normalize(entity)
                canonical_entities.append(norm.canonical)
                print(f"Normalized {entity} -> {norm.canonical}")
            except EntityNormalizationError:
                canonical_entities.append(entity)
                print(f"Failed to normalize {entity}")
                
        async with driver.session() as session:
            data = await check_all_pairs(session, canonical_entities)
            print("Pairs found:", data)
    finally:
        await close_driver()

if __name__ == "__main__":
    asyncio.run(test())

if __name__ == "__main__":
    asyncio.run(test())
