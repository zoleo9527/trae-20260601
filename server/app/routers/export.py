import csv
import io
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ..models import PublicRepair, EngineeringDispatch, User
from ..schemas import ExportRequest
from ..auth import get_current_user, require_role, RoleType
from ..database import get_db

router = APIRouter(prefix="/api/export", tags=["数据导出"])


@router.post("/repairs", summary="导出报修记录CSV")
def export_repairs(
    data: ExportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleType.ADMIN.value, RoleType.OPERATION.value, RoleType.SERVICE_DESK.value)),
):
    query = db.query(PublicRepair)
    if data.start_date:
        query = query.filter(PublicRepair.created_at >= datetime.fromisoformat(data.start_date))
    if data.end_date:
        query = query.filter(PublicRepair.created_at <= datetime.fromisoformat(data.end_date))
    if data.status:
        query = query.filter(PublicRepair.status == data.status)

    repairs = query.order_by(PublicRepair.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "报修单号", "标题", "描述", "位置", "来源", "紧急程度",
        "活动占道", "活动名称", "租户超时", "投诉归属不清", "投诉编号",
        "状态", "SLA截止时间", "报修人ID", "处理人ID",
        "创建时间", "受理时间", "派单时间", "完工时间", "关闭时间",
    ])
    for r in repairs:
        writer.writerow([
            r.repair_no, r.title, r.description, r.location, r.source, r.urgency,
            r.activity_occupation, r.activity_name or "", r.tenant_timeout,
            r.complaint_ambiguous, r.complaint_ref or "",
            r.status, str(r.sla_deadline), r.reporter_id or "", r.handler_id or "",
            str(r.created_at) if r.created_at else "",
            str(r.accepted_at) if r.accepted_at else "",
            str(r.dispatched_at) if r.dispatched_at else "",
            str(r.completed_at) if r.completed_at else "",
            str(r.closed_at) if r.closed_at else "",
        ])

    output.seek(0)
    filename = f"repairs_{datetime.now().strftime('%Y%m%d%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.post("/dispatches", summary="导出派单记录CSV")
def export_dispatches(
    data: ExportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleType.ADMIN.value, RoleType.OPERATION.value, RoleType.SERVICE_DESK.value)),
):
    query = db.query(EngineeringDispatch)
    if data.start_date:
        query = query.filter(EngineeringDispatch.created_at >= datetime.fromisoformat(data.start_date))
    if data.end_date:
        query = query.filter(EngineeringDispatch.created_at <= datetime.fromisoformat(data.end_date))
    if data.status:
        query = query.filter(EngineeringDispatch.status == data.status)

    dispatches = query.order_by(EngineeringDispatch.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "派单号", "报修单ID", "工作内容", "工种", "预计工时",
        "状态", "SLA截止时间", "派单人ID", "工程师ID",
        "创建时间", "接单时间", "施工时间", "完工时间", "验证时间",
        "完工说明", "材料使用", "照片",
    ])
    for d in dispatches:
        writer.writerow([
            d.dispatch_no, d.repair_id, d.work_content, d.work_type or "",
            d.estimated_hours,
            d.status, str(d.sla_deadline), d.dispatcher_id or "", d.engineer_id or "",
            str(d.created_at) if d.created_at else "",
            str(d.accepted_at) if d.accepted_at else "",
            str(d.started_at) if d.started_at else "",
            str(d.completed_at) if d.completed_at else "",
            str(d.verified_at) if d.verified_at else "",
            d.completion_note or "", d.material_usage or "", d.photos or "",
        ])

    output.seek(0)
    filename = f"dispatches_{datetime.now().strftime('%Y%m%d%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
