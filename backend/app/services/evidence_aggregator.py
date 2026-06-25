"""
Evidence Aggregator Service

Fires concurrent requests to multiple clinical trial registries and
literature databases, deduplicates results, and scores them by relevance.

Sources:
  - ClinicalTrials.gov (API v2)
  - PubMed (NCBI E-utilities)
  - CTRI India (HTML scrape)
  - Semantic Scholar (Graph API v1)
"""

import asyncio
import httpx
import urllib.parse
from typing import List, Dict, Any
from bs4 import BeautifulSoup
from loguru import logger
from app.config import get_settings


# ──────────────────────────────────────────────
#  Unified response schemas
# ──────────────────────────────────────────────

class TrialResult:
    def __init__(self, id, title, status, phase, condition, intervention, summary, sponsor, source):
        self.id = id
        self.title = title
        self.status = status
        self.phase = phase
        self.condition = condition
        self.intervention = intervention
        self.summary = summary
        self.sponsor = sponsor
        self.source_registry = source
        self.relevance_score = 0
        self.url = ""

class PaperResult:
    def __init__(self, id, title, authors, journal, year, abstract, citations, source):
        self.id = id
        self.title = title
        self.authors = authors
        self.journal = journal
        self.year = year
        self.abstract = abstract
        self.citation_count = citations
        self.source_registry = source
        self.relevance_score = 0
        self.url = ""
        self.doi = ""
        self.is_oa = False


# ──────────────────────────────────────────────
#  ClinicalTrials.gov  (API v2)
# ──────────────────────────────────────────────

async def fetch_clinicaltrials(herb: str, drug: str, compounds: str) -> List[TrialResult]:
    """
    Uses query.term with the full URL built manually so that the dot-notation
    key is preserved exactly as ClinicalTrials.gov expects.
    """
    try:
        # Build a broad search query using botanical name + common name + drug
        search_parts = []
        if herb:
            search_parts.append(herb)
        if compounds:
            for c in compounds.split(",")[:2]:  # limit compound terms
                c = c.strip()
                if c and c.lower() != herb.lower():
                    search_parts.append(c)

        herb_clause = " OR ".join(search_parts) if search_parts else ""
        if drug and herb_clause:
            search_query = f"({herb_clause}) AND {drug}"
        elif drug:
            search_query = drug
        else:
            search_query = herb_clause

        # Build the URL as a plain string to avoid httpx mangling the dot-key
        encoded_query = urllib.parse.quote(search_query)
        url = f"https://clinicaltrials.gov/api/v2/studies?query.term={encoded_query}&pageSize=10&format=json"

        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                logger.warning(f"CT.gov returned {resp.status_code}")
                return []
            data = resp.json()

            trials = []
            for s in data.get("studies", []):
                p = s.get("protocolSection", {})
                trials.append(TrialResult(
                    id=p.get("identificationModule", {}).get("nctId", ""),
                    title=p.get("identificationModule", {}).get("briefTitle", ""),
                    status=p.get("statusModule", {}).get("overallStatus", ""),
                    phase=", ".join(p.get("designModule", {}).get("phases", [])),
                    condition=", ".join(p.get("conditionsModule", {}).get("conditions", [])),
                    intervention=str(p.get("armsInterventionsModule", {}).get("interventions", [])),
                    summary=p.get("descriptionModule", {}).get("briefSummary", ""),
                    sponsor=p.get("sponsorCollaboratorsModule", {}).get("leadSponsor", {}).get("name", ""),
                    source="ClinicalTrials.gov"
                ))
            logger.info(f"CT.gov returned {len(trials)} trials for '{search_query}'")
            return trials
    except Exception as e:
        logger.warning(f"CT.gov fetch failed: {e}")
        return []


# ──────────────────────────────────────────────
#  PubMed  (NCBI E-utilities)
# ──────────────────────────────────────────────

