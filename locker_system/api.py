from datetime import datetime, date, timedelta
from typing import Optional
from django.db.models import Q, Count
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from ninja import Router, Query

from .models import (
    Locker, LockerAbnormal, AbnormalProgress, Compensation, CompensationProgress,
    StaffProfile, Wristband, Technician, LockerArea, RoleType
)
from .schemas import (
    SuccessResponse, ErrorResponse, PaginatedResponse, PaginationQuery,
    LockerSchema, LockerAbnormalSchema, AbnormalListSchema,
    CompensationSchema, CompensationListSchema,
    ReportAbnormalRequest, AssignAbnormalRequest, ProcessAbnormalRequest,
    ReturnAbnormalRequest, ReviewCompensationRequest, PayCompensationRequest,
    AbnormalFilterQuery, DashboardStats, StaffSchema, WristbandSchema,
    TechnicianSchema, LockerAreaSchema,
    EvidenceChainSchema, LockerOccupancyInfo, WristbandIssuanceInfo,
    TechnicianScheduleSchema, AbnormalSummarySchema,
    CompensationStatusSummarySchema, UnifiedTimelineSchema,
)
from .error_codes import ErrorCode, ERROR_MESSAGES
from .models import TechnicianSchedule

router = Router()


def make_error(code: ErrorCode, message: str = None) -> dict:
    return {
        "code": code.value,
        "message": message or ERROR_MESSAGES.get(code, "未知错误"),
        "data": None
    }


def add_abnormal_progress(abnormal: LockerAbnormal, action: str, detail: str, operator: StaffProfile = None):
    AbnormalProgress.objects.create(
        abnormal=abnormal,
        action=action,
        operator=operator,
        detail=detail
    )


def add_compensation_progress(compensation: Compensation, action: str, detail: str, operator: StaffProfile = None):
    CompensationProgress.objects.create(
        compensation=compensation,
        action=action,
        operator=operator,
        detail=detail
    )


def get_default_staff(role: str = None) -> Optional[StaffProfile]:
    qs = StaffProfile.objects.all()
    if role:
        qs = qs.filter(role=role)
    return qs.first()


def build_evidence_chain(abnormal: LockerAbnormal) -> EvidenceChainSchema:
    locker = abnormal.locker
    locker_info = LockerOccupancyInfo(
        locker_no=locker.locker_no,
        area_name=str(locker.area),
        status=locker.status,
        status_display=locker.get_status_display(),
        current_wristband_code=locker.wristband_code,
        current_customer_name=locker.customer_name,
        check_in_time=locker.check_in_time,
        locker_remark=locker.remark,
    )

    wristband_info = None
    wristband = abnormal.wristband
    if wristband:
        wristband_info = WristbandIssuanceInfo(
            wristband_code=wristband.code,
            status=wristband.status,
            status_display=wristband.get_status_display(),
            customer_name=wristband.customer_name,
            customer_phone=wristband.customer_phone,
            issued_by_name=wristband.issued_by.user.get_full_name() if wristband.issued_by and wristband.issued_by.user else "",
            issued_at=wristband.issued_at,
            bound_locker_no=wristband.bound_locker.locker_no if wristband.bound_locker else "",
        )

    technician_schedule = None
    technician = abnormal.related_technician
    if technician and abnormal.reported_at:
        schedule = TechnicianSchedule.objects.filter(
            technician=technician,
            shift_date=abnormal.reported_at.date()
        ).select_related("technician", "assigned_area").first()
        if schedule:
            technician_schedule = TechnicianScheduleSchema.from_orm(schedule)

    return EvidenceChainSchema(
        locker_info=locker_info,
        wristband_info=wristband_info,
        technician_schedule=technician_schedule,
    )


def build_abnormal_detail_response(abnormal: LockerAbnormal) -> dict:
    evidence_chain = build_evidence_chain(abnormal)
    base_data = LockerAbnormalSchema.from_orm(abnormal).model_dump()
    base_data["evidence_chain"] = evidence_chain.model_dump()
    return base_data


