from datetime import date, datetime
from decimal import Decimal
from typing import Any, List, Optional

from ninja import Schema


class EquipmentOut(Schema):
    id: int
    code: str
    name: str
    category: str
    model_spec: str
    status: str
    status_display: str
    daily_rent: Decimal
    fuel_type: str
    current_project: str
    created_at: datetime
    updated_at: datetime


class EquipmentCreateIn(Schema):
    code: str
    name: str
    category: str = ""
    model_spec: str = ""
    daily_rent: Decimal = Decimal("0")
    fuel_type: str = ""
    current_project: str = ""


class EquipmentUpdateIn(Schema):
    name: Optional[str] = None
    category: Optional[str] = None
    model_spec: Optional[str] = None
    daily_rent: Optional[Decimal] = None
    fuel_type: Optional[str] = None
    current_project: Optional[str] = None


class ContractOut(Schema):
    id: int
    contract_no: str
    equipment_id: int
    equipment_code: str
    lessee: str
    start_date: date
    end_date: date
    daily_rent: Decimal
    deposit: Decimal
    is_overdue: bool
    remarks: str
    created_at: datetime
    updated_at: datetime


class ContractCreateIn(Schema):
    contract_no: str
    equipment_id: int
    lessee: str
    start_date: date
    end_date: date
    daily_rent: Decimal
    deposit: Decimal = Decimal("0")
    remarks: str = ""


class MaintenanceRecordOut(Schema):
    id: int
    equipment_id: int
    equipment_code: str
    contract_id: Optional[int]
    contract_no: Optional[str]
    maintenance_type: str
    maintenance_type_display: str
    status: str
    status_display: str
    reported_by: str
    assigned_mechanic: str
    fault_description: str
    repair_notes: str
    cost: Decimal
    cost_bearer: str
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime


class MaintenanceCreateIn(Schema):
    equipment_id: int
    contract_id: Optional[int] = None
    maintenance_type: str
    reported_by: str = ""
    assigned_mechanic: str = ""
    fault_description: str = ""
    repair_notes: str = ""
    cost: Decimal = Decimal("0")
    cost_bearer: str = ""


class MaintenanceUpdateIn(Schema):
    maintenance_type: Optional[str] = None
    assigned_mechanic: Optional[str] = None
    fault_description: Optional[str] = None
    repair_notes: Optional[str] = None
    cost: Optional[Decimal] = None
    cost_bearer: Optional[str] = None


class SuspensionOut(Schema):
    id: int
    contract_id: int
    contract_no: str
    equipment_id: int
    equipment_code: str
    suspension_date: date
    return_condition: str
    fuel_level: str
    meter_reading: str
    damage_description: str
    deduction_amount: Decimal
    deduction_reason: str
    status: str
    status_display: str
    reviewed_by: str
    settlement_date: Optional[date]
    maintenance_snapshot: List[Any]
    created_at: datetime
    updated_at: datetime


class SuspensionCreateIn(Schema):
    contract_id: int
    equipment_id: int
    suspension_date: date
    return_condition: str = ""
    fuel_level: str = ""
    meter_reading: str = ""
    damage_description: str = ""
    deduction_amount: Decimal = Decimal("0")
    deduction_reason: str = ""


class SuspensionUpdateIn(Schema):
    return_condition: Optional[str] = None
    fuel_level: Optional[str] = None
    meter_reading: Optional[str] = None
    damage_description: Optional[str] = None
    deduction_amount: Optional[Decimal] = None
    deduction_reason: Optional[str] = None


class StatusChangeIn(Schema):
    new_status: str
    changed_by: str = ""
    reason: str = ""


class SuspensionSettleIn(Schema):
    changed_by: str = ""
    reason: str = ""


class SuspensionReviewIn(Schema):
    action: str
    reviewed_by: str = ""
    reason: str = ""


class NotificationOut(Schema):
    id: int
    notification_type: str
    notification_type_display: str
    target_role: str
    target_role_display: str
    title: str
    content: str
    related_maintenance_id: Optional[int]
    related_suspension_id: Optional[int]
    related_equipment_id: Optional[int]
    is_read: bool
    created_at: datetime


class StatusChangeLogOut(Schema):
    id: int
    entity_type: str
    entity_id: int
    old_status: str
    new_status: str
    changed_by: str
    reason: str
    created_at: datetime


class MessageOut(Schema):
    message: str
