"""
Unit tests for the Risk Scoring Engine
"""

import pytest
from app.services.risk_service import RiskService

@pytest.fixture
def risk_service():
    return RiskService()

def test_compute_interaction_risk_basic(risk_service):
    """Test basic risk computation without patient factors."""
    # Critical severity (0.4 * 1.0) + Level 6 Evidence (0.3 * 1.0) + Well-characterized mechanism (0.2 * 1.0) + No patient (0.1 * 0) = 0.9
    result = risk_service.compute_interaction_risk(
        severity="critical",
        evidence_level=6,
        mechanism_type="well_characterized"
    )
    
    assert result["severity"] == "critical"
    assert result["severity_score"] >= 0.8
    assert result["confidence"] > 0.8
    assert result["low_evidence_warning"] is False

def test_compute_interaction_risk_low_evidence(risk_service):
    """Test risk computation with low evidence level."""
    result = risk_service.compute_interaction_risk(
        severity="high",
        evidence_level=2,  # Animal study
        mechanism_type="theoretical"
    )
    
    # Due to low evidence and theoretical mechanism, confidence should be low, and warning should be true
    assert result["low_evidence_warning"] is True
    assert result["confidence"] < 0.5

def test_compute_patient_factors_modifiers(risk_service):
    """Test how patient factors modify the risk score."""
    # Base risk without patient factors
    base_result = risk_service.compute_interaction_risk(
        severity="moderate",
        evidence_level=4,
        mechanism_type="partially_characterized"
    )
    
    # Risk with compounding patient factors
    patient_result = risk_service.compute_interaction_risk(
        severity="moderate",
        evidence_level=4,
        mechanism_type="partially_characterized",
        patient_context={
            "age": 68,  # > 65
            "is_pregnant": True,
            "conditions": ["Diabetes", "Kidney Disease"]
        }
    )
    
    assert patient_result["severity_score"] > base_result["severity_score"]

def test_compute_overall_risk(risk_service):
    """Test that overall risk matches the highest individual risk."""
    interaction_scores = [
        {"severity_score": 0.3},
        {"severity_score": 0.85},
        {"severity_score": 0.5}
    ]
    
    overall = risk_service.compute_overall_risk(interaction_scores)
    
    assert overall["score"] == 0.85
    assert overall["overall_risk"] == "critical"
