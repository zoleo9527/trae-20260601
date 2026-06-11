import io
from datetime import datetime
from typing import Optional
from urllib.parse import quote

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from openpyxl import Workbook
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    Customer,
    FollowUpRecord,
    OwnershipRecord,
    OWNERSHIP_STATUS_LABELS,
    Subscription,
    User,
    VisitRegistration,
    VISIT_STATUS_LABELS,
    VISIT_TYPE_LABELS,
)

router = APIRouter(prefix="/api/export", tags=["导出"])


def _get_user_name(db: Session, uid: int | None) -> str:
    if not uid:
        return ""
    u = db.query(User).filter(User.id == uid).first()
    return u.full_name if u else ""


@router.get("/visits", summary="导出来访登记 Excel")
def export_visits(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(VisitRegistration)
    if start_date:
        q = q.filter(VisitRegistration.visit_time >= start_date)
    if end_date:
        q = q.filter(VisitRegistration.visit_time <= end_date)
    visits = q.order_by(VisitRegistration.visit_time.desc()).all()

    wb = Workbook()
    ws = wb.active
    ws.title = "来访登记"
    headers = [
        "来访编号", "来访时间", "来访类型", "客户姓名", "客户手机号",
        "意向等级", "意向户型", "同行人数", "是否有中介", "中介姓名", "中介电话",
        "状态", "登记人", "分配顾问", "分配时间", "跟进次数", "是否认购", "备注",
    ]
    ws.append(headers)

    for v in visits:
        cust = db.query(Customer).filter(Customer.id == v.customer_id).first()
        follow_cnt = db.query(FollowUpRecord).filter(FollowUpRecord.visit_id == v.id).count()
        has_sub = db.query(Subscription).filter(Subscription.visit_id == v.id).first() is not None
        ws.append([
            v.visit_no,
            v.visit_time.strftime("%Y-%m-%d %H:%M") if v.visit_time else "",
            VISIT_TYPE_LABELS.get(v.visit_type, ""),
            cust.name if cust else "",
            cust.phone if cust else "",
            v.intent_level or "",
            v.interested_house_type or "",
            v.accompany_number,
            "是" if v.has_agent else "否",
            v.agent_name or "",
            v.agent_phone or "",
            VISIT_STATUS_LABELS.get(v.status, ""),
            _get_user_name(db, v.registered_by),
            _get_user_name(db, v.assigned_agent_id),
            v.assigned_at.strftime("%Y-%m-%d %H:%M") if v.assigned_at else "",
            follow_cnt,
            "是" if has_sub else "否",
            v.remark or "",
        ])

    for col in range(1, len(headers) + 1):
        ws.column_dimensions[chr(64 + col) if col <= 26 else "A" + chr(64 + col - 26)].width = 16

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    filename = f"来访登记_{datetime.now().strftime('%Y%m%d%H%M%S')}.xlsx"
    encoded = quote(filename)
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{encoded}"},
    )


@router.get("/ownerships", summary="导出客户归属汇总 Excel")
def export_ownerships(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(OwnershipRecord)
    if start_date:
        q = q.filter(OwnershipRecord.created_at >= start_date)
    if end_date:
        q = q.filter(OwnershipRecord.created_at <= end_date)
    items = q.order_by(OwnershipRecord.created_at.desc()).all()

    wb = Workbook()
    ws = wb.active
    ws.title = "客户归属汇总"
    headers = [
        "归属ID", "来访编号", "来访时间", "客户姓名", "客户手机号",
        "主张归属顾问", "最终归属顾问", "状态",
        "认购编号", "房号", "总面积", "总价",
        "归属理由", "争议理由", "裁决理由",
        "佣金比例", "佣金金额",
        "创建时间", "确认时间", "争议时间", "裁决时间",
    ]
    ws.append(headers)

    for o in items:
        cust = db.query(Customer).filter(Customer.id == o.customer_id).first()
        sub = db.query(Subscription).filter(Subscription.id == o.subscription_id).first() if o.subscription_id else None
        visit = db.query(VisitRegistration).filter(VisitRegistration.id == o.visit_id).first()
        ws.append([
            o.id,
            visit.visit_no if visit else "",
            visit.visit_time.strftime("%Y-%m-%d %H:%M") if (visit and visit.visit_time) else "",
            cust.name if cust else "",
            cust.phone if cust else "",
            _get_user_name(db, o.claimed_agent_id),
            _get_user_name(db, o.confirm_agent_id),
            OWNERSHIP_STATUS_LABELS.get(o.status, ""),
            sub.subscription_no if sub else "",
            f"{sub.building_no}-{sub.unit_no}-{sub.room_no}" if sub else "",
            float(sub.area) if (sub and sub.area) else 0,
            float(sub.total_price) if (sub and sub.total_price) else 0,
            o.ownership_reason or "",
            o.dispute_reason or "",
            o.resolve_reason or "",
            float(o.commission_ratio) if o.commission_ratio else 0,
            float(o.commission_amount) if o.commission_amount else 0,
            o.created_at.strftime("%Y-%m-%d %H:%M") if o.created_at else "",
            o.confirmed_at.strftime("%Y-%m-%d %H:%M") if o.confirmed_at else "",
            o.disputed_at.strftime("%Y-%m-%d %H:%M") if o.disputed_at else "",
            o.resolved_at.strftime("%Y-%m-%d %H:%M") if o.resolved_at else "",
        ])

    for col in range(1, len(headers) + 1):
        ws.column_dimensions[chr(64 + col) if col <= 26 else "A" + chr(64 + col - 26)].width = 18

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    filename = f"客户归属汇总_{datetime.now().strftime('%Y%m%d%H%M%S')}.xlsx"
    encoded = quote(filename)
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{encoded}"},
    )
