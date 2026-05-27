from pydantic import BaseModel, Field, field_validator
from typing import Optional


class PatientContext(BaseModel):
    age: Optional[int] = Field(None, ge=0, le=120)
    conditions: list[str] = Field(default_factory=list)
    is_pregnant: bool = False


class InteractionRequest(BaseModel):
    items: list[str] = Field(..., min_length=2, max_length=10)
    language: str = "en"
    patient_context: Optional[PatientContext] = None

    @field_validator("items")
    @classmethod
    def clean_items(cls, v: list[str]) -> list[str]:
        cleaned = [item.strip() for item in v if item.strip()]
        if len(cleaned) < 2:
            raise ValueError("At least 2 non-empty items are required")
        return cleaned


class EvidenceItem(BaseModel):
    pmid: Optional[str] = None
    title: str = ""
    study_type: str = ""
    evidence_level: int
    year: int = 0
    conclusion: str = ""
    url: Optional[str] = None


class InteractionResult(BaseModel):
    item_a: str
    item_b: str
    severity: str
    severity_score: float
    confidence: float
    evidence_level: str
    interaction_type: str
    mechanism: str
    compounds_involved: list[str]
    recommendation: str
    evidence: list[EvidenceItem]
    low_evidence_warning: bool


class NormalizedItem(BaseModel):
    original: str
    canonical: str
    confidence: float
    entity_type: str


class InteractionResponse(BaseModel):
    query_id: str
    overall_risk: str
    overall_score: float
    interactions_found: int
    interactions: list[InteractionResult]
    normalized_items: list[NormalizedItem]
    explanation: str
    translated_explanation: Optional[str] = None
    disclaimer: str
    processing_time_ms: int
