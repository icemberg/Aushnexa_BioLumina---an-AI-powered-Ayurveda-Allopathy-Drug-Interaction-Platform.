"""
Interaction Checker API Endpoints

POST /check-interactions — Main interaction check endpoint
GET  /normalize          — Entity name normalization
"""

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.connection import get_db
from app.db.models import User
from app.api.deps import get_optional_user
from app.schemas.interaction import (
    InteractionRequest,
    InteractionResponse,
    NormalizedItem,
)
from app.services.interaction_service import InteractionService
from app.services.normalization_service import NormalizationService

router = APIRouter()


@router.post("/check-interactions", response_model=InteractionResponse)
async def check_interactions(
    request: InteractionRequest,
    fastapi_req: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    """
    Check for potential interactions between medications and herbs.
    """
    service = InteractionService()
    result = await service.check_interactions(
        items=request.items,
        language=request.language,
        patient_context=request.patient_context,
    )

    client_ip = fastapi_req.client.host if fastapi_req.client else None

    await service.record_query_history(
        db=db,
        request=request,
        result=result,
        user=current_user,
        ip_address=client_ip
    )

    return result


@router.get("/normalize", response_model=NormalizedItem)
async def normalize_entity(
    q: str = Query(..., min_length=1, max_length=200, description="Entity name to normalize"),
):
    """
    Normalize a medication or herb name to its canonical form.
    """
    service = NormalizationService()
    return await service.normalize(q)
