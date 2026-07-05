import asyncio
import httpx
from bs4 import BeautifulSoup
from loguru import logger
from utils.cache import get_cache
from utils.rate_limiter import LIMITERS

class WebCollector:

  def __init__(self):
    self.cache = get_cache()
    self.headers = {
      "User-Agent": (
        "Mozilla/5.0 (compatible; AushnexaResearch/1.0; "
        "Ayurveda drug safety research; "
        "contact: research@aushnexa.com)"
      ),
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    }

  async def collect(self, botanical: str, common: str,
                    drug: str) -> list[dict]:
    results = []

    # Run all source collectors concurrently
    tasks = [
      self._fetch_msk(botanical, common, drug),
      self._fetch_nccih(botanical, common),
      self._fetch_examine(common, drug),
    ]

    # Return exceptions as empty lists — never crash
    source_results = await asyncio.gather(
      *tasks, return_exceptions=True
    )

    for r in source_results:
      if isinstance(r, Exception):
        logger.warning(f"Web collector error: {r}")
      elif r:
        results.extend(r)

    logger.info(f"Web: {len(results)} sources for {common} + {drug}")
    return results

  async def _fetch_msk(self, botanical: str, common: str,
                        drug: str) -> list[dict]:
    """
    Memorial Sloan Kettering herb monographs.
    URL pattern: https://www.mskcc.org/cancer-care/
                 integrative-medicine/herbs/{herb-slug}
    Contains: About, Purported Uses, Drug Interactions section.
    """
    slug = common.lower().replace(" ", "-")
    url = (f"https://www.mskcc.org/cancer-care/"
           f"integrative-medicine/herbs/{slug}")

    cache_key = self.cache.make_key("msk", slug)
    if self.cache.exists(cache_key):
      cached = self.cache.get(cache_key)
      return cached if cached else []

    await LIMITERS["msk"].wait()

    try:
      async with httpx.AsyncClient(
        timeout=15.0, headers=self.headers,
        follow_redirects=True
      ) as client:
        resp = await client.get(url)

        if resp.status_code == 404:
          self.cache.set(cache_key, [], "msk")
          return []

        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "lxml")

        # Extract the Drug Interactions section specifically
        text_content = ""
        interaction_section = None

        # MSK uses section headings — find Drug Interactions
        for heading in soup.find_all(["h2", "h3", "h4"]):
          if "interaction" in heading.text.lower():
            # Get the content after this heading
            content_parts = []
            for sibling in heading.find_next_siblings():
              if sibling.name in ["h2", "h3", "h4"]:
                break
              content_parts.append(sibling.get_text(" ", strip=True))
            interaction_section = " ".join(content_parts)
            break

        # If no specific interaction section, get full page text
        if not interaction_section:
          main = soup.find("main") or soup.find("article")
          if main:
            text_content = main.get_text(" ", strip=True)[:3000]
          else:
            text_content = soup.get_text(" ", strip=True)[:3000]

        content = interaction_section or text_content
        if not content or len(content) < 100:
          self.cache.set(cache_key, [], "msk")
          return []

        # Only include if this herb's page mentions the drug
        if drug.lower() not in content.lower():
          result = []
        else:
          result = [{
            "title": f"MSK: {common} — Drug Interactions",
            "abstract": content[:2000],
            "source": "Memorial Sloan Kettering",
            "url": url,
            "evidence_level": 4,
            "year": 2024,
            "authors": "MSK Integrative Medicine",
            "citation_count": 0,
            "herb_mentioned": True,
            "drug_mentioned": True,
          }]

        self.cache.set(cache_key, result, "msk")
        return result

    except Exception as e:
      logger.warning(f"MSK fetch failed for {common}: {e}")
      self.cache.set(cache_key, [], "msk")
      return []

  async def _fetch_nccih(self, botanical: str,
                          common: str) -> list[dict]:
    """
    NIH National Center for Complementary and Integrative Health.
    URL: https://www.nccih.nih.gov/health/{herb-slug}
    Contains: What the Science Says, Safety sections.
    """
    slug = common.lower().replace(" ", "-")
    url = f"https://www.nccih.nih.gov/health/{slug}"

    cache_key = self.cache.make_key("nccih", slug)
    if self.cache.exists(cache_key):
      cached = self.cache.get(cache_key)
      return cached if cached else []

    await LIMITERS["nccih"].wait()

    try:
      async with httpx.AsyncClient(
        timeout=15.0, headers=self.headers,
        follow_redirects=True
      ) as client:
        resp = await client.get(url)

        if resp.status_code == 404:
          self.cache.set(cache_key, [], "nccih")
          return []

        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "lxml")

        # Get safety and interaction content
        content_parts = []
        for section in soup.find_all(["section", "div"]):
          text = section.get_text(" ", strip=True)
          if any(word in text.lower() for word in
                 ["interaction", "safety", "side effect",
                  "drug", "medication", "warning"]):
            content_parts.append(text[:500])
            if len(content_parts) >= 4:
              break

        content = " ".join(content_parts)[:2000]

        if not content or len(content) < 100:
          self.cache.set(cache_key, [], "nccih")
          return []

        result = [{
          "title": f"NCCIH: {common} Health Information",
          "abstract": content,
          "source": "NIH NCCIH",
          "url": url,
          "evidence_level": 4,
          "year": 2024,
          "authors": "National Center for Complementary "
                     "and Integrative Health",
          "citation_count": 0,
          "herb_mentioned": True,
          "drug_mentioned": False,
        }]

        self.cache.set(cache_key, result, "nccih")
        return result

    except Exception as e:
      logger.warning(f"NCCIH fetch failed for {common}: {e}")
      self.cache.set(cache_key, [], "nccih")
      return []

  async def _fetch_examine(self, common: str,
                            drug: str) -> list[dict]:
    """
    Examine.com herb and supplement database.
    URL: https://examine.com/supplements/{herb-slug}/
    Contains: Research, Drug Interactions sections.
    """
    slug = common.lower().replace(" ", "-")
    url = f"https://examine.com/supplements/{slug}/"

    cache_key = self.cache.make_key("examine", slug)
    if self.cache.exists(cache_key):
      cached = self.cache.get(cache_key)
      return cached if cached else []

    await LIMITERS["examine"].wait()

    try:
      async with httpx.AsyncClient(
        timeout=15.0, headers=self.headers,
        follow_redirects=True
      ) as client:
        resp = await client.get(url)

        if resp.status_code in [404, 403]:
          self.cache.set(cache_key, [], "examine")
          return []

        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "lxml")

        # Get page text, focus on interaction-related content
        full_text = soup.get_text(" ", strip=True)
        
        # Extract relevant section around drug mentions
        drug_idx = full_text.lower().find(drug.lower())
        if drug_idx == -1:
          self.cache.set(cache_key, [], "examine")
          return []

        # Get text around the drug mention (500 chars each side)
        start = max(0, drug_idx - 500)
        end = min(len(full_text), drug_idx + 1000)
        excerpt = full_text[start:end]

        result = [{
          "title": f"Examine.com: {common} — Research Summary",
          "abstract": excerpt,
          "source": "Examine.com",
          "url": url,
          "evidence_level": 3,
          "year": 2024,
          "authors": "Examine.com Research Team",
          "citation_count": 0,
          "herb_mentioned": True,
          "drug_mentioned": True,
        }]

        self.cache.set(cache_key, result, "examine")
        return result

    except Exception as e:
      logger.warning(f"Examine fetch failed for {common}: {e}")
      self.cache.set(cache_key, [], "examine")
      return []
