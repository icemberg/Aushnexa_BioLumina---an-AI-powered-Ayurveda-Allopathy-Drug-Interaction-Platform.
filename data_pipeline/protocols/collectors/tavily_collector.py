import asyncio
import httpx
import os
from loguru import logger
from utils.cache import get_cache
from utils.rate_limiter import LIMITERS

TAVILY_API_URL = "https://api.tavily.com/search"

class TavilyCollector:

  def __init__(self):
    self.cache = get_cache()
    self.limiter = LIMITERS["tavily"]

  async def collect(self, botanical: str, common: str,
                    drug: str) -> list[dict]:
    """
    Search the web for herb-drug interactions using Tavily API.
    """
    tavily_key = os.getenv("TAVILY_API_KEY", "")
    if not tavily_key:
      logger.warning("TAVILY_API_KEY not set, skipping Tavily collector.")
      return []

    results = []
    
    # We use a highly specific query to target interactions
    query = f"{common} ({botanical}) and {drug} drug interaction side effects clinical study"
    
    cache_key = self.cache.make_key("tavily", query)
    cached = self.cache.get(cache_key)

    if cached:
      logger.debug(f"Tavily cache hit for query: {query}")
      return cached

    await self.limiter.wait()

    try:
      async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(
          TAVILY_API_URL,
          json={
            "api_key": tavily_key,
            "query": query,
            "search_depth": "advanced",
            "include_answer": False,
            "include_raw_content": False,
            "max_results": 5,
            "include_domains": [
                "pubmed.ncbi.nlm.nih.gov",
                "pmc.ncbi.nlm.nih.gov",
                "nccih.nih.gov",
                "mskcc.org",
                "examine.com",
                "drugs.com",
                "medlineplus.gov",
                "mayoclinic.org"
            ]
          }
        )
        resp.raise_for_status()
        data = resp.json()
        
        for r in data.get("results", []):
            content = r.get("content", "")
            if not content:
                continue
                
            results.append({
                "title": r.get("title", f"Web Search Result: {common} & {drug}"),
                "abstract": content,
                "source": "Tavily Search",
                "url": r.get("url", ""),
                "evidence_level": 3,
                "year": 2024,
                "authors": "Web Source",
                "citation_count": 0,
                "herb_mentioned": common.lower() in content.lower() or botanical.lower() in content.lower(),
                "drug_mentioned": drug.lower() in content.lower()
            })
            
        self.cache.set(cache_key, results, "tavily")

    except Exception as e:
      logger.warning(f"Tavily search failed for {common}: {e}")

    logger.info(f"Tavily: {len(results)} results for {common} + {drug}")
    return results