async def fetch_pubmed(herb: str, drug: str, compounds: str) -> List[PaperResult]:
    """
    Two-step ESearch → ESummary flow.
    Uses simple terms WITHOUT field tags for broader matching.
    """
    try:
        settings = get_settings()
        api_key = settings.NCBI_API_KEY
        base_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"

        # Build a broad query — no [Title/Abstract] tags for better recall
        search_parts = [herb] if herb else []
        if compounds:
            for c in compounds.split(",")[:2]:
                c = c.strip()
                if c and c.lower() != herb.lower():
                    search_parts.append(c)

        herb_clause = " OR ".join(search_parts) if search_parts else ""
        if drug and herb_clause:
            query = f"({herb_clause}) AND {drug}"
        elif drug:
            query = drug
        else:
            query = herb_clause

        params = {"db": "pubmed", "term": query, "retmax": 10, "retmode": "json"}
        if api_key:
            params["api_key"] = api_key

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{base_url}/esearch.fcgi", params=params)
            if resp.status_code != 200:
                return []
            idlist = resp.json().get("esearchresult", {}).get("idlist", [])
            if not idlist:
                logger.info(f"PubMed: 0 results for '{query}'")
                return []

            sum_params = {"db": "pubmed", "id": ",".join(idlist), "retmode": "json"}
            if api_key:
                sum_params["api_key"] = api_key
            sum_resp = await client.get(f"{base_url}/esummary.fcgi", params=sum_params)
            if sum_resp.status_code != 200:
                return []

            res = sum_resp.json().get("result", {})
            papers = []
            for pid in idlist:
                pdata = res.get(pid, {})
                if not pdata:
                    continue
                authors_list = pdata.get("authors", [])
                author_str = ", ".join([a.get("name", "") for a in authors_list[:3]])
                if len(authors_list) > 3:
                    author_str += " et al."
                papers.append(PaperResult(
                    id=f"PMID:{pid}",
                    title=pdata.get("title", ""),
                    authors=author_str,
                    journal=pdata.get("fulljournalname", ""),
                    year=pdata.get("pubdate", "")[:4],
                    abstract="",
                    citations=0,
                    source="PubMed"
                ))
            logger.info(f"PubMed returned {len(papers)} papers for '{query}'")
            return papers
    except Exception as e:
        logger.warning(f"PubMed fetch failed: {e}")
        return []


# ──────────────────────────────────────────────
#  CTRI India  (HTML scrape)
# ──────────────────────────────────────────────

async def fetch_ctri(herb: str, drug: str) -> List[TrialResult]:
    try:
        url = "https://ctri.nic.in/Clinicaltrials/advancesearchmain.php"
        term = f"{herb} {drug}".strip()
        params = {
            "EncHid": "", "comp": "", "serasn": "", "SelectedPhase": "0",
            "searchtyp": "2", "nin": "", "ti": term, "rec": "F"
        }
        headers = {
            "User-Agent": "Mozilla/5.0 (compatible; AushnexaResearch/1.0)",
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://ctri.nic.in/"
        }

        await asyncio.sleep(1)  # be polite to NIC servers

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, params=params, headers=headers)
            if resp.status_code != 200:
                return []

            soup = BeautifulSoup(resp.text, 'lxml')
            trials = []

            # Find the largest table (most likely the results table)
            all_tables = soup.find_all('table')
            results_table = None
            max_rows = 0
            for tbl in all_tables:
                rows = tbl.find_all('tr')
                if len(rows) > max_rows:
                    max_rows = len(rows)
                    results_table = tbl

            if not results_table or max_rows < 2:
                logger.info(f"CTRI: No results table found for '{term}'")
                return []

            rows = results_table.find_all('tr')[1:]  # skip header
            for row in rows[:10]:
                cols = row.find_all('td')
                if len(cols) > 3:
                    trials.append(TrialResult(
                        id=cols[0].text.strip(),
                        title=cols[1].text.strip() if len(cols) > 1 else "",
                        status=cols[4].text.strip() if len(cols) > 4 else "",
                        phase=cols[3].text.strip() if len(cols) > 3 else "",
                        condition=cols[5].text.strip() if len(cols) > 5 else "",
                        intervention="",
                        summary="",
                        sponsor="",
                        source="CTRI India"
                    ))
            logger.info(f"CTRI returned {len(trials)} trials for '{term}'")
            return trials
    except Exception as e:
        logger.warning(f"CTRI fetch failed: {e}")
    return []

# ──────────────────────────────────────────────
#  OpenAlex (Graph API)
# ──────────────────────────────────────────────

