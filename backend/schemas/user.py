from pydantic import BaseModel, Field
from datetime import datetime
from backend.models.user import UserRole

class UserBase(BaseModel):
    username: str
    name: str
    phone: str
    role: UserRole
    department: str | None = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse