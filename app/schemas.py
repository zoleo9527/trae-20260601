from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from .models import RoleEnum, RechargeStatusEnum, InvoiceStatusEnum


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class UserBase(BaseModel):
    username: str
    full_name: str
    role: RoleEnum


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class MemberRechargeBase(BaseModel):
    member_name: str
    member_phone: str
    member_card_no: str
    recharge_amount: float
    payment_method: str
    recharge_time: datetime
    remark: Optional[str] = None


class MemberRechargeCreate(MemberRechargeBase):
    pass


class MemberRechargeUpdate(BaseModel):
    status: Optional[RechargeStatusEnum] = None
    remark: Optional[str] = None


class MemberRechargeResponse(MemberRechargeBase):
    id: int
    status: RechargeStatusEnum
    created_by: int
    handled_by: Optional[int] = None
    creator_name: Optional[str] = None
    handler_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MemberRechargeDetail(MemberRechargeResponse):
    invoices: List["InvoiceReissueResponse"] = []
    flow_logs: List["FlowLogResponse"] = []


class InvoiceReissueBase(BaseModel):
    recharge_id: int
    invoice_title: str
    tax_no: str
    invoice_amount: float
    invoice_type: str
    recipient_email: Optional[str] = None
    recipient_phone: Optional[str] = None


class InvoiceReissueCreate(InvoiceReissueBase):
    pass


class InvoiceReissueUpdate(BaseModel):
    status: Optional[InvoiceStatusEnum] = None
    return_reason: Optional[str] = None
    supplement_remark: Optional[str] = None


class InvoiceReissueResponse(InvoiceReissueBase):
    id: int
    status: InvoiceStatusEnum
    return_reason: Optional[str] = None
    supplement_remark: Optional[str] = None
    created_by: int
    handled_by: Optional[int] = None
    creator_name: Optional[str] = None
    handler_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class InvoiceReissueDetail(InvoiceReissueResponse):
    recharge: Optional[MemberRechargeResponse] = None
    flow_logs: List["FlowLogResponse"] = []


class FlowLogBase(BaseModel):
    action: str
    action_desc: str
    from_status: Optional[str] = None
    to_status: Optional[str] = None
    remark: Optional[str] = None


class FlowLogCreate(FlowLogBase):
    recharge_id: Optional[int] = None
    invoice_id: Optional[int] = None
    operator_id: int


class FlowLogResponse(FlowLogBase):
    id: int
    recharge_id: Optional[int] = None
    invoice_id: Optional[int] = None
    operator_id: int
    operator_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TodoItem(BaseModel):
    id: int
    type: str
    title: str
    description: str
    status: str
    created_at: datetime
    priority: str


class TodoListResponse(BaseModel):
    pending_count: int
    todos: List[TodoItem]


class UnifiedLedgerDetail(BaseModel):
    ledger_type: str
    recharge: Optional[MemberRechargeResponse] = None
    invoice: Optional[InvoiceReissueResponse] = None
    current_stage: str
    current_status_text: str
    current_handler_name: Optional[str] = None
    recharge_status_text: Optional[str] = None
    invoice_status_text: Optional[str] = None
    manager_return_reason: Optional[str] = None
    cashier_supplement_remark: Optional[str] = None
    manager_process_remark: Optional[str] = None
    all_flow_logs: List[FlowLogResponse] = []
    available_actions: List[dict] = []

    class Config:
        from_attributes = True


MemberRechargeDetail.model_rebuild()
InvoiceReissueDetail.model_rebuild()
