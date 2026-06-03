from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from rental.models import (
    RentalOrder, RentalExtension, FeeSettlement,
    DamageReport, AuditLog, Equipment,
)


class AuditService:
    @staticmethod
    def log(
        entity_type, entity_id, action, operator=None,
        operator_role='', detail='', old_value=None,
        new_value=None, related_entity_type='', related_entity_id=None,
    ):
        return AuditLog.objects.create(
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            operator=operator,
            operator_role=operator_role,
            detail=detail,
            old_value=old_value,
            new_value=new_value,
            related_entity_type=related_entity_type,
            related_entity_id=related_entity_id,
        )


class ExtensionService:
    @staticmethod
    @transaction.atomic
    def request_extension(rental_order_id, requested_end_date, reason,
                          requested_by=None, operator_role='clerk'):
        order = RentalOrder.objects.select_for_update().get(pk=rental_order_id)

        if order.status != 'active':
            raise ValueError(f'租赁单状态为{order.get_status_display()}，无法申请延期')

        if order.has_pending_extension:
            raise ValueError('该租赁单已有待审核的延期申请')

        if requested_end_date <= order.current_end_date:
            raise ValueError('申请延至日期必须晚于当前归还日期')

        days = (requested_end_date - order.current_end_date).days
        fee_delta = Decimal(str(days)) * order.equipment.daily_rate

        extension = RentalExtension.objects.create(
            rental_order=order,
            original_end_date=order.current_end_date,
            requested_end_date=requested_end_date,
            reason=reason,
            fee_delta=fee_delta,
            status='pending',
            requested_by=requested_by,
        )

        AuditService.log(
            entity_type='extension',
            entity_id=extension.id,
            action='extension_requested',
            operator=requested_by,
            operator_role=operator_role,
            detail=f'租赁单{order.order_no}申请延期{days}天，费用增量{fee_delta}',
            new_value={
                'order_no': order.order_no,
                'original_end': str(order.current_end_date),
                'requested_end': str(requested_end_date),
                'days': days,
                'fee_delta': str(fee_delta),
                'reason': reason,
            },
            related_entity_type='rental_order',
            related_entity_id=order.id,
        )

        return extension

    @staticmethod
    @transaction.atomic
    def approve_extension(extension_id, reviewed_by=None,
                          operator_role='manager', review_note=''):
        extension = RentalExtension.objects.select_for_update().get(pk=extension_id)

        if extension.status != 'pending':
            raise ValueError(f'延期申请状态为{extension.get_status_display()}，无法审核')

        order = RentalOrder.objects.select_for_update().get(pk=extension.rental_order_id)
        old_end_date = order.current_end_date

        extension.status = 'approved'
        extension.reviewed_by = reviewed_by
        extension.reviewed_at = timezone.now()
        extension.review_note = review_note
        extension.save(update_fields=['status', 'reviewed_by', 'reviewed_at', 'review_note', 'updated_at'])

        order.current_end_date = extension.requested_end_date
        order.save(update_fields=['current_end_date', 'updated_at'])

        SettlementService.recalculate_on_extension_change(
            order, extension, operator=reviewed_by, operator_role=operator_role,
        )

        AuditService.log(
            entity_type='extension',
            entity_id=extension.id,
            action='extension_approved',
            operator=reviewed_by,
            operator_role=operator_role,
            detail=f'租赁单{order.order_no}延期申请已通过，归还日期从{old_end_date}变更为{extension.requested_end_date}',
            old_value={'current_end_date': str(old_end_date), 'extension_status': 'pending'},
            new_value={
                'current_end_date': str(extension.requested_end_date),
                'extension_status': 'approved',
                'fee_delta': str(extension.fee_delta),
            },
            related_entity_type='rental_order',
            related_entity_id=order.id,
        )

        return extension

    @staticmethod
    @transaction.atomic
    def reject_extension(extension_id, reviewed_by=None,
                         operator_role='manager', review_note=''):
        extension = RentalExtension.objects.select_for_update().get(pk=extension_id)

        if extension.status != 'pending':
            raise ValueError(f'延期申请状态为{extension.get_status_display()}，无法驳回')

        extension.status = 'rejected'
        extension.reviewed_by = reviewed_by
        extension.reviewed_at = timezone.now()
        extension.review_note = review_note
        extension.save(update_fields=['status', 'reviewed_by', 'reviewed_at', 'review_note', 'updated_at'])

        AuditService.log(
            entity_type='extension',
            entity_id=extension.id,
            action='extension_rejected',
            operator=reviewed_by,
            operator_role=operator_role,
            detail=f'租赁单{extension.rental_order.order_no}延期申请已驳回',
            old_value={'extension_status': 'pending'},
            new_value={'extension_status': 'rejected'},
            related_entity_type='rental_order',
            related_entity_id=extension.rental_order_id,
        )

        return extension

    @staticmethod
    @transaction.atomic
    def cancel_extension(extension_id, cancelled_by=None, operator_role='clerk'):
        extension = RentalExtension.objects.select_for_update().get(pk=extension_id)

        if extension.status not in ('pending',):
            raise ValueError(f'延期申请状态为{extension.get_status_display()}，无法取消')

        extension.status = 'cancelled'
        extension.save(update_fields=['status', 'updated_at'])

        AuditService.log(
            entity_type='extension',
            entity_id=extension.id,
            action='extension_cancelled',
            operator=cancelled_by,
            operator_role=operator_role,
            detail=f'租赁单{extension.rental_order.order_no}延期申请已取消',
            old_value={'extension_status': 'pending'},
            new_value={'extension_status': 'cancelled'},
            related_entity_type='rental_order',
            related_entity_id=extension.rental_order_id,
        )

        return extension


