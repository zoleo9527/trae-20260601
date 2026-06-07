from fastapi import APIRouter, Query
from typing import Optional

from app.database import db
from app.utils import success_response, error_response, generate_order_no
from app.constants import (
    ErrorCode, OrderStatus, ORDER_STATUS_NAMES, ORDER_ALLOWED_ACTIONS,
    UserRole, ROLE_NAMES, get_current_handler
)
from app.schemas import (
    CreateStoreOrderRequest, UpdateStoreOrderRequest, OrderActionRequest
)

router = APIRouter(prefix="/api/store-orders", tags=["门店订货"])


def _build_order_detail(order: dict) -> dict:
    from datetime import datetime
    
    order = order.copy()
    status = OrderStatus(order["status"])
    order["status_name"] = ORDER_STATUS_NAMES.get(status, "")
    
    handler = get_current_handler(status)
    order["current_handler"] = handler.value if handler else None
    order["current_handler_name"] = ROLE_NAMES.get(handler, "") if handler else ""
    order["allowed_actions"] = ORDER_ALLOWED_ACTIONS.get(status, [])
    
    logs = db.query("order_logs", {"order_id": order["id"]})
    logs = sorted(logs, key=lambda x: x.get("created_at", ""))
    order["logs"] = logs
    
    blocked_reason = None
    if status == OrderStatus.SUBMITTED:
        blocked_reason = "等待督导审核"
    elif status == OrderStatus.SUPERVISOR_APPROVED:
        blocked_reason = "等待商品专员确认库存和价格"
    elif status == OrderStatus.PRODUCT_REVIEWED:
        blocked_reason = "等待商品专员分配配货"
    elif status == OrderStatus.DELIVERY_ASSIGNED:
        blocked_reason = "等待仓库拣货发货"
    elif status == OrderStatus.PARTIAL_DELIVERED:
        blocked_reason = "部分商品已发货，等待剩余商品配货"
    order["blocked_reason"] = blocked_reason
    
    return order


@router.get("")
async def get_store_orders(
    store_id: Optional[str] = None,
    status: Optional[str] = None,
    current_handler: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
):
    """获取门店订货列表"""
    orders = db.get_all("store_orders")
    
    if store_id:
        orders = [o for o in orders if o.get("store_id") == store_id]
    if status:
        orders = [o for o in orders if o.get("status") == status]
    if current_handler:
        orders = [
            o for o in orders
            if get_current_handler(OrderStatus(o["status"])) and 
            get_current_handler(OrderStatus(o["status"])).value == current_handler
        ]
    
    orders = sorted(orders, key=lambda x: x.get("created_at", ""), reverse=True)
    
    total = len(orders)
    start = (page - 1) * page_size
    end = start + page_size
    page_orders = orders[start:end]
    
    result_orders = []
    for order in page_orders:
        o = order.copy()
        status_enum = OrderStatus(o["status"])
        o["status_name"] = ORDER_STATUS_NAMES.get(status_enum, "")
        handler = get_current_handler(status_enum)
        o["current_handler"] = handler.value if handler else None
        o["current_handler_name"] = ROLE_NAMES.get(handler, "") if handler else ""
        result_orders.append(o)
    
    return success_response({
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": result_orders
    })


@router.get("/{order_id}")
async def get_store_order_detail(order_id: str):
    """获取门店订货详情"""
    order = db.get_by_id("store_orders", order_id)
    if not order:
        return error_response(ErrorCode.ORDER_NOT_FOUND)
    
    detail = _build_order_detail(order)
    return success_response(detail)


