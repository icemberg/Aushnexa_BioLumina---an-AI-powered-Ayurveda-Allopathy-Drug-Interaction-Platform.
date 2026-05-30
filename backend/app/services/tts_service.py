"""
Text-to-Speech Service

Uses Sarvam AI API for generating audio from text in Indian languages and English.
"""

import httpx
from loguru import logger
import base64

from app.config import get_settings
from app.cache.redis import cache_get, cache_set
from app.core.exceptions import ExternalServiceError

# Sarvam AI language code mapping for TTS
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

class TTSService:
    """
    Generates audio using the Sarvam AI Text-to-Speech API.
    """

    def __init__(self):
        self.settings = get_settings()
        self.api_key = self.settings.sarvam_api_key
        # Note: We hardcode TTS base URL since translation service might have a different base
        self.url = "https://api.sarvam.ai/text-to-speech"

    async def generate_audio(self, text: str, language: str = "en") -> str:
        """
        Generate audio from text using Sarvam AI.

        Args:
            text: Text to synthesize.
            language: ISO 639-1 language code (e.g. 'en', 'hi')

        Returns:
            List of Base64 encoded audio strings (WAV format)
        """
        if not self.api_key:
            logger.error("Sarvam API key not configured — cannot generate audio")
            raise ValueError("Sarvam API key is not configured.")

        # Map to Sarvam language codes
        target_code = SARVAM_LANGUAGE_CODES.get(language, "en-IN")

        # Check cache first (cache for 30 days)
        cache_key = f"tts:{target_code}:{hash(text)}"
        cached = await cache_get(cache_key)
        if cached:
            return cached

        # The API restricts each input string to 500 chars max, and max 5 inputs (2500 chars total)
        # We split the text into chunks of max 490 characters.
        words = text.split()
        chunks = []
        current_chunk = []
        current_length = 0
        for word in words:
            if current_length + len(word) + 1 > 490:
                chunks.append(" ".join(current_chunk))
                current_chunk = [word]
                current_length = len(word)
            else:
                current_chunk.append(word)
                current_length += len(word) + 1
        if current_chunk:
            chunks.append(" ".join(current_chunk))
        
        safe_chunks = chunks[:5] # Max 5 inputs

        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                response = await client.post(
                    self.url,
                    headers={
                        "api-subscription-key": self.api_key,
                        "Content-Type": "application/json",
                    },
                    json={
                        "inputs": safe_chunks,
                        "target_language_code": target_code,
                        "speaker": "aditya",
                        "pace": 1.0,
                        "speech_sample_rate": 8000,
                        "enable_preprocessing": True,
                        "model": "bulbul:v3"
                    },
                )
                response.raise_for_status()
                data = response.json()

                # Some versions of Sarvam API return 'audios' (array) or 'base64_audio' (string)
                audios = data.get("audios", [])
                
                # Ensure it's a list
                if not audios:
                    single_audio = data.get("base64_audio") or data.get("audio")
                    if single_audio:
                        audios = [single_audio]

                if not audios:
                    logger.warning(f"Sarvam returned empty audio for text chunks")
                    raise RuntimeError(f"TTS returned empty result. Response keys: {list(data.keys())}")

                # Cache the result for 30 days
                await cache_set(cache_key, audios, ttl=86400 * 30)

                logger.info(f"Generated {len(audios)} audio chunks for {len(text)} chars in {language}")
                return audios

        except httpx.HTTPStatusError as e:
            logger.error(f"Sarvam TTS API HTTP error: {e.response.status_code} — {e.response.text}")
            raise ExternalServiceError(f"TTS service returned status {e.response.status_code}")
        except httpx.TimeoutException:
            logger.error("Sarvam TTS API request timed out")
            raise ExternalServiceError("TTS service timed out. Please try again.")
        except Exception as e:
            logger.error(f"Sarvam TTS API unexpected error: {e}")
            raise ExternalServiceError(f"Failed to generate audio: {str(e)}")
