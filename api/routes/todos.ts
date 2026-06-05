import { Router } from 'express';
import complaintService from '../services/ComplaintService.js';
import type { UserRole } from '../../shared/types.js';

const router = Router();

router.get('/:role', (req, res) => {
  const role = req.params.role as UserRole;
  if (!['reception', 'coach', 'manager'].includes(role)) {
    res.status(400).json({ error: '无效的角色' });
    return;
  }
  const todos = complaintService.getTodosByRole(role);
  res.json(todos);
});

export default router;
