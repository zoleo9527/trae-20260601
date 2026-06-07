import { Router } from 'express';
import { prisma } from '../index.js';

const router = Router();

router.get('/', async (req, res) => {
  const { userId, read } = req.query;
  const notifications = await prisma.notification.findMany({
    where: {
      ...(userId && { userId: userId as string }),
      ...(read !== undefined && { read: read === 'true' })
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
  res.json(notifications);
});

router.put('/:id/read', async (req, res) => {
  const notification = await prisma.notification.update({
    where: { id: req.params.id },
    data: { read: true }
  });
  res.json(notification);
});

router.put('/read-all', async (req, res) => {
  const { userId } = req.body;
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true }
  });
  res.json({ success: true });
});

export default router;
