import asyncio
import json
import hashlib
import os
import httpx
from loguru import logger
from utils.cache import get_cache
from utils.rate_limiter import LIMITERS

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent"

SYSTEM_PROMPT = """
You are a clinical pharmacologist extracting herb-drug
interaction protocols for an Indian Ayurveda-Allopathy
drug safety platform.

ABSOLUTE RULES:
1. Extract ONLY what is explicitly stated in the provided text.
2. Never infer or generate information not present.
3. Every non-null field needs a verbatim quote under 20 words.
4. null is correct when information is absent.
5. Banned words: safe, dangerous, deadly, harmless, guaranteed.
   Use: "increased risk of [specific effect]" instead.
6. Return ONLY valid JSON. No markdown. No explanation.
"""

USER_PROMPT_TEMPLATE = """
Extract a clinical protocol for:
Herb: {herb} ({botanical})
Drug: {drug}

SOURCE EVIDENCE ({source_count} sources, {paper_count} papers):
{combined_context}

Return this JSON — null for any field without explicit evidence:
{{
  "herb_canonical": "{botanical}",
  "herb_common": "{herb}",
  "drug_canonical": "{drug}",
  "condition": "primary condition or null",
  "interaction_found": true or false,
  "severity": "low|moderate|high|critical or null",
  "interaction_type": "pharmacokinetic|pharmacodynamic|both or null",
  "mechanism": "2-sentence mechanism or null",
  "active_compound": "responsible compound or null",
  "allopathic_base": {{
    "value": "drug + dose or null",
    "quote": "verbatim quote under 20 words or null",
    "source": "source name or null",
    "confidence": 0.0
  }},
  "ayurvedic_base": {{
    "value": "herb + dose or null",
    "quote": "verbatim quote under 20 words or null",
    "source": "source name or null",
    "confidence": 0.0
  }},
  "timing_guidance": {{
    "value": null,
    "quote": null,
    "source": null,
    "confidence": 0.0
  }},
  "monitoring_parameters": [
    {{"parameter": "string", "quote": "string",
      "source": "string", "confidence": 0.0}}
  ],
  "contraindications": [
    {{"condition": "string", "quote": "string",
      "source": "string", "confidence": 0.0}}
  ],
  "recommendation": "one-sentence clinical recommendation or null",
  "evidence_level": 1,
  "key_sources": ["source name 1", "source name 2"]
}}
"""

class GeminiExtractor:

  def __init__(self):
    self.cache = get_cache()
    self.limiter = LIMITERS["gemini"]

  def _build_context(self, all_sources: list[dict],
                     max_chars: int = 15000) -> tuple[str, int]:
    sorted_sources = sorted(
      all_sources,
      key=lambda s: (
        s.get("evidence_level", 0),
        1 if s.get("source") == "PubMed" else 0,
        s.get("citation_count", 0)
      ),
      reverse=True
    )

    context_parts = []
    total_chars = 0

    for source in sorted_sources:
      title = source.get("title", "")
      abstract = source.get("abstract", "")
      src_name = source.get("source", "Unknown")
      year = source.get("year", "")
      url = source.get("url", "")
      ev_level = source.get("evidence_level", 0)

      block = (
        f"[SOURCE: {src_name} | Year: {year} | "
        f"Evidence Level: {ev_level} | URL: {url}]\n"
        f"Title: {title}\n"
        f"Content: {abstract[:1500]}\n"
        f"---\n"
      )

      if total_chars + len(block) > max_chars:
        break

      context_parts.append(block)
      total_chars += len(block)

    return "\n".join(context_parts), len(sorted_sources)

  async def extract(self, botanical: str, common: str,
                    drug: str,
                    all_sources: list[dict]) -> dict | None:
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    if not gemini_key:
      logger.error("GEMINI_API_KEY is not set.")
      return None

    # Check cache first
    source_hash = hashlib.md5(
      "|".join(
        s.get("url", s.get("pmid", ""))
        for s in sorted(all_sources, key=lambda x: x.get("url",""))
      ).encode()
    ).hexdigest()[:12]
    
    cache_key = self.cache.make_key(
      "gemini_extract", botanical, drug, source_hash
    )

    cached = self.cache.get(cache_key)
    if cached:
      logger.info(f"Gemini cache hit: {common} + {drug}")
      return cached

    if not all_sources:
      logger.info(f"No sources found for {common} + {drug} — skipping")
      return None

    # Filter to sources that mention both herb AND drug
    relevant = [
      s for s in all_sources
      if s.get("herb_mentioned") and s.get("drug_mentioned")
    ]

    # If no directly relevant sources fall back to herb-only
    if not relevant:
      relevant = [s for s in all_sources if s.get("herb_mentioned")]

    if not relevant:
      logger.info(f"No relevant sources for {common} + {drug}")
      return None

    context, source_count = self._build_context(relevant)

    prompt = USER_PROMPT_TEMPLATE.format(
      herb=common,
      botanical=botanical,
      drug=drug,
      source_count=source_count,
      paper_count=len(relevant),
      combined_context=context
    )

    await self.limiter.wait()

    from google import genai
    from google.genai import types

    client = genai.Client(api_key=gemini_key)
    
    try:
      response = await asyncio.to_thread(
          client.models.generate_content,
          model='gemini-2.5-flash',
          contents=prompt,
          config=types.GenerateContentConfig(
              system_instruction=SYSTEM_PROMPT,
              temperature=0.1,
              response_mime_type="application/json",
          ),
      )
      content = response.text.strip()
      
      # Simple json parse
      protocol = json.loads(content)

      # Add metadata
      protocol["source_urls"] = [
        s.get("url", "") for s in relevant[:5]
      ]
      protocol["pmids"] = [
        s.get("pmid", "") for s in relevant
        if s.get("pmid")
      ]
      protocol["source_count"] = source_count

      self.cache.set(cache_key, protocol, "gemini_extract")
      logger.success(
        f"Extracted protocol: {common} + {drug} "
        f"(interaction_found={protocol.get('interaction_found')})"
      )
      return protocol

    except json.JSONDecodeError:
      logger.error(f"Gemini returned invalid JSON for {common} + {drug}")
      return None
    except Exception as e:
      logger.error(f"Gemini extraction failed for {common} + {drug}: {e}")
      return None
