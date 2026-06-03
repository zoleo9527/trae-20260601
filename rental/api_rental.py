from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from ninja import Router
from django.utils import timezone
from rental.models import RentalOrder, RentalExtension, FeeSettlement, DamageReport, Equipment, AuditLog
from rental.schemas import (
    ExtensionRequestIn, ExtensionReviewIn, ExtensionOut,
    RentalOrderOut, RentalOrderDetailOut, SettlementOut,
    DamageReportIn, DamageAssessIn, DamageOut,
    SettlementCreateIn, SettlementActionIn,
)
from rental.services import ExtensionService, SettlementService, DamageService

router = Router()


def _extension_to_out(ext):
    return ExtensionOut(
        id=ext.id,
        rental_order_id=ext.rental_order_id,
        order_no=ext.rental_order.order_no,
        original_end_date=ext.original_end_date,
        requested_end_date=ext.requested_end_date,
        reason=ext.reason,
        fee_delta=ext.fee_delta,
        status=ext.status,
        status_display=ext.get_status_display(),
        requested_by_id=ext.requested_by_id,
        reviewed_by_id=ext.reviewed_by_id,
        reviewed_at=ext.reviewed_at,
        review_note=ext.review_note,
        created_at=ext.created_at,
        updated_at=ext.updated_at,
    )


def _order_to_out(order):
    return RentalOrderOut(
        id=order.id,
        order_no=order.order_no,
        customer_name=order.customer_name,
        customer_phone=order.customer_phone,
        equipment_id=order.equipment_id,
        equipment_name=order.equipment.name,
        equipment_serial=order.equipment.serial_number,
        store_clerk_id=order.store_clerk_id,
        start_date=order.start_date,
        original_end_date=order.original_end_date,
        current_end_date=order.current_end_date,
        deposit_amount=order.deposit_amount,
        status=order.status,
        status_display=order.get_status_display(),
        has_pending_extension=order.has_pending_extension,
        is_overdue=order.is_overdue,
        notes=order.notes,
        created_at=order.created_at,
        updated_at=order.updated_at,
    )


def _damage_to_out(dmg):
    return DamageOut(
        id=dmg.id,
        rental_order_id=dmg.rental_order_id,
        order_no=dmg.rental_order.order_no,
        equipment_id=dmg.equipment_id,
        equipment_name=dmg.equipment.name,
        description=dmg.description,
        estimated_cost=dmg.estimated_cost,
        actual_cost=dmg.actual_cost,
        status=dmg.status,
        status_display=dmg.get_status_display(),
        reported_by_id=dmg.reported_by_id,
        created_at=dmg.created_at,
        updated_at=dmg.updated_at,
    )


def _settlement_to_out(s):
    return SettlementOut(
        id=s.id,
        rental_order_id=s.rental_order_id,
        order_no=s.rental_order.order_no,
        base_fee=s.base_fee,
        extension_fee=s.extension_fee,
        damage_fee=s.damage_fee,
        overdue_penalty=s.overdue_penalty,
        total_fee=s.total_fee,
        deposit_deducted=s.deposit_deducted,
        refund_amount=s.refund_amount,
        status=s.status,
        status_display=s.get_status_display(),
        settled_by_id=s.settled_by_id,
        settled_at=s.settled_at,
        notes=s.notes,
        created_at=s.created_at,
        updated_at=s.updated_at,
    )


@router.get('/orders', response=list[RentalOrderOut])
def list_orders(request, status: Optional[str] = None):
    qs = RentalOrder.objects.select_related('equipment', 'store_clerk')
    if status:
        qs = qs.filter(status=status)
    return [_order_to_out(o) for o in qs]


@router.get('/orders/{order_id}', response=RentalOrderDetailOut)
def get_order_detail(request, order_id: int):
    order = RentalOrder.objects.select_related(
        'equipment', 'store_clerk', 'fee_settlement',
    ).prefetch_related('extensions', 'damage_reports').get(pk=order_id)

    result = RentalOrderDetailOut(
        id=order.id,
        order_no=order.order_no,
        customer_name=order.customer_name,
        customer_phone=order.customer_phone,
        equipment_id=order.equipment_id,
        equipment_name=order.equipment.name,
        equipment_serial=order.equipment.serial_number,
        store_clerk_id=order.store_clerk_id,
        start_date=order.start_date,
        original_end_date=order.original_end_date,
        current_end_date=order.current_end_date,
        deposit_amount=order.deposit_amount,
        status=order.status,
        status_display=order.get_status_display(),
        has_pending_extension=order.has_pending_extension,
        is_overdue=order.is_overdue,
        notes=order.notes,
        created_at=order.created_at,
        updated_at=order.updated_at,
        extensions=[_extension_to_out(e) for e in order.extensions.all()],
        damage_reports=[_damage_to_out(d) for d in order.damage_reports.all()],
        settlement=_settlement_to_out(order.fee_settlement) if hasattr(order, 'fee_settlement') else None,
    )
    return result


@router.post('/extensions', response=ExtensionOut)
def request_extension(request, payload: ExtensionRequestIn):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    operator = User.objects.get(pk=payload.operator_id) if payload.operator_id else None

    ext = ExtensionService.request_extension(
        rental_order_id=payload.rental_order_id,
        requested_end_date=payload.requested_end_date,
        reason=payload.reason,
        requested_by=operator,
        operator_role=payload.operator_role,
    )
    return _extension_to_out(ext)


