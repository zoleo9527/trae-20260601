from fastapi import APIRouter, Query
from typing import Optional
from collections import defaultdict

from app.database import db
from app.utils import success_response
from app.constants import (
    OrderStatus, ORDER_STATUS_NAMES,
    DeliveryStatus, DELIVERY_STATUS_NAMES,
    UserRole, ROLE_NAMES,
    get_current_handler, get_delivery_current_handler,
    NEXT_ACTION_GUIDE, DELIVERY_NEXT_ACTION_GUIDE,
    ACTION_NAMES
)

router = APIRouter(prefix="/api/responsibility", tags=["责任看板"])


@router.get("/dashboard")
async def get_responsibility_dashboard(store_id: Optional[str] = None):
    """责任看板：按角色聚合待处理数量、卡点原因与最近单据"""
    
    orders = db.get_all("store_orders")
    deliveries = db.get_all("deliveries")
    
    if store_id:
        orders = [o for o in orders if o.get("store_id") == store_id]
        deliveries = [d for d in deliveries if d.get("store_id") == store_id]
    
    role_stats = {}
    
    for role in [UserRole.STORE_MANAGER, UserRole.SUPERVISOR, UserRole.PRODUCT_SPECIALIST]:
        role_value = role.value
        role_stats[role_value] = {
            "role": role_value,
            "role_name": ROLE_NAMES.get(role, ""),
            "total_pending": 0,
            "order_pending": 0,
            "delivery_pending": 0,
            "blocked_reasons": defaultdict(int),
            "pending_orders": [],
            "pending_deliveries": []
        }
    
    for order in orders:
        status = OrderStatus(order["status"])
        handler = get_current_handler(status)
        if not handler:
            continue
        
        handler_role = handler.value
        if handler_role not in role_stats:
            continue
        
        next_guide = NEXT_ACTION_GUIDE.get(status)
        blocked_reason = _get_order_blocked_reason(status)
        
        role_stats[handler_role]["order_pending"] += 1
        role_stats[handler_role]["total_pending"] += 1
        role_stats[handler_role]["blocked_reasons"][blocked_reason] += 1
        
        order_summary = {
            "id": order["id"],
            "order_no": order["order_no"],
            "store_id": order["store_id"],
            "store_name": order["store_name"],
            "status": order["status"],
            "status_name": ORDER_STATUS_NAMES.get(status, ""),
            "blocked_reason": blocked_reason,
            "next_action": _build_next_action(next_guide),
            "total_quantity": order.get("total_quantity", 0),
            "total_amount": order.get("total_amount", 0),
            "created_at": order.get("created_at")
        }
        role_stats[handler_role]["pending_orders"].append(order_summary)
    
    for delivery in deliveries:
        status = DeliveryStatus(delivery["status"])
        handler = get_delivery_current_handler(status)
        if not handler:
            continue
        
        handler_role = handler.value
        if handler_role not in role_stats:
            continue
        
        next_guide = DELIVERY_NEXT_ACTION_GUIDE.get(status)
        blocked_reason = _get_delivery_blocked_reason(status)
        
        role_stats[handler_role]["delivery_pending"] += 1
        role_stats[handler_role]["total_pending"] += 1
        role_stats[handler_role]["blocked_reasons"][blocked_reason] += 1
        
        delivery_summary = {
            "id": delivery["id"],
            "delivery_no": delivery["delivery_no"],
            "order_id": delivery.get("order_id"),
            "order_no": delivery.get("order_no"),
            "store_id": delivery.get("store_id"),
            "store_name": delivery.get("store_name"),
            "status": delivery["status"],
            "status_name": DELIVERY_STATUS_NAMES.get(status, ""),
            "blocked_reason": blocked_reason,
            "next_action": _build_next_action(next_guide),
            "total_quantity": delivery.get("total_quantity", 0),
            "total_amount": delivery.get("total_amount", 0),
            "warehouse": delivery.get("warehouse", ""),
            "created_at": delivery.get("created_at")
        }
        role_stats[handler_role]["pending_deliveries"].append(delivery_summary)
    
    result_roles = []
    for role in [UserRole.STORE_MANAGER, UserRole.SUPERVISOR, UserRole.PRODUCT_SPECIALIST]:
        role_data = role_stats[role.value]
        role_data["pending_orders"].sort(key=lambda x: x["created_at"], reverse=True)
        role_data["pending_deliveries"].sort(key=lambda x: x["created_at"], reverse=True)
        role_data["blocked_reasons"] = [
            {"reason": k, "count": v}
            for k, v in sorted(role_data["blocked_reasons"].items(), key=lambda x: -x[1])
        ]
        result_roles.append(role_data)
    
    store_filter_info = None
    if store_id:
        store = db.get_by_id("stores", store_id)
        if store:
            store_filter_info = {
                "store_id": store["id"],
                "store_name": store["name"],
                "store_code": store["code"]
            }
    
    return success_response({
        "store_filter": store_filter_info,
        "total_pending_all": sum(r["total_pending"] for r in result_roles),
        "roles": result_roles
    })


