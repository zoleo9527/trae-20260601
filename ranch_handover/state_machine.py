from datetime import datetime, timezone
from .models import FeedingPlanStatus, RequisitionStatus, FeedingPlan, InventoryRequisition, OperationLog
from .database import get_session


FEEDING_TRANSITIONS = {
    FeedingPlanStatus.draft.value: [FeedingPlanStatus.pending_approval.value, FeedingPlanStatus.cancelled.value],
    FeedingPlanStatus.pending_approval.value: [FeedingPlanStatus.approved.value, FeedingPlanStatus.cancelled.value],
    FeedingPlanStatus.approved.value: [FeedingPlanStatus.in_progress.value, FeedingPlanStatus.blocked.value, FeedingPlanStatus.cancelled.value],
    FeedingPlanStatus.in_progress.value: [FeedingPlanStatus.completed.value, FeedingPlanStatus.blocked.value, FeedingPlanStatus.cancelled.value],
    FeedingPlanStatus.blocked.value: [FeedingPlanStatus.in_progress.value, FeedingPlanStatus.cancelled.value],
    FeedingPlanStatus.completed.value: [],
    FeedingPlanStatus.cancelled.value: [],
}

REQUISITION_TRANSITIONS = {
    RequisitionStatus.requested.value: [RequisitionStatus.pending_approval.value, RequisitionStatus.cancelled.value],
    RequisitionStatus.pending_approval.value: [RequisitionStatus.approved.value, RequisitionStatus.cancelled.value],
    RequisitionStatus.approved.value: [RequisitionStatus.issuing.value, RequisitionStatus.delayed.value, RequisitionStatus.cancelled.value],
    RequisitionStatus.issuing.value: [RequisitionStatus.completed.value, RequisitionStatus.delayed.value, RequisitionStatus.cancelled.value],
    RequisitionStatus.delayed.value: [RequisitionStatus.issuing.value, RequisitionStatus.cancelled.value],
    RequisitionStatus.completed.value: [],
    RequisitionStatus.cancelled.value: [],
}


def can_transition(current, target, transitions=None):
    if transitions is None:
        return False
    allowed = transitions.get(current, [])
    return target in allowed


def _log_action(session, entity_type, entity_id, action, operator_name, operator_role, detail=None):
    log = OperationLog(
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        operator_name=operator_name,
        operator_role=operator_role,
        detail=detail,
    )
    session.add(log)


def check_feeding_completion(plan, session):
    if plan.status not in [FeedingPlanStatus.in_progress.value, FeedingPlanStatus.approved.value]:
        return True, ""
    incomplete = session.query(InventoryRequisition).filter(
        InventoryRequisition.feeding_plan_id == plan.id,
        InventoryRequisition.status.in_([
            RequisitionStatus.requested.value,
            RequisitionStatus.pending_approval.value,
            RequisitionStatus.approved.value,
            RequisitionStatus.issuing.value,
            RequisitionStatus.delayed.value,
        ]),
    ).all()
    if incomplete:
        items = ", ".join(f"#{r.id}({r.status})" for r in incomplete)
        return False, f"关联领用单尚未完成: {items}"
    return True, ""


def auto_block_feeding_plans(req, operator_name, operator_role, session):
    affected_plans = session.query(FeedingPlan).filter(
        FeedingPlan.status.in_([
            FeedingPlanStatus.approved.value,
            FeedingPlanStatus.in_progress.value,
        ]),
    ).all()
    blocked = []
    for plan in affected_plans:
        has_delayed = session.query(InventoryRequisition).filter(
            InventoryRequisition.feeding_plan_id == plan.id,
            InventoryRequisition.id == req.id,
        ).first()
        if not has_delayed:
            continue
        if plan.status == FeedingPlanStatus.blocked.value:
            continue
        old_status = plan.status
        plan.status = FeedingPlanStatus.blocked.value
        plan.blocked_reason = f"关联领用单 #{req.id} 延迟: {req.delay_reason}"
        plan.blocking_requisition_id = req.id
        plan.blocked_at = datetime.now(timezone.utc)
        plan.resolved_at = None
        plan.updated_at = datetime.now(timezone.utc)
        _log_action(
            session, "feeding_plan", plan.id,
            f"自动卡住: {old_status}→已卡住",
            operator_name, operator_role,
            f"饲喂计划 #{plan.id} 因领用单 #{req.id} 延迟被自动卡住",
        )
        blocked.append(plan.id)
    return blocked


