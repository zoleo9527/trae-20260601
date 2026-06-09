from __future__ import annotations
from datetime import timedelta
from typing import Optional
from uuid import UUID

from django.db import transaction
from django.utils import timezone

from equipment_booking.exceptions import BizError, ErrorCode
from equipment_booking.idempotency import make_idempotency_key, check_idempotency, record_idempotency
from equipment_booking.models import (
    AppointmentOrder, Assessment, UsageRecord, AlertLog, Equipment, Patient,
    StaffProfile, VALID_TRANSITIONS, STATUS_TIMEOUT_HOURS,
)


def _get_order_or_404(order_id: UUID) -> AppointmentOrder:
    try:
        return AppointmentOrder.objects.get(id=order_id)
    except AppointmentOrder.DoesNotExist:
        raise BizError(ErrorCode.ORDER_NOT_FOUND, f'预约单 {order_id} 不存在')


def _validate_transition(order: AppointmentOrder, target_status: str):
    allowed = VALID_TRANSITIONS.get(order.status, [])
    if target_status not in allowed:
        raise BizError(
            ErrorCode.INVALID_STATUS_TRANSITION,
            f'预约单 {order.order_no} 不能从 [{order.status}] 转到 [{target_status}]，允许: {allowed}',
        )


def _get_user_role(user) -> str:
    try:
        return user.staff_profile.role
    except StaffProfile.DoesNotExist:
        raise BizError(ErrorCode.ROLE_MISMATCH, f'用户 {user.username} 未分配角色，无法操作')


def _validate_role(user, expected_role: str, action_desc: str):
    role = _get_user_role(user)
    if role != expected_role:
        raise BizError(
            ErrorCode.ROLE_MISMATCH,
            f'当前角色 [{role}] 无权执行 [{action_desc}]，需要角色 [{expected_role}]',
            {'required_role': expected_role, 'actual_role': role},
        )


def _release_equipment(order: AppointmentOrder):
    if order.equipment and order.equipment.status == 'in_use':
        order.equipment.status = 'available'
        order.equipment.save(update_fields=['status', 'updated_at'])


def _close_pending_alerts(order: AppointmentOrder, handler, action: str = 'returned'):
    pending = AlertLog.objects.filter(order=order, handled='pending')
    now = timezone.now()
    pending.update(handled=action, handler=handler, handled_at=now)


def _generate_order_no() -> str:
    today = timezone.now().strftime('%Y%m%d')
    prefix = f'RC{today}'
    last = AppointmentOrder.objects.filter(order_no__startswith=prefix).order_by('-order_no').first()
    seq = 1
    if last:
        try:
            seq = int(last.order_no[-4:]) + 1
        except ValueError:
            seq = 1
    return f'{prefix}{seq:04d}'


def create_order_with_assessment(user, patient_id: UUID, assessment_data: dict) -> AppointmentOrder:
    _validate_role(user, 'therapist', '创建预约单')

    idem_key = make_idempotency_key(user.id, 'create_order', {'patient_id': str(patient_id), **assessment_data})
    existing = check_idempotency(idem_key)
    if existing:
        raise BizError(ErrorCode.DUPLICATE_REQUEST, '重复提交', {'idempotency_key': idem_key})

    try:
        patient = Patient.objects.get(id=patient_id)
    except Patient.DoesNotExist:
        raise BizError(ErrorCode.PATIENT_NOT_FOUND, f'患者 {patient_id} 不存在')

    with transaction.atomic():
        order = AppointmentOrder.objects.create(
            order_no=_generate_order_no(),
            patient=patient,
            therapist=user,
            status='draft',
        )
        Assessment.objects.create(order=order, **assessment_data)

    record_idempotency(idem_key, 201, {'order_id': str(order.id), 'order_no': order.order_no})
    return order


def submit_assessment(user, order_id: UUID) -> AppointmentOrder:
    _validate_role(user, 'therapist', '提交评估')

    order = _get_order_or_404(order_id)
    if order.therapist_id != user.id:
        raise BizError(ErrorCode.PERMISSION_DENIED, '仅本单治疗师可提交评估')
    if not hasattr(order, 'assessment'):
        raise BizError(ErrorCode.ASSESSMENT_REQUIRED, '请先填写评估表')
    _validate_transition(order, 'pending_assign')

    order.status = 'pending_assign'
    order.save(update_fields=['status', 'updated_at'])
    return order


