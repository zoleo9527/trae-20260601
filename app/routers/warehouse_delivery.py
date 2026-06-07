from fastapi import APIRouter, Query
from typing import Optional
from datetime import datetime

from app.database import db
from app.utils import success_response, error_response, generate_delivery_no
from app.constants import (
    ErrorCode, OrderStatus, ORDER_STATUS_NAMES,
    DeliveryStatus, DELIVERY_STATUS_NAMES,
    UserRole, ROLE_NAMES, get_current_handler,
    OrderStatus as OrderStatusEnum
)
from app.schemas import CreateDeliveryRequest, DeliveryActionRequest

router = APIRouter(prefix="/api/deliveries", tags=["总部配货"])


def _build_delivery_detail(delivery: dict) -> dict:
    delivery = delivery.copy()
    status = DeliveryStatus(delivery["status"])
    delivery["status_name"] = DELIVERY_STATUS_NAMES.get(status, "")
    
    order = db.get_by_id("store_orders", delivery["order_id"])
    if order:
        o = order.copy()
        order_status = OrderStatus(o["status"])
        o["status_name"] = ORDER_STATUS_NAMES.get(order_status, "")
        handler = get_current_handler(order_status)
        o["current_handler"] = handler.value if handler else None
        o["current_handler_name"] = ROLE_NAMES.get(handler, "") if handler else ""
        delivery["order"] = o
    
    logs = db.query("order_logs", {"order_id": delivery["order_id"]})
    logs = sorted(logs, key=lambda x: x.get("created_at", ""))
    delivery["logs"] = logs
    
    return delivery


@router.get("")
async def get_deliveries(
    store_id: Optional[str] = None,
    order_id: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
):
    """获取配货单列表"""
    deliveries = db.get_all("deliveries")
    
    if store_id:
        deliveries = [d for d in deliveries if d.get("store_id") == store_id]
    if order_id:
        deliveries = [d for d in deliveries if d.get("order_id") == order_id]
    if status:
        deliveries = [d for d in deliveries if d.get("status") == status]
    
    deliveries = sorted(deliveries, key=lambda x: x.get("created_at", ""), reverse=True)
    
    total = len(deliveries)
    start = (page - 1) * page_size
    end = start + page_size
    page_deliveries = deliveries[start:end]
    
    result = []
    for d in page_deliveries:
        item = d.copy()
        status_enum = DeliveryStatus(item["status"])
        item["status_name"] = DELIVERY_STATUS_NAMES.get(status_enum, "")
        result.append(item)
    
    return success_response({
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": result
    })


@router.get("/{delivery_id}")
async def get_delivery_detail(delivery_id: str):
    """获取配货单详情"""
    delivery = db.get_by_id("deliveries", delivery_id)
    if not delivery:
        return error_response(ErrorCode.DELIVERY_NOT_FOUND)
    
    detail = _build_delivery_detail(delivery)
    return success_response(detail)


