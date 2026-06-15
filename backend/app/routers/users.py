from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db

router = APIRouter()

users = [
    {"id": "admin", "name": "管理员", "role": "admin", "email": "admin@example.com"},
    {"id": "frontdesk", "name": "前台", "role": "frontdesk", "email": "frontdesk@example.com"},
    {"id": "technician", "name": "维修师", "role": "technician", "email": "technician@example.com"},
    {"id": "manager", "name": "店长", "role": "manager", "email": "manager@example.com"},
]

@router.get("/")
async def get_users():
    return users

@router.get("/{user_id}")
async def get_user(user_id: str):
    user = next((u for u in users if u["id"] == user_id), None)
    if user:
        return user
    raise HTTPException(status_code=404, detail="用户不存在")
