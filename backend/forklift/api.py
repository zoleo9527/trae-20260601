from datetime import datetime, date
from uuid import UUID
from django.utils import timezone
from django.db import transaction, models
from django.shortcuts import get_object_or_404
from ninja import NinjaAPI, Router, Query

from .models import ForkliftWorkOrder, StatusHistory, WorkOrderStatus, Role
from .schemas import (
    WorkOrderCreate,
    WorkOrderDispatch,
    WorkOrderStartWork,
    WorkOrderEndWork,
    WorkOrderConfirm,
    WorkOrderReturn,
    WorkOrderException,
    WorkOrderOut,
    WorkOrderListOut,
    TodoItemOut,
    DashboardStats,
)

api = NinjaAPI(
    title='叉车派工与作业计时 API',
    version='1.0.0',
    description='物流园月台叉车派工与作业计时系统接口',
)

router = Router()


def add_status_history(work_order: ForkliftWorkOrder, from_status: str, to_status: str,
                       operator_role: str, operator_name: str, remark: str = None):
    StatusHistory.objects.create(
        work_order=work_order,
        from_status=from_status,
        to_status=to_status,
        operator_role=operator_role,
        operator_name=operator_name,
        remark=remark,
    )


@router.get('/dashboard/stats', response=DashboardStats, summary='获取看板统计数据')
def get_dashboard_stats(request):
    today = date.today()
    today_start = datetime.combine(today, datetime.min.time(), tzinfo=timezone.get_current_timezone())

    total = ForkliftWorkOrder.objects.count()
    pending_dispatch = ForkliftWorkOrder.objects.filter(status=WorkOrderStatus.PENDING_DISPATCH).count()
    in_progress = ForkliftWorkOrder.objects.filter(
        status__in=[WorkOrderStatus.DISPATCHED, WorkOrderStatus.IN_PROGRESS]
    ).count()
    pending_confirm = ForkliftWorkOrder.objects.filter(status=WorkOrderStatus.PENDING_CONFIRM).count()
    completed_today = ForkliftWorkOrder.objects.filter(
        status=WorkOrderStatus.COMPLETED,
        updated_at__gte=today_start,
    ).count()
    exception_count = ForkliftWorkOrder.objects.filter(status=WorkOrderStatus.EXCEPTION).count()

    return {
        'total': total,
        'pending_dispatch': pending_dispatch,
        'in_progress': in_progress,
        'pending_confirm': pending_confirm,
        'completed_today': completed_today,
        'exception_count': exception_count,
    }


@router.get('/todos/{role}', response=TodoItemOut, summary='获取指定角色的待办列表')
def get_todos_by_role(request, role: Role):
    items = ForkliftWorkOrder.objects.filter(current_role=role)

    return {
        'role': role,
        'role_name': role.label,
        'pending_count': items.count(),
        'items': list(items),
    }


@router.get('/todos', response=list[TodoItemOut], summary='获取所有角色的待办列表')
def get_all_todos(request):
    result = []
    for role in Role:
        todo = get_todos_by_role(request, role)
        result.append(todo)
    return result


@router.get('/work-orders', response=list[WorkOrderListOut], summary='获取作业单列表')
def list_work_orders(
    request,
    status: WorkOrderStatus = Query(None, description='状态过滤'),
    current_role: Role = Query(None, description='当前负责角色过滤'),
    keyword: str = Query(None, description='车牌号/司机姓名搜索'),
):
    qs = ForkliftWorkOrder.objects.all()

    if status:
        qs = qs.filter(status=status)
    if current_role:
        qs = qs.filter(current_role=current_role)
    if keyword:
        qs = qs.filter(
            models.Q(vehicle_plate__icontains=keyword) |
            models.Q(driver_name__icontains=keyword)
        )

    return list(qs)


