from datetime import date
from typing import List, Optional

from ninja import Router, Query
from django.shortcuts import get_object_or_404

from rental.models import (
    Equipment,
    EquipmentStatus,
    MaintenanceRecord,
    MaintenanceStatus,
    NotificationLog,
    RentalContract,
    RentalSuspension,
    StatusChangeLog,
    SuspensionStatus,
)
from rental.schemas import (
    ContractCreateIn,
    ContractOut,
    EquipmentCreateIn,
    EquipmentOut,
    EquipmentUpdateIn,
    MaintenanceCreateIn,
    MaintenanceRecordOut,
    MaintenanceUpdateIn,
    MessageOut,
    NotificationOut,
    StatusChangeIn,
    StatusChangeLogOut,
    SuspensionCreateIn,
    SuspensionOut,
    SuspensionReviewIn,
    SuspensionUpdateIn,
)
from rental import services

router = Router()


def _equipment_to_out(e: Equipment) -> dict:
    return EquipmentOut(
        id=e.id,
        code=e.code,
        name=e.name,
        category=e.category,
        model_spec=e.model_spec,
        status=e.status,
        status_display=e.get_status_display(),
        daily_rent=e.daily_rent,
        fuel_type=e.fuel_type,
        current_project=e.current_project,
        created_at=e.created_at,
        updated_at=e.updated_at,
    )


def _contract_to_out(c: RentalContract) -> dict:
    return ContractOut(
        id=c.id,
        contract_no=c.contract_no,
        equipment_id=c.equipment_id,
        equipment_code=c.equipment.code,
        lessee=c.lessee,
        start_date=c.start_date,
        end_date=c.end_date,
        daily_rent=c.daily_rent,
        deposit=c.deposit,
        is_overdue=c.is_overdue,
        remarks=c.remarks,
        created_at=c.created_at,
        updated_at=c.updated_at,
    )


def _maintenance_to_out(r: MaintenanceRecord) -> dict:
    return MaintenanceRecordOut(
        id=r.id,
        equipment_id=r.equipment_id,
        equipment_code=r.equipment.code,
        contract_id=r.contract_id,
        contract_no=r.contract.contract_no if r.contract else None,
        maintenance_type=r.maintenance_type,
        maintenance_type_display=r.get_maintenance_type_display(),
        status=r.status,
        status_display=r.get_status_display(),
        reported_by=r.reported_by,
        assigned_mechanic=r.assigned_mechanic,
        fault_description=r.fault_description,
        repair_notes=r.repair_notes,
        cost=r.cost,
        cost_bearer=r.cost_bearer,
        started_at=r.started_at,
        completed_at=r.completed_at,
        created_at=r.created_at,
        updated_at=r.updated_at,
    )


def _suspension_to_out(s: RentalSuspension) -> dict:
    return SuspensionOut(
        id=s.id,
        contract_id=s.contract_id,
        contract_no=s.contract.contract_no,
        equipment_id=s.equipment_id,
        equipment_code=s.equipment.code,
        suspension_date=s.suspension_date,
        return_condition=s.return_condition,
        fuel_level=s.fuel_level,
        meter_reading=s.meter_reading,
        damage_description=s.damage_description,
        deduction_amount=s.deduction_amount,
        deduction_reason=s.deduction_reason,
        status=s.status,
        status_display=s.get_status_display(),
        reviewed_by=s.reviewed_by,
        settlement_date=s.settlement_date,
        maintenance_snapshot=s.maintenance_snapshot,
        created_at=s.created_at,
        updated_at=s.updated_at,
    )


def _notification_to_out(n: NotificationLog) -> dict:
    return NotificationOut(
        id=n.id,
        notification_type=n.notification_type,
        notification_type_display=n.get_notification_type_display(),
        target_role=n.target_role,
        target_role_display=n.get_target_role_display(),
        title=n.title,
        content=n.content,
        related_maintenance_id=n.related_maintenance_id,
        related_suspension_id=n.related_suspension_id,
        related_equipment_id=n.related_equipment_id,
        is_read=n.is_read,
        created_at=n.created_at,
    )


