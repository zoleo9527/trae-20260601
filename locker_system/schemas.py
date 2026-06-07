from typing import Generic, TypeVar, Optional, List, Any
from datetime import datetime, date
from pydantic import BaseModel, Field
from decimal import Decimal

from .error_codes import ErrorCode

T = TypeVar("T")


class ErrorResponse(BaseModel):
    code: int = Field(..., description="错误码")
    message: str = Field(..., description="错误信息")
    data: Optional[Any] = None


class SuccessResponse(BaseModel, Generic[T]):
    code: int = Field(default=ErrorCode.SUCCESS, description="状态码")
    message: str = Field(default="操作成功", description="消息")
    data: Optional[T] = None


class PaginatedResponse(BaseModel, Generic[T]):
    code: int = Field(default=ErrorCode.SUCCESS, description="状态码")
    message: str = Field(default="操作成功", description="消息")
    data: List[T]
    total: int = Field(..., description="总记录数")
    page: int = Field(..., description="当前页码")
    page_size: int = Field(..., description="每页数量")
    total_pages: int = Field(..., description="总页数")


class PaginationQuery(BaseModel):
    page: int = Field(default=1, ge=1, description="页码")
    page_size: int = Field(default=10, ge=1, le=100, description="每页数量")


class StaffSchema(BaseModel):
    id: int
    employee_id: str
    username: str
    full_name: str
    role: str
    role_display: str

    @classmethod
    def from_orm(cls, staff):
        return cls(
            id=staff.id,
            employee_id=staff.employee_id,
            username=staff.user.username,
            full_name=staff.user.get_full_name() or staff.user.username,
            role=staff.role,
            role_display=staff.get_role_display(),
        )


class LockerAreaSchema(BaseModel):
    id: int
    name: str
    floor: int
    description: str

    class Config:
        from_attributes = True


class LockerSchema(BaseModel):
    id: int
    locker_no: str
    area_id: int
    area_name: str
    status: str
    status_display: str
    wristband_code: str
    customer_name: str
    check_in_time: Optional[datetime] = None
    remark: str

    @classmethod
    def from_orm(cls, locker):
        return cls(
            id=locker.id,
            locker_no=locker.locker_no,
            area_id=locker.area.id,
            area_name=str(locker.area),
            status=locker.status,
            status_display=locker.get_status_display(),
            wristband_code=locker.wristband_code,
            customer_name=locker.customer_name,
            check_in_time=locker.check_in_time,
            remark=locker.remark,
        )


class WristbandSchema(BaseModel):
    id: int
    code: str
    status: str
    status_display: str
    bound_locker_no: str
    customer_name: str
    customer_phone: str
    issued_at: Optional[datetime] = None

    @classmethod
    def from_orm(cls, wristband):
        return cls(
            id=wristband.id,
            code=wristband.code,
            status=wristband.status,
            status_display=wristband.get_status_display(),
            bound_locker_no=wristband.bound_locker.locker_no if wristband.bound_locker else "",
            customer_name=wristband.customer_name,
            customer_phone=wristband.customer_phone,
            issued_at=wristband.issued_at,
        )


class TechnicianSchema(BaseModel):
    id: int
    name: str
    employee_id: str
    phone: str
    is_active: bool

    class Config:
        from_attributes = True


class AbnormalProgressSchema(BaseModel):
    id: int
    action: str
    operator_name: str
    detail: str
    created_at: datetime

    @classmethod
    def from_orm(cls, progress):
        return cls(
            id=progress.id,
            action=progress.action,
            operator_name=progress.operator.user.get_full_name() if progress.operator and progress.operator.user else "系统",
            detail=progress.detail,
            created_at=progress.created_at,
        )


