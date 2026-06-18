from pydantic import BaseModel, Field
from datetime import datetime
from backend.models.application import ApplicationStatus

class ApplicationBase(BaseModel):
    activity_id: int
    volunteer_id: int
    remarks: str | None = None
    preferred_shift: str | None = None

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationUpdate(BaseModel):
    status: ApplicationStatus | None = None
    remarks: str | None = None
    assigned_post_id: int | None = None
    processed_by: int | None = None

class ApplicationResponse(ApplicationBase):
    id: int
    status: ApplicationStatus
    assigned_post_id: int | None = None
    processed_by: int | None = None
    processed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True