from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import User, UserRole
from app.schemas import Alert, AlertCreate
from app.services import AlertService

router = APIRouter(prefix="/alerts", tags=["异常提醒"])


def get_current_user(db: Session = Depends(get_db)) -> User:
    return User(id=1, username="test", real_name="测试用户", role=UserRole.CLERK)


@router.post("/", response_model=Alert)
def create_alert(
    alert: AlertCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return AlertService.create_alert(db, alert)


@router.get("/", response_model=List[Alert])
def list_alerts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    unhandled_only: bool = False,
    db: Session = Depends(get_db),
):
    if unhandled_only:
        return AlertService.get_unhandled_alerts(db)
    return db.query(Alert).offset(skip).limit(limit).all()


@router.post("/{alert_id}/handle", response_model=Alert)
def handle_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert = AlertService.handle_alert(db, alert_id, current_user.id)
    if not alert:
        raise HTTPException(status_code=404, detail="提醒不存在")
    return alert


@router.post("/check-stuck")
def check_stuck_alerts(
    days: int = Query(3, ge=1, le=30),
    db: Session = Depends(get_db),
):
    alerts = AlertService.check_and_create_stuck_alerts(db, days)
    return {"created_alerts": len(alerts), "alerts": alerts}