def reconstruct_abstract(inverted_index: dict) -> str:
    if not inverted_index:
        return ""
    word_positions = []
    for word, positions in inverted_index.items():
        for pos in positions:
            word_positions.append((pos, word))
    word_positions.sort(key=lambda x: x[0])
    return " ".join(word for _, word in word_positions)

async def fetch_openalex(herb: str, drug: str) -> List[PaperResult]:
    try:
        search_term = f"{herb} {drug} interaction"
        settings = get_settings()
        
        params = {
            "search": search_term,
            "filter": "type:article",
            "sort": "cited_by_count:desc",
            "per-page": 10,
            "select": "id,title,abstract_inverted_index,authorships,publication_year,cited_by_count,open_access,primary_location,doi",
        }
        
        # OpenAlex prefers mailto for polite pool
        mailto = getattr(settings, "CONTACT_EMAIL", "contact@aushnexa.com")
        if mailto:
            params["mailto"] = mailto
            
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get("https://api.openalex.org/works", params=params)
            if resp.status_code != 200:
                return []
            
            results = resp.json().get("results", [])
            papers = []
            
            for work in results:
                authors_list = work.get("authorships", [])
                authors = ", ".join([a.get("author", {}).get("display_name", "") for a in authors_list[:3]])
                if len(authors_list) > 3:
                    authors += " et al."
                
                primary = work.get("primary_location", {}) or {}
                source = primary.get("source", {}) or {}
                journal = source.get("display_name", "")
                
                doi = work.get("doi", "")
                url = f"https://doi.org/{doi}" if doi else ""
                if not url:
                    url = work.get("id", "")
                
                inverted = work.get("abstract_inverted_index", {})
                abstract = reconstruct_abstract(inverted)
                
                is_oa = work.get("open_access", {}).get("is_oa", False)
                oa_url = work.get("open_access", {}).get("oa_url", "")
                if is_oa and oa_url:
                    url = oa_url
                
                pr = PaperResult(
                    id=work.get("id", ""),
                    title=work.get("title", ""),
                    authors=authors,
                    journal=journal,
                    year=str(work.get("publication_year", "")),
                    abstract=abstract[:300] + ("..." if len(abstract) > 300 else ""),
                    citations=work.get("cited_by_count", 0),
                    source="OpenAlex"
                )
                pr.url = url
                pr.doi = doi
                pr.is_oa = is_oa
                papers.append(pr)
            
            logger.info(f"OpenAlex returned {len(papers)} papers for '{search_term}'")
            return papers
    except Exception as e:
        logger.warning(f"OpenAlex fetch failed: {e}")
        return []

# ──────────────────────────────────────────────
#  WHO ICTRP (Portal Scrape)
# ──────────────────────────────────────────────

def determine_registry_from_id(trial_id: str) -> str:
    prefixes = {
        "NCT": "ClinicalTrials.gov",
        "CTRI": "India",
        "ISRCTN": "UK",
        "ACTRN": "Australia/NZ",
        "IRCT": "Iran",
        "ChiCTR": "China",
        "DRKS": "Germany",
        "NTR": "Netherlands",
        "JPRN": "Japan",
        "PACTR": "Africa",
        "SLCTR": "Sri Lanka",
        "TCTR": "Thailand",
        "LBCTR": "Lebanon"
    }
    for prefix, registry in prefixes.items():
        if trial_id.upper().startswith(prefix):
            return registry
    return "Unknown Registry"

