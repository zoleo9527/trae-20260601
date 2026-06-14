from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import User, UserRole, Area, Store
from app.schemas import User as UserSchema, UserCreate, Area as AreaSchema, AreaCreate, Store as StoreSchema, StoreCreate
import hashlib

router = APIRouter(tags=["基础数据"])


def get_password_hash(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return get_password_hash(plain_password) == hashed_password


@router.post("/users/", response_model=UserSchema)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        hashed_password=hashed_password,
        real_name=user.real_name,
        role=user.role,
        store_id=user.store_id,
        area_id=user.area_id,
        phone=user.phone,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.get("/users/", response_model=List[UserSchema])
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    role: Optional[UserRole] = None,
    store_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if store_id:
        query = query.filter(User.store_id == store_id)
    return query.offset(skip).limit(limit).all()


@router.get("/users/{user_id}", response_model=UserSchema)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return user


@router.post("/areas/", response_model=AreaSchema)
def create_area(area: AreaCreate, db: Session = Depends(get_db)):
    db_area = Area(**area.model_dump())
    db.add(db_area)
    db.commit()
    db.refresh(db_area)
    return db_area


@router.get("/areas/", response_model=List[AreaSchema])
def list_areas(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    return db.query(Area).offset(skip).limit(limit).all()


@router.post("/stores/", response_model=StoreSchema)
def create_store(store: StoreCreate, db: Session = Depends(get_db)):
    db_store = Store(**store.model_dump())
    db.add(db_store)
    db.commit()
    db.refresh(db_store)
    return db_store


@router.get("/stores/", response_model=List[StoreSchema])
def list_stores(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    area_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Store)
    if area_id:
        query = query.filter(Store.area_id == area_id)
    return query.offset(skip).limit(limit).all()