@router.post("")
async def create_store_order(request: CreateStoreOrderRequest):
    """创建门店订货单（草稿）"""
    store = db.get_by_id("stores", request.store_id)
    if not store:
        return error_response(ErrorCode.STORE_NOT_FOUND)
    
    operator = db.get_by_id("users", request.operator_id)
    if not operator:
        return error_response(ErrorCode.USER_NOT_FOUND)
    
    items = []
    total_amount = 0
    total_quantity = 0
    
    for item_data in request.items:
        product = db.get_by_id("products", item_data["product_id"])
        if not product:
            continue
        qty = int(item_data.get("quantity", 0))
        unit_price = product["price"]
        amount = qty * unit_price
        total_amount += amount
        total_quantity += qty
        items.append({
            "product_id": product["id"],
            "product_name": product["name"],
            "sku": product["sku"],
            "quantity": qty,
            "unit_price": unit_price,
            "confirmed_quantity": None,
            "delivered_quantity": None
        })
    
    if not items:
        return error_response(ErrorCode.PARAM_ERROR, "订单项不能为空")
    
    order_no = generate_order_no(store["code"])
    
    order_data = {
        "order_no": order_no,
        "store_id": store["id"],
        "store_name": store["name"],
        "store_code": store["code"],
        "manager_id": store.get("manager_id", ""),
        "manager_name": "",
        "supervisor_id": store.get("supervisor_id", ""),
        "supervisor_name": "",
        "product_specialist_id": None,
        "product_specialist_name": None,
        "status": OrderStatus.DRAFT.value,
        "items": items,
        "total_amount": round(total_amount, 2),
        "total_quantity": total_quantity,
        "delivery_address": request.delivery_address or store["address"],
        "expected_delivery_date": request.expected_delivery_date
    }
    
    manager = db.get_by_id("users", store.get("manager_id", ""))
    if manager:
        order_data["manager_name"] = manager["name"]
    supervisor = db.get_by_id("users", store.get("supervisor_id", ""))
    if supervisor:
        order_data["supervisor_name"] = supervisor["name"]
    
    order = db.add("store_orders", order_data)
    
    _add_log(
        order_id=order["id"],
        action="create",
        action_name="创建订单",
        operator=operator,
        remark="创建订货草稿"
    )
    
    return success_response(order)


@router.put("/{order_id}")
async def update_store_order(order_id: str, request: UpdateStoreOrderRequest):
    """修改门店订货单（仅草稿状态）"""
    order = db.get_by_id("store_orders", order_id)
    if not order:
        return error_response(ErrorCode.ORDER_NOT_FOUND)
    
    if order["status"] != OrderStatus.DRAFT.value:
        return error_response(ErrorCode.ORDER_STATUS_ERROR, "仅草稿状态订单可修改")
    
    operator = db.get_by_id("users", request.operator_id)
    if not operator:
        return error_response(ErrorCode.USER_NOT_FOUND)
    
    updates = {}
    
    if request.delivery_address:
        updates["delivery_address"] = request.delivery_address
    if request.expected_delivery_date:
        updates["expected_delivery_date"] = request.expected_delivery_date
    
    if request.items:
        items = []
        total_amount = 0
        total_quantity = 0
        for item_data in request.items:
            product = db.get_by_id("products", item_data["product_id"])
            if not product:
                continue
            qty = int(item_data.get("quantity", 0))
            unit_price = product["price"]
            amount = qty * unit_price
            total_amount += amount
            total_quantity += qty
            items.append({
                "product_id": product["id"],
                "product_name": product["name"],
                "sku": product["sku"],
                "quantity": qty,
                "unit_price": unit_price,
                "confirmed_quantity": None,
                "delivered_quantity": None
            })
        updates["items"] = items
        updates["total_amount"] = round(total_amount, 2)
        updates["total_quantity"] = total_quantity
    
    updated = db.update("store_orders", order_id, updates)
    
    _add_log(
        order_id=order_id,
        action="edit",
        action_name="修改订单",
        operator=operator,
        remark="修改订单内容"
    )
    
    return success_response(updated)


@router.post("/{order_id}/submit")
async def submit_store_order(order_id: str, request: OrderActionRequest):
    """提交订货单，进入督导审核"""
    order = db.get_by_id("store_orders", order_id)
    if not order:
        return error_response(ErrorCode.ORDER_NOT_FOUND)
    
    if order["status"] != OrderStatus.DRAFT.value:
        return error_response(ErrorCode.ORDER_STATUS_ERROR, "仅草稿状态可提交")
    
    operator = db.get_by_id("users", request.operator_id)
    if not operator:
        return error_response(ErrorCode.USER_NOT_FOUND)
    
    updated = db.update("store_orders", order_id, {
        "status": OrderStatus.SUBMITTED.value
    })
    
    _add_log(
        order_id=order_id,
        action="submit",
        action_name="提交订单",
        operator=operator,
        from_status=OrderStatus.DRAFT,
        to_status=OrderStatus.SUBMITTED,
        remark=request.remark or "提交订单等待督导审核"
    )
    
    detail = _build_order_detail(updated)
    return success_response(detail)