async def fetch_who_ictrp(herb: str, drug: str) -> List[TrialResult]:
    try:
        search_term = f"{herb} {drug}"
        url = "https://trialsearch.who.int/Trial2.aspx"
        
        params = {
            "SearchTerms": search_term,
            "Register": "All",
            "Recruitment": "All",
            "Gender": "All",
            "Phase": "All",
            "action": "Search"
        }
        
        headers = {
            "User-Agent": "Mozilla/5.0 (compatible; AushnexaResearch/1.0; +https://aushnexa.com; contact@aushnexa.com)",
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "en-US,en;q=0.9"
        }
        
        await asyncio.sleep(2)
        
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(url, params=params, headers=headers)
            if resp.status_code != 200:
                logger.warning(f"WHO ICTRP returned {resp.status_code}")
                return []
            
            soup = BeautifulSoup(resp.text, "lxml")
            trials = []
            
            result_rows = soup.find_all("tr", class_=lambda c: c and "trial" in c.lower())
            
            if not result_rows:
                tables = soup.find_all("table")
                result_table = max(tables, key=lambda t: len(t.find_all("tr")), default=None)
                if result_table:
                    result_rows = result_table.find_all("tr")[1:]
            
            for row in result_rows[:10]:
                cols = row.find_all("td")
                if len(cols) < 3:
                    continue
                    
                trial_id_cell = cols[0]
                trial_link = trial_id_cell.find("a")
                trial_id = trial_link.text.strip() if trial_link else cols[0].text.strip()
                trial_url = ""
                if trial_link and trial_link.get("href"):
                    href = trial_link["href"]
                    if href.startswith("http"):
                        trial_url = href
                    else:
                        trial_url = f"https://trialsearch.who.int/{href}"
                
                title = cols[1].text.strip() if len(cols) > 1 else ""
                condition = cols[2].text.strip() if len(cols) > 2 else ""
                intervention = cols[3].text.strip() if len(cols) > 3 else ""
                status = cols[4].text.strip() if len(cols) > 4 else ""
                phase = cols[5].text.strip() if len(cols) > 5 else ""
                sponsor = cols[6].text.strip() if len(cols) > 6 else ""
                
                source = determine_registry_from_id(trial_id)
                
                tr = TrialResult(
                    id=trial_id,
                    title=title,
                    status=status,
                    phase=phase,
                    condition=condition,
                    intervention=intervention,
                    summary="",
                    sponsor=sponsor,
                    source=f"WHO ICTRP ({source})"
                )
                tr.url = trial_url
                trials.append(tr)
            
            logger.info(f"WHO ICTRP returned {len(trials)} trials for '{search_term}'")
            return trials
            
    except Exception as e:
        logger.warning(f"WHO ICTRP fetch failed: {e}")
        return []

# ──────────────────────────────────────────────
#  Semantic Scholar  (Graph API v1)
# ──────────────────────────────────────────────

async def fetch_semantic_scholar(herb: str, drug: str) -> List[PaperResult]:
    try:
        url = "https://api.semanticscholar.org/graph/v1/paper/search"
        term = f"{herb} {drug} interaction".strip()
        params = {
            "query": term,
            "fields": "title,abstract,authors,year,citationCount,journal,openAccessPdf",
            "limit": 10,
            # NOTE: sort param not supported by this API — we sort ourselves
        }
        headers = {"User-Agent": "Aushnexa/1.0"}
        
        settings = get_settings()
        if settings.SEMANTIC_SCHOLAR_API_KEY:
            headers["x-api-key"] = settings.SEMANTIC_SCHOLAR_API_KEY

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params=params, headers=headers)
            if resp.status_code != 200:
                logger.warning(f"Semantic Scholar returned {resp.status_code}")
                return []
            data = resp.json().get("data", [])

            papers = []
            for p in data:
                authors = ", ".join([a.get("name", "") for a in p.get("authors", [])][:3])
                papers.append(PaperResult(
                    id=p.get("paperId", ""),
                    title=p.get("title", ""),
                    authors=authors,
                    journal=p.get("journal", {}).get("name", "") if p.get("journal") else "",
                    year=str(p.get("year", "")),
                    abstract=p.get("abstract", "") or "",
                    citations=p.get("citationCount", 0) or 0,
                    source="Semantic Scholar"
                ))
            # Sort by citations descending (API does not support sort)
            papers.sort(key=lambda x: x.citation_count, reverse=True)
            logger.info(f"Semantic Scholar returned {len(papers)} papers for '{term}'")
            return papers
    except Exception as e:
        logger.warning(f"Semantic Scholar fetch failed: {e}")
        return []


# ──────────────────────────────────────────────
#  Deduplication & Scoring
# ──────────────────────────────────────────────

