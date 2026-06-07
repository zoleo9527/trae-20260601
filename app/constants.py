from enum import Enum


class ErrorCode(Enum):
    SUCCESS = 0
    PARAM_ERROR = 10001
    ORDER_NOT_FOUND = 20001
    ORDER_STATUS_ERROR = 20002
    STORE_NOT_FOUND = 20003
    DELIVERY_NOT_FOUND = 30001
    DELIVERY_STATUS_ERROR = 30002
    USER_NOT_FOUND = 40001
    PERMISSION_DENIED = 40002
    EXPORT_TASK_NOT_FOUND = 50001
    EXPORT_TASK_FAILED = 50002
    SYSTEM_ERROR = 99999


ERROR_MESSAGES = {
    ErrorCode.SUCCESS: "成功",
    ErrorCode.PARAM_ERROR: "参数错误",
    ErrorCode.ORDER_NOT_FOUND: "订单不存在",
    ErrorCode.ORDER_STATUS_ERROR: "订单状态不允许当前操作",
    ErrorCode.STORE_NOT_FOUND: "门店不存在",
    ErrorCode.DELIVERY_NOT_FOUND: "配货单不存在",
    ErrorCode.DELIVERY_STATUS_ERROR: "配货状态不允许当前操作",
    ErrorCode.USER_NOT_FOUND: "用户不存在",
    ErrorCode.PERMISSION_DENIED: "无操作权限",
    ErrorCode.EXPORT_TASK_NOT_FOUND: "导出任务不存在",
    ErrorCode.EXPORT_TASK_FAILED: "导出任务执行失败",
    ErrorCode.SYSTEM_ERROR: "系统错误",
}


class UserRole(Enum):
    STORE_MANAGER = "store_manager"
    SUPERVISOR = "supervisor"
    PRODUCT_SPECIALIST = "product_specialist"


ROLE_NAMES = {
    UserRole.STORE_MANAGER: "店长",
    UserRole.SUPERVISOR: "督导",
    UserRole.PRODUCT_SPECIALIST: "商品专员",
}


class OrderStatus(Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    SUPERVISOR_APPROVED = "supervisor_approved"
    PRODUCT_REVIEWED = "product_reviewed"
    DELIVERY_ASSIGNED = "delivery_assigned"
    PARTIAL_DELIVERED = "partial_delivered"
    FULL_DELIVERED = "full_delivered"
    CANCELLED = "cancelled"


ORDER_STATUS_NAMES = {
    OrderStatus.DRAFT: "草稿",
    OrderStatus.SUBMITTED: "已提交待督导审核",
    OrderStatus.SUPERVISOR_APPROVED: "督导已审核待商品确认",
    OrderStatus.PRODUCT_REVIEWED: "商品已确认待配货",
    OrderStatus.DELIVERY_ASSIGNED: "已分配配货",
    OrderStatus.PARTIAL_DELIVERED: "部分配货完成",
    OrderStatus.FULL_DELIVERED: "全部配货完成",
    OrderStatus.CANCELLED: "已取消",
}


class DeliveryStatus(Enum):
    PENDING = "pending"
    PICKING = "picking"
    PACKED = "packed"
    SHIPPED = "shipped"
    RECEIVED = "received"
    CONFIRMED = "confirmed"


DELIVERY_STATUS_NAMES = {
    DeliveryStatus.PENDING: "待配货",
    DeliveryStatus.PICKING: "拣货中",
    DeliveryStatus.PACKED: "已打包",
    DeliveryStatus.SHIPPED: "已发货",
    DeliveryStatus.RECEIVED: "门店已收货",
    DeliveryStatus.CONFIRMED: "已确认完成",
}


class ExportTaskStatus(Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


EXPORT_STATUS_NAMES = {
    ExportTaskStatus.PENDING: "等待中",
    ExportTaskStatus.PROCESSING: "处理中",
    ExportTaskStatus.COMPLETED: "已完成",
    ExportTaskStatus.FAILED: "失败",
}


ORDER_ALLOWED_ACTIONS = {
    OrderStatus.DRAFT: ["submit", "edit", "delete"],
    OrderStatus.SUBMITTED: ["supervisor_approve", "supervisor_reject", "cancel"],
    OrderStatus.SUPERVISOR_APPROVED: ["product_confirm", "product_adjust", "cancel"],
    OrderStatus.PRODUCT_REVIEWED: ["assign_delivery"],
    OrderStatus.DELIVERY_ASSIGNED: ["partial_complete", "full_complete"],
    OrderStatus.PARTIAL_DELIVERED: ["full_complete"],
    OrderStatus.FULL_DELIVERED: ["view"],
    OrderStatus.CANCELLED: ["view"],
}


def get_current_handler(order_status: OrderStatus) -> UserRole:
    handler_map = {
        OrderStatus.DRAFT: UserRole.STORE_MANAGER,
        OrderStatus.SUBMITTED: UserRole.SUPERVISOR,
        OrderStatus.SUPERVISOR_APPROVED: UserRole.PRODUCT_SPECIALIST,
        OrderStatus.PRODUCT_REVIEWED: UserRole.PRODUCT_SPECIALIST,
        OrderStatus.DELIVERY_ASSIGNED: UserRole.PRODUCT_SPECIALIST,
        OrderStatus.PARTIAL_DELIVERED: UserRole.PRODUCT_SPECIALIST,
        OrderStatus.FULL_DELIVERED: None,
        OrderStatus.CANCELLED: None,
    }
    return handler_map.get(order_status)
