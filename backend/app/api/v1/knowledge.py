from fastapi import APIRouter, HTTPException, Depends, Query
from loguru import logger
import json

from app.graph.connection import get_driver
from app.graph.queries import (
    get_initial_graph,
    get_node_details,
    find_shortest_path_knowledge,
    search_nodes
)
from app.cache.redis import cache_get, cache_set
from deep_translator import GoogleTranslator

def translate_field(data_dict: dict, field_name: str):
    if field_name in data_dict and data_dict[field_name]:
        try:
            # Only translate if it contains Spanish (heuristic: length > 0)
            # Or we can just let Google Translate auto-detect
            translator = GoogleTranslator(source='auto', target='en')
            translated = translator.translate(data_dict[field_name])
            if translated:
                data_dict[field_name] = translated
        except Exception as e:
            logger.error(f"Translation error for {field_name}: {e}")

router = APIRouter()

@router.get("/graph")
async def get_knowledge_graph():
    """
    Returns the initial graph data for the canvas: nodes and edges.
    Cached for 1 hour.
    """
    cache_key = "knowledge_graph_initial"
    cached = await cache_get(cache_key)
    if cached:
        return json.loads(cached)
        
    try:
        async with get_driver().session() as session:
            data = await get_initial_graph(session)
            
            await cache_set(cache_key, json.dumps(data), ttl=3600)
            return data
    except Exception as e:
        logger.error(f"Failed to fetch initial graph: {e}")
        raise HTTPException(status_code=500, detail="Database query failed")

@router.get("/node")
async def get_node_details_api(node_id: str = Query(..., alias="id")):
    """
    Returns full details for a single node including connected targets, evidence count, and confidence score.
    """
    cache_key = f"knowledge_node_{node_id}"
    cached = await cache_get(cache_key)
    if cached:
        return json.loads(cached)
        
    try:
        async with get_driver().session() as session:
            data = await get_node_details(session, node_id)
            if not data:
                raise HTTPException(status_code=404, detail="Node not found")
                
            if "properties" in data:
                props = data["properties"]
                translate_field(props, "mechanism")
                translate_field(props, "recommendation")
                translate_field(props, "description")
                
            await cache_set(cache_key, json.dumps(data), ttl=21600) # 6 hours
            return data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch node details: {e}")
        raise HTTPException(status_code=500, detail="Database query failed")

@router.get("/pathway")
async def get_pathway(
    origin: str = Query(..., alias="from"), 
    destination: str = Query(..., alias="to")
):
    """
    Runs Neo4j shortest path between two node IDs and returns the ordered path.
    """
    try:
        async with get_driver().session() as session:
            data = await find_shortest_path_knowledge(session, origin, destination)
            return data
    except Exception as e:
        logger.error(f"Failed to trace pathway: {e}")
        raise HTTPException(status_code=500, detail="Database query failed")

@router.get("/search")
async def search_knowledge_nodes(q: str):
    """
    Full-text search across all node names and aliases.
    """
    if len(q) < 2:
        return []
        
    try:
        async with get_driver().session() as session:
            data = await search_nodes(session, q)
            return data
    except Exception as e:
        logger.error(f"Failed to search nodes: {e}")
        raise HTTPException(status_code=500, detail="Database query failed")
