from datetime import date

from sqlalchemy.orm import Session

from app.models.models import (
    AbnormalAlert,
    AlertSeverity,
    AlertStatus,
    ExecutionResult,
    ImmunizationExecution,
    ImmunizationPlan,
    MedicationRecord,
    Pen,
    PigBatch,
    PlanStatus,
    WithdrawalBlockReason,
)
from app.schemas.schemas import (
    BatchTimeline,
    BatchTimelineItem,
    WithdrawalCheckRequest,
    WithdrawalCheckResult,
)


def check_withdrawal_block(
    req: WithdrawalCheckRequest, db: Session
) -> WithdrawalCheckResult:
    blocking = (
        db.query(MedicationRecord)
        .filter(
            MedicationRecord.batch_id == req.batch_id,
            MedicationRecord.withdrawal_end_date > req.planned_date,
        )
        .all()
    )
    if blocking:
        drug_names = "、".join(r.drug_name for r in blocking)
        latest_end = max(r.withdrawal_end_date for r in blocking)
        msg = (
            f"该批次仍在停药期内（{drug_names}，最晚停药期至{latest_end}），"
            f"禁止执行{req.action.value}操作"
        )
        return WithdrawalCheckResult(
            blocked=True,
            batch_id=req.batch_id,
            action=req.action,
            planned_date=req.planned_date,
            blocking_records=blocking,
            message=msg,
        )
    return WithdrawalCheckResult(
        blocked=False,
        batch_id=req.batch_id,
        action=req.action,
        planned_date=req.planned_date,
        message=f"该批次不在任何停药期内，可执行{req.action.value}操作",
    )


def detect_overdue_plans(db: Session, reference_date: date | None = None) -> list[AbnormalAlert]:
    ref = reference_date or date.today()
    overdue = (
        db.query(ImmunizationPlan)
        .filter(
            ImmunizationPlan.plan_status == PlanStatus.PENDING,
            ImmunizationPlan.planned_date < ref,
        )
        .all()
    )
    new_alerts = []
    for plan in overdue:
        existing = (
            db.query(AbnormalAlert)
            .filter(
                AbnormalAlert.alert_type == "逾期未执行",
                AbnormalAlert.related_record_id == plan.id,
                AbnormalAlert.related_record_type == "immunization_plan",
                AbnormalAlert.alert_status != AlertStatus.RESOLVED,
            )
            .first()
        )
        if existing:
            continue
        batch = db.get(PigBatch, plan.batch_id)
        batch_code = batch.batch_code if batch else "未知"
        days_overdue = (ref - plan.planned_date).days
        alert = AbnormalAlert(
            batch_id=plan.batch_id,
            pen_id=batch.pen_id if batch else None,
            alert_type="逾期未执行",
            severity=AlertSeverity.CRITICAL if days_overdue > 5 else AlertSeverity.WARNING,
            title=f"{plan.vaccine_name}逾期未执行",
            detail=(
                f"{batch_code}批次{plan.vaccine_name}计划{plan.planned_date}执行，"
                f"至今未执行，已逾期{days_overdue}天"
            ),
            alert_status=AlertStatus.ACTIVE,
            related_record_id=plan.id,
            related_record_type="immunization_plan",
        )
        new_alerts.append(alert)
        plan.plan_status = PlanStatus.OVERDUE

    if new_alerts:
        db.add_all(new_alerts)
        db.commit()
    return new_alerts


def detect_duplicate_medication(
    batch_id: int,
    drug_name: str,
    start_date: date,
    end_date: date,
    db: Session,
    exclude_id: int | None = None,
) -> AbnormalAlert | None:
    q = (
        db.query(MedicationRecord)
        .filter(
            MedicationRecord.batch_id == batch_id,
            MedicationRecord.drug_name == drug_name,
            MedicationRecord.start_date <= end_date,
            MedicationRecord.end_date >= start_date,
        )
    )
    if exclude_id is not None:
        q = q.filter(MedicationRecord.id != exclude_id)
    overlapping = q.first()
    if not overlapping:
        return None
    batch = db.get(PigBatch, batch_id)
    batch_code = batch.batch_code if batch else "未知"
    return AbnormalAlert(
        batch_id=batch_id,
        pen_id=batch.pen_id if batch else None,
        alert_type="重复用药风险",
        severity=AlertSeverity.WARNING,
        title=f"{drug_name}重复用药风险",
        detail=(
            f"{batch_code}批次已存在{drug_name}用药记录"
            f"（{overlapping.start_date}~{overlapping.end_date}），"
            f"与新增用药（{start_date}~{end_date}）时间重叠，请确认是否必要"
        ),
        alert_status=AlertStatus.ACTIVE,
        related_record_id=overlapping.id,
        related_record_type="medication_record",
    )


