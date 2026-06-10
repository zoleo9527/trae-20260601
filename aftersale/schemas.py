from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Any

from pydantic import BaseModel, Field

from .models import AfterSaleStatus, LossStatus, LossResponsibility, Role


# ============ 通用 ============

class IdOut(BaseModel):
    id: int
    msg: str = 'ok'


class MessageOut(BaseModel):
    code: int = 0
    msg: str = 'ok'
    data: Any = None


class HistoryItem(BaseModel):
    id: int
    action: str
    action_role: str
    action_role_display: str
    operator_name: str
    status_from: str = ''
    status_from_display: str = ''
    status_to: str = ''
    status_to_display: str = ''
    responsibility_from: str = ''
    responsibility_from_display: str = ''
    responsibility_to: str = ''
    responsibility_to_display: str = ''
    remark: str = ''
    created_at: datetime


class NotifyItem(BaseModel):
    id: int
    notify_type: str
    notify_type_display: str
    target_role: str = ''
    target_role_display: str = ''
    target_name: str = ''
    content: str
    is_read: bool
    created_at: datetime


class RoleItem(BaseModel):
    value: str
    label: str


# ============ 登录 / 用户 ============

class LoginIn(BaseModel):
    username: str
    password: str


class UserProfileOut(BaseModel):
    user_id: int
    username: str
    real_name: str
    role: str
    role_display: str
    phone: str = ''


# ============ 售后补发 ============

class AfterSaleCreateIn(BaseModel):
    source_order_no: str = ''
    customer_name: str
    customer_phone: str = ''
    flower_name: str
    quantity: int = Field(..., ge=1)
    unit: str = '枝'
    problem_desc: str
    photos_ref: List[str] = []
    deadline_hours: Optional[int] = None


class AfterSaleListFilter(BaseModel):
    status: Optional[str] = None
    current_role: Optional[str] = None
    keyword: Optional[str] = None
    only_my: bool = False


class AfterSaleBriefOut(BaseModel):
    id: int
    order_no: str
    source_order_no: str
    customer_name: str
    flower_name: str
    quantity: int
    unit: str
    status: str
    status_display: str
    current_role: str
    current_role_display: str
    current_handler_name: str = ''
    created_at: datetime
    deadline_at: Optional[datetime] = None
    has_loss: bool
    loss_id: Optional[int] = None
    loss_no: str = ''


class AfterSaleDetailOut(BaseModel):
    id: int
    order_no: str
    source_order_no: str
    customer_name: str
    customer_phone: str
    flower_name: str
    quantity: int
    unit: str
    problem_desc: str
    photos_ref: List[str] = []
    status: str
    status_display: str
    current_role: str
    current_role_display: str
    current_handler_id: Optional[int] = None
    current_handler_name: str = ''
    creator_name: str = ''
    created_at: datetime
    updated_at: datetime
    deadline_at: Optional[datetime] = None
    has_loss: bool
    loss_id: Optional[int] = None
    loss_no: str = ''
    histories: List[HistoryItem] = []
    notifies: List[NotifyItem] = []
    # 从售后切到损耗时需要带出的上下文
    loss_context: Optional[dict] = None


class StatusUpdateIn(BaseModel):
    remark: str = ''


class HandoffIn(BaseModel):
    remark: str = ''
    handler_id: Optional[int] = None


class MaterialNeedIn(BaseModel):
    material_desc: str
    remark: str = ''


class LossTransitionIn(BaseModel):
    loss_quantity: int
    loss_reason: str
    loss_amount: Decimal = Decimal('0')
    initial_responsibility: str = LossResponsibility.UNCLEAR
    remark: str = ''


# ============ 损耗统计 ============

class LossCreateFromAfterSaleIn(BaseModel):
    aftersale_id: int
    loss_quantity: int
    unit: str = '枝'
    loss_reason: str
    loss_amount: Decimal = Decimal('0')
    initial_responsibility: str = LossResponsibility.UNCLEAR
    remark: str = ''


class LossListFilter(BaseModel):
    status: Optional[str] = None
    responsibility: Optional[str] = None
    keyword: Optional[str] = None
    aftersale_id: Optional[int] = None


class LossBriefOut(BaseModel):
    id: int
    loss_no: str
    aftersale_id: int
    aftersale_no: str
    flower_name: str
    loss_quantity: int
    unit: str
    loss_amount: Decimal
    responsibility: str
    responsibility_display: str
    status: str
    status_display: str
    liable_person_name: str = ''
    created_at: datetime


class LossDetailOut(BaseModel):
    id: int
    loss_no: str
    aftersale_id: int
    aftersale_no: str
    aftersale_customer: str = ''
    flower_name: str
    loss_quantity: int
    unit: str
    loss_reason: str
    loss_amount: Decimal
    responsibility: str
    responsibility_display: str
    status: str
    status_display: str
    liable_person_id: Optional[int] = None
    liable_person_name: str = ''
    confirm_role: str = ''
    confirm_role_display: str = ''
    confirmed_by_name: str = ''
    confirmed_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    creator_name: str = ''
    created_at: datetime
    updated_at: datetime
    histories: List[HistoryItem] = []
    notifies: List[NotifyItem] = []
    # 保留从售后过来的责任人链和历史说明
    inherited_aftersale_handlers: List[dict] = []
    inherited_aftersale_summary: str = ''


class LossConfirmIn(BaseModel):
    responsibility: str
    liable_person_id: Optional[int] = None
    remark: str = ''


class LossResolveIn(BaseModel):
    remark: str
    resolve_action: str = ''


class LossCloseIn(BaseModel):
    remark: str = ''


# ============ 字典选项 ============

class DictOut(BaseModel):
    aftersale_statuses: List[RoleItem]
    loss_statuses: List[RoleItem]
    loss_responsibilities: List[RoleItem]
    roles: List[RoleItem]
