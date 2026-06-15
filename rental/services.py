from django.db import transaction
from django.utils import timezone

from rental.models import (
    Equipment,
    EquipmentStatus,
    MaintenanceRecord,
    MaintenanceStatus,
    NotificationLog,
    NotificationType,
    RentalContract,
    RentalSuspension,
    StatusChangeLog,
    SuspensionStatus,
    Role,
)


def _log_status_change(entity_type, entity_id, old_status, new_status, changed_by="", reason=""):
    StatusChangeLog.objects.create(
        entity_type=entity_type,
        entity_id=entity_id,
        old_status=old_status,
        new_status=new_status,
        changed_by=changed_by,
        reason=reason,
    )


def _create_notification(notification_type, target_role, title, content, maintenance=None, suspension=None, equipment=None):
    NotificationLog.objects.create(
        notification_type=notification_type,
        target_role=target_role,
        title=title,
        content=content,
        related_maintenance=maintenance,
        related_suspension=suspension,
        related_equipment=equipment,
    )


def _update_equipment_status(equipment, new_status, changed_by="", reason=""):
    old_status = equipment.status
    if old_status == new_status:
        return
    equipment.status = new_status
    equipment.save(update_fields=["status", "updated_at"])
    _log_status_change("equipment", equipment.id, old_status, new_status, changed_by, reason)
    _create_notification(
        NotificationType.EQUIPMENT_STATUS_CHANGED,
        Role.DISPATCHER,
        f"设备状态变更: {equipment.code}",
        f"{equipment.code}({equipment.name}) 状态从 {old_status} 变更为 {new_status}。原因: {reason}",
        equipment=equipment,
    )


def build_maintenance_snapshot(equipment):
    records = MaintenanceRecord.objects.filter(equipment=equipment).order_by("-created_at")[:10]
    return [
        {
            "id": r.id,
            "type": r.maintenance_type,
            "type_display": r.get_maintenance_type_display(),
            "status": r.status,
            "status_display": r.get_status_display(),
            "fault_description": r.fault_description,
            "repair_notes": r.repair_notes,
            "cost": str(r.cost),
            "cost_bearer": r.cost_bearer,
            "assigned_mechanic": r.assigned_mechanic,
            "completed_at": r.completed_at.isoformat() if r.completed_at else None,
        }
        for r in records
    ]


@transaction.atomic
def create_maintenance_record(data: dict) -> MaintenanceRecord:
    equipment = Equipment.objects.get(pk=data["equipment_id"])
    contract = None
    if data.get("contract_id"):
        contract = RentalContract.objects.get(pk=data["contract_id"])

    record = MaintenanceRecord.objects.create(
        equipment=equipment,
        contract=contract,
        maintenance_type=data["maintenance_type"],
        reported_by=data.get("reported_by", ""),
        assigned_mechanic=data.get("assigned_mechanic", ""),
        fault_description=data.get("fault_description", ""),
        repair_notes=data.get("repair_notes", ""),
        cost=data.get("cost", 0),
        cost_bearer=data.get("cost_bearer", ""),
    )

    _update_equipment_status(equipment, EquipmentStatus.IN_MAINTENANCE, data.get("reported_by", ""), "创建维保记录")

    _create_notification(
        NotificationType.MAINTENANCE_CREATED,
        Role.MECHANIC,
        f"新维保工单: {equipment.code}",
        f"设备 {equipment.code}({equipment.name}) 有新的{record.get_maintenance_type_display()}工单，故障: {record.fault_description or '无'}",
        maintenance=record,
        equipment=equipment,
    )
    _create_notification(
        NotificationType.MAINTENANCE_CREATED,
        Role.DISPATCHER,
        f"维保调度: {equipment.code}",
        f"设备 {equipment.code} 已进入维修状态，请安排调度。",
        maintenance=record,
        equipment=equipment,
    )

    return record


@transaction.atomic
def update_maintenance_record(record: MaintenanceRecord, data: dict) -> MaintenanceRecord:
    old_status = record.status
    changed_fields = []

    for field, value in data.items():
        if value is not None:
            old_val = getattr(record, field)
            if old_val != value:
                changed_fields.append(f"{field}: {old_val} -> {value}")
                setattr(record, field, value)

    record.save()

    if changed_fields:
        _create_notification(
            NotificationType.MAINTENANCE_UPDATED,
            Role.DISPATCHER,
            f"维保变更: {record.equipment.code}",
            f"维保记录 #{record.id} 变更内容: {'; '.join(changed_fields)}",
            maintenance=record,
            equipment=record.equipment,
        )
        _notify_suspensions_on_maintenance_change(record)

    return record


