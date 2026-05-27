from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from loguru import logger

from app.services.ai_service import AIService

router = APIRouter()
ai_service = AIService()

class AIQueryRequest(BaseModel):
    query: str

@router.post("/query")
async def ai_query(req: AIQueryRequest):
    try:
        response = await ai_service.process_query(req.query)
        return response
    except Exception as e:
        logger.error(f"AI Query failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
