from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
from app.database import get_db
from app.models import User, UserRole, ExportTask
from app.schemas import ExportTask as ExportTaskSchema, ExportTaskCreate
from app.export_service import ExportService

router = APIRouter(prefix="/exports", tags=["导出任务"])


def get_current_user(db: Session = Depends(get_db)) -> User:
    return User(id=1, username="test", real_name="测试用户", role=UserRole.CLERK)


@router.post("/", response_model=ExportTaskSchema)
def create_export_task(
    task: ExportTaskCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_task = ExportService.create_export_task(db, task, current_user.id)
    background_tasks.add_task(ExportService.execute_export_task, db, db_task.id)
    return db_task


@router.get("/", response_model=List[ExportTaskSchema])
def list_export_tasks(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    created_by_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    return ExportService.get_export_tasks(db, skip, limit, created_by_id)


@router.get("/{task_id}", response_model=ExportTaskSchema)
def get_export_task(task_id: int, db: Session = Depends(get_db)):
    task = ExportService.get_export_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="导出任务不存在")
    return task


@router.get("/{task_id}/download")
def download_export_file(task_id: int, db: Session = Depends(get_db)):
    task = ExportService.get_export_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="导出任务不存在")
    if task.status != "completed":
        raise HTTPException(status_code=400, detail="导出任务尚未完成或已失败")
    if not task.file_path or not os.path.exists(task.file_path):
        raise HTTPException(status_code=404, detail="导出文件不存在")
    return FileResponse(
        task.file_path,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=os.path.basename(task.file_path),
    )


@router.post("/{task_id}/retry")
def retry_export_task(
    task_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = ExportService.get_export_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="导出任务不存在")
    if task.status not in ["failed", "completed"]:
        raise HTTPException(status_code=400, detail="只能重试失败或已完成的任务")

    task.status = "pending"
    task.error_message = None
    db.commit()

    background_tasks.add_task(ExportService.execute_export_task, db, task_id)
    return {"message": "导出任务已重新启动", "task_id": task_id}