@router.get("/my-todo")
async def get_my_todo(user_id: str, store_id: Optional[str] = None):
    """获取指定用户的待办列表（按用户ID查询角色，返回待处理单据）"""
    
    user = db.get_by_id("users", user_id)
    if not user:
        return success_response({
            "user": None,
            "total_pending": 0,
            "orders": [],
            "deliveries": []
        })
    
    user_role = UserRole(user["role"])
    
    orders = db.get_all("store_orders")
    deliveries = db.get_all("deliveries")
    
    if store_id:
        orders = [o for o in orders if o.get("store_id") == store_id]
        deliveries = [d for d in deliveries if d.get("store_id") == store_id]
    
    pending_orders = []
    for order in orders:
        status = OrderStatus(order["status"])
        handler = get_current_handler(status)
        if handler and handler == user_role:
            next_guide = NEXT_ACTION_GUIDE.get(status)
            pending_orders.append({
                "id": order["id"],
                "order_no": order["order_no"],
                "store_id": order["store_id"],
                "store_name": order["store_name"],
                "status": order["status"],
                "status_name": ORDER_STATUS_NAMES.get(status, ""),
                "blocked_reason": _get_order_blocked_reason(status),
                "next_action": _build_next_action(next_guide),
                "total_quantity": order.get("total_quantity", 0),
                "total_amount": order.get("total_amount", 0),
                "created_at": order.get("created_at")
            })
    
    pending_deliveries = []
    for delivery in deliveries:
        status = DeliveryStatus(delivery["status"])
        handler = get_delivery_current_handler(status)
        if handler and handler == user_role:
            next_guide = DELIVERY_NEXT_ACTION_GUIDE.get(status)
            pending_deliveries.append({
                "id": delivery["id"],
                "delivery_no": delivery["delivery_no"],
                "order_id": delivery.get("order_id"),
                "order_no": delivery.get("order_no"),
                "store_id": delivery.get("store_id"),
                "store_name": delivery.get("store_name"),
                "status": delivery["status"],
                "status_name": DELIVERY_STATUS_NAMES.get(status, ""),
                "blocked_reason": _get_delivery_blocked_reason(status),
                "next_action": _build_next_action(next_guide),
                "total_quantity": delivery.get("total_quantity", 0),
                "total_amount": delivery.get("total_amount", 0),
                "warehouse": delivery.get("warehouse", ""),
                "created_at": delivery.get("created_at")
            })
    
    pending_orders.sort(key=lambda x: x["created_at"], reverse=True)
    pending_deliveries.sort(key=lambda x: x["created_at"], reverse=True)
    
    return success_response({
        "user": {
            "id": user["id"],
            "name": user["name"],
            "role": user["role"],
            "role_name": user["role_name"]
        },
        "total_pending": len(pending_orders) + len(pending_deliveries),
        "order_count": len(pending_orders),
        "delivery_count": len(pending_deliveries),
        "orders": pending_orders,
        "deliveries": pending_deliveries
    })


def _get_order_blocked_reason(status: OrderStatus) -> str:
    reason_map = {
        OrderStatus.DRAFT: "待提交",
        OrderStatus.SUBMITTED: "等待督导审核",
        OrderStatus.SUPERVISOR_APPROVED: "等待商品专员确认库存和价格",
        OrderStatus.PRODUCT_REVIEWED: "等待商品专员分配配货",
        OrderStatus.DELIVERY_ASSIGNED: "等待仓库拣货发货",
        OrderStatus.PARTIAL_DELIVERED: "部分商品已发货，等待剩余商品配货",
    }
    return reason_map.get(status, "")


def _get_delivery_blocked_reason(status: DeliveryStatus) -> str:
    reason_map = {
        DeliveryStatus.PENDING: "等待仓库开始拣货",
        DeliveryStatus.PICKING: "拣货中，等待打包",
        DeliveryStatus.PACKED: "已打包，等待发货",
        DeliveryStatus.SHIPPED: "运输中，等待门店收货",
        DeliveryStatus.RECEIVED: "门店已收货，等待商品专员最终确认",
    }
    return reason_map.get(status, "")


def _build_next_action(next_guide: dict) -> dict:
    if not next_guide:
        return None
    target_role = next_guide.get("target_role")
    return {
        "action": next_guide.get("action"),
        "action_name": ACTION_NAMES.get(next_guide.get("action"), ""),
        "target_role": target_role.value if target_role else None,
        "target_role_name": ROLE_NAMES.get(target_role, "") if target_role else "",
        "guide": next_guide.get("guide", "")
    }
