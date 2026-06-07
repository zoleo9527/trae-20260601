import { Router } from 'express';
import { prisma } from '../index.js';

const router = Router();

router.get('/', async (req, res) => {
  const { role } = req.query;
  const users = await prisma.user.findMany({
    where: role ? { role: role as string } : undefined,
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      createdAt: true,
      _count: {
        select: { inspections: true, createdRepairOrders: true, assignedRepairOrders: true }
      }
    }
  });
  res.json(users);
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, name: true, role: true, password: true }
  });
  
  if (!user || user.password !== password) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  
  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

export default router;
