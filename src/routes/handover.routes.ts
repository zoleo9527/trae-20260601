import { Router } from 'express';
import { authenticate, AuthRequest, requirePermission } from '../middleware/auth';
import { HandoverService } from '../services/handover.service';
import { UserRole } from '../types';

const router = Router();

router.get('/todo', authenticate, requirePermission('view_application'), (req: AuthRequest, res) => {
  const { role } = req.query;

  if (role) {
    const validRoles: UserRole[] = ['WINDOW_STAFF', 'NOTARY', 'ARCHIVIST'];
    if (!validRoles.includes(role as UserRole)) {
      res.status(400).json({
        error: '无效的角色参数',
        validRoles,
      });
      return;
    }
    const result = HandoverService.getTodoByRole(role as UserRole);
    res.json(result);
    return;
  }

  const overview = HandoverService.getTodoOverview();
  res.json(overview);
});

export const handoverRoutes = router;
