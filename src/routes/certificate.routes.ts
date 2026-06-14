import { Router } from 'express';
import { authenticate, AuthRequest, requirePermission, requireRole } from '../middleware/auth';
import { CertificateService } from '../services/certificate.service';

const router = Router();

router.post('/arrange', authenticate, requirePermission('arrange_certificate'), requireRole('ARCHIVIST'), (req: AuthRequest, res) => {
  const scheduledPickupDate = new Date(req.body.scheduledPickupDate);
  
  const result = CertificateService.arrangeCertificate({
    ...req.body,
    scheduledPickupDate,
  }, req.currentUser!);

  if ('error' in result) {
    res.status(400).json({ errors: result.error });
    return;
  }

  res.json({
    message: '出证安排成功',
    application: result,
  });
});

router.post('/issue', authenticate, requirePermission('confirm_certificate_issue'), requireRole('ARCHIVIST'), (req: AuthRequest, res) => {
  const result = CertificateService.issueCertificate(req.body, req.currentUser!);

  if ('error' in result) {
    res.status(400).json({ errors: result.error });
    return;
  }

  res.json({
    message: '发证完成',
    application: result,
  });
});

router.get('/pending-arrangement', authenticate, requirePermission('view_certificate'), (req: AuthRequest, res) => {
  const applications = CertificateService.getApplicationsPendingArrangement();
  res.json({
    count: applications.length,
    applications,
  });
});

router.get('/pending-issuance', authenticate, requirePermission('view_certificate'), (req: AuthRequest, res) => {
  const applications = CertificateService.getApplicationsPendingIssuance();
  res.json({
    count: applications.length,
    applications,
  });
});

router.get('/completed', authenticate, requirePermission('view_certificate'), (req: AuthRequest, res) => {
  const applications = CertificateService.getCompletedApplications();
  res.json({
    count: applications.length,
    applications,
  });
});

router.get('/stuck', authenticate, requirePermission('view_certificate'), (req: AuthRequest, res) => {
  const applications = CertificateService.getStuckCertificateRecords();
  res.json({
    count: applications.length,
    applications,
  });
});

router.get('/:applicationId', authenticate, requirePermission('view_certificate'), (req: AuthRequest, res) => {
  const record = CertificateService.getCertificateRecord(req.params.applicationId);
  if (!record) {
    res.status(404).json({ error: '出证记录不存在' });
    return;
  }
  res.json({ certificate: record });
});

router.get('/:applicationId/history', authenticate, requirePermission('view_operation_logs'), (req: AuthRequest, res) => {
  const history = CertificateService.getCertificateHistory(req.params.applicationId);
  res.json({
    count: history.length,
    history,
  });
});

router.get('/:applicationId/review', authenticate, requirePermission('view_operation_logs'), (req: AuthRequest, res) => {
  const result = CertificateService.reviewCertificateProcess(req.params.applicationId);

  if ('error' in result) {
    res.status(400).json({ errors: result.error });
    return;
  }

  res.json({ review: result });
});

export const certificateRoutes = router;