@transaction.atomic
def transition_maintenance_status(record: MaintenanceRecord, new_status: str, changed_by: str = "", reason: str = "") -> MaintenanceRecord:
    valid_transitions = {
        MaintenanceStatus.PENDING: [MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.CANCELLED],
        MaintenanceStatus.IN_PROGRESS: [MaintenanceStatus.COMPLETED, MaintenanceStatus.PENDING],
        MaintenanceStatus.COMPLETED: [],
        MaintenanceStatus.CANCELLED: [],
    }
    allowed = valid_transitions.get(record.status, [])
    if new_status not in allowed:
        raise ValueError(f"维保状态不可从 {record.status} 变更为 {new_status}，允许的目标状态: {allowed}")

    old_status = record.status
    record.status = new_status

    if new_status == MaintenanceStatus.IN_PROGRESS:
        record.started_at = timezone.now()
    elif new_status == MaintenanceStatus.COMPLETED:
        record.completed_at = timezone.now()

    record.save()

    _log_status_change("maintenance", record.id, old_status, new_status, changed_by, reason)

    if new_status == MaintenanceStatus.IN_PROGRESS:
        _create_notification(
            NotificationType.MAINTENANCE_UPDATED,
            Role.DISPATCHER,
            f"维保开始: {record.equipment.code}",
            f"维保记录 #{record.id} 已开始处理，维修师傅: {record.assigned_mechanic}",
            maintenance=record,
            equipment=record.equipment,
        )

    if new_status == MaintenanceStatus.COMPLETED:
        has_other_active = MaintenanceRecord.objects.filter(
            equipment=record.equipment,
            status__in=[MaintenanceStatus.PENDING, MaintenanceStatus.IN_PROGRESS],
        ).exclude(pk=record.pk).exists()
        if not has_other_active:
            _update_equipment_status(record.equipment, EquipmentStatus.RENTED, changed_by, "维保完成")

        _create_notification(
            NotificationType.MAINTENANCE_COMPLETED,
            Role.RENTAL_MANAGER,
            f"维保完成: {record.equipment.code}",
            f"维保记录 #{record.id} 已完成，费用: {record.cost}元，承担方: {record.cost_bearer or '未指定'}",
            maintenance=record,
            equipment=record.equipment,
        )

        _notify_suspensions_on_maintenance_change(record)

    if new_status == MaintenanceStatus.CANCELLED:
        has_other_active = MaintenanceRecord.objects.filter(
            equipment=record.equipment,
            status__in=[MaintenanceStatus.PENDING, MaintenanceStatus.IN_PROGRESS],
        ).exists()
        if not has_other_active and record.equipment.status == EquipmentStatus.IN_MAINTENANCE:
            _update_equipment_status(record.equipment, EquipmentStatus.RENTED, changed_by, "维保取消")

    return record


def _notify_suspensions_on_maintenance_change(maintenance: MaintenanceRecord):
    pending_suspensions = RentalSuspension.objects.filter(
        equipment=maintenance.equipment,
        status__in=[SuspensionStatus.PENDING, SuspensionStatus.APPROVED],
    )
    for suspension in pending_suspensions:
        snapshot = build_maintenance_snapshot(suspension.equipment)
        suspension.maintenance_snapshot = snapshot
        suspension.save(update_fields=["maintenance_snapshot", "updated_at"])

        _create_notification(
            NotificationType.MAINTENANCE_UPDATED,
            Role.RENTAL_MANAGER,
            f"停租关联维保变更: {suspension.contract.contract_no}",
            f"停租单 #{suspension.id} 关联的设备 {maintenance.equipment.code} 维保记录有变更，请关注最新维修备注和费用。",
            maintenance=maintenance,
            suspension=suspension,
            equipment=maintenance.equipment,
        )


