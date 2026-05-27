"""
Translation API Endpoint

POST /translate — Translate text using Sarvam AI
"""

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.translation_service import TranslationService

router = APIRouter()


class TranslateRequest(BaseModel):
    """Request body for text translation."""
    text: str = Field(..., min_length=1, max_length=5000)
    target_language: str = Field(
        ...,
        description="ISO 639-1 language code (hi, ta, te, mr, kn, bn)",
    )
    source_language: str = Field(
        default="en",
        description="Source language code",
    )


class TranslateResponse(BaseModel):
    """Translation result."""
    translated_text: str
    source_language: str
    target_language: str


@router.post("/translate", response_model=TranslateResponse)
async def translate_text(request: TranslateRequest):
    """
    Translate text between English and Indian languages using Sarvam AI.

    Supported target languages: hi, ta, te, mr, kn, bn
    """
    service = TranslationService()
    translated = await service.translate(
        text=request.text,
        source_language=request.source_language,
        target_language=request.target_language,
    )

    return TranslateResponse(
        translated_text=translated,
        source_language=request.source_language,
        target_language=request.target_language,
    )
