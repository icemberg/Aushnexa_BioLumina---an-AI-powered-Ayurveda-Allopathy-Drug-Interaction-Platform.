import uuid
from loguru import logger
import os

class Neo4jWriter:

  def __init__(self, driver):
    self.driver = driver

  async def write_protocol(self, protocol: dict) -> bool:
    if not protocol:
      return False

    status = protocol.get("validation_status", "Experimental")
    
    query = """
    MERGE (h:Herb {canonical_name: $herb_canonical})
    ON CREATE SET h.common_name = $herb_common
    
    MERGE (d:Drug {canonical_name: $drug_canonical})
    
    MERGE (h)-[r:INTERACTS_WITH]->(d)
    
    MERGE (p:Protocol {
        herb_canonical: $herb_canonical,
        drug_canonical: $drug_canonical
    })
    SET p.interaction_found = $interaction_found,
        p.severity = $severity,
        p.mechanism = $mechanism,
        p.recommendation = $recommendation,
        p.evidence_score = $evidence_score,
        p.validation_status = $status,
        p.updated_at = timestamp()
        
    MERGE (p)-[:APPLIES_TO]->(h)
    MERGE (p)-[:APPLIES_TO]->(d)
    """
    
    params = {
        "herb_canonical": protocol.get("herb_canonical", ""),
        "herb_common": protocol.get("herb_common", ""),
        "drug_canonical": protocol.get("drug_canonical", ""),
        "interaction_found": protocol.get("interaction_found", False),
        "severity": protocol.get("severity", ""),
        "mechanism": protocol.get("mechanism", ""),
        "recommendation": protocol.get("recommendation", ""),
        "evidence_score": protocol.get("evidence_score", 0.0),
        "status": status
    }
    
    try:
        # The Neo4j driver in aushnexa is synchronous, but we might wrap it in async
        # Let's use the synchronous execute_query approach for this script
        with self.driver.session() as session:
            session.run(query, **params)
        logger.info(f"Neo4j: Saved protocol for {params['herb_common']} + {params['drug_canonical']}")
        return True
    except Exception as e:
        logger.error(f"Neo4j write failed: {e}")
        return False
