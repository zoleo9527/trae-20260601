from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict

from ..models.ownership import OwnershipStatus


class OwnershipCreate(BaseModel):
    visit_id: int
    customer_id: int
    subscription_id: Optional[int] = None
    claimed_agent_id: int
    ownership_reason: Optional[str] = None


class OwnershipConfirm(BaseModel):
    confirmed_by: int
    confirm_agent_id: Optional[int] = None
    commission_amount: Optional[Decimal] = None
    commission_ratio: Optional[Decimal] = None


class OwnershipDispute(BaseModel):
    disputed_by: int
    dispute_reason: str


class OwnershipResolve(BaseModel):
    resolved_by: int
    confirm_agent_id: int
    resolve_reason: str
    commission_amount: Optional[Decimal] = None
    commission_ratio: Optional[Decimal] = None


class OwnershipOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    visit_id: int
    customer_id: int
    subscription_id: Optional[int] = None
    claimed_agent_id: int
    claimed_agent_name: str = ""
    confirm_agent_id: Optional[int] = None
    confirm_agent_name: str = ""
    status: OwnershipStatus
    status_label: str = ""
    ownership_reason: Optional[str] = None
    dispute_reason: Optional[str] = None
    resolve_reason: Optional[str] = None
    commission_amount: Optional[Decimal] = None
    commission_ratio: Optional[Decimal] = None
    created_at: datetime
    confirmed_at: Optional[datetime] = None
    disputed_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None


class OwnershipDetail(OwnershipOut):
    visit_no: str = ""
    visit_time: Optional[datetime] = None
    customer_name: str = ""
    customer_phone: str = ""
    subscription_no: str = ""
    room_info: str = ""
