import express, { type Request, type Response, type NextFunction } from 'express';
import type { UserRole } from '../../shared/types.js';
import { ERROR_CODES, ERROR_MESSAGES } from '../../shared/types.js';
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

interface AuthenticatedRequest extends Request {
  auth?: {
    role: UserRole;
    username: string;
    userId: string;
    userName: string;
  };
}

function extractAuth(req: Request): { role: UserRole; username: string } | null {
  const role = req.headers['x-user-role'] as string | undefined;
  const username = req.headers['x-user-username'] as string | undefined;
  if (!role || !username) return null;
  const validRoles: UserRole[] = ['RECEPTION', 'TECHNICIAN', 'MANAGER'];
  if (!validRoles.includes(role as UserRole)) return null;
  return { role: role as UserRole, username };
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const auth = extractAuth(req);
  if (!auth) {
    res.status(401).json({
      code: ERROR_CODES.PERMISSION_DENIED,
      message: ERROR_MESSAGES[ERROR_CODES.PERMISSION_DENIED] + '：未登录或身份无效',
      data: null,
    });
    return;
  }
  const user = getUserByRole(auth.role);
  if (!user || user.username !== auth.username) {
    res.status(401).json({
      code: ERROR_CODES.PERMISSION_DENIED,
      message: ERROR_MESSAGES[ERROR_CODES.PERMISSION_DENIED] + '：用户信息不匹配',
      data: null,
    });
    return;
  }
  req.auth = {
    role: auth.role,
    username: auth.username,
    userId: user.id,
    userName: user.name,
  };
  next();
}

function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({
        code: ERROR_CODES.PERMISSION_DENIED,
        message: ERROR_MESSAGES[ERROR_CODES.PERMISSION_DENIED] + '：未登录',
        data: null,
      });
      return;
    }
    if (!allowedRoles.includes(req.auth.role)) {
      res.status(403).json({
        code: ERROR_CODES.PERMISSION_DENIED,
        message: ERROR_MESSAGES[ERROR_CODES.PERMISSION_DENIED] + '：角色无此操作权限',
        data: null,
      });
      return;
    }
    next();
  };
}

router.get('/dashboard', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const result = getDashboardData(req.auth!.role);
  res.status(result.code === 0 ? 200 : 400).json(result);
});

router.get('/orders', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.query;
  const result = listOrders(status as string | undefined);
  res.status(result.code === 0 ? 200 : 400).json(result);
});

router.get('/orders/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const result = getOrderById(req.params.id);
  res.status(result.code === 0 ? 200 : 400).json(result);
});

router.get('/orders/:id/quote', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const result = getQuoteDetail(req.params.id);
  res.status(result.code === 0 ? 200 : 400).json(result);
});

router.get('/orders/:id/history', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const result = getOrderHistory(req.params.id);
  res.status(result.code === 0 ? 200 : 400).json(result);
});

router.post(
  '/orders/:id/selection/claim',
  requireAuth,
  requireRole(['TECHNICIAN']),
  (req: AuthenticatedRequest, res: Response) => {
    const result = claimSelection(req.params.id, req.auth!.userId);
    res.status(result.code === 0 ? 200 : 400).json(result);
  },
);

router.post(
  '/orders/:id/selection',
  requireAuth,
  requireRole(['TECHNICIAN']),
  (req: AuthenticatedRequest, res: Response) => {
    const payload = { ...req.body, operatorId: req.auth!.userId };
    const result = submitSelection(req.params.id, payload);
    res.status(result.code === 0 ? 200 : 400).json(result);
  },
);

router.post(
  '/orders/:id/quote',
  requireAuth,
  requireRole(['MANAGER']),
  (req: AuthenticatedRequest, res: Response) => {
    const payload = { ...req.body, operatorId: req.auth!.userId };
    const result = processQuote(req.params.id, payload);
    res.status(result.code === 0 ? 200 : 400).json(result);
  },
);

export default router;
