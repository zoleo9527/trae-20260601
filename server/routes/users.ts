import { Router } from 'express';
import { User } from '../models';

const router = Router();

router.get('/', async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});

router.get('/:id', async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  res.json(user);
});

router.get('/role/:role', async (req, res) => {
  const users = await User.findAll({ where: { role: req.params.role } });
  res.json(users);
});

export default router;