def auto_unblock_feeding_plan(req, operator_name, operator_role, session, operator_id=None):
    plans = session.query(FeedingPlan).filter(
        FeedingPlan.blocking_requisition_id == req.id,
        FeedingPlan.status == FeedingPlanStatus.blocked.value,
    ).all()
    unblocked = []
    for plan in plans:
        plan.status = FeedingPlanStatus.in_progress.value
        plan.blocking_requisition_id = None
        plan.resolved_at = datetime.now(timezone.utc)
        old_reason = plan.blocked_reason
        plan.blocked_reason = None
        plan.blocked_at = None
        plan.updated_at = datetime.now(timezone.utc)
        if operator_id:
            plan.assigned_to = operator_id
        _log_action(
            session, "feeding_plan", plan.id,
            "自动解除卡点: 已卡住→执行中",
            operator_name, operator_role,
            f"饲喂计划 #{plan.id} 因领用单 #{req.id} 恢复出库被自动解除卡点（原卡点: {old_reason}）",
        )
        unblocked.append(plan.id)
    return unblocked


def transition_feeding(plan, new_status, operator_name, operator_role, reason=None, blocking_req_id=None, operator_id=None):
    if not can_transition(plan.status, new_status, FEEDING_TRANSITIONS):
        return False, f"不允许从 [{plan.status}] 转到 [{new_status}]"

    if new_status == FeedingPlanStatus.blocked.value:
        if not reason or not reason.strip():
            return False, "卡点原因为必填，不能为空"

    session = get_session()

    if new_status == FeedingPlanStatus.completed.value:
        ok, msg = check_feeding_completion(plan, session)
        if not ok:
            session.close()
            return False, msg

    old_status = plan.status
    plan.status = new_status
    plan.updated_at = datetime.now(timezone.utc)

    if new_status == FeedingPlanStatus.approved.value:
        plan.approved_by = operator_id
        if operator_id:
            plan.assigned_to = operator_id

    if new_status == FeedingPlanStatus.in_progress.value:
        if operator_id:
            plan.assigned_to = operator_id

    if old_status == FeedingPlanStatus.blocked.value and new_status == FeedingPlanStatus.in_progress.value:
        if operator_id:
            plan.assigned_to = operator_id

    if new_status == FeedingPlanStatus.blocked.value:
        plan.blocked_reason = reason.strip()
        plan.blocking_requisition_id = blocking_req_id
        plan.blocked_at = datetime.now(timezone.utc)
        plan.resolved_at = None
    elif old_status == FeedingPlanStatus.blocked.value and new_status == FeedingPlanStatus.in_progress.value:
        plan.resolved_at = datetime.now(timezone.utc)
        plan.blocked_reason = None
        plan.blocking_requisition_id = None
        plan.blocked_at = None

    detail = f"饲喂计划 #{plan.id} 状态变更: {old_status} → {new_status}"
    if reason:
        detail += f" | 原因: {reason}"
    if blocking_req_id:
        detail += f" | 阻塞领用单: #{blocking_req_id}"
    if new_status == FeedingPlanStatus.approved.value and operator_id:
        detail += f" | 审批人自动写入: #{operator_id}"
    _log_action(session, "feeding_plan", plan.id, f"状态变更: {old_status}→{new_status}", operator_name, operator_role, detail)
    session.commit()
    return True, ""


def transition_requisition(req, new_status, operator_name, operator_role, reason=None, operator_id=None):
    if not can_transition(req.status, new_status, REQUISITION_TRANSITIONS):
        return False, f"不允许从 [{req.status}] 转到 [{new_status}]"

    if new_status == RequisitionStatus.delayed.value:
        if not reason or not reason.strip():
            return False, "延迟原因为必填，不能为空"

    session = get_session()
    old_status = req.status
    req.status = new_status
    req.updated_at = datetime.now(timezone.utc)

    if new_status == RequisitionStatus.approved.value:
        req.approved_by = operator_id

    if new_status == RequisitionStatus.issuing.value:
        req.issued_by = operator_id

    auto_blocked_plans = []
    auto_unblocked_plans = []

    if new_status == RequisitionStatus.delayed.value:
        req.delay_reason = reason.strip()
        req.delayed_at = datetime.now(timezone.utc)
        auto_blocked_plans = auto_block_feeding_plans(req, operator_name, operator_role, session)
    elif old_status == RequisitionStatus.delayed.value:
        req.delay_reason = None
        req.delayed_at = None
        if new_status in [RequisitionStatus.issuing.value, RequisitionStatus.completed.value]:
            auto_unblocked_plans = auto_unblock_feeding_plan(req, operator_name, operator_role, session, operator_id=operator_id)

    detail = f"库存领用 #{req.id} 状态变更: {old_status} → {new_status}"
    if reason:
        detail += f" | 原因: {reason}"
    if auto_blocked_plans:
        detail += f" | 自动卡住饲喂计划: {auto_blocked_plans}"
    if auto_unblocked_plans:
        detail += f" | 自动解除饲喂计划卡点: {auto_unblocked_plans}"
    if new_status == RequisitionStatus.approved.value and operator_id:
        detail += f" | 审批人自动写入: #{operator_id}"
    if new_status == RequisitionStatus.issuing.value and operator_id:
        detail += f" | 出库人自动写入: #{operator_id}"
    _log_action(session, "inventory_requisition", req.id, f"状态变更: {old_status}→{new_status}", operator_name, operator_role, detail)
    session.commit()
    return True, ""
