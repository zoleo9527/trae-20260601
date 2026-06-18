from pydantic import BaseModel, Field
from datetime import datetime
from backend.models.post import PostStatus

class PostBase(BaseModel):
    activity_id: int
    name: str
    description: str | None = None
    required_skills: str | None = None
    shift: str | None = None
    capacity: int = 1

class PostCreate(PostBase):
    pass

class PostUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    required_skills: str | None = None
    shift: str | None = None
    capacity: int | None = None
    status: PostStatus | None = None

class PostResponse(PostBase):
    id: int
    current_count: int
    status: PostStatus
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True