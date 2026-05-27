"""
Neo4j Cypher Query Functions

Centralized raw Cypher queries for Aushnexa BioLumina.
"""

from neo4j import AsyncSession


async def find_direct_interaction(session: AsyncSession, a: str, b: str) -> dict | None:
    query = """
    MATCH (n1)-[:INVOLVED_IN]-(i:Interaction)-[:INVOLVED_IN]-(n2)
    WHERE toLower(n1.name) = toLower($a) AND toLower(n2.name) = toLower($b)
    OPTIONAL MATCH (i)-[:SUPPORTED_BY]->(e:Evidence)
    RETURN i.severity AS severity, i.mechanism AS mechanism, 
           i.recommendation AS recommendation, i.interaction_type AS interaction_type,
           i.confidence AS confidence, i.evidence_level AS evidence_level,
           collect(e { .pmid, .title, .study_type, .evidence_level, .year, .conclusion }) AS evidence
    LIMIT 1
    """
    result = await session.run(query, a=a, b=b)
    record = await result.single()
    return record.data() if record else None


async def get_initial_graph(session: AsyncSession) -> dict:
    query = """
    MATCH p = (h:Herb)-[:INVOLVED_IN]->(i:Interaction)-[:INVOLVED_IN]->(d:Drug)
    WITH h, i, d LIMIT 30
    
    RETURN 
      collect(DISTINCT {id: h.name, label: coalesce(h.name, 'Unknown'), type: 'Phytochemical'}) AS herbs,
      collect(DISTINCT {id: d.name, label: coalesce(d.name, 'Unknown'), type: 'Drug'}) AS drugs,
      collect(DISTINCT {id: elementId(i), label: 'Interaction', type: 'Mechanism', severity: i.severity, mechanism: coalesce(i.mechanism_en, i.mechanism, '')}) AS interactions,
      collect(DISTINCT {source: h.name, target: elementId(i), label: 'INVOLVED_IN'}) AS rels1,
      collect(DISTINCT {source: elementId(i), target: d.name, label: 'INVOLVED_IN'}) AS rels2
    """
    result = await session.run(query)
    record = await result.single()
    if not record:
        return {"nodes": [], "edges": []}
    
    nodes = record["herbs"] + record["drugs"] + record["interactions"]
    edges = record["rels1"] + record["rels2"]
    
    return {"nodes": nodes, "edges": edges}