class LockerAbnormalSchema(BaseModel):
    id: int
    locker_no: str
    locker_id: int
    area_name: str
    wristband_code: str
    abnormal_type: str
    abnormal_type_display: str
    status: str
    status_display: str
    priority: int
    customer_name: str
    customer_phone: str
    description: str
    reported_by_name: str
    reported_at: datetime
    assigned_to_name: str
    assigned_at: Optional[datetime] = None
    processed_by_name: str
    processed_at: Optional[datetime] = None
    process_result: str
    return_reason: str
    expected_deadline: Optional[datetime] = None
    related_technician_name: str
    is_overdue: bool
    is_today: bool
    is_returned: bool
    remark: str
    progresses: List[AbnormalProgressSchema]

    @classmethod
    def from_orm(cls, abnormal):
        now = datetime.now()
        is_overdue = abnormal.expected_deadline and abnormal.expected_deadline < now and abnormal.status not in ["resolved", "need_compensation"]
        is_today = abnormal.expected_deadline and abnormal.expected_deadline.date() == now.date() and abnormal.status not in ["resolved", "need_compensation"]
        is_returned = abnormal.status == "returned"
        return cls(
            id=abnormal.id,
            locker_no=abnormal.locker.locker_no,
            locker_id=abnormal.locker.id,
            area_name=str(abnormal.locker.area),
            wristband_code=abnormal.wristband.code if abnormal.wristband else "",
            abnormal_type=abnormal.abnormal_type,
            abnormal_type_display=abnormal.get_abnormal_type_display(),
            status=abnormal.status,
            status_display=abnormal.get_status_display(),
            priority=abnormal.priority,
            customer_name=abnormal.customer_name,
            customer_phone=abnormal.customer_phone,
            description=abnormal.description,
            reported_by_name=abnormal.reported_by.user.get_full_name() if abnormal.reported_by and abnormal.reported_by.user else "",
            reported_at=abnormal.reported_at,
            assigned_to_name=abnormal.assigned_to.user.get_full_name() if abnormal.assigned_to and abnormal.assigned_to.user else "",
            assigned_at=abnormal.assigned_at,
            processed_by_name=abnormal.processed_by.user.get_full_name() if abnormal.processed_by and abnormal.processed_by.user else "",
            processed_at=abnormal.processed_at,
            process_result=abnormal.process_result,
            return_reason=abnormal.return_reason,
            expected_deadline=abnormal.expected_deadline,
            related_technician_name=abnormal.related_technician.name if abnormal.related_technician else "",
            is_overdue=is_overdue,
            is_today=is_today,
            is_returned=is_returned,
            remark=abnormal.remark,
            progresses=[AbnormalProgressSchema.from_orm(p) for p in abnormal.progresses.all()],
        )


class AbnormalListSchema(BaseModel):
    id: int
    locker_no: str
    area_name: str
    abnormal_type: str
    abnormal_type_display: str
    status: str
    status_display: str
    priority: int
    customer_name: str
    reported_at: datetime
    assigned_to_name: str
    expected_deadline: Optional[datetime] = None
    is_overdue: bool
    is_today: bool
    is_returned: bool
    has_compensation: bool

    @classmethod
    def from_orm(cls, abnormal):
        now = datetime.now()
        is_overdue = abnormal.expected_deadline and abnormal.expected_deadline < now and abnormal.status not in ["resolved", "need_compensation"]
        is_today = abnormal.expected_deadline and abnormal.expected_deadline.date() == now.date() and abnormal.status not in ["resolved", "need_compensation"]
        is_returned = abnormal.status == "returned"
        has_compensation = hasattr(abnormal, "compensation") and abnormal.compensation is not None
        return cls(
            id=abnormal.id,
            locker_no=abnormal.locker.locker_no,
            area_name=str(abnormal.locker.area),
            abnormal_type=abnormal.abnormal_type,
            abnormal_type_display=abnormal.get_abnormal_type_display(),
            status=abnormal.status,
            status_display=abnormal.get_status_display(),
            priority=abnormal.priority,
            customer_name=abnormal.customer_name,
            reported_at=abnormal.reported_at,
            assigned_to_name=abnormal.assigned_to.user.get_full_name() if abnormal.assigned_to and abnormal.assigned_to.user else "",
            expected_deadline=abnormal.expected_deadline,
            is_overdue=is_overdue,
            is_today=is_today,
            is_returned=is_returned,
            has_compensation=has_compensation,
        )


class CompensationProgressSchema(BaseModel):
    id: int
    action: str
    operator_name: str
    detail: str
    created_at: datetime

    @classmethod
    def from_orm(cls, progress):
        return cls(
            id=progress.id,
            action=progress.action,
            operator_name=progress.operator.user.get_full_name() if progress.operator and progress.operator.user else "系统",
            detail=progress.detail,
            created_at=progress.created_at,
        )


