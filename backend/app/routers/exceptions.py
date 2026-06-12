from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import Optional, List
from datetime import datetime
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_active_user, log_operation

router = APIRouter(prefix="/api/exceptions", tags=["异常管理"])


@router.get("", response_model=dict)
async def get_exceptions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    severity: Optional[str] = None,
    property_id: Optional[int] = None,
    viewing_id: Optional[int] = None,
    exception_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    query = db.query(models.ExceptionRecord)

    if status:
        query = query.filter(models.ExceptionRecord.status == status)
    if severity:
        query = query.filter(models.ExceptionRecord.severity == severity)
    if property_id:
        query = query.filter(models.ExceptionRecord.property_id == property_id)
    if viewing_id:
        query = query.filter(models.ExceptionRecord.viewing_id == viewing_id)
    if exception_type:
        query = query.filter(models.ExceptionRecord.exception_type == exception_type)

    total = query.count()
    items = query.order_by(models.ExceptionRecord.created_at.desc()) \
        .offset((page - 1) * page_size) \
        .limit(page_size) \
        .all()

    result = []
    for item in items:
        item_dict = schemas.ExceptionResponse.model_validate(item).model_dump()
        if item.handler:
            item_dict["handler_name"] = item.handler.real_name
        if item.property:
            item_dict["property_info"] = {
                "id": item.property.id,
                "property_no": item.property.property_no,
                "building": item.property.building,
                "floor": item.property.floor,
                "room_no": item.property.room_no
            }
        if item.viewing:
            item_dict["viewing_info"] = {
                "id": item.viewing.id,
                "customer_name": item.viewing.customer_name,
                "viewing_date": item.viewing.viewing_date,
                "status": item.viewing.status
            }
        result.append(item_dict)

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": result
    }


@router.get("/{exception_id}", response_model=schemas.ExceptionResponse)
async def get_exception(
    exception_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    exception = db.query(models.ExceptionRecord).filter(
        models.ExceptionRecord.id == exception_id
    ).first()
    if not exception:
        raise HTTPException(status_code=404, detail="异常记录不存在")

    result = schemas.ExceptionResponse.model_validate(exception).model_dump()
    if exception.handler:
        result["handler_name"] = exception.handler.real_name
    if exception.property:
        result["property_info"] = {
            "id": exception.property.id,
            "property_no": exception.property.property_no,
            "building": exception.property.building,
            "floor": exception.property.floor,
            "room_no": exception.property.room_no
        }
    if exception.viewing:
        result["viewing_info"] = {
            "id": exception.viewing.id,
            "customer_name": exception.viewing.customer_name,
            "viewing_date": exception.viewing.viewing_date,
            "status": exception.viewing.status
        }
    return result


@router.post("", response_model=schemas.ExceptionResponse, status_code=status.HTTP_201_CREATED)
async def create_exception(
    exception_data: schemas.ExceptionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if exception_data.property_id:
        db_property = db.query(models.Property).filter(
            models.Property.id == exception_data.property_id
        ).first()
        if not db_property:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="房源不存在"
            )

    if exception_data.viewing_id:
        db_viewing = db.query(models.Viewing).filter(
            models.Viewing.id == exception_data.viewing_id
        ).first()
        if not db_viewing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="带看记录不存在"
            )

    db_exception = models.ExceptionRecord(
        **exception_data.model_dump(),
        handler_id=current_user.id
    )
    db.add(db_exception)
    db.flush()

    related_info = ""
    if exception_data.property_id:
        related_info += f"房源ID: {exception_data.property_id}"
    if exception_data.viewing_id:
        related_info += f" 带看ID: {exception_data.viewing_id}"

    log_operation(
        db,
        target_type="exception",
        target_id=db_exception.id,
        operation_type="create",
        new_value=f"创建异常: {exception_data.exception_type} - {exception_data.title} ({related_info})",
        remarks=exception_data.remarks,
        operator=current_user
    )

    db.commit()
    db.refresh(db_exception)

    result = schemas.ExceptionResponse.model_validate(db_exception).model_dump()
    result["handler_name"] = current_user.real_name
    if db_exception.property:
        result["property_info"] = {
            "id": db_exception.property.id,
            "property_no": db_exception.property.property_no,
            "building": db_exception.property.building,
            "floor": db_exception.property.floor,
            "room_no": db_exception.property.room_no
        }
    if db_exception.viewing:
        result["viewing_info"] = {
            "id": db_exception.viewing.id,
            "customer_name": db_exception.viewing.customer_name,
            "viewing_date": db_exception.viewing.viewing_date,
            "status": db_exception.viewing.status
        }
    return result


