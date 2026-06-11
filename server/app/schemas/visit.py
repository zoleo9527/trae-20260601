from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from ..models.visit import VisitStatus, VisitType


class VisitBase(BaseModel):
    visit_type: VisitType = VisitType.FIRST
    intent_level: Optional[str] = None
    interested_house_type: Optional[str] = None
    accompany_number: int = 0
    has_agent: int = 0
    agent_name: Optional[str] = None
    agent_phone: Optional[str] = None
    remark: Optional[str] = None


class VisitCreate(VisitBase):
    customer_name: str
    customer_phone: str
    customer_id_card: Optional[str] = None
    customer_gender: Optional[str] = None
    source_channel: Optional[str] = None
    visit_time: Optional[datetime] = None
    registered_by: int


class VisitAssign(BaseModel):
    assigned_agent_id: int
    assigned_by: int


class VisitOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    visit_no: str
    customer_id: int
    visit_type: VisitType
    visit_type_label: str = ""
    visit_time: datetime
    status: VisitStatus
    status_label: str = ""
    intent_level: Optional[str] = None
    interested_house_type: Optional[str] = None
    accompany_number: int = 0
    has_agent: int = 0
    agent_name: Optional[str] = None
    agent_phone: Optional[str] = None
    registered_by: int
    assigned_agent_id: Optional[int] = None
    assigned_at: Optional[datetime] = None
    remark: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class VisitDetail(VisitOut):
    customer_name: str = ""
    customer_phone: str = ""
    register_user_name: str = ""
    assigned_agent_name: str = ""
    follow_up_count: int = 0
    has_subscription: bool = False
    ownership_status: Optional[str] = None
