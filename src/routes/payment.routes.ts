import { Router } from 'express';
import { authenticate, AuthRequest, requirePermission, requireRole } from '../middleware/auth';
import { PaymentService } from '../services/payment.service';

const router = Router();

router.post('/register', authenticate, requirePermission('register_payment'), requireRole('WINDOW_STAFF'), (req: AuthRequest, res) => {
  const result = PaymentService.registerPayment(req.body, req.currentUser!);

  if ('error' in result) {
    res.status(400).json({ errors: result.error });
    return;
  }

  res.json({
    message: '缴费登记提交成功',
    application: result,
  });
});

router.post('/confirm', authenticate, requirePermission('confirm_payment'), requireRole('NOTARY'), (req: AuthRequest, res) => {
  const result = PaymentService.confirmPayment(req.body, req.currentUser!);

  if ('error' in result) {
    res.status(400).json({ errors: result.error });
    return;
  }

  res.json({
    message: '缴费确认成功',
    application: result,
  });
});

router.get('/pending-registration', authenticate, requirePermission('view_payment'), (req: AuthRequest, res) => {
  const applications = PaymentService.getApplicationsPendingPayment();
  res.json({
    count: applications.length,
    applications,
  });
});

router.get('/pending-confirmation', authenticate, requirePermission('view_payment'), (req: AuthRequest, res) => {
  const applications = PaymentService.getApplicationsPendingPaymentConfirmation();
  res.json({
    count: applications.length,
    applications,
  });
});

router.get('/stuck', authenticate, requirePermission('view_payment'), (req: AuthRequest, res) => {
  const applications = PaymentService.getStuckPaymentRecords();
  res.json({
    count: applications.length,
    applications,
  });
});

router.get('/:applicationId', authenticate, requirePermission('view_payment'), (req: AuthRequest, res) => {
  const record = PaymentService.getPaymentRecord(req.params.applicationId);
  if (!record) {
    res.status(404).json({ error: '缴费记录不存在' });
    return;
  }
  res.json({ payment: record });
});

export const paymentRoutes = router;