class SettlementService:
    @staticmethod
    def calculate_fees(order):
        base_days = (order.original_end_date - order.start_date).days
        base_fee = Decimal(str(base_days)) * order.equipment.daily_rate

        extension_fee = Decimal('0')
        for ext in order.extensions.filter(status='approved'):
            extension_fee += ext.fee_delta

        damage_fee = Decimal('0')
        for dmg in order.damage_reports.filter(status__in=['reported', 'assessed']):
            if dmg.actual_cost is not None:
                damage_fee += dmg.actual_cost
            else:
                damage_fee += dmg.estimated_cost

        overdue_days = 0
        overdue_penalty = Decimal('0')
        if order.status == 'active' and order.current_end_date < timezone.now().date():
            overdue_days = (timezone.now().date() - order.current_end_date).days
            overdue_penalty = Decimal(str(overdue_days)) * order.equipment.daily_rate * Decimal('1.5')

        total_fee = base_fee + extension_fee + damage_fee + overdue_penalty
        deposit_deducted = min(order.deposit_amount, total_fee)
        refund_amount = order.deposit_amount - deposit_deducted

        return {
            'base_fee': base_fee,
            'extension_fee': extension_fee,
            'damage_fee': damage_fee,
            'overdue_penalty': overdue_penalty,
            'overdue_days': overdue_days,
            'total_fee': total_fee,
            'deposit_deducted': deposit_deducted,
            'refund_amount': refund_amount,
        }

    @staticmethod
    @transaction.atomic
    def create_settlement(order_id, operator=None, operator_role='finance'):
        order = RentalOrder.objects.select_for_update().get(pk=order_id)

        if hasattr(order, 'fee_settlement'):
            existing = order.fee_settlement
            return SettlementService.recalculate_settlement(existing.id, operator, operator_role)

        fees = SettlementService.calculate_fees(order)
        overdue_days = fees.pop('overdue_days', 0)
        settlement = FeeSettlement.objects.create(
            rental_order=order,
            **fees,
            status='pending',
        )

        fmt = SettlementService._format_fee
        fees_for_log = {k: fmt(v) for k, v in fees.items()}

        AuditService.log(
            entity_type='settlement',
            entity_id=settlement.id,
            action='settlement_created',
            operator=operator,
            operator_role=operator_role,
            detail=f'租赁单{order.order_no}费用结算已创建，应付{fees["total_fee"]}' + (f'（逾期{overdue_days}天）' if overdue_days else ''),
            new_value=fees_for_log,
            related_entity_type='rental_order',
            related_entity_id=order.id,
        )

        return settlement

    @staticmethod
    def _format_fee(value):
        if isinstance(value, Decimal):
            return f'{value:.2f}'
        return f'{Decimal(str(value)):.2f}' if value is not None else '0.00'

    @staticmethod
    @transaction.atomic
    def recalculate_settlement(settlement_id, operator=None, operator_role='finance', reason=''):
        settlement = FeeSettlement.objects.select_for_update().get(pk=settlement_id)
        order = RentalOrder.objects.select_for_update().get(pk=settlement.rental_order_id)

        fmt = SettlementService._format_fee
        old_values = {
            'base_fee': fmt(settlement.base_fee),
            'extension_fee': fmt(settlement.extension_fee),
            'damage_fee': fmt(settlement.damage_fee),
            'overdue_penalty': fmt(settlement.overdue_penalty),
            'total_fee': fmt(settlement.total_fee),
            'deposit_deducted': fmt(settlement.deposit_deducted),
            'refund_amount': fmt(settlement.refund_amount),
        }

        fees = SettlementService.calculate_fees(order)
        overdue_days = fees.pop('overdue_days', 0)
        for field, value in fees.items():
            setattr(settlement, field, value)
        settlement.save()

        new_values = {k: fmt(v) for k, v in fees.items()}

        field_labels = [
            ('base_fee', 'base'),
            ('extension_fee', 'ext'),
            ('damage_fee', 'dmg'),
            ('overdue_penalty', 'overdue'),
            ('total_fee', 'total'),
            ('deposit_deducted', 'deposit'),
            ('refund_amount', 'refund'),
        ]
        delta_parts = []
        for field, label in field_labels:
            old = old_values.get(field)
            new = new_values.get(field)
            if old != new:
                delta_parts.append(f'{label}({old}→{new})')

        detail_parts = [f'租赁单{order.order_no}费用结算已重算']
        if reason:
            detail_parts.append(f'[{reason}]')
        if delta_parts:
            detail_parts.append(' '.join(delta_parts))
        detail = ' '.join(detail_parts)

        AuditService.log(
            entity_type='settlement',
            entity_id=settlement.id,
            action='settlement_recalculated',
            operator=operator,
            operator_role=operator_role,
            detail=detail,
            old_value=old_values,
            new_value=new_values,
            related_entity_type='rental_order',
            related_entity_id=order.id,
        )

        return settlement

    @staticmethod
    @transaction.atomic
    def recalculate_on_extension_change(order, extension, operator=None, operator_role='finance'):
        if hasattr(order, 'fee_settlement'):
            settlement = order.fee_settlement
            SettlementService.recalculate_settlement(
                settlement.id,
                operator=operator,
                operator_role=operator_role,
                reason=f'租期延长审批通过，费用增量{extension.fee_delta}',
            )

    @staticmethod
    @transaction.atomic
    def mark_as_paid(settlement_id, operator=None, operator_role='finance', notes=''):
        settlement = FeeSettlement.objects.select_for_update().get(pk=settlement_id)

        if settlement.status != 'pending':
            raise ValueError(f'结算状态为{settlement.get_status_display()}，无法标记收款')

        old_status = settlement.status
        settlement.status = 'paid'
        settlement.settled_by = operator
        settlement.settled_at = timezone.now()
        if notes:
            settlement.notes = notes
        settlement.save(update_fields=['status', 'settled_by', 'settled_at', 'notes', 'updated_at'])

        AuditService.log(
            entity_type='settlement',
            entity_id=settlement.id,
            action='settlement_paid',
            operator=operator,
            operator_role=operator_role,
            detail=f'租赁单{settlement.rental_order.order_no}费用已收款，金额{settlement.total_fee}',
            old_value={'status': old_status},
            new_value={'status': 'paid', 'total_fee': str(settlement.total_fee)},
            related_entity_type='rental_order',
            related_entity_id=settlement.rental_order_id,
        )

        return settlement

    @staticmethod
    @transaction.atomic
    def mark_as_refunded(settlement_id, operator=None, operator_role='finance', notes=''):
        settlement = FeeSettlement.objects.select_for_update().get(pk=settlement_id)

        if settlement.status != 'paid':
            raise ValueError(f'结算状态为{settlement.get_status_display()}，无法标记退款')

        old_status = settlement.status
        settlement.status = 'refunded'
        if notes:
            settlement.notes = notes
        settlement.save(update_fields=['status', 'notes', 'updated_at'])

        AuditService.log(
            entity_type='settlement',
            entity_id=settlement.id,
            action='settlement_refunded',
            operator=operator,
            operator_role=operator_role,
            detail=f'租赁单{settlement.rental_order.order_no}押金已退款{settlement.refund_amount}',
            old_value={'status': old_status},
            new_value={'status': 'refunded', 'refund_amount': str(settlement.refund_amount)},
            related_entity_type='rental_order',
            related_entity_id=settlement.rental_order_id,
        )

        return settlement


