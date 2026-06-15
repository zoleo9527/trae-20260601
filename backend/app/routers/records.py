from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, date
from pydantic import BaseModel
from typing import Optional, List
from ..database import get_db
from ..models import RepairOrder, RepairRecord, SparePartIssue, SparePart, Notification, ShiftHandOver

router = APIRouter()

class NotificationCreate(BaseModel):
    user_id: str
    title: str
    content: str
    type: str

class BatchUpdateRequest(BaseModel):
    order_ids: List[int]
    status: str
    technician: str

class ShiftHandOverCreate(BaseModel):
    shift: str
    off_duty_user: str
    on_duty_user: str
    summary: Optional[str] = None
    pending_orders: Optional[int] = 0
    completed_orders: Optional[int] = 0

@router.get("/orders")
async def get_all_records(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    status: Optional[str] = None,
    technician: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(RepairOrder)
    
    if date_from:
        query = query.filter(RepairOrder.created_at >= datetime.strptime(date_from, "%Y-%m-%d"))
    if date_to:
        query = query.filter(RepairOrder.created_at <= datetime.strptime(date_to, "%Y-%m-%d"))
    if status:
        query = query.filter(RepairOrder.status == status)
    if technician:
        query = query.filter(RepairOrder.assigned_to == technician)
    
    return query.order_by(RepairOrder.created_at.desc()).all()

@router.get("/daily_summary/{date}")
async def get_daily_summary(date: str, db: Session = Depends(get_db)):
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
    except:
        raise HTTPException(status_code=400, detail="日期格式错误，应为YYYY-MM-DD")
    
    start = datetime.combine(target_date, datetime.min.time())
    end = datetime.combine(target_date, datetime.max.time())
    
    orders = db.query(RepairOrder).filter(
        RepairOrder.created_at >= start,
        RepairOrder.created_at <= end
    ).all()
    
    completed = [o for o in orders if o.status == "completed"]
    pending = [o for o in orders if o.status == "pending"]
    processing = [o for o in orders if o.status == "processing"]
    
    issues = db.query(SparePartIssue).filter(
        SparePartIssue.issued_at >= start,
        SparePartIssue.issued_at <= end
    ).all()
    
    total_parts_value = 0.0
    for issue in issues:
        if issue.spare_part:
            total_parts_value += issue.quantity * issue.spare_part.unit_price
    
    return {
        "date": date,
        "total_orders": len(orders),
        "completed": len(completed),
        "pending": len(pending),
        "processing": len(processing),
        "parts_issued": len(issues),
        "parts_value": round(total_parts_value, 2)
    }

@router.get("/shift_report/{shift}")
async def get_shift_report(shift: str, db: Session = Depends(get_db)):
    today = date.today()
    
    if shift == "morning":
        start = datetime(today.year, today.month, today.day, 8, 0, 0)
        end = datetime(today.year, today.month, today.day, 12, 0, 0)
    elif shift == "afternoon":
        start = datetime(today.year, today.month, today.day, 12, 0, 0)
        end = datetime(today.year, today.month, today.day, 18, 0, 0)
    elif shift == "evening":
        start = datetime(today.year, today.month, today.day, 18, 0, 0)
        end = datetime(today.year, today.month, today.day, 22, 0, 0)
    else:
        raise HTTPException(status_code=400, detail="班次参数错误，应为morning/afternoon/evening")
    
    orders = db.query(RepairOrder).filter(
        RepairOrder.created_at >= start,
        RepairOrder.created_at <= end
    ).all()
    
    issues = db.query(SparePartIssue).filter(
        SparePartIssue.issued_at >= start,
        SparePartIssue.issued_at <= end
    ).all()
    
    completed = [o for o in orders if o.status == "completed"]
    in_progress = [o for o in orders if o.status in ["processing", "pending"]]
    
    return {
        "shift": shift,
        "start_time": start.strftime("%Y-%m-%d %H:%M"),
        "end_time": end.strftime("%Y-%m-%d %H:%M"),
        "total_orders": len(orders),
        "completed": len(completed),
        "in_progress": len(in_progress),
        "parts_issued": len(issues),
        "orders": orders
    }

@router.post("/batch/update_status")
async def batch_update_status(request: BatchUpdateRequest, db: Session = Depends(get_db)):
    updated_count = 0
    updated_orders = []
    
    for order_id in request.order_ids:
        order = db.query(RepairOrder).filter(RepairOrder.id == order_id).first()
        if order:
            old_status = order.status
            order.status = request.status
            if request.technician:
                order.assigned_to = request.technician
            
            status_text = {
                "pending": "待处理",
                "processing": "维修中", 
                "completed": "已完成",
                "cancelled": "已取消"
            }.get(request.status, request.status)
            
            description = f"批量操作: 状态从【{old_status}】更新为【{status_text}】"
            if request.technician:
                description += f"，分配维修师: {request.technician}"
            
            record = RepairRecord(
                order_id=order_id,
                status=request.status,
                description=description,
                technician=request.technician
            )
            db.add(record)
            updated_orders.append({
                "id": order.id,
                "order_no": order.order_no,
                "old_status": old_status,
                "new_status": request.status
            })
            updated_count += 1
    
    db.commit()
    return {
        "updated_count": updated_count,
        "updated_orders": updated_orders,
        "message": f"成功更新 {updated_count} 个工单"
    }

@router.post("/shift_handover")
async def create_shift_handover(request: ShiftHandOverCreate, db: Session = Depends(get_db)):
    handover = ShiftHandOver(
        shift=request.shift,
        off_duty_user=request.off_duty_user,
        on_duty_user=request.on_duty_user,
        summary=request.summary,
        pending_orders=request.pending_orders,
        completed_orders=request.completed_orders
    )
    db.add(handover)
    db.commit()
    db.refresh(handover)
    return handover

@router.get("/shift_handover")
async def get_shift_handovers(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(ShiftHandOver)
    
    if date_from:
        query = query.filter(ShiftHandOver.created_at >= datetime.strptime(date_from, "%Y-%m-%d"))
    if date_to:
        query = query.filter(ShiftHandOver.created_at <= datetime.strptime(date_to, "%Y-%m-%d"))
    
    return query.order_by(ShiftHandOver.created_at.desc()).all()

@router.get("/shift_handover/{hand_over_id}")
async def get_shift_handover(hand_over_id: int, db: Session = Depends(get_db)):
    handover = db.query(ShiftHandOver).filter(ShiftHandOver.id == hand_over_id).first()
    if not handover:
        raise HTTPException(status_code=404, detail="交班记录不存在")
    return handover

@router.post("/notifications")
async def create_notification(notification: NotificationCreate, db: Session = Depends(get_db)):
    db_notification = Notification(**notification.dict())
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    return db_notification

@router.get("/notifications/{user_id}")
async def get_notifications(user_id: str, unread_only: Optional[bool] = False, db: Session = Depends(get_db)):
    query = db.query(Notification).filter(Notification.user_id == user_id)
    if unread_only:
        query = query.filter(Notification.read == False)
    return query.order_by(Notification.created_at.desc()).all()

@router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: int, db: Session = Depends(get_db)):
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="通知不存在")
    notification.read = True
    db.commit()
    return {"message": "已标记为已读"}

