from fastapi import APIRouter, Query
from database import get_db
from models import OperationLogResponse

router = APIRouter(prefix="/api/logs", tags=["logs"])


@router.get("")
def list_logs(
    entity_type: str | None = Query(None),
    entity_id: int | None = Query(None),
    action: str | None = Query(None),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    conn = get_db()
    try:
        conditions = []
        params = []
        if entity_type:
            conditions.append("entity_type = ?")
            params.append(entity_type)
        if entity_id is not None:
            conditions.append("entity_id = ?")
            params.append(entity_id)
        if action:
            conditions.append("action = ?")
            params.append(action)
        if date_from:
            conditions.append("created_at >= ?")
            params.append(date_from)
        if date_to:
            conditions.append("created_at <= ?")
            params.append(date_to)
        where = " WHERE " + " AND ".join(conditions) if conditions else ""
        total = conn.execute(f"SELECT COUNT(*) FROM operation_logs{where}", params).fetchone()[0]
        offset = (page - 1) * page_size
        rows = conn.execute(
            f"SELECT * FROM operation_logs{where} ORDER BY created_at DESC LIMIT ? OFFSET ?",
            params + [page_size, offset],
        ).fetchall()
        items = [
            OperationLogResponse(
                id=r["id"],
                entity_type=r["entity_type"],
                entity_id=r["entity_id"],
                action=r["action"],
                detail=r["detail"],
                operator=r["operator"],
                created_at=r["created_at"],
            )
            for r in rows
        ]
        return {"items": items, "total": total}
    finally:
        conn.close()