def build_compensation_detail_response(comp: Compensation) -> dict:
    evidence_chain = build_evidence_chain(comp.abnormal)
    abnormal = comp.abnormal

    abnormal_summary = {
        "abnormal_id": abnormal.id,
        "abnormal_type": abnormal.abnormal_type,
        "abnormal_type_display": abnormal.get_abnormal_type_display(),
        "description": abnormal.description,
        "priority": abnormal.priority,
        "customer_name": abnormal.customer_name,
        "customer_phone": abnormal.customer_phone,
        "reported_by_name": abnormal.reported_by.user.get_full_name() if abnormal.reported_by and abnormal.reported_by.user else "",
        "reported_at": abnormal.reported_at,
        "assigned_to_name": abnormal.assigned_to.user.get_full_name() if abnormal.assigned_to and abnormal.assigned_to.user else "",
        "assigned_at": abnormal.assigned_at,
        "processed_by_name": abnormal.processed_by.user.get_full_name() if abnormal.processed_by and abnormal.processed_by.user else "",
        "processed_at": abnormal.processed_at,
        "process_result": abnormal.process_result,
        "returned_by_name": abnormal.returned_by.user.get_full_name() if abnormal.returned_by and abnormal.returned_by.user else "",
        "returned_at": abnormal.returned_at,
        "return_reason": abnormal.return_reason,
        "abnormal_status": abnormal.status,
        "abnormal_status_display": abnormal.get_status_display(),
    }

    status_summary = _build_compensation_status_summary(comp)
    full_timeline = _build_unified_timeline(abnormal, comp)

    base_data = CompensationSchema.from_orm(comp).model_dump()
    base_data["evidence_chain"] = evidence_chain.model_dump()
    base_data["abnormal_summary"] = abnormal_summary
    base_data["status_summary"] = status_summary
    base_data["full_timeline"] = full_timeline
    return base_data


def _build_compensation_status_summary(comp: Compensation) -> dict:
    status_map = {
        "pending_review": {
            "current_stage": "财务审核",
            "next_action": "请财务审核赔付申请，可通过或拒绝",
            "summary_text": f"赔付申请已提交，金额 ¥{comp.compensation_amount}，待财务审核"
        },
        "reviewed": {
            "current_stage": "待支付",
            "next_action": "请财务执行支付操作，并记录客人签收",
            "summary_text": f"赔付已审核通过，金额 ¥{comp.compensation_amount}，待支付给客人"
        },
        "paid": {
            "current_stage": "已完成",
            "next_action": "赔付流程已结束",
            "summary_text": f"赔付已完成，金额 ¥{comp.compensation_amount}，客人已签收" if comp.customer_signature else f"赔付已完成，金额 ¥{comp.compensation_amount}，待客人签收"
        },
        "rejected": {
            "current_stage": "已拒绝",
            "next_action": "已退回楼层主管重新处理",
            "summary_text": f"赔付申请被拒绝，原因：{comp.reject_reason or '未填写'}"
        },
    }

    info = status_map.get(comp.status, {
        "current_stage": "未知",
        "next_action": "请检查状态",
        "summary_text": "状态未知"
    })

    return {
        "current_stage": info["current_stage"],
        "current_status": comp.status,
        "current_status_display": comp.get_status_display(),
        "next_action": info["next_action"],
        "summary_text": info["summary_text"],
    }


def _build_unified_timeline(abnormal: LockerAbnormal, comp: Compensation) -> list:
    timeline = []

    for p in abnormal.progresses.all():
        timeline.append({
            "id": f"a_{p.id}",
            "type": "abnormal",
            "action": p.action,
            "operator_name": p.operator.user.get_full_name() if p.operator and p.operator.user else "系统",
            "detail": p.detail,
            "created_at": p.created_at,
        })

    for p in comp.progresses.all():
        timeline.append({
            "id": f"c_{p.id}",
            "type": "compensation",
            "action": p.action,
            "operator_name": p.operator.user.get_full_name() if p.operator and p.operator.user else "系统",
            "detail": p.detail,
            "created_at": p.created_at,
        })

    timeline.sort(key=lambda x: x["created_at"])
    return timeline


@router.get("/dashboard", response=SuccessResponse[DashboardStats], summary="仪表盘统计")
def get_dashboard_stats(request):
    now = datetime.now()
    today = now.date()

    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())

    today_pending = LockerAbnormal.objects.filter(
        Q(expected_deadline__gte=today_start) & Q(expected_deadline__lte=today_end),
        status__in=["pending", "processing", "returned"]
    ).count()

    overdue_count = LockerAbnormal.objects.filter(
        expected_deadline__lt=now,
        status__in=["pending", "processing"]
    ).count()

    returned_count = LockerAbnormal.objects.filter(status="returned").count()
    processing_count = LockerAbnormal.objects.filter(status="processing").count()
    pending_review = Compensation.objects.filter(status="pending_review").count()
    pending_payment = Compensation.objects.filter(status="reviewed").count()
    total_abnormal_today = LockerAbnormal.objects.filter(reported_at__gte=today_start).count()

    return {
        "code": ErrorCode.SUCCESS.value,
        "message": "获取成功",
        "data": DashboardStats(
            today_pending=today_pending,
            overdue_count=overdue_count,
            returned_count=returned_count,
            processing_count=processing_count,
            pending_review=pending_review,
            pending_payment=pending_payment,
            total_abnormal_today=total_abnormal_today,
        )
    }


@router.get("/staff", response=SuccessResponse[list[StaffSchema]], summary="员工列表")
def list_staff(request, role: Optional[str] = None):
    qs = StaffProfile.objects.select_related("user").all()
    if role:
        qs = qs.filter(role=role)
    data = [StaffSchema.from_orm(s) for s in qs]
    return {"code": ErrorCode.SUCCESS.value, "message": "获取成功", "data": data}


@router.get("/locker-areas", response=SuccessResponse[list[LockerAreaSchema]], summary="储物柜区域列表")
def list_locker_areas(request):
    data = list(LockerArea.objects.all())
    return {"code": ErrorCode.SUCCESS.value, "message": "获取成功", "data": data}


@router.get("/lockers", response=SuccessResponse[list[LockerSchema]], summary="储物柜列表")
def list_lockers(request, area_id: Optional[int] = None, status: Optional[str] = None):
    qs = Locker.objects.select_related("area").all()
    if area_id:
        qs = qs.filter(area_id=area_id)
    if status:
        qs = qs.filter(status=status)
    data = [LockerSchema.from_orm(l) for l in qs]
    return {"code": ErrorCode.SUCCESS.value, "message": "获取成功", "data": data}


@router.get("/wristbands", response=SuccessResponse[list[WristbandSchema]], summary="手牌列表")
def list_wristbands(request, status: Optional[str] = None):
    qs = Wristband.objects.select_related("bound_locker").all()
    if status:
        qs = qs.filter(status=status)
    data = [WristbandSchema.from_orm(w) for w in qs]
    return {"code": ErrorCode.SUCCESS.value, "message": "获取成功", "data": data}


@router.get("/technicians", response=SuccessResponse[list[TechnicianSchema]], summary="技师列表")
def list_technicians(request):
    data = list(Technician.objects.filter(is_active=True))
    return {"code": ErrorCode.SUCCESS.value, "message": "获取成功", "data": data}


@router.get("/abnormals", response=PaginatedResponse[AbnormalListSchema], summary="异常记录列表")
def list_abnormals(
    request,
    pagination: Query[PaginationQuery],
    filters: Query[AbnormalFilterQuery],
):
    qs = LockerAbnormal.objects.select_related(
        "locker", "locker__area", "wristband",
        "reported_by", "reported_by__user",
        "assigned_to", "assigned_to__user",
        "processed_by", "processed_by__user",
        "related_technician"
    ).prefetch_related("compensation").all()

    now = datetime.now()
    today = now.date()
    today_start = datetime.combine(today, datetime.min.time())

    if filters.status:
        qs = qs.filter(status=filters.status)
    if filters.abnormal_type:
        qs = qs.filter(abnormal_type=filters.abnormal_type)
    if filters.area_id:
        qs = qs.filter(locker__area_id=filters.area_id)
    if filters.priority:
        qs = qs.filter(priority=filters.priority)
    if filters.start_date:
        qs = qs.filter(reported_at__date__gte=filters.start_date)
    if filters.end_date:
        qs = qs.filter(reported_at__date__lte=filters.end_date)
    if filters.keyword:
        qs = qs.filter(
            Q(locker__locker_no__icontains=filters.keyword) |
            Q(customer_name__icontains=filters.keyword) |
            Q(description__icontains=filters.keyword)
        )

    if filters.show_today:
        qs = qs.filter(
            Q(expected_deadline__gte=today_start) & Q(expected_deadline__lte=now),
            status__in=["pending", "processing", "returned"]
        )
    if filters.show_overdue:
        qs = qs.filter(
            expected_deadline__lt=now,
            status__in=["pending", "processing"]
        )
    if filters.show_returned:
        qs = qs.filter(status="returned")

    default_view = not any([
        filters.status, filters.abnormal_type, filters.area_id,
        filters.priority, filters.start_date, filters.end_date,
        filters.keyword, filters.show_today, filters.show_overdue, filters.show_returned
    ])

    if default_view:
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())

        qs_today = LockerAbnormal.objects.filter(
            expected_deadline__range=(today_start, today_end),
            status__in=["pending", "processing", "returned"]
        )
        qs_overdue = LockerAbnormal.objects.filter(
            expected_deadline__lt=now,
            status__in=["pending", "processing"]
        )
        qs_returned = LockerAbnormal.objects.filter(
            status="returned"
        )

        ids = (
            set(qs_today.values_list("id", flat=True)) |
            set(qs_overdue.values_list("id", flat=True)) |
            set(qs_returned.values_list("id", flat=True))
        )

        qs = LockerAbnormal.objects.filter(id__in=ids).select_related(
            "locker", "locker__area", "wristband",
            "reported_by", "reported_by__user",
            "assigned_to", "assigned_to__user",
            "processed_by", "processed_by__user",
            "related_technician"
        ).prefetch_related("compensation").order_by(
            "-priority",
            "expected_deadline"
        )
    else:
        if filters.show_today:
            today_start = datetime.combine(today, datetime.min.time())
            today_end = datetime.combine(today, datetime.max.time())
            qs = qs.filter(
                expected_deadline__range=(today_start, today_end),
                status__in=["pending", "processing", "returned"]
            )
        if filters.show_overdue:
            qs = qs.filter(
                expected_deadline__lt=now,
                status__in=["pending", "processing"]
            )
        if filters.show_returned:
            qs = qs.filter(status="returned")

    total = qs.count()
    offset = (pagination.page - 1) * pagination.page_size
    items = qs[offset:offset + pagination.page_size]

    data = [AbnormalListSchema.from_orm(a) for a in items]
    total_pages = (total + pagination.page_size - 1) // pagination.page_size

    return {
        "code": ErrorCode.SUCCESS.value,
        "message": "获取成功",
        "data": data,
        "total": total,
        "page": pagination.page,
        "page_size": pagination.page_size,
        "total_pages": total_pages,
    }


