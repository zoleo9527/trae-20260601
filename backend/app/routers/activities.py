from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import schemas, crud, auth
from ..database import get_db

router = APIRouter(prefix="/api/activities", tags=["活动申请"])


@router.get("/", response_model=List[schemas.Activity])
def get_activities(
    skip: int = 0,
    limit: int = 100,
    tenant_id: Optional[int] = None,
    status: Optional[str] = None,
    current_user: schemas.User = Depends(auth.require_roles("admin", "operation", "customer_service", "engineering")),
    db: Session = Depends(get_db)
):
    return crud.get_activities(db, skip=skip, limit=limit, tenant_id=tenant_id, status=status)


@router.get("/{activity_id}", response_model=schemas.Activity)
def get_activity(
    activity_id: int,
    current_user: schemas.User = Depends(auth.require_roles("admin", "operation", "customer_service", "engineering")),
    db: Session = Depends(get_db)
):
    db_activity = crud.get_activity(db, activity_id=activity_id)
    if db_activity is None:
        raise HTTPException(status_code=404, detail="活动不存在")
    return db_activity


@router.post("/", response_model=schemas.Activity)
def create_activity(
    activity: schemas.ActivityCreate,
    current_user: schemas.User = Depends(auth.require_roles("admin", "operation", "customer_service")),
    db: Session = Depends(get_db)
):
    db_tenant = crud.get_tenant(db, tenant_id=activity.tenant_id)
    if db_tenant is None:
        raise HTTPException(status_code=404, detail="租户不存在")
    db_activity = crud.create_activity(db=db, activity=activity)
    crud.add_history_record(
        db=db,
        related_type="activity",
        related_id=db_activity.id,
        action="提交活动申请",
        operator_name=current_user.name,
        remark=f"申请活动：{activity.title}"
    )
    return db_activity


@router.put("/{activity_id}", response_model=schemas.Activity)
def update_activity(
    activity_id: int,
    activity: schemas.ActivityUpdate,
    current_user: schemas.User = Depends(auth.require_roles("admin", "operation", "customer_service")),
    db: Session = Depends(get_db)
):
    db_activity = crud.get_activity(db, activity_id=activity_id)
    if db_activity is None:
        raise HTTPException(status_code=404, detail="活动不存在")
    return crud.update_activity(db=db, activity_id=activity_id, activity=activity)


@router.delete("/{activity_id}")
def delete_activity(
    activity_id: int,
    current_user: schemas.User = Depends(auth.require_roles("admin")),
    db: Session = Depends(get_db)
):
    db_activity = crud.get_activity(db, activity_id=activity_id)
    if db_activity is None:
        raise HTTPException(status_code=404, detail="活动不存在")
    crud.delete_activity(db=db, activity_id=activity_id)
    return {"message": "删除成功"}


@router.post("/{activity_id}/review", response_model=schemas.Activity)
def review_activity(
    activity_id: int,
    review: schemas.ActivityReview,
    current_user: schemas.User = Depends(auth.require_roles("admin", "operation", "engineering")),
    db: Session = Depends(get_db)
):
    db_activity = crud.get_activity(db, activity_id=activity_id)
    if db_activity is None:
        raise HTTPException(status_code=404, detail="活动不存在")

    if review.status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="无效的审核状态")

    db_activity.status = review.status
    db.commit()
    db.refresh(db_activity)

    action_map = {
        "approved": "活动审核通过",
        "rejected": "活动审核驳回"
    }
    crud.add_history_record(
        db=db,
        related_type="activity",
        related_id=activity_id,
        action=action_map.get(review.status, "活动审核操作"),
        operator_name=current_user.name,
        remark=review.remark
    )
    return db_activity


@router.get("/{activity_id}/history", response_model=List[schemas.HistoryRecord])
def get_activity_history(
    activity_id: int,
    current_user: schemas.User = Depends(auth.require_roles("admin", "operation", "customer_service", "engineering")),
    db: Session = Depends(get_db)
):
    db_activity = crud.get_activity(db, activity_id=activity_id)
    if db_activity is None:
        raise HTTPException(status_code=404, detail="活动不存在")
    return crud.get_history_records(db, related_type="activity", related_id=activity_id)