def generate_withdrawal_alerts_for_batch(
    batch_id: int, db: Session
) -> list[AbnormalAlert]:
    active_meds = (
        db.query(MedicationRecord)
        .filter(
            MedicationRecord.batch_id == batch_id,
            MedicationRecord.withdrawal_end_date > date.today(),
        )
        .all()
    )
    new_alerts = []
    for med in active_meds:
        for reason in WithdrawalBlockReason:
            existing = (
                db.query(AbnormalAlert)
                .filter(
                    AbnormalAlert.batch_id == batch_id,
                    AbnormalAlert.alert_type == "停药期限制",
                    AbnormalAlert.related_record_id == med.id,
                    AbnormalAlert.related_record_type == "medication_record",
                    AbnormalAlert.block_reason == reason,
                    AbnormalAlert.alert_status != AlertStatus.RESOLVED,
                )
                .first()
            )
            if existing:
                continue
            batch = db.get(PigBatch, batch_id)
            batch_code = batch.batch_code if batch else "未知"
            alert = AbnormalAlert(
                batch_id=batch_id,
                pen_id=med.pen_id,
                alert_type="停药期限制",
                severity=AlertSeverity.CRITICAL,
                title=f"停药期内禁止{reason.value}",
                detail=(
                    f"{batch_code}批次使用{med.drug_name}，"
                    f"停药期至{med.withdrawal_end_date}，"
                    f"期间禁止{reason.value}"
                ),
                alert_status=AlertStatus.ACTIVE,
                block_reason=reason,
                related_record_id=med.id,
                related_record_type="medication_record",
            )
            new_alerts.append(alert)
    if new_alerts:
        db.add_all(new_alerts)
        db.commit()
    return new_alerts


def _find_plan_alerts(
    plan_id: int, alert_type: str | None, db: Session
) -> list[AbnormalAlert]:
    q = db.query(AbnormalAlert).filter(
        AbnormalAlert.related_record_id == plan_id,
        AbnormalAlert.related_record_type == "immunization_plan",
        AbnormalAlert.alert_status != AlertStatus.RESOLVED,
    )
    if alert_type:
        q = q.filter(AbnormalAlert.alert_type == alert_type)
    return q.all()


def _resolve_plan_alerts(plan_id: int, alert_type: str | None, db: Session) -> int:
    alerts = _find_plan_alerts(plan_id, alert_type, db)
    for a in alerts:
        a.alert_status = AlertStatus.RESOLVED
    return len(alerts)


def sync_execution_alerts(
    execution: ImmunizationExecution,
    plan: ImmunizationPlan,
    batch: PigBatch,
    db: Session,
) -> list[AbnormalAlert]:
    new_alerts: list[AbnormalAlert] = []
    batch_code = batch.batch_code
    pen_id = batch.pen_id

    if execution.result == ExecutionResult.MISSED:
        missed_count = batch.head_count - execution.head_count_executed
        alert = AbnormalAlert(
            batch_id=batch.id,
            pen_id=pen_id,
            alert_type="漏打疫苗",
            severity=AlertSeverity.WARNING,
            title=f"{plan.vaccine_name}漏打{missed_count}头",
            detail=(
                f"{batch_code}批次{execution.head_count_executed}头已接种"
                f"{plan.vaccine_name}，{missed_count}头漏打"
                + (f"，原因: {execution.reason}" if execution.reason else "")
            ),
            alert_status=AlertStatus.ACTIVE,
            related_record_id=plan.id,
            related_record_type="immunization_plan",
        )
        new_alerts.append(alert)

        existing_overdue = _find_plan_alerts(plan.id, "逾期未执行", db)
        for oa in existing_overdue:
            oa.detail += (
                f"（部分执行:{execution.head_count_executed}头已打，{missed_count}头漏打）"
            )

    elif execution.result == ExecutionResult.MAKEUP:
        _resolve_plan_alerts(plan.id, "漏打疫苗", db)
        _resolve_plan_alerts(plan.id, "逾期未执行", db)

        alert = AbnormalAlert(
            batch_id=batch.id,
            pen_id=pen_id,
            alert_type="补打疫苗",
            severity=AlertSeverity.INFO,
            title=f"{plan.vaccine_name}补打完成",
            detail=(
                f"{batch_code}批次{execution.head_count_executed}头补打{plan.vaccine_name}"
                + (f"，原因: {execution.reason}" if execution.reason else "")
            ),
            alert_status=AlertStatus.ACTIVE,
            related_record_id=plan.id,
            related_record_type="immunization_plan",
        )
        new_alerts.append(alert)

    elif execution.result in (ExecutionResult.COMPLETED, ExecutionResult.DELAYED):
        _resolve_plan_alerts(plan.id, "漏打疫苗", db)
        _resolve_plan_alerts(plan.id, "逾期未执行", db)

        if execution.result == ExecutionResult.DELAYED:
            alert = AbnormalAlert(
                batch_id=batch.id,
                pen_id=pen_id,
                alert_type="延迟执行",
                severity=AlertSeverity.WARNING,
                title=f"{plan.vaccine_name}延迟执行",
                detail=(
                    f"{batch_code}批次{plan.vaccine_name}延迟至{execution.execution_date}执行"
                    + (f"，原因: {execution.reason}" if execution.reason else "")
                ),
                alert_status=AlertStatus.ACTIVE,
                related_record_id=plan.id,
                related_record_type="immunization_plan",
            )
            new_alerts.append(alert)

    if new_alerts:
        db.add_all(new_alerts)
    return new_alerts