@router.post("/{order_id}/supervisor-approve")
async def supervisor_approve_order(order_id: str, request: OrderActionRequest):
    """督导审核通过"""
    order = db.get_by_id("store_orders", order_id)
    if not order:
        return error_response(ErrorCode.ORDER_NOT_FOUND)
    
    if order["status"] != OrderStatus.SUBMITTED.value:
        return error_response(ErrorCode.ORDER_STATUS_ERROR)
    
    operator = db.get_by_id("users", request.operator_id)
    if not operator:
        return error_response(ErrorCode.USER_NOT_FOUND)
    
    if operator["role"] != UserRole.SUPERVISOR.value:
        return error_response(ErrorCode.PERMISSION_DENIED, "仅督导可审核")
    
    updated = db.update("store_orders", order_id, {
        "status": OrderStatus.SUPERVISOR_APPROVED.value
    })
    
    _add_log(
        order_id=order_id,
        action="supervisor_approve",
        action_name="督导审核通过",
        operator=operator,
        from_status=OrderStatus.SUBMITTED,
        to_status=OrderStatus.SUPERVISOR_APPROVED,
        remark=request.remark or "督导审核通过"
    )
    
    detail = _build_order_detail(updated)
    return success_response(detail)


@router.post("/{order_id}/supervisor-reject")
async def supervisor_reject_order(order_id: str, request: OrderActionRequest):
    """督导驳回，返回草稿状态"""
    order = db.get_by_id("store_orders", order_id)
    if not order:
        return error_response(ErrorCode.ORDER_NOT_FOUND)
    
    if order["status"] != OrderStatus.SUBMITTED.value:
        return error_response(ErrorCode.ORDER_STATUS_ERROR)
    
    operator = db.get_by_id("users", request.operator_id)
    if not operator:
        return error_response(ErrorCode.USER_NOT_FOUND)
    
    if operator["role"] != UserRole.SUPERVISOR.value:
        return error_response(ErrorCode.PERMISSION_DENIED, "仅督导可驳回")
    
    updated = db.update("store_orders", order_id, {
        "status": OrderStatus.DRAFT.value
    })
    
    _add_log(
        order_id=order_id,
        action="supervisor_reject",
        action_name="督导驳回",
        operator=operator,
        from_status=OrderStatus.SUBMITTED,
        to_status=OrderStatus.DRAFT,
        remark=request.remark or "督导驳回，请修改后重新提交"
    )
    
    detail = _build_order_detail(updated)
    return success_response(detail)


@router.post("/{order_id}/product-confirm")
async def product_confirm_order(order_id: str, request: OrderActionRequest):
    """商品专员确认订货"""
    order = db.get_by_id("store_orders", order_id)
    if not order:
        return error_response(ErrorCode.ORDER_NOT_FOUND)
    
    if order["status"] not in [OrderStatus.SUPERVISOR_APPROVED.value]:
        return error_response(ErrorCode.ORDER_STATUS_ERROR)
    
    operator = db.get_by_id("users", request.operator_id)
    if not operator:
        return error_response(ErrorCode.USER_NOT_FOUND)
    
    if operator["role"] != UserRole.PRODUCT_SPECIALIST.value:
        return error_response(ErrorCode.PERMISSION_DENIED, "仅商品专员可确认")
    
    items = order["items"]
    for item in items:
        item["confirmed_quantity"] = item["quantity"]
    
    updated = db.update("store_orders", order_id, {
        "status": OrderStatus.PRODUCT_REVIEWED.value,
        "items": items,
        "product_specialist_id": operator["id"],
        "product_specialist_name": operator["name"]
    })
    
    _add_log(
        order_id=order_id,
        action="product_confirm",
        action_name="商品确认",
        operator=operator,
        from_status=OrderStatus.SUPERVISOR_APPROVED,
        to_status=OrderStatus.PRODUCT_REVIEWED,
        remark=request.remark or "商品已确认，等待配货"
    )
    
    detail = _build_order_detail(updated)
    return success_response(detail)