@transaction.atomic
def create_suspension(data: dict) -> RentalSuspension:
    contract = RentalContract.objects.get(pk=data["contract_id"])
    equipment = Equipment.objects.get(pk=data["equipment_id"])

    snapshot = build_maintenance_snapshot(equipment)

    suspension = RentalSuspension.objects.create(
        contract=contract,
        equipment=equipment,
        suspension_date=data["suspension_date"],
        return_condition=data.get("return_condition", ""),
        fuel_level=data.get("fuel_level", ""),
        meter_reading=data.get("meter_reading", ""),
        damage_description=data.get("damage_description", ""),
        deduction_amount=data.get("deduction_amount", 0),
        deduction_reason=data.get("deduction_reason", ""),
        maintenance_snapshot=snapshot,
    )

    _update_equipment_status(equipment, EquipmentStatus.SUSPENDED, "", "创建停租处理")

    _create_notification(
        NotificationType.SUSPENSION_CREATED,
        Role.RENTAL_MANAGER,
        f"新停租申请: {contract.contract_no}",
        f"设备 {equipment.code} 的停租申请已创建，停租日期: {suspension.suspension_date}，请审核。",
        suspension=suspension,
        equipment=equipment,
    )

    return suspension


@transaction.atomic
def update_suspension(suspension: RentalSuspension, data: dict) -> RentalSuspension:
    for field, value in data.items():
        if value is not None:
            setattr(suspension, field, value)
    suspension.save()
    return suspension


@transaction.atomic
def review_suspension(suspension: RentalSuspension, action: str, reviewed_by: str = "", reason: str = "") -> RentalSuspension:
    if suspension.status != SuspensionStatus.PENDING:
        raise ValueError(f"停租单当前状态为 {suspension.status}，只有待审核状态才可审核")

    if action == "approve":
        new_status = SuspensionStatus.APPROVED
    elif action == "reject":
        new_status = SuspensionStatus.REJECTED
    else:
        raise ValueError(f"无效审核动作: {action}，请使用 approve 或 reject")

    old_status = suspension.status
    suspension.status = new_status
    suspension.reviewed_by = reviewed_by
    suspension.save()

    _log_status_change("suspension", suspension.id, old_status, new_status, reviewed_by, reason)

    _create_notification(
        NotificationType.SUSPENSION_STATUS_CHANGED,
        Role.DISPATCHER,
        f"停租审核结果: {suspension.contract.contract_no}",
        f"停租单 #{suspension.id} 已被{suspension.get_status_display()}，审核人: {reviewed_by}，原因: {reason}",
        suspension=suspension,
        equipment=suspension.equipment,
    )

    if new_status == SuspensionStatus.REJECTED:
        _update_equipment_status(suspension.equipment, EquipmentStatus.RENTED, reviewed_by, "停租驳回，恢复出租")

    return suspension


@transaction.atomic
def settle_suspension(suspension: RentalSuspension, changed_by: str = "", reason: str = "") -> RentalSuspension:
    if suspension.status != SuspensionStatus.APPROVED:
        raise ValueError(f"停租单当前状态为 {suspension.status}，只有已批准状态才可结算")

    old_status = suspension.status
    suspension.status = SuspensionStatus.SETTLED
    suspension.settlement_date = timezone.now().date()
    suspension.save()

    _log_status_change("suspension", suspension.id, old_status, SuspensionStatus.SETTLED, changed_by, reason)

    _update_equipment_status(suspension.equipment, EquipmentStatus.AVAILABLE, changed_by, "停租结算完成，设备释放")

    _create_notification(
        NotificationType.SUSPENSION_STATUS_CHANGED,
        Role.RENTAL_MANAGER,
        f"停租结算完成: {suspension.contract.contract_no}",
        f"停租单 #{suspension.id} 已结算，设备 {suspension.equipment.code} 已释放为空闲状态。",
        suspension=suspension,
        equipment=suspension.equipment,
    )

    return suspension


def check_overdue_contracts():
    today = timezone.now().date()
    overdue_contracts = RentalContract.objects.filter(
        end_date__lt=today,
        is_overdue=False,
    )
    count = 0
    for contract in overdue_contracts:
        contract.is_overdue = True
        contract.save(update_fields=["is_overdue", "updated_at"])
        _create_notification(
            NotificationType.CONTRACT_OVERDUE,
            Role.RENTAL_MANAGER,
            f"合同超期: {contract.contract_no}",
            f"合同 {contract.contract_no}（承租方: {contract.lessee}，设备: {contract.equipment.code}）已于 {contract.end_date} 到期，请处理。",
            equipment=contract.equipment,
        )
        count += 1
    return count