@router.get("/abnormals/{abnormal_id}", response=SuccessResponse[LockerAbnormalSchema], summary="异常详情")
def get_abnormal(request, abnormal_id: int):
    abnormal = get_object_or_404(LockerAbnormal, id=abnormal_id)
    data = build_abnormal_detail_response(abnormal)
    return {"code": ErrorCode.SUCCESS.value, "message": "获取成功", "data": data}


@router.post("/abnormals", response=SuccessResponse[LockerAbnormalSchema], summary="前台登记异常")
def report_abnormal(request, payload: ReportAbnormalRequest):
    locker = Locker.objects.filter(id=payload.locker_id).first()
    if not locker:
        return make_error(ErrorCode.LOCKER_NOT_FOUND)

    wristband = None
    if payload.wristband_code:
        wristband = Wristband.objects.filter(code=payload.wristband_code).first()

    technician = None
    if payload.related_technician_id:
        technician = Technician.objects.filter(id=payload.related_technician_id).first()

    reporter = get_default_staff(RoleType.RECEPTION)

    abnormal = LockerAbnormal.objects.create(
        locker=locker,
        wristband=wristband,
        abnormal_type=payload.abnormal_type,
        status=LockerAbnormal.Status.PENDING,
        priority=payload.priority,
        customer_name=payload.customer_name or locker.customer_name,
        customer_phone=payload.customer_phone,
        description=payload.description,
        reported_by=reporter,
        expected_deadline=payload.expected_deadline,
        related_technician=technician,
        remark=payload.remark,
    )

    add_abnormal_progress(abnormal, "前台登记", f"登记异常：{abnormal.get_abnormal_type_display()}", reporter)

    data = build_abnormal_detail_response(abnormal)
    return {"code": ErrorCode.SUCCESS.value, "message": "登记成功", "data": data}


@router.put("/abnormals/{abnormal_id}/assign", response=SuccessResponse[LockerAbnormalSchema], summary="派单给楼层主管")
def assign_abnormal(request, abnormal_id: int, payload: AssignAbnormalRequest):
    abnormal = get_object_or_404(LockerAbnormal, id=abnormal_id)
    if abnormal.status not in [LockerAbnormal.Status.PENDING, LockerAbnormal.Status.RETURNED]:
        return make_error(ErrorCode.ABNORMAL_INVALID_STATUS, "当前状态不可派单")

    assignee = StaffProfile.objects.filter(id=payload.assigned_to_id).first()
    if not assignee:
        return make_error(ErrorCode.PARAM_ERROR, "处理人不存在")

    now = datetime.now()
    abnormal.status = LockerAbnormal.Status.PROCESSING
    abnormal.assigned_to = assignee
    abnormal.assigned_at = now
    abnormal.save()

    add_abnormal_progress(abnormal, "派单", f"派单给{assignee.user.get_full_name()}", get_default_staff())

    data = build_abnormal_detail_response(abnormal)
    return {"code": ErrorCode.SUCCESS.value, "message": "派单成功", "data": data}


