from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text, desc
from datetime import datetime, timedelta
import io
import csv
from typing import List, Optional

from app.db.connection import get_db
from app.db.models import User, QueryHistory, Institution
from app.api.deps import require_role
from app.cache.redis import get_redis
from app.graph.connection import get_driver

router = APIRouter(dependencies=[Depends(require_role(["ADMIN"]))])

@router.get("/system-status")
async def system_status(db: AsyncSession = Depends(get_db)):
    """System health and uptime metrics."""
    # Uptime from Redis
    redis_client = get_redis()
    uptime_pct = "99.998%" # Placeholder for UI
    start_time_iso = await redis_client.get("system:start_time") if redis_client else None
    
    last_sync = start_time_iso if start_time_iso else datetime.utcnow().isoformat()
    
    # Network Sync (Check DBs)
    network_sync_active = True
    try:
        # Check PG
        await db.execute(text("SELECT 1"))
        # Check Redis
        if redis_client:
            await redis_client.ping()
        else:
            network_sync_active = False
        # Check Neo4j
        driver = get_driver()
        async with driver.session() as session:
            await session.run("RETURN 1")
    except Exception:
        network_sync_active = False

    return {
        "uptime": uptime_pct,
        "network_sync_active": network_sync_active,
        "last_sync_timestamp": last_sync
    }

@router.get("/metrics")
async def metrics(db: AsyncSession = Depends(get_db)):
    now = datetime.utcnow()
    last_24h = now - timedelta(hours=24)
    previous_24h = now - timedelta(hours=48)
    
    # 1. Active protocols (last 24 hours)
    active_protocols_query = select(func.count(QueryHistory.id)).where(QueryHistory.created_at >= last_24h)
    active_protocols = (await db.execute(active_protocols_query)).scalar() or 0
    
    prev_protocols_query = select(func.count(QueryHistory.id)).where(
        QueryHistory.created_at >= previous_24h,
        QueryHistory.created_at < last_24h
    )
    prev_protocols = (await db.execute(prev_protocols_query)).scalar() or 0
    
    if prev_protocols == 0:
        change_pct = 100 if active_protocols > 0 else 0
    else:
        change_pct = round(((active_protocols - prev_protocols) / prev_protocols) * 100)
    
    # History for 7 days
    history = []
    for i in range(6, -1, -1):
        day_start = now - timedelta(days=i+1)
        day_end = now - timedelta(days=i)
        count = (await db.execute(
            select(func.count(QueryHistory.id)).where(
                QueryHistory.created_at >= day_start,
                QueryHistory.created_at < day_end
            )
        )).scalar() or 0
        history.append(count)
        
    # 2. Total Neo4j nodes
    total_nodes = 0
    try:
        driver = get_driver()
        async with driver.session() as session:
            res = await session.run("MATCH (n) RETURN count(n) AS count")
            record = await res.single()
            if record:
                total_nodes = record["count"]
    except Exception:
        pass
        
    # 3. AI Calibration Confidence
    confidence = 95.0
    redis_client = get_redis()
    if redis_client:
        conf_val = await redis_client.get("admin:ai_calibration_confidence")
        if conf_val:
            confidence = float(conf_val)

    # Format nodes
    if total_nodes > 1000000:
        nodes_str = f"{total_nodes / 1000000:.1f}M"
    elif total_nodes > 1000:
        nodes_str = f"{total_nodes / 1000:.1f}K"
    else:
        nodes_str = str(total_nodes)

    return {
        "active_protocols": active_protocols,
        "protocols_change_pct": change_pct,
        "protocols_history": history,
        "total_nodes_formatted": nodes_str,
        "total_nodes": total_nodes,
        "ai_calibration_confidence": confidence
    }

@router.get("/access-logs")
async def get_access_logs(
    page: int = 1,
    limit: int = 20,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    offset = (page - 1) * limit
    
    query = select(QueryHistory, Institution).outerjoin(
        Institution, QueryHistory.institution_id == Institution.id
    )
    
    if status and status.lower() != 'all':
        query = query.where(func.lower(QueryHistory.risk_status) == status.lower())
        
    query = query.order_by(desc(QueryHistory.created_at))
    query = query.offset(offset).limit(limit)
    
    result = await db.execute(query)
    rows = result.all()
    
    # Total count
    count_query = select(func.count(QueryHistory.id))
    if status and status.lower() != 'all':
        count_query = count_query.where(func.lower(QueryHistory.risk_status) == status.lower())
    total_count = (await db.execute(count_query)).scalar() or 0
    
    logs = []
    for qh, inst in rows:
        logs.append({
            "id": str(qh.id),
            "timestamp": qh.created_at.isoformat() + "Z",
            "query_protocol": qh.query_protocol or "Unknown",
            "risk_status": qh.risk_status or "verified",
            "anomaly_reason": qh.anomaly_reason,
            "institution_name": inst.name if inst else "Unknown",
            "institution_type": inst.type if inst else "Unknown",
            "request_json": qh.request_json,
            "response_summary": qh.overall_risk
        })
        
    return {
        "data": logs,
        "total": total_count,
        "page": page,
        "limit": limit,
        "total_pages": (total_count + limit - 1) // limit
    }

@router.post("/access-logs/{log_id}/verify")
async def verify_institution(log_id: str, db: AsyncSession = Depends(get_db)):
    qh = await db.execute(select(QueryHistory).where(QueryHistory.id == log_id))
    qh = qh.scalar_one_or_none()
    if not qh:
        raise HTTPException(status_code=404, detail="Log not found")
        
    if qh.institution_id:
        inst = await db.execute(select(Institution).where(Institution.id == qh.institution_id))
        inst = inst.scalar_one_or_none()
        if inst:
            inst.is_verified = True
            
    qh.risk_status = "verified"
    await db.commit()
    return {"status": "success"}

@router.get("/access-logs/export")
async def export_logs(db: AsyncSession = Depends(get_db)):
    query = select(QueryHistory, Institution).outerjoin(
        Institution, QueryHistory.institution_id == Institution.id
    ).order_by(desc(QueryHistory.created_at))
    
    result = await db.execute(query)
    rows = result.all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Timestamp", "Institution", "Type", "Protocol", "Status", "Anomaly Reason", "IP Address"])
    
    for qh, inst in rows:
        writer.writerow([
            str(qh.id),
            qh.created_at.isoformat() + "Z",
            inst.name if inst else "Unknown",
            inst.type if inst else "Unknown",
            qh.query_protocol,
            qh.risk_status,
            qh.anomaly_reason or "",
            qh.ip_address or ""
        ])
        
    response = StreamingResponse(iter([output.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=access_logs.csv"
    return response
