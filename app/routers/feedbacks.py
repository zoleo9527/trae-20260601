from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import FeedbackStatus, User, UserRole
from app.schemas import (
    StoreFeedback,
    StoreFeedbackCreate,
    StoreFeedbackUpdate,
    StatusChangeRequest,
)
from app.services import FeedbackService

router = APIRouter(prefix="/feedbacks", tags=["门店反馈"])


def get_current_user(db: Session = Depends(get_db)) -> User:
    return User(id=1, username="test", real_name="测试用户", role=UserRole.CLERK)


@router.post("/", response_model=StoreFeedback)
def create_feedback(
    feedback: StoreFeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return FeedbackService.create_feedback(db, feedback)


@router.get("/", response_model=List[StoreFeedback])
def list_feedbacks(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    store_id: Optional[int] = None,
    material_id: Optional[int] = None,
    status: Optional[FeedbackStatus] = None,
    db: Session = Depends(get_db),
):
    return FeedbackService.get_feedbacks(db, skip, limit, store_id, material_id, status)


@router.get("/{feedback_id}", response_model=StoreFeedback)
def get_feedback(feedback_id: int, db: Session = Depends(get_db)):
    feedback = FeedbackService.get_feedback(db, feedback_id)
    if not feedback:
        raise HTTPException(status_code=404, detail="门店反馈不存在")
    return feedback


@router.put("/{feedback_id}", response_model=StoreFeedback)
def update_feedback(
    feedback_id: int,
    feedback: StoreFeedbackUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_feedback = FeedbackService.update_feedback(db, feedback_id, feedback)
    if not db_feedback:
        raise HTTPException(status_code=404, detail="门店反馈不存在")
    return db_feedback


@router.post("/{feedback_id}/status", response_model=StoreFeedback)
def change_feedback_status(
    feedback_id: int,
    status_change: StatusChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        feedback, record = FeedbackService.change_status(
            db, feedback_id, status_change, current_user
        )
        if not feedback:
            raise HTTPException(status_code=404, detail="门店反馈不存在")
        return feedback
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/stuck/list", response_model=List[StoreFeedback])
def get_stuck_feedbacks(
    days: int = Query(3, ge=1, le=30),
    db: Session = Depends(get_db),
):
    return FeedbackService.get_stuck_feedbacks(db, days)


@router.get("/no-handler/list", response_model=List[StoreFeedback])
def get_feedbacks_without_handler(db: Session = Depends(get_db)):
    return FeedbackService.get_feedbacks_without_handler(db)