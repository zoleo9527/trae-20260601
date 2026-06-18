from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from backend.database import get_db
from backend.models.activity import Activity, ActivityStatus
from backend.models.exception import ExceptionRecord, ExceptionType, ExceptionStatus
from backend.schemas.activity import ActivityCreate, ActivityUpdate, ActivityResponse

router = APIRouter(prefix="/activities", tags=["activities"])

@router.post("/", response_model=ActivityResponse)
def create_activity(activity: ActivityCreate, db: Session = Depends(get_db)):
    new_activity = Activity(
        title=activity.title,
        description=activity.description,
        location=activity.location,
        start_time=activity.start_time,
        end_time=activity.end_time,
        duration=(activity.end_time - activity.start_time).total_seconds() / 3600,
        max_participants=activity.max_participants,
        required_skills=activity.required_skills,
        organizer_id=activity.organizer_id,
        status=ActivityStatus.PUBLISHED
    )
    db.add(new_activity)
    db.commit()
    db.refresh(new_activity)
    return new_activity

@router.get("/", response_model=list[ActivityResponse])
def get_activities(status: ActivityStatus | None = None, db: Session = Depends(get_db)):
    query = db.query(Activity)
    if status:
        query = query.filter(Activity.status == status)
    return query.all()

@router.get("/{activity_id}", response_model=ActivityResponse)
def get_activity(activity_id: int, db: Session = Depends(get_db)):
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity

@router.put("/{activity_id}", response_model=ActivityResponse)
def update_activity(activity_id: int, activity: ActivityUpdate, db: Session = Depends(get_db)):
    db_activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not db_activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    if activity.status == ActivityStatus.CANCELLED and db_activity.status != ActivityStatus.CANCELLED:
        exception = ExceptionRecord(
            type=ExceptionType.ACTIVITY_CANCELLED,
            title=f"活动取消: {db_activity.title}",
            description=f"活动ID {activity_id} 已取消，原因: {activity.cancelled_reason}",
            related_activity_id=activity_id,
            status=ExceptionStatus.PENDING
        )
        db.add(exception)
    
    for field, value in activity.dict(exclude_unset=True).items():
        setattr(db_activity, field, value)
    
    db.commit()
    db.refresh(db_activity)
    return db_activity