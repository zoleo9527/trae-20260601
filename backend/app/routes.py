from fastapi import APIRouter, HTTPException, UploadFile, File
from datetime import datetime
from app.models import *
from app.data.mock_data import users_db, orders_db, alerts_db
from typing import List, Optional

router = APIRouter()

@router.post("/login")
async def login(request: LoginRequest):
    for user in users_db.values():
        if user.phone == request.phone:
            return {"success": True, "user": user.dict()}
    raise HTTPException(status_code=401, detail="用户不存在")

@router.get("/users")
async def get_users(role: Optional[str] = None):
    result = list(users_db.values())
    if role:
        result = [u for u in result if u.role == role]
    return result

@router.get("/users/{user_id}")
async def get_user(user_id: str):
    if user_id in users_db:
        return users_db[user_id]
    raise HTTPException(status_code=404, detail="用户不存在")

@router.get("/orders")
async def get_orders(
    status: Optional[str] = None,
    technician_id: Optional[str] = None,
    dispatcher_id: Optional[str] = None,
    keyword: Optional[str] = None,
    product_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    result = list(orders_db.values())
    
    if status:
        result = [o for o in result if o.status == status]
    if technician_id:
        result = [o for o in result if o.technician_id == technician_id]
    if dispatcher_id:
        result = [o for o in result if o.dispatcher_id == dispatcher_id]
    if keyword:
        keyword = keyword.lower()
        result = [o for o in result if 
                  keyword in o.id.lower() or 
                  keyword in o.customer_name.lower() or 
                  keyword in o.address.lower()]
    if product_type:
        result = [o for o in result if o.product_type == product_type]
    if start_date:
        start_dt = datetime.fromisoformat(start_date)
        result = [o for o in result if o.scheduled_date >= start_dt]
    if end_date:
        end_dt = datetime.fromisoformat(end_date)
        result = [o for o in result if o.scheduled_date <= end_dt]
    
    return sorted(result, key=lambda x: x.updated_at, reverse=True)

@router.get("/orders/{order_id}")
async def get_order(order_id: str):
    if order_id in orders_db:
        return orders_db[order_id]
    raise HTTPException(status_code=404, detail="订单不存在")

@router.post("/orders")
async def create_order(request: OrderCreateRequest, dispatcher_id: str = ""):
    order_id = f"ORD{datetime.now().strftime('%Y%m%d%H%M%S')}"
    order = Order(
        id=order_id,
        customer_name=request.customer_name,
        customer_phone=request.customer_phone,
        address=request.address,
        product_type=request.product_type,
        product_model=request.product_model,
        scheduled_date=request.scheduled_date,
        dispatcher_id=dispatcher_id,
        status="pending",
        progress_trackings=[
            ProgressTracking(
                id=f"PT{datetime.now().strftime('%Y%m%d%H%M%S')}",
                order_id=order_id,
                stage="订单创建",
                status="completed",
                operator_id=dispatcher_id,
                operated_at=datetime.now(),
                notes="订单已创建"
            )
        ],
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    
    default_accessories = {
        "花洒套装": [("花洒头", 1), ("软管", 1), ("生料带", 1)],
        "马桶": [("马桶主体", 1), ("法兰圈", 1), ("螺栓", 2)],
        "浴室柜": [("柜体", 1), ("台面", 1), ("水龙头", 1)],
        "淋浴屏": [("玻璃门", 1), ("导轨", 1), ("密封胶", 1)],
        "浴缸": [("浴缸主体", 1), ("下水器", 1), ("密封胶", 1)],
        "智能马桶盖": [("马桶盖主体", 1), ("安装支架", 1), ("电源线", 1)],
        "洗手盆": [("洗手盆", 1), ("下水器", 1), ("水龙头", 1)],
        "淋浴房": [("玻璃面板", 2), ("铝合金框架", 1), ("密封条", 2)]
    }
    
    if request.product_type in default_accessories:
        for i, (name, quantity) in enumerate(default_accessories[request.product_type], 1):
            order.accessories.append(Accessory(
                id=f"ACC{order_id[-4:]}{str(i).zfill(2)}",
                name=name,
                quantity=quantity
            ))
    
    orders_db[order_id] = order
    return order

@router.put("/orders/{order_id}")
async def update_order(order_id: str, request: OrderUpdateRequest):
    if order_id not in orders_db:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    order = orders_db[order_id]
    
    if request.status:
        order.status = request.status
    if request.technician_id:
        order.technician_id = request.technician_id
    if request.accessories:
        order.accessories = request.accessories
    
    order.updated_at = datetime.now()
    return order

@router.delete("/orders/{order_id}")
async def delete_order(order_id: str):
    if order_id not in orders_db:
        raise HTTPException(status_code=404, detail="订单不存在")
    del orders_db[order_id]
    return {"success": True}

@router.post("/orders/{order_id}/assign")
async def assign_order(order_id: str, technician_id: str, dispatcher_id: str = ""):
    if order_id not in orders_db:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    order = orders_db[order_id]
    if order.status != "pending":
        raise HTTPException(status_code=400, detail="订单状态不允许分配")
    
    order.status = "assigned"
    order.technician_id = technician_id
    order.updated_at = datetime.now()
    
    order.progress_trackings.append(ProgressTracking(
        id=f"PT{datetime.now().strftime('%Y%m%d%H%M%S')}",
        order_id=order_id,
        stage="师傅分配",
        status="completed",
        operator_id=dispatcher_id,
        operated_at=datetime.now(),
        notes=f"分配给{users_db.get(technician_id, User(id='', name='未知', role='', phone='')).name}"
    ))
    
    return order

@router.post("/orders/{order_id}/accept")
async def accept_order(order_id: str, technician_id: str):
    if order_id not in orders_db:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    order = orders_db[order_id]
    if order.status not in ["assigned", "rework_requested"]:
        raise HTTPException(status_code=400, detail="订单状态不允许接单")
    
    order.status = "accepted" if order.status == "assigned" else "rework_in_progress"
    order.technician_id = technician_id
    order.updated_at = datetime.now()
    
    stage = "接单" if order.status == "accepted" else "返工接单"
    order.progress_trackings.append(ProgressTracking(
        id=f"PT{datetime.now().strftime('%Y%m%d%H%M%S')}",
        order_id=order_id,
        stage=stage,
        status="completed",
        operator_id=technician_id,
        operated_at=datetime.now(),
        notes="已接单"
    ))
    
    return order

@router.post("/orders/{order_id}/start")
async def start_order(order_id: str, technician_id: str):
    if order_id not in orders_db:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    order = orders_db[order_id]
    if order.status != "accepted":
        raise HTTPException(status_code=400, detail="订单状态不允许开始")
    
    order.status = "in_progress"
    order.updated_at = datetime.now()
    
    order.progress_trackings.append(ProgressTracking(
        id=f"PT{datetime.now().strftime('%Y%m%d%H%M%S')}",
        order_id=order_id,
        stage="安装中",
        status="in_progress",
        operator_id=technician_id,
        operated_at=datetime.now(),
        notes="开始安装"
    ))
    
    return order

@router.post("/orders/{order_id}/complete")
async def complete_order(order_id: str, technician_id: str, photos: Optional[List[str]] = None):
    if order_id not in orders_db:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    order = orders_db[order_id]
    if order.status not in ["in_progress", "rework_in_progress"]:
        raise HTTPException(status_code=400, detail="订单状态不允许完成")
    
    is_rework = order.status == "rework_in_progress"
    order.status = "completed" if not is_rework else "rework_completed"
    order.updated_at = datetime.now()
    
    if photos:
        for i, photo_url in enumerate(photos):
            photo = InstallationPhoto(
                id=f"PHOTO{datetime.now().strftime('%Y%m%d%H%M%S')}{i}",
                order_id=order_id,
                photo_url=photo_url,
                description=f"{'返工' if is_rework else '安装'}照片{i+1}",
                photo_type="rework" if is_rework else "after",
                uploaded_at=datetime.now(),
                uploaded_by=technician_id
            )
            order.photos.append(photo)
    
    stage = "返工完成" if is_rework else "完成"
    order.progress_trackings.append(ProgressTracking(
        id=f"PT{datetime.now().strftime('%Y%m%d%H%M%S')}",
        order_id=order_id,
        stage=stage,
        status="completed",
        operator_id=technician_id,
        operated_at=datetime.now(),
        notes=f"{'返工' if is_rework else '安装'}完成"
    ))
    
    if is_rework:
        order.status = "liability_pending"
        order.progress_trackings.append(ProgressTracking(
            id=f"PT{datetime.now().strftime('%Y%m%d%H%M%S')}",
            order_id=order_id,
            stage="责任判定",
            status="in_progress",
            operator_id=technician_id,
            operated_at=datetime.now(),
            notes="等待责任判定"
        ))
    
    return order

@router.post("/orders/{order_id}/upload_photo")
async def upload_photo(order_id: str, photo_url: str, description: str, photo_type: str = "after", uploaded_by: str = ""):
    if order_id not in orders_db:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    order = orders_db[order_id]
    
    photo = InstallationPhoto(
        id=f"PHOTO{datetime.now().strftime('%Y%m%d%H%M%S')}",
        order_id=order_id,
        photo_url=photo_url,
        description=description,
        photo_type=photo_type,
        uploaded_at=datetime.now(),
        uploaded_by=uploaded_by
    )
    
    order.photos.append(photo)
    order.updated_at = datetime.now()
    
    return order

@router.post("/orders/{order_id}/mark_accessory")
async def mark_accessory(order_id: str, accessory_id: str, used: bool = False, installed: bool = False):
    if order_id not in orders_db:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    order = orders_db[order_id]
    for acc in order.accessories:
        if acc.id == accessory_id:
            acc.used = used
            acc.installed = installed
            order.updated_at = datetime.now()
            return order
    
    raise HTTPException(status_code=404, detail="配件不存在")

@router.post("/orders/{order_id}/report_leakage")
async def report_leakage(order_id: str, description: str, photos: Optional[List[str]] = None, reported_by: str = ""):
    if order_id not in orders_db:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    order = orders_db[order_id]
    
    record = AfterSalesRecord(
        id=f"ASR{datetime.now().strftime('%Y%m%d%H%M%S')}",
        order_id=order_id,
        type="leakage",
        description=description,
        photos=photos or [],
        reported_at=datetime.now(),
        reported_by=reported_by,
        status="pending"
    )
    
    order.after_sales_records.append(record)
    order.status = "rework_requested"
    order.updated_at = datetime.now()
    
    order.progress_trackings.append(ProgressTracking(
        id=f"PT{datetime.now().strftime('%Y%m%d%H%M%S')}",
        order_id=order_id,
        stage="售后报修",
        status="completed",
        operator_id=reported_by,
        operated_at=datetime.now(),
        notes=f"漏水报修: {description[:30]}..."
    ))
    
    order.progress_trackings.append(ProgressTracking(
        id=f"PT{datetime.now().strftime('%Y%m%d%H%M%S')}",
        order_id=order_id,
        stage="返工申请",
        status="in_progress",
        operator_id=reported_by,
        operated_at=datetime.now(),
        notes="已发起返工申请"
    ))
    
    alert_id = f"ALERT{datetime.now().strftime('%Y%m%d%H%M%S')}"
    alerts_db[alert_id] = Alert(
        id=alert_id,
        type="leakage",
        order_id=order_id,
        message=f"订单 {order_id} 发生漏水报修，需要处理",
        severity="high",
        created_at=datetime.now(),
        is_read=False
    )
    
    if photos:
        for photo_url in photos:
            photo = InstallationPhoto(
                id=f"PHOTO{datetime.now().strftime('%Y%m%d%H%M%S')}",
                order_id=order_id,
                photo_url=photo_url,
                description="漏水现场",
                photo_type="leakage",
                uploaded_at=datetime.now(),
                uploaded_by=reported_by
            )
            order.photos.append(photo)
    
    return order

@router.post("/after_sales/{record_id}/process")
async def process_after_sales(record_id: str, processor_id: str):
    for order in orders_db.values():
        for record in order.after_sales_records:
            if record.id == record_id:
                if record.status != "pending":
                    raise HTTPException(status_code=400, detail="售后记录状态不允许处理")
                record.status = "processing"
                order.status = "rework_in_progress"
                order.updated_at = datetime.now()
                return order
    raise HTTPException(status_code=404, detail="售后记录不存在")

@router.post("/after_sales/{record_id}/reject")
async def reject_after_sales(record_id: str, reason: str, rejected_by: str = ""):
    for order in orders_db.values():
        for record in order.after_sales_records:
            if record.id == record_id:
                if record.status != "pending":
                    raise HTTPException(status_code=400, detail="售后记录状态不允许驳回")
                record.status = "rejected"
                record.rejected_reason = reason
                order.status = "completed"
                order.updated_at = datetime.now()
                
                order.progress_trackings.append(ProgressTracking(
                    id=f"PT{datetime.now().strftime('%Y%m%d%H%M%S')}",
                    order_id=order.id,
                    stage="售后驳回",
                    status="completed",
                    operator_id=rejected_by,
                    operated_at=datetime.now(),
                    notes=f"驳回原因: {reason}"
                ))
                
                return order
    raise HTTPException(status_code=404, detail="售后记录不存在")

@router.post("/orders/{order_id}/judge_responsibility")
async def judge_responsibility(order_id: str, request: ResponsibilityJudgmentRequest, created_by: str = ""):
    if order_id not in orders_db:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    order = orders_db[order_id]
    if order.status not in ["rework_completed", "liability_pending"]:
        raise HTTPException(status_code=400, detail="订单状态不允许责任判定")
    
    result = ResponsibilityResult(
        id=f"RES{datetime.now().strftime('%Y%m%d%H%M%S')}",
        order_id=order_id,
        responsible_party=request.responsible_party,
        reason=request.reason,
        evidence=request.evidence,
        created_at=datetime.now(),
        created_by=created_by,
        status="confirmed",
        compensation_amount=request.compensation_amount
    )
    
    order.responsibility_result = result
    order.status = "liability_done"
    order.updated_at = datetime.now()
    
    order.progress_trackings.append(ProgressTracking(
        id=f"PT{datetime.now().strftime('%Y%m%d%H%M%S')}",
        order_id=order_id,
        stage="责任判定",
        status="completed",
        operator_id=created_by,
        operated_at=datetime.now(),
        notes=f"责任方: {request.responsible_party}, 金额: {request.compensation_amount}"
    ))
    
    if request.compensation_amount > 0:
        order.progress_trackings.append(ProgressTracking(
            id=f"PT{datetime.now().strftime('%Y%m%d%H%M%S')}",
            order_id=order_id,
            stage="已解决",
            status="completed",
            operator_id=created_by,
            operated_at=datetime.now(),
            notes="责任判定完成，等待结算"
        ))
        order.status = "resolved"
    
    return order

@router.post("/responsibility/{result_id}/reject")
async def reject_responsibility(result_id: str, request: RejectLiabilityRequest, rejected_by: str = ""):
    for order in orders_db.values():
        if order.responsibility_result and order.responsibility_result.id == result_id:
            if order.responsibility_result.status != "confirmed":
                raise HTTPException(status_code=400, detail="责任判定状态不允许驳回")
            
            rejection = RejectionRecord(
                id=f"R{datetime.now().strftime('%Y%m%d%H%M%S')}",
                liability_id=result_id,
                order_id=order.id,
                reason=request.reason,
                rejected_by=rejected_by,
                rejected_at=datetime.now(),
                additional_evidence_required=request.additional_evidence_required,
                status="pending"
            )
            
            order.rejection_records.append(rejection)
            order.status = "liability_pending"
            order.updated_at = datetime.now()
            
            order.progress_trackings.append(ProgressTracking(
                id=f"PT{datetime.now().strftime('%Y%m%d%H%M%S')}",
                order_id=order.id,
                stage="责任判定驳回",
                status="completed",
                operator_id=rejected_by,
                operated_at=datetime.now(),
                notes=f"驳回原因: {request.reason}"
            ))
            
            alert_id = f"ALERT{datetime.now().strftime('%Y%m%d%H%M%S')}"
            alerts_db[alert_id] = Alert(
                id=alert_id,
                type="rejection",
                order_id=order.id,
                message=f"订单 {order.id} 的责任判定被驳回，需要补充证据",
                severity="high",
                created_at=datetime.now(),
                is_read=False
            )
            
            return order
    raise HTTPException(status_code=404, detail="责任判定记录不存在")

@router.post("/responsibility/{result_id}/finalize")
async def finalize_responsibility(result_id: str, final_reason: str = ""):
    for order in orders_db.values():
        if order.responsibility_result and order.responsibility_result.id == result_id:
            order.responsibility_result.status = "final"
            if final_reason:
                order.responsibility_result.reason = f"{order.responsibility_result.reason} [最终判定: {final_reason}]"
            order.status = "resolved"
            order.updated_at = datetime.now()
            
            for record in order.after_sales_records:
                if record.status == "processing":
                    record.status = "resolved"
            
            for rejection in order.rejection_records:
                if rejection.status == "pending":
                    rejection.status = "resolved"
            
            order.progress_trackings.append(ProgressTracking(
                id=f"PT{datetime.now().strftime('%Y%m%d%H%M%S')}",
                order_id=order.id,
                stage="最终判定",
                status="completed",
                operator_id=order.responsibility_result.created_by,
                operated_at=datetime.now(),
                notes="责任判定已终审"
            ))
            
            return order
    raise HTTPException(status_code=404, detail="责任判定记录不存在")

@router.post("/orders/{order_id}/ask_question")
async def ask_question(order_id: str, request: AskQuestionRequest, asked_by: str = ""):
    if order_id not in orders_db:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    order = orders_db[order_id]
    
    question = Question(
        id=f"Q{datetime.now().strftime('%Y%m%d%H%M%S')}",
        order_id=order_id,
        question=request.question,
        asked_by=asked_by,
        asked_at=datetime.now()
    )
    
    order.questions.append(question)
    order.updated_at = datetime.now()
    
    return order

@router.post("/questions/{question_id}/answer")
async def answer_question(question_id: str, request: AnswerQuestionRequest, answered_by: str = ""):
    for order in orders_db.values():
        for q in order.questions:
            if q.id == question_id:
                if q.answer is not None:
                    raise HTTPException(status_code=400, detail="问题已回答")
                q.answer = request.answer
                q.answered_by = answered_by
                q.answered_at = datetime.now()
                order.updated_at = datetime.now()
                return order
    raise HTTPException(status_code=404, detail="问题不存在")

@router.get("/alerts")
async def get_alerts(is_read: Optional[bool] = None):
    result = list(alerts_db.values())
    if is_read is not None:
        result = [a for a in result if a.is_read == is_read]
    return sorted(result, key=lambda x: x.created_at, reverse=True)

@router.put("/alerts/{alert_id}/read")
async def mark_alert_read(alert_id: str):
    if alert_id in alerts_db:
        alerts_db[alert_id].is_read = True
        return alerts_db[alert_id]
    raise HTTPException(status_code=404, detail="提醒不存在")

@router.get("/order_statuses")
async def get_order_statuses():
    return [
        {"value": "pending", "label": "待分配"},
        {"value": "assigned", "label": "已分配"},
        {"value": "accepted", "label": "已接单"},
        {"value": "in_progress", "label": "安装中"},
        {"value": "completed", "label": "已完成"},
        {"value": "rework_requested", "label": "待返工"},
        {"value": "rework_in_progress", "label": "返工中"},
        {"value": "rework_completed", "label": "返工完成"},
        {"value": "liability_pending", "label": "待责任判定"},
        {"value": "liability_done", "label": "责任已判定"},
        {"value": "resolved", "label": "已解决"}
    ]

@router.get("/product_types")
async def get_product_types():
    return [
        "花洒套装", "马桶", "浴室柜", "淋浴屏", "浴缸", "智能马桶盖", "洗手盆", "淋浴房"
    ]

@router.get("/role_access")
async def get_role_access():
    return {
        "dispatcher": {
            "routes": ["/dispatch", "/orders", "/history"],
            "permissions": ["create_order", "assign_order", "view_all", "ask_question"]
        },
        "technician": {
            "routes": ["/installer", "/history"],
            "permissions": ["accept_order", "update_status", "upload_photo", "mark_accessory", "answer_question"]
        },
        "customer_service": {
            "routes": ["/service", "/history"],
            "permissions": ["report_leakage", "judge_responsibility", "reject_responsibility", "finalize_responsibility", "answer_question"]
        }
    }