def deduplicate_trials(trials: List[TrialResult]) -> List[TrialResult]:
    seen_ids = set()
    seen_titles = set()
    deduped = []
    
    # Process ClinicalTrials.gov results first so they take priority
    ct_trials = [t for t in trials if t.source_registry == "ClinicalTrials.gov"]
    other_trials = [t for t in trials if t.source_registry != "ClinicalTrials.gov"]
    
    for t in ct_trials + other_trials:
        tid = t.id.upper().strip() if t.id else ""
        if tid and tid in seen_ids:
            continue
        title_key = t.title[:40].lower().strip() if t.title else ""
        if title_key and title_key in seen_titles:
            continue
        
        if tid:
            seen_ids.add(tid)
        if title_key:
            seen_titles.add(title_key)
        deduped.append(t)
    return deduped

def deduplicate_papers(papers: List[PaperResult]) -> List[PaperResult]:
    seen_dois = set()
    seen_ids = set()
    seen_titles = set()
    deduped = []
    for p in papers:
        doi = p.doi.lower().strip() if getattr(p, "doi", "") else ""
        pid = p.id.lower().strip() if p.id else ""
        title_hash = p.title.lower().replace(" ", "").strip() if p.title else ""
        
        if doi and doi in seen_dois:
            continue
        if pid and pid in seen_ids:
            continue
        if title_hash and title_hash in seen_titles:
            continue
            
        if doi:
            seen_dois.add(doi)
        if pid:
            seen_ids.add(pid)
        if title_hash:
            seen_titles.add(title_hash)
            
        deduped.append(p)
    return deduped

def score_relevance(item: Any, herb: str, drug: str) -> int:
    score = 0
    title = item.title.lower() if item.title else ""
    if herb.lower() in title: score += 1
    if drug.lower() in title: score += 1
    if "interaction" in title or "combination" in title: score += 1
    if isinstance(item, TrialResult):
        if "RECRUITING" in str(item.status).upper(): score += 1
        if "PHASE 3" in str(item.phase).upper() or "PHASE 4" in str(item.phase).upper(): score += 1
    if isinstance(item, PaperResult):
        if item.citation_count > 50: score += 1
    return score


# ──────────────────────────────────────────────
#  Main aggregator
# ──────────────────────────────────────────────

async def aggregate_evidence(herb: str, drug: str, compounds: str, sources: List[str]) -> Dict[str, Any]:
    tasks = []

    if "clinicaltrials" in sources or not sources:
        tasks.append(fetch_clinicaltrials(herb, drug, compounds))
    else:
        tasks.append(asyncio.sleep(0, result=[]))

    if "pubmed" in sources or not sources:
        tasks.append(fetch_pubmed(herb, drug, compounds))
    else:
        tasks.append(asyncio.sleep(0, result=[]))

    if "ctri" in sources or not sources:
        tasks.append(fetch_ctri(herb, drug))
    else:
        tasks.append(asyncio.sleep(0, result=[]))

    if "semantic" in sources or not sources:
        tasks.append(fetch_semantic_scholar(herb, drug))
    else:
        tasks.append(asyncio.sleep(0, result=[]))

    if "openalex" in sources or not sources:
        tasks.append(fetch_openalex(herb, drug))
    else:
        tasks.append(asyncio.sleep(0, result=[]))

    if "ictrp" in sources or not sources:
        tasks.append(fetch_who_ictrp(herb, drug))
    else:
        tasks.append(asyncio.sleep(0, result=[]))

    results = await asyncio.gather(*tasks, return_exceptions=True)

    raw_trials = []
    raw_papers = []

    def process_res(r):
        if isinstance(r, Exception):
            logger.warning(f"Source returned exception: {r}")
            return
        for item in r:
            if isinstance(item, TrialResult): raw_trials.append(item)
            elif isinstance(item, PaperResult): raw_papers.append(item)

    for r in results:
        process_res(r)

    dedup_trials = deduplicate_trials(raw_trials)
    dedup_papers = deduplicate_papers(raw_papers)

    for t in dedup_trials: t.relevance_score = score_relevance(t, herb, drug)
    for p in dedup_papers: p.relevance_score = score_relevance(p, herb, drug)

    dedup_trials.sort(key=lambda x: x.relevance_score, reverse=True)
    dedup_papers.sort(key=lambda x: x.relevance_score, reverse=True)

    return {
        "trials": [vars(t) for t in dedup_trials],
        "papers": [vars(p) for p in dedup_papers],
        "total_trials": len(dedup_trials),
        "total_papers": len(dedup_papers),
        "herb": herb,
        "drug": drug
    }
