from fastapi import APIRouter, Query
from typing import Optional
from datetime import datetime
import os

from app.database import db
from app.utils import success_response, error_response
from app.constants import (
    ErrorCode, ExportTaskStatus, EXPORT_STATUS_NAMES,
    OrderStatus, ORDER_STATUS_NAMES,
    DeliveryStatus, DELIVERY_STATUS_NAMES,
    UserRole, ROLE_NAMES
)
from app.schemas import CreateExportTaskRequest

router = APIRouter(prefix="/api/export-tasks", tags=["导出任务"])

EXPORT_DIR = "/tmp/conv_store_exports"
os.makedirs(EXPORT_DIR, exist_ok=True)


def _build_export_task(task: dict) -> dict:
    task = task.copy()
    status = ExportTaskStatus(task["status"])
    task["status_name"] = EXPORT_STATUS_NAMES.get(status, "")
    return task


@router.get("")
async def get_export_tasks(
    status: Optional[str] = None,
    creator_id: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
):
    """获取导出任务列表"""
    tasks = db.get_all("export_tasks")
    
    if status:
        tasks = [t for t in tasks if t.get("status") == status]
    if creator_id:
        tasks = [t for t in tasks if t.get("creator_id") == creator_id]
    
    tasks = sorted(tasks, key=lambda x: x.get("created_at", ""), reverse=True)
    
    total = len(tasks)
    start = (page - 1) * page_size
    end = start + page_size
    page_tasks = tasks[start:end]
    
    result = [_build_export_task(t) for t in page_tasks]
    
    return success_response({
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": result
    })


@router.get("/{task_id}")
async def get_export_task_detail(task_id: str):
    """获取导出任务详情"""
    task = db.get_by_id("export_tasks", task_id)
    if not task:
        return error_response(ErrorCode.EXPORT_TASK_NOT_FOUND)
    
    detail = _build_export_task(task)
    return success_response(detail)


@router.post("")
async def create_export_task(request: CreateExportTaskRequest):
    """创建导出任务"""
    operator = db.get_by_id("users", request.operator_id)
    if not operator:
        return error_response(ErrorCode.USER_NOT_FOUND)
    
    task_data = {
        "task_name": request.task_name,
        "task_type": request.task_type,
        "status": ExportTaskStatus.PENDING.value,
        "creator_id": operator["id"],
        "creator_name": operator["name"],
        "filters": request.filters or {},
        "file_url": None
    }
    
    task = db.add("export_tasks", task_data)
    
    _async_process_export(task["id"], request.task_type, request.filters or {})
    
    detail = _build_export_task(task)
    return success_response(detail)


def _async_process_export(task_id: str, task_type: str, filters: dict):
    import threading
    import time
    
    def process():
        time.sleep(1)
        db.update("export_tasks", task_id, {"status": ExportTaskStatus.PROCESSING.value})
        
        try:
            file_url = _generate_export_file(task_id, task_type, filters)
            db.update("export_tasks", task_id, {
                "status": ExportTaskStatus.COMPLETED.value,
                "file_url": file_url
            })
        except Exception as e:
            db.update("export_tasks", task_id, {"status": ExportTaskStatus.FAILED.value})
    
    thread = threading.Thread(target=process)
    thread.start()


def _generate_export_file(task_id: str, task_type: str, filters: dict) -> str:
    import csv
    import openpyxl
    from openpyxl.styles import Font, Alignment
    
    filename = f"export_{task_type}_{task_id}.xlsx"
    filepath = os.path.join(EXPORT_DIR, filename)
    
    wb = openpyxl.Workbook()
    ws = wb.active
    
    if task_type == "store_orders":
        ws.title = "门店订货单"
        headers = ["订单号", "门店名称", "门店编码", "店长", "督导", "状态", "当前处理人", "商品总数", "总金额", "创建时间"]
        ws.append(headers)
        
        orders = db.get_all("store_orders")
        store_id = filters.get("store_id")
        status = filters.get("status")
        if store_id:
            orders = [o for o in orders if o.get("store_id") == store_id]
        if status:
            orders = [o for o in orders if o.get("status") == status]
        
        for order in orders:
            status_enum = OrderStatus(order["status"])
            from app.constants import get_current_handler
            handler = get_current_handler(status_enum)
            ws.append([
                order["order_no"],
                order["store_name"],
                order["store_code"],
                order.get("manager_name", ""),
                order.get("supervisor_name", ""),
                ORDER_STATUS_NAMES.get(status_enum, ""),
                ROLE_NAMES.get(handler, "") if handler else "",
                order["total_quantity"],
                order["total_amount"],
                order["created_at"]
            ])
    
    elif task_type == "deliveries":
        ws.title = "总部配货单"
        headers = ["配货单号", "关联订单号", "门店名称", "状态", "仓库", "商品总数", "总金额", "创建时间", "发货时间"]
        ws.append(headers)
        
        deliveries = db.get_all("deliveries")
        store_id = filters.get("store_id")
        status = filters.get("status")
        if store_id:
            deliveries = [d for d in deliveries if d.get("store_id") == store_id]
        if status:
            deliveries = [d for d in deliveries if d.get("status") == status]
        
        for delivery in deliveries:
            status_enum = DeliveryStatus(delivery["status"])
            ws.append([
                delivery["delivery_no"],
                delivery["order_no"],
                delivery["store_name"],
                DELIVERY_STATUS_NAMES.get(status_enum, ""),
                delivery.get("warehouse", ""),
                delivery["total_quantity"],
                delivery["total_amount"],
                delivery["created_at"],
                delivery.get("shipped_at", "")
            ])
    
    elif task_type == "order_logs":
        ws.title = "操作日志"
        headers = ["订单号", "动作", "操作人", "操作人角色", "备注", "从状态", "到状态", "操作时间"]
        ws.append(headers)
        
        logs = db.get_all("order_logs")
        order_id = filters.get("order_id")
        if order_id:
            logs = [l for l in logs if l.get("order_id") == order_id]
        logs = sorted(logs, key=lambda x: x.get("created_at", ""))
        
        for log in logs:
            from_status = log.get("from_status")
            to_status = log.get("to_status")
            ws.append([
                log["order_id"],
                log["action_name"],
                log["operator_name"],
                log["operator_role_name"],
                log.get("remark", ""),
                ORDER_STATUS_NAMES.get(OrderStatus(from_status), "") if from_status else "",
                ORDER_STATUS_NAMES.get(OrderStatus(to_status), "") if to_status else "",
                log["created_at"]
            ])
    
    for cell in ws[1]:
        cell.font = Font(bold=True)
        cell.alignment = Alignment(horizontal="center")
    
    wb.save(filepath)
    return f"/downloads/{filename}"
