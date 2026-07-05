"""
Query History API Endpoints

GET /history — Retrieve paginated query history for the authenticated user
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.exc import SQLAlchemyError
from loguru import logger
from fastapi import HTTPException

from app.db.connection import get_db
from app.db.models import User, QueryHistory
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/history")
async def get_history(
    page: int = Query(default=1, ge=1, description="Page number"),
    limit: int = Query(default=20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get the authenticated user's interaction check history.
    Results are paginated and sorted by most recent first.
    """
    offset = (page - 1) * limit

    try:
        # Get total count
        count_result = await db.execute(
            select(func.count(QueryHistory.id)).where(
                QueryHistory.user_id == current_user.id
            )
        )
        total = count_result.scalar() or 0

        # Get paginated results
        result = await db.execute(
            select(QueryHistory)
            .where(QueryHistory.user_id == current_user.id)
            .order_by(desc(QueryHistory.created_at))
            .offset(offset)
            .limit(limit)
        )
        queries = result.scalars().all()
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching query history: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

    return {
        "items": [
            {
                "id": str(q.id),
                "items": q.items,
                "items_checked": q.items_checked,
                "language": q.language,
                "overall_risk": q.overall_risk,
                "risk_score": q.risk_score,
                "overall_score": q.overall_score,
                "interactions_found": q.interactions_found,
                "processing_time_ms": q.processing_time_ms,
                "created_at": q.created_at.isoformat(),
                "response": q.response_json,
            }
            for q in queries
        ],
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
    }
