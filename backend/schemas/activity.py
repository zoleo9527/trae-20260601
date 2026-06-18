from pydantic import BaseModel, Field
from datetime import datetime
from backend.models.activity import ActivityStatus

class ActivityBase(BaseModel):
    title: str
    description: str | None = None
    location: str | None = None
    start_time: datetime
    end_time: datetime
    max_participants: int | None = None
    required_skills: str | None = None
    organizer_id: int | None = None

class ActivityCreate(ActivityBase):
    pass

class ActivityUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    location: str | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    max_participants: int | None = None
    required_skills: str | None = None
    status: ActivityStatus | None = None
    cancelled_reason: str | None = None

class ActivityResponse(ActivityBase):
    id: int
    duration: float | None = None
    status: ActivityStatus
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True