def assign_equipment(user, order_id: UUID, equipment_id: UUID, scheduled_date, time_start, time_end) -> AppointmentOrder:
    _validate_role(user, 'receptionist', '分配器械')

    order = _get_order_or_404(order_id)
    _validate_transition(order, 'assigned')

    try:
        equip = Equipment.objects.get(id=equipment_id)
    except Equipment.DoesNotExist:
        raise BizError(ErrorCode.EQUIPMENT_NOT_FOUND, f'器械 {equipment_id} 不存在')

    if equip.status != 'available':
        raise BizError(ErrorCode.EQUIPMENT_NOT_AVAILABLE, f'器械 {equip.code} 当前状态为 [{equip.status}]，不可分配')

    with transaction.atomic():
        order.equipment = equip
        order.receptionist = user
        order.scheduled_date = scheduled_date
        order.scheduled_time_start = time_start
        order.scheduled_time_end = time_end
        order.status = 'assigned'
        order.save(update_fields=['equipment_id', 'receptionist_id', 'scheduled_date',
                                  'scheduled_time_start', 'scheduled_time_end', 'status', 'updated_at'])
        equip.status = 'in_use'
        equip.save(update_fields=['status', 'updated_at'])

    return order


def confirm_schedule(user, order_id: UUID) -> AppointmentOrder:
    _validate_role(user, 'receptionist', '确认排班')

    order = _get_order_or_404(order_id)
    _validate_transition(order, 'in_use')
    if not order.equipment_id:
        raise BizError(ErrorCode.EQUIPMENT_REQUIRED, '请先分配器械')
    if not order.scheduled_date:
        raise BizError(ErrorCode.SCHEDULE_REQUIRED, '请先确认排班时间')

    order.status = 'in_use'
    order.save(update_fields=['status', 'updated_at'])
    return order


def add_usage_record(user, order_id: UUID, record_data: dict) -> UsageRecord:
    _validate_role(user, 'therapist', '添加使用记录')

    order = _get_order_or_404(order_id)
    if order.therapist_id != user.id:
        raise BizError(ErrorCode.PERMISSION_DENIED, '仅本单治疗师可添加使用记录')

    if order.status != 'in_use':
        raise BizError(ErrorCode.INVALID_STATUS_TRANSITION, f'仅 [使用中] 状态可添加使用记录，当前: [{order.status}]')

    with transaction.atomic():
        record = UsageRecord.objects.create(order=order, operator=user, **record_data)

        if record_data.get('abnormal', False):
            AlertLog.objects.create(
                order=order,
                level='error',
                message=f'使用异常: {record_data.get("abnormal_note", "未填写异常说明")}',
            )
            order.previous_status = order.status
            order.status = 'exception'
            order.exception_reason = f'使用异常: {record_data.get("abnormal_note", "")}'
            order.save(update_fields=['status', 'previous_status', 'exception_reason', 'updated_at'])
            _release_equipment(order)

    return record


def finish_usage(user, order_id: UUID) -> AppointmentOrder:
    _validate_role(user, 'therapist', '结束使用')

    order = _get_order_or_404(order_id)
    if order.therapist_id != user.id:
        raise BizError(ErrorCode.PERMISSION_DENIED, '仅本单治疗师可结束使用')

    _validate_transition(order, 'pending_review')

    if not order.usage_records.exists():
        raise BizError(ErrorCode.ASSESSMENT_REQUIRED, '请先添加使用记录')

    order.status = 'pending_review'
    order.save(update_fields=['status', 'updated_at'])
    return order


def review_order(user, order_id: UUID, action: str) -> AppointmentOrder:
    _validate_role(user, 'director', '审核预约单')

    order = _get_order_or_404(order_id)
    _validate_transition(order, 'completed')

    if action == 'approve':
        with transaction.atomic():
            order.status = 'completed'
            order.reviewer = user
            order.save(update_fields=['status', 'reviewer_id', 'updated_at'])
            _release_equipment(order)
            _close_pending_alerts(order, handler=user, action='resolved')
    else:
        raise BizError(ErrorCode.INVALID_PARAMS, f'不支持的操作: {action}')

    return order


def mark_exception(user, order_id: UUID, reason: str) -> AppointmentOrder:
    _validate_role(user, 'director', '标记异常')

    order = _get_order_or_404(order_id)
    _validate_transition(order, 'exception')

    with transaction.atomic():
        order.previous_status = order.status
        order.status = 'exception'
        order.exception_reason = reason
        order.save(update_fields=['status', 'previous_status', 'exception_reason', 'updated_at'])

        AlertLog.objects.create(
            order=order,
            level='error',
            message=f'异常标记: {reason}',
        )
        _release_equipment(order)

    return order


