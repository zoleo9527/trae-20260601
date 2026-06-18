from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from backend.database import get_db
from backend.models.activity import Activity, ActivityStatus
from backend.models.application import Application, ApplicationStatus
from backend.models.post import Post, PostStatus
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

@router.post("/{activity_id}/check-exceptions")
def check_activity_exceptions(activity_id: int, db: Session = Depends(get_db)):
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    posts = db.query(Post).filter(Post.activity_id == activity_id).all()
    applications = db.query(Application).filter(Application.activity_id == activity_id).all()
    
    exceptions_created = []
    exceptions_resolved = []
    exceptions_updated = []
    
    for post in posts:
        existing_exception = db.query(ExceptionRecord).filter(
            ExceptionRecord.type == ExceptionType.POST_NOT_FILLED,
            ExceptionRecord.related_post_id == post.id,
            ExceptionRecord.status != ExceptionStatus.RESOLVED
        ).first()
        
        missing_count = post.capacity - post.current_count
        if post.current_count < post.capacity:
            if existing_exception:
                new_desc = f"活动「{activity.title}」的「{post.name}」还差 {missing_count} 人"
                if existing_exception.description != new_desc:
                    existing_exception.description = new_desc
                    exceptions_updated.append(f"岗位未填满: {post.name} (更新)")
            else:
                exception = ExceptionRecord(
                    type=ExceptionType.POST_NOT_FILLED,
                    title=f"岗位未填满",
                    description=f"活动「{activity.title}」的「{post.name}」还差 {missing_count} 人",
                    related_activity_id=activity_id,
                    related_post_id=post.id,
                    status=ExceptionStatus.PENDING
                )
                db.add(exception)
                exceptions_created.append(f"岗位未填满: {post.name}")
        else:
            if existing_exception:
                existing_exception.status = ExceptionStatus.RESOLVED
                existing_exception.description = f"活动「{activity.title}」的「{post.name}」已满员"
                exceptions_resolved.append(f"岗位已满: {post.name}")
    
    approved_apps = [app for app in applications if app.status == ApplicationStatus.APPROVED]
    for app in approved_apps:
        existing_exception = db.query(ExceptionRecord).filter(
            ExceptionRecord.type == ExceptionType.APPLICATION_STUCK,
            ExceptionRecord.related_application_id == app.id,
            ExceptionRecord.status != ExceptionStatus.RESOLVED
        ).first()
        
        if not app.assigned_post_id:
            if existing_exception:
                new_desc = f"志愿者已通过审核但未分配岗位，报名ID: {app.id}"
                if existing_exception.description != new_desc:
                    existing_exception.description = new_desc
                    exceptions_updated.append(f"报名卡壳: 报名ID {app.id} (更新)")
            else:
                exception = ExceptionRecord(
                    type=ExceptionType.APPLICATION_STUCK,
                    title="报名卡壳",
                    description=f"志愿者已通过审核但未分配岗位，报名ID: {app.id}",
                    related_activity_id=activity_id,
                    related_application_id=app.id,
                    status=ExceptionStatus.PENDING
                )
                db.add(exception)
                exceptions_created.append(f"报名卡壳: 报名ID {app.id}")
        else:
            if existing_exception:
                existing_exception.status = ExceptionStatus.RESOLVED
                existing_exception.description = f"报名ID: {app.id} 已分配到岗位"
                exceptions_resolved.append(f"报名已分配: 报名ID {app.id}")
    
    for app in applications:
        if app.status != ApplicationStatus.COMPLETED:
            existing_exception = db.query(ExceptionRecord).filter(
                ExceptionRecord.type == ExceptionType.FOLLOWUP_BROKEN,
                ExceptionRecord.related_application_id == app.id,
                ExceptionRecord.status != ExceptionStatus.RESOLVED
            ).first()
            if existing_exception:
                existing_exception.status = ExceptionStatus.RESOLVED
                existing_exception.description = f"报名ID: {app.id} 状态已变更"
                exceptions_resolved.append(f"回访断档已关闭: 报名ID {app.id}")
    
    completed_apps = [app for app in applications if app.status == ApplicationStatus.COMPLETED]
    for app in completed_apps:
        existing_exception = db.query(ExceptionRecord).filter(
            ExceptionRecord.type == ExceptionType.FOLLOWUP_BROKEN,
            ExceptionRecord.related_application_id == app.id,
            ExceptionRecord.status != ExceptionStatus.RESOLVED
        ).first()
        
        if not app.process_remarks or "时长" not in app.process_remarks:
            if existing_exception:
                new_desc = f"志愿者服务完成但时长未记录，需要回访确认，报名ID: {app.id}"
                if existing_exception.description != new_desc:
                    existing_exception.description = new_desc
                    exceptions_updated.append(f"回访断档: 报名ID {app.id} (更新)")
            else:
                exception = ExceptionRecord(
                    type=ExceptionType.FOLLOWUP_BROKEN,
                    title="回访断档",
                    description=f"志愿者服务完成但时长未记录，需要回访确认，报名ID: {app.id}",
                    related_activity_id=activity_id,
                    related_application_id=app.id,
                    status=ExceptionStatus.PENDING
                )
                db.add(exception)
                exceptions_created.append(f"回访断档: 报名ID {app.id}")
    
    db.commit()
    
    return {
        "message": f"已检查异常，新增 {len(exceptions_created)} 条，更新 {len(exceptions_updated)} 条，关闭 {len(exceptions_resolved)} 条",
        "created": exceptions_created,
        "updated": exceptions_updated,
        "resolved": exceptions_resolved
    }