def _status_change_to_out(sc: StatusChangeLog) -> dict:
    return StatusChangeLogOut(
        id=sc.id,
        entity_type=sc.entity_type,
        entity_id=sc.entity_id,
        old_status=sc.old_status,
        new_status=sc.new_status,
        changed_by=sc.changed_by,
        reason=sc.reason,
        created_at=sc.created_at,
    )


# ─── Equipment ───────────────────────────────────────────────

@router.get("/equipment", response=List[EquipmentOut], tags=["设备管理"])
def list_equipment(request, status: Optional[str] = Query(None), keyword: Optional[str] = Query(None)):
    qs = Equipment.objects.all()
    if status:
        qs = qs.filter(status=status)
    if keyword:
        qs = qs.filter(code__icontains=keyword) | qs.filter(name__icontains=keyword)
    return [_equipment_to_out(e) for e in qs]


@router.get("/equipment/{item_id}", response=EquipmentOut, tags=["设备管理"])
def get_equipment(request, item_id: int):
    return _equipment_to_out(get_object_or_404(Equipment, pk=item_id))


@router.post("/equipment", response=EquipmentOut, tags=["设备管理"])
def create_equipment(request, data: EquipmentCreateIn):
    eq = Equipment.objects.create(**data.dict())
    return _equipment_to_out(eq)


@router.patch("/equipment/{item_id}", response=EquipmentOut, tags=["设备管理"])
def update_equipment(request, item_id: int, data: EquipmentUpdateIn):
    eq = get_object_or_404(Equipment, pk=item_id)
    for field, value in data.dict(exclude_unset=True).items():
        setattr(eq, field, value)
    eq.save()
    return _equipment_to_out(eq)


# ─── Contract ────────────────────────────────────────────────

@router.get("/contracts", response=List[ContractOut], tags=["租赁合同"])
def list_contracts(request, is_overdue: Optional[bool] = Query(None), keyword: Optional[str] = Query(None)):
    qs = RentalContract.objects.select_related("equipment").all()
    if is_overdue is not None:
        qs = qs.filter(is_overdue=is_overdue)
    if keyword:
        qs = qs.filter(contract_no__icontains=keyword) | qs.filter(lessee__icontains=keyword)
    return [_contract_to_out(c) for c in qs]


@router.get("/contracts/{item_id}", response=ContractOut, tags=["租赁合同"])
def get_contract(request, item_id: int):
    return _contract_to_out(get_object_or_404(RentalContract, pk=item_id))


@router.post("/contracts", response=ContractOut, tags=["租赁合同"])
def create_contract(request, data: ContractCreateIn):
    contract = RentalContract.objects.create(**data.dict())
    eq = contract.equipment
    eq.status = EquipmentStatus.RENTED
    eq.save(update_fields=["status", "updated_at"])
    return _contract_to_out(contract)


@router.post("/contracts/check-overdue", response=MessageOut, tags=["租赁合同"])
def check_overdue(request):
    count = services.check_overdue_contracts()
    return MessageOut(message=f"检测完成，发现 {count} 个超期合同")


# ─── Maintenance ─────────────────────────────────────────────

@router.get("/maintenance", response=List[MaintenanceRecordOut], tags=["维修保养"])
def list_maintenance(
    request,
    equipment_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    maintenance_type: Optional[str] = Query(None),
):
    qs = MaintenanceRecord.objects.select_related("equipment", "contract").all()
    if equipment_id:
        qs = qs.filter(equipment_id=equipment_id)
    if status:
        qs = qs.filter(status=status)
    if maintenance_type:
        qs = qs.filter(maintenance_type=maintenance_type)
    return [_maintenance_to_out(r) for r in qs]


@router.get("/maintenance/{item_id}", response=MaintenanceRecordOut, tags=["维修保养"])
def get_maintenance(request, item_id: int):
    return _maintenance_to_out(get_object_or_404(MaintenanceRecord, pk=item_id))


