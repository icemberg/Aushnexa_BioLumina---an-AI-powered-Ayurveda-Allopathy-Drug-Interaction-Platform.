from fastapi import APIRouter, Query, HTTPException, Depends
import json
import unicodedata
from loguru import logger
import hashlib

from app.cache.redis import get_redis
from app.graph.connection import get_session
from app.graph.queries import get_herb_profile
from app.services.evidence_aggregator import aggregate_evidence
from app.services.explanation_service import ExplanationService
from neo4j import AsyncSession

router = APIRouter()


def strip_accents(s: str) -> str:
    """Remove diacritical marks (accents) from a string."""
    nfkd = unicodedata.normalize("NFKD", s)
    return "".join(c for c in nfkd if not unicodedata.combining(c))


async def resolve_search_names(herb: str, drug: str, session: AsyncSession):
    """
    Resolve user-facing names (possibly Spanish/localized) to English
    botanical names suitable for PubMed/ClinicalTrials.gov search.

    Returns (resolved_herb, resolved_drug, compounds_csv).
    """
    resolved_herb = herb
    resolved_drug = drug
    compounds = ""

    # ── Spanish drug class → English translation table ──
    # The tapirro dataset stores drug classes in Spanish
    DRUG_CLASS_ES_EN = {
        "paracetamol": "acetaminophen",
        "omeprazol": "omeprazole",
        "antihistaminicos": "antihistamines",
        "vasodilatadores": "vasodilators",
        "macrolidos": "macrolides",
        "relajantes_musculares": "muscle relaxants",
        "corticosteroides": "corticosteroids",
        "antidiabeticos_sglt2": "SGLT2 inhibitors",
        "glp1": "GLP-1 receptor agonists",
        "isrsn": "SNRIs",
        "alfa_bloqueantes": "alpha blockers",
        "antidiabeticos": "antidiabetics",
        "imao": "MAOIs",
        "antiarritmicos": "antiarrhythmics",
        "antileucotrienos": "antileukotrienes",
        "metotrexato_rx": "methotrexate",
        "gabapentinoides": "gabapentinoids",
        "anticoagulantes": "anticoagulants",
        "aines": "NSAIDs",
        "antimigrañosos": "antimigraine",
        "antimigranosos": "antimigraine",
        "antirretrovirales": "antiretrovirals",
        "antipsicoticos": "antipsychotics",
        "anestesicos": "anesthetics",
        "digoxina": "digoxin",
        "estatinas": "statins",
        "anticonvulsivantes": "anticonvulsants",
        "anticonvulsivos": "anticonvulsants",
        "anticolinergicos": "anticholinergics",
        "litio": "lithium",
        "antiparasitarios": "antiparasitics",
        "antihipertensivos": "antihypertensives",
        "laxantes": "laxatives",
        "antiemeticos": "antiemetics",
        "isrs": "SSRIs",
        "hipnoticos": "hypnotics",
        "opioides": "opioids",
        "antigotosos": "anti-gout",
        "benzodiacepinas": "benzodiazepines",
        "bifosfonatos": "bisphosphonates",
        "teofilina": "theophylline",
        "anticonceptivos": "contraceptives",
        "quimioterapia": "chemotherapy",
        "antifungicos": "antifungals",
        "antibioticos": "antibiotics",
        "diureticos": "diuretics",
        "antiacidos_h2": "H2 antagonists",
        "triciclicos": "tricyclic antidepressants",
        "antiplaquetarios": "antiplatelets",
        "melatonina_rx": "melatonin",
        "broncodilatadores": "bronchodilators",
        "antitusivos": "antitussives",
        "inmunosupresores": "immunosuppressants",
        "tiroideos": "thyroid hormones",
        "betabloqueantes": "beta blockers",
        "antiinflamatorios": "anti-inflammatory",
        "antidepresivos": "antidepressants",
        "antivirales": "antivirals",
        "inhibidores de la bomba de protones": "proton pump inhibitors",
        "ibuprofeno": "ibuprofen",
        "metformina": "metformin",
        "warfarina": "warfarin",
        "aspirina": "aspirin",
        "atorvastatina": "atorvastatin",
        "lisinopril": "lisinopril",
        "simvastatina": "simvastatin",
        "levotiroxina": "levothyroxine",
        "amoxicilina": "amoxicillin",
        "metoprolol": "metoprolol",
        "losartan": "losartan",
        "amlodipino": "amlodipine",
        "ciclosporina": "cyclosporine",
        "fenitoina": "phenytoin",
        "carbamazepina": "carbamazepine",
        "tacrolimus": "tacrolimus",
    }

    if herb:
        # Clean slash-separated names first
        clean_herb = herb.split("/")[0].strip()

        # Look up in Neo4j to get scientific_name and aliases
        profile = await get_herb_profile(session, clean_herb)
        if profile:
            sci_name = profile.get("scientific_name") or ""
            aliases = profile.get("aliases") or []

            # Prefer scientific name for API searches (always English/Latin)
            if sci_name:
                resolved_herb = sci_name

                # Also include English common names from aliases
                english_aliases = [
                    a for a in aliases
                    if a.isascii() and len(a) > 2
                ]
                if english_aliases:
                    compounds = ",".join(english_aliases[:3])

            logger.info(
                f"Resolved herb '{herb}' → '{resolved_herb}' "
                f"(compounds: {compounds or 'none'})"
            )

    # For drug: strip accents, then translate from Spanish if needed
    if drug:
        ascii_drug = strip_accents(drug).lower().strip()
        resolved_drug = DRUG_CLASS_ES_EN.get(ascii_drug, strip_accents(drug))
        if resolved_drug != drug:
            logger.info(f"Resolved drug '{drug}' → '{resolved_drug}'")

    return resolved_herb, resolved_drug, compounds


