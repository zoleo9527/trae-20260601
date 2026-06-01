"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorMessage = exports.ErrorCode = void 0;
var ErrorCode;
(function (ErrorCode) {
    ErrorCode["SUCCESS"] = "0";
    ErrorCode["PRESCRIPTION_NOT_FOUND"] = "PRESCRIPTION_001";
    ErrorCode["PRESCRIPTION_ALREADY_EXISTS"] = "PRESCRIPTION_002";
    ErrorCode["PRESCRIPTION_INVALID_STATE"] = "PRESCRIPTION_003";
    ErrorCode["PRESCRIPTION_INVALID_TRANSITION"] = "PRESCRIPTION_004";
    ErrorCode["PRESCRIPTION_PHARMICIST_REQUIRED"] = "PRESCRIPTION_005";
    ErrorCode["PRESCRIPTION_STAFF_REQUIRED"] = "PRESCRIPTION_006";
    ErrorCode["OFF_SHELF_NOT_FOUND"] = "OFF_SHELF_001";
    ErrorCode["OFF_SHELF_INVALID_STATE"] = "OFF_SHELF_002";
    ErrorCode["OFF_SHELF_INVALID_TRANSITION"] = "OFF_SHELF_003";
    ErrorCode["TRANSFER_NOT_FOUND"] = "TRANSFER_001";
    ErrorCode["TRANSFER_INVALID_STATE"] = "TRANSFER_002";
    ErrorCode["TRANSFER_INVALID_TRANSITION"] = "TRANSFER_003";
    ErrorCode["TRANSFER_MANAGER_REQUIRED"] = "TRANSFER_004";
    ErrorCode["TRANSFER_BATCH_EMPTY"] = "TRANSFER_005";
    ErrorCode["TRANSFER_PARTIAL_FAILED"] = "TRANSFER_006";
    ErrorCode["INVENTORY_NOT_FOUND"] = "INVENTORY_001";
    ErrorCode["INVENTORY_INSUFFICIENT"] = "INVENTORY_002";
    ErrorCode["ALERT_NOT_FOUND"] = "ALERT_001";
    ErrorCode["ALERT_ALREADY_ACKNOWLEDGED"] = "ALERT_002";
    ErrorCode["ALERT_INVALID_TRANSITION"] = "ALERT_003";
    ErrorCode["ALERT_ALREADY_RESOLVED"] = "ALERT_004";
    ErrorCode["IDEMPOTENCY_CONFLICT"] = "COMMON_001";
    ErrorCode["IDEMPOTENCY_KEY_REQUIRED"] = "COMMON_002";
    ErrorCode["INVALID_PARAMETER"] = "COMMON_003";
    ErrorCode["UNAUTHORIZED"] = "COMMON_004";
    ErrorCode["PERMISSION_DENIED"] = "COMMON_005";
    ErrorCode["INTERNAL_ERROR"] = "COMMON_999";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
exports.ErrorMessage = {
    [ErrorCode.SUCCESS]: '操作成功',
    [ErrorCode.PRESCRIPTION_NOT_FOUND]: '处方不存在',
    [ErrorCode.PRESCRIPTION_ALREADY_EXISTS]: '处方已存在',
    [ErrorCode.PRESCRIPTION_INVALID_STATE]: '处方状态无效',
    [ErrorCode.PRESCRIPTION_INVALID_TRANSITION]: '处方状态流转不合法',
    [ErrorCode.PRESCRIPTION_PHARMICIST_REQUIRED]: '需要药师权限',
    [ErrorCode.PRESCRIPTION_STAFF_REQUIRED]: '需要门店店员权限',
    [ErrorCode.OFF_SHELF_NOT_FOUND]: '下架单不存在',
    [ErrorCode.OFF_SHELF_INVALID_STATE]: '下架单状态无效',
    [ErrorCode.OFF_SHELF_INVALID_TRANSITION]: '下架单状态流转不合法',
    [ErrorCode.TRANSFER_NOT_FOUND]: '调拨单不存在',
    [ErrorCode.TRANSFER_INVALID_STATE]: '调拨单状态无效',
    [ErrorCode.TRANSFER_INVALID_TRANSITION]: '调拨单状态流转不合法',
    [ErrorCode.TRANSFER_MANAGER_REQUIRED]: '需要区域经理权限',
    [ErrorCode.TRANSFER_BATCH_EMPTY]: '批量审批列表为空',
    [ErrorCode.TRANSFER_PARTIAL_FAILED]: '部分调拨单审批失败',
    [ErrorCode.INVENTORY_NOT_FOUND]: '库存记录不存在',
    [ErrorCode.INVENTORY_INSUFFICIENT]: '库存不足',
    [ErrorCode.ALERT_NOT_FOUND]: '预警记录不存在',
    [ErrorCode.ALERT_ALREADY_ACKNOWLEDGED]: '预警已确认，无法重复操作',
    [ErrorCode.ALERT_INVALID_TRANSITION]: '预警状态流转不合法',
    [ErrorCode.ALERT_ALREADY_RESOLVED]: '预警已解决，无法重复操作',
    [ErrorCode.IDEMPOTENCY_CONFLICT]: '请求已处理，请使用新的 X-Request-Id',
    [ErrorCode.IDEMPOTENCY_KEY_REQUIRED]: '缺少 X-Request-Id 请求头',
    [ErrorCode.INVALID_PARAMETER]: '参数错误',
    [ErrorCode.UNAUTHORIZED]: '未授权',
    [ErrorCode.PERMISSION_DENIED]: '无操作权限',
    [ErrorCode.INTERNAL_ERROR]: '系统内部错误',
};
//# sourceMappingURL=error-codes.js.map