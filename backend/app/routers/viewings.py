from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import Optional, List
from datetime import datetime
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_active_user, log_operation

router = APIRouter(prefix="/api/viewings", tags=["带看管理"])


@router.get("", response_model=dict)
async def get_viewings(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    property_id: Optional[int] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    query = db.query(models.Viewing)

    if status:
        query = query.filter(models.Viewing.status == status)
    if property_id:
        query = query.filter(models.Viewing.property_id == property_id)
    if date_from:
        query = query.filter(models.Viewing.viewing_date >= datetime.fromisoformat(date_from))
    if date_to:
        query = query.filter(models.Viewing.viewing_date <= datetime.fromisoformat(date_to))
    if keyword:
        query = query.filter(
            or_(
                models.Viewing.customer_name.contains(keyword),
                models.Viewing.customer_phone.contains(keyword),
                models.Viewing.remarks.contains(keyword)
            )
        )

    total = query.count()
    items = query.order_by(models.Viewing.viewing_date.desc()) \
        .offset((page - 1) * page_size) \
        .limit(page_size) \
        .all()

    result = []
    for item in items:
        item_dict = schemas.ViewingResponse.model_validate(item).model_dump()
        if item.handler:
            item_dict["handler_name"] = item.handler.real_name
        if item.property:
            item_dict["property_info"] = {
                "id": item.property.id,
                "property_no": item.property.property_no,
                "building": item.property.building,
                "floor": item.property.floor,
                "room_no": item.property.room_no,
                "area": item.property.area,
                "status": item.property.status,
                "remarks": item.property.remarks
            }
        result.append(item_dict)

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": result
    }


@router.get("/{viewing_id}", response_model=schemas.ViewingResponse)
async def get_viewing(
    viewing_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    viewing = db.query(models.Viewing).filter(models.Viewing.id == viewing_id).first()
    if not viewing:
        raise HTTPException(status_code=404, detail="带看记录不存在")

    result = schemas.ViewingResponse.model_validate(viewing).model_dump()
    if viewing.handler:
        result["handler_name"] = viewing.handler.real_name
    if viewing.property:
        result["property_info"] = {
            "id": viewing.property.id,
            "property_no": viewing.property.property_no,
            "building": viewing.property.building,
            "floor": viewing.property.floor,
            "room_no": viewing.property.room_no,
            "area": viewing.property.area,
            "status": viewing.property.status,
            "remarks": viewing.property.remarks
        }
    return result


@router.post("", response_model=schemas.ViewingResponse, status_code=status.HTTP_201_CREATED)
async def create_viewing(
    viewing_data: schemas.ViewingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_property = db.query(models.Property).filter(
        models.Property.id == viewing_data.property_id
    ).first()
    if not db_property:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="房源不存在"
        )

    db_viewing = models.Viewing(
        **{k: v for k, v in viewing_data.model_dump().items() if k != 'inherit_property_remarks'},
        handler_id=current_user.id
    )

    if viewing_data.inherit_property_remarks and db_property.remarks:
        inherited = f"\n\n【房源空置备注（自动带入）】\n{db_property.remarks}"
        if db_viewing.remarks:
            db_viewing.remarks += inherited
        else:
            db_viewing.remarks = inherited.strip()

    db.add(db_viewing)
    db.flush()

    property_info = f"{db_property.building} {db_property.floor}层 {db_property.room_no}"
    op_remarks = viewing_data.remarks
    if viewing_data.inherit_property_remarks and db_property.remarks:
        op_remarks = f"已继承房源空置备注; {viewing_data.remarks or ''}"

    log_operation(
        db,
        target_type="viewing",
        target_id=db_viewing.id,
        operation_type="create",
        new_value=f"创建带看: {viewing_data.customer_name} - {property_info} - {viewing_data.viewing_date}",
        remarks=op_remarks,
        operator=current_user
    )

    db.commit()
    db.refresh(db_viewing)

    result = schemas.ViewingResponse.model_validate(db_viewing).model_dump()
    result["handler_name"] = current_user.real_name
    result["property_info"] = {
        "id": db_property.id,
        "property_no": db_property.property_no,
        "building": db_property.building,
        "floor": db_property.floor,
        "room_no": db_property.room_no,
        "area": db_property.area,
        "status": db_property.status,
        "remarks": db_property.remarks
    }
    return result


@router.put("/{viewing_id}", response_model=schemas.ViewingResponse)
async def update_viewing(
    viewing_id: int,
    update_data: schemas.ViewingUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_viewing = db.query(models.Viewing).filter(models.Viewing.id == viewing_id).first()
    if not db_viewing:
        raise HTTPException(status_code=404, detail="带看记录不存在")

    old_status = db_viewing.status
    old_values = []
    new_values = []
    update_dict = update_data.model_dump(exclude_unset=True)

    for key, value in update_dict.items():
        old_val = getattr(db_viewing, key)
        if old_val != value:
            old_values.append(f"{key}: {old_val}")
            new_values.append(f"{key}: {value}")
            setattr(db_viewing, key, value)

    db_viewing.handler_id = current_user.id

    op_type = "update"
    remarks = None
    if "status" in update_dict and old_status != update_dict["status"]:
        op_type = "status_update"
        remarks = f"状态变更: {old_status} -> {update_dict['status']}"
        if update_data.remarks:
            remarks += f"; 备注: {update_data.remarks}"

    log_operation(
        db,
        target_type="viewing",
        target_id=viewing_id,
        operation_type=op_type,
        old_value="; ".join(old_values) if old_values else None,
        new_value="; ".join(new_values) if new_values else None,
        remarks=remarks,
        operator=current_user
    )

    db.commit()
    db.refresh(db_viewing)

    result = schemas.ViewingResponse.model_validate(db_viewing).model_dump()
    if db_viewing.handler:
        result["handler_name"] = db_viewing.handler.real_name
    if db_viewing.property:
        result["property_info"] = {
            "id": db_viewing.property.id,
            "property_no": db_viewing.property.property_no,
            "building": db_viewing.property.building,
            "floor": db_viewing.property.floor,
            "room_no": db_viewing.property.room_no,
            "area": db_viewing.property.area,
            "status": db_viewing.property.status,
            "remarks": db_viewing.property.remarks
        }
    return result


@router.get("/{viewing_id}/timeline", response_model=List[schemas.OperationLogResponse])
async def get_viewing_timeline(
    viewing_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_viewing = db.query(models.Viewing).filter(models.Viewing.id == viewing_id).first()
    if not db_viewing:
        raise HTTPException(status_code=404, detail="带看记录不存在")

    viewing_logs = db.query(models.OperationLog).filter(
        and_(
            models.OperationLog.target_type == "viewing",
            models.OperationLog.target_id == viewing_id
        )
    ).order_by(models.OperationLog.created_at.desc()).all()

    return viewing_logs
