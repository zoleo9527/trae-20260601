import express, { type Request, type Response } from 'express';
import type { UserRole } from '../../shared/types.js';
import {
  getDashboardData,
  getOrderById,
  listOrders,
  getQuoteDetail,
  submitSelection,
  claimSelection,
  processQuote,
  getOrderHistory,
} from '../services/orderService.js';
import { getUserByRole } from '../store/mockStore.js';

const router = express.Router();

function getUser(req: Request) {
  const role = (req.headers['x-user-role'] as string) || 'MANAGER';
  const username = (req.headers['x-user-username'] as string) || 'manager';
  return { role: role as UserRole, username };
}

router.get('/dashboard', (req: Request, res: Response) => {
  const { role } = getUser(req);
  const result = getDashboardData(role);
  res.status(result.code === 0 ? 200 : 400).json(result);
});

router.get('/orders', (req: Request, res: Response) => {
  const { status } = req.query;
  const result = listOrders(status as string | undefined);
  res.status(result.code === 0 ? 200 : 400).json(result);
});

router.get('/orders/:id', (req: Request, res: Response) => {
  const result = getOrderById(req.params.id);
  res.status(result.code === 0 ? 200 : 400).json(result);
});

router.get('/orders/:id/quote', (req: Request, res: Response) => {
  const result = getQuoteDetail(req.params.id);
  res.status(result.code === 0 ? 200 : 400).json(result);
});

router.get('/orders/:id/history', (req: Request, res: Response) => {
  const result = getOrderHistory(req.params.id);
  res.status(result.code === 0 ? 200 : 400).json(result);
});

router.post('/orders/:id/selection/claim', (req: Request, res: Response) => {
  const { role } = getUser(req);
  const user = getUserByRole(role);
  if (!user) {
    res.status(400).json({ code: 40003, message: '用户不存在', data: null });
    return;
  }
  const result = claimSelection(req.params.id, user.id);
  res.status(result.code === 0 ? 200 : 400).json(result);
});

router.post('/orders/:id/selection', (req: Request, res: Response) => {
  const { role } = getUser(req);
  const user = getUserByRole(role);
  if (!user) {
    res.status(400).json({ code: 40003, message: '用户不存在', data: null });
    return;
  }
  const payload = { ...req.body, operatorId: user.id };
  const result = submitSelection(req.params.id, payload);
  res.status(result.code === 0 ? 200 : 400).json(result);
});

router.post('/orders/:id/quote', (req: Request, res: Response) => {
  const { role } = getUser(req);
  const user = getUserByRole(role);
  if (!user) {
    res.status(400).json({ code: 40003, message: '用户不存在', data: null });
    return;
  }
  const payload = { ...req.body, operatorId: user.id };
  const result = processQuote(req.params.id, payload);
  res.status(result.code === 0 ? 200 : 400).json(result);
});

export default router;