class DamageService:
    @staticmethod
    @transaction.atomic
    def report_damage(rental_order_id, equipment_id, description,
                      estimated_cost, reported_by=None, operator_role='clerk'):
        order = RentalOrder.objects.get(pk=rental_order_id)
        equipment = Equipment.objects.get(pk=equipment_id)

        damage = DamageReport.objects.create(
            rental_order=order,
            equipment=equipment,
            description=description,
            estimated_cost=estimated_cost,
            reported_by=reported_by,
        )

        if hasattr(order, 'fee_settlement'):
            SettlementService.recalculate_settlement(
                order.fee_settlement.id,
                operator=reported_by,
                operator_role=operator_role,
                reason=f'损坏上报，预估费用{estimated_cost}',
            )

        AuditService.log(
            entity_type='damage',
            entity_id=damage.id,
            action='damage_reported',
            operator=reported_by,
            operator_role=operator_role,
            detail=f'租赁单{order.order_no}器材{equipment.name}损坏上报，预估{estimated_cost}',
            new_value={
                'equipment': equipment.name,
                'description': description,
                'estimated_cost': str(estimated_cost),
            },
            related_entity_type='rental_order',
            related_entity_id=order.id,
        )

        return damage

    @staticmethod
    @transaction.atomic
    def assess_damage(damage_id, actual_cost, operator=None, operator_role='manager'):
        damage = DamageReport.objects.select_for_update().get(pk=damage_id)

        damage.status = 'assessed'
        damage.actual_cost = actual_cost
        damage.save(update_fields=['status', 'actual_cost', 'updated_at'])

        if hasattr(damage.rental_order, 'fee_settlement'):
            SettlementService.recalculate_settlement(
                damage.rental_order.fee_settlement.id,
                operator=operator,
                operator_role=operator_role,
                reason=f'损坏定损完成，实际费用{actual_cost}',
            )

        AuditService.log(
            entity_type='damage',
            entity_id=damage.id,
            action='damage_assessed',
            operator=operator,
            operator_role=operator_role,
            detail=f'器材{damage.equipment.name}定损完成，实际费用{actual_cost}',
            old_value={'status': 'reported', 'estimated_cost': str(damage.estimated_cost)},
            new_value={'status': 'assessed', 'actual_cost': str(actual_cost)},
            related_entity_type='rental_order',
            related_entity_id=damage.rental_order_id,
        )

        return damage
