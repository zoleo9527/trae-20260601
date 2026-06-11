from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class FollowUpCreate(BaseModel):
    visit_id: int
    agent_id: int
    follow_channel: Optional[str] = None
    content: str
    next_follow_plan: Optional[str] = None
    next_follow_time: Optional[datetime] = None
    customer_response: Optional[str] = None


class FollowUpOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    visit_id: int
    customer_id: int
    agent_id: int
    agent_name: str = ""
    follow_time: datetime
    follow_channel: Optional[str] = None
    content: str
    next_follow_plan: Optional[str] = None
    next_follow_time: Optional[datetime] = None
    customer_response: Optional[str] = None
    created_at: datetime
