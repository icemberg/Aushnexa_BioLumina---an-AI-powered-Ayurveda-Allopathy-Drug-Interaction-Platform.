"""
Unit tests for the Entity Normalization Service
"""

import pytest
from unittest.mock import patch, AsyncMock
from app.services.normalization_service import NormalizationService

@pytest.fixture
def normalizer():
    return NormalizationService()

@pytest.mark.asyncio
async def test_normalize_exact_match(normalizer):
    """Test exact match in the static synonym dictionary."""
    # We mock the cache_get to return None, forcing a dictionary lookup
    with patch("app.services.normalization_service.cache_get", new_callable=AsyncMock) as mock_cache:
        mock_cache.return_value = None
        
        # Test basic exact match
        result = await normalizer.normalize("Ashwagandha")
        
        assert result["canonical_name"] == "Ashwagandha"
        assert result["entity_type"] == "Herb"
        assert result["confidence"] == 1.0

@pytest.mark.asyncio
async def test_normalize_synonym_match(normalizer):
    """Test exact match of a known synonym to its canonical form."""
    with patch("app.services.normalization_service.cache_get", new_callable=AsyncMock) as mock_cache:
        mock_cache.return_value = None
        
        # "Giloy" synonym for Tinospora cordifolia (Wait, in our dict, Giloy is canonical)
        # Let's test "tinospora cordifolia" which should map to "Giloy"
        result = await normalizer.normalize("tinospora cordifolia")
        
        assert result["canonical_name"] == "Giloy"
        assert result["entity_type"] == "Herb"
        assert result["confidence"] == 1.0
        
        # Test brand name mapping (e.g. Lipitor -> Atorvastatin)
        brand_result = await normalizer.normalize("lipitor")
        assert brand_result["canonical_name"] == "Atorvastatin"
        assert brand_result["entity_type"] == "Drug"

@pytest.mark.asyncio
async def test_normalize_fuzzy_match(normalizer):
    """Test typo correction using rapidfuzz."""
    with patch("app.services.normalization_service.cache_get", new_callable=AsyncMock) as mock_cache:
        mock_cache.return_value = None
        
        # Typo: "Aswaganda" -> "Ashwagandha"
        result = await normalizer.normalize("Aswagandha")
        
        assert result["canonical_name"] == "Ashwagandha"
        # Fuzzy match confidence should be less than 1.0 but quite high
        assert 0.8 <= result["confidence"] < 1.0

@pytest.mark.asyncio
async def test_normalize_unrecognized(normalizer):
    """Test handling of completely unknown entities."""
    with patch("app.services.normalization_service.cache_get", new_callable=AsyncMock) as mock_cache_get:
        with patch("app.services.normalization_service.search_entities", new_callable=AsyncMock) as mock_graph_search:
            mock_cache_get.return_value = None
            mock_graph_search.return_value = []  # Empty graph fallback
            
            result = await normalizer.normalize("XYZSuperDrug2000")
            
            assert result["canonical_name"] == "XYZSuperDrug2000"
            assert result["confidence"] == 0.0
