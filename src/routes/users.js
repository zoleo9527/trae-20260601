import { Router } from 'express';
import { prisma } from '../server.js';
import { requireRole } from '../middleware/roleAuth.js';

const router = Router();

router.get('/', async (req, res) => {
  const { role, isActive } = req.query;
  
  const where = {};
  if (role) where.role = role;
  if (isActive !== undefined) where.isActive = isActive === 'true';
  
  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      role: true,
      phone: true,
      email: true,
      isActive: true,
      createdAt: true
    },
    orderBy: { name: 'asc' }
  });
  
  res.json(users);
});

router.get('/:id', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      name: true,
      role: true,
      phone: true,
      email: true,
      isActive: true,
      createdAt: true
    }
  });
  
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  
  res.json(user);
});

router.post('/', requireRole('ADMIN'), async (req, res) => {
  const { name, role, phone, email } = req.body;
  
  const user = await prisma.user.create({
    data: { name, role, phone, email }
  });
  
  res.status(201).json(user);
});

router.patch('/:id', requireRole('ADMIN'), async (req, res) => {
  const { name, role, phone, email, isActive } = req.body;
  
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { name, role, phone, email, isActive }
  });
  
  res.json(user);
});

// 按角色获取用户（方便选择处理人）
router.get('/role/:role', async (req, res) => {
  const users = await prisma.user.findMany({
    where: {
      role: req.params.role,
      isActive: true
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true
    },
    orderBy: { name: 'asc' }
  });
  
  res.json(users);
});

export default router;