@router.put("/abnormals/{abnormal_id}/process", response=SuccessResponse[dict], summary="楼层主管处理异常")
def process_abnormal(request, abnormal_id: int, payload: ProcessAbnormalRequest):
    abnormal = get_object_or_404(LockerAbnormal, id=abnormal_id)
    if abnormal.status not in [LockerAbnormal.Status.PROCESSING]:
        return make_error(ErrorCode.ABNORMAL_INVALID_STATUS, "当前状态不可处理")

    processor = get_default_staff(RoleType.FLOOR_SUPERVISOR)
    now = datetime.now()

    abnormal.processed_by = processor
    abnormal.processed_at = now
    abnormal.process_result = payload.process_result

    if payload.need_compensation:
        if not payload.compensation_amount or payload.compensation_amount <= 0:
            return make_error(ErrorCode.PARAM_ERROR, "赔付金额不能为空")

        abnormal.status = LockerAbnormal.Status.NEED_COMPENSATION
        abnormal.save()

        comp = Compensation.objects.create(
            abnormal=abnormal,
            customer_name=abnormal.customer_name,
            customer_phone=abnormal.customer_phone,
            item_description=payload.item_description,
            estimated_value=payload.estimated_value or payload.compensation_amount,
            compensation_amount=payload.compensation_amount,
            status=Compensation.Status.PENDING_REVIEW,
            proposed_by=processor,
        )

        add_abnormal_progress(abnormal, "处理完成", f"处理结果：{payload.process_result}，已提交赔付申请", processor)
        add_compensation_progress(comp, "提交赔付申请", f"申请金额：{payload.compensation_amount}元", processor)

        abnormal_data = build_abnormal_detail_response(abnormal)
        return {"code": ErrorCode.SUCCESS.value, "message": "处理完成，已提交赔付申请", "data": {
            "abnormal": abnormal_data,
            "compensation_id": comp.id
        }}
    else:
        abnormal.status = LockerAbnormal.Status.RESOLVED
        abnormal.save()
        add_abnormal_progress(abnormal, "处理完成", f"处理结果：{payload.process_result}", processor)
        abnormal_data = build_abnormal_detail_response(abnormal)
        return {"code": ErrorCode.SUCCESS.value, "message": "处理完成", "data": {"abnormal": abnormal_data}}


@router.put("/abnormals/{abnormal_id}/return", response=SuccessResponse[LockerAbnormalSchema], summary="退回异常")
def return_abnormal(request, abnormal_id: int, payload: ReturnAbnormalRequest):
    abnormal = get_object_or_404(LockerAbnormal, id=abnormal_id)
    if abnormal.status not in [LockerAbnormal.Status.PROCESSING, LockerAbnormal.Status.NEED_COMPENSATION]:
        return make_error(ErrorCode.ABNORMAL_INVALID_STATUS, "当前状态不可退回")

    operator = get_default_staff()
    now = datetime.now()

    abnormal.status = LockerAbnormal.Status.RETURNED
    abnormal.return_reason = payload.return_reason
    abnormal.returned_by = operator
    abnormal.returned_at = now
    abnormal.save()

    add_abnormal_progress(abnormal, "退回", f"退回原因：{payload.return_reason}", operator)

    data = build_abnormal_detail_response(abnormal)
    return {"code": ErrorCode.SUCCESS.value, "message": "已退回", "data": data}


