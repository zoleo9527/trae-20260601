from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import schemas, crud, auth
from ..database import get_db

router = APIRouter(prefix="/api/tenants", tags=["租户管理"])


@router.get("/", response_model=List[schemas.Tenant])
def get_tenants(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    current_user: schemas.User = Depends(auth.require_roles("admin", "operation", "customer_service", "engineering")),
    db: Session = Depends(get_db)
):
    tenants = crud.get_tenants(db, skip=skip, limit=limit, status=status)
    return tenants


@router.get("/{tenant_id}", response_model=schemas.Tenant)
def get_tenant(
    tenant_id: int,
    current_user: schemas.User = Depends(auth.require_roles("admin", "operation", "customer_service", "engineering")),
    db: Session = Depends(get_db)
):
    db_tenant = crud.get_tenant(db, tenant_id=tenant_id)
    if db_tenant is None:
        raise HTTPException(status_code=404, detail="租户不存在")
    return db_tenant


@router.post("/", response_model=schemas.Tenant)
def create_tenant(
    tenant: schemas.TenantCreate,
    current_user: schemas.User = Depends(auth.require_roles("admin", "operation")),
    db: Session = Depends(get_db)
):
    db_tenant = crud.create_tenant(db=db, tenant=tenant, user_id=current_user.id)
    crud.add_history_record(
        db=db,
        related_type="tenant",
        related_id=db_tenant.id,
        action="提交入驻申请",
        operator_name=current_user.name,
        remark=f"提交入驻申请，铺位{tenant.shop_number}"
    )
    return db_tenant


@router.put("/{tenant_id}", response_model=schemas.Tenant)
def update_tenant(
    tenant_id: int,
    tenant: schemas.TenantUpdate,
    current_user: schemas.User = Depends(auth.require_roles("admin", "operation")),
    db: Session = Depends(get_db)
):
    db_tenant = crud.get_tenant(db, tenant_id=tenant_id)
    if db_tenant is None:
        raise HTTPException(status_code=404, detail="租户不存在")
    return crud.update_tenant(db=db, tenant_id=tenant_id, tenant=tenant)


@router.delete("/{tenant_id}")
def delete_tenant(
    tenant_id: int,
    current_user: schemas.User = Depends(auth.require_roles("admin")),
    db: Session = Depends(get_db)
):
    db_tenant = crud.get_tenant(db, tenant_id=tenant_id)
    if db_tenant is None:
        raise HTTPException(status_code=404, detail="租户不存在")
    crud.delete_tenant(db=db, tenant_id=tenant_id)
    return {"message": "删除成功"}


@router.post("/{tenant_id}/review", response_model=schemas.Tenant)
def review_tenant(
    tenant_id: int,
    review: schemas.TenantReview,
    current_user: schemas.User = Depends(auth.require_roles("admin", "operation")),
    db: Session = Depends(get_db)
):
    db_tenant = crud.get_tenant(db, tenant_id=tenant_id)
    if db_tenant is None:
        raise HTTPException(status_code=404, detail="租户不存在")
    
    if review.status not in ["pending", "approved", "rejected", "settled"]:
        raise HTTPException(status_code=400, detail="无效的审核状态")
    
    db_tenant.status = review.status
    db.commit()
    db.refresh(db_tenant)
    
    action_map = {
        "pending": "重新提交入驻申请",
        "approved": "审核通过",
        "rejected": "审核驳回",
        "settled": "已入驻"
    }
    crud.add_history_record(
        db=db,
        related_type="tenant",
        related_id=tenant_id,
        action=action_map.get(review.status, "审核操作"),
        operator_name=current_user.name,
        remark=review.remark
    )
    
    return db_tenant


@router.get("/{tenant_id}/history", response_model=List[schemas.HistoryRecord])
def get_tenant_history(
    tenant_id: int,
    current_user: schemas.User = Depends(auth.require_roles("admin", "operation", "customer_service", "engineering")),
    db: Session = Depends(get_db)
):
    db_tenant = crud.get_tenant(db, tenant_id=tenant_id)
    if db_tenant is None:
        raise HTTPException(status_code=404, detail="租户不存在")
    return crud.get_history_records(db, related_type="tenant", related_id=tenant_id)