@router.put("/{exception_id}", response_model=schemas.ExceptionResponse)
async def update_exception(
    exception_id: int,
    update_data: schemas.ExceptionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_exception = db.query(models.ExceptionRecord).filter(
        models.ExceptionRecord.id == exception_id
    ).first()
    if not db_exception:
        raise HTTPException(status_code=404, detail="异常记录不存在")

    update_dict = update_data.model_dump(exclude_unset=True)

    if update_data.property_id is not None and "property_id" in update_dict:
        db_property = db.query(models.Property).filter(
            models.Property.id == update_data.property_id
        ).first()
        if not db_property:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="关联房源不存在"
            )

    if update_data.viewing_id is not None and "viewing_id" in update_dict:
        db_viewing = db.query(models.Viewing).filter(
            models.Viewing.id == update_data.viewing_id
        ).first()
        if not db_viewing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="关联带看记录不存在"
            )

    old_status = db_exception.status
    old_values = []
    new_values = []

    for key, value in update_dict.items():
        old_val = getattr(db_exception, key)
        if old_val != value:
            old_values.append(f"{key}: {old_val}")
            new_values.append(f"{key}: {value}")
            setattr(db_exception, key, value)

    db_exception.handler_id = current_user.id

    op_type = "update"
    remarks_parts = []

    if "status" in update_dict and old_status != update_dict["status"]:
        op_type = "status_update"
        remarks_parts.append(f"状态变更: {old_status} -> {update_dict['status']}")
        if update_dict["status"] == "resolved":
            db_exception.resolved_at = datetime.utcnow()
            solution = update_dict.get("solution")
            if solution:
                remarks_parts.append(f"解决方案: {solution}")

    if "remarks" in update_dict and update_dict["remarks"]:
        remarks_parts.append(f"备注: {update_dict['remarks']}")

    log_operation(
        db,
        target_type="exception",
        target_id=exception_id,
        operation_type=op_type,
        old_value="; ".join(old_values) if old_values else None,
        new_value="; ".join(new_values) if new_values else None,
        remarks="; ".join(remarks_parts) if remarks_parts else None,
        operator=current_user
    )

    db.commit()
    db.refresh(db_exception)

    result = schemas.ExceptionResponse.model_validate(db_exception).model_dump()
    if db_exception.handler:
        result["handler_name"] = db_exception.handler.real_name
    if db_exception.property:
        result["property_info"] = {
            "id": db_exception.property.id,
            "property_no": db_exception.property.property_no,
            "building": db_exception.property.building,
            "floor": db_exception.property.floor,
            "room_no": db_exception.property.room_no
        }
    if db_exception.viewing:
        result["viewing_info"] = {
            "id": db_exception.viewing.id,
            "customer_name": db_exception.viewing.customer_name,
            "viewing_date": db_exception.viewing.viewing_date,
            "status": db_exception.viewing.status
        }
    return result


@router.get("/types/list", response_model=List[str])
async def get_exception_types(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    types = db.query(models.ExceptionRecord.exception_type).distinct().all()
    default_types = ["房源问题", "客户问题", "带看问题", "物业问题", "其他"]
    db_types = [t[0] for t in types]
    return list(set(default_types + db_types))


@router.get("/{exception_id}/timeline", response_model=List[schemas.OperationLogResponse])
async def get_exception_timeline(
    exception_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_exception = db.query(models.ExceptionRecord).filter(
        models.ExceptionRecord.id == exception_id
    ).first()
    if not db_exception:
        raise HTTPException(status_code=404, detail="异常记录不存在")

    logs = db.query(models.OperationLog).filter(
        and_(
            models.OperationLog.target_type == "exception",
            models.OperationLog.target_id == exception_id
        )
    ).order_by(models.OperationLog.created_at.desc()).all()

    return logs