def get_batch_timeline(batch_id: int, db: Session) -> BatchTimeline:
    batch = db.get(PigBatch, batch_id)
    if not batch:
        return BatchTimeline(batch_id=batch_id, batch_code="未知", events=[])

    events: list[BatchTimelineItem] = []

    events.append(
        BatchTimelineItem(
            event_type="入群",
            event_date=batch.entry_date,
            title="批次入群",
            detail=f"{batch.breed} {batch.head_count}头入群",
            related_id=batch.id,
            pen_name=batch.pen.pen_name if batch.pen else None,
        )
    )

    if batch.transfer_date and batch.source_pen_id:
        source_pen = db.get(Pen, batch.source_pen_id)
        events.append(
            BatchTimelineItem(
                event_type="转栏",
                event_date=batch.transfer_date,
                title="转栏",
                detail=f"从{source_pen.pen_name if source_pen else '未知'}转入{batch.pen.pen_name if batch.pen else '未知'}",
                related_id=batch.id,
                pen_name=batch.pen.pen_name if batch.pen else None,
            )
        )

    plans = (
        db.query(ImmunizationPlan)
        .filter(ImmunizationPlan.batch_id == batch_id)
        .all()
    )
    for plan in plans:
        events.append(
            BatchTimelineItem(
                event_type="免疫计划",
                event_date=plan.planned_date,
                title=f"计划: {plan.vaccine_name}",
                detail=f"计划{plan.planned_dose}{plan.dose_unit} {plan.route}，状态: {plan.plan_status.value}",
                related_id=plan.id,
                pen_name=batch.pen.pen_name if batch.pen else None,
            )
        )

    executions = (
        db.query(ImmunizationExecution)
        .filter(ImmunizationExecution.batch_id == batch_id)
        .all()
    )
    for ex in executions:
        events.append(
            BatchTimelineItem(
                event_type="免疫执行",
                event_date=ex.execution_date,
                title=f"执行: {ex.result.value}",
                detail=(
                    f"实际{ex.actual_dose}ml {ex.executor} {ex.head_count_executed}头"
                    + (f"，原因: {ex.reason}" if ex.reason else "")
                ),
                related_id=ex.id,
                pen_name=batch.pen.pen_name if batch.pen else None,
            )
        )

    medications = (
        db.query(MedicationRecord)
        .filter(MedicationRecord.batch_id == batch_id)
        .all()
    )
    for med in medications:
        pen = db.get(Pen, med.pen_id)
        events.append(
            BatchTimelineItem(
                event_type="用药记录",
                event_date=med.start_date,
                title=f"用药: {med.drug_name}",
                detail=(
                    f"{med.reason}，{med.dosage}{med.dosage_unit} {med.route} {med.frequency}，"
                    f"停药期至{med.withdrawal_end_date}"
                    + ("（隔离用药）" if med.is_isolation else "")
                ),
                related_id=med.id,
                pen_name=pen.pen_name if pen else None,
            )
        )

    events.sort(key=lambda e: e.event_date)
    return BatchTimeline(
        batch_id=batch_id, batch_code=batch.batch_code, events=events
    )
