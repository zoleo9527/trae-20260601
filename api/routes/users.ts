import { Router } from 'express';
import type { Request, Response } from 'express';
import { getAllUsers, getUserById, getUsersByRole } from '../services/userService.js';
import type { UserRole } from '../../shared/types.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const role = req.query.role as UserRole | undefined;

    if (role) {
      const users = getUsersByRole(role);
      return res.json(users);
    }

    const users = getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = getUserById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;
