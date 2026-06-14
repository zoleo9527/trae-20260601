"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const payment_service_1 = require("../services/payment.service");
const router = (0, express_1.Router)();
router.post('/register', auth_1.authenticate, (0, auth_1.requirePermission)('register_payment'), (0, auth_1.requireRole)('WINDOW_STAFF'), (req, res) => {
    const result = payment_service_1.PaymentService.registerPayment(req.body, req.currentUser);
    if ('error' in result) {
        res.status(400).json({ errors: result.error });
        return;
    }
    res.json({
        message: '缴费登记提交成功',
        application: result,
    });
});
router.post('/confirm', auth_1.authenticate, (0, auth_1.requirePermission)('confirm_payment'), (0, auth_1.requireRole)('NOTARY'), (req, res) => {
    const result = payment_service_1.PaymentService.confirmPayment(req.body, req.currentUser);
    if ('error' in result) {
        res.status(400).json({ errors: result.error });
        return;
    }
    res.json({
        message: '缴费确认成功',
        application: result,
    });
});
router.get('/pending-registration', auth_1.authenticate, (0, auth_1.requirePermission)('view_payment'), (req, res) => {
    const applications = payment_service_1.PaymentService.getApplicationsPendingPayment();
    res.json({
        count: applications.length,
        applications,
    });
});
router.get('/pending-confirmation', auth_1.authenticate, (0, auth_1.requirePermission)('view_payment'), (req, res) => {
    const applications = payment_service_1.PaymentService.getApplicationsPendingPaymentConfirmation();
    res.json({
        count: applications.length,
        applications,
    });
});
router.get('/stuck', auth_1.authenticate, (0, auth_1.requirePermission)('view_payment'), (req, res) => {
    const applications = payment_service_1.PaymentService.getStuckPaymentRecords();
    res.json({
        count: applications.length,
        applications,
    });
});
router.get('/:applicationId', auth_1.authenticate, (0, auth_1.requirePermission)('view_payment'), (req, res) => {
    const record = payment_service_1.PaymentService.getPaymentRecord(req.params.applicationId);
    if (!record) {
        res.status(404).json({ error: '缴费记录不存在' });
        return;
    }
    res.json({ payment: record });
});
exports.paymentRoutes = router;
//# sourceMappingURL=payment.routes.js.map