@router.post("/maintenance", response=MaintenanceRecordOut, tags=["维修保养"])
def create_maintenance(request, data: MaintenanceCreateIn):
    record = services.create_maintenance_record(data.dict())
    return _maintenance_to_out(record)


@router.patch("/maintenance/{item_id}", response=MaintenanceRecordOut, tags=["维修保养"])
def update_maintenance(request, item_id: int, data: MaintenanceUpdateIn):
    record = get_object_or_404(MaintenanceRecord, pk=item_id)
    record = services.update_maintenance_record(record, data.dict(exclude_unset=True))
    return _maintenance_to_out(record)


@router.post("/maintenance/{item_id}/transition", response=MaintenanceRecordOut, tags=["维修保养"])
def transition_maintenance(request, item_id: int, data: StatusChangeIn):
    record = get_object_or_404(MaintenanceRecord, pk=item_id)
    record = services.transition_maintenance_status(record, data.new_status, data.changed_by, data.reason)
    return _maintenance_to_out(record)


# ─── Suspension ──────────────────────────────────────────────

@router.get("/suspensions", response=List[SuspensionOut], tags=["停租处理"])
def list_suspensions(
    request,
    equipment_id: Optional[int] = Query(None),
    contract_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
):
    qs = RentalSuspension.objects.select_related("contract", "equipment").all()
    if equipment_id:
        qs = qs.filter(equipment_id=equipment_id)
    if contract_id:
        qs = qs.filter(contract_id=contract_id)
    if status:
        qs = qs.filter(status=status)
    return [_suspension_to_out(s) for s in qs]


@router.get("/suspensions/{item_id}", response=SuspensionOut, tags=["停租处理"])
def get_suspension(request, item_id: int):
    return _suspension_to_out(get_object_or_404(RentalSuspension, pk=item_id))


@router.post("/suspensions", response=SuspensionOut, tags=["停租处理"])
def create_suspension(request, data: SuspensionCreateIn):
    suspension = services.create_suspension(data.dict())
    return _suspension_to_out(suspension)


@router.patch("/suspensions/{item_id}", response=SuspensionOut, tags=["停租处理"])
def update_suspension(request, item_id: int, data: SuspensionUpdateIn):
    suspension = get_object_or_404(RentalSuspension, pk=item_id)
    suspension = services.update_suspension(suspension, data.dict(exclude_unset=True))
    return _suspension_to_out(suspension)


@router.post("/suspensions/{item_id}/review", response=SuspensionOut, tags=["停租处理"])
def review_suspension(request, item_id: int, data: SuspensionReviewIn):
    suspension = get_object_or_404(RentalSuspension, pk=item_id)
    suspension = services.review_suspension(suspension, data.action, data.reviewed_by, data.reason)
    return _suspension_to_out(suspension)


@router.post("/suspensions/{item_id}/settle", response=SuspensionOut, tags=["停租处理"])
def settle_suspension(request, item_id: int, data: StatusChangeIn):
    suspension = get_object_or_404(RentalSuspension, pk=item_id)
    suspension = services.settle_suspension(suspension, data.changed_by, data.reason)
    return _suspension_to_out(suspension)


@router.get("/suspensions/{item_id}/maintenance-history", response=List[MaintenanceRecordOut], tags=["停租处理"])
def suspension_maintenance_history(request, item_id: int):
    suspension = get_object_or_404(RentalSuspension, pk=item_id)
    records = MaintenanceRecord.objects.filter(equipment=suspension.equipment).select_related("equipment", "contract")
    return [_maintenance_to_out(r) for r in records]


# ─── Notifications ───────────────────────────────────────────

