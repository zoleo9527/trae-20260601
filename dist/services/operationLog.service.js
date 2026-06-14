"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationLogService = void 0;
const database_1 = require("../database");
class OperationLogService {
    static logOperation(params) {
        const { applicationId, operator, operation, previousStatus, newStatus, remark } = params;
        return database_1.db.addOperationLog({
            applicationId,
            operatorId: operator.id,
            operatorName: operator.name,
            operatorRole: operator.role,
            operation,
            previousStatus,
            newStatus,
            remark,
        });
    }
    static getApplicationLogs(applicationId) {
        return database_1.db.getLogsByApplicationId(applicationId);
    }
    static formatStatusChange(prev, next) {
        const statusMap = {
            PENDING_MATERIALS: '待提交材料',
            MATERIALS_SUBMITTED: '材料已提交',
            PENDING_PAYMENT: '待缴费',
            PAYMENT_REGISTERED: '缴费已登记',
            PENDING_CERTIFICATE_ARRANGEMENT: '待出证安排',
            CERTIFICATE_ARRANGED: '出证已安排',
            COMPLETED: '已完成',
            REJECTED: '已驳回',
            SUPPLEMENT_NEEDED: '需补正材料',
        };
        const prevLabel = prev ? statusMap[prev] : '无';
        const nextLabel = next ? statusMap[next] : '无';
        return `${prevLabel} → ${nextLabel}`;
    }
}
exports.OperationLogService = OperationLogService;
//# sourceMappingURL=operationLog.service.js.map