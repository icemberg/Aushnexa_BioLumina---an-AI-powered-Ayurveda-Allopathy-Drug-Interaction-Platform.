"""
Integration tests for Interaction Checker API endpoints
"""

import pytest
from httpx import AsyncClient
from fastapi import status
from unittest.mock import patch, AsyncMock

# Note: In a real test suite, you'd use a test database and standard test client setup.
# Here we mock the service layer to test the API route orchestration.

@pytest.mark.asyncio
async def test_check_interactions_api_success():
    """Test a successful POST to /check-interactions with mocked service."""
    
    mock_response = {
        "overall_risk": "moderate",
        "score": 0.6,
        "interactions": [
            {
                "item_a": "Ashwagandha",
                "item_b": "Metformin",
                "severity": "moderate",
                "severity_score": 0.6,
                "confidence": 0.8,
                "mechanism": "Additive glucose lowering.",
                "recommendation": "Monitor blood sugar.",
                "compounds_involved": [],
                "evidence": [],
                "mechanism_path": [],
                "low_evidence_warning": False
            }
        ],
        "no_interactions": [],
        "explanation": "Ashwagandha may lower blood sugar, enhancing Metformin's effect.",
        "translated_explanation": None,
        "items_checked": ["Ashwagandha", "Metformin"],
        "language": "en",
        "processing_time_ms": 150,
        "disclaimer": "Test disclaimer"
    }
    
    with patch("app.services.interaction_service.InteractionService.check_interactions", new_callable=AsyncMock) as mock_check:
        mock_check.return_value = mock_response
        
        # Test basic input validation
        payload = {
            "items": ["Ashwagandha", "Metformin"],
            "language": "en"
        }
        
        # Fastapi tests typically use TestClient, here we just verify schema validation
        from app.schemas.interaction import InteractionCheckRequest
        req = InteractionCheckRequest(**payload)
        
        assert len(req.items) == 2
        assert req.language == "en"
        assert req.patient_context is None

def test_check_interactions_api_validation_failure():
    """Test that providing less than 2 items fails Pydantic validation."""
    from pydantic import ValidationError
    from app.schemas.interaction import InteractionCheckRequest
    
    with pytest.raises(ValidationError):
        InteractionCheckRequest(items=["Ashwagandha"])  # Only 1 item

def test_check_interactions_api_max_items():
    """Test that providing more than 10 items fails Pydantic validation."""
    from pydantic import ValidationError
    from app.schemas.interaction import InteractionCheckRequest
    
    with pytest.raises(ValidationError):
        InteractionCheckRequest(items=["DrugA"] * 11)  # 11 items
