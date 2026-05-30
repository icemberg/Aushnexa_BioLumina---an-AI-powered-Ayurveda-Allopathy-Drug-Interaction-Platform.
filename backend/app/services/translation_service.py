"""
Translation Service

Uses Sarvam AI API for translating between English and Indian languages.
No mock implementations — makes real API calls to Sarvam.

Supported languages: hi (Hindi), ta (Tamil), te (Telugu),
                     mr (Marathi), kn (Kannada), bn (Bengali)
"""

import httpx
from loguru import logger

from app.config import get_settings
from app.cache.redis import cache_get, cache_set
from app.core.exceptions import TranslationServiceError

# Sarvam AI language code mapping
SARVAM_LANGUAGE_CODES = {
    "en": "en-IN",
    "hi": "hi-IN",
    "ta": "ta-IN",
    "te": "te-IN",
    "mr": "mr-IN",
    "kn": "kn-IN",
    "bn": "bn-IN",
    "ml": "ml-IN",
    "gu": "gu-IN",
    "pa": "pa-IN",
}


class TranslationService:
    """
    Translates text using the Sarvam AI Translation API.
    """

    def __init__(self):
        self.settings = get_settings()
        self.api_key = self.settings.sarvam_api_key
        self.base_url = self.settings.sarvam_base_url

    async def translate(
        self,
        text: str,
        source_language: str = "en",
        target_language: str = "hi",
    ) -> str:
        """
        Translate text from source to target language using Sarvam AI.

        Args:
            text: Text to translate
            source_language: ISO 639-1 source language code
            target_language: ISO 639-1 target language code

        Returns:
            Translated text string
        """
        # No translation needed if same language
        if source_language == target_language:
            return text

        if not self.api_key:
            logger.error("Sarvam API key not configured — cannot translate")
            raise ValueError(
                "Sarvam API key is not configured. Set SARVAM_API_KEY in your .env file."
            )

        # Check cache first
        cache_key = f"translate:{source_language}:{target_language}:{hash(text)}"
        cached = await cache_get(cache_key)
        if cached:
            return cached

        # Map to Sarvam language codes
        source_code = SARVAM_LANGUAGE_CODES.get(source_language)
        target_code = SARVAM_LANGUAGE_CODES.get(target_language)

        if not source_code or not target_code:
            raise ValueError(
                f"Unsupported language pair: {source_language} → {target_language}. "
                f"Supported: {', '.join(SARVAM_LANGUAGE_CODES.keys())}"
            )

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/translate",
                    headers={
                        "api-subscription-key": self.api_key,
                        "Content-Type": "application/json",
                    },
                    json={
                        "input": text,
                        "source_language_code": source_code,
                        "target_language_code": target_code,
                        "speaker_gender": "Female",
                        "mode": "formal",
                        "model": "mayura:v1",
                        "enable_preprocessing": True,
                    },
                )
                response.raise_for_status()
                data = response.json()

                translated_text = data.get("translated_text", "")
                if not translated_text:
                    logger.warning(f"Sarvam returned empty translation for: {text[:50]}...")
                    raise RuntimeError("Translation returned empty result")

                # Cache the result for 30 days
                await cache_set(cache_key, translated_text, ttl=86400 * 30)

                logger.info(
                    f"Translated {len(text)} chars from {source_language} to {target_language}"
                )
                return translated_text

        except httpx.HTTPStatusError as e:
            logger.error(f"Sarvam API HTTP error: {e.response.status_code} — {e.response.text}")
            raise TranslationServiceError(f"Translation service returned status {e.response.status_code}")
        except httpx.TimeoutException:
            logger.error("Sarvam API request timed out")
            raise TranslationServiceError("Translation service timed out. Please try again.")
        except Exception as e:
            logger.error(f"Sarvam API unexpected error: {e}")
            raise TranslationServiceError(f"Failed to translate: {str(e)}")
