"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applicationRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const application_service_1 = require("../services/application.service");
const operationLog_service_1 = require("../services/operationLog.service");
const router = (0, express_1.Router)();
router.post('/', auth_1.authenticate, (0, auth_1.requirePermission)('submit_materials'), (0, auth_1.requireRole)('WINDOW_STAFF'), (req, res) => {
    const result = application_service_1.ApplicationService.createApplication(req.body, req.currentUser);
    res.status(201).json({
        message: '申请创建成功',
        application: result
    });
});
router.post('/:id/materials', auth_1.authenticate, (0, auth_1.requirePermission)('submit_materials'), (0, auth_1.requireRole)('WINDOW_STAFF'), (req, res) => {
    const result = application_service_1.ApplicationService.submitMaterials({
        applicationId: req.params.id,
        materials: req.body.materials,
    }, req.currentUser);
    if ('error' in result) {
        res.status(400).json({ errors: result.error });
        return;
    }
    res.json({
        message: '材料提交成功',
        application: result
    });
});
router.post('/:id/review', auth_1.authenticate, (0, auth_1.requirePermission)('review_materials'), (0, auth_1.requireRole)('NOTARY'), (req, res) => {
    const result = application_service_1.ApplicationService.reviewAndSetPayment({
        applicationId: req.params.id,
        feeItems: req.body.feeItems,
    }, req.currentUser);
    if ('error' in result) {
        res.status(400).json({ errors: result.error });
        return;
    }
    res.json({
        message: '材料审核通过，已设置缴费金额',
        application: result
    });
});
router.post('/:id/supplement-notice', auth_1.authenticate, (0, auth_1.requirePermission)('issue_supplement_notice'), (req, res) => {
    const deadline = new Date(req.body.deadline);
    const result = application_service_1.ApplicationService.issueSupplementNotice({
        applicationId: req.params.id,
        reason: req.body.reason,
        requiredMaterials: req.body.requiredMaterials,
        deadline,
    }, req.currentUser);
    if ('error' in result) {
        res.status(400).json({ errors: result.error });
        return;
    }
    res.json({
        message: '补正通知已发出',
        notice: result
    });
});
router.get('/', auth_1.authenticate, (0, auth_1.requirePermission)('view_application'), (req, res) => {
    const { status, stuck } = req.query;
    let applications;
    if (stuck === 'true') {
        applications = application_service_1.ApplicationService.getStuckApplications();
    }
    else if (status) {
        applications = application_service_1.ApplicationService.getApplicationsByStatus(status);
    }
    else {
        applications = application_service_1.ApplicationService.getAllApplications();
    }
    res.json({
        count: applications.length,
        applications
    });
});
router.get('/:id', auth_1.authenticate, (0, auth_1.requirePermission)('view_application'), (req, res) => {
    const app = application_service_1.ApplicationService.getApplicationById(req.params.id);
    if (!app) {
        res.status(404).json({ error: '申请不存在' });
        return;
    }
    res.json({ application: app });
});
router.get('/no/:applicationNo', auth_1.authenticate, (0, auth_1.requirePermission)('view_application'), (req, res) => {
    const app = application_service_1.ApplicationService.getApplicationByNo(req.params.applicationNo);
    if (!app) {
        res.status(404).json({ error: '申请不存在' });
        return;
    }
    res.json({ application: app });
});
router.get('/:id/logs', auth_1.authenticate, (0, auth_1.requirePermission)('view_operation_logs'), (req, res) => {
    const logs = operationLog_service_1.OperationLogService.getApplicationLogs(req.params.id);
    res.json({
        count: logs.length,
        logs
    });
});
exports.applicationRoutes = router;
//# sourceMappingURL=application.routes.js.map