@router.post('/work-orders', response={201: WorkOrderOut, 200: WorkOrderOut}, summary='幂等创建作业单')
@transaction.atomic
def create_work_order(request, payload: WorkOrderCreate):
    existing = ForkliftWorkOrder.objects.filter(idempotency_key=payload.idempotency_key).first()
    if existing:
        return 200, existing

    work_order = ForkliftWorkOrder.objects.create(
        idempotency_key=payload.idempotency_key,
        vehicle_plate=payload.vehicle_plate,
        driver_name=payload.driver_name,
        driver_phone=payload.driver_phone,
        dock_number=payload.dock_number,
        cargo_type=payload.cargo_type,
        cargo_weight=payload.cargo_weight,
        supplementary_notes=payload.supplementary_notes,
        status=WorkOrderStatus.PENDING_DISPATCH,
        current_role=Role.DISPATCHER,
    )

    add_status_history(
        work_order=work_order,
        from_status='',
        to_status=WorkOrderStatus.PENDING_DISPATCH,
        operator_role=Role.DISPATCHER,
        operator_name='系统',
        remark='创建作业单',
    )

    return 201, work_order


@router.get('/work-orders/{work_order_id}', response=WorkOrderOut, summary='获取作业单详情（含状态历史）')
def get_work_order(request, work_order_id: UUID):
    work_order = get_object_or_404(ForkliftWorkOrder, id=work_order_id)
    history_list = []
    for h in work_order.status_history.all():
        history_list.append({
            'id': h.id,
            'from_status': h.from_status if h.from_status else None,
            'to_status': h.to_status,
            'operator_role': h.operator_role,
            'operator_name': h.operator_name,
            'remark': h.remark,
            'created_at': h.created_at,
        })
    return {
        'id': work_order.id,
        'idempotency_key': work_order.idempotency_key,
        'vehicle_plate': work_order.vehicle_plate,
        'driver_name': work_order.driver_name,
        'driver_phone': work_order.driver_phone,
        'dock_number': work_order.dock_number,
        'cargo_type': work_order.cargo_type,
        'cargo_weight': work_order.cargo_weight,
        'status': work_order.status,
        'current_role': work_order.current_role,
        'forklift_number': work_order.forklift_number,
        'operator_name': work_order.operator_name,
        'dispatched_at': work_order.dispatched_at,
        'work_start_at': work_order.work_start_at,
        'work_end_at': work_order.work_end_at,
        'work_duration_minutes': work_order.work_duration_minutes,
        'return_reason': work_order.return_reason,
        'supplementary_notes': work_order.supplementary_notes,
        'exception_note': work_order.exception_note,
        'dispatcher': work_order.dispatcher,
        'warehouse_clerk': work_order.warehouse_clerk,
        'created_at': work_order.created_at,
        'updated_at': work_order.updated_at,
        'status_history': history_list,
    }


@router.post('/work-orders/{work_order_id}/dispatch', response=WorkOrderOut, summary='叉车派工')
@transaction.atomic
def dispatch_work_order(request, work_order_id: UUID, payload: WorkOrderDispatch):
    work_order = get_object_or_404(ForkliftWorkOrder, id=work_order_id)

    if work_order.status != WorkOrderStatus.PENDING_DISPATCH:
        return api.create_response(
            request,
            {'detail': f'当前状态 [{work_order.get_status_display()}] 不允许派工操作'},
            status=400,
        )

    from_status = work_order.status

    work_order.forklift_number = payload.forklift_number
    work_order.operator_name = payload.operator_name
    work_order.dispatcher = payload.dispatcher
    work_order.dispatched_at = timezone.now()
    work_order.status = WorkOrderStatus.DISPATCHED
    work_order.current_role = Role.FORKLIFT_LEADER
    if payload.supplementary_notes:
        work_order.supplementary_notes = (
            (work_order.supplementary_notes + '\n' if work_order.supplementary_notes else '') +
            payload.supplementary_notes
        )
    work_order.save()

    add_status_history(
        work_order=work_order,
        from_status=from_status,
        to_status=WorkOrderStatus.DISPATCHED,
        operator_role=Role.DISPATCHER,
        operator_name=payload.dispatcher,
        remark=f'派工：叉车{payload.forklift_number}，司机{payload.operator_name}',
    )

    return work_order