@router.get("/search")
async def search_evidence(
    herb: str = Query("", description="Herb canonical name"),
    drug: str = Query("", description="Drug canonical name"),
    compounds: str = Query("", description="Comma separated compounds"),
    sources: str = Query("", description="Comma separated sources to query"),
    limit_per_source: int = Query(10, description="Limit per source"),
    session: AsyncSession = Depends(get_session)
):
    """
    Search across multiple evidence sources (trials and papers).
    Automatically resolves localized herb/drug names to English botanical
    names before querying external APIs.
    """
    if not herb and not drug:
        raise HTTPException(status_code=400, detail="Must provide at least herb or drug")

    source_list = [s.strip().lower() for s in sources.split(",")] if sources else []

    # ── Resolve names to English/botanical for API search ──
    search_herb, search_drug, resolved_compounds = await resolve_search_names(
        herb, drug, session
    )
    # Merge any user-provided compounds with resolved ones
    if compounds and resolved_compounds:
        resolved_compounds = f"{compounds},{resolved_compounds}"
    elif compounds:
        resolved_compounds = compounds

    # Generate stable cache key based on RESOLVED params
    cache_str = (
        f"herb={search_herb}&drug={search_drug}"
        f"&compounds={resolved_compounds}&sources={','.join(sorted(source_list))}"
    )
    cache_hash = hashlib.sha256(cache_str.encode()).hexdigest()[:16]
    cache_key = f"evidence:{cache_hash}"

    redis = await get_redis()
    if redis:
        try:
            cached = await redis.get(cache_key)
            if cached:
                logger.info(f"Evidence retrieved from cache for {search_herb} + {search_drug}")
                return json.loads(cached)
        except Exception as e:
            logger.warning(f"Redis get failed: {e}")

    try:
        data = await aggregate_evidence(search_herb, search_drug, resolved_compounds, source_list)
        
        # Generate AI Summary of the evidence
        explainer = ExplanationService()
        data["ai_summary"] = await explainer.summarize_evidence(search_herb, search_drug, data)

        # Cache for 6 hours
        if redis:
            try:
                await redis.setex(cache_key, 21600, json.dumps(data))
            except Exception as e:
                logger.warning(f"Redis set failed: {e}")

        return data
    except Exception as e:
        logger.error(f"Evidence aggregation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch evidence")
