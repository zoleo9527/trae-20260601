from uuid import UUID

from ninja import Router
from django.contrib.auth import get_user_model

from equipment_booking.models import AppointmentOrder, AlertLog
from equipment_booking.schemas import (
    CreateOrderIn, AssignEquipmentIn, UsageRecordIn, ReviewOrderIn,
    ReturnOrderIn, ExceptionIn, HandleAlertIn,
    OrderOut, OrderDetailOut, UsageRecordOut, AlertOut, StuckOrderOut,
    TodoGroupOut, ErrorResponse, SuccessResponse,
)
from equipment_booking.services import (
    create_order_with_assessment, submit_assessment, assign_equipment,
    confirm_schedule, add_usage_record, finish_usage, review_order,
    mark_exception, return_order, detect_stuck_orders, get_order_trace,
    get_my_todos,
)
from equipment_booking.exceptions import BizError, ErrorCode

User = get_user_model()

router = Router(tags=['预约与使用记录'])


def _order_to_out(order: AppointmentOrder) -> dict:
    return {
        'id': order.id,
        'order_no': order.order_no,
        'patient_id': order.patient_id,
        'patient_name': order.patient.name,
        'equipment_id': order.equipment_id,
        'equipment_name': order.equipment.name if order.equipment else None,
        'status': order.status,
        'status_display': order.get_status_display(),
        'therapist_id': order.therapist_id,
        'receptionist_id': order.receptionist_id,
        'reviewer_id': order.reviewer_id,
        'scheduled_date': order.scheduled_date,
        'scheduled_time_start': order.scheduled_time_start,
        'scheduled_time_end': order.scheduled_time_end,
        'exception_reason': order.exception_reason,
        'return_reason': order.return_reason,
        'return_target_status': order.return_target_status,
        'created_at': order.updated_at,
        'updated_at': order.updated_at,
    }


@router.post('/orders', response={201: OrderOut, 409: ErrorResponse})
def create_order(request, payload: CreateOrderIn):
    order = create_order_with_assessment(
        user=request.user,
        patient_id=payload.patient_id,
        assessment_data=payload.assessment.dict(),
    )
    return 201, _order_to_out(order)


@router.post('/orders/{order_id}/submit-assessment', response={200: OrderOut, 422: ErrorResponse})
def submit_assessment_api(request, order_id: UUID):
    order = submit_assessment(user=request.user, order_id=order_id)
    return _order_to_out(order)


@router.post('/orders/{order_id}/assign-equipment', response={200: OrderOut, 409: ErrorResponse})
def assign_equipment_api(request, order_id: UUID, payload: AssignEquipmentIn):
    order = assign_equipment(
        user=request.user,
        order_id=order_id,
        equipment_id=payload.equipment_id,
        scheduled_date=payload.scheduled_date,
        time_start=payload.scheduled_time_start,
        time_end=payload.scheduled_time_end,
    )
    return _order_to_out(order)


@router.post('/orders/{order_id}/confirm-schedule', response={200: OrderOut})
def confirm_schedule_api(request, order_id: UUID):
    order = confirm_schedule(user=request.user, order_id=order_id)
    return _order_to_out(order)


@router.post('/orders/{order_id}/usage-records', response={201: UsageRecordOut})
def add_usage_record_api(request, order_id: UUID, payload: UsageRecordIn):
    record = add_usage_record(
        user=request.user,
        order_id=order_id,
        record_data=payload.dict(),
    )
    return 201, {
        'id': record.id,
        'order_id': record.order_id,
        'order_no': record.order.order_no,
        'operator_id': record.operator_id,
        'start_time': record.start_time,
        'end_time': record.end_time,
        'duration_minutes': record.duration_minutes,
        'actual_usage': record.actual_usage,
        'patient_feedback': record.patient_feedback,
        'abnormal': record.abnormal,
        'abnormal_note': record.abnormal_note,
        'created_at': record.created_at,
    }


@router.post('/orders/{order_id}/finish-usage', response={200: OrderOut})
def finish_usage_api(request, order_id: UUID):
    order = finish_usage(user=request.user, order_id=order_id)
    return _order_to_out(order)


@router.post('/orders/{order_id}/review', response={200: OrderOut})
def review_order_api(request, order_id: UUID, payload: ReviewOrderIn):
    order = review_order(user=request.user, order_id=order_id, action=payload.pass_type)
    return _order_to_out(order)


