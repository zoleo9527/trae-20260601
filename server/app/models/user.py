import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, Integer, String

from ..database import Base


class UserRole(str, enum.Enum):
    MANAGER = "manager"
    AGENT = "agent"
    CONTROLLER = "controller"


ROLE_LABELS = {
    UserRole.MANAGER: "案场经理",
    UserRole.AGENT: "置业顾问",
    UserRole.CONTROLLER: "销控专员",
}


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    phone = Column(String(20))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
