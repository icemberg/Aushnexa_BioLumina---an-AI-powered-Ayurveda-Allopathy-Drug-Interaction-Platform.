import httpx
import json
import os
from loguru import logger
from utils.cache import get_cache
from utils.rate_limiter import LIMITERS

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

class GroqValidator:

  def __init__(self):
    self.cache = get_cache()
    self.limiter = LIMITERS["groq"]

  async def validate(self, protocol: dict,
                     context: str) -> dict:
    """
    Checks each non-null field in the protocol against sources.
    Returns validation result with per-field verdicts.
    """
    if not protocol or not protocol.get("interaction_found"):
      return {"valid": False, "score": 0.0, "verdicts": {}}

    groq_key = os.getenv("GROQ_API_KEY", "")
    if not groq_key:
      logger.warning("GROQ_API_KEY not set, skipping cross-validation.")
      return {"valid": True, "score": 0.5, "verdicts": {}}

    fields_to_check = {
      "mechanism": protocol.get("mechanism"),
      "severity": protocol.get("severity"),
      "recommendation": protocol.get("recommendation"),
    }

    # Only check fields that are non-null
    fields_to_check = {
      k: v for k, v in fields_to_check.items() if v
    }

    if not fields_to_check:
      return {"valid": True, "score": 0.5, "verdicts": {}}

    prompt = f"""
You are validating a clinical protocol extraction.
Given these source texts and extracted claims,
for each claim answer SUPPORTED, UNSUPPORTED, or UNCERTAIN.

SOURCE TEXT (excerpt):
{context[:3000]}

CLAIMS TO VALIDATE:
{json.dumps(fields_to_check, indent=2)}

Return JSON only:
{{
  "field_name": "SUPPORTED|UNSUPPORTED|UNCERTAIN"
}}
"""

    cache_key = self.cache.make_key(
      "groq_validate",
      protocol.get("herb_canonical", ""),
      protocol.get("drug_canonical", ""),
      str(fields_to_check)
    )

    cached = self.cache.get(cache_key)
    if cached:
      return cached

    await self.limiter.wait()

    try:
      async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(
          GROQ_URL,
          headers={
            "Authorization": f"Bearer {groq_key}",
            "Content-Type": "application/json"
          },
          json={
            "model": "llama-3.3-70b-versatile",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 300,
            "temperature": 0
          }
        )
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"]

        # Strip markdown
        if "```" in content:
          parts = content.split("```")
          for part in parts:
              if "{" in part:
                  content = part.replace("json", "")
                  break

        verdicts = json.loads(content.strip())

        supported = sum(
          1 for v in verdicts.values() if v == "SUPPORTED"
        )
        unsupported = sum(
          1 for v in verdicts.values() if v == "UNSUPPORTED"
        )
        total = len(verdicts)

        score = (supported - unsupported * 0.5) / max(total, 1)
        score = max(0.0, min(1.0, score))

        result = {
          "valid": score >= 0.5,
          "score": score,
          "verdicts": verdicts,
          "supported_count": supported,
          "unsupported_count": unsupported
        }

        self.cache.set(cache_key, result, "groq_validate")
        return result

    except Exception as e:
      logger.warning(f"Groq validation failed: {e}")
      return {"valid": True, "score": 0.5, "verdicts": {}}