@router.get("/export/{date}")
async def export_records(date: str, db: Session = Depends(get_db)):
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
    except:
        raise HTTPException(status_code=400, detail="日期格式错误，应为YYYY-MM-DD")
    
    start = datetime.combine(target_date, datetime.min.time())
    end = datetime.combine(target_date, datetime.max.time())
    
    orders = db.query(RepairOrder).filter(
        RepairOrder.created_at >= start,
        RepairOrder.created_at <= end
    ).all()
    
    export_data = []
    for order in orders:
        issues = db.query(SparePartIssue).filter(SparePartIssue.order_id == order.id).all()
        parts_info = []
        for issue in issues:
            part = db.query(SparePart).filter(SparePart.id == issue.part_id).first()
            parts_info.append({
                "part_name": part.part_name if part else "",
                "quantity": issue.quantity,
                "issued_by": issue.issued_by,
                "issued_at": issue.issued_at.strftime("%Y-%m-%d %H:%M")
            })
        
        export_data.append({
            "order_no": order.order_no,
            "customer_name": order.customer_name,
            "phone": order.phone,
            "device_model": order.device_model,
            "problem_description": order.problem_description,
            "status": order.status,
            "created_at": order.created_at.strftime("%Y-%m-%d %H:%M"),
            "created_by": order.created_by,
            "assigned_to": order.assigned_to or "",
            "parts": parts_info
        })
    
    return {"date": date, "data": export_data}
