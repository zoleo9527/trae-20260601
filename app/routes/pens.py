from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.models import Pen, PenType
from app.schemas.schemas import PenCreate, PenRead

router = APIRouter(prefix="/api/pens", tags=["栏位管理"])


@router.get("/", response_model=list[PenRead], summary="获取栏位列表")
def list_pens(
    pen_type: PenType | None = Query(None, description="栏位类型筛选"),
    building: str | None = Query(None, description="栋舍筛选"),
    db: Session = Depends(get_db),
):
    q = db.query(Pen)
    if pen_type:
        q = q.filter(Pen.pen_type == pen_type)
    if building:
        q = q.filter(Pen.building == building)
    return q.order_by(Pen.pen_code).all()


@router.get("/{pen_id}", response_model=PenRead, summary="获取栏位详情")
def get_pen(pen_id: int, db: Session = Depends(get_db)):
    pen = db.query(Pen).filter(Pen.id == pen_id).first()
    if not pen:
        raise HTTPException(status_code=404, detail="栏位不存在")
    return pen


@router.post("/", response_model=PenRead, summary="新增栏位")
def create_pen(data: PenCreate, db: Session = Depends(get_db)):
    existing = db.query(Pen).filter(Pen.pen_code == data.pen_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="栏位编号已存在")
    pen = Pen(**data.model_dump())
    db.add(pen)
    db.commit()
    db.refresh(pen)
    return pen
