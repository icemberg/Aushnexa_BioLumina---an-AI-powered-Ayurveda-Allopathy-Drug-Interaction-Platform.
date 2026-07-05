import json
import os
from collections import defaultdict
from loguru import logger

class ExistingEvidenceCollector:

  def __init__(self,
    evidence_path=(
      "../../data_pipeline/protocols/intermediate/enriched_evidence.json"
    )
  ):
    # Adjust path to relative from this file
    evidence_path = os.path.join(os.path.dirname(__file__), "../intermediate/enriched_evidence.json")
    try:
      with open(evidence_path) as f:
        self.evidence = json.load(f)
      logger.info(
        f"Loaded {len(self.evidence)} existing evidence items"
      )
    except FileNotFoundError:
      logger.warning(
        f"No enriched_evidence.json found at {evidence_path}. "
        "Will continue without PDF evidence."
      )
      self.evidence = []

    # Group by herb-condition pair for fast lookup
    self.by_herb_drug = defaultdict(list)
    for item in self.evidence:
      for herb in item.get("herbs_mentioned", []):
        for drug in item.get("drugs_mentioned", []):
          key = f"{herb.lower()}::{drug.lower()}"
          self.by_herb_drug[key].append(item)
        # Also index herb-only (for condition-based matching)
        herb_key = f"{herb.lower()}::*"
        self.by_herb_drug[herb_key].append(item)

  def get_for_pair(self, herb: str, drug: str) -> list[dict]:
    """Returns existing evidence items for herb+drug pair."""
    key = f"{herb.lower()}::{drug.lower()}"
    direct = self.by_herb_drug.get(key, [])

    # Also try herb-only evidence (for protocols where no drug
    # was mentioned but the document IS about a drug context)
    herb_key = f"{herb.lower()}::*"
    herb_only = self.by_herb_drug.get(herb_key, [])

    return direct + herb_only[:5]  # cap herb-only at 5

  def get_supporting_count(self, herb: str,
                            drug: str) -> int:
    return len(self.get_for_pair(herb, drug))
