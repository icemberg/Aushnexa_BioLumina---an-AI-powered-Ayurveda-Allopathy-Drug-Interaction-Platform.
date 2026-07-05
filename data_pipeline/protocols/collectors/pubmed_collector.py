import asyncio
import httpx
import xml.etree.ElementTree as ET
from loguru import logger
from utils.cache import get_cache
from utils.rate_limiter import LIMITERS
import os

ESEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
EFETCH_URL  = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"

class PubMedCollector:

  def __init__(self):
    self.cache = get_cache()
    self.limiter = LIMITERS["pubmed"]

  async def collect(self, botanical: str, common: str,
                    drug: str) -> list[dict]:
    """
    Returns list of paper dicts:
    {pmid, title, abstract, journal, year, study_type,
     evidence_level, authors, url}
    """
    ncbi_key = os.getenv("NCBI_API_KEY", "")
    results = []

    # Build 3 queries — broad to specific
    queries = [
      # Query 1: Specific interaction query
      (f'("{botanical}"[Title/Abstract] OR '
       f'"{common}"[Title/Abstract]) AND '
       f'"{drug}"[Title/Abstract] AND '
       f'("interaction"[Title/Abstract] OR '
       f'"pharmacokinetic"[Title/Abstract] OR '
       f'"adverse"[Title/Abstract] OR '
       f'"combination"[Title/Abstract])'),

      # Query 2: Clinical study query
      (f'("{botanical}"[Title/Abstract] OR '
       f'"{common}"[Title/Abstract]) AND '
       f'"{drug}"[Title/Abstract] AND '
       f'("clinical trial"[Publication Type] OR '
       f'"randomized"[Title/Abstract] OR '
       f'"case report"[Publication Type])'),

      # Query 3: Mechanism query
      (f'"{botanical}"[Title/Abstract] AND '
       f'"{drug}"[Title/Abstract] AND '
       f'"mechanism"[Title/Abstract]'),
    ]

    seen_pmids = set()

    async with httpx.AsyncClient(timeout=15.0) as client:
      for query in queries:
        cache_key = self.cache.make_key("pubmed_search", query)
        cached = self.cache.get(cache_key)

        if cached:
          pmids = cached
          logger.debug(f"PubMed cache hit: {query[:50]}...")
        else:
          await self.limiter.wait()
          params = {
            "db": "pubmed",
            "term": query,
            "retmax": 5,
            "retmode": "json",
          }
          if ncbi_key:
            params["api_key"] = ncbi_key

          try:
            resp = await client.get(ESEARCH_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
            pmids = data.get("esearchresult", {}).get("idlist", [])
            self.cache.set(cache_key, pmids, "pubmed_search")
          except Exception as e:
            logger.warning(f"PubMed ESearch failed: {e}")
            pmids = []

        # Fetch abstracts for new PMIDs only
        new_pmids = [p for p in pmids if p not in seen_pmids]
        if not new_pmids:
          continue
        seen_pmids.update(new_pmids)

        fetch_cache_key = self.cache.make_key(
          "pubmed_fetch", ",".join(sorted(new_pmids))
        )
        cached_papers = self.cache.get(fetch_cache_key)

        if cached_papers:
          results.extend(cached_papers)
          continue

        await self.limiter.wait()
        fetch_params = {
          "db": "pubmed",
          "id": ",".join(new_pmids),
          "rettype": "abstract",
          "retmode": "xml",
        }
        if ncbi_key:
          fetch_params["api_key"] = ncbi_key

        try:
          resp = await client.get(EFETCH_URL, params=fetch_params)
          resp.raise_for_status()
          papers = self._parse_xml(resp.text, botanical, drug)
          self.cache.set(fetch_cache_key, papers, "pubmed_fetch")
          results.extend(papers)
        except Exception as e:
          logger.warning(f"PubMed EFetch failed for {new_pmids}: {e}")

    logger.info(f"PubMed: {len(results)} papers for {common} + {drug}")
    return results

  def _parse_xml(self, xml_text: str,
                  herb: str, drug: str) -> list[dict]:
    papers = []
    try:
      root = ET.fromstring(xml_text)
    except ET.ParseError as e:
      logger.warning(f"XML parse error: {e}")
      return []

    for article in root.findall(".//PubmedArticle"):
      try:
        pmid_elem = article.find(".//PMID")
        pmid = pmid_elem.text if pmid_elem is not None else ""

        title_elem = article.find(".//ArticleTitle")
        title = title_elem.text or "" if title_elem is not None else ""

        # Collect all abstract text sections
        abstract_texts = article.findall(".//AbstractText")
        abstract_parts = []
        for a in abstract_texts:
          label = a.get("Label", "")
          text = a.text or ""
          if label:
            abstract_parts.append(f"{label}: {text}")
          else:
            abstract_parts.append(text)
        abstract = " ".join(abstract_parts).strip()

        journal_elem = article.find(".//Journal/Title")
        journal = journal_elem.text or "" if journal_elem is not None else ""

        year_elem = article.find(".//PubDate/Year")
        year_str = year_elem.text if year_elem is not None else "0"
        try:
          year = int(year_str)
        except ValueError:
          year = 0

        pub_types = [
          pt.text for pt in article.findall(".//PublicationType")
          if pt.text
        ]

        # Determine evidence level from publication type
        evidence_level = 3  # default: case report
        if any("Meta-Analysis" in pt for pt in pub_types):
          evidence_level = 6
        elif any("Systematic Review" in pt for pt in pub_types):
          evidence_level = 6
        elif any("Randomized Controlled Trial" in pt for pt in pub_types):
          evidence_level = 5
        elif any("Clinical Trial" in pt for pt in pub_types):
          evidence_level = 4
        elif any("Observational" in pt for pt in pub_types):
          evidence_level = 4

        authors_list = article.findall(".//Author")
        authors = []
        for a in authors_list[:3]:
          last = a.find("LastName")
          fore = a.find("ForeName")
          if last is not None:
            name = last.text or ""
            if fore is not None:
              name += f" {(fore.text or '')[:1]}"
            authors.append(name)
        if len(authors_list) > 3:
          authors.append("et al.")
        authors_str = ", ".join(authors)

        if not abstract:
          continue  # Skip papers with no abstract

        papers.append({
          "pmid": pmid,
          "title": title,
          "abstract": abstract,
          "journal": journal,
          "year": year,
          "study_type": pub_types[0] if pub_types else "Unknown",
          "evidence_level": evidence_level,
          "authors": authors_str,
          "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
          "source": "PubMed",
          "herb_mentioned": herb.lower() in abstract.lower()
                           or herb.lower() in title.lower(),
          "drug_mentioned": drug.lower() in abstract.lower()
                           or drug.lower() in title.lower(),
        })
      except Exception as e:
        logger.warning(f"Error parsing article: {e}")
        continue

    return papers
