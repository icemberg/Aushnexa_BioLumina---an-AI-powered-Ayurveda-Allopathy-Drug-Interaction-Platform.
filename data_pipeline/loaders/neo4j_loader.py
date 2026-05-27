import asyncio
import json
import os
from pathlib import Path
from loguru import logger
from backend.app.graph.connection import get_driver, init_driver, close_driver

async def clear_database(driver):
    """Wipe the existing Neo4j database."""
    query = "MATCH (n) DETACH DELETE n"
    async with driver.session() as session:
        await session.run(query)
    logger.info("Cleared existing Neo4j database.")

async def create_constraints(driver):
    """Ensure unique constraints exist."""
    queries = [
        "CREATE CONSTRAINT IF NOT EXISTS FOR (h:Herb) REQUIRE h.name IS UNIQUE",
        "CREATE CONSTRAINT IF NOT EXISTS FOR (d:Drug) REQUIRE d.name IS UNIQUE",
        "CREATE CONSTRAINT IF NOT EXISTS FOR (c:Compound) REQUIRE c.name IS UNIQUE"
    ]
    async with driver.session() as session:
        for q in queries:
            try:
                await session.run(q)
            except Exception as e:
                logger.warning(f"Constraint issue: {e}")
    logger.info("Ensured Neo4j constraints.")

async def load_herbs(driver, herbs_data):
    """Load Herb nodes and their synonyms/compounds."""
    async with driver.session() as session:
        for herb in herbs_data:
            # Insert Herb Node
            await session.run(
                """
                MERGE (h:Herb {name: $name})
                SET h.scientific_name = $scientific_name,
                    h.aliases = $aliases
                """,
                name=herb.get("name", herb["id"]),
                scientific_name=herb.get("scientific", ""),
                aliases=herb.get("aliases", [])
            )
            # Create Compound nodes if needed (for MVP, we just use the name as proxy)

async def load_drugs(driver, drugs_data):
    """Load Drug nodes (using drug_classes as proxy for MVP)."""
    async with driver.session() as session:
        for drug in drugs_data:
            await session.run(
                """
                MERGE (d:Drug {name: $name})
                SET d.description = $description,
                    d.category = $category
                """,
                name=drug.get("id"),
                description=drug.get("description", ""),
                category=drug.get("category", "")
            )

async def load_interactions(driver, interactions_data, herbs_data, drugs_data):
    """Load Interactions using the Reified Interaction Node pattern."""
    
    # Map IDs to actual names for consistency
    herb_map = {h["id"]: h.get("name", h["id"]) for h in herbs_data}
    drug_map = {d["id"]: d.get("id") for d in drugs_data}  # Drug IDs are the names in this dataset
    
    async with driver.session() as session:
        count = 0
        for interaction in interactions_data:
            herb_id = interaction.get("herb")
            drug_id = interaction.get("drugClass")
            
            if not herb_id or not drug_id:
                continue
                
            herb_name = herb_map.get(herb_id, herb_id)
            drug_name = drug_map.get(drug_id, drug_id)
            
            # severity mapping from spanish to standardized english keywords
            sev_map = {"alta": "critical", "moderada": "moderate", "baja": "low"}
            severity = sev_map.get(interaction.get("severity", "baja"), "moderate")
            
            # Create Interaction Node and Relationships
            query = """
            MATCH (h:Herb), (d:Drug)
            WHERE h.name = $herb_name AND d.name = $drug_name
            CREATE (i:Interaction {
                severity: $severity,
                confidence: 0.8,
                mechanism: $mechanism,
                recommendation: $recommendation,
                interaction_type: 'Pharmacokinetic'
            })
            CREATE (h)-[:INVOLVED_IN]->(i)-[:INVOLVED_IN]->(d)
            CREATE (e:Evidence {
                source: $source,
                pmid: $pmid,
                study_type: $study_type,
                conclusion: $effect,
                evidence_level: 4
            })
            CREATE (i)-[:SUPPORTED_BY]->(e)
            """
            
            await session.run(
                query,
                herb_name=herb_name,
                drug_name=drug_name,
                severity=severity,
                mechanism=interaction.get("mechanism", ""),
                recommendation="Monitor patient and consider alternatives.",
                effect=interaction.get("effect", ""),
                source=interaction.get("source", ""),
                pmid=interaction.get("doi", ""),
                study_type=interaction.get("evidence", "")
            )
            count += 1
        logger.info(f"Loaded {count} distinct interactions into the graph.")


async def main():
    logger.info("Starting Graph Seed Process...")
    
    # Connect to Neo4j
    await init_driver()
    driver = get_driver()
    
    # Paths to the cloned dataset
    base_dir = Path(__file__).parent.parent / "seed_data"
    
    with open(base_dir / "herbs.json", "r", encoding="utf-8") as f:
        herbs_data = json.load(f)
        
    with open(base_dir / "drugs.json", "r", encoding="utf-8") as f:
        drugs_data = json.load(f)
        
    with open(base_dir / "interactions.json", "r", encoding="utf-8") as f:
        interactions_data = json.load(f)

    logger.info(f"Found {len(herbs_data)} herbs, {len(drugs_data)} drug classes, and {len(interactions_data)} interactions in source.")

    await clear_database(driver)
    await create_constraints(driver)
    
    logger.info("Loading Herbs...")
    await load_herbs(driver, herbs_data)
    
    logger.info("Loading Drugs...")
    await load_drugs(driver, drugs_data)
    
    logger.info("Loading Interactions...")
    await load_interactions(driver, interactions_data, herbs_data, drugs_data)
    
    # Also load generic drugs dynamically for ones that are missing but referenced
    # Sometimes interaction dataset has drugClasses that aren't perfectly mapped in drug_classes.json
    async with driver.session() as session:
        # If an interaction mentions a drug not in drugs.json, create it
        for i in interactions_data:
            drug_name = i.get("drugClass")
            if drug_name:
                await session.run(
                    "MERGE (d:Drug {name: $name})",
                    name=drug_name
                )
    
    
    logger.info("Graph seeding complete.")
    await close_driver()

if __name__ == "__main__":
    import backend.app.config  # ensure env is loaded if needed
    asyncio.run(main())