def return_order(user, order_id: UUID, target_status: str, reason: str) -> AppointmentOrder:
    _validate_role(user, 'director', '退回预约单')

    order = _get_order_or_404(order_id)
    if order.status != 'exception':
        raise BizError(ErrorCode.INVALID_STATUS_TRANSITION, '仅异常单可退回')
    if target_status not in VALID_TRANSITIONS.get('exception', []):
        raise BizError(ErrorCode.INVALID_STATUS_TRANSITION, f'不可退回至 [{target_status}]')

    with transaction.atomic():
        order.status = target_status
        order.return_reason = reason
        order.return_target_status = target_status
        order.exception_reason = ''
        order.reviewer = user
        order.save(update_fields=['status', 'return_reason', 'return_target_status', 'exception_reason',
                                  'reviewer_id', 'updated_at'])

        if target_status in ('assigned', 'in_use') and order.equipment:
            order.equipment.status = 'in_use'
            order.equipment.save(update_fields=['status', 'updated_at'])
        elif target_status in ('draft', 'pending_assign'):
            pass

        AlertLog.objects.create(
            order=order,
            level='info',
            message=f'退回至 [{target_status}]: {reason}',
            handled='returned',
            handler=user,
            handled_at=timezone.now(),
        )

        _close_pending_alerts(order, handler=user, action='returned')

    return order


def detect_stuck_orders() -> list[dict]:
    now = timezone.now()
    stuck = []

    for status, hours in STATUS_TIMEOUT_HOURS.items():
        threshold = now - timedelta(hours=hours)
        orders = AppointmentOrder.objects.filter(
            status=status,
            updated_at__lt=threshold,
        )

        for order in orders:
            stuck_hours = (now - order.updated_at).total_seconds() / 3600

            with transaction.atomic():
                alert = AlertLog.objects.create(
                    order=order,
                    level='warning',
                    message=f'预约单在 [{order.get_status_display()}] 状态已滞留 {stuck_hours:.1f} 小时，超时阈值 {hours} 小时',
                )
                order.previous_status = order.status
                order.status = 'exception'
                order.exception_reason = f'超时滞留: 在 [{status}] 状态超过 {hours} 小时'
                order.save(update_fields=['status', 'previous_status', 'exception_reason', 'updated_at'])
                _release_equipment(order)

            stuck.append({
                'order': order,
                'stuck_hours': stuck_hours,
                'timeout_threshold': hours,
                'alert': alert,
            })

    return stuck


def get_order_trace(order_id: UUID) -> dict:
    order = _get_order_or_404(order_id)

    assessment_data = None
    if hasattr(order, 'assessment'):
        a = order.assessment
        assessment_data = {
            'id': str(a.id),
            'motor_function': a.motor_function,
            'pain_level': a.pain_level,
            'range_of_motion': a.range_of_motion,
            'treatment_goal': a.treatment_goal,
            'equipment_requirement': a.equipment_requirement,
            'notes': a.notes,
            'created_at': a.created_at.isoformat(),
        }

    usage_records = []
    for r in order.usage_records.all():
        usage_records.append({
            'id': str(r.id),
            'operator_id': r.operator_id,
            'start_time': r.start_time.isoformat(),
            'end_time': r.end_time.isoformat() if r.end_time else None,
            'duration_minutes': r.duration_minutes,
            'actual_usage': r.actual_usage,
            'patient_feedback': r.patient_feedback,
            'abnormal': r.abnormal,
            'abnormal_note': r.abnormal_note,
            'created_at': r.created_at.isoformat(),
        })

    alerts = []
    for a in order.alerts.all():
        alerts.append({
            'id': str(a.id),
            'level': a.level,
            'message': a.message,
            'handled': a.handled,
            'handler_id': a.handler_id,
            'handled_at': a.handled_at.isoformat() if a.handled_at else None,
            'created_at': a.created_at.isoformat(),
        })

    return {
        'order': {
            'id': str(order.id),
            'order_no': order.order_no,
            'patient_id': str(order.patient_id),
            'patient_name': order.patient.name,
            'equipment_id': str(order.equipment_id) if order.equipment_id else None,
            'equipment_name': order.equipment.name if order.equipment else None,
            'status': order.status,
            'status_display': order.get_status_display(),
            'therapist_id': order.therapist_id,
            'receptionist_id': order.receptionist_id,
            'reviewer_id': order.reviewer_id,
            'scheduled_date': str(order.scheduled_date) if order.scheduled_date else None,
            'scheduled_time_start': str(order.scheduled_time_start) if order.scheduled_time_start else None,
            'scheduled_time_end': str(order.scheduled_time_end) if order.scheduled_time_end else None,
            'exception_reason': order.exception_reason,
            'return_reason': order.return_reason,
            'return_target_status': order.return_target_status,
            'created_at': order.created_at.isoformat(),
            'updated_at': order.updated_at.isoformat(),
        },
        'assessment': assessment_data,
        'usage_records': usage_records,
        'alerts': alerts,
        'timeline': _build_timeline(order, assessment_data, usage_records, alerts),
    }


