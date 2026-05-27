"""
Explanation Service

Generates patient-friendly explanations of drug-herb interactions
using Anthropic (Claude) or Groq API as a fallback.
Uses Redis caching to avoid redundant LLM calls.
"""

import httpx
import hashlib
from loguru import logger

from app.config import get_settings
from app.cache.redis import cache_get, cache_set
from app.core.exceptions import ExplanationServiceError


EXPLANATION_SYSTEM_PROMPT = """You are a clinical pharmacology expert generating patient-friendly explanations 
of drug-herb interactions. Your explanations must be:

1. ACCURATE: Based only on the provided interaction data. Never invent mechanisms.
2. CLEAR: Written at a 8th-grade reading level. Avoid jargon.
3. SAFE: Always include uncertainty language ("may", "could potentially").
4. ACTIONABLE: End with a specific recommendation.
5. CONCISE: Maximum 3-4 sentences per interaction.

You will receive structured interaction data and must generate a single coherent 
explanation paragraph covering all interactions found.

CRITICAL SAFETY RULES:
- Never state that a combination is "safe" or "harmless"
- Always recommend consulting a healthcare professional
- Clearly indicate the level of evidence (strong evidence vs. theoretical concern)
- If evidence is low (level 1-2), explicitly state this is a theoretical concern"""

EVIDENCE_SYSTEM_PROMPT = """You are a clinical pharmacology researcher. 
Your task is to synthesize the clinical evidence regarding a specific drug-herb combination.
You will receive a list of clinical trials and published literature.
Write a 3-4 sentence clinical summary of what this evidence indicates.
Be objective, scientific, and concise. Do not invent mechanisms not present in the data."""

class ExplanationService:
    def __init__(self):
        settings = get_settings()
        self.anthropic_key = settings.anthropic_api_key
        self.groq_key = settings.groq_api_key
        self.groq_model = settings.groq_model

    def _generate_cache_key(self, items: list[str]) -> str:
        sorted_items = sorted(item.lower() for item in items)
        content = "|".join(sorted_items)
        return "explanation:" + hashlib.sha256(content.encode()).hexdigest()

    async def generate_explanation(
        self,
        interactions: list[dict],
        items: list[str],
        patient_context: dict | None = None,
    ) -> str:
        cache_key = self._generate_cache_key(items)
        cached = await cache_get(cache_key)
        if cached:
            logger.info("Explanation retrieved from cache")
            return cached

        user_prompt = self._build_prompt(interactions, items, patient_context)
        explanation = None

        if self.anthropic_key:
            try:
                explanation = await self._call_anthropic(user_prompt)
            except Exception as e:
                logger.warning(f"Anthropic failed, falling back to Groq: {e}")

        if not explanation and self.groq_key:
            try:
                explanation = await self._call_groq(user_prompt)
            except Exception as e:
                logger.error(f"Groq failed: {e}")

        if not explanation:
            raise ExplanationServiceError("Explanation service failed to generate response.")

        await cache_set(cache_key, explanation, ttl=86400 * 7) # Cache for 7 days
        return explanation

    async def summarize_evidence(self, herb: str, drug: str, data: dict) -> str:
        cache_key = "evidence_summary:" + hashlib.sha256(f"{herb}|{drug}".encode()).hexdigest()
        cached = await cache_get(cache_key)
        if cached:
            return cached

        trials = data.get("trials", [])[:5]
        papers = data.get("papers", [])[:5]
        
        if not trials and not papers:
            return "No clinical trials or published literature were found for this combination."

        prompt_parts = [f"Synthesize the evidence for the combination of {herb} and {drug}.\n\n"]
        if trials:
            prompt_parts.append("CLINICAL TRIALS:")
            for i, t in enumerate(trials):
                prompt_parts.append(f"{i+1}. {t.get('title', '')} (Phase: {t.get('phase', 'Unknown')})\nSummary: {t.get('summary', '')}\n")
        if papers:
            prompt_parts.append("PUBLISHED LITERATURE:")
            for i, p in enumerate(papers):
                prompt_parts.append(f"{i+1}. {p.get('title', '')} ({p.get('year', '')})\nAbstract: {p.get('abstract', '')}\n")
        
        prompt = "\n".join(prompt_parts)

        summary = None
        if self.anthropic_key:
            try:
                summary = await self._call_anthropic(prompt, system_prompt=EVIDENCE_SYSTEM_PROMPT)
            except Exception as e:
                logger.error(f"Anthropic evidence summary failed: {e}")
        
        if not summary and self.groq_key:
            try:
                summary = await self._call_groq(prompt, system_prompt=EVIDENCE_SYSTEM_PROMPT)
            except Exception as e:
                logger.error(f"Groq evidence summary failed: {e}")

        if not summary:
            return "Unable to generate evidence summary at this time due to high server load."

        await cache_set(cache_key, summary, ttl=86400 * 7)
        return summary

    async def _call_anthropic(self, prompt: str, system_prompt: str = EXPLANATION_SYSTEM_PROMPT) -> str:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": self.anthropic_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-3-haiku-20240307",
                    "max_tokens": 500,
                    "system": system_prompt,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3,
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["content"][0]["text"].strip()

    async def _call_groq(self, prompt: str, system_prompt: str = EXPLANATION_SYSTEM_PROMPT) -> str:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.groq_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.groq_model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.3,
                    "max_tokens": 500,
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()

    def _build_prompt(
        self,
        interactions: list[dict],
        items: list[str],
        patient_context: dict | None,
    ) -> str:
        parts = [f"The patient is checking the following items: {', '.join(items)}.", ""]

        if patient_context:
            context_parts = []
            if patient_context.get("age"):
                context_parts.append(f"Age: {patient_context['age']}")
            if patient_context.get("conditions"):
                context_parts.append(f"Conditions: {', '.join(patient_context['conditions'])}")
            if patient_context.get("is_pregnant"):
                context_parts.append("Currently pregnant")
            if context_parts:
                parts.append(f"Patient context: {'; '.join(context_parts)}\n")

        if interactions:
            parts.append("Found interactions:")
            for i, interaction in enumerate(interactions, 1):
                parts.append(
                    f"{i}. {interaction.get('item_a', '?')} + {interaction.get('item_b', '?')}: "
                    f"Severity={interaction.get('severity', 'unknown')}, "
                    f"Mechanism={interaction.get('mechanism', 'unknown')}, "
                    f"Recommendation={interaction.get('recommendation', 'Consult your doctor')}"
                )
        else:
            parts.append(
                "No documented interactions were found between these items. "
                "Generate a brief note explaining this does not guarantee safety."
            )

        parts.append("\nGenerate a clear, patient-friendly explanation covering all interactions. Be specific about mechanisms. End with actionable advice.")
        return "\n".join(parts)
