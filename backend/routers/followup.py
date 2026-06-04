from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

from backend.database import get_db
from backend import models, schemas

router = APIRouter(prefix="/followup", tags=["复诊提醒"])

STATUS_MAP = {
    "pending": "待联系",
    "notified": "已通知待确认",
    "confirmed": "已确认待复诊",
    "completed": "复诊完成",
    "rescheduled": "已改期",
    "missed": "未到诊"
}


def _followup_to_response(ft: models.FollowupTask):
    return {
        "id": ft.id,
        "patientId": ft.patient_id,
        "patientName": ft.patient.name,
        "phone": ft.patient.phone,
        "surgeryDate": ft.patient.surgery_date,
        "surgeryType": ft.patient.surgery_type,
        "scheduledDate": ft.scheduled_date,
        "scheduledTime": ft.scheduled_time,
        "status": ft.status,
        "statusText": STATUS_MAP.get(ft.status, ft.status),
        "followupType": ft.followup_type,
        "content": ft.content,
        "specialistName": ft.specialist_name,
        "previousTaskId": ft.previous_task_id,
        "createdAt": ft.created_at.isoformat() if ft.created_at else "",
        "updatedAt": ft.updated_at.isoformat() if ft.updated_at else "",
        "hasRisk": ft.has_risk,
        "riskReason": ft.risk_reason
    }


@router.get("")
def get_followup_tasks(
    status: Optional[str] = None,
    has_risk: Optional[bool] = None,
    patient_name: Optional[str] = None,
    followup_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.FollowupTask).join(models.Patient)

    if status:
        query = query.filter(models.FollowupTask.status == status)
    if has_risk is not None:
        query = query.filter(models.FollowupTask.has_risk == has_risk)
    if patient_name:
        query = query.filter(models.Patient.name.contains(patient_name))
    if followup_type:
        query = query.filter(models.FollowupTask.followup_type == followup_type)

    tasks = query.order_by(
        models.FollowupTask.scheduled_date.asc(),
        models.FollowupTask.scheduled_time.asc()
    ).all()
    return [_followup_to_response(ft) for ft in tasks]


@router.get("/{task_id}")
def get_followup_detail(task_id: str, db: Session = Depends(get_db)):
    ft = db.query(models.FollowupTask).filter(models.FollowupTask.id == task_id).first()
    if not ft:
        raise HTTPException(status_code=404, detail="复诊任务不存在")

    response = _followup_to_response(ft)

    if ft.previous_task_id:
        prev_ft = db.query(models.FollowupTask).filter(
            models.FollowupTask.id == ft.previous_task_id
        ).first()
        if prev_ft:
            response["previousTask"] = _followup_to_response(prev_ft)

    next_tasks = db.query(models.FollowupTask).filter(
        models.FollowupTask.previous_task_id == task_id
    ).all()
    response["nextTasks"] = [_followup_to_response(nft) for nft in next_tasks]

    return response


@router.post("/{task_id}/process")
def process_followup(
    task_id: str,
    request: Request,
    body: schemas.ProcessFollowupRequest,
    db: Session = Depends(get_db)
):
    if not body.remark or not body.remark.strip():
        raise HTTPException(status_code=400, detail="请输入处理备注，说明为什么要这样处理")

    operator_name = request.headers.get("x-user-name", "")
    operator_name = operator_name.encode('latin1').decode('utf-8') if operator_name else "未知用户"
    operator_role = request.headers.get("x-user-role", "")

    role_map = {"nurse": "手术护士", "surgeon": "主刀医生", "specialist": "随访专员"}
    operator_role_text = role_map.get(operator_role, operator_role)

    ft = db.query(models.FollowupTask).filter(models.FollowupTask.id == task_id).first()
    if not ft:
        raise HTTPException(status_code=404, detail="复诊任务不存在")

    old_status = ft.status
    ft.status = body.status
    if body.specialist_name:
        ft.specialist_name = body.specialist_name
    if body.scheduled_date:
        ft.scheduled_date = body.scheduled_date
    if body.scheduled_time:
        ft.scheduled_time = body.scheduled_time
    ft.updated_at = datetime.now()

    action_map = {
        "notify_patient": "通知患者",
        "confirm_attendance": "确认到诊",
        "complete_followup": "完成复诊",
        "reschedule": "改期",
        "mark_missed": "标记未到诊"
    }

    action = action_map.get(body.action, "处理")
    description = f"{operator_role_text}{operator_name} {action}，状态从【{STATUS_MAP.get(old_status, old_status)}】变更为【{STATUS_MAP.get(body.status, body.status)}】"

    if body.scheduled_date or body.scheduled_time:
        description += f"，复诊时间调整为 {body.scheduled_date or ft.scheduled_date} {body.scheduled_time or ft.scheduled_time}"

    log = models.OperationLog(
        id=str(uuid.uuid4()),
        followup_task_id=task_id,
        task_type="followup",
        operator_name=operator_name,
        operator_role=operator_role_text,
        action=action,
        description=description,
        old_status=old_status,
        new_status=body.status,
        remark=body.remark.strip()
    )
    db.add(log)
    db.commit()
    db.refresh(ft)

    return {"success": True, "data": _followup_to_response(ft)}
