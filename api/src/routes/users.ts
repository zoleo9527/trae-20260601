import { Router } from 'express';
import { getAllUsers, getUserById, getUsersByRole } from '../services/userService';

const router = Router();

router.get('/', (req, res) => {
  const role = req.query.role as string || '';
  if (role) {
    const users = getUsersByRole(role as any);
    res.json(users);
  } else {
    const users = getAllUsers();
    res.json(users);
  }
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }
  const user = getUserById(id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

export default router;
