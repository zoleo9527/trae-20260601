from pydantic import BaseModel, Field
from datetime import datetime
from backend.models.attachment import AttachmentType

class AttachmentBase(BaseModel):
    activity_id: int | None = None
    application_id: int | None = None
    filename: str
    file_path: str | None = None
    type: AttachmentType | None = None
    uploaded_by: int | None = None

class AttachmentCreate(AttachmentBase):
    pass

class AttachmentResponse(AttachmentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True