@router.post("")
async def create_delivery(request: CreateDeliveryRequest):
    """创建配货单，商品专员分配配货"""
    order = db.get_by_id("store_orders", request.order_id)
    if not order:
        return error_response(ErrorCode.ORDER_NOT_FOUND)
    
    if order["status"] not in [
        OrderStatus.PRODUCT_REVIEWED.value,
        OrderStatus.PARTIAL_DELIVERED.value
    ]:
        if order["status"] == OrderStatus.PRODUCT_REVIEWED.value:
            pass
        else:
            return error_response(ErrorCode.ORDER_STATUS_ERROR, "当前订单状态不允许分配配货")
    
    operator = db.get_by_id("users", request.operator_id)
    if not operator:
        return error_response(ErrorCode.USER_NOT_FOUND)
    
    if operator["role"] != UserRole.PRODUCT_SPECIALIST.value:
        return error_response(ErrorCode.PERMISSION_DENIED, "仅商品专员可分配配货")
    
    items = []
    total_quantity = 0
    total_amount = 0
    
    order_items_map = {}
    for oi in order["items"]:
        order_items_map[oi["product_id"]] = oi
    
    for item_data in request.items:
        product = db.get_by_id("products", item_data["product_id"])
        if not product:
            continue
        qty = int(item_data.get("quantity", 0))
        unit_price = product["price"]
        amount = qty * unit_price
        total_quantity += qty
        total_amount += amount
        
        oi = order_items_map.get(product["id"], {})
        items.append({
            "product_id": product["id"],
            "product_name": product["name"],
            "sku": product["sku"],
            "quantity": qty,
            "unit_price": unit_price
        })
    
    if not items:
        return error_response(ErrorCode.PARAM_ERROR, "配货项不能为空")
    
    delivery_no = generate_delivery_no()
    
    delivery_data = {
        "delivery_no": delivery_no,
        "order_id": order["id"],
        "order_no": order["order_no"],
        "store_id": order["store_id"],
        "store_name": order["store_name"],
        "status": DeliveryStatus.PENDING.value,
        "items": items,
        "total_quantity": total_quantity,
        "total_amount": round(total_amount, 2),
        "operator_id": operator["id"],
        "operator_name": operator["name"],
        "warehouse": request.warehouse or "中心仓"
    }
    
    delivery = db.add("deliveries", delivery_data)
    
    order_items = order["items"]
    for item in order_items:
        for d_item in items:
            if item["product_id"] == d_item["product_id"]:
                current_delivered = item.get("delivered_quantity", 0) or 0
                item["delivered_quantity"] = current_delivered + d_item["quantity"]
    
    all_delivered = True
    for item in order_items:
        confirmed = item.get("confirmed_quantity") or item["quantity"]
        delivered = item.get("delivered_quantity", 0) or 0
        if delivered < confirmed:
            all_delivered = False
            break
    
    new_order_status = OrderStatus.FULL_DELIVERED.value if all_delivered else OrderStatus.PARTIAL_DELIVERED.value
    if order["status"] == OrderStatus.PRODUCT_REVIEWED.value:
        new_order_status = OrderStatus.DELIVERY_ASSIGNED.value
    
    db.update("store_orders", order["id"], {
        "status": new_order_status,
        "items": order_items
    })
    
    from app.routers.store_order import _add_log
    _add_log(
        order_id=order["id"],
        action="assign_delivery",
        action_name="分配配货",
        operator=operator,
        from_status=OrderStatus(order["status"]),
        to_status=OrderStatus(new_order_status),
        remark=f"创建配货单 {delivery_no}，共 {total_quantity} 件商品"
    )
    
    detail = _build_delivery_detail(delivery)
    return success_response(detail)


@router.post("/{delivery_id}/start-picking")
async def start_picking(delivery_id: str, request: DeliveryActionRequest):
    """开始拣货"""
    delivery = db.get_by_id("deliveries", delivery_id)
    if not delivery:
        return error_response(ErrorCode.DELIVERY_NOT_FOUND)
    
    if delivery["status"] != DeliveryStatus.PENDING.value:
        return error_response(ErrorCode.DELIVERY_STATUS_ERROR)
    
    operator = db.get_by_id("users", request.operator_id)
    if not operator:
        return error_response(ErrorCode.USER_NOT_FOUND)
    
    updated = db.update("deliveries", delivery_id, {
        "status": DeliveryStatus.PICKING.value
    })
    
    from app.routers.store_order import _add_log
    _add_log(
        order_id=delivery["order_id"],
        action="picking_start",
        action_name="开始拣货",
        operator=operator,
        remark=request.remark or f"配货单 {delivery['delivery_no']} 开始拣货"
    )
    
    detail = _build_delivery_detail(updated)
    return success_response(detail)


@router.post("/{delivery_id}/pack")
async def pack_delivery(delivery_id: str, request: DeliveryActionRequest):
    """打包完成"""
    delivery = db.get_by_id("deliveries", delivery_id)
    if not delivery:
        return error_response(ErrorCode.DELIVERY_NOT_FOUND)
    
    if delivery["status"] != DeliveryStatus.PICKING.value:
        return error_response(ErrorCode.DELIVERY_STATUS_ERROR)
    
    operator = db.get_by_id("users", request.operator_id)
    if not operator:
        return error_response(ErrorCode.USER_NOT_FOUND)
    
    updated = db.update("deliveries", delivery_id, {
        "status": DeliveryStatus.PACKED.value
    })
    
    from app.routers.store_order import _add_log
    _add_log(
        order_id=delivery["order_id"],
        action="packed",
        action_name="打包完成",
        operator=operator,
        remark=request.remark or f"配货单 {delivery['delivery_no']} 打包完成"
    )
    
    detail = _build_delivery_detail(updated)
    return success_response(detail)


