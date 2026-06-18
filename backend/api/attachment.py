from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
import os
from backend.database import get_db
from backend.models.attachment import Attachment, AttachmentType
from backend.schemas.attachment import AttachmentResponse

router = APIRouter(prefix="/attachments", tags=["attachments"])

UPLOAD_DIR = "uploads"

@router.post("/")
async def upload_attachment(
    activity_id: int | None = None,
    application_id: int | None = None,
    type: AttachmentType = AttachmentType.OTHER,
    uploaded_by: int | None = None,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    file_path = f"{UPLOAD_DIR}/{file.filename}"
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    
    new_attachment = Attachment(
        activity_id=activity_id,
        application_id=application_id,
        filename=file.filename,
        file_path=file_path,
        type=type,
        uploaded_by=uploaded_by
    )
    db.add(new_attachment)
    db.commit()
    db.refresh(new_attachment)
    return new_attachment

@router.get("/", response_model=list[AttachmentResponse])
def get_attachments(
    activity_id: int | None = None,
    application_id: int | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(Attachment)
    if activity_id:
        query = query.filter(Attachment.activity_id == activity_id)
    if application_id:
        query = query.filter(Attachment.application_id == application_id)
    return query.all()

@router.delete("/{attachment_id}")
def delete_attachment(attachment_id: int, db: Session = Depends(get_db)):
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    
    if attachment.file_path and os.path.exists(attachment.file_path):
        os.remove(attachment.file_path)
    
    db.delete(attachment)
    db.commit()
    return {"message": "Attachment deleted successfully"}