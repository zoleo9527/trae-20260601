from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models import Container
from schemas import ContainerCreate, ContainerRead

router = APIRouter(prefix="/api/containers", tags=["containers"])


@router.get("/", response_model=list[ContainerRead])
def list_containers(
    status: Optional[str] = None,
    size: Optional[str] = None,
    type: Optional[str] = None,
    container_no: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Container)
    if status:
        query = query.filter(Container.status == status)
    if size:
        query = query.filter(Container.size == size)
    if type:
        query = query.filter(Container.type == type)
    if container_no:
        query = query.filter(Container.container_no.contains(container_no))
    return query.order_by(Container.id.desc()).all()


@router.get("/{container_id}", response_model=ContainerRead)
def get_container(container_id: int, db: Session = Depends(get_db)):
    container = db.query(Container).filter(Container.id == container_id).first()
    if not container:
        raise HTTPException(status_code=404, detail="Container not found")
    return container


@router.post("/", response_model=ContainerRead, status_code=201)
def create_container(data: ContainerCreate, db: Session = Depends(get_db)):
    existing = db.query(Container).filter(Container.container_no == data.container_no).first()
    if existing:
        raise HTTPException(status_code=400, detail="Container number already exists")
    container = Container(**data.model_dump())
    db.add(container)
    db.commit()
    db.refresh(container)
    return container