class CompensationSchema(BaseModel):
    id: int
    abnormal_id: int
    locker_no: str
    customer_name: str
    customer_phone: str
    item_description: str
    estimated_value: Decimal
    compensation_amount: Decimal
    status: str
    status_display: str
    proposed_by_name: str
    proposed_at: datetime
    reviewed_by_name: str
    reviewed_at: Optional[datetime] = None
    review_comment: str
    paid_by_name: str
    paid_at: Optional[datetime] = None
    payment_method: str
    payment_voucher: str
    customer_signature: str
    signed_at: Optional[datetime] = None
    reject_reason: str
    remark: str
    progresses: List[CompensationProgressSchema]

    @classmethod
    def from_orm(cls, comp):
        return cls(
            id=comp.id,
            abnormal_id=comp.abnormal.id,
            locker_no=comp.abnormal.locker.locker_no,
            customer_name=comp.customer_name,
            customer_phone=comp.customer_phone,
            item_description=comp.item_description,
            estimated_value=comp.estimated_value,
            compensation_amount=comp.compensation_amount,
            status=comp.status,
            status_display=comp.get_status_display(),
            proposed_by_name=comp.proposed_by.user.get_full_name() if comp.proposed_by and comp.proposed_by.user else "",
            proposed_at=comp.proposed_at,
            reviewed_by_name=comp.reviewed_by.user.get_full_name() if comp.reviewed_by and comp.reviewed_by.user else "",
            reviewed_at=comp.reviewed_at,
            review_comment=comp.review_comment,
            paid_by_name=comp.paid_by.user.get_full_name() if comp.paid_by and comp.paid_by.user else "",
            paid_at=comp.paid_at,
            payment_method=comp.payment_method,
            payment_voucher=comp.payment_voucher,
            customer_signature=comp.customer_signature,
            signed_at=comp.signed_at,
            reject_reason=comp.reject_reason,
            remark=comp.remark,
            progresses=[CompensationProgressSchema.from_orm(p) for p in comp.progresses.all()],
        )


class CompensationListSchema(BaseModel):
    id: int
    abnormal_id: int
    locker_no: str
    customer_name: str
    compensation_amount: Decimal
    status: str
    status_display: str
    proposed_at: datetime
    reviewed_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None


class ReportAbnormalRequest(BaseModel):
    locker_id: int = Field(..., description="储物柜ID")
    abnormal_type: str = Field(..., description="异常类型")
    customer_name: str = Field(default="", description="客人姓名")
    customer_phone: str = Field(default="", description="客人电话")
    description: str = Field(..., description="异常描述")
    priority: int = Field(default=1, ge=1, le=5, description="优先级")
    expected_deadline: Optional[datetime] = Field(None, description="期望处理时限")
    related_technician_id: Optional[int] = Field(None, description="涉及技师ID")
    wristband_code: str = Field(default="", description="手牌编号")
    remark: str = Field(default="", description="备注")


class AssignAbnormalRequest(BaseModel):
    assigned_to_id: int = Field(..., description="处理人ID")
    remark: str = Field(default="", description="备注")


class ProcessAbnormalRequest(BaseModel):
    process_result: str = Field(..., description="处理结果")
    need_compensation: bool = Field(default=False, description="是否需要赔付")
    compensation_amount: Optional[Decimal] = Field(None, description="赔付金额")
    item_description: str = Field(default="", description="遗失/损坏物品描述")
    estimated_value: Optional[Decimal] = Field(None, description="预估价值")


class ReturnAbnormalRequest(BaseModel):
    return_reason: str = Field(..., description="退回原因")


class ReviewCompensationRequest(BaseModel):
    approved: bool = Field(..., description="是否通过")
    review_comment: str = Field(default="", description="审核意见")
    adjusted_amount: Optional[Decimal] = Field(None, description="调整后金额")


class PayCompensationRequest(BaseModel):
    payment_method: str = Field(..., description="支付方式")
    payment_voucher: str = Field(default="", description="支付凭证号")
    customer_signature: str = Field(default="", description="客人签收")


class AbnormalFilterQuery(BaseModel):
    status: Optional[str] = Field(None, description="状态筛选")
    abnormal_type: Optional[str] = Field(None, description="异常类型筛选")
    area_id: Optional[int] = Field(None, description="区域筛选")
    priority: Optional[int] = Field(None, description="优先级筛选")
    start_date: Optional[date] = Field(None, description="开始日期")
    end_date: Optional[date] = Field(None, description="结束日期")
    keyword: Optional[str] = Field(None, description="关键词搜索")
    show_today: Optional[bool] = Field(None, description="仅显示今日待办")
    show_overdue: Optional[bool] = Field(None, description="仅显示已拖延")
    show_returned: Optional[bool] = Field(None, description="仅显示已退回")


class DashboardStats(BaseModel):
    today_pending: int = Field(..., description="今日待办")
    overdue_count: int = Field(..., description="已拖延")
    returned_count: int = Field(..., description="已退回")
    processing_count: int = Field(..., description="处理中")
    pending_review: int = Field(..., description="待审核赔付")
    pending_payment: int = Field(..., description="待支付赔付")
    total_abnormal_today: int = Field(..., description="今日新增异常")
