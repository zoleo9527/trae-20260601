from sqlalchemy import Column, Integer, String, DateTime, Text, Enum, ForeignKey
from sqlalchemy.sql import func
from backend.database import Base

class ExceptionType(str, Enum):
    DURATION_MISSING = "duration_missing"
    ACTIVITY_CANCELLED = "activity_cancelled"
    FOLLOWUP_BROKEN = "followup_broken"
    POST_NOT_FILLED = "post_not_filled"
    APPLICATION_STUCK = "application_stuck"

class ExceptionStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    RESOLVED = "resolved"

class ExceptionRecord(Base):
    __tablename__ = "exception_records"
    
    id = Column(Integer, primary_key=True, index=True)
    type = Column(Enum(ExceptionType), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    related_activity_id = Column(Integer, ForeignKey("activities.id"))
    related_application_id = Column(Integer, ForeignKey("applications.id"))
    related_post_id = Column(Integer, ForeignKey("posts.id"))
    status = Column(Enum(ExceptionStatus), default=ExceptionStatus.PENDING)
    handler_id = Column(Integer)
    handle_remarks = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True))