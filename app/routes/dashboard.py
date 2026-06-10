from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import (
    AbnormalAlert,
    AlertSeverity,
    AlertStatus,
    BatchStatus,
    ExecutionResult,
    ImmunizationExecution,
    ImmunizationPlan,
    MedicationRecord,
    PigBatch,
    PlanStatus,
)
from app.schemas.schemas import (
    BatchTimeline,
    WithdrawalCheckRequest,
    WithdrawalCheckResult,
)
from app.services.business import (
    check_withdrawal_block,
    compute_truly_overdue,
    get_batch_timeline,
    reconcile_and_sync,
)

router = APIRouter(prefix="/api/dashboard", tags=["场长看板"])


@router.get("/overview", summary="场长-总览统计")
def dashboard_overview(db: Session = Depends(get_db)):
    reconcile_and_sync(db)

    active_batches = db.query(func.count(PigBatch.id)).filter(
        PigBatch.batch_status == BatchStatus.ACTIVE
    ).scalar()
    isolated_batches = db.query(func.count(PigBatch.id)).filter(
        PigBatch.batch_status == BatchStatus.ISOLATED
    ).scalar()
    total_batches = active_batches + isolated_batches

    completed_plans = db.query(func.count(ImmunizationPlan.id)).filter(
        ImmunizationPlan.plan_status == PlanStatus.COMPLETED
    ).scalar()
    pending_plans = db.query(func.count(ImmunizationPlan.id)).filter(
        ImmunizationPlan.plan_status == PlanStatus.PENDING
    ).scalar()

    truly_overdue_plans = compute_truly_overdue(db, date.today())

    missed_executions = db.query(func.count(ImmunizationExecution.id)).filter(
        ImmunizationExecution.result == ExecutionResult.MISSED
    ).scalar()
    makeup_executions = db.query(func.count(ImmunizationExecution.id)).filter(
        ImmunizationExecution.result == ExecutionResult.MAKEUP
    ).scalar()
    delayed_executions = db.query(func.count(ImmunizationExecution.id)).filter(
        ImmunizationExecution.result == ExecutionResult.DELAYED
    ).scalar()

    active_alerts = db.query(func.count(AbnormalAlert.id)).filter(
        AbnormalAlert.alert_status == AlertStatus.ACTIVE
    ).scalar()
    critical_alerts = db.query(func.count(AbnormalAlert.id)).filter(
        AbnormalAlert.alert_status == AlertStatus.ACTIVE,
        AbnormalAlert.severity == AlertSeverity.CRITICAL,
    ).scalar()
    warning_alerts = db.query(func.count(AbnormalAlert.id)).filter(
        AbnormalAlert.alert_status == AlertStatus.ACTIVE,
        AbnormalAlert.severity == AlertSeverity.WARNING,
    ).scalar()

    in_withdrawal = db.query(func.count(MedicationRecord.id)).filter(
        MedicationRecord.withdrawal_end_date > date.today()
    ).scalar()

    return {
        "batches": {
            "total": total_batches,
            "active": active_batches,
            "isolated": isolated_batches,
        },
        "immunization": {
            "completed_plans": completed_plans,
            "pending_plans": pending_plans,
            "truly_overdue_plans": len(truly_overdue_plans),
            "missed_executions": missed_executions,
            "makeup_executions": makeup_executions,
            "delayed_executions": delayed_executions,
        },
        "alerts": {
            "active": active_alerts,
            "critical": critical_alerts,
            "warning": warning_alerts,
        },
        "medication": {
            "in_withdrawal": in_withdrawal,
        },
    }


@router.post(
    "/withdrawal-check",
    response_model=WithdrawalCheckResult,
    summary="停药期检查-影响转栏/淘汰/销售判断",
)
def withdrawal_check(req: WithdrawalCheckRequest, db: Session = Depends(get_db)):
    return check_withdrawal_block(req, db)


@router.get(
    "/batch-timeline/{batch_id}",
    response_model=BatchTimeline,
    summary="批次全生命周期时间线（免疫+用药+转栏）",
)
def batch_timeline(batch_id: int, db: Session = Depends(get_db)):
    return get_batch_timeline(batch_id, db)


@router.post(
    "/detect-overdue",
    summary="主动检测逾期免疫计划并生成异常提醒",
)
def run_overdue_detection(db: Session = Depends(get_db)):
    result = reconcile_and_sync(db)
    return {
        "status_changes": result["status_changes"],
        "alerts_created": result["alerts_created"],
    }
