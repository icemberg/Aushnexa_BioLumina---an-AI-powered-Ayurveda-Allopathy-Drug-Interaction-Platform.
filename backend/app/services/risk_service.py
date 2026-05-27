"""
Risk Scoring Service

Computes interaction risk scores using a weighted formula:
  Risk = 0.4 × Severity + 0.3 × Evidence + 0.2 × Mechanism + 0.1 × Patient Factors
"""

from loguru import logger


# ─── Severity Scores ───
SEVERITY_SCORES = {
    "critical": 1.0,
    "high": 0.8,
    "moderate": 0.5,
    "low": 0.2,
}

# ─── Evidence Level Scores ───
EVIDENCE_SCORES = {
    1: 0.1,   # In vitro
    2: 0.2,   # Animal study
    3: 0.35,  # Case report
    4: 0.55,  # Observational study
    5: 0.8,   # Randomized clinical trial
    6: 1.0,   # Meta-analysis / systematic review
}

# ─── Mechanism Plausibility ───
# How well-understood the biological mechanism is
MECHANISM_PLAUSIBILITY = {
    "well_characterized": 1.0,
    "partially_characterized": 0.7,
    "theoretical": 0.3,
    "unknown": 0.1,
}

# ─── Patient Risk Multipliers ───
PATIENT_FACTOR_WEIGHTS = {
    "age_over_65": 0.15,
    "age_under_12": 0.1,
    "pregnant": 0.25,
    "breastfeeding": 0.15,
    "liver_disease": 0.2,
    "kidney_disease": 0.2,
    "diabetes": 0.1,
    "hypertension": 0.05,
    "on_anticoagulants": 0.2,
    "on_immunosuppressants": 0.15,
}


class RiskService:
    """
    Computes risk scores for drug-herb interactions.
    """

    def compute_interaction_risk(
        self,
        severity: str,
        evidence_level: int | None,
        mechanism_type: str = "unknown",
        patient_context: dict | None = None,
    ) -> dict:
        """
        Compute the risk score for a single interaction pair.

        Args:
            severity: 'low', 'moderate', 'high', or 'critical'
            evidence_level: 1-6 evidence quality scale
            mechanism_type: How well-characterized the mechanism is
            patient_context: Optional patient-specific factors

        Returns:
            dict with score, severity label, confidence, and low_evidence_warning
        """
        # Base severity score
        severity_score = SEVERITY_SCORES.get(severity.lower(), 0.3)

        # Evidence strength score
        evidence_score = EVIDENCE_SCORES.get(evidence_level, 0.2)

        # Mechanism plausibility score
        mechanism_score = MECHANISM_PLAUSIBILITY.get(mechanism_type, 0.3)

        # Patient factor score
        patient_score = self._compute_patient_factors(patient_context)

        # Weighted combination
        risk_score = (
            0.4 * severity_score +
            0.3 * evidence_score +
            0.2 * mechanism_score +
            0.1 * patient_score
        )

        # Clamp to [0, 1]
        risk_score = max(0.0, min(1.0, risk_score))

        # Determine adjusted severity label
        adjusted_severity = self._score_to_severity(risk_score)

        # Low evidence warning
        low_evidence = evidence_level is None or evidence_level <= 2

        # Confidence based on evidence quality
        confidence = self._compute_confidence(evidence_level, mechanism_type)

        return {
            "severity_score": round(risk_score, 2),
            "severity": adjusted_severity,
            "confidence": round(confidence, 2),
            "low_evidence_warning": low_evidence,
            "evidence_level": evidence_level,
        }

    def compute_overall_risk(self, interaction_scores: list[dict], interactions_found: int = 0) -> dict:
        """
        Compute overall risk from multiple pairwise interaction scores.

        Uses the maximum severity score as the overall risk,
        with a slight penalty for multiple interactions.
        """
        if not interaction_scores:
            return {
                "overall_risk": "low",
                "overall_score": 0.0,
            }

        max_score = max(s["severity_score"] for s in interaction_scores)
        
        penalty = min(0.15, 0.05 * max(0, interactions_found - 1))
        overall_score = min(1.0, max_score + penalty)

        overall_severity = self._score_to_severity(overall_score)

        return {
            "overall_risk": overall_severity,
            "overall_score": round(overall_score, 2),
        }

    def _compute_patient_factors(self, context: dict | None) -> float:
        """Compute patient-specific risk modifier (0.0 to 1.0)."""
        if not context:
            return 0.0

        factor_score = 0.0

        # Age factors
        age = context.get("age")
        if age and age > 65:
            factor_score += PATIENT_FACTOR_WEIGHTS["age_over_65"]
        elif age and age < 12:
            factor_score += PATIENT_FACTOR_WEIGHTS["age_under_12"]

        # Pregnancy
        if context.get("is_pregnant"):
            factor_score += PATIENT_FACTOR_WEIGHTS["pregnant"]

        if context.get("is_breastfeeding"):
            factor_score += PATIENT_FACTOR_WEIGHTS["breastfeeding"]

        # Conditions
        conditions = context.get("conditions", [])
        if conditions:
            condition_lower = [c.lower() for c in conditions]
            for condition_key, weight in PATIENT_FACTOR_WEIGHTS.items():
                # Match condition keywords
                for cond in condition_lower:
                    if condition_key.replace("_", " ") in cond or condition_key.replace("_", "") in cond:
                        factor_score += weight

        # Clamp to [0, 1]
        return min(1.0, factor_score)

    def _score_to_severity(self, score: float) -> str:
        """Map a risk score to a severity label."""
        if score >= 0.8:
            return "critical"
        if score >= 0.6:
            return "high"
        if score >= 0.35:
            return "moderate"
        return "low"

    def _compute_confidence(self, evidence_level: int | None, mechanism_type: str) -> float:
        """
        Compute confidence score based on evidence quality and mechanism understanding.
        """
        evidence_conf = EVIDENCE_SCORES.get(evidence_level, 0.1)
        mechanism_conf = MECHANISM_PLAUSIBILITY.get(mechanism_type, 0.1)

        # Evidence contributes 70%, mechanism understanding 30%
        confidence = 0.7 * evidence_conf + 0.3 * mechanism_conf
        return max(0.0, min(1.0, confidence))
