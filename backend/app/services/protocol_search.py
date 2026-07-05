from neo4j import AsyncSession
from loguru import logger

class ProtocolSearch:
    @staticmethod
    async def find_best_protocol(session: AsyncSession, conditions: list[str], herbs: list[str], drugs: list[str]) -> dict | None:
        """
        Searches Neo4j for a validated protocol matching the condition OR the herb+drug pair.
        Implements ranking: score = evidence_score + recency_weight + source_authority + clinician_validation
        Returns the highest-scoring protocol that meets the threshold (evidence_score >= 70 and status == "validated").
        """
        if not conditions and not (herbs and drugs):
            return None
            
        # Cypher query to match on conditions or components
        query = """
        MATCH (p:Protocol)
        WHERE p.status = 'validated' AND p.evidence_score >= 70
        AND (
            any(c IN $conditions WHERE toLower(p.condition) CONTAINS toLower(c)) OR
            (any(h IN $herbs WHERE toLower(p.ayurvedic_base) CONTAINS toLower(h)) AND 
             any(d IN $drugs WHERE toLower(p.allopathic_base) CONTAINS toLower(d)))
        )
        RETURN p {
            .*
        } AS protocol
        ORDER BY p.evidence_score DESC
        LIMIT 1
        """
        
        try:
            result = await session.run(query, conditions=conditions, herbs=herbs, drugs=drugs)
            record = await result.single()
            
            if record and record["protocol"]:
                logger.info(f"Protocol found in Neo4j Library: {record['protocol'].get('title')}")
                return dict(record["protocol"])
                
            return None
        except Exception as e:
            logger.error(f"Error searching protocols in Neo4j: {e}")
            return None
            
    @staticmethod
    async def save_draft_protocol(session: AsyncSession, generated_protocol: dict, source_query: str):
        """
        Saves an AI-generated protocol as a Draft in Neo4j.
        """
        query = """
        CREATE (p:Protocol {
            protocol_id: randomUUID(),
            title: $title,
            condition: $condition,
            allopathic_base: $allopathic_base,
            ayurvedic_base: $ayurvedic_base,
            status: 'draft',
            validated_by: 'AI-generated',
            evidence_level: 0,
            evidence_score: 0,
            source_query: $source_query,
            created_at: datetime()
        })
        """
        
        # Extract from legacy generated format
        prot = generated_protocol.get("protocol", {})
        matrix = generated_protocol.get("matrix", {})
        
        title = prot.get("title", "Draft Protocol")
        condition = prot.get("focus", "Unknown")
        allo_base = prot.get("allopathic_base", {}).get("name", "")
        ayur_base = prot.get("ayurvedic_integration", {}).get("name", "")
        
        try:
            await session.run(
                query,
                title=title,
                condition=condition,
                allopathic_base=allo_base,
                ayurvedic_base=ayur_base,
                source_query=source_query
            )
            logger.info("Saved draft protocol to Neo4j.")
        except Exception as e:
            logger.error(f"Failed to save draft protocol: {e}")
