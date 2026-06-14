"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationService = void 0;
const database_1 = require("../database");
const operationLog_service_1 = require("./operationLog.service");
class ApplicationService {
    static createApplication(params, operator) {
        const applicationNo = this.generateApplicationNo();
        const payment = database_1.db.addPaymentRecord({
            applicationId: '',
            amount: 0,
            feeItems: [],
            status: 'UNPAID',
        });
        const certificate = database_1.db.addCertificateRecord({
            applicationId: '',
            status: 'NOT_ARRANGED',
        });
        const app = database_1.db.addApplication({
            applicationNo,
            applicantName: params.applicantName,
            applicantIdNo: params.applicantIdNo,
            notaryType: params.notaryType,
            appointmentNo: params.appointmentNo,
            status: 'PENDING_MATERIALS',
            materials: [],
            supplementNotices: [],
            payment,
            certificate,
        });
        database_1.db.updatePaymentRecord(payment.id, { applicationId: app.id });
        database_1.db.updateCertificateRecord(certificate.id, { applicationId: app.id });
        operationLog_service_1.OperationLogService.logOperation({
            applicationId: app.id,
            operator,
            operation: '创建公证申请',
            newStatus: 'PENDING_MATERIALS',
            remark: `申请号: ${applicationNo}, 公证类型: ${params.notaryType}${params.appointmentNo ? `, 预约号: ${params.appointmentNo}` : ''}`,
        });
        return app;
    }
    static submitMaterials(params, operator) {
        const app = database_1.db.getApplicationById(params.applicationId);
        if (!app) {
            return { error: ['申请记录不存在'] };
        }
        const allowedStatuses = ['PENDING_MATERIALS', 'SUPPLEMENT_NEEDED'];
        if (!allowedStatuses.includes(app.status)) {
            return { error: [`当前状态[${app.status}]不允许提交材料`] };
        }
        const previousStatus = app.status;
        const newMaterials = [];
        for (const mat of params.materials) {
            const material = database_1.db.addMaterialRecord({
                name: mat.name,
                submittedBy: operator.id,
                submittedAt: database_1.db.now(),
                isOriginal: mat.isOriginal,
                remark: mat.remark,
            });
            newMaterials.push(material);
        }
        const allMaterials = [...app.materials, ...newMaterials];
        const newStatus = 'MATERIALS_SUBMITTED';
        const updatedApp = database_1.db.updateApplication(app.id, {
            status: newStatus,
            materials: allMaterials,
        });
        operationLog_service_1.OperationLogService.logOperation({
            applicationId: app.id,
            operator,
            operation: '提交申请材料',
            previousStatus,
            newStatus,
            remark: `提交材料${newMaterials.length}份: ${newMaterials.map(m => m.name).join(', ')}`,
        });
        return updatedApp;
    }
    static reviewAndSetPayment(params, operator) {
        const app = database_1.db.getApplicationById(params.applicationId);
        if (!app) {
            return { error: ['申请记录不存在'] };
        }
        if (app.status !== 'MATERIALS_SUBMITTED') {
            return { error: [`当前状态[${app.status}]不允许审核`] };
        }
        const previousStatus = app.status;
        const totalAmount = params.feeItems.reduce((sum, item) => sum + item.amount * item.quantity, 0);
        database_1.db.updatePaymentRecord(app.payment.id, {
            amount: totalAmount,
            feeItems: params.feeItems,
            status: 'PENDING_REGISTRATION',
        });
        const newStatus = 'PENDING_PAYMENT';
        database_1.db.updateApplication(app.id, { status: newStatus });
        operationLog_service_1.OperationLogService.logOperation({
            applicationId: app.id,
            operator,
            operation: '审核材料通过，待缴费',
            previousStatus,
            newStatus,
            remark: `应缴费用: ¥${totalAmount.toFixed(2)}, 费用项: ${params.feeItems.map(f => `${f.name}×${f.quantity}`).join(', ')}`,
        });
        return database_1.db.getApplicationById(app.id);
    }
    static issueSupplementNotice(params, operator) {
        const app = database_1.db.getApplicationById(params.applicationId);
        if (!app) {
            return { error: ['申请记录不存在'] };
        }
        const previousStatus = app.status;
        const newStatus = 'SUPPLEMENT_NEEDED';
        const notice = database_1.db.addSupplementNotice({
            applicationId: params.applicationId,
            issuedBy: operator.id,
            issuedAt: database_1.db.now(),
            reason: params.reason,
            requiredMaterials: params.requiredMaterials,
            deadline: params.deadline,
            isCompleted: false,
        });
        const updatedNotices = [...app.supplementNotices, notice];
        database_1.db.updateApplication(app.id, {
            status: newStatus,
            supplementNotices: updatedNotices,
        });
        operationLog_service_1.OperationLogService.logOperation({
            applicationId: app.id,
            operator,
            operation: '发出补正通知',
            previousStatus,
            newStatus,
            remark: `补正原因: ${params.reason}, 需补充: ${params.requiredMaterials.join(', ')}, 截止日期: ${params.deadline.toLocaleDateString('zh-CN')}`,
        });
        return notice;
    }
    static getApplicationById(id) {
        return database_1.db.getApplicationById(id);
    }
    static getApplicationByNo(applicationNo) {
        return database_1.db.getApplicationByNo(applicationNo);
    }
    static getAllApplications() {
        return database_1.db.getApplications();
    }
    static getApplicationsByStatus(status) {
        return database_1.db.getApplications().filter(app => app.status === status);
    }
    static getStuckApplications() {
        return database_1.db.getApplications().filter(app => {
            if (app.status === 'PENDING_MATERIALS') {
                const hours = (database_1.db.now().getTime() - app.createdAt.getTime()) / (1000 * 60 * 60);
                return hours > 120;
            }
            if (app.status === 'SUPPLEMENT_NEEDED') {
                const latestNotice = app.supplementNotices[0];
                if (latestNotice && !latestNotice.isCompleted && latestNotice.deadline < database_1.db.now()) {
                    return true;
                }
            }
            if (app.status === 'MATERIALS_SUBMITTED') {
                const hours = (database_1.db.now().getTime() - app.updatedAt.getTime()) / (1000 * 60 * 60);
                return hours > 48;
            }
            if (app.status === 'PENDING_PAYMENT') {
                const hours = (database_1.db.now().getTime() - app.updatedAt.getTime()) / (1000 * 60 * 60);
                return hours > 72;
            }
            return false;
        });
    }
    static generateApplicationNo() {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `${year}${month}${day}${random}`;
    }
}
exports.ApplicationService = ApplicationService;
//# sourceMappingURL=application.service.js.map