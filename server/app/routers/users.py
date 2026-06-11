from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from ..models import User
from ..schemas import UserCreate, UserResponse
from ..auth import get_current_user
from ..database import get_db

router = APIRouter(prefix="/api/users", tags=["用户管理"])


@router.post("", response_model=UserResponse, summary="创建用户")
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(User).filter(User.username == data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="用户名已存在")
    user = User(
        username=data.username,
        display_name=data.display_name,
        role=data.role.value,
        department=data.department,
        phone=data.phone,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("", response_model=list[UserResponse], summary="用户列表")
def list_users(
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    return query.order_by(User.id).all()


@router.get("/me", response_model=UserResponse, summary="当前用户信息")
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
