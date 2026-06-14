import { Router } from 'express';
import { db } from '../database';
import { authenticate, AuthRequest, requirePermission } from '../middleware/auth';

const router = Router();

router.get('/me', authenticate, (req: AuthRequest, res) => {
  res.json({ user: req.currentUser });
});

router.get('/', authenticate, requirePermission('view_application'), (req: AuthRequest, res) => {
  const users = db.getUsers().map(u => ({
    id: u.id,
    name: u.name,
    role: u.role,
    employeeId: u.employeeId,
  }));
  res.json({ users });
});

router.get('/:id', authenticate, requirePermission('view_application'), (req: AuthRequest, res) => {
  const user = db.getUserById(req.params.id) || db.getUserByEmployeeId(req.params.id);
  if (!user) {
    res.status(404).json({ error: '用户不存在' });
    return;
  }
  res.json({
    id: user.id,
    name: user.name,
    role: user.role,
    employeeId: user.employeeId,
  });
});

export const userRoutes = router;
