from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import User, UserRole
from app.schemas import (
    ResponsibilityChainResponse,
)
from app.services import ResponsibilityChainService

router = APIRouter(prefix="/responsibility", tags=["责任链"])


def get_current_user(db: Session = Depends(get_db)) -> User:
    return User(id=1, username="test", real_name="测试用户", role=UserRole.CLERK)


@router.get("/material/{material_id}", response_model=ResponsibilityChainResponse)
def get_material_responsibility(
    material_id: int,
    db: Session = Depends(get_db),
):
    result = ResponsibilityChainService.get_responsibility_chain(
        db, material_id=material_id
    )
    return result


@router.get("/feedback/{feedback_id}", response_model=ResponsibilityChainResponse)
def get_feedback_responsibility(
    feedback_id: int,
    db: Session = Depends(get_db),
):
    result = ResponsibilityChainService.get_responsibility_chain(
        db, feedback_id=feedback_id
    )
    return result


@router.post("/material/{material_id}/escalate")
def escalate_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    success = ResponsibilityChainService.escalate_if_needed(db, material_id=material_id)
    if not success:
        raise HTTPException(
            status_code=400, detail="无法升级处理人，可能已达最高级别或无处理人"
        )
    return {"message": "处理人已升级", "material_id": material_id}


@router.post("/feedback/{feedback_id}/escalate")
def escalate_feedback(
    feedback_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    success = ResponsibilityChainService.escalate_if_needed(db, feedback_id=feedback_id)
    if not success:
        raise HTTPException(
            status_code=400, detail="无法升级处理人，可能已达最高级别或无处理人"
        )
    return {"message": "处理人已升级", "feedback_id": feedback_id}