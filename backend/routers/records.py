from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/records", tags=["records"])


@router.get("", response_model=List[schemas.OperationLog])
def get_operation_logs(
    action: Optional[str] = None,
    operator: Optional[str] = None,
    key_id: Optional[int] = None,
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    query = db.query(models.OperationLog).order_by(models.OperationLog.created_at.desc())
    if action:
        query = query.filter(models.OperationLog.action == action)
    if operator:
        query = query.filter(models.OperationLog.operator == operator)
    if key_id:
        query = query.filter(models.OperationLog.key_id == key_id)
    return query.limit(limit).all()
