from enum import IntEnum


class ErrorCode(IntEnum):
    UNKNOWN = 1000
    INVALID_PARAMETER = 1001
    NOT_FOUND = 1002
    DUPLICATE = 1003
    STATE_TRANSITION_INVALID = 2001
    PERMISSION_DENIED = 2002
    STATUS_ROLE_DENIED = 2003
    SUBSTITUTION_REASON_REQUIRED = 3001
    DELIVERY_TIMEOUT = 3002
    CARD_TEXT_MISMATCH = 3003
    INSPECTION_NOT_ALLOWED = 3004
    ORDER_ITEMS_REQUIRED = 3005
    ANOMETY_ALREADY_RESOLVED = 3006


ERROR_MESSAGES = {
    ErrorCode.UNKNOWN: "未知错误",
    ErrorCode.INVALID_PARAMETER: "参数无效",
    ErrorCode.NOT_FOUND: "资源不存在",
    ErrorCode.DUPLICATE: "资源已存在",
    ErrorCode.STATE_TRANSITION_INVALID: "订单状态流转不合法",
    ErrorCode.PERMISSION_DENIED: "无操作权限",
    ErrorCode.STATUS_ROLE_DENIED: "当前角色无权变更此订单状态",
    ErrorCode.SUBSTITUTION_REASON_REQUIRED: "花材替换必须填写替换原因",
    ErrorCode.DELIVERY_TIMEOUT: "配送已超时",
    ErrorCode.CARD_TEXT_MISMATCH: "贺卡内容与订单不符",
    ErrorCode.INSPECTION_NOT_ALLOWED: "当前订单状态不允许质检",
    ErrorCode.ORDER_ITEMS_REQUIRED: "订单至少需要一个花材明细",
    ErrorCode.ANOMETY_ALREADY_RESOLVED: "异常记录已处理完结",
}