@router.get('/extensions', response=list[ExtensionOut])
def list_extensions(request, status: Optional[str] = None, rental_order_id: Optional[int] = None):
    qs = RentalExtension.objects.select_related('rental_order', 'rental_order__equipment')
    if status:
        qs = qs.filter(status=status)
    if rental_order_id:
        qs = qs.filter(rental_order_id=rental_order_id)
    return [_extension_to_out(e) for e in qs]


@router.get('/extensions/{extension_id}', response=ExtensionOut)
def get_extension(request, extension_id: int):
    ext = RentalExtension.objects.select_related(
        'rental_order', 'rental_order__equipment',
    ).get(pk=extension_id)
    return _extension_to_out(ext)


@router.post('/extensions/{extension_id}/approve', response=ExtensionOut)
def approve_extension(request, extension_id: int, payload: ExtensionReviewIn):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    operator = User.objects.get(pk=payload.operator_id) if payload.operator_id else None

    ext = ExtensionService.approve_extension(
        extension_id=extension_id,
        reviewed_by=operator,
        operator_role=payload.operator_role,
        review_note=payload.review_note,
    )
    return _extension_to_out(ext)


@router.post('/extensions/{extension_id}/reject', response=ExtensionOut)
def reject_extension(request, extension_id: int, payload: ExtensionReviewIn):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    operator = User.objects.get(pk=payload.operator_id) if payload.operator_id else None

    ext = ExtensionService.reject_extension(
        extension_id=extension_id,
        reviewed_by=operator,
        operator_role=payload.operator_role,
        review_note=payload.review_note,
    )
    return _extension_to_out(ext)


@router.post('/extensions/{extension_id}/cancel', response=ExtensionOut)
def cancel_extension(request, extension_id: int, payload: ExtensionReviewIn):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    operator = User.objects.get(pk=payload.operator_id) if payload.operator_id else None

    ext = ExtensionService.cancel_extension(
        extension_id=extension_id,
        cancelled_by=operator,
        operator_role=payload.operator_role,
    )
    return _extension_to_out(ext)


@router.post('/damages', response=DamageOut)
def report_damage(request, payload: DamageReportIn):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    operator = User.objects.get(pk=payload.operator_id) if payload.operator_id else None

    dmg = DamageService.report_damage(
        rental_order_id=payload.rental_order_id,
        equipment_id=payload.equipment_id,
        description=payload.description,
        estimated_cost=payload.estimated_cost,
        reported_by=operator,
        operator_role=payload.operator_role,
    )
    return _damage_to_out(dmg)


@router.post('/damages/{damage_id}/assess', response=DamageOut)
def assess_damage(request, damage_id: int, payload: DamageAssessIn):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    operator = User.objects.get(pk=payload.operator_id) if payload.operator_id else None

    dmg = DamageService.assess_damage(
        damage_id=damage_id,
        actual_cost=payload.actual_cost,
        operator=operator,
        operator_role=payload.operator_role,
    )
    return _damage_to_out(dmg)


@router.get('/damages', response=list[DamageOut])
def list_damages(request, status: Optional[str] = None):
    qs = DamageReport.objects.select_related('rental_order', 'equipment')
    if status:
        qs = qs.filter(status=status)
    return [_damage_to_out(d) for d in qs]


@router.post('/settlements', response=SettlementOut)
def create_settlement(request, payload: SettlementCreateIn):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    operator = User.objects.get(pk=payload.operator_id) if payload.operator_id else None

    s = SettlementService.create_settlement(
        order_id=payload.rental_order_id,
        operator=operator,
        operator_role=payload.operator_role,
    )
    return _settlement_to_out(s)


@router.get('/settlements', response=list[SettlementOut])
def list_settlements(request, status: Optional[str] = None):
    qs = FeeSettlement.objects.select_related('rental_order', 'rental_order__equipment')
    if status:
        qs = qs.filter(status=status)
    return [_settlement_to_out(s) for s in qs]


@router.get('/settlements/{settlement_id}', response=SettlementOut)
def get_settlement(request, settlement_id: int):
    s = FeeSettlement.objects.select_related(
        'rental_order', 'rental_order__equipment',
    ).get(pk=settlement_id)
    return _settlement_to_out(s)


@router.post('/settlements/{settlement_id}/recalculate', response=SettlementOut)
def recalculate_settlement(request, settlement_id: int, payload: SettlementActionIn):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    operator = User.objects.get(pk=payload.operator_id) if payload.operator_id else None

    s = SettlementService.recalculate_settlement(
        settlement_id=settlement_id,
        operator=operator,
        operator_role=payload.operator_role,
    )
    return _settlement_to_out(s)


@router.post('/settlements/{settlement_id}/pay', response=SettlementOut)
def mark_settlement_paid(request, settlement_id: int, payload: SettlementActionIn):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    operator = User.objects.get(pk=payload.operator_id) if payload.operator_id else None

    s = SettlementService.mark_as_paid(
        settlement_id=settlement_id,
        operator=operator,
        operator_role=payload.operator_role,
        notes=payload.notes,
    )
    return _settlement_to_out(s)


@router.post('/settlements/{settlement_id}/refund', response=SettlementOut)
def mark_settlement_refunded(request, settlement_id: int, payload: SettlementActionIn):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    operator = User.objects.get(pk=payload.operator_id) if payload.operator_id else None

    s = SettlementService.mark_as_refunded(
        settlement_id=settlement_id,
        operator=operator,
        operator_role=payload.operator_role,
        notes=payload.notes,
    )
    return _settlement_to_out(s)
