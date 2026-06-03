from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from ninja import Schema


class ExtensionRequestIn(Schema):
    rental_order_id: int
    requested_end_date: date
    reason: str
    operator_id: Optional[int] = None
    operator_role: str = 'clerk'


class ExtensionReviewIn(Schema):
    review_note: str = ''
    operator_id: Optional[int] = None
    operator_role: str = 'manager'


class DamageReportIn(Schema):
    rental_order_id: int
    equipment_id: int
    description: str
    estimated_cost: Decimal
    operator_id: Optional[int] = None
    operator_role: str = 'clerk'


class DamageAssessIn(Schema):
    actual_cost: Decimal
    operator_id: Optional[int] = None
    operator_role: str = 'manager'


class SettlementCreateIn(Schema):
    rental_order_id: int
    operator_id: Optional[int] = None
    operator_role: str = 'finance'


class SettlementActionIn(Schema):
    notes: str = ''
    operator_id: Optional[int] = None
    operator_role: str = 'finance'


class EquipmentOut(Schema):
    id: int
    name: str
    category: str
    category_display: str
    serial_number: str
    status: str
    status_display: str
    daily_rate: Decimal
    replacement_value: Decimal
    notes: str
    created_at: datetime
    updated_at: datetime


class ExtensionOut(Schema):
    id: int
    rental_order_id: int
    order_no: str
    original_end_date: date
    requested_end_date: date
    reason: str
    fee_delta: Decimal
    status: str
    status_display: str
    requested_by_id: Optional[int]
    reviewed_by_id: Optional[int]
    reviewed_at: Optional[datetime]
    review_note: str
    created_at: datetime
    updated_at: datetime


class DamageOut(Schema):
    id: int
    rental_order_id: int
    order_no: str
    equipment_id: int
    equipment_name: str
    description: str
    estimated_cost: Decimal
    actual_cost: Optional[Decimal]
    status: str
    status_display: str
    reported_by_id: Optional[int]
    created_at: datetime
    updated_at: datetime


class SettlementOut(Schema):
    id: int
    rental_order_id: int
    order_no: str
    base_fee: Decimal
    extension_fee: Decimal
    damage_fee: Decimal
    overdue_penalty: Decimal
    total_fee: Decimal
    deposit_deducted: Decimal
    refund_amount: Decimal
    status: str
    status_display: str
    settled_by_id: Optional[int]
    settled_at: Optional[datetime]
    notes: str
    created_at: datetime
    updated_at: datetime


class RentalOrderOut(Schema):
    id: int
    order_no: str
    customer_name: str
    customer_phone: str
    equipment_id: int
    equipment_name: str
    equipment_serial: str
    store_clerk_id: Optional[int]
    start_date: date
    original_end_date: date
    current_end_date: date
    deposit_amount: Decimal
    status: str
    status_display: str
    has_pending_extension: bool
    is_overdue: bool
    notes: str
    created_at: datetime
    updated_at: datetime


class RentalOrderDetailOut(RentalOrderOut):
    extensions: list[ExtensionOut]
    damage_reports: list[DamageOut]
    settlement: Optional[SettlementOut]


class AuditLogOut(Schema):
    id: int
    entity_type: str
    entity_type_display: str
    entity_id: int
    action: str
    action_display: str
    old_value: Optional[dict]
    new_value: Optional[dict]
    operator_id: Optional[int]
    operator_role: str
    detail: str
    related_entity_type: str
    related_entity_id: Optional[int]
    created_at: datetime


class DashboardPendingItem(Schema):
    item_type: str
    item_type_display: str
    item_id: int
    order_no: str
    description: str
    created_at: datetime


class DashboardRiskItem(Schema):
    risk_type: str
    risk_type_display: str
    order_no: str
    rental_order_id: int
    description: str
    severity: str


class DashboardOut(Schema):
    pending_extensions: list[DashboardPendingItem]
    pending_settlements: list[DashboardPendingItem]
    pending_damages: list[DashboardPendingItem]
    overdue_orders: list[DashboardRiskItem]
    recent_changes: list[AuditLogOut]
    summary: dict