@router.post("/{delivery_id}/ship")
async def ship_delivery(delivery_id: str, request: DeliveryActionRequest):
    """发货"""
    delivery = db.get_by_id("deliveries", delivery_id)
    if not delivery:
        return error_response(ErrorCode.DELIVERY_NOT_FOUND)
    
    if delivery["status"] not in [DeliveryStatus.PICKING.value, DeliveryStatus.PACKED.value]:
        return error_response(ErrorCode.DELIVERY_STATUS_ERROR)
    
    operator = db.get_by_id("users", request.operator_id)
    if not operator:
        return error_response(ErrorCode.USER_NOT_FOUND)
    
    updated = db.update("deliveries", delivery_id, {
        "status": DeliveryStatus.SHIPPED.value,
        "shipped_at": datetime.now().isoformat()
    })
    
    order = db.get_by_id("store_orders", delivery["order_id"])
    if order and order["status"] == OrderStatus.DELIVERY_ASSIGNED.value:
        db.update("store_orders", order["id"], {
            "status": OrderStatus.PARTIAL_DELIVERED.value
        })
    
    from app.routers.store_order import _add_log
    _add_log(
        order_id=delivery["order_id"],
        action="shipped",
        action_name="已发货",
        operator=operator,
        remark=request.remark or f"配货单 {delivery['delivery_no']} 已发货"
    )
    
    detail = _build_delivery_detail(updated)
    return success_response(detail)


@router.post("/{delivery_id}/receive")
async def receive_delivery(delivery_id: str, request: DeliveryActionRequest):
    """门店收货确认"""
    delivery = db.get_by_id("deliveries", delivery_id)
    if not delivery:
        return error_response(ErrorCode.DELIVERY_NOT_FOUND)
    
    if delivery["status"] != DeliveryStatus.SHIPPED.value:
        return error_response(ErrorCode.DELIVERY_STATUS_ERROR)
    
    operator = db.get_by_id("users", request.operator_id)
    if not operator:
        return error_response(ErrorCode.USER_NOT_FOUND)
    
    updated = db.update("deliveries", delivery_id, {
        "status": DeliveryStatus.RECEIVED.value,
        "received_at": datetime.now().isoformat()
    })
    
    from app.routers.store_order import _add_log
    _add_log(
        order_id=delivery["order_id"],
        action="received",
        action_name="门店收货",
        operator=operator,
        remark=request.remark or f"门店已收货，配货单 {delivery['delivery_no']}"
    )
    
    detail = _build_delivery_detail(updated)
    return success_response(detail)


@router.post("/{delivery_id}/confirm")
async def confirm_delivery(delivery_id: str, request: DeliveryActionRequest):
    """配货完成确认（商品专员最终确认）"""
    delivery = db.get_by_id("deliveries", delivery_id)
    if not delivery:
        return error_response(ErrorCode.DELIVERY_NOT_FOUND)
    
    if delivery["status"] not in [DeliveryStatus.RECEIVED.value, DeliveryStatus.SHIPPED.value]:
        return error_response(ErrorCode.DELIVERY_STATUS_ERROR)
    
    operator = db.get_by_id("users", request.operator_id)
    if not operator:
        return error_response(ErrorCode.USER_NOT_FOUND)
    
    if operator["role"] != UserRole.PRODUCT_SPECIALIST.value:
        return error_response(ErrorCode.PERMISSION_DENIED, "仅商品专员可最终确认")
    
    updated = db.update("deliveries", delivery_id, {
        "status": DeliveryStatus.CONFIRMED.value
    })
    
    order = db.get_by_id("store_orders", delivery["order_id"])
    if order:
        order_items = order["items"]
        all_delivered = True
        for item in order_items:
            confirmed = item.get("confirmed_quantity") or item["quantity"]
            delivered = item.get("delivered_quantity", 0) or 0
            if delivered < confirmed:
                all_delivered = False
                break
        
        if all_delivered:
            db.update("store_orders", order["id"], {
                "status": OrderStatus.FULL_DELIVERED.value
            })
    
    from app.routers.store_order import _add_log
    _add_log(
        order_id=delivery["order_id"],
        action="delivery_confirmed",
        action_name="配货完成确认",
        operator=operator,
        remark=request.remark or f"配货单 {delivery['delivery_no']} 已完成"
    )
    
    detail = _build_delivery_detail(updated)
    return success_response(detail)