def _build_timeline(order, assessment, usage_records, alerts) -> list[dict]:
    events = []

    events.append({
        'time': order.created_at.isoformat(),
        'action': '创建预约单',
        'actor': f'治疗师({order.therapist_id})',
        'detail': f'患者: {order.patient.name}',
    })

    if assessment:
        events.append({
            'time': assessment.get('created_at', ''),
            'action': '填写评估表',
            'actor': f'治疗师({order.therapist_id})',
            'detail': f'疼痛等级: {assessment.get("pain_level", "-")}',
        })

    if order.receptionist_id:
        events.append({
            'time': order.updated_at.isoformat(),
            'action': '分配器械与排班',
            'actor': f'前台({order.receptionist_id})',
            'detail': f'器械: {order.equipment.name if order.equipment else "-"}, '
                      f'日期: {order.scheduled_date}',
        })

    for r in usage_records:
        events.append({
            'time': r['created_at'],
            'action': '记录使用',
            'actor': f'操作员({r["operator_id"]})',
            'detail': f'时长: {r["duration_minutes"] or "-"}分钟'
                      + (f' [异常: {r["abnormal_note"]}]' if r['abnormal'] else ''),
        })

    for a in alerts:
        events.append({
            'time': a['created_at'],
            'action': f'告警[{a["level"]}]',
            'actor': '系统',
            'detail': a['message'],
        })

    if order.reviewer_id:
        events.append({
            'time': order.updated_at.isoformat(),
            'action': '主任审核' if order.status == 'completed' else '主任处理',
            'actor': f'主任({order.reviewer_id})',
            'detail': '',
        })

    events.sort(key=lambda e: e['time'])
    return events


_ROLE_STATUS_MAP = {
    'therapist': ['draft', 'in_use', 'exception'],
    'receptionist': ['pending_assign', 'assigned'],
    'director': ['pending_review', 'exception'],
}

_STATUS_META = {
    'draft': {
        'stuck_reason': '评估表未提交，等待治疗师完成评估',
        'responsible_role': 'therapist',
        'suggested_action': '提交评估，将预约单流转至前台分配器械',
    },
    'pending_assign': {
        'stuck_reason': '等待前台分配器械与排班',
        'responsible_role': 'receptionist',
        'suggested_action': '分配器械并确认排班时间',
    },
    'assigned': {
        'stuck_reason': '器械已分配，等待前台确认排班',
        'responsible_role': 'receptionist',
        'suggested_action': '确认排班，将预约单流转至使用中',
    },
    'in_use': {
        'stuck_reason': '治疗进行中，等待治疗师记录使用并结束',
        'responsible_role': 'therapist',
        'suggested_action': '添加使用记录并结束使用，流转至主任审核',
    },
    'pending_review': {
        'stuck_reason': '等待主任审核使用记录',
        'responsible_role': 'director',
        'suggested_action': '审核通过完成预约单，或标记异常',
    },
    'exception': {
        'stuck_reason': '预约单处于异常状态，需处理',
        'responsible_role': 'director',
        'suggested_action': '退回至合适阶段重新流转，或关闭',
    },
}

_EXCEPTION_RESPONSIBLE_MAP = {
    'draft': 'therapist',
    'pending_assign': 'receptionist',
    'assigned': 'receptionist',
    'in_use': 'therapist',
    'pending_review': 'director',
}


def _exception_stuck_reason(previous_status: str, exception_reason: str) -> str:
    status_label = dict(AppointmentOrder.STATUS_CHOICES).get(previous_status, previous_status)
    base = f'预约单在[{status_label}]阶段发生异常'
    if exception_reason:
        base += f'（原因: {exception_reason}）'
    return base


def _exception_suggested_action(responsible_role: str, viewer_role: str) -> str:
    if viewer_role == responsible_role:
        if responsible_role == 'therapist':
            return '确认异常原因，可继续记录使用或等待主任处理'
        elif responsible_role == 'receptionist':
            return '确认异常原因，等待主任退回后重新分配'
        return '审核异常原因，退回至合适阶段或关闭'
    if viewer_role == 'director':
        return '审核异常原因，退回至合适阶段或关闭'
    if viewer_role == 'therapist':
        return '确认异常原因，可继续记录使用或等待主任处理'
    return '查看异常原因'


def _order_to_todo_item(order: AppointmentOrder, role: str) -> dict:
    now = timezone.now()
    threshold = STATUS_TIMEOUT_HOURS.get(order.status, 0)
    over_hours = max((now - order.updated_at).total_seconds() / 3600 - threshold, 0)

    if order.status == 'exception':
        previous = order.previous_status or 'pending_review'
        responsible = _EXCEPTION_RESPONSIBLE_MAP.get(previous, 'director')
        stuck_reason = _exception_stuck_reason(previous, order.exception_reason)
        suggested_action = _exception_suggested_action(responsible, role)
    else:
        base = _STATUS_META.get(order.status, {})
        stuck_reason = base.get('stuck_reason', '未知状态')
        suggested_action = base.get('suggested_action', '请联系管理员')
        responsible = base.get('responsible_role', role)

    if order.return_reason and order.status != 'exception':
        stuck_reason = f'主任退回（{order.return_reason}），需重新操作'
        if order.return_target_status == 'draft':
            suggested_action = '主任已退回，请重新提交评估'
        elif order.return_target_status == 'in_use':
            suggested_action = '主任已退回，请继续记录使用'
        elif order.return_target_status == 'pending_assign':
            suggested_action = '主任已退回，请重新分配器械'

    resp_user = _get_responsible_user(order, responsible)

    return {
        'order_id': order.id,
        'order_no': order.order_no,
        'patient_name': order.patient.name,
        'status': order.status,
        'status_display': order.get_status_display(),
        'stuck_reason': stuck_reason,
        'responsible_role': responsible,
        'responsible_user_id': resp_user['user_id'],
        'responsible_username': resp_user['username'],
        'over_hours': round(over_hours, 1),
        'timeout_threshold': threshold,
        'suggested_action': suggested_action,
        'exception_reason': order.exception_reason,
        'return_reason': order.return_reason,
        'return_target_status': order.return_target_status,
        'created_at': order.created_at,
        'updated_at': order.updated_at,
    }


def _get_responsible_user(order: AppointmentOrder, responsible_role: str) -> dict:
    if responsible_role == 'therapist':
        user = order.therapist
        return {'user_id': user.id, 'username': user.username}
    elif responsible_role == 'receptionist':
        if order.receptionist_id:
            return {'user_id': order.receptionist_id, 'username': order.receptionist.username}
        return {'user_id': 0, 'username': '（待分配前台）'}
    elif responsible_role == 'director':
        if order.reviewer_id:
            return {'user_id': order.reviewer_id, 'username': order.reviewer.username}
        return {'user_id': 0, 'username': '（待分配主任）'}
    return {'user_id': 0, 'username': ''}


def get_my_todos(user) -> dict:
    role = _get_user_role(user)
    statuses = _ROLE_STATUS_MAP.get(role, [])

    items = []
    for status in statuses:
        qs = AppointmentOrder.objects.filter(
            status=status,
        ).select_related('patient', 'equipment', 'therapist', 'receptionist', 'reviewer')

        if role == 'therapist':
            if status in ('draft', 'in_use'):
                qs = qs.filter(therapist_id=user.id)
            elif status == 'exception':
                qs = qs.filter(
                    therapist_id=user.id,
                    previous_status__in=['draft', 'in_use'],
                )

        elif role == 'receptionist':
            if status == 'pending_assign':
                pass
            elif status == 'assigned':
                qs = qs.filter(receptionist_id=user.id)

        elif role == 'director':
            pass

        for order in qs:
            items.append(_order_to_todo_item(order, role))

    items.sort(key=lambda x: (-x['over_hours'], x['updated_at']))

    return {
        'role': role,
        'total': len(items),
        'items': items,
    }
