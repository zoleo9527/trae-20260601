import { Router, type Request, type Response } from 'express';
import {
  getAllReminders,
  getReminderById,
  scheduleReminder,
  executeReminder,
  confirmFee,
  reviewReminder,
  markDispute,
  resolveDispute,
  getAllUsers,
  markRisk,
  resolveRisk,
} from '../services/reminderService.js';
import { mockStudents } from '../data/mockData.js';

const router = Router();

router.get('/', (req: Request, res: Response): void => {
  const { status, keyword } = req.query as { status?: string; keyword?: string };
  const list = getAllReminders(status, keyword);
  res.json({ success: true, data: list });
});

router.get('/meta/users', (req: Request, res: Response): void => {
  const { role } = req.query as { role?: string };
  res.json({ success: true, data: getAllUsers(role) });
});

router.get('/meta/students', (_req: Request, res: Response): void => {
  res.json({ success: true, data: mockStudents });
});

router.get('/:id', (req: Request, res: Response): void => {
  const r = getReminderById(req.params.id);
  if (!r) {
    res.status(404).json({ success: false, error: '未找到该补训记录' });
    return;
  }
  res.json({ success: true, data: r });
});

router.put('/:id/schedule', (req: Request, res: Response): void => {
  const { operatorId, scheduledAt, assignedCoachId, remark } = req.body;
  if (!operatorId || !scheduledAt || !assignedCoachId) {
    res.status(400).json({ success: false, error: '缺少必要参数' });
    return;
  }
  const r = scheduleReminder(req.params.id, { scheduledAt, assignedCoachId, remark: remark || '' }, operatorId);
  if (!r) {
    res.status(400).json({ success: false, error: '状态不允许安排补训' });
    return;
  }
  res.json({ success: true, data: r });
});

router.put('/:id/execute', (req: Request, res: Response): void => {
  const { operatorId, executedAt, executedRemark } = req.body;
  if (!operatorId || !executedAt) {
    res.status(400).json({ success: false, error: '缺少必要参数' });
    return;
  }
  const r = executeReminder(req.params.id, { executedAt, executedRemark: executedRemark || '' }, operatorId);
  if (!r) {
    res.status(400).json({ success: false, error: '状态不允许执行补训' });
    return;
  }
  res.json({ success: true, data: r });
});

router.put('/:id/confirm-fee', (req: Request, res: Response): void => {
  const { operatorId, paymentStatus, confirmedBy, remark } = req.body;
  if (!operatorId || !paymentStatus || !confirmedBy) {
    res.status(400).json({ success: false, error: '缺少必要参数' });
    return;
  }
  const r = confirmFee(req.params.id, { paymentStatus, confirmedBy, remark: remark || '' }, operatorId);
  if (!r) {
    res.status(400).json({ success: false, error: '状态不允许确认费用' });
    return;
  }
  res.json({ success: true, data: r });
});

router.put('/:id/review', (req: Request, res: Response): void => {
  const { operatorId, remark, approve } = req.body;
  if (!operatorId) {
    res.status(400).json({ success: false, error: '缺少必要参数' });
    return;
  }
  const r = reviewReminder(req.params.id, { remark: remark || '', approve: !!approve }, operatorId);
  if (!r) {
    res.status(404).json({ success: false, error: '未找到该补训记录' });
    return;
  }
  res.json({ success: true, data: r });
});

router.put('/:id/dispute', (req: Request, res: Response): void => {
  const { operatorId, remark } = req.body;
  if (!operatorId) {
    res.status(400).json({ success: false, error: '缺少必要参数' });
    return;
  }
  const r = markDispute(req.params.id, { operatorId, remark: remark || '' });
  if (!r) {
    res.status(404).json({ success: false, error: '未找到该补训记录' });
    return;
  }
  res.json({ success: true, data: r });
});

router.put('/:id/resolve-dispute', (req: Request, res: Response): void => {
  const { operatorId, remark, resolveTo } = req.body;
  if (!operatorId || !resolveTo) {
    res.status(400).json({ success: false, error: '缺少必要参数' });
    return;
  }
  const r = resolveDispute(req.params.id, { remark: remark || '', resolveTo }, operatorId);
  if (!r) {
    res.status(400).json({ success: false, error: '状态不允许解除争议' });
    return;
  }
  res.json({ success: true, data: r });
});

router.put('/:id/risk', (req: Request, res: Response): void => {
  const { operatorId, level, category, reason } = req.body;
  if (!operatorId || !level || !category || !reason) {
    res.status(400).json({ success: false, error: '缺少必要参数' });
    return;
  }
  const r = markRisk(req.params.id, { level, category, reason, operatorId });
  if (!r) {
    res.status(404).json({ success: false, error: '未找到该补训记录' });
    return;
  }
  res.json({ success: true, data: r });
});

router.put('/:id/risk/:riskId/resolve', (req: Request, res: Response): void => {
  const { operatorId, resolveRemark } = req.body;
  if (!operatorId || !resolveRemark) {
    res.status(400).json({ success: false, error: '缺少必要参数' });
    return;
  }
  const r = resolveRisk(req.params.id, req.params.riskId, { resolveRemark, operatorId });
  if (!r) {
    res.status(404).json({ success: false, error: '未找到该风险记录' });
    return;
  }
  res.json({ success: true, data: r });
});

export default router;
