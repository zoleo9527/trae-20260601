from sqlalchemy import Column, Integer, String, DateTime, Text, Enum, ForeignKey
from sqlalchemy.sql import func
from backend.database import Base

class ApplicationStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"
    COMPLETED = "completed"

class Application(Base):
    __tablename__ = "applications"
    
    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey("activities.id"))
    volunteer_id = Column(Integer, ForeignKey("users.id"))
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.PENDING)
    remarks = Column(Text)
    process_remarks = Column(Text)
    preferred_shift = Column(String)
    assigned_post_id = Column(Integer)
    processed_by = Column(Integer)
    processed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())