async def get_node_details(session: AsyncSession, node_id: str) -> dict | None:
    query = """
    MATCH (n) WHERE n.name = $node_id OR n.name_en = $node_id OR elementId(n) = $node_id
    OPTIONAL MATCH (n)-[r]-(m)
    RETURN n, labels(n)[0] AS type, count(m) AS degree, collect(DISTINCT coalesce(m.name, m.name_en))[0..5] AS targets
    """
    result = await session.run(query, node_id=node_id)
    record = await result.single()
    if not record or not record["n"]:
        return None
        
    n = dict(record["n"])
    node_type = record["type"]
    targets = [t for t in record["targets"] if t]
    
    # For Herb/Drug nodes: NEVER use name_en (proper nouns get mistranslated)
    # Only use translated description if available
    if node_type in ("Herb", "Drug"):
        # Remove the bad name_en, keep original name
        n.pop("name_en", None)
        # Use English description if available
        if "description_en" in n and n["description_en"]:
            n["description"] = n.pop("description_en")
        else:
            n.pop("description_en", None)
    else:
        # For Interaction nodes: use English translations for text fields
        if "name_en" in n:
            n.pop("name_en")  # Don't override interaction ID
        if "description_en" in n and n["description_en"]:
            n["description"] = n.pop("description_en")
        else:
            n.pop("description_en", None)
        if "mechanism_en" in n and n["mechanism_en"]:
            n["mechanism"] = n.pop("mechanism_en")
        else:
            n.pop("mechanism_en", None)
        if "recommendation_en" in n and n["recommendation_en"]:
            n["recommendation"] = n.pop("recommendation_en")
        else:
            n.pop("recommendation_en", None)
    
    result_data = {
        "id": n.get("name", node_id),
        "type": node_type,
        "properties": n,
        "primary_targets": targets,
        "confidence_score": 85 if node_type == "Herb" else 60
    }
    
    # For Herb/Drug nodes: also fetch connected interactions so the report has content
    if node_type in ("Herb", "Drug"):
        interactions_query = """
        MATCH (n)-[:INVOLVED_IN]->(i:Interaction)-[:INVOLVED_IN]->(other)
        WHERE n.name = $node_id OR n.name_en = $node_id
          AND labels(other)[0] <> labels(n)[0]
        RETURN coalesce(other.name, 'Unknown') AS partner,
               labels(other)[0] AS partner_type,
               i.severity AS severity,
               coalesce(i.mechanism_en, i.mechanism) AS mechanism,
               coalesce(i.recommendation_en, i.recommendation) AS recommendation,
               i.interaction_type AS interaction_type,
               i.confidence AS confidence
        LIMIT 20
        """
        int_result = await session.run(interactions_query, node_id=node_id)
        int_records = await int_result.data()
        
        # If no results from outgoing direction, try incoming too
        if not int_records:
            interactions_query_reverse = """
            MATCH (other)-[:INVOLVED_IN]->(i:Interaction)-[:INVOLVED_IN]->(n)
            WHERE n.name = $node_id OR n.name_en = $node_id
            RETURN coalesce(other.name, 'Unknown') AS partner,
                   labels(other)[0] AS partner_type,
                   i.severity AS severity,
                   coalesce(i.mechanism_en, i.mechanism) AS mechanism,
                   coalesce(i.recommendation_en, i.recommendation) AS recommendation,
                   i.interaction_type AS interaction_type,
                   i.confidence AS confidence
            LIMIT 20
            """
            int_result = await session.run(interactions_query_reverse, node_id=node_id)
            int_records = await int_result.data()
        
        # Also try bidirectional (undirected)
        if not int_records:
            interactions_query_bidir = """
            MATCH (n)-[:INVOLVED_IN]-(i:Interaction)-[:INVOLVED_IN]-(other)
            WHERE (n.name = $node_id OR n.name_en = $node_id)
              AND n <> other
            RETURN coalesce(other.name, 'Unknown') AS partner,
                   labels(other)[0] AS partner_type,
                   i.severity AS severity,
                   coalesce(i.mechanism_en, i.mechanism) AS mechanism,
                   coalesce(i.recommendation_en, i.recommendation) AS recommendation,
                   i.interaction_type AS interaction_type,
                   i.confidence AS confidence
            LIMIT 20
            """
            int_result = await session.run(interactions_query_bidir, node_id=node_id)
            int_records = await int_result.data()
        
        result_data["interactions"] = int_records
        # Update primary_targets from the interaction data if the original targets were empty
        if not targets and int_records:
            result_data["primary_targets"] = list(set(r["partner"] for r in int_records if r["partner"] != "Unknown"))
    
    return result_data


async def find_shortest_path_knowledge(session: AsyncSession, from_id: str, to_id: str) -> dict:
    query = """
    MATCH p = shortestPath((n1)-[*1..4]-(n2))
    WHERE (n1.name = $from_id OR n1.name_en = $from_id OR elementId(n1) = $from_id)
      AND (n2.name = $to_id OR n2.name_en = $to_id OR elementId(n2) = $to_id)
    RETURN nodes(p) AS nodes, relationships(p) AS rels
    """
    result = await session.run(query, from_id=from_id, to_id=to_id)
    record = await result.single()
    if not record:
        return {"nodes": [], "edges": []}
        
    nodes = []
    for n in record["nodes"]:
        node_id = n.get("name") or str(n.element_id)
        nodes.append(node_id)
        
    edges = []
    for r in record["rels"]:
        edges.append({
            "source": r.nodes[0].get("name") or str(r.nodes[0].element_id),
            "target": r.nodes[1].get("name") or str(r.nodes[1].element_id)
        })
        
    return {"nodes": nodes, "edges": edges}


