from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import schemas, crud, auth
from ..database import get_db

router = APIRouter(prefix="/api/licenses", tags=["证照管理"])


@router.get("/", response_model=List[schemas.License])
def get_licenses(
    skip: int = 0,
    limit: int = 100,
    tenant_id: Optional[int] = None,
    status: Optional[str] = None,
    current_user: schemas.User = Depends(auth.require_roles("admin", "operation", "customer_service", "engineering")),
    db: Session = Depends(get_db)
):
    return crud.get_licenses(db, skip=skip, limit=limit, tenant_id=tenant_id, status=status)


@router.get("/{license_id}", response_model=schemas.License)
def get_license(
    license_id: int,
    current_user: schemas.User = Depends(auth.require_roles("admin", "operation", "customer_service", "engineering")),
    db: Session = Depends(get_db)
):
    db_license = crud.get_license(db, license_id=license_id)
    if db_license is None:
        raise HTTPException(status_code=404, detail="证照不存在")
    return db_license


@router.post("/", response_model=schemas.License)
def create_license(
    license: schemas.LicenseCreate,
    current_user: schemas.User = Depends(auth.require_roles("admin", "operation")),
    db: Session = Depends(get_db)
):
    db_tenant = crud.get_tenant(db, tenant_id=license.tenant_id)
    if db_tenant is None:
        raise HTTPException(status_code=404, detail="租户不存在")
    db_license = crud.create_license(db=db, license=license)
    crud.add_history_record(
        db=db,
        related_type="license",
        related_id=db_license.id,
        action="提交证照",
        operator_name=current_user.name,
        remark=f"提交{license.license_type}，证号{license.license_number}"
    )
    return db_license


@router.put("/{license_id}", response_model=schemas.License)
def update_license(
    license_id: int,
    license: schemas.LicenseUpdate,
    current_user: schemas.User = Depends(auth.require_roles("admin", "operation")),
    db: Session = Depends(get_db)
):
    db_license = crud.get_license(db, license_id=license_id)
    if db_license is None:
        raise HTTPException(status_code=404, detail="证照不存在")
    return crud.update_license(db=db, license_id=license_id, license=license)


@router.delete("/{license_id}")
def delete_license(
    license_id: int,
    current_user: schemas.User = Depends(auth.require_roles("admin")),
    db: Session = Depends(get_db)
):
    db_license = crud.get_license(db, license_id=license_id)
    if db_license is None:
        raise HTTPException(status_code=404, detail="证照不存在")
    crud.delete_license(db=db, license_id=license_id)
    return {"message": "删除成功"}


@router.post("/{license_id}/review", response_model=schemas.License)
def review_license(
    license_id: int,
    review: schemas.LicenseReview,
    current_user: schemas.User = Depends(auth.require_roles("admin", "operation")),
    db: Session = Depends(get_db)
):
    db_license = crud.get_license(db, license_id=license_id)
    if db_license is None:
        raise HTTPException(status_code=404, detail="证照不存在")

    if review.status not in ["approved", "rejected", "need_reupload"]:
        raise HTTPException(status_code=400, detail="无效的审核状态")

    db_license.status = review.status
    db.commit()
    db.refresh(db_license)

    action_map = {
        "approved": "证照审核通过",
        "rejected": "证照审核驳回",
        "need_reupload": "要求补录/重新上传"
    }
    crud.add_history_record(
        db=db,
        related_type="license",
        related_id=license_id,
        action=action_map.get(review.status, "证照审核操作"),
        operator_name=current_user.name,
        remark=review.remark
    )
    return db_license


@router.get("/{license_id}/history", response_model=List[schemas.HistoryRecord])
def get_license_history(
    license_id: int,
    current_user: schemas.User = Depends(auth.require_roles("admin", "operation", "customer_service", "engineering")),
    db: Session = Depends(get_db)
):
    db_license = crud.get_license(db, license_id=license_id)
    if db_license is None:
        raise HTTPException(status_code=404, detail="证照不存在")
    return crud.get_history_records(db, related_type="license", related_id=license_id)
