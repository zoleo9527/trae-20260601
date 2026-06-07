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
    OrderStatus.DRAFT: ["submit", "edit", "cancel"],
    OrderStatus.SUBMITTED: ["supervisor_approve", "supervisor_reject", "cancel"],
    OrderStatus.SUPERVISOR_APPROVED: ["product_confirm", "product_adjust", "cancel"],
    OrderStatus.PRODUCT_REVIEWED: ["assign_delivery", "cancel"],
    OrderStatus.DELIVERY_ASSIGNED: ["view_deliveries"],
    OrderStatus.PARTIAL_DELIVERED: ["view_deliveries", "assign_delivery"],
    OrderStatus.FULL_DELIVERED: ["view", "view_deliveries"],
    OrderStatus.CANCELLED: ["view"],
}


ACTION_NAMES = {
    "submit": "提交订单",
    "edit": "修改订单",
    "delete": "删除订单",
    "cancel": "取消订单",
    "supervisor_approve": "督导审核通过",
    "supervisor_reject": "督导驳回",
    "product_confirm": "商品确认",
    "product_adjust": "商品调整",
    "assign_delivery": "分配配货",
    "view_deliveries": "查看配货单",
    "view": "查看详情",
    "start_picking": "开始拣货",
    "pack": "打包完成",
    "ship": "发货",
    "receive": "收货确认",
    "confirm": "配货完成确认",
}


DELIVERY_ALLOWED_ACTIONS = {
    DeliveryStatus.PENDING: ["start_picking"],
    DeliveryStatus.PICKING: ["pack", "ship"],
    DeliveryStatus.PACKED: ["ship"],
    DeliveryStatus.SHIPPED: ["receive", "confirm"],
    DeliveryStatus.RECEIVED: ["confirm"],
    DeliveryStatus.CONFIRMED: ["view"],
}


DELIVERY_NEXT_ACTION_GUIDE = {
    DeliveryStatus.PENDING: {
        "action": "start_picking",
        "target_role": UserRole.PRODUCT_SPECIALIST,
        "guide": "仓库开始拣货，核对商品数量"
    },
    DeliveryStatus.PICKING: {
        "action": "pack",
        "target_role": UserRole.PRODUCT_SPECIALIST,
        "guide": "拣货完成后打包，准备发货"
    },
    DeliveryStatus.PACKED: {
        "action": "ship",
        "target_role": UserRole.PRODUCT_SPECIALIST,
        "guide": "商品已打包，安排物流发货"
    },
    DeliveryStatus.SHIPPED: {
        "action": "receive",
        "target_role": UserRole.STORE_MANAGER,
        "guide": "门店收到货后，确认收货"
    },
    DeliveryStatus.RECEIVED: {
        "action": "confirm",
        "target_role": UserRole.PRODUCT_SPECIALIST,
        "guide": "商品专员确认本次配货完成"
    },
    DeliveryStatus.CONFIRMED: {
        "action": "view",
        "target_role": None,
        "guide": "配货已完成，可查看详情"
    },
}


NEXT_ACTION_GUIDE = {
    OrderStatus.DRAFT: {
        "action": "submit",
        "target_role": UserRole.STORE_MANAGER,
        "guide": "店长确认商品无误后，提交订单进入督导审核流程"
    },
    OrderStatus.SUBMITTED: {
        "action": "supervisor_approve",
        "target_role": UserRole.SUPERVISOR,
        "guide": "督导审核订货数量是否合理，通过后进入商品确认环节"
    },
    OrderStatus.SUPERVISOR_APPROVED: {
        "action": "product_confirm",
        "target_role": UserRole.PRODUCT_SPECIALIST,
        "guide": "商品专员确认库存，确认后进入配货分配"
    },
    OrderStatus.PRODUCT_REVIEWED: {
        "action": "assign_delivery",
        "target_role": UserRole.PRODUCT_SPECIALIST,
        "guide": "商品专员创建配货单，安排仓库发货"
    },
    OrderStatus.DELIVERY_ASSIGNED: {
        "action": "view_deliveries",
        "target_role": UserRole.PRODUCT_SPECIALIST,
        "guide": "进入配货单推进拣货、打包、发货流程"
    },
    OrderStatus.PARTIAL_DELIVERED: {
        "action": "assign_delivery",
        "target_role": UserRole.PRODUCT_SPECIALIST,
        "guide": "库存到货后，创建新配货单补发剩余商品"
    },
    OrderStatus.FULL_DELIVERED: {
        "action": "view",
        "target_role": None,
        "guide": "订单已完成，可查看历史配货记录"
    },
    OrderStatus.CANCELLED: {
        "action": "view",
        "target_role": None,
        "guide": "订单已取消，可查看操作历史"
    },
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


def get_delivery_current_handler(delivery_status: DeliveryStatus) -> UserRole:
    handler_map = {
        DeliveryStatus.PENDING: UserRole.PRODUCT_SPECIALIST,
        DeliveryStatus.PICKING: UserRole.PRODUCT_SPECIALIST,
        DeliveryStatus.PACKED: UserRole.PRODUCT_SPECIALIST,
        DeliveryStatus.SHIPPED: UserRole.STORE_MANAGER,
        DeliveryStatus.RECEIVED: UserRole.PRODUCT_SPECIALIST,
        DeliveryStatus.CONFIRMED: None,
    }
    return handler_map.get(delivery_status)
