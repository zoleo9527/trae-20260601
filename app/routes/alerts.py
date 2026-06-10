from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.models import AbnormalAlert, AlertSeverity, AlertStatus
from app.schemas.schemas import AbnormalAlertCreate, AbnormalAlertRead

router = APIRouter(prefix="/api/alerts", tags=["异常提醒管理"])


@router.get(
    "/",
    response_model=list[AbnormalAlertRead],
    summary="场长-查看异常提醒（漏打、重复用药等）",
)
def list_alerts(
    alert_status: AlertStatus | None = Query(None, description="状态筛选"),
    severity: AlertSeverity | None = Query(None, description="严重级别筛选"),
    alert_type: str | None = Query(None, description="提醒类型筛选"),
    batch_id: int | None = Query(None, description="批次筛选"),
    db: Session = Depends(get_db),
):
    q = db.query(AbnormalAlert)
    if alert_status:
        q = q.filter(AbnormalAlert.alert_status == alert_status)
    if severity:
        q = q.filter(AbnormalAlert.severity == severity)
    if alert_type:
        q = q.filter(AbnormalAlert.alert_type == alert_type)
    if batch_id:
        q = q.filter(AbnormalAlert.batch_id == batch_id)
    return q.order_by(AbnormalAlert.created_at.desc()).all()


@router.get(
    "/{alert_id}",
    response_model=AbnormalAlertRead,
    summary="获取异常提醒详情",
)
def get_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(AbnormalAlert).filter(AbnormalAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="异常提醒不存在")
    return alert


@router.post(
    "/",
    response_model=AbnormalAlertRead,
    summary="新增异常提醒",
)
def create_alert(data: AbnormalAlertCreate, db: Session = Depends(get_db)):
    alert = AbnormalAlert(**data.model_dump())
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


@router.patch(
    "/{alert_id}/acknowledge",
    response_model=AbnormalAlertRead,
    summary="确认异常提醒",
)
def acknowledge_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(AbnormalAlert).filter(AbnormalAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="异常提醒不存在")
    alert.alert_status = AlertStatus.ACKNOWLEDGED
    db.commit()
    db.refresh(alert)
    return alert


@router.patch(
    "/{alert_id}/resolve",
    response_model=AbnormalAlertRead,
    summary="解决异常提醒",
)
def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(AbnormalAlert).filter(AbnormalAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="异常提醒不存在")
    alert.alert_status = AlertStatus.RESOLVED
    db.commit()
    db.refresh(alert)
    return alert