@router.post('/work-orders/{work_order_id}/start-work', response=WorkOrderOut, summary='开始作业')
@transaction.atomic
def start_work(request, work_order_id: UUID, payload: WorkOrderStartWork):
    work_order = get_object_or_404(ForkliftWorkOrder, id=work_order_id)

    if work_order.status != WorkOrderStatus.DISPATCHED:
        return api.create_response(
            request,
            {'detail': f'当前状态 [{work_order.get_status_display()}] 不允许开始作业'},
            status=400,
        )

    from_status = work_order.status

    work_order.work_start_at = timezone.now()
    work_order.status = WorkOrderStatus.IN_PROGRESS
    work_order.current_role = Role.FORKLIFT_LEADER
    if payload.supplementary_notes:
        work_order.supplementary_notes = (
            (work_order.supplementary_notes + '\n' if work_order.supplementary_notes else '') +
            payload.supplementary_notes
        )
    work_order.save()

    add_status_history(
        work_order=work_order,
        from_status=from_status,
        to_status=WorkOrderStatus.IN_PROGRESS,
        operator_role=Role.FORKLIFT_LEADER,
        operator_name=work_order.operator_name or '叉车司机',
        remark='开始作业',
    )

    return work_order


@router.post('/work-orders/{work_order_id}/end-work', response=WorkOrderOut, summary='结束作业，提交确认')
@transaction.atomic
def end_work(request, work_order_id: UUID, payload: WorkOrderEndWork):
    work_order = get_object_or_404(ForkliftWorkOrder, id=work_order_id)

    if work_order.status != WorkOrderStatus.IN_PROGRESS:
        return api.create_response(
            request,
            {'detail': f'当前状态 [{work_order.get_status_display()}] 不允许结束作业'},
            status=400,
        )

    from_status = work_order.status

    work_order.work_end_at = timezone.now()
    work_order.warehouse_clerk = payload.warehouse_clerk
    work_order.calculate_duration()
    work_order.status = WorkOrderStatus.PENDING_CONFIRM
    work_order.current_role = Role.WAREHOUSE_CLERK
    if payload.supplementary_notes:
        work_order.supplementary_notes = (
            (work_order.supplementary_notes + '\n' if work_order.supplementary_notes else '') +
            payload.supplementary_notes
        )
    work_order.save()

    add_status_history(
        work_order=work_order,
        from_status=from_status,
        to_status=WorkOrderStatus.PENDING_CONFIRM,
        operator_role=Role.FORKLIFT_LEADER,
        operator_name=work_order.operator_name or '叉车司机',
        remark=f'结束作业，时长{work_order.work_duration_minutes}分钟，提交确认',
    )

    return work_order


@router.post('/work-orders/{work_order_id}/confirm', response=WorkOrderOut, summary='确认完成')
@transaction.atomic
def confirm_work_order(request, work_order_id: UUID, payload: WorkOrderConfirm):
    work_order = get_object_or_404(ForkliftWorkOrder, id=work_order_id)

    if work_order.status != WorkOrderStatus.PENDING_CONFIRM:
        return api.create_response(
            request,
            {'detail': f'当前状态 [{work_order.get_status_display()}] 不允许确认操作'},
            status=400,
        )

    from_status = work_order.status

    work_order.status = WorkOrderStatus.COMPLETED
    work_order.current_role = None
    if payload.supplementary_notes:
        work_order.supplementary_notes = (
            (work_order.supplementary_notes + '\n' if work_order.supplementary_notes else '') +
            payload.supplementary_notes
        )
    work_order.save()

    add_status_history(
        work_order=work_order,
        from_status=from_status,
        to_status=WorkOrderStatus.COMPLETED,
        operator_role=Role.WAREHOUSE_CLERK,
        operator_name=work_order.warehouse_clerk or '仓库文员',
        remark='确认完成',
    )

    return work_order


