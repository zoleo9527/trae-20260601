from ninja import Router
from django.utils import timezone
from rental.models import RentalOrder, RentalExtension, FeeSettlement, DamageReport, AuditLog
from rental.schemas import (
    DashboardOut, DashboardPendingItem, DashboardRiskItem, AuditLogOut,
)

router = Router()


def _log_to_out(log):
    return AuditLogOut(
        id=log.id,
        entity_type=log.entity_type,
        entity_type_display=log.get_entity_type_display(),
        entity_id=log.entity_id,
        action=log.action,
        action_display=log.get_action_display(),
        old_value=log.old_value,
        new_value=log.new_value,
        operator_id=log.operator_id,
        operator_role=log.operator_role,
        detail=log.detail,
        related_entity_type=log.related_entity_type,
        related_entity_id=log.related_entity_id,
        created_at=log.created_at,
    )


@router.get('/', response=DashboardOut)
def get_dashboard(request):
    pending_extensions = RentalExtension.objects.filter(
        status='pending',
    ).select_related('rental_order', 'rental_order__equipment')

    ext_items = []
    for ext in pending_extensions:
        ext_items.append(DashboardPendingItem(
            item_type='extension',
            item_type_display='租期延长',
            item_id=ext.id,
            order_no=ext.rental_order.order_no,
            description=f'延至{ext.requested_end_date}，费用+{ext.fee_delta}',
            created_at=ext.created_at,
        ))

    pending_settlements = FeeSettlement.objects.filter(
        status='pending',
    ).select_related('rental_order', 'rental_order__equipment')

    settle_items = []
    for s in pending_settlements:
        settle_items.append(DashboardPendingItem(
            item_type='settlement',
            item_type_display='费用结算',
            item_id=s.id,
            order_no=s.rental_order.order_no,
            description=f'应付{s.total_fee}，押金{s.rental_order.deposit_amount}',
            created_at=s.created_at,
        ))

    pending_damages = DamageReport.objects.filter(
        status='reported',
    ).select_related('rental_order', 'equipment')

    damage_items = []
    for d in pending_damages:
        damage_items.append(DashboardPendingItem(
            item_type='damage',
            item_type_display='损坏定损',
            item_id=d.id,
            order_no=d.rental_order.order_no,
            description=f'{d.equipment.name}预估{d.estimated_cost}',
            created_at=d.created_at,
        ))

    overdue_orders = RentalOrder.objects.filter(
        status='active',
        current_end_date__lt=timezone.now().date(),
    ).select_related('equipment')

    risk_items = []
    for order in overdue_orders:
        overdue_days = (timezone.now().date() - order.current_end_date).days
        severity = 'high' if overdue_days >= 3 else 'medium'
        risk_items.append(DashboardRiskItem(
            risk_type='overdue',
            risk_type_display='逾期未还',
            order_no=order.order_no,
            rental_order_id=order.id,
            description=f'{order.equipment.name}逾期{overdue_days}天，客户{order.customer_name}',
            severity=severity,
        ))

    active_with_pending_ext = RentalOrder.objects.filter(
        status='active',
        extensions__status='approved',
    ).distinct().select_related('equipment')

    for order in active_with_pending_ext:
        if not hasattr(order, 'fee_settlement') or order.fee_settlement.status == 'pending':
            total_ext_fee = sum(
                e.fee_delta for e in order.extensions.filter(status='approved')
            )
            risk_items.append(DashboardRiskItem(
                risk_type='extension_unsettled',
                risk_type_display='延期未结算',
                order_no=order.order_no,
                rental_order_id=order.id,
                description=f'已通过延期费用{total_ext_fee}尚未结算',
                severity='medium',
            ))

    recent_changes = AuditLog.objects.all()[:20]
    recent_logs = [_log_to_out(l) for l in recent_changes]

    summary = {
        'active_orders': RentalOrder.objects.filter(status='active').count(),
        'overdue_orders': len(risk_items),
        'pending_extensions': len(ext_items),
        'pending_settlements': len(settle_items),
        'pending_damages': len(damage_items),
        'risk_items': len(risk_items),
    }

    return DashboardOut(
        pending_extensions=ext_items,
        pending_settlements=settle_items,
        pending_damages=damage_items,
        overdue_orders=risk_items,
        recent_changes=recent_logs,
        summary=summary,
    )
