from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from ..models.user import UserRole


class UserBase(BaseModel):
    username: str
    full_name: str
    role: UserRole
    phone: Optional[str] = None


class UserCreate(UserBase):
    pass


class User(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    full_name: str
    role: UserRole
    role_label: str = ""
    phone: Optional[str] = None
