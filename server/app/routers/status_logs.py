from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..models import StatusLog
from ..schemas import StatusLogResponse
from ..auth import get_current_user
from ..database import get_db

router = APIRouter(prefix="/api/status-logs", tags=["状态日志"])


@router.get("", response_model=list[StatusLogResponse], summary="状态日志查询")
def list_status_logs(
    repair_id: Optional[int] = None,
    dispatch_id: Optional[int] = None,
    operator_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(StatusLog)
    if repair_id:
        query = query.filter(StatusLog.repair_id == repair_id)
    if dispatch_id:
        query = query.filter(StatusLog.dispatch_id == dispatch_id)
    if operator_id:
        query = query.filter(StatusLog.operator_id == operator_id)
    if start_date:
        query = query.filter(StatusLog.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(StatusLog.created_at <= datetime.fromisoformat(end_date))

    items = (
        query.order_by(StatusLog.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return [
        StatusLogResponse(
            id=sl.id,
            repair_id=sl.repair_id,
            dispatch_id=sl.dispatch_id,
            from_status=sl.from_status,
            to_status=sl.to_status,
            operator_id=sl.operator_id,
            operator_name=sl.operator_name,
            operator_role=sl.operator_role,
            remark=sl.remark,
            created_at=sl.created_at,
        )
        for sl in items
    ]
