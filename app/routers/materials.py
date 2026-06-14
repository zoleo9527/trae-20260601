from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import MaterialStatus, User, UserRole
from app.schemas import (
    ActivityMaterial,
    ActivityMaterialCreate,
    ActivityMaterialUpdate,
    StatusChangeRequest,
)
from app.services import MaterialService

router = APIRouter(prefix="/materials", tags=["活动物料"])


def get_current_user(db: Session = Depends(get_db)) -> User:
    return User(id=1, username="test", real_name="测试用户", role=UserRole.CLERK)


@router.post("/", response_model=ActivityMaterial)
def create_material(
    material: ActivityMaterialCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return MaterialService.create_material(db, material)


@router.get("/", response_model=List[ActivityMaterial])
def list_materials(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    store_id: Optional[int] = None,
    status: Optional[MaterialStatus] = None,
    db: Session = Depends(get_db),
):
    return MaterialService.get_materials(db, skip, limit, store_id, status)


@router.get("/{material_id}", response_model=ActivityMaterial)
def get_material(material_id: int, db: Session = Depends(get_db)):
    material = MaterialService.get_material(db, material_id)
    if not material:
        raise HTTPException(status_code=404, detail="活动物料不存在")
    return material


@router.put("/{material_id}", response_model=ActivityMaterial)
def update_material(
    material_id: int,
    material: ActivityMaterialUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_material = MaterialService.update_material(db, material_id, material)
    if not db_material:
        raise HTTPException(status_code=404, detail="活动物料不存在")
    return db_material


@router.post("/{material_id}/status", response_model=ActivityMaterial)
def change_material_status(
    material_id: int,
    status_change: StatusChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        material, record = MaterialService.change_status(
            db, material_id, status_change, current_user
        )
        if not material:
            raise HTTPException(status_code=404, detail="活动物料不存在")
        return material
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/stuck/list", response_model=List[ActivityMaterial])
def get_stuck_materials(
    days: int = Query(3, ge=1, le=30),
    db: Session = Depends(get_db),
):
    return MaterialService.get_stuck_materials(db, days)


@router.get("/no-handler/list", response_model=List[ActivityMaterial])
def get_materials_without_handler(db: Session = Depends(get_db)):
    return MaterialService.get_materials_without_handler(db)