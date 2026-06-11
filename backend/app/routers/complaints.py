from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import schemas, crud, auth
from ..database import get_db

router = APIRouter(prefix="/api/complaints", tags=["投诉记录"])


@router.get("/", response_model=List[schemas.Complaint])
def get_complaints(
    skip: int = 0,
    limit: int = 100,
    tenant_id: Optional[int] = None,
    status: Optional[str] = None,
    handler: Optional[int] = None,
    current_user: schemas.User = Depends(auth.require_roles("admin", "operation", "customer_service", "engineering")),
    db: Session = Depends(get_db)
):
    actual_handler = handler
    if current_user.role == "engineering":
        actual_handler = current_user.id
    return crud.get_complaints(db, skip=skip, limit=limit, tenant_id=tenant_id, status=status, handler=actual_handler)


@router.get("/{complaint_id}", response_model=schemas.Complaint)
def get_complaint(
    complaint_id: int,
    current_user: schemas.User = Depends(auth.require_roles("admin", "operation", "customer_service", "engineering")),
    db: Session = Depends(get_db)
):
    db_complaint = crud.get_complaint(db, complaint_id=complaint_id)
    if db_complaint is None:
        raise HTTPException(status_code=404, detail="投诉不存在")
    return db_complaint


@router.post("/", response_model=schemas.Complaint)
def create_complaint(
    complaint: schemas.ComplaintCreate,
    current_user: schemas.User = Depends(auth.require_roles("admin", "operation", "customer_service")),
    db: Session = Depends(get_db)
):
    db_tenant = crud.get_tenant(db, tenant_id=complaint.tenant_id)
    if db_tenant is None:
        raise HTTPException(status_code=404, detail="租户不存在")
    db_complaint = crud.create_complaint(db=db, complaint=complaint)
    crud.add_history_record(
        db=db,
        related_type="complaint",
        related_id=db_complaint.id,
        action="登记投诉",
        operator_name=current_user.name,
        remark=f"投诉内容：{complaint.title}"
    )
    return db_complaint


@router.put("/{complaint_id}", response_model=schemas.Complaint)
def update_complaint(
    complaint_id: int,
    complaint: schemas.ComplaintUpdate,
    current_user: schemas.User = Depends(auth.require_roles("admin", "operation", "customer_service", "engineering")),
    db: Session = Depends(get_db)
):
    db_complaint = crud.get_complaint(db, complaint_id=complaint_id)
    if db_complaint is None:
        raise HTTPException(status_code=404, detail="投诉不存在")
    return crud.update_complaint(db=db, complaint_id=complaint_id, complaint=complaint)


@router.delete("/{complaint_id}")
def delete_complaint(
    complaint_id: int,
    current_user: schemas.User = Depends(auth.require_roles("admin")),
    db: Session = Depends(get_db)
):
    db_complaint = crud.get_complaint(db, complaint_id=complaint_id)
    if db_complaint is None:
        raise HTTPException(status_code=404, detail="投诉不存在")
    crud.delete_complaint(db=db, complaint_id=complaint_id)
    return {"message": "删除成功"}


@router.post("/{complaint_id}/handle", response_model=schemas.Complaint)
def handle_complaint(
    complaint_id: int,
    handle: schemas.ComplaintHandle,
    current_user: schemas.User = Depends(auth.require_roles("admin", "operation", "engineering")),
    db: Session = Depends(get_db)
):
    db_complaint = crud.get_complaint(db, complaint_id=complaint_id)
    if db_complaint is None:
        raise HTTPException(status_code=404, detail="投诉不存在")

    if handle.status not in ["processing", "resolved"]:
        raise HTTPException(status_code=400, detail="无效的处理状态")

    db_complaint.status = handle.status
    if db_complaint.handler is None:
        db_complaint.handler = current_user.id
    db.commit()
    db.refresh(db_complaint)

    action_map = {
        "processing": "开始处理投诉",
        "resolved": "投诉已解决"
    }
    crud.add_history_record(
        db=db,
        related_type="complaint",
        related_id=complaint_id,
        action=action_map.get(handle.status, "投诉处理操作"),
        operator_name=current_user.name,
        remark=handle.remark
    )
    return db_complaint


@router.get("/{complaint_id}/history", response_model=List[schemas.HistoryRecord])
def get_complaint_history(
    complaint_id: int,
    current_user: schemas.User = Depends(auth.require_roles("admin", "operation", "customer_service", "engineering")),
    db: Session = Depends(get_db)
):
    db_complaint = crud.get_complaint(db, complaint_id=complaint_id)
    if db_complaint is None:
        raise HTTPException(status_code=404, detail="投诉不存在")
    return crud.get_history_records(db, related_type="complaint", related_id=complaint_id)
