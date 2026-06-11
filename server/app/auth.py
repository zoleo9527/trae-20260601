from fastapi import Depends, HTTPException, Header
from sqlalchemy.orm import Session
from .database import get_db
from .models import User, RoleType


def get_current_user(
    x_user_id: int = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
) -> User:
    user = db.query(User).filter(User.id == x_user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=401, detail="用户未找到或已禁用")
    return user


def require_role(*roles: str):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles and current_user.role != RoleType.ADMIN.value:
            raise HTTPException(status_code=403, detail=f"需要角色: {', '.join(roles)}")
        return current_user
    return role_checker


require_operation = require_role(RoleType.OPERATION.value)
require_service_desk = require_role(RoleType.SERVICE_DESK.value)
require_engineering = require_role(RoleType.ENGINEERING.value)
