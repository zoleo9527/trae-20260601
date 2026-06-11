from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import schemas, crud, auth
from ..database import get_db

router = APIRouter(prefix="/api/history", tags=["历史记录"])


@router.get("/", response_model=List[schemas.HistoryRecord])
def get_history_records(
    skip: int = 0,
    limit: int = 100,
    related_type: Optional[str] = None,
    related_id: Optional[int] = None,
    current_user: schemas.User = Depends(auth.require_roles("admin", "operation", "customer_service", "engineering")),
    db: Session = Depends(get_db)
):
    return crud.get_history_records(db, skip=skip, limit=limit, related_type=related_type, related_id=related_id)
