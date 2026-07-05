import asyncio
import httpx
import os
from loguru import logger
from utils.cache import get_cache
from utils.rate_limiter import LIMITERS

OPENALEX_URL = "https://api.openalex.org/works"
CONTACT_EMAIL = os.getenv("CONTACT_EMAIL", "research@aushnexa.com")

class OpenAlexCollector:

  def __init__(self):
    self.cache = get_cache()
    self.limiter = LIMITERS["openalex"]

  def _reconstruct_abstract(self, inverted_index: dict) -> str:
    """
    OpenAlex stores abstracts as inverted index for copyright.
    Reconstruct into readable text.
    """
    if not inverted_index:
      return ""
    positions = []
    for word, pos_list in inverted_index.items():
      for pos in pos_list:
        positions.append((pos, word))
    positions.sort(key=lambda x: x[0])
    return " ".join(word for _, word in positions)

  async def collect(self, botanical: str, common: str,
                    drug: str) -> list[dict]:
    results = []

    queries = [
      f"{botanical} {drug} interaction",
      f"{common} {drug} pharmacokinetic",
      f"{botanical} {drug} clinical",
    ]

    seen_ids = set()

    async with httpx.AsyncClient(timeout=15.0) as client:
      for query in queries:
        cache_key = self.cache.make_key("openalex", query)
        cached = self.cache.get(cache_key)

        if cached:
          for paper in cached:
            if paper["openalex_id"] not in seen_ids:
              seen_ids.add(paper["openalex_id"])
              results.append(paper)
          continue

        await self.limiter.wait()

        params = {
          "search": query,
          "filter": "type:article",
          "sort": "cited_by_count:desc",
          "per-page": 5,
          "select": (
            "id,title,abstract_inverted_index,authorships,"
            "publication_year,cited_by_count,open_access,"
            "primary_location,doi,type"
          ),
          "mailto": CONTACT_EMAIL,
        }

        try:
          resp = await client.get(OPENALEX_URL, params=params)
          resp.raise_for_status()
          data = resp.json()
          works = data.get("results", [])
        except Exception as e:
          logger.warning(f"OpenAlex failed for '{query}': {e}")
          continue

        papers = []
        for work in works:
          oa_id = work.get("id", "")
          if oa_id in seen_ids:
            continue
          seen_ids.add(oa_id)

          abstract = self._reconstruct_abstract(
            work.get("abstract_inverted_index", {})
          )

          if not abstract:
            continue  # skip papers with no abstract

          # Get journal name
          primary = work.get("primary_location") or {}
          source = primary.get("source") or {}
          journal = source.get("display_name", "")

          # Get authors
          authorships = work.get("authorships", [])[:3]
          author_names = []
          for a in authorships:
            author = a.get("author", {})
            name = author.get("display_name", "")
            if name:
              author_names.append(name)
          if len(work.get("authorships", [])) > 3:
            author_names.append("et al.")

          # Get DOI URL
          doi = work.get("doi", "") or ""
          pdf_url = ""
          oa_info = work.get("open_access", {}) or {}
          if oa_info.get("is_oa") and oa_info.get("oa_url"):
            pdf_url = oa_info["oa_url"]

          year = work.get("publication_year") or 0
          citations = work.get("cited_by_count") or 0

          # Estimate evidence level from citation count
          if citations > 100:
            evidence_level = 5
          elif citations > 20:
            evidence_level = 4
          else:
            evidence_level = 3

          paper = {
            "openalex_id": oa_id,
            "pmid": "",  # will be empty — use DOI for link
            "title": work.get("title", ""),
            "abstract": abstract,
            "journal": journal,
            "year": year,
            "citation_count": citations,
            "authors": ", ".join(author_names),
            "url": doi if doi else oa_id,
            "pdf_url": pdf_url,
            "evidence_level": evidence_level,
            "source": "OpenAlex",
            "herb_mentioned": (
              botanical.lower() in abstract.lower()
              or common.lower() in abstract.lower()
            ),
            "drug_mentioned": drug.lower() in abstract.lower(),
          }
          papers.append(paper)

        self.cache.set(cache_key, papers, "openalex")
        results.extend(papers)

    logger.info(f"OpenAlex: {len(results)} papers for {common} + {drug}")
    return results
