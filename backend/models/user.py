from sqlalchemy import Column, Integer, String, Enum, DateTime
from sqlalchemy.sql import func
from backend.database import Base

class UserRole(str, Enum):
    SOCIAL_WORKER = "social_worker"
    VOLUNTEER_LEADER = "volunteer_leader"
    COMMUNITY_OFFICIAL = "community_official"
    VOLUNTEER = "volunteer"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    department = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())