@router.post("/{order_id}/product-adjust")
async def product_adjust_order(order_id: str, request: OrderActionRequest):
    """商品专员调整订货数量"""
    order = db.get_by_id("store_orders", order_id)
    if not order:
        return error_response(ErrorCode.ORDER_NOT_FOUND)
    
    if order["status"] not in [OrderStatus.SUPERVISOR_APPROVED.value]:
        return error_response(ErrorCode.ORDER_STATUS_ERROR)
    
    operator = db.get_by_id("users", request.operator_id)
    if not operator:
        return error_response(ErrorCode.USER_NOT_FOUND)
    
    if operator["role"] != UserRole.PRODUCT_SPECIALIST.value:
        return error_response(ErrorCode.PERMISSION_DENIED, "仅商品专员可调整")
    
    if not request.adjust_items:
        return error_response(ErrorCode.PARAM_ERROR, "缺少调整后的商品列表")
    
    adjust_map = {}
    for adj in request.adjust_items:
        adjust_map[adj["product_id"]] = int(adj.get("confirmed_quantity", 0))
    
    items = order["items"]
    total_quantity = 0
    total_amount = 0
    for item in items:
        confirmed_qty = adjust_map.get(item["product_id"], item["quantity"])
        item["confirmed_quantity"] = confirmed_qty
        total_quantity += confirmed_qty
        total_amount += confirmed_qty * item["unit_price"]
    
    updated = db.update("store_orders", order_id, {
        "status": OrderStatus.PRODUCT_REVIEWED.value,
        "items": items,
        "total_quantity": total_quantity,
        "total_amount": round(total_amount, 2),
        "product_specialist_id": operator["id"],
        "product_specialist_name": operator["name"]
    })
    
    _add_log(
        order_id=order_id,
        action="product_adjust",
        action_name="商品调整",
        operator=operator,
        from_status=OrderStatus.SUPERVISOR_APPROVED,
        to_status=OrderStatus.PRODUCT_REVIEWED,
        remark=request.remark or "已根据库存调整订货数量"
    )
    
    detail = _build_order_detail(updated)
    return success_response(detail)


@router.post("/{order_id}/cancel")
async def cancel_order(order_id: str, request: OrderActionRequest):
    """取消订单"""
    order = db.get_by_id("store_orders", order_id)
    if not order:
        return error_response(ErrorCode.ORDER_NOT_FOUND)
    
    if order["status"] not in [
        OrderStatus.DRAFT.value,
        OrderStatus.SUBMITTED.value,
        OrderStatus.SUPERVISOR_APPROVED.value
    ]:
        return error_response(ErrorCode.ORDER_STATUS_ERROR, "当前状态不允许取消")
    
    operator = db.get_by_id("users", request.operator_id)
    if not operator:
        return error_response(ErrorCode.USER_NOT_FOUND)
    
    from_status = OrderStatus(order["status"])
    updated = db.update("store_orders", order_id, {
        "status": OrderStatus.CANCELLED.value
    })
    
    _add_log(
        order_id=order_id,
        action="cancel",
        action_name="取消订单",
        operator=operator,
        from_status=from_status,
        to_status=OrderStatus.CANCELLED,
        remark=request.remark or "订单已取消"
    )
    
    detail = _build_order_detail(updated)
    return success_response(detail)


def _add_log(
    order_id: str,
    action: str,
    action_name: str,
    operator: dict,
    from_status=None,
    to_status=None,
    remark: str = None
):
    role = UserRole(operator["role"])
    log_data = {
        "order_id": order_id,
        "action": action,
        "action_name": action_name,
        "operator_id": operator["id"],
        "operator_name": operator["name"],
        "operator_role": role.value,
        "operator_role_name": ROLE_NAMES.get(role, ""),
        "from_status": from_status.value if from_status else None,
        "to_status": to_status.value if to_status else None,
        "remark": remark
    }
    db.add("order_logs", log_data)
