import { Router, Request, Response } from 'express';
import { db } from './db';
import { signToken, authMiddleware, requireRole } from './auth';
import {
  createCarSource, submitToManager, managerApprove, managerReject,
  appraiserSubmit, appraiserReject, financeApprove, financeReject,
  cancelCarSource, addComment, getCarDetail, listCarsForUser,
  exportApprovalSheet, exportOperationLogs, OPERATION_LABEL, ROLE_LABEL
} from './services';
import { CAR_STATUS_LABEL } from './types';

const router = Router();

router.post('/auth/login', (req: Request, res: Response) => {
  const { username } = req.body || {};
  if (!username) return res.status(400).json({ code: 400, message: '请输入用户名' });
  const user = db.findUserByUsername(String(username).trim().toLowerCase());
  if (!user) return res.status(401).json({ code: 401, message: '用户不存在' });
  const token = signToken(user);
  res.json({ code: 0, data: { token, user } });
});

router.get('/auth/me', authMiddleware, (req: Request, res: Response) => {
  res.json({ code: 0, data: req.user });
});

router.get('/meta/constants', authMiddleware, (_req: Request, res: Response) => {
  res.json({
    code: 0,
    data: {
      carStatus: CAR_STATUS_LABEL,
      operationTypes: OPERATION_LABEL,
      roles: ROLE_LABEL,
      users: db.listUsersByRole()
    }
  });
});

router.get('/cars', authMiddleware, (req: Request, res: Response) => {
  const user = req.user!;
  const status = req.query.status ? String(req.query.status).split(',').map(s => s.trim()) as any : undefined;
  const keyword = req.query.keyword ? String(req.query.keyword) : undefined;
  const scope = (req.query.scope as 'mine' | 'all' | 'pending') || 'all';
  const result = listCarsForUser(user, { status, keyword, scope });
  res.json({ code: 0, data: result.data });
});

router.post('/cars', authMiddleware, (req: Request, res: Response) => {
  const result = createCarSource(req.user!, req.body);
  if (!result.ok) return res.status(400).json({ code: 400, message: result.message });
  res.json({ code: 0, data: result.data });
});

router.get('/cars/:id', authMiddleware, (req: Request, res: Response) => {
  const result = getCarDetail(req.user!, req.params.id);
  if (!result.ok) return res.status(404).json({ code: 404, message: result.message });
  res.json({ code: 0, data: result.data });
});

router.post('/cars/:id/submit', authMiddleware, (req: Request, res: Response) => {
  const result = submitToManager(req.user!, req.params.id, req.body?.remark);
  if (!result.ok) return res.status(400).json({ code: 400, message: result.message });
  res.json({ code: 0, data: result.data });
});

router.post('/cars/:id/manager-approve', authMiddleware, requireRole('manager'), (req: Request, res: Response) => {
  const result = managerApprove(req.user!, req.params.id, req.body?.managerPrice, req.body?.remark, req.body?.assignAppraiserId);
  if (!result.ok) return res.status(400).json({ code: 400, message: result.message });
  res.json({ code: 0, data: result.data });
});

router.post('/cars/:id/manager-reject', authMiddleware, requireRole('manager'), (req: Request, res: Response) => {
  const result = managerReject(req.user!, req.params.id, req.body?.remark);
  if (!result.ok) return res.status(400).json({ code: 400, message: result.message });
  res.json({ code: 0, data: result.data });
});

router.post('/cars/:id/appraiser-submit', authMiddleware, requireRole('appraiser'), (req: Request, res: Response) => {
  const result = appraiserSubmit(req.user!, req.params.id, req.body?.appraiserPrice, req.body?.remark);
  if (!result.ok) return res.status(400).json({ code: 400, message: result.message });
  res.json({ code: 0, data: result.data });
});

router.post('/cars/:id/appraiser-reject', authMiddleware, requireRole('appraiser'), (req: Request, res: Response) => {
  const result = appraiserReject(req.user!, req.params.id, req.body?.remark);
  if (!result.ok) return res.status(400).json({ code: 400, message: result.message });
  res.json({ code: 0, data: result.data });
});

router.post('/cars/:id/finance-approve', authMiddleware, requireRole('finance'), (req: Request, res: Response) => {
  const result = financeApprove(req.user!, req.params.id, req.body?.finalPrice, req.body?.remark);
  if (!result.ok) return res.status(400).json({ code: 400, message: result.message });
  res.json({ code: 0, data: result.data });
});

router.post('/cars/:id/finance-reject', authMiddleware, requireRole('finance'), (req: Request, res: Response) => {
  const result = financeReject(req.user!, req.params.id, req.body?.remark);
  if (!result.ok) return res.status(400).json({ code: 400, message: result.message });
  res.json({ code: 0, data: result.data });
});

router.post('/cars/:id/cancel', authMiddleware, (req: Request, res: Response) => {
  const result = cancelCarSource(req.user!, req.params.id, req.body?.remark);
  if (!result.ok) return res.status(400).json({ code: 400, message: result.message });
  res.json({ code: 0, data: result.data });
});

router.post('/cars/:id/comments', authMiddleware, (req: Request, res: Response) => {
  const result = addComment(req.user!, req.params.id, req.body?.remark);
  if (!result.ok) return res.status(400).json({ code: 400, message: result.message });
  res.json({ code: 0, data: result.data });
});

router.get('/cars/:id/export', authMiddleware, (req: Request, res: Response) => {
  const result = exportApprovalSheet(req.user!, req.params.id);
  if (!result.ok || !result.data) return res.status(400).json({ code: 400, message: result.message });
  const { filename, content, format } = result.data;
  res.setHeader('Content-Type', format === 'csv' ? 'text/csv; charset=utf-8' : 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
  res.send(content);
});

router.get('/logs/export', authMiddleware, (req: Request, res: Response) => {
  const from = req.query.from ? String(req.query.from) : undefined;
  const to = req.query.to ? String(req.query.to) : undefined;
  const operationType = req.query.operationType ? String(req.query.operationType).split(',').map(s => s.trim()) as any : undefined;
  const operatorId = req.query.operatorId ? String(req.query.operatorId) : undefined;
  const result = exportOperationLogs(req.user!, { from, to, operationType, operatorId });
  if (!result.ok || !result.data) return res.status(400).json({ code: 400, message: result.message });
  const { filename, content, format } = result.data;
  res.setHeader('Content-Type', format === 'csv' ? 'text/csv; charset=utf-8' : 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
  res.send(content);
});

router.get('/logs', authMiddleware, (req: Request, res: Response) => {
  const from = req.query.from ? String(req.query.from) : undefined;
  const to = req.query.to ? String(req.query.to) : undefined;
  const operationType = req.query.operationType ? String(req.query.operationType).split(',').map(s => s.trim()) as any : undefined;
  const operatorId = req.query.operatorId ? String(req.query.operatorId) : undefined;
  res.json({ code: 0, data: db.listAllLogs({ from, to, operationType, operatorId }) });
});

export default router;