@router.get("/notifications", response=List[NotificationOut], tags=["通知记录"])
def list_notifications(
    request,
    target_role: Optional[str] = Query(None),
    notification_type: Optional[str] = Query(None),
    is_read: Optional[bool] = Query(None),
):
    qs = NotificationLog.objects.all()
    if target_role:
        qs = qs.filter(target_role=target_role)
    if notification_type:
        qs = qs.filter(notification_type=notification_type)
    if is_read is not None:
        qs = qs.filter(is_read=is_read)
    return [_notification_to_out(n) for n in qs]


@router.post("/notifications/{item_id}/read", response=MessageOut, tags=["通知记录"])
def mark_notification_read(request, item_id: int):
    n = get_object_or_404(NotificationLog, pk=item_id)
    n.is_read = True
    n.save(update_fields=["is_read"])
    return MessageOut(message=f"通知 #{item_id} 已标记为已读")


@router.get("/notifications/unread-count", response=dict, tags=["通知记录"])
def unread_notification_count(request, target_role: Optional[str] = Query(None)):
    qs = NotificationLog.objects.filter(is_read=False)
    if target_role:
        qs = qs.filter(target_role=target_role)
    return {"unread_count": qs.count()}


# ─── Status Change Log ───────────────────────────────────────

@router.get("/status-changes", response=List[StatusChangeLogOut], tags=["状态变更"])
def list_status_changes(
    request,
    entity_type: Optional[str] = Query(None),
    entity_id: Optional[int] = Query(None),
):
    qs = StatusChangeLog.objects.all()
    if entity_type:
        qs = qs.filter(entity_type=entity_type)
    if entity_id:
        qs = qs.filter(entity_id=entity_id)
    return [_status_change_to_out(sc) for sc in qs]


# ─── Role Dashboard ──────────────────────────────────────────

@router.get("/dashboard/{role}", response=dict, tags=["工作台"])
def role_dashboard(request, role: str):
    if role not in ("rental_manager", "dispatcher", "mechanic"):
        return {"error": "无效角色，请使用 rental_manager / dispatcher / mechanic"}

    result = {"role": role}

    if role == "rental_manager":
        result["overdue_contracts"] = RentalContract.objects.filter(is_overdue=True).count()
        result["pending_suspensions"] = RentalSuspension.objects.filter(status=SuspensionStatus.PENDING).count()
        result["unread_notifications"] = NotificationLog.objects.filter(
            target_role=role, is_read=False
        ).count()
        result["recent_suspensions"] = [
            _suspension_to_out(s) for s in RentalSuspension.objects.select_related("contract", "equipment")
            .filter(status__in=[SuspensionStatus.PENDING, SuspensionStatus.APPROVED])
            .order_by("-created_at")[:5]
        ]

    elif role == "dispatcher":
        result["rented_equipment"] = Equipment.objects.filter(status=EquipmentStatus.RENTED).count()
        result["in_maintenance"] = Equipment.objects.filter(status=EquipmentStatus.IN_MAINTENANCE).count()
        result["pending_maintenance"] = MaintenanceRecord.objects.filter(status=MaintenanceStatus.PENDING).count()
        result["unread_notifications"] = NotificationLog.objects.filter(
            target_role=role, is_read=False
        ).count()
        result["pending_maintenance_list"] = [
            _maintenance_to_out(r) for r in MaintenanceRecord.objects.select_related("equipment", "contract")
            .filter(status=MaintenanceStatus.PENDING)
            .order_by("-created_at")[:5]
        ]

    elif role == "mechanic":
        result["my_active_tasks"] = MaintenanceRecord.objects.filter(
            status__in=[MaintenanceStatus.PENDING, MaintenanceStatus.IN_PROGRESS]
        ).count()
        result["unread_notifications"] = NotificationLog.objects.filter(
            target_role=role, is_read=False
        ).count()
        result["my_tasks"] = [
            _maintenance_to_out(r) for r in MaintenanceRecord.objects.select_related("equipment", "contract")
            .filter(status__in=[MaintenanceStatus.PENDING, MaintenanceStatus.IN_PROGRESS])
            .order_by("-created_at")[:10]
        ]

    return result
