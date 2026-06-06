from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List

from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_keys = db.query(models.Key).count()
    available_keys = db.query(models.Key).filter(models.Key.status == "available").count()
    borrowed_keys = db.query(models.Key).filter(models.Key.status == "borrowed").count()
    lost_keys = db.query(models.Key).filter(models.Key.status == "lost").count()
    total_students = db.query(models.Student).count()
    
    active_borrows = db.query(models.BorrowRecord).filter(
        models.BorrowRecord.actual_return_time.is_(None)
    ).count()
    
    now = datetime.utcnow()
    overdue_borrows = db.query(models.BorrowRecord).filter(
        models.BorrowRecord.actual_return_time.is_(None),
        models.BorrowRecord.expected_return_time < now
    ).count()
    
    return {
        "total_keys": total_keys,
        "available_keys": available_keys,
        "borrowed_keys": borrowed_keys,
        "lost_keys": lost_keys,
        "total_students": total_students,
        "active_borrows": active_borrows,
        "overdue_borrows": overdue_borrows
    }


@router.get("/risks", response_model=List[schemas.RiskItem])
def get_risk_items(db: Session = Depends(get_db)):
    risks = []
    now = datetime.utcnow()
    
    overdue_records = db.query(models.BorrowRecord).filter(
        models.BorrowRecord.actual_return_time.is_(None),
        models.BorrowRecord.expected_return_time < now
    ).all()
    
    for record in overdue_records:
        key = db.query(models.Key).filter(models.Key.id == record.key_id).first()
        if key:
            overdue_hours = int((now - record.expected_return_time).total_seconds() / 3600)
            level = "high" if overdue_hours > 24 else "medium"
            risks.append({
                "key_id": key.id,
                "key_number": key.key_number,
                "building": key.building,
                "room": key.room,
                "risk_type": "overdue",
                "description": f"钥匙已逾期 {overdue_hours} 小时，借用人：{record.student_name}",
                "level": level
            })
    
    lost_keys = db.query(models.Key).filter(models.Key.status == "lost").all()
    for key in lost_keys:
        risks.append({
            "key_id": key.id,
            "key_number": key.key_number,
            "building": key.building,
            "room": key.room,
            "risk_type": "lost",
            "description": f"钥匙已挂失，需要补配",
            "level": "high"
        })
    
    return risks
