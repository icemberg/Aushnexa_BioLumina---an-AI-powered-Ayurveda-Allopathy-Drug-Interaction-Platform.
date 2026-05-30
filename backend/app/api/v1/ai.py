from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from loguru import logger

from app.services.ai_service import AIService
from app.services.tts_service import TTSService

router = APIRouter()
ai_service = AIService()
tts_service = TTSService()

class AIQueryRequest(BaseModel):
    query: str

class TTSRequest(BaseModel):
    text: str = Field(..., max_length=2000)
    language: str = "en"

@router.post("/query")
async def ai_query(req: AIQueryRequest):
    try:
        response = await ai_service.process_query(req.query)
        return response
    except Exception as e:
        logger.error(f"AI Query failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tts")
async def generate_tts(req: TTSRequest):
    try:
        base64_audios = await tts_service.generate_audio(req.text, req.language)
        return {"audios": base64_audios}
    except Exception as e:
        logger.error(f"TTS generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
