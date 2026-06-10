from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import LoginRequest, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])

DEMO_USERS = [
    {"username": "kefu01", "display_name": "李客服", "role": "customer_service"},
    {"username": "xiangdao01", "display_name": "王向导", "role": "picking_guide"},
    {"username": "cangku01", "display_name": "张仓管", "role": "warehouse"},
]


@router.post("/login", response_model=UserOut)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    demo_map = {u["username"]: u for u in DEMO_USERS}
    if req.username not in demo_map:
        raise HTTPException(status_code=401, detail="用户不存在，演示账号: kefu01 / xiangdao01 / cangku01")
    info = demo_map[req.username]
    user = db.query(User).filter(User.username == req.username).first()
    if not user:
        user = User(username=info["username"], display_name=info["display_name"], role=info["role"])
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@router.get("/demo-accounts", response_model=list[UserOut])
def get_demo_accounts(db: Session = Depends(get_db)):
    result = []
    for info in DEMO_USERS:
        user = db.query(User).filter(User.username == info["username"]).first()
        if not user:
            user = User(username=info["username"], display_name=info["display_name"], role=info["role"])
            db.add(user)
            db.commit()
            db.refresh(user)
        result.append(user)
    return result
