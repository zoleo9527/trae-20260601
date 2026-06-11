from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, UserRole, ROLE_LABELS
from ..schemas import UserOut

router = APIRouter(prefix="/api/users", tags=["用户与角色"])


@router.get("", response_model=List[UserOut], summary="获取用户列表（可按角色筛选）")
def list_users(role: UserRole | None = None, db: Session = Depends(get_db)):
    q = db.query(User)
    if role:
        q = q.filter(User.role == role)
    users = q.order_by(User.id.asc()).all()
    result = []
    for u in users:
        out = UserOut.model_validate(u)
        out.role_label = ROLE_LABELS.get(u.role, "")
        result.append(out)
    return result


@router.get("/{user_id}", response_model=UserOut, summary="获取单个用户")
def get_user(user_id: int, db: Session = Depends(get_db)):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(404, "用户不存在")
    out = UserOut.model_validate(u)
    out.role_label = ROLE_LABELS.get(u.role, "")
    return out