@router.get("/compensations", response=PaginatedResponse[CompensationListSchema], summary="赔付记录列表")
def list_compensations(
    request,
    pagination: Query[PaginationQuery],
    status: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    keyword: Optional[str] = None,
):
    qs = Compensation.objects.select_related(
        "abnormal", "abnormal__locker",
        "proposed_by", "proposed_by__user",
        "reviewed_by", "reviewed_by__user",
        "paid_by", "paid_by__user",
    ).all()

    if status:
        qs = qs.filter(status=status)
    if start_date:
        qs = qs.filter(proposed_at__date__gte=start_date)
    if end_date:
        qs = qs.filter(proposed_at__date__lte=end_date)
    if keyword:
        qs = qs.filter(
            Q(abnormal__locker__locker_no__icontains=keyword) |
            Q(customer_name__icontains=keyword)
        )

    total = qs.count()
    offset = (pagination.page - 1) * pagination.page_size
    items = qs[offset:offset + pagination.page_size]

    data = [CompensationListSchema(
        id=c.id,
        abnormal_id=c.abnormal.id,
        locker_no=c.abnormal.locker.locker_no,
        customer_name=c.customer_name,
        compensation_amount=c.compensation_amount,
        status=c.status,
        status_display=c.get_status_display(),
        proposed_at=c.proposed_at,
        reviewed_at=c.reviewed_at,
        paid_at=c.paid_at,
    ) for c in items]

    total_pages = (total + pagination.page_size - 1) // pagination.page_size

    return {
        "code": ErrorCode.SUCCESS.value,
        "message": "获取成功",
        "data": data,
        "total": total,
        "page": pagination.page,
        "page_size": pagination.page_size,
        "total_pages": total_pages,
    }


@router.get("/compensations/{compensation_id}", response=SuccessResponse[CompensationSchema], summary="赔付详情(回看)")
def get_compensation(request, compensation_id: int):
    comp = get_object_or_404(Compensation, id=compensation_id)
    data = build_compensation_detail_response(comp)
    return {"code": ErrorCode.SUCCESS.value, "message": "获取成功", "data": data}


@router.put("/compensations/{compensation_id}/review", response=SuccessResponse[CompensationSchema], summary="财务审核赔付")
def review_compensation(request, compensation_id: int, payload: ReviewCompensationRequest):
    comp = get_object_or_404(Compensation, id=compensation_id)
    if comp.status != Compensation.Status.PENDING_REVIEW:
        return make_error(ErrorCode.COMPENSATION_INVALID_STATUS, "当前状态不可审核")

    reviewer = get_default_staff(RoleType.FINANCE)
    now = datetime.now()

    comp.reviewed_by = reviewer
    comp.reviewed_at = now
    comp.review_comment = payload.review_comment

    if payload.approved:
        if payload.adjusted_amount and payload.adjusted_amount > 0:
            comp.compensation_amount = payload.adjusted_amount
        comp.status = Compensation.Status.REVIEWED
        add_compensation_progress(comp, "审核通过", f"审核意见：{payload.review_comment or '无'}，金额：{comp.compensation_amount}元", reviewer)
    else:
        comp.status = Compensation.Status.REJECTED
        comp.reject_reason = payload.review_comment
        comp.abnormal.status = LockerAbnormal.Status.RETURNED
        comp.abnormal.return_reason = f"赔付被拒：{payload.review_comment}"
        comp.abnormal.returned_by = reviewer
        comp.abnormal.returned_at = now
        comp.abnormal.save()
        add_abnormal_progress(comp.abnormal, "赔付被拒", f"原因：{payload.review_comment}", reviewer)
        add_compensation_progress(comp, "审核拒绝", f"拒绝原因：{payload.review_comment}", reviewer)

    comp.save()

    data = build_compensation_detail_response(comp)
    return {"code": ErrorCode.SUCCESS.value, "message": "审核完成", "data": data}


@router.put("/compensations/{compensation_id}/pay", response=SuccessResponse[CompensationSchema], summary="财务支付赔付")
def pay_compensation(request, compensation_id: int, payload: PayCompensationRequest):
    comp = get_object_or_404(Compensation, id=compensation_id)
    if comp.status != Compensation.Status.REVIEWED:
        return make_error(ErrorCode.COMPENSATION_INVALID_STATUS, "当前状态不可支付")

    payer = get_default_staff(RoleType.FINANCE)
    now = datetime.now()

    comp.status = Compensation.Status.PAID
    comp.paid_by = payer
    comp.paid_at = now
    comp.payment_method = payload.payment_method
    comp.payment_voucher = payload.payment_voucher
    comp.customer_signature = payload.customer_signature
    if payload.customer_signature:
        comp.signed_at = now
    comp.save()

    comp.abnormal.status = LockerAbnormal.Status.RESOLVED
    comp.abnormal.save()

    add_compensation_progress(comp, "支付完成", f"支付方式：{payload.payment_method}，凭证号：{payload.payment_voucher}", payer)
    add_abnormal_progress(comp.abnormal, "赔付完成", f"赔付金额：{comp.compensation_amount}元，支付完成", payer)

    data = build_compensation_detail_response(comp)
    return {"code": ErrorCode.SUCCESS.value, "message": "支付完成", "data": data}
