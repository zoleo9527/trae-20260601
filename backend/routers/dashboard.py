from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List
from datetime import datetime, timedelta
import uuid

from backend.database import get_db
from backend import models, schemas

router = APIRouter(prefix="/dashboard", tags=["仪表盘"])


@router.get("/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(request: Request, db: Session = Depends(get_db)):
    today = datetime.now().strftime("%Y-%m-%d")

    pending_statuses = ["pending", "nurse_confirmed", "notified", "confirmed"]

    pending_medication = db.query(models.MedicationTask).filter(
        models.MedicationTask.status.in_(["pending", "nurse_confirmed"])
    ).all()

    pending_followup = db.query(models.FollowupTask).filter(
        models.FollowupTask.status.in_(["pending", "notified", "confirmed"])
    ).all()

    today_medication = db.query(models.MedicationTask).join(models.Patient).filter(
        models.Patient.surgery_date == today
    ).count()

    today_followup = db.query(models.FollowupTask).filter(
        models.FollowupTask.scheduled_date == today
    ).count()

    risk_items_data = []
    for mt in pending_medication:
        if mt.has_risk:
            risk_items_data.append({
                "id": mt.id,
                "type": "medication",
                "patientName": mt.patient.name,
                "reason": mt.risk_reason or "用药有风险",
                "level": "high" if "过敏" in (mt.risk_reason or "") else "medium"
            })

    for ft in pending_followup:
        if ft.has_risk:
            risk_items_data.append({
                "id": ft.id,
                "type": "followup",
                "patientName": ft.patient.name,
                "reason": ft.risk_reason or "复诊有风险",
                "level": "high" if "高眼压" in (ft.risk_reason or "") else "medium"
            })

    todo_items_data = []
    for mt in pending_medication:
        if mt.status == "pending":
            title = "护士核对用药"
            priority = "high"
        else:
            title = "医生复核用药"
            priority = "medium"
        todo_items_data.append({
            "id": mt.id,
            "type": "medication",
            "patientName": mt.patient.name,
            "title": f"{mt.patient.name} - {title}",
            "priority": priority,
            "time": mt.created_at.strftime("%H:%M") if mt.created_at else ""
        })

    for ft in pending_followup:
        if ft.status == "pending":
            title = "待联系患者"
            priority = "high" if ft.has_risk else "medium"
        elif ft.status == "notified":
            title = "待患者确认"
            priority = "medium"
        else:
            title = "已确认待复诊"
            priority = "low"

        scheduled_dt = f"{ft.scheduled_date} {ft.scheduled_time}"
        todo_items_data.append({
            "id": ft.id,
            "type": "followup",
            "patientName": ft.patient.name,
            "title": f"{ft.patient.name} - {ft.followup_type} {title}",
            "priority": priority,
            "time": scheduled_dt
        })

    todo_items_data.sort(key=lambda x: {"high": 0, "medium": 1, "low": 2}[x["priority"]])

    logs = db.query(models.OperationLog).order_by(models.OperationLog.created_at.desc()).limit(10).all()
    recent_changes_data = []
    for log in logs:
        patient_name = ""
        if log.medication_task:
            patient_name = log.medication_task.patient.name
        elif log.followup_task:
            patient_name = log.followup_task.patient.name

        recent_changes_data.append({
            "id": log.id,
            "type": log.task_type,
            "patientName": patient_name,
            "action": log.action,
            "operatorName": log.operator_name,
            "time": log.created_at.strftime("%m-%d %H:%M") if log.created_at else ""
        })

    return schemas.DashboardStats(
        todoCount=len(todo_items_data),
        riskCount=len(risk_items_data),
        todayMedicationCount=today_medication,
        todayFollowupCount=today_followup,
        pendingMedicationCount=len(pending_medication),
        pendingFollowupCount=len(pending_followup),
        todoItems=todo_items_data[:8],
        riskItems=risk_items_data,
        recentChanges=recent_changes_data
    )