@router.post('/orders/{order_id}/exception', response={200: OrderOut})
def mark_exception_api(request, order_id: UUID, payload: ExceptionIn):
    order = mark_exception(user=request.user, order_id=order_id, reason=payload.reason)
    return _order_to_out(order)


@router.post('/orders/{order_id}/return', response={200: OrderOut})
def return_order_api(request, order_id: UUID, payload: ReturnOrderIn):
    order = return_order(
        user=request.user,
        order_id=order_id,
        target_status=payload.target_status,
        reason=payload.reason,
    )
    return _order_to_out(order)


@router.get('/orders/{order_id}/trace', response={200: dict})
def order_trace_api(request, order_id: UUID):
    return get_order_trace(order_id)


@router.get('/orders', response=list[OrderOut])
def list_orders(request, status: str = ''):
    qs = AppointmentOrder.objects.select_related('patient', 'equipment')
    if status:
        qs = qs.filter(status=status)
    return [_order_to_out(o) for o in qs]


@router.get('/my-todo', response=TodoGroupOut)
def my_todo_api(request):
    return get_my_todos(user=request.user)


@router.get('/stuck-orders', response=list[StuckOrderOut])
def stuck_orders_api(request):
    from equipment_booking.models import STATUS_TIMEOUT_HOURS
    from django.utils import timezone
    from datetime import timedelta

    now = timezone.now()
    result = []

    for status, hours in STATUS_TIMEOUT_HOURS.items():
        threshold = now - timedelta(hours=hours)
        orders = AppointmentOrder.objects.filter(
            status=status,
            updated_at__lt=threshold,
        ).select_related('patient', 'equipment')

        for order in orders:
            stuck_hours = (now - order.updated_at).total_seconds() / 3600
            alerts = order.alerts.filter(handled='pending')
            result.append({
                'order': _order_to_out(order),
                'stuck_hours': stuck_hours,
                'timeout_threshold': hours,
                'alerts': [
                    {
                        'id': a.id,
                        'order_id': a.order_id,
                        'order_no': a.order.order_no,
                        'level': a.level,
                        'message': a.message,
                        'handled': a.handled,
                        'handler_id': a.handler_id,
                        'handled_at': a.handled_at,
                        'created_at': a.created_at,
                    }
                    for a in alerts
                ],
            })

    return result


@router.post('/detect-stuck', response=SuccessResponse)
def detect_stuck_api(request):
    stuck = detect_stuck_orders()
    count = len(stuck)
    return {
        'code': 'OK',
        'message': f'检测完成，发现 {count} 笔卡单',
        'data': {'count': count},
    }


@router.get('/alerts', response=list[AlertOut])
def list_alerts(request, handled: str = ''):
    qs = AlertLog.objects.select_related('order')
    if handled:
        qs = qs.filter(handled=handled)
    return [
        {
            'id': a.id,
            'order_id': a.order_id,
            'order_no': a.order.order_no,
            'level': a.level,
            'message': a.message,
            'handled': a.handled,
            'handler_id': a.handler_id,
            'handled_at': a.handled_at,
            'created_at': a.created_at,
        }
        for a in qs
    ]


@router.post('/alerts/{alert_id}/handle', response=SuccessResponse)
def handle_alert_api(request, alert_id: UUID, payload: HandleAlertIn):
    try:
        alert = AlertLog.objects.get(id=alert_id)
    except AlertLog.DoesNotExist:
        raise BizError(ErrorCode.ALERT_NOT_FOUND, f'告警 {alert_id} 不存在')

    from django.utils import timezone

    if payload.action == 'return':
        if not payload.return_target_status:
            raise BizError(ErrorCode.INVALID_PARAMS, '退回操作需指定目标状态')
        return_order(
            user=request.user,
            order_id=alert.order_id,
            target_status=payload.return_target_status,
            reason=payload.return_reason,
        )
        alert.handled = 'returned'
    elif payload.action == 'dismiss':
        alert.handled = 'dismissed'
    elif payload.action == 'resolve':
        alert.handled = 'resolved'
    else:
        raise BizError(ErrorCode.INVALID_PARAMS, f'不支持的操作: {payload.action}')

    alert.handler = request.user
    alert.handled_at = timezone.now()
    alert.save(update_fields=['handled', 'handler_id', 'handled_at'])

    return {'code': 'OK', 'message': '处理成功', 'data': {'alert_id': str(alert_id), 'handled': alert.handled}}
