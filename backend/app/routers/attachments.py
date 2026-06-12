from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_active_user, log_operation

router = APIRouter(prefix="/api/attachments", tags=["附件管理"])


@router.get("", response_model=dict)
async def get_attachments(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    property_id: Optional[int] = None,
    viewing_id: Optional[int] = None,
    exception_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    query = db.query(models.Attachment)

    if property_id:
        query = query.filter(models.Attachment.property_id == property_id)
    if viewing_id:
        query = query.filter(models.Attachment.viewing_id == viewing_id)
    if exception_id:
        query = query.filter(models.Attachment.exception_id == exception_id)

    total = query.count()
    items = query.order_by(models.Attachment.created_at.desc()) \
        .offset((page - 1) * page_size) \
        .limit(page_size) \
        .all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": items
    }


@router.post("", response_model=schemas.AttachmentResponse, status_code=status.HTTP_201_CREATED)
async def create_attachment(
    attachment_data: schemas.AttachmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if not any([attachment_data.property_id, attachment_data.viewing_id, attachment_data.exception_id]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="必须指定关联的房源、带看或异常记录"
        )

    db_attachment = models.Attachment(
        **attachment_data.model_dump(),
        uploaded_by=current_user.real_name
    )
    db.add(db_attachment)
    db.flush()

    target_type = None
    target_id = None
    if attachment_data.property_id:
        target_type = "property"
        target_id = attachment_data.property_id
    elif attachment_data.viewing_id:
        target_type = "viewing"
        target_id = attachment_data.viewing_id
    elif attachment_data.exception_id:
        target_type = "exception"
        target_id = attachment_data.exception_id

    log_operation(
        db,
        target_type=target_type,
        target_id=target_id,
        operation_type="add_attachment",
        new_value=f"添加附件: {attachment_data.file_name}",
        operator=current_user
    )

    db.commit()
    db.refresh(db_attachment)
    return db_attachment


@router.post("/upload", response_model=schemas.AttachmentResponse, status_code=status.HTTP_201_CREATED)
async def upload_attachment(
    property_id: Optional[int] = None,
    viewing_id: Optional[int] = None,
    exception_id: Optional[int] = None,
    file: UploadFile = File(...),
    remarks: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if not any([property_id, viewing_id, exception_id]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="必须指定关联的房源、带看或异常记录"
        )

    import os
    os.makedirs("uploads", exist_ok=True)

    file_location = f"uploads/{datetime.utcnow().timestamp()}_{file.filename}"
    with open(file_location, "wb") as f:
        f.write(await file.read())

    file_size = os.path.getsize(file_location)

    db_attachment = models.Attachment(
        property_id=property_id,
        viewing_id=viewing_id,
        exception_id=exception_id,
        file_name=file.filename,
        file_type=file.content_type,
        file_size=file_size,
        file_path=file_location,
        storage_type="local",
        remarks=remarks,
        uploaded_by=current_user.real_name
    )
    db.add(db_attachment)
    db.flush()

    target_type = None
    target_id = None
    if property_id:
        target_type = "property"
        target_id = property_id
    elif viewing_id:
        target_type = "viewing"
        target_id = viewing_id
    elif exception_id:
        target_type = "exception"
        target_id = exception_id

    log_operation(
        db,
        target_type=target_type,
        target_id=target_id,
        operation_type="upload_attachment",
        new_value=f"上传附件: {file.filename} ({file_size} bytes)",
        operator=current_user
    )

    db.commit()
    db.refresh(db_attachment)
    return db_attachment


@router.delete("/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_attachment = db.query(models.Attachment).filter(
        models.Attachment.id == attachment_id
    ).first()
    if not db_attachment:
        raise HTTPException(status_code=404, detail="附件不存在")

    target_type = None
    target_id = None
    if db_attachment.property_id:
        target_type = "property"
        target_id = db_attachment.property_id
    elif db_attachment.viewing_id:
        target_type = "viewing"
        target_id = db_attachment.viewing_id
    elif db_attachment.exception_id:
        target_type = "exception"
        target_id = db_attachment.exception_id

    log_operation(
        db,
        target_type=target_type,
        target_id=target_id,
        operation_type="delete_attachment",
        old_value=f"删除附件: {db_attachment.file_name}",
        operator=current_user
    )

    db.delete(db_attachment)
    db.commit()
    return None
