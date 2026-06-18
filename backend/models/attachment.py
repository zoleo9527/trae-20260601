from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from backend.database import Base

class AttachmentType(str, Enum):
    SIGN_IN_SHEET = "sign_in_sheet"
    ACTIVITY_PHOTO = "activity_photo"
    REPORT = "report"
    OTHER = "other"

class Attachment(Base):
    __tablename__ = "attachments"
    
    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey("activities.id"))
    application_id = Column(Integer, ForeignKey("applications.id"))
    filename = Column(String, nullable=False)
    file_path = Column(String)
    type = Column(Enum(AttachmentType))
    uploaded_by = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())