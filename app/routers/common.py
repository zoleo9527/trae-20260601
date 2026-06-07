from fastapi import APIRouter

from app.database import db
from app.utils import success_response, error_response
from app.constants import ErrorCode, ERROR_MESSAGES

router = APIRouter(prefix="/api/common", tags=["公共接口"])


@router.get("/error-codes")
async def get_error_codes():
    """获取所有错误码定义"""
    error_list = []
    for code in ErrorCode:
        error_list.append({
            "code": code.value,
            "name": code.name,
            "message": ERROR_MESSAGES.get(code, "")
        })
    return success_response({
        "total": len(error_list),
        "items": error_list
    })


@router.get("/users")
async def get_users(role: str = None):
    """获取用户列表，可按角色筛选"""
    users = db.get_all("users")
    if role:
        users = [u for u in users if u.get("role") == role]
    return success_response({
        "total": len(users),
        "items": users
    })


@router.get("/users/{user_id}")
async def get_user(user_id: str):
    """获取用户详情"""
    user = db.get_by_id("users", user_id)
    if not user:
        return error_response(ErrorCode.USER_NOT_FOUND)
    return success_response(user)


@router.get("/stores")
async def get_stores():
    """获取门店列表"""
    stores = db.get_all("stores")
    return success_response({
        "total": len(stores),
        "items": stores
    })


@router.get("/stores/{store_id}")
async def get_store(store_id: str):
    """获取门店详情"""
    store = db.get_by_id("stores", store_id)
    if not store:
        return error_response(ErrorCode.STORE_NOT_FOUND)
    return success_response(store)


@router.get("/products")
async def get_products(category: str = None):
    """获取商品列表"""
    products = db.get_all("products")
    if category:
        products = [p for p in products if p.get("category") == category]
    return success_response({
        "total": len(products),
        "items": products
    })


@router.get("/order-status")
async def get_order_status_list():
    """获取订单所有状态定义"""
    from app.constants import (
        OrderStatus, ORDER_STATUS_NAMES, ORDER_ALLOWED_ACTIONS, 
        get_current_handler, ROLE_NAMES, ACTION_NAMES, NEXT_ACTION_GUIDE
    )
    status_list = []
    for status in OrderStatus:
        handler = get_current_handler(status)
        allowed_actions = ORDER_ALLOWED_ACTIONS.get(status, [])
        next_guide = NEXT_ACTION_GUIDE.get(status)
        status_list.append({
            "status": status.value,
            "status_name": ORDER_STATUS_NAMES.get(status, ""),
            "allowed_actions": allowed_actions,
            "allowed_actions_detail": [
                {"code": code, "name": ACTION_NAMES.get(code, code)}
                for code in allowed_actions
            ],
            "current_handler": handler.value if handler else None,
            "current_handler_name": ROLE_NAMES.get(handler, "") if handler else "",
            "next_action": {
                "action": next_guide.get("action"),
                "action_name": ACTION_NAMES.get(next_guide.get("action"), ""),
                "guide": next_guide.get("guide", "")
            } if next_guide else None
        })
    return success_response({
        "total": len(status_list),
        "items": status_list
    })


@router.get("/delivery-status")
async def get_delivery_status_list():
    """获取配货所有状态定义"""
    from app.constants import (
        DeliveryStatus, DELIVERY_STATUS_NAMES, 
        DELIVERY_ALLOWED_ACTIONS, DELIVERY_NEXT_ACTION_GUIDE,
        ACTION_NAMES, ROLE_NAMES, get_delivery_current_handler
    )
    status_list = []
    for status in DeliveryStatus:
        allowed_actions = DELIVERY_ALLOWED_ACTIONS.get(status, [])
        next_guide = DELIVERY_NEXT_ACTION_GUIDE.get(status)
        handler = get_delivery_current_handler(status)
        status_list.append({
            "status": status.value,
            "status_name": DELIVERY_STATUS_NAMES.get(status, ""),
            "allowed_actions": allowed_actions,
            "allowed_actions_detail": [
                {"code": code, "name": ACTION_NAMES.get(code, code)}
                for code in allowed_actions
            ],
            "current_handler": handler.value if handler else None,
            "current_handler_name": ROLE_NAMES.get(handler, "") if handler else "",
            "next_action": {
                "action": next_guide.get("action"),
                "action_name": ACTION_NAMES.get(next_guide.get("action"), ""),
                "target_role": next_guide.get("target_role").value if next_guide and next_guide.get("target_role") else None,
                "target_role_name": ROLE_NAMES.get(next_guide.get("target_role"), "") if next_guide and next_guide.get("target_role") else "",
                "guide": next_guide.get("guide", "")
            } if next_guide else None
        })
    return success_response({
        "total": len(status_list),
        "items": status_list
    })
