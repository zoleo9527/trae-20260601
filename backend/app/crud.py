from sqlalchemy.orm import Session
from typing import List, Optional
from . import models, schemas
from .auth import get_password_hash


def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()


def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()


def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        password_hash=hashed_password,
        role=user.role,
        name=user.name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_tenant(db: Session, tenant_id: int):
    return db.query(models.Tenant).filter(models.Tenant.id == tenant_id).first()


def get_tenants(db: Session, skip: int = 0, limit: int = 100, status: Optional[str] = None):
    query = db.query(models.Tenant)
    if status:
        query = query.filter(models.Tenant.status == status)
    return query.order_by(models.Tenant.created_at.desc()).offset(skip).limit(limit).all()


def create_tenant(db: Session, tenant: schemas.TenantCreate, user_id: int):
    db_tenant = models.Tenant(**tenant.model_dump(), created_by=user_id)
    db.add(db_tenant)
    db.commit()
    db.refresh(db_tenant)
    return db_tenant


def update_tenant(db: Session, tenant_id: int, tenant: schemas.TenantUpdate):
    db_tenant = get_tenant(db, tenant_id)
    if db_tenant:
        update_data = tenant.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_tenant, key, value)
        db.commit()
        db.refresh(db_tenant)
    return db_tenant


def delete_tenant(db: Session, tenant_id: int):
    db_tenant = get_tenant(db, tenant_id)
    if db_tenant:
        db.delete(db_tenant)
        db.commit()
    return db_tenant


def get_license(db: Session, license_id: int):
    return db.query(models.License).filter(models.License.id == license_id).first()


def get_licenses(db: Session, skip: int = 0, limit: int = 100, tenant_id: Optional[int] = None, status: Optional[str] = None):
    query = db.query(models.License)
    if tenant_id:
        query = query.filter(models.License.tenant_id == tenant_id)
    if status:
        query = query.filter(models.License.status == status)
    return query.order_by(models.License.created_at.desc()).offset(skip).limit(limit).all()


def create_license(db: Session, license: schemas.LicenseCreate):
    db_license = models.License(**license.model_dump())
    db.add(db_license)
    db.commit()
    db.refresh(db_license)
    return db_license


def update_license(db: Session, license_id: int, license: schemas.LicenseUpdate):
    db_license = get_license(db, license_id)
    if db_license:
        update_data = license.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_license, key, value)
        db.commit()
        db.refresh(db_license)
    return db_license


def delete_license(db: Session, license_id: int):
    db_license = get_license(db, license_id)
    if db_license:
        db.delete(db_license)
        db.commit()
    return db_license


def get_activity(db: Session, activity_id: int):
    return db.query(models.Activity).filter(models.Activity.id == activity_id).first()


def get_activities(db: Session, skip: int = 0, limit: int = 100, tenant_id: Optional[int] = None, status: Optional[str] = None):
    query = db.query(models.Activity)
    if tenant_id:
        query = query.filter(models.Activity.tenant_id == tenant_id)
    if status:
        query = query.filter(models.Activity.status == status)
    return query.order_by(models.Activity.created_at.desc()).offset(skip).limit(limit).all()


def create_activity(db: Session, activity: schemas.ActivityCreate):
    db_activity = models.Activity(**activity.model_dump())
    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)
    return db_activity


def update_activity(db: Session, activity_id: int, activity: schemas.ActivityUpdate):
    db_activity = get_activity(db, activity_id)
    if db_activity:
        update_data = activity.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_activity, key, value)
        db.commit()
        db.refresh(db_activity)
    return db_activity


def delete_activity(db: Session, activity_id: int):
    db_activity = get_activity(db, activity_id)
    if db_activity:
        db.delete(db_activity)
        db.commit()
    return db_activity


def get_complaint(db: Session, complaint_id: int):
    return db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()


def get_complaints(db: Session, skip: int = 0, limit: int = 100, tenant_id: Optional[int] = None, status: Optional[str] = None, handler: Optional[int] = None):
    query = db.query(models.Complaint)
    if tenant_id:
        query = query.filter(models.Complaint.tenant_id == tenant_id)
    if status:
        query = query.filter(models.Complaint.status == status)
    if handler:
        query = query.filter(models.Complaint.handler == handler)
    return query.order_by(models.Complaint.created_at.desc()).offset(skip).limit(limit).all()


def create_complaint(db: Session, complaint: schemas.ComplaintCreate):
    db_complaint = models.Complaint(**complaint.model_dump())
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    return db_complaint


def update_complaint(db: Session, complaint_id: int, complaint: schemas.ComplaintUpdate):
    db_complaint = get_complaint(db, complaint_id)
    if db_complaint:
        update_data = complaint.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_complaint, key, value)
        db.commit()
        db.refresh(db_complaint)
    return db_complaint


def delete_complaint(db: Session, complaint_id: int):
    db_complaint = get_complaint(db, complaint_id)
    if db_complaint:
        db.delete(db_complaint)
        db.commit()
    return db_complaint


def get_history_records(db: Session, skip: int = 0, limit: int = 100, related_type: Optional[str] = None, related_id: Optional[int] = None):
    query = db.query(models.HistoryRecord)
    if related_type:
        query = query.filter(models.HistoryRecord.related_type == related_type)
    if related_id:
        query = query.filter(models.HistoryRecord.related_id == related_id)
    return query.order_by(models.HistoryRecord.created_at.desc()).offset(skip).limit(limit).all()


def create_history_record(db: Session, record: schemas.HistoryRecordCreate):
    db_record = models.HistoryRecord(**record.model_dump())
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record


def add_history_record(db: Session, related_type: str, related_id: int, action: str, operator_name: str, remark: Optional[str] = None):
    record = schemas.HistoryRecordCreate(
        related_type=related_type,
        related_id=related_id,
        action=action,
        remark=remark,
        operator_name=operator_name
    )
    return create_history_record(db, record)
