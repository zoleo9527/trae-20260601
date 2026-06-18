from pydantic import BaseModel, Field
from datetime import datetime
from backend.models.exception import ExceptionType, ExceptionStatus

class ExceptionBase(BaseModel):
    type: ExceptionType
    title: str
    description: str | None = None
    related_activity_id: int | None = None
    related_application_id: int | None = None
    related_post_id: int | None = None

class ExceptionCreate(ExceptionBase):
    pass

class ExceptionUpdate(BaseModel):
    status: ExceptionStatus | None = None
    handler_id: int | None = None
    handle_remarks: str | None = None

class ExceptionResponse(ExceptionBase):
    id: int
    status: ExceptionStatus
    handler_id: int | None = None
    handle_remarks: str | None = None
    created_at: datetime
    resolved_at: datetime | None

    class Config:
        from_attributes = True