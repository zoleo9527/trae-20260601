"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertificateService = void 0;
const database_1 = require("../database");
const operationLog_service_1 = require("./operationLog.service");
class CertificateService {
    static validateCertificateArrangement(app, params) {
        const errors = [];
        if (!app) {
            errors.push('申请记录不存在');
            return { valid: false, errors };
        }
        if (app.status !== 'PENDING_CERTIFICATE_ARRANGEMENT') {
            errors.push(`当前状态[${app.status}]不允许进行出证安排，需先完成缴费确认`);
        }
        if (app.payment.status !== 'CONFIRMED') {
            errors.push(`缴费状态[${app.payment.status}]未确认，无法进行出证安排`);
        }
        if (!params.scheduledPickupDate) {
            errors.push('必须指定预计取件日期');
        }
        if (params.scheduledPickupDate < new Date()) {
            errors.push('预计取件日期不能早于当前日期');
        }
        if (app.certificate.status === 'ARRANGED' || app.certificate.status === 'ISSUED') {
            errors.push('该申请已完成出证安排，无需重复操作');
        }
        return { valid: errors.length === 0, errors };
    }
    static validateCertificateIssuance(app) {
        const errors = [];
        if (!app) {
            errors.push('申请记录不存在');
            return { valid: false, errors };
        }
        if (app.status !== 'CERTIFICATE_ARRANGED') {
            errors.push(`当前状态[${app.status}]不允许发证，需先完成出证安排`);
        }
        if (app.certificate.status !== 'ARRANGED') {
            errors.push(`出证状态[${app.certificate.status}]不允许发证`);
        }
        if (!app.certificate.arrangedBy || !app.certificate.arrangedAt) {
            errors.push('出证安排信息不完整');
        }
        return { valid: errors.length === 0, errors };
    }
    static arrangeCertificate(params, operator) {
        const app = database_1.db.getApplicationById(params.applicationId);
        const validation = this.validateCertificateArrangement(app, params);
        if (!validation.valid) {
            return { error: validation.errors };
        }
        if (!app) {
            return { error: ['申请不存在'] };
        }
        const previousStatus = app.status;
        database_1.db.updateCertificateRecord(app.certificate.id, {
            status: 'ARRANGED',
            certificateNo: params.certificateNo || this.generateCertificateNo(),
            arrangedBy: operator.id,
            arrangedAt: database_1.db.now(),
            scheduledPickupDate: params.scheduledPickupDate,
            remark: params.remark,
        });
        const newStatus = 'CERTIFICATE_ARRANGED';
        database_1.db.updateApplication(app.id, {
            status: newStatus,
        });
        operationLog_service_1.OperationLogService.logOperation({
            applicationId: app.id,
            operator,
            operation: '安排出证',
            previousStatus,
            newStatus,
            remark: `公证书编号: ${params.certificateNo || '自动生成'}, 预计取件日期: ${params.scheduledPickupDate.toLocaleDateString('zh-CN')}`,
        });
        return database_1.db.getApplicationById(app.id);
    }
    static issueCertificate(params, operator) {
        const app = database_1.db.getApplicationById(params.applicationId);
        const validation = this.validateCertificateIssuance(app);
        if (!validation.valid) {
            return { error: validation.errors };
        }
        if (!app) {
            return { error: ['申请不存在'] };
        }
        const previousStatus = app.status;
        database_1.db.updateCertificateRecord(app.certificate.id, {
            status: 'ISSUED',
            issuedBy: operator.id,
            issuedAt: database_1.db.now(),
            pickupBy: params.pickupBy,
            pickupIdNo: params.pickupIdNo,
        });
        const newStatus = 'COMPLETED';
        database_1.db.updateApplication(app.id, {
            status: newStatus,
        });
        operationLog_service_1.OperationLogService.logOperation({
            applicationId: app.id,
            operator,
            operation: '发证完成',
            previousStatus,
            newStatus,
            remark: `取件人: ${params.pickupBy}, 证件号: ${params.pickupIdNo}${params.remark ? `, 备注: ${params.remark}` : ''}`,
        });
        return database_1.db.getApplicationById(app.id);
    }
    static getCertificateRecord(applicationId) {
        return database_1.db.getCertificateRecordByApplicationId(applicationId);
    }
    static getCertificateHistory(applicationId) {
        const logs = operationLog_service_1.OperationLogService.getApplicationLogs(applicationId);
        const certificateLogs = logs.filter(log => log.operation.includes('出证') ||
            log.operation.includes('发证') ||
            log.operation.includes('缴费') ||
            log.newStatus === 'PENDING_CERTIFICATE_ARRANGEMENT' ||
            log.newStatus === 'CERTIFICATE_ARRANGED' ||
            log.newStatus === 'COMPLETED');
        return certificateLogs.map(log => ({
            timestamp: log.timestamp,
            operator: log.operatorName,
            operatorRole: log.operatorRole,
            operation: log.operation,
            statusChange: operationLog_service_1.OperationLogService.formatStatusChange(log.previousStatus, log.newStatus),
            remark: log.remark,
        }));
    }
    static getApplicationsPendingArrangement() {
        return database_1.db.getApplications().filter(app => app.status === 'PENDING_CERTIFICATE_ARRANGEMENT');
    }
    static getApplicationsPendingIssuance() {
        return database_1.db.getApplications().filter(app => app.status === 'CERTIFICATE_ARRANGED');
    }
    static getCompletedApplications() {
        return database_1.db.getApplications().filter(app => app.status === 'COMPLETED');
    }
    static getStuckCertificateRecords() {
        return database_1.db.getApplications().filter(app => {
            if (app.status === 'PENDING_CERTIFICATE_ARRANGEMENT') {
                const paymentConfirmedAt = app.payment.confirmedAt;
                if (paymentConfirmedAt) {
                    const hoursSinceConfirmation = (database_1.db.now().getTime() - paymentConfirmedAt.getTime()) / (1000 * 60 * 60);
                    return hoursSinceConfirmation > 24;
                }
            }
            if (app.status === 'CERTIFICATE_ARRANGED') {
                const arrangedAt = app.certificate.arrangedAt;
                if (arrangedAt) {
                    const hoursSinceArrangement = (database_1.db.now().getTime() - arrangedAt.getTime()) / (1000 * 60 * 60);
                    return hoursSinceArrangement > 72;
                }
            }
            return false;
        });
    }
    static reviewCertificateProcess(applicationId) {
        const app = database_1.db.getApplicationById(applicationId);
        if (!app) {
            return { error: ['申请记录不存在'] };
        }
        const paymentRecord = app.payment;
        const certificateRecord = app.certificate;
        const history = operationLog_service_1.OperationLogService.getApplicationLogs(applicationId);
        const users = database_1.db.getUsers();
        const findUserName = (id) => {
            if (!id)
                return '未指定';
            const user = users.find(u => u.id === id);
            return user ? user.name : '未知用户';
        };
        const responsibilityChain = [
            {
                step: '材料提交',
                handler: app.materials.length > 0 ? findUserName(app.materials[0]?.submittedBy) : '未完成',
                handlerRole: 'WINDOW_STAFF',
                timestamp: app.materials.length > 0 ? app.materials[0]?.submittedAt : app.createdAt,
                isCompleted: app.materials.length > 0,
            },
            {
                step: '缴费登记',
                handler: findUserName(paymentRecord.registeredBy),
                handlerRole: 'WINDOW_STAFF',
                timestamp: paymentRecord.registeredAt || app.createdAt,
                isCompleted: !!paymentRecord.registeredAt,
            },
            {
                step: '缴费确认',
                handler: findUserName(paymentRecord.confirmedBy),
                handlerRole: 'NOTARY',
                timestamp: paymentRecord.confirmedAt || app.createdAt,
                isCompleted: !!paymentRecord.confirmedAt,
            },
            {
                step: '出证安排',
                handler: findUserName(certificateRecord.arrangedBy),
                handlerRole: 'ARCHIVIST',
                timestamp: certificateRecord.arrangedAt || app.createdAt,
                isCompleted: !!certificateRecord.arrangedAt,
            },
            {
                step: '发证完成',
                handler: findUserName(certificateRecord.issuedBy),
                handlerRole: 'ARCHIVIST',
                timestamp: certificateRecord.issuedAt || app.createdAt,
                isCompleted: !!certificateRecord.issuedAt,
            },
        ];
        return {
            application: app,
            payment: {
                registeredBy: paymentRecord.registeredBy,
                registeredAt: paymentRecord.registeredAt,
                confirmedBy: paymentRecord.confirmedBy,
                confirmedAt: paymentRecord.confirmedAt,
            },
            certificate: {
                arrangedBy: certificateRecord.arrangedBy,
                arrangedAt: certificateRecord.arrangedAt,
                issuedBy: certificateRecord.issuedBy,
                issuedAt: certificateRecord.issuedAt,
            },
            history,
            responsibilityChain,
        };
    }
    static generateCertificateNo() {
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        return `GZ-${year}-${random}`;
    }
}
exports.CertificateService = CertificateService;
//# sourceMappingURL=certificate.service.js.map