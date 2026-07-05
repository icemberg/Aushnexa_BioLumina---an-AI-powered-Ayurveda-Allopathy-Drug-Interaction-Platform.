import json
import os
from rapidfuzz import process, fuzz
from loguru import logger

PRIORITY_PAIRS = [
  # (botanical_name, common_name, drug_name, drug_aliases)
  ("Withania somnifera", "Ashwagandha", "Metformin", ["Glucophage", "Glycomet"]),
  ("Withania somnifera", "Ashwagandha", "Levothyroxine", ["Synthroid", "Eltroxin"]),
  ("Withania somnifera", "Ashwagandha", "Tacrolimus", ["Prograf", "Advagraf"]),
  ("Curcuma longa", "Turmeric", "Warfarin", ["Coumadin", "Warf"]),
  ("Curcuma longa", "Turmeric", "Aspirin", ["Ecosprin", "Disprin"]),
  ("Curcuma longa", "Turmeric", "Omeprazole", ["Omez", "Prilosec"]),
  ("Tinospora cordifolia", "Giloy", "Metformin", ["Glucophage", "Glycomet"]),
  ("Tinospora cordifolia", "Giloy", "Insulin", ["Regular insulin", "Humulin"]),
  ("Zingiber officinale", "Ginger", "Warfarin", ["Coumadin", "Warf"]),
  ("Allium sativum", "Garlic", "Warfarin", ["Coumadin"]),
  ("Allium sativum", "Garlic", "Aspirin", ["Ecosprin"]),
  ("Ocimum tenuiflorum", "Tulsi", "Warfarin", ["Coumadin"]),
  ("Bacopa monnieri", "Brahmi", "Diazepam", ["Valium", "Calmpose"]),
  ("Bacopa monnieri", "Brahmi", "Donepezil", ["Aricept"]),
  ("Azadirachta indica", "Neem", "Glibenclamide", ["Daonil", "Euglucon"]),
  ("Glycyrrhiza glabra", "Licorice", "Digoxin", ["Lanoxin"]),
  ("Terminalia arjuna", "Arjuna", "Digoxin", ["Lanoxin"]),
  ("Momordica charantia", "Bitter Melon", "Insulin", ["Regular insulin"]),
  ("Trigonella foenum-graecum", "Fenugreek", "Metformin", ["Glucophage"]),
  ("Boswellia serrata", "Boswellia", "Ibuprofen", ["Brufen", "Advil"]),
  ("Commiphora mukul", "Guggul", "Propranolol", ["Inderal"]),
  ("Commiphora mukul", "Guggul", "Diltiazem", ["Dilzem", "Cardizem"]),
  ("Asparagus racemosus", "Shatavari", "Estradiol", ["Estrogen", "Progynova"]),
  ("Triphala", "Triphala", "Methotrexate", ["MTX", "Folitrax"]),
  ("Piper nigrum", "Black Pepper", "Phenytoin", ["Dilantin", "Eptoin"]),
]

TRUSTED_DOMAINS = [
  "pubmed.ncbi.nlm.nih.gov",
  "pmc.ncbi.nlm.nih.gov",
  "nccih.nih.gov",
  "mskcc.org",           # Memorial Sloan Kettering herb database
  "naturalstandard.com",
  "examine.com",
  "drugs.com",
  "medlineplus.gov",
  "who.int",
  "ayush.gov.in",
  "ccras.nic.in",
]


class NameNormalizer:
  def __init__(self,
    synonyms_path="../../backend/data_pipeline/seed_data/synonyms.json"):
    # Since we run from data_pipeline/protocols/
    synonyms_path = os.path.join(os.path.dirname(__file__), "../../../backend/data_pipeline/seed_data/synonyms.json")
    try:
      with open(synonyms_path) as f:
        self.synonyms = json.load(f)
    except Exception as e:
      logger.warning(f"Failed to load synonyms.json: {e}")
      self.synonyms = {}
      
    # Build reverse lookup: alias → canonical
    self.alias_map = {}
    for canonical, entry in self.synonyms.items():
      self.alias_map[canonical.lower()] = entry["canonical"]
      for alias in entry.get("aliases", []):
        self.alias_map[alias.lower()] = entry["canonical"]
    self.all_aliases = list(self.alias_map.keys())

  def normalize(self, name: str) -> str:
    key = name.lower().strip()
    # Exact match first
    if key in self.alias_map:
      return self.alias_map[key]
    # Fuzzy match
    if self.all_aliases:
      match = process.extractOne(
        key, self.all_aliases, scorer=fuzz.token_sort_ratio
      )
      if match and match[1] >= 80:
        return self.alias_map[match[0]]
    # Return original if no match
    return name

  def build_search_terms(self, botanical: str,
                          common: str, drug: str) -> dict:
    """Returns all name variants to use in search queries."""
    return {
      "herb_names": list(set([botanical, common])),
      "drug_names": list(set(
        [drug] + [
          alias for key, alias in self.alias_map.items()
          if drug.lower() in key or key in drug.lower()
        ][:3]  # max 3 drug aliases
      )),
      "canonical_herb": self.normalize(botanical),
      "canonical_drug": self.normalize(drug)
    }
