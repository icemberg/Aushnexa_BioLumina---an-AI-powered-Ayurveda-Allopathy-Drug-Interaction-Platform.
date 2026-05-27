from fastapi import APIRouter, HTTPException, Depends
import unicodedata
from loguru import logger
from app.graph.connection import get_session
from app.graph.queries import get_herb_profile
from neo4j import AsyncSession


def strip_accents(s: str) -> str:
    """Remove diacritical marks (accents) from a string."""
    nfkd = unicodedata.normalize("NFKD", s)
    return "".join(c for c in nfkd if not unicodedata.combining(c))

router = APIRouter()

# ──────────────────────────────────────────────
#  Fallback compound data for common herbs
#  Used when Neo4j has no CONTAINS relationships
# ──────────────────────────────────────────────
HERB_COMPOUNDS_FALLBACK = {
    "tulsi": ["Ursolic acid", "Eugenol", "Rosmarinic acid", "Apigenin", "Linalool"],
    "ocimum tenuiflorum": ["Ursolic acid", "Eugenol", "Rosmarinic acid", "Apigenin"],
    "ocimum sanctum": ["Ursolic acid", "Eugenol", "Rosmarinic acid"],
    "ashwagandha": ["Withanolide A", "Withaferin A", "Anaferine", "Sitoindoside"],
    "withania somnifera": ["Withanolide A", "Withaferin A", "Anaferine"],
    "curcuma": ["Curcumin", "Bisdemethoxycurcumin", "Turmerone", "Ar-turmerone"],
    "curcuma longa": ["Curcumin", "Bisdemethoxycurcumin", "Turmerone"],
    "ginkgo": ["Ginkgolide A", "Ginkgolide B", "Bilobalide", "Quercetin"],
    "ginkgo biloba": ["Ginkgolide A", "Ginkgolide B", "Bilobalide"],
    "hierba de san juan": ["Hypericin", "Hyperforin", "Pseudohypericin"],
    "st. john's wort": ["Hypericin", "Hyperforin", "Pseudohypericin"],
    "hypericum perforatum": ["Hypericin", "Hyperforin", "Pseudohypericin"],
    "ginseng": ["Ginsenoside Rb1", "Ginsenoside Rg1", "Ginsenoside Re"],
    "panax ginseng": ["Ginsenoside Rb1", "Ginsenoside Rg1", "Ginsenoside Re"],
    "neem": ["Azadirachtin", "Nimbin", "Nimbidin", "Gedunin"],
    "azadirachta indica": ["Azadirachtin", "Nimbin", "Nimbidin"],
    "aloe vera": ["Aloin", "Barbaloin", "Acemannan", "Emodin"],
    "garlic": ["Allicin", "Ajoene", "Alliin", "S-allyl cysteine"],
    "allium sativum": ["Allicin", "Ajoene", "Alliin"],
    "valeriana": ["Valerenic acid", "Isovaleric acid", "Valtrate"],
    "echinacea": ["Cichoric acid", "Echinacoside", "Alkamides"],
    "ginger": ["Gingerol", "Shogaol", "Zingerone", "Paradol"],
    "zingiber officinale": ["Gingerol", "Shogaol", "Zingerone"],
    "brahmi": ["Bacosides A", "Bacosides B", "Bacopasaponins"],
    "bacopa monnieri": ["Bacosides A", "Bacosides B", "Bacopasaponins"],
    "shatavari": ["Shatavarin I-IV", "Racemosol", "Asparagamine"],
    "asparagus racemosus": ["Shatavarin I-IV", "Racemosol"],
    "triphala": ["Gallic acid", "Chebulagic acid", "Ellagic acid"],
    "amla": ["Vitamin C", "Gallic acid", "Ellagic acid", "Emblicanin"],
    "guduchi": ["Berberine", "Tinosporin", "Giloin", "Tinocordiside"],
    "tinospora cordifolia": ["Berberine", "Tinosporin", "Giloin"],
}

