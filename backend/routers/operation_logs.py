from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from backend.database import get_db
from backend import models

router = APIRouter(prefix="/operation-logs", tags=["操作日志"])


@router.get("")
def get_operation_logs(
    taskId: Optional[str] = Query(None, description="任务ID"),
    db: Session = Depends(get_db)
):
    query = db.query(models.OperationLog)

    if taskId:
        query = query.filter(
            (models.OperationLog.medication_task_id == taskId) |
            (models.OperationLog.followup_task_id == taskId)
        )

    logs = query.order_by(models.OperationLog.created_at.desc()).all()

    result = []
    for log in logs:
        result.append({
            "id": log.id,
            "taskId": log.medication_task_id or log.followup_task_id,
            "taskType": log.task_type,
            "operatorName": log.operator_name,
            "operatorRole": log.operator_role,
            "action": log.action,
            "description": log.description,
            "oldStatus": log.old_status,
            "newStatus": log.new_status,
            "remark": log.remark,
            "createdAt": log.created_at.isoformat() if log.created_at else ""
        })

    return result
