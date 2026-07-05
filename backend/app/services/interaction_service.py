"""
Interaction Service

Orchestrates the complete interaction checking pipeline:
1. Normalize entity names
2. Query Neo4j knowledge graph using `check_all_pairs`
3. Compute risk scores
4. Generate patient-friendly explanation via ExplanationService
5. Translate explanation via TranslationService (if non-English)
"""

import uuid
import time
from loguru import logger

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime, timedelta

from app.schemas.interaction import InteractionResponse, InteractionResult, NormalizedItem, PatientContext, EvidenceItem, InteractionRequest
from app.services.normalization_service import NormalizationService
from app.services.risk_service import RiskService
from app.services.explanation_service import ExplanationService
from app.services.translation_service import TranslationService
from app.graph.queries import check_all_pairs, get_known_compounds, find_mechanism_path
from app.graph.connection import get_driver
from app.db.models import User, QueryHistory, Institution

class InteractionService:
    def __init__(self):
        self.normalizer = NormalizationService()
        self.risk_engine = RiskService()
        self.explainer = ExplanationService()
        self.translator = TranslationService()

    async def check_interactions(
        self,
        items: list[str],
        language: str = "en",
        patient_context: PatientContext | None = None,
    ) -> InteractionResponse:
        start_time = time.time()
        query_id = str(uuid.uuid4())

        # Step 1: Normalize all entity names
        normalized_items_data = []
        canonical_names = []
        for item in items:
            try:
                norm_result = await self.normalizer.normalize(item)
                normalized_items_data.append(norm_result)
                canonical_names.append(norm_result.canonical)
            except Exception as e:
                logger.warning(f"Normalization failed for {item}: {e}")
                norm_result = NormalizedItem(original=item, canonical=item, confidence=0, info="Normalization failed")
                normalized_items_data.append(norm_result)
                canonical_names.append(item)

        # Step 2: Query Neo4j
        interaction_results = []
        interaction_scores = []
        try:
            driver = get_driver()
            async with driver.session() as session:
                graph_interactions = await check_all_pairs(session, canonical_names)

                for gi in graph_interactions:
                    compounds_a = await get_known_compounds(session, gi["item_a"])
                    compounds_b = await get_known_compounds(session, gi["item_b"])
                    compounds = list(set(compounds_a + compounds_b))

                    evidence_level_str = str(gi.get("evidence_level") or "0")
                    try:
                        evidence_level = int(evidence_level_str)
                    except ValueError:
                        evidence_level = 0

                    risk_result = self.risk_engine.compute_interaction_risk(
                        severity=gi.get("severity", "moderate"),
                        evidence_level=evidence_level,
                        mechanism_type="partially_characterized",
                        patient_context=patient_context.model_dump() if patient_context else None,
                    )

                    evidence_list = []
                    for e in gi.get("evidence", []):
                        if e and e.get("pmid"):
                            evidence_list.append(EvidenceItem(
                                pmid=e.get("pmid"),
                                title=e.get("title") or "",
                                study_type=e.get("study_type") or "",
                                evidence_level=int(e.get("evidence_level") or 0),
                                year=int(e.get("year") or 0),
                                conclusion=e.get("conclusion") or ""
                            ))

                    res = InteractionResult(
                        item_a=gi["item_a"],
                        item_b=gi["item_b"],
                        severity=risk_result["severity"],
                        severity_score=risk_result["severity_score"],
                        confidence=risk_result["confidence"],
                        evidence_level=evidence_level_str,
                        interaction_type=gi.get("interaction_type", "Unknown"),
                        mechanism=gi.get("mechanism", "Mechanism under investigation"),
                        compounds_involved=compounds[:5],
                        recommendation=gi.get("recommendation", "Consult your healthcare provider"),
                        evidence=evidence_list,
                        low_evidence_warning=risk_result["low_evidence_warning"],
                    )
                    interaction_results.append(res)
                    interaction_scores.append(risk_result)
        except Exception as e:
            logger.error(f"Neo4j interaction check failed (DB down?): {e}")

        interactions_found = len(interaction_results)
        
        # Step 3: Risk Score
        overall = self.risk_engine.compute_overall_risk(interaction_scores, interactions_found)

        # Step 4: LLM Explanation
        explanation = ""
        try:
            explanation = await self.explainer.generate_explanation(
                interactions=[r.model_dump() for r in interaction_results],
                items=canonical_names,
                patient_context=patient_context.model_dump() if patient_context else None,
            )
        except Exception as e:
            logger.error(f"Explanation generation failed: {e}")
            explanation = self._fallback_explanation([r.model_dump() for r in interaction_results], canonical_names)

        # Step 5: Translation
        translated_explanation = None
        if language != "en" and explanation:
            try:
                translated_explanation = await self.translator.translate(
                    text=explanation,
                    source_language="en",
                    target_language=language,
                )
            except Exception as e:
                logger.error(f"Translation failed: {e}")
                # Fallback to English

        processing_time = int((time.time() - start_time) * 1000)

        return InteractionResponse(
            query_id=query_id,
            overall_risk=overall["overall_risk"],
            overall_score=overall["overall_score"],
            interactions_found=interactions_found,
            interactions=interaction_results,
            normalized_items=normalized_items_data,
            explanation=explanation,
            translated_explanation=translated_explanation,
            disclaimer="Aushnexa provides information only and does not replace professional medical advice. Always consult your doctor or pharmacist before combining medications or herbal supplements.",
            processing_time_ms=processing_time
        )

    def _fallback_explanation(self, interactions: list[dict], items: list[str]) -> str:
        if not interactions:
            return f"No documented interactions were found between {', '.join(items)}. Always consult your healthcare provider."
        parts = [f"We checked {', '.join(items)}."]
        for i in interactions:
            parts.append(f"{i['item_a']} and {i['item_b']} may interact (severity: {i['severity']}).")
        return " ".join(parts)

    async def record_query_history(
        self,
        db: AsyncSession,
        request: InteractionRequest,
        result: InteractionResponse,
        user: User | None = None,
        ip_address: str | None = None,
    ):
        try:
            # 1. Determine Institution if user is provided and has email
            institution_id = None
            if user and user.email:
                domain = user.email.split('@')[-1]
                inst_result = await db.execute(select(Institution).where(Institution.domain == domain))
                inst = inst_result.scalar_one_or_none()
                if not inst:
                    # auto-create institution for this domain for the MVP
                    inst = Institution(name=domain.capitalize(), type="Clinical Center", domain=domain, is_verified=False)
                    db.add(inst)
                    await db.flush() # get id
                institution_id = inst.id
                
                # Update user's institution if not set
                if not user.institution_id:
                    user.institution_id = inst.id

            # 2. Anomaly Detection
            risk_status = "verified" if institution_id and inst.is_verified else "unverified"
            anomaly_reason = None

            # Rule 1: Items <= 3 and all 4 severity levels triggered
            if len(request.items) <= 3:
                severities = {r.severity for r in result.interactions}
                if len(severities) >= 4:
                    risk_status = "anomaly"
                    anomaly_reason = "Statistically improbable: all severity levels triggered with <= 3 items"

            # Rule 2: SQL injection or extreme length
            for item in request.items:
                if len(item) > 200:
                    risk_status = "anomaly"
                    anomaly_reason = "Extremely long entity string detected (>200 chars)"
                    break
                sql_patterns = ["drop table", "select *", "union select", "1=1"]
                if any(p in item.lower() for p in sql_patterns):
                    risk_status = "anomaly"
                    anomaly_reason = "SQL injection pattern detected"
                    break

            # Rule 3: Rate abuse (>100 requests in 10 mins from same IP)
            if ip_address:
                ten_mins_ago = datetime.utcnow() - timedelta(minutes=10)
                count_res = await db.execute(
                    select(func.count(QueryHistory.id))
                    .where(QueryHistory.ip_address == ip_address)
                    .where(QueryHistory.created_at >= ten_mins_ago)
                )
                count = count_res.scalar() or 0
                if count >= 100:
                    risk_status = "anomaly"
                    anomaly_reason = "Rate abuse: >100 requests in 10 minutes from same IP"

            history_entry = QueryHistory(
                user_id=user.id if user else None,
                institution_id=institution_id,
                ip_address=ip_address,
                query_protocol="Ayur-Allo Matrix Cross-Ref",
                risk_status=risk_status,
                anomaly_reason=anomaly_reason,
                items=request.items,
                items_checked=[n.canonical for n in result.normalized_items],
                language=request.language,
                patient_context=request.patient_context.model_dump() if request.patient_context else None,
                request_json=request.model_dump(),
                overall_risk=result.overall_risk,
                overall_score=result.overall_score,
                interactions_found=result.interactions_found,
                response_json=result.model_dump(),
                processing_time_ms=result.processing_time_ms,
            )
            db.add(history_entry)
        except SQLAlchemyError as e:
            logger.error(f"Failed to record query history in DB: {e}")
