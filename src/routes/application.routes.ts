import { Router } from 'express';
import { authenticate, AuthRequest, requirePermission, requireRole } from '../middleware/auth';
import { ApplicationService } from '../services/application.service';
import { OperationLogService } from '../services/operationLog.service';
import { ApplicationStatus } from '../types';

const router = Router();

router.post('/', authenticate, requirePermission('submit_materials'), requireRole('WINDOW_STAFF'), (req: AuthRequest, res) => {
  const result = ApplicationService.createApplication(req.body, req.currentUser!);
  res.status(201).json({ 
    message: '申请创建成功', 
    application: result 
  });
});

router.post('/:id/materials', authenticate, requirePermission('submit_materials'), requireRole('WINDOW_STAFF'), (req: AuthRequest, res) => {
  const result = ApplicationService.submitMaterials({
    applicationId: req.params.id,
    materials: req.body.materials,
  }, req.currentUser!);

  if ('error' in result) {
    res.status(400).json({ errors: result.error });
    return;
  }
  res.json({ 
    message: '材料提交成功', 
    application: result 
  });
});

router.post('/:id/review', authenticate, requirePermission('review_materials'), requireRole('NOTARY'), (req: AuthRequest, res) => {
  const result = ApplicationService.reviewAndSetPayment({
    applicationId: req.params.id,
    feeItems: req.body.feeItems,
  }, req.currentUser!);

  if ('error' in result) {
    res.status(400).json({ errors: result.error });
    return;
  }
  res.json({ 
    message: '材料审核通过，已设置缴费金额', 
    application: result 
  });
});

router.post('/:id/supplement-notice', authenticate, requirePermission('issue_supplement_notice'), requireRole('NOTARY'), (req: AuthRequest, res) => {
  const deadline = new Date(req.body.deadline);
  const result = ApplicationService.issueSupplementNotice({
    applicationId: req.params.id,
    reason: req.body.reason,
    requiredMaterials: req.body.requiredMaterials,
    deadline,
  }, req.currentUser!);

  if ('error' in result) {
    res.status(400).json({ errors: result.error });
    return;
  }
  res.json({ 
    message: '补正通知已发出', 
    notice: result 
  });
});

router.get('/', authenticate, requirePermission('view_application'), (req: AuthRequest, res) => {
  const { status, stuck } = req.query;
  
  let applications;
  if (stuck === 'true') {
    applications = ApplicationService.getStuckApplications();
  } else if (status) {
    applications = ApplicationService.getApplicationsByStatus(status as ApplicationStatus);
  } else {
    applications = ApplicationService.getAllApplications();
  }

  res.json({ 
    count: applications.length,
    applications 
  });
});

router.get('/no/:applicationNo', authenticate, requirePermission('view_application'), (req: AuthRequest, res) => {
  const app = ApplicationService.getApplicationByNo(req.params.applicationNo);
  if (!app) {
    res.status(404).json({ error: '申请不存在' });
    return;
  }
  res.json({ application: app });
});

router.get('/:id', authenticate, requirePermission('view_application'), (req: AuthRequest, res) => {
  const app = ApplicationService.getApplicationById(req.params.id);
  if (!app) {
    res.status(404).json({ error: '申请不存在' });
    return;
  }
  res.json({ application: app });
});

router.get('/:id/logs', authenticate, requirePermission('view_operation_logs'), (req: AuthRequest, res) => {
  const logs = OperationLogService.getApplicationLogs(req.params.id);
  res.json({ 
    count: logs.length,
    logs 
  });
});

export const applicationRoutes = router;
