"""
Fetch PubMed literature related to herb-drug interactions.
"""
import httpx
import json
from loguru import logger
from pathlib import Path
import os
import sys

# Add the project root to python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

PUBMED_API_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
PUBMED_SUMMARY_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"

def fetch_pubmed_data(query: str, max_results: int = 10):
    """
    Fetch literature from PubMed matching the query.
    """
    try:
        # Step 1: Search
        search_params = {
            "db": "pubmed",
            "term": query,
            "retmax": max_results,
            "retmode": "json"
        }
        response = httpx.get(PUBMED_API_URL, params=search_params, timeout=30.0)
        response.raise_for_status()
        search_data = response.json()
        
        id_list = search_data.get("esearchresult", {}).get("idlist", [])
        if not id_list:
            return []
            
        # Step 2: Fetch summaries
        summary_params = {
            "db": "pubmed",
            "id": ",".join(id_list),
            "retmode": "json"
        }
        summary_resp = httpx.get(PUBMED_SUMMARY_URL, params=summary_params, timeout=30.0)
        summary_resp.raise_for_status()
        summary_data = summary_resp.json()
        
        results = []
        for uid in id_list:
            doc = summary_data.get("result", {}).get(uid, {})
            results.append({
                "pmid": uid,
                "title": doc.get("title", ""),
                "pubdate": doc.get("pubdate", ""),
                "source": doc.get("source", "")
            })
            
        return results
        
    except Exception as e:
        logger.error(f"Failed to fetch PubMed data: {e}")
        return []

if __name__ == "__main__":
    query = "herb drug interaction"
    logger.info(f"Fetching PubMed data for '{query}'...")
    results = fetch_pubmed_data(query, 50)
    
    out_path = Path(__file__).parent.parent / "seed_data" / "pubmed_results.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
        
    logger.info(f"Saved {len(results)} results to {out_path}")
