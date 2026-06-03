from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import crud, schemas
from app.database import get_db
from app.models import UserRole

router = APIRouter(prefix="/users", tags=["用户管理"])

@router.post("/", response_model=schemas.User, summary="创建用户")
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="用户名已存在")
    return crud.create_user(db=db, user=user)

@router.get("/", response_model=List[schemas.User], summary="获取用户列表")
def read_users(role: UserRole = None, db: Session = Depends(get_db)):
    if role:
        return crud.get_users_by_role(db, role=role)
    return []

@router.get("/{user_id}", response_model=schemas.User, summary="获取用户详情")
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="用户不存在")
    return db_user
