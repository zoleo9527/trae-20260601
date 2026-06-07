import { Router } from 'express';
import { prisma } from '../index.js';

const router = Router();

router.get('/', async (req, res) => {
  const { status, area } = req.query;
  const machines = await prisma.machine.findMany({
    where: {
      ...(status && { status: status as string }),
      ...(area && { area: area as string })
    },
    include: {
      _count: {
        select: { inspections: true, repairOrders: true }
      }
    },
    orderBy: { machineNo: 'asc' }
  });
  res.json(machines);
});

router.get('/:id', async (req, res) => {
  const machine = await prisma.machine.findUnique({
    where: { id: req.params.id },
    include: {
      inspections: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { inspector: { select: { id: true, name: true } } }
      },
      repairOrders: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } }
        }
      }
    }
  });
  if (!machine) return res.status(404).json({ error: '机器不存在' });
  res.json(machine);
});

export default router;
