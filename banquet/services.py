from django.utils import timezone
from django.db import transaction
from .models import (
    BanquetBooking, BookingStatus, AuditLog, StuckLevel,
    Employee, Role, MenuConfirmation, MenuConfirmationItem
)


class StateTransitionError(Exception):
    pass


def _log_audit(booking, action, from_status, to_status, operator, remarks='', ip_address=None):
    AuditLog.objects.create(
        booking=booking,
        action=action,
        from_status=from_status,
        to_status=to_status,
        operator=operator,
        operator_role=operator.role,
        remarks=remarks,
        ip_address=ip_address
    )


def submit_booking(booking_id, operator_id, remarks='', ip_address=None):
    with transaction.atomic():
        booking = BanquetBooking.objects.select_for_update().get(id=booking_id)
        operator = Employee.objects.get(id=operator_id)

        if operator.role != Role.SALES:
            raise StateTransitionError('只有宴会销售可以提交预订')

        if booking.sales_person_id != operator_id:
            raise StateTransitionError('只能提交自己创建的预订')

        if booking.status != BookingStatus.DRAFT:
            raise StateTransitionError(f'当前状态 [{booking.get_status_display()}] 不允许提交')

        from_status = booking.status
        booking.status = BookingStatus.SUBMITTED
        booking.submitted_at = timezone.now()
        booking.save()

        _log_audit(
            booking=booking,
            action='提交宴会预订',
            from_status=from_status,
            to_status=booking.status,
            operator=operator,
            remarks=remarks,
            ip_address=ip_address
        )

        return booking


def confirm_menu(booking_id, operator_id, menu_data, remarks='', ip_address=None):
    with transaction.atomic():
        booking = BanquetBooking.objects.select_for_update().get(id=booking_id)
        operator = Employee.objects.get(id=operator_id)

        if operator.role != Role.FLOOR_SUPERVISOR:
            raise StateTransitionError('只有厅面主管可以确认菜单')

        if booking.status != BookingStatus.SUBMITTED:
            raise StateTransitionError(f'当前状态 [{booking.get_status_display()}] 不允许确认菜单')

        from_status = booking.status

        menu_confirm, created = MenuConfirmation.objects.update_or_create(
            booking=booking,
            defaults={
                'confirmed_by': operator,
                'confirmed_at': timezone.now(),
                'special_requirements': menu_data.get('special_requirements', ''),
                'wine_arrangement': menu_data.get('wine_arrangement', ''),
                'table_layout': menu_data.get('table_layout', ''),
                'customer_signed': menu_data.get('customer_signed', False),
                'customer_signature': menu_data.get('customer_signature', ''),
                'remarks': menu_data.get('remarks', ''),
                'total_amount': menu_data.get('total_amount', 0),
            }
        )

        if not created:
            menu_confirm.menu_items.clear()

        total_amount = 0
        for item in menu_data.get('items', []):
            detail = MenuConfirmationItem.objects.create(
                menu_confirmation=menu_confirm,
                menu_item_id=item['menu_item_id'],
                quantity=item['quantity'],
                unit_price=item['unit_price'],
                subtotal=item['quantity'] * item['unit_price'],
                remarks=item.get('remarks', '')
            )
            total_amount += detail.subtotal

        menu_confirm.total_amount = total_amount
        menu_confirm.save()

        booking.status = BookingStatus.MENU_CONFIRMED
        booking.floor_supervisor = operator
        booking.save()

        _log_audit(
            booking=booking,
            action='确认菜单',
            from_status=from_status,
            to_status=booking.status,
            operator=operator,
            remarks=remarks,
            ip_address=ip_address
        )

        return booking, menu_confirm


def receive_by_kitchen(booking_id, operator_id, remarks='', ip_address=None):
    with transaction.atomic():
        booking = BanquetBooking.objects.select_for_update().get(id=booking_id)
        operator = Employee.objects.get(id=operator_id)

        if operator.role != Role.KITCHEN_COORDINATOR:
            raise StateTransitionError('只有后厨统筹可以接收任务')

        if booking.status != BookingStatus.MENU_CONFIRMED:
            raise StateTransitionError(f'当前状态 [{booking.get_status_display()}] 不允许后厨接收')

        from_status = booking.status
        booking.status = BookingStatus.KITCHEN_RECEIVED
        booking.kitchen_coordinator = operator
        booking.save()

        _log_audit(
            booking=booking,
            action='后厨接收任务',
            from_status=from_status,
            to_status=booking.status,
            operator=operator,
            remarks=remarks,
            ip_address=ip_address
        )

        return booking


def start_service(booking_id, operator_id, remarks='', ip_address=None):
    with transaction.atomic():
        booking = BanquetBooking.objects.select_for_update().get(id=booking_id)
        operator = Employee.objects.get(id=operator_id)

        if booking.status != BookingStatus.KITCHEN_RECEIVED:
            raise StateTransitionError(f'当前状态 [{booking.get_status_display()}] 不允许开始服务')

        from_status = booking.status
        booking.status = BookingStatus.IN_PROGRESS
        booking.save()

        _log_audit(
            booking=booking,
            action='开始宴会服务',
            from_status=from_status,
            to_status=booking.status,
            operator=operator,
            remarks=remarks,
            ip_address=ip_address
        )

        return booking


def complete_booking(booking_id, operator_id, remarks='', ip_address=None):
    with transaction.atomic():
        booking = BanquetBooking.objects.select_for_update().get(id=booking_id)
        operator = Employee.objects.get(id=operator_id)

        if booking.status != BookingStatus.IN_PROGRESS:
            raise StateTransitionError(f'当前状态 [{booking.get_status_display()}] 不允许完成')

        from_status = booking.status
        booking.status = BookingStatus.COMPLETED
        booking.save()

        _log_audit(
            booking=booking,
            action='完成宴会',
            from_status=from_status,
            to_status=booking.status,
            operator=operator,
            remarks=remarks,
            ip_address=ip_address
        )

        return booking


def cancel_booking(booking_id, operator_id, remarks='', ip_address=None):
    with transaction.atomic():
        booking = BanquetBooking.objects.select_for_update().get(id=booking_id)
        operator = Employee.objects.get(id=operator_id)

        if booking.status in [BookingStatus.COMPLETED, BookingStatus.CANCELLED]:
            raise StateTransitionError(f'当前状态 [{booking.get_status_display()}] 不允许取消')

        from_status = booking.status
        booking.status = BookingStatus.CANCELLED
        booking.save()

        _log_audit(
            booking=booking,
            action='取消宴会预订',
            from_status=from_status,
            to_status=booking.status,
            operator=operator,
            remarks=remarks,
            ip_address=ip_address
        )

        return booking


def get_stuck_bookings():
    bookings = BanquetBooking.objects.exclude(
        status__in=[BookingStatus.COMPLETED, BookingStatus.CANCELLED, BookingStatus.DRAFT]
    )

    result = []
    for booking in bookings:
        stuck_level = booking.get_stuck_level()
        if stuck_level != 'normal':
            deadline = booking.get_stuck_deadline()
            now = timezone.now()
            overdue_hours = 0
            if deadline and now > deadline:
                overdue_hours = int((now - deadline).total_seconds() / 3600)

            result.append({
                'booking': booking,
                'stuck_level': stuck_level,
                'stuck_level_display': StuckLevel(stuck_level).label,
                'deadline': deadline,
                'overdue_hours': overdue_hours,
            })

    result.sort(key=lambda x: (x['stuck_level'], x['deadline'] or timezone.now()))
    return result
