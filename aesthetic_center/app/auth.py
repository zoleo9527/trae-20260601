from fastapi import Depends, HTTPException, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, UserRole
from app.errors import ErrorCode, ERROR_MESSAGES


def get_current_user(
    x_user_id: int = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
) -> User:
    user = db.query(User).filter(User.id == x_user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=401,
            detail={"code": ErrorCode.PERMISSION_DENIED, "message": ERROR_MESSAGES[ErrorCode.PERMISSION_DENIED]},
        )
    return user


def require_role(*allowed_roles: UserRole):
    def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail={"code": ErrorCode.PERMISSION_DENIED, "message": ERROR_MESSAGES[ErrorCode.PERMISSION_DENIED]},
            )
        return current_user
    return checker


admin_only = require_role(UserRole.ADMIN)
florist_or_admin = require_role(UserRole.ADMIN, UserRole.FLORIST)
inspector_or_admin = require_role(UserRole.ADMIN, UserRole.INSPECTOR)
delivery_or_admin = require_role(UserRole.ADMIN, UserRole.DELIVERY)