async def search_nodes(session: AsyncSession, term: str) -> list[dict]:
    query = """
    MATCH (n)
    WHERE toLower(n.name) CONTAINS toLower($term)
       OR toLower(n.name_en) CONTAINS toLower($term)
       OR toLower($term) IN [a IN coalesce(n.aliases, []) | toLower(a)]
    RETURN coalesce(n.name, elementId(n)) AS id, n.name AS name, labels(n)[0] AS type
    LIMIT 10
    """
    result = await session.run(query, term=term)
    records = await result.data()
    return records


async def find_mechanism_path(session: AsyncSession, a: str, b: str) -> list[str]:
    query = """
    MATCH p = shortestPath((n1)-[*1..4]-(n2))
    WHERE toLower(n1.name) = toLower($a) AND toLower(n2.name) = toLower($b)
    RETURN [node in nodes(p) | coalesce(node.name, labels(node)[0])] AS path
    """
    result = await session.run(query, a=a, b=b)
    record = await result.single()
    return record["path"] if record else []


async def get_entity_type(session: AsyncSession, name: str) -> str | None:
    query = """
    MATCH (n) WHERE toLower(n.name) = toLower($name)
    RETURN labels(n)[0] AS label
    LIMIT 1
    """
    result = await session.run(query, name=name)
    record = await result.single()
    return record["label"] if record else None


async def get_known_compounds(session: AsyncSession, herb: str) -> list[str]:
    query = """
    MATCH (h:Herb)-[:CONTAINS]->(c:Compound)
    WHERE toLower(h.name) = toLower($herb)
    RETURN coalesce(c.name, '') AS compound
    """
    result = await session.run(query, herb=herb)
    records = await result.data()
    return [r["compound"] for r in records if r["compound"]]


async def check_all_pairs(session: AsyncSession, items: list[str]) -> list[dict]:
    query = """
    UNWIND $items AS item_a
    UNWIND $items AS item_b
    WITH item_a, item_b WHERE item_a < item_b
    MATCH (n1)-[:INVOLVED_IN]-(i:Interaction)-[:INVOLVED_IN]-(n2)
    WHERE toLower(n1.name) = toLower(item_a) AND toLower(n2.name) = toLower(item_b)
    OPTIONAL MATCH (i)-[:SUPPORTED_BY]->(e:Evidence)
    RETURN n1.name AS item_a, n2.name AS item_b,
           i.severity AS severity, i.mechanism AS mechanism,
           i.recommendation AS recommendation, i.interaction_type AS interaction_type,
           i.confidence AS confidence, i.evidence_level AS evidence_level,
           collect(e { .pmid, .title, .study_type, .evidence_level, .year, .conclusion }) AS evidence
    """
    result = await session.run(query, items=items)
    return await result.data()


async def get_herb_profile(session: AsyncSession, name: str) -> dict | None:
    """
    Retrieve herb profile using only properties that actually exist in the DB:
    name, scientific_name, aliases, description.
    No CONTAINS/MODULATES rels exist yet — those are handled via fallback in herb.py.
    """
    # Clean the name — strip anything after " / " since our DB stores
    # herbs as "Tulsi / Albahaca sagrada" but we may receive just "Tulsi"
    clean_name = name.split(" / ")[0].strip() if " / " in name else name.strip()

    query = """
    MATCH (h:Herb)
    WHERE toLower(h.name) CONTAINS toLower($name)
       OR toLower($name) IN [a IN coalesce(h.aliases, []) | toLower(a)]
       OR toLower(coalesce(h.scientific_name, '')) = toLower($name)
    RETURN h.name AS name,
           h.scientific_name AS scientific_name,
           h.aliases AS aliases,
           h.description AS description
    LIMIT 1
    """
    result = await session.run(query, name=clean_name)
    record = await result.single()
    return record.data() if record else None

