from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from backend.database import get_db
from backend.models.application import Application, ApplicationStatus
from backend.models.exception import ExceptionRecord, ExceptionType, ExceptionStatus
from backend.schemas.application import ApplicationCreate, ApplicationUpdate, ApplicationResponse

router = APIRouter(prefix="/applications", tags=["applications"])

@router.post("/", response_model=ApplicationResponse)
def create_application(application: ApplicationCreate, db: Session = Depends(get_db)):
    new_application = Application(
        activity_id=application.activity_id,
        volunteer_id=application.volunteer_id,
        remarks=application.remarks,
        preferred_shift=application.preferred_shift
    )
    db.add(new_application)
    db.commit()
    db.refresh(new_application)
    return new_application

@router.get("/", response_model=list[ApplicationResponse])
def get_applications(
    activity_id: int | None = None,
    volunteer_id: int | None = None,
    status: ApplicationStatus | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(Application)
    if activity_id:
        query = query.filter(Application.activity_id == activity_id)
    if volunteer_id:
        query = query.filter(Application.volunteer_id == volunteer_id)
    if status:
        query = query.filter(Application.status == status)
    return query.all()

@router.get("/{application_id}", response_model=ApplicationResponse)
def get_application(application_id: int, db: Session = Depends(get_db)):
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    return application

@router.put("/{application_id}", response_model=ApplicationResponse)
def update_application(application_id: int, application: ApplicationUpdate, db: Session = Depends(get_db)):
    db_application = db.query(Application).filter(Application.id == application_id).first()
    if not db_application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if application.status in [ApplicationStatus.APPROVED, ApplicationStatus.REJECTED]:
        db_application.processed_by = application.processed_by
        db_application.processed_at = datetime.utcnow()
    
    if db_application.status == ApplicationStatus.PENDING and application.status != ApplicationStatus.PENDING:
        if application.processed_by is None:
            exception = ExceptionRecord(
                type=ExceptionType.APPLICATION_STUCK,
                title=f"报名处理无处理人",
                description=f"报名ID {application_id} 状态变更但未指定处理人",
                related_application_id=application_id,
                status=ExceptionStatus.PENDING
            )
            db.add(exception)
    
    for field, value in application.dict(exclude_unset=True).items():
        setattr(db_application, field, value)
    
    db.commit()
    db.refresh(db_application)
    return db_application