HERB_AYURVEDA_FALLBACK = {
    "tulsi": {"rasa": "Katu (Pungent), Tikta (Bitter)", "guna": "Laghu (Light), Ruksha (Dry)", "virya": "Ushna (Hot)", "vipaka": "Katu (Pungent)", "dosha": "Reduces Kapha and Vata"},
    "ashwagandha": {"rasa": "Tikta (Bitter), Kashaya (Astringent)", "guna": "Laghu (Light), Snigdha (Oily)", "virya": "Ushna (Hot)", "vipaka": "Madhura (Sweet)", "dosha": "Reduces Vata and Kapha"},
    "curcuma": {"rasa": "Tikta (Bitter), Katu (Pungent)", "guna": "Ruksha (Dry), Laghu (Light)", "virya": "Ushna (Hot)", "vipaka": "Katu (Pungent)", "dosha": "Balances all three Doshas"},
    "ginkgo": {"rasa": "Kashaya (Astringent)", "guna": "Laghu (Light)", "virya": "Ushna (Hot)", "vipaka": "Katu (Pungent)", "dosha": "Reduces Kapha"},
    "neem": {"rasa": "Tikta (Bitter), Kashaya (Astringent)", "guna": "Laghu (Light)", "virya": "Sheeta (Cool)", "vipaka": "Katu (Pungent)", "dosha": "Reduces Pitta and Kapha"},
    "brahmi": {"rasa": "Tikta (Bitter), Kashaya (Astringent)", "guna": "Laghu (Light)", "virya": "Sheeta (Cool)", "vipaka": "Madhura (Sweet)", "dosha": "Balances all three Doshas"},
    "guduchi": {"rasa": "Tikta (Bitter), Kashaya (Astringent)", "guna": "Laghu (Light), Snigdha (Oily)", "virya": "Ushna (Hot)", "vipaka": "Madhura (Sweet)", "dosha": "Balances all three Doshas"},
}


@router.get("/{botanical_name:path}/profile")
async def get_herb(
    botanical_name: str,
    session: AsyncSession = Depends(get_session)
):
    """
    Retrieve herb profile, Ayurvedic properties, active compounds, and mechanisms.
    Falls back to curated data when Neo4j lacks compound relationships.
    """
    # Clean the name — take only the part before any " / " separator
    clean_name = botanical_name.split(" / ")[0].strip()
    clean_name = clean_name.split("/")[0].strip()  # handle URL-encoded slash too

    try:
        profile = await get_herb_profile(session, clean_name)

        if profile:
            # Enrich with fallback compounds if Neo4j has none
            # Strip accents so "Cúrcuma" matches "curcuma" in the dict
            lookup_key = strip_accents(clean_name).lower()
            sci_name = strip_accents(profile.get("scientific_name") or "").lower()

            compounds = HERB_COMPOUNDS_FALLBACK.get(lookup_key, [])
            if not compounds:
                compounds = HERB_COMPOUNDS_FALLBACK.get(sci_name, [])

            ayurveda = HERB_AYURVEDA_FALLBACK.get(lookup_key, None)
            if not ayurveda:
                ayurveda = HERB_AYURVEDA_FALLBACK.get(sci_name, None)

            profile["compounds"] = compounds
            profile["ayurvedic_properties"] = ayurveda
            return profile

        # If Neo4j has no record, try fallback data alone
        lookup_key = strip_accents(clean_name).lower()
        compounds = HERB_COMPOUNDS_FALLBACK.get(lookup_key, [])
        ayurveda = HERB_AYURVEDA_FALLBACK.get(lookup_key, None)

        if compounds or ayurveda:
            return {
                "name": clean_name,
                "scientific_name": None,
                "aliases": [],
                "description": None,
                "compounds": compounds,
                "ayurvedic_properties": ayurveda,
                "source": "fallback"
            }

        raise HTTPException(status_code=404, detail="Herb not found")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching herb profile: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
