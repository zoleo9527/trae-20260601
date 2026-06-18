from sqlalchemy import Column, Integer, String, DateTime, Text, Enum, ForeignKey
from sqlalchemy.sql import func
from backend.database import Base

class PostStatus(str, Enum):
    EMPTY = "empty"
    FILLED = "filled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

class Post(Base):
    __tablename__ = "posts"
    
    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey("activities.id"))
    name = Column(String, nullable=False)
    description = Column(Text)
    required_skills = Column(String)
    shift = Column(String)
    capacity = Column(Integer, default=1)
    current_count = Column(Integer, default=0)
    status = Column(Enum(PostStatus), default=PostStatus.EMPTY)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())