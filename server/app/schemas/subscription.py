from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict


class SubscriptionCreate(BaseModel):
    visit_id: int
    customer_id: int
    building_no: str
    unit_no: str
    room_no: str
    area: Optional[Decimal] = None
    total_price: Decimal
    deposit_amount: Optional[Decimal] = None
    subscription_date: Optional[datetime] = None
    remark: Optional[str] = None
    created_by: int


class SubscriptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    subscription_no: str
    visit_id: int
    customer_id: int
    building_no: str
    unit_no: str
    room_no: str
    area: Optional[Decimal] = None
    total_price: Decimal
    deposit_amount: Optional[Decimal] = None
    subscription_date: datetime
    remark: Optional[str] = None
    created_at: datetime
