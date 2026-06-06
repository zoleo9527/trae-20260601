from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/students", tags=["students"])


@router.get("", response_model=List[schemas.Student])
def get_students(
    building: str = None,
    room: str = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Student)
    if building:
        query = query.filter(models.Student.building == building)
    if room:
        query = query.filter(models.Student.room == room)
    return query.all()
