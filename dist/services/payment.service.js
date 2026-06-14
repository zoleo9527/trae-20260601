"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const database_1 = require("../database");
const operationLog_service_1 = require("./operationLog.service");
class PaymentService {
    static validatePaymentRegistration(app, params) {
        const errors = [];
        if (!app) {
            errors.push('申请记录不存在');
            return { valid: false, errors };
        }
        const allowedStatuses = ['PENDING_PAYMENT', 'SUPPLEMENT_NEEDED'];
        if (!allowedStatuses.includes(app.status)) {
            errors.push(`当前状态[${app.status}]不允许进行缴费登记，允许状态: ${allowedStatuses.join(', ')}`);
        }
        if (params.amount <= 0) {
            errors.push('缴费金额必须大于0');
        }
        if (params.amount !== params.feeItems.reduce((sum, item) => sum + item.amount * item.quantity, 0)) {
            errors.push('总金额与费用明细合计不一致');
        }
        if (!params.paymentMethod) {
            errors.push('必须指定支付方式');
        }
        if (app.payment.status === 'REGISTERED' || app.payment.status === 'CONFIRMED') {
            errors.push('该申请已完成缴费登记，无需重复操作');
        }
        return { valid: errors.length === 0, errors };
    }
    static validatePaymentConfirmation(app) {
        const errors = [];
        if (!app) {
            errors.push('申请记录不存在');
            return { valid: false, errors };
        }
        if (app.payment.status !== 'REGISTERED') {
            errors.push(`当前缴费状态[${app.payment.status}]不允许确认，需先完成缴费登记`);
        }
        if (!app.payment.registeredBy || !app.payment.registeredAt) {
            errors.push('缴费登记信息不完整，缺少登记人或登记时间');
        }
        return { valid: errors.length === 0, errors };
    }
    static registerPayment(params, operator) {
        const app = database_1.db.getApplicationById(params.applicationId);
        const validation = this.validatePaymentRegistration(app, params);
        if (!validation.valid) {
            return { error: validation.errors };
        }
        if (!app) {
            return { error: ['申请不存在'] };
        }
        const previousStatus = app.status;
        database_1.db.updatePaymentRecord(app.payment.id, {
            amount: params.amount,
            feeItems: params.feeItems,
            status: 'REGISTERED',
            paymentMethod: params.paymentMethod,
            transactionNo: params.transactionNo,
            registeredBy: operator.id,
            registeredAt: database_1.db.now(),
            remark: params.remark,
        });
        const newStatus = 'PAYMENT_REGISTERED';
        database_1.db.updateApplication(app.id, {
            status: newStatus,
        });
        operationLog_service_1.OperationLogService.logOperation({
            applicationId: app.id,
            operator,
            operation: '提交缴费登记',
            previousStatus,
            newStatus,
            remark: `缴费金额: ¥${params.amount.toFixed(2)}, 支付方式: ${params.paymentMethod}${params.transactionNo ? `, 交易号: ${params.transactionNo}` : ''}`,
        });
        return database_1.db.getApplicationById(app.id);
    }
    static confirmPayment(params, operator) {
        const app = database_1.db.getApplicationById(params.applicationId);
        const validation = this.validatePaymentConfirmation(app);
        if (!validation.valid) {
            return { error: validation.errors };
        }
        if (!app) {
            return { error: ['申请不存在'] };
        }
        const previousStatus = app.status;
        database_1.db.updatePaymentRecord(app.payment.id, {
            status: 'CONFIRMED',
            confirmedBy: operator.id,
            confirmedAt: database_1.db.now(),
        });
        const newStatus = 'PENDING_CERTIFICATE_ARRANGEMENT';
        database_1.db.updateApplication(app.id, {
            status: newStatus,
        });
        operationLog_service_1.OperationLogService.logOperation({
            applicationId: app.id,
            operator,
            operation: '确认缴费',
            previousStatus,
            newStatus,
            remark: `公证员确认缴费有效${params.remark ? `，备注: ${params.remark}` : ''}`,
        });
        return database_1.db.getApplicationById(app.id);
    }
    static getPaymentRecord(applicationId) {
        return database_1.db.getPaymentRecordByApplicationId(applicationId);
    }
    static getApplicationsPendingPayment() {
        return database_1.db.getApplications().filter(app => app.status === 'PENDING_PAYMENT');
    }
    static getApplicationsPendingPaymentConfirmation() {
        return database_1.db.getApplications().filter(app => app.payment.status === 'REGISTERED' && app.status === 'PAYMENT_REGISTERED');
    }
    static getStuckPaymentRecords() {
        return database_1.db.getApplications().filter(app => {
            if (app.payment.status === 'REGISTERED') {
                const registeredAt = app.payment.registeredAt;
                if (registeredAt) {
                    const hoursSinceRegistration = (database_1.db.now().getTime() - registeredAt.getTime()) / (1000 * 60 * 60);
                    return hoursSinceRegistration > 24;
                }
            }
            if (app.status === 'PENDING_PAYMENT') {
                const hoursSinceCreation = (database_1.db.now().getTime() - app.createdAt.getTime()) / (1000 * 60 * 60);
                return hoursSinceCreation > 72;
            }
            return false;
        });
    }
}
exports.PaymentService = PaymentService;
//# sourceMappingURL=payment.service.js.map