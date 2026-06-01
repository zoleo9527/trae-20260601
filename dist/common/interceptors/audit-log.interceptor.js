"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const audit_log_service_1 = require("../../modules/audit/audit-log.service");
let AuditLogInterceptor = class AuditLogInterceptor {
    intercept(context, next) {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest();
        const userContext = request.context;
        const method = request.method;
        if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
            return next.handle();
        }
        const action = this.extractAction(request);
        const module = this.extractModule(request);
        const entityId = this.extractEntityId(request);
        const requestBody = { ...request.body };
        if (requestBody.password)
            requestBody.password = '***';
        return next.handle().pipe((0, operators_1.tap)({
            next: (data) => {
                if (audit_log_service_1.AuditLogService.instance) {
                    const responseData = data?.data;
                    const state = responseData?.currentStatus ?? responseData?.status ?? null;
                    audit_log_service_1.AuditLogService.instance.log({
                        module,
                        action,
                        entityId,
                        beforeState: null,
                        afterState: state,
                        remark: `${method} ${request.originalUrl} 成功`,
                        operatorId: userContext?.userId,
                        operatorName: userContext?.userName,
                        operatorRole: userContext?.userRole,
                        storeId: userContext?.storeId,
                        storeName: userContext?.storeName,
                        requestId: userContext?.requestId,
                        success: true,
                        requestData: requestBody,
                        responseData: data,
                    });
                }
            },
            error: (error) => {
                if (audit_log_service_1.AuditLogService.instance) {
                    audit_log_service_1.AuditLogService.instance.log({
                        module,
                        action,
                        entityId,
                        beforeState: null,
                        afterState: null,
                        remark: `${method} ${request.originalUrl} 失败: ${error.message}`,
                        operatorId: userContext?.userId,
                        operatorName: userContext?.userName,
                        operatorRole: userContext?.userRole,
                        storeId: userContext?.storeId,
                        storeName: userContext?.storeName,
                        requestId: userContext?.requestId,
                        success: false,
                        requestData: requestBody,
                        responseData: { error: error.message },
                    });
                }
            },
        }));
    }
    extractModule(request) {
        const path = request.originalUrl;
        if (path.includes('/prescriptions'))
            return 'PRESCRIPTION';
        if (path.includes('/off-shelf'))
            return 'OFF_SHELF';
        if (path.includes('/transfers'))
            return 'TRANSFER';
        if (path.includes('/inventory'))
            return 'INVENTORY';
        if (path.includes('/alerts'))
            return 'ALERT';
        if (path.includes('/audit'))
            return 'AUDIT';
        return 'OTHER';
    }
    extractAction(request) {
        const path = request.originalUrl;
        const method = request.method;
        if (path.includes('/submit'))
            return 'SUBMIT';
        if (path.includes('/approve'))
            return 'APPROVE';
        if (path.includes('/reject'))
            return 'REJECT';
        if (path.includes('/confirm'))
            return 'CONFIRM';
        if (path.includes('/supplement'))
            return 'SUPPLEMENT';
        if (path.includes('/acknowledge'))
            return 'ACKNOWLEDGE';
        if (path.includes('/resolve'))
            return 'RESOLVE';
        if (path.includes('/batch'))
            return 'BATCH_OPERATION';
        if (method === 'POST')
            return 'CREATE';
        if (method === 'PUT')
            return 'UPDATE';
        if (method === 'DELETE')
            return 'DELETE';
        return method;
    }
    extractEntityId(request) {
        const match = request.originalUrl.match(/\/([a-f0-9-]{36})/i);
        return match ? match[1] : null;
    }
};
exports.AuditLogInterceptor = AuditLogInterceptor;
exports.AuditLogInterceptor = AuditLogInterceptor = __decorate([
    (0, common_1.Injectable)()
], AuditLogInterceptor);
//# sourceMappingURL=audit-log.interceptor.js.map