@router.post('/work-orders/{work_order_id}/return', response=WorkOrderOut, summary='退回作业')
@transaction.atomic
def return_work_order(request, work_order_id: UUID, payload: WorkOrderReturn):
    work_order = get_object_or_404(ForkliftWorkOrder, id=work_order_id)

    if work_order.status not in [WorkOrderStatus.PENDING_CONFIRM, WorkOrderStatus.IN_PROGRESS]:
        return api.create_response(
            request,
            {'detail': f'当前状态 [{work_order.get_status_display()}] 不允许退回操作'},
            status=400,
        )

    from_status = work_order.status

    work_order.return_reason = payload.return_reason
    work_order.status = WorkOrderStatus.RETURNED
    work_order.current_role = Role.FORKLIFT_LEADER
    if payload.supplementary_notes:
        work_order.supplementary_notes = (
            (work_order.supplementary_notes + '\n' if work_order.supplementary_notes else '') +
            payload.supplementary_notes
        )
    work_order.save()

    add_status_history(
        work_order=work_order,
        from_status=from_status,
        to_status=WorkOrderStatus.RETURNED,
        operator_role=Role.WAREHOUSE_CLERK,
        operator_name=payload.operator_name,
        remark=f'退回：{payload.return_reason}',
    )

    return work_order


@router.post('/work-orders/{work_order_id}/exception', response=WorkOrderOut, summary='标记异常')
@transaction.atomic
def mark_exception(request, work_order_id: UUID, payload: WorkOrderException):
    work_order = get_object_or_404(ForkliftWorkOrder, id=work_order_id)

    from_status = work_order.status

    work_order.exception_note = payload.exception_note
    work_order.status = WorkOrderStatus.EXCEPTION
    work_order.current_role = Role.DISPATCHER
    if payload.supplementary_notes:
        work_order.supplementary_notes = (
            (work_order.supplementary_notes + '\n' if work_order.supplementary_notes else '') +
            payload.supplementary_notes
        )
    work_order.save()

    add_status_history(
        work_order=work_order,
        from_status=from_status,
        to_status=WorkOrderStatus.EXCEPTION,
        operator_role=Role.DISPATCHER,
        operator_name=payload.operator_name,
        remark=f'异常：{payload.exception_note}',
    )

    return work_order


@router.get('/work-orders/{work_order_id}/timeline', summary='作业计时回看时间线')
def get_work_timeline(request, work_order_id: UUID):
    work_order = get_object_or_404(ForkliftWorkOrder, id=work_order_id)
    history = work_order.status_history.order_by('created_at')

    timeline = []
    for h in history:
        timeline.append({
            'time': h.created_at,
            'from_status': h.from_status,
            'to_status': h.to_status,
            'to_status_name': WorkOrderStatus(h.to_status).label if h.to_status else '',
            'operator_role': h.operator_role,
            'operator_role_name': Role(h.operator_role).label if h.operator_role else '',
            'operator_name': h.operator_name,
            'remark': h.remark,
        })

    timing_info = {
        'created_at': work_order.created_at,
        'dispatched_at': work_order.dispatched_at,
        'work_start_at': work_order.work_start_at,
        'work_end_at': work_order.work_end_at,
        'work_duration_minutes': work_order.work_duration_minutes,
        'completed_at': work_order.updated_at if work_order.status == WorkOrderStatus.COMPLETED else None,
    }

    return {
        'work_order_id': work_order.id,
        'vehicle_plate': work_order.vehicle_plate,
        'status': work_order.status,
        'status_name': work_order.get_status_display(),
        'timing_info': timing_info,
        'timeline': timeline,
    }


api.add_router('/api/v1', router)
