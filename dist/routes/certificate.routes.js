"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.certificateRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const certificate_service_1 = require("../services/certificate.service");
const router = (0, express_1.Router)();
router.post('/arrange', auth_1.authenticate, (0, auth_1.requirePermission)('arrange_certificate'), (0, auth_1.requireRole)('ARCHIVIST'), (req, res) => {
    const scheduledPickupDate = new Date(req.body.scheduledPickupDate);
    const result = certificate_service_1.CertificateService.arrangeCertificate({
        ...req.body,
        scheduledPickupDate,
    }, req.currentUser);
    if ('error' in result) {
        res.status(400).json({ errors: result.error });
        return;
    }
    res.json({
        message: '出证安排成功',
        application: result,
    });
});
router.post('/issue', auth_1.authenticate, (0, auth_1.requirePermission)('confirm_certificate_issue'), (0, auth_1.requireRole)('ARCHIVIST'), (req, res) => {
    const result = certificate_service_1.CertificateService.issueCertificate(req.body, req.currentUser);
    if ('error' in result) {
        res.status(400).json({ errors: result.error });
        return;
    }
    res.json({
        message: '发证完成',
        application: result,
    });
});
router.get('/pending-arrangement', auth_1.authenticate, (0, auth_1.requirePermission)('view_certificate'), (req, res) => {
    const applications = certificate_service_1.CertificateService.getApplicationsPendingArrangement();
    res.json({
        count: applications.length,
        applications,
    });
});
router.get('/pending-issuance', auth_1.authenticate, (0, auth_1.requirePermission)('view_certificate'), (req, res) => {
    const applications = certificate_service_1.CertificateService.getApplicationsPendingIssuance();
    res.json({
        count: applications.length,
        applications,
    });
});
router.get('/completed', auth_1.authenticate, (0, auth_1.requirePermission)('view_certificate'), (req, res) => {
    const applications = certificate_service_1.CertificateService.getCompletedApplications();
    res.json({
        count: applications.length,
        applications,
    });
});
router.get('/stuck', auth_1.authenticate, (0, auth_1.requirePermission)('view_certificate'), (req, res) => {
    const applications = certificate_service_1.CertificateService.getStuckCertificateRecords();
    res.json({
        count: applications.length,
        applications,
    });
});
router.get('/:applicationId', auth_1.authenticate, (0, auth_1.requirePermission)('view_certificate'), (req, res) => {
    const record = certificate_service_1.CertificateService.getCertificateRecord(req.params.applicationId);
    if (!record) {
        res.status(404).json({ error: '出证记录不存在' });
        return;
    }
    res.json({ certificate: record });
});
router.get('/:applicationId/history', auth_1.authenticate, (0, auth_1.requirePermission)('view_operation_logs'), (req, res) => {
    const history = certificate_service_1.CertificateService.getCertificateHistory(req.params.applicationId);
    res.json({
        count: history.length,
        history,
    });
});
router.get('/:applicationId/review', auth_1.authenticate, (0, auth_1.requirePermission)('view_operation_logs'), (req, res) => {
    const result = certificate_service_1.CertificateService.reviewCertificateProcess(req.params.applicationId);
    if ('error' in result) {
        res.status(400).json({ errors: result.error });
        return;
    }
    res.json({ review: result });
});
exports.certificateRoutes = router;
//# sourceMappingURL=certificate.routes.js.map