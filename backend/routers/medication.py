from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

from backend.database import get_db
from backend import models, schemas

router = APIRouter(prefix="/medication", tags=["术后用药"])

STATUS_MAP = {
    "pending": "待护士核对",
    "nurse_confirmed": "护士已核对，待医生复核",
    "surgeon_verified": "医生已复核，待患者确认",
    "patient_acknowledged": "患者已确认",
    "completed": "已完成",
    "exception": "异常"
}


def _medication_to_response(mt: models.MedicationTask):
    return {
        "id": mt.id,
        "patientId": mt.patient_id,
        "patientName": mt.patient.name,
        "surgeryType": mt.patient.surgery_type,
        "surgeryDate": mt.patient.surgery_date,
        "eye": mt.patient.eye,
        "status": mt.status,
        "statusText": STATUS_MAP.get(mt.status, mt.status),
        "items": [
            {
                "id": item.id,
                "name": item.name,
                "specification": item.specification,
                "dosage": item.dosage,
                "frequency": item.frequency,
                "duration": item.duration,
                "notes": item.notes
            }
            for item in mt.items
        ],
        "surgeonName": mt.surgeon_name,
        "nurseName": mt.nurse_name,
        "createdAt": mt.created_at.isoformat() if mt.created_at else "",
        "updatedAt": mt.updated_at.isoformat() if mt.updated_at else "",
        "hasRisk": mt.has_risk,
        "riskReason": mt.risk_reason
    }


@router.get("")
def get_medication_tasks(
    status: Optional[str] = None,
    has_risk: Optional[bool] = None,
    patient_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.MedicationTask).join(models.Patient)

    if status:
        query = query.filter(models.MedicationTask.status == status)
    if has_risk is not None:
        query = query.filter(models.MedicationTask.has_risk == has_risk)
    if patient_name:
        query = query.filter(models.Patient.name.contains(patient_name))

    tasks = query.order_by(models.MedicationTask.created_at.desc()).all()
    return [_medication_to_response(mt) for mt in tasks]


@router.get("/{task_id}")
def get_medication_detail(task_id: str, db: Session = Depends(get_db)):
    mt = db.query(models.MedicationTask).filter(models.MedicationTask.id == task_id).first()
    if not mt:
        raise HTTPException(status_code=404, detail="用药任务不存在")
    return _medication_to_response(mt)


@router.post("/{task_id}/process")
def process_medication(
    task_id: str,
    request: Request,
    body: schemas.ProcessMedicationRequest,
    db: Session = Depends(get_db)
):
    operator_name = request.headers.get("x-user-name", "")
    operator_name = operator_name.encode('latin1').decode('utf-8') if operator_name else "未知用户"
    operator_role = request.headers.get("x-user-role", "")

    role_map = {"nurse": "手术护士", "surgeon": "主刀医生", "specialist": "随访专员"}
    operator_role_text = role_map.get(operator_role, operator_role)

    mt = db.query(models.MedicationTask).filter(models.MedicationTask.id == task_id).first()
    if not mt:
        raise HTTPException(status_code=404, detail="用药任务不存在")

    old_status = mt.status
    mt.status = body.status
    if body.nurse_name:
        mt.nurse_name = body.nurse_name
    mt.updated_at = datetime.now()

    action_map = {
        "nurse_confirm": "护士核对用药",
        "surgeon_verify": "医生复核用药",
        "patient_ack": "患者确认用药",
        "complete": "完成用药指导",
        "mark_exception": "标记异常"
    }

    action = action_map.get(body.action, "处理")
    description = f"{operator_role_text}{operator_name} {action}，状态从【{STATUS_MAP.get(old_status, old_status)}】变更为【{STATUS_MAP.get(body.status, body.status)}】"

    log = models.OperationLog(
        id=str(uuid.uuid4()),
        medication_task_id=task_id,
        task_type="medication",
        operator_name=operator_name,
        operator_role=operator_role_text,
        action=action,
        description=description,
        old_status=old_status,
        new_status=body.status,
        remark=body.remark
    )
    db.add(log)
    db.commit()
    db.refresh(mt)

    return {"success": True, "data": _medication_to_response(mt)}
