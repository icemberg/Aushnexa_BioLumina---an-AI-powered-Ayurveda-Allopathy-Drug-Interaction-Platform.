"""
Normalization Service

Resolves user-entered medication/herb names to canonical forms using:
1. Exact match against synonym dictionary
2. Fuzzy matching via rapidfuzz
"""

import json
from rapidfuzz import fuzz, process
from loguru import logger
from pathlib import Path

from app.config import get_settings
from app.schemas.interaction import NormalizedItem
from app.core.exceptions import EntityNormalizationError


class NormalizationService:
    """
    Resolves user-entered medication/herb names to canonical forms.
    """
    def __init__(self):
        settings = get_settings()
        self.synonym_map = {}
        self.all_names = []
        
        try:
            # Assumes project root is current working directory
            synonyms_path = Path(settings.synonyms_file_path)
            if synonyms_path.exists():
                with open(synonyms_path, "r", encoding="utf-8-sig") as f:
                    self.synonym_map = json.load(f)
                self.all_names = list(self.synonym_map.keys())
                logger.info(f"Loaded {len(self.all_names)} synonyms.")
            else:
                logger.warning(f"Synonyms file not found at {synonyms_path}. Normalization may fail.")
        except Exception as e:
            logger.error(f"Failed to load synonyms: {e}")

    async def normalize(self, entity_name: str) -> NormalizedItem:
        """
        Normalize an entity name to its canonical form using Levenshtein distance.
        Must throw EntityNormalizationError if an item cannot be matched with confidence >= 0.8.
        """
        original = entity_name.strip()
        lower_name = original.lower()

        if not self.all_names:
            raise EntityNormalizationError(f"Cannot normalize '{original}' (synonym dictionary empty).")

        # 1. Exact match
        if lower_name in self.synonym_map:
            match_data = self.synonym_map[lower_name]
            return NormalizedItem(
                original=original,
                canonical=match_data["canonical"],
                confidence=1.0,
                entity_type=match_data["type"]
            )

        # 2. Fuzzy matching
        matches = process.extract(
            lower_name,
            self.all_names,
            scorer=fuzz.WRatio,
            limit=1
        )

        if matches and matches[0][1] >= 80:
            best_match = matches[0][0]
            confidence = matches[0][1] / 100.0
            match_data = self.synonym_map[best_match]
            return NormalizedItem(
                original=original,
                canonical=match_data["canonical"],
                confidence=confidence,
                entity_type=match_data["type"]
            )

        # Fail if no match >= 0.8
        logger.warning(f"Normalization failed for '{original}'. Best match was {matches[0] if matches else 'None'}")
        raise EntityNormalizationError(f"Could not securely normalize item '{original}' to a known medical entity.")
