from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import Optional, List
from datetime import datetime
from .. import models, schemas, auth
from ..database import get_db
from ..auth import get_current_active_user, log_operation

router = APIRouter(prefix="/api/properties", tags=["房源管理"])


@router.get("", response_model=dict)
async def get_properties(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    building: Optional[str] = None,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    query = db.query(models.Property)

    if status:
        query = query.filter(models.Property.status == status)
    if building:
        query = query.filter(models.Property.building == building)
    if keyword:
        query = query.filter(
            or_(
                models.Property.property_no.contains(keyword),
                models.Property.room_no.contains(keyword),
                models.Property.remarks.contains(keyword)
            )
        )

    total = query.count()
    items = query.order_by(models.Property.updated_at.desc().nullslast(), models.Property.id.desc()) \
        .offset((page - 1) * page_size) \
        .limit(page_size) \
        .all()

    result = []
    for item in items:
        item_dict = schemas.PropertyResponse.model_validate(item).model_dump()
        if item.handler:
            item_dict["handler_name"] = item.handler.real_name
        result.append(item_dict)

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": result
    }


@router.get("/buildings/list", response_model=List[str])
async def get_buildings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    buildings = db.query(models.Property.building).distinct().all()
    return [b[0] for b in buildings]


@router.get("/{property_id}", response_model=schemas.PropertyResponse)
async def get_property(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    property = db.query(models.Property).filter(models.Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="房源不存在")

    result = schemas.PropertyResponse.model_validate(property).model_dump()
    if property.handler:
        result["handler_name"] = property.handler.real_name
    return result


@router.post("", response_model=schemas.PropertyResponse, status_code=status.HTTP_201_CREATED)
async def create_property(
    property_data: schemas.PropertyCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    existing = db.query(models.Property).filter(
        models.Property.property_no == property_data.property_no
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="房源编号已存在"
        )

    db_property = models.Property(
        **property_data.model_dump(),
        handler_id=current_user.id
    )
    db.add(db_property)
    db.flush()

    log_operation(
        db,
        target_type="property",
        target_id=db_property.id,
        operation_type="create",
        new_value=f"创建房源: {property_data.property_no}",
        operator=current_user
    )

    db.commit()
    db.refresh(db_property)

    result = schemas.PropertyResponse.model_validate(db_property).model_dump()
    result["handler_name"] = current_user.real_name
    return result


@router.put("/{property_id}", response_model=schemas.PropertyResponse)
async def update_property(
    property_id: int,
    update_data: schemas.PropertyUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_property = db.query(models.Property).filter(models.Property.id == property_id).first()
    if not db_property:
        raise HTTPException(status_code=404, detail="房源不存在")

    old_values = []
    new_values = []
    update_dict = update_data.model_dump(exclude_unset=True)

    for key, value in update_dict.items():
        old_val = getattr(db_property, key)
        if old_val != value:
            old_values.append(f"{key}: {old_val}")
            new_values.append(f"{key}: {value}")
            setattr(db_property, key, value)

    db_property.handler_id = current_user.id

    log_operation(
        db,
        target_type="property",
        target_id=property_id,
        operation_type="update",
        old_value="; ".join(old_values) if old_values else None,
        new_value="; ".join(new_values) if new_values else None,
        operator=current_user
    )

    db.commit()
    db.refresh(db_property)

    result = schemas.PropertyResponse.model_validate(db_property).model_dump()
    if db_property.handler:
        result["handler_name"] = db_property.handler.real_name
    return result


@router.put("/{property_id}/vacancy", response_model=schemas.PropertyResponse)
async def update_vacancy(
    property_id: int,
    vacancy_data: schemas.PropertyVacancyUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_property = db.query(models.Property).filter(models.Property.id == property_id).first()
    if not db_property:
        raise HTTPException(status_code=404, detail="房源不存在")

    old_status = db_property.status
    old_remarks = db_property.remarks

    update_dict = vacancy_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(db_property, key, value)

    db_property.handler_id = current_user.id

    remarks_text = f"状态变更: {old_status} -> {vacancy_data.status}"
    if vacancy_data.remarks:
        remarks_text += f"; 备注: {vacancy_data.remarks}"

    log_operation(
        db,
        target_type="property",
        target_id=property_id,
        operation_type="vacancy_update",
        old_value=f"status: {old_status}; remarks: {old_remarks}",
        new_value=f"status: {vacancy_data.status}; remarks: {vacancy_data.remarks}",
        remarks=remarks_text,
        operator=current_user
    )

    db.commit()
    db.refresh(db_property)

    result = schemas.PropertyResponse.model_validate(db_property).model_dump()
    result["handler_name"] = current_user.real_name
    return result


@router.get("/{property_id}/timeline", response_model=List[schemas.OperationLogResponse])
async def get_property_timeline(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_property = db.query(models.Property).filter(models.Property.id == property_id).first()
    if not db_property:
        raise HTTPException(status_code=404, detail="房源不存在")

    property_logs = db.query(models.OperationLog).filter(
        and_(
            models.OperationLog.target_type == "property",
            models.OperationLog.target_id == property_id
        )
    ).all()

    viewing_ids = [v.id for v in db_property.viewings]
    viewing_logs = []
    if viewing_ids:
        viewing_logs = db.query(models.OperationLog).filter(
            and_(
                models.OperationLog.target_type == "viewing",
                models.OperationLog.target_id.in_(viewing_ids)
            )
        ).all()

    exception_ids = [e.id for e in db_property.exceptions]
    exception_logs = []
    if exception_ids:
        exception_logs = db.query(models.OperationLog).filter(
            and_(
                models.OperationLog.target_type == "exception",
                models.OperationLog.target_id.in_(exception_ids)
            )
        ).all()

    all_logs = property_logs + viewing_logs + exception_logs
    all_logs.sort(key=lambda x: x.created_at, reverse=True)

    return all_logs
