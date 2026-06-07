import { Router } from 'express';
import { prisma } from '../index.js';

const router = Router();

function parseJSON(str: string | null | undefined) {
  if (!str) return null;
  try { return JSON.parse(str); } catch { return str; }
}

function serializeJSON(obj: any) {
  if (obj === null || obj === undefined) return '';
  if (typeof obj === 'string') return obj;
  return JSON.stringify(obj);
}

function transformInspection(item: any) {
  return {
    ...item,
    checkItems: parseJSON(item.checkItems)
  };
}

router.get('/', async (req, res) => {
  const { status, machineId, inspectorId } = req.query;
  const inspections = await prisma.inspection.findMany({
    where: {
      ...(status && { status: status as string }),
      ...(machineId && { machineId: machineId as string }),
      ...(inspectorId && { inspectorId: inspectorId as string })
    },
    include: {
      machine: true,
      inspector: { select: { id: true, name: true, role: true } },
      reviewedBy: { select: { id: true, name: true, role: true } },
      statusHistory: {
        orderBy: { createdAt: 'asc' },
        include: {
          operator: { select: { id: true, name: true, role: true } }
        }
      },
      repairOrders: {
        select: { id: true, title: true, status: true, priority: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(inspections.map(transformInspection));
});

router.get('/:id', async (req, res) => {
  const inspection = await prisma.inspection.findUnique({
    where: { id: req.params.id },
    include: {
      machine: true,
      inspector: { select: { id: true, name: true, role: true } },
      reviewedBy: { select: { id: true, name: true, role: true } },
      statusHistory: {
        orderBy: { createdAt: 'asc' },
        include: {
          operator: { select: { id: true, name: true, role: true } }
        }
      },
      repairOrders: {
        include: {
          machine: true,
          assignedTo: { select: { id: true, name: true } }
        }
      }
    }
  });
  if (!inspection) return res.status(404).json({ error: '巡检记录不存在' });
  res.json(transformInspection(inspection));
});

router.post('/', async (req, res) => {
  const { machineId, inspectorId, checkItems, overallNote, hasIssue } = req.body;
  const inspection = await prisma.inspection.create({
    data: {
      machineId,
      inspectorId,
      checkItems: serializeJSON(checkItems),
      overallNote,
      hasIssue,
      status: 'IN_PROGRESS',
      statusHistory: {
        create: [
          { toStatus: 'PENDING', operatorId: inspectorId, note: '创建巡检任务' },
          { fromStatus: 'PENDING', toStatus: 'IN_PROGRESS', operatorId: inspectorId, note: '开始巡检' }
        ]
      }
    },
    include: { machine: true, inspector: { select: { id: true, name: true } } }
  });
  res.status(201).json(transformInspection(inspection));
});

router.put('/:id/complete', async (req, res) => {
  const { checkItems, overallNote, hasIssue } = req.body;
  const existing = await prisma.inspection.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: '巡检记录不存在' });

  const inspection = await prisma.inspection.update({
    where: { id: req.params.id },
    data: {
      checkItems: serializeJSON(checkItems),
      overallNote,
      hasIssue,
      status: 'COMPLETED',
      statusHistory: {
        create: [{
          fromStatus: existing.status,
          toStatus: 'COMPLETED',
          operatorId: existing.inspectorId,
          note: '完成巡检'
        }]
      }
    },
    include: {
      machine: true,
      statusHistory: { orderBy: { createdAt: 'asc' } }
    }
  });
  res.json(transformInspection(inspection));
});

router.put('/:id/return', async (req, res) => {
  const { returnNote, operatorId } = req.body;
  const existing = await prisma.inspection.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: '巡检记录不存在' });

  const inspection = await prisma.inspection.update({
    where: { id: req.params.id },
    data: {
      status: 'RETURNED',
      returnNote,
      statusHistory: {
        create: [{
          fromStatus: existing.status,
          toStatus: 'RETURNED',
          operatorId,
          note: returnNote || '退回补录'
        }]
      }
    },
    include: {
      machine: true,
      inspector: { select: { id: true, name: true } },
      statusHistory: { orderBy: { createdAt: 'asc' } }
    }
  });

  await prisma.notification.create({
    data: {
      userId: existing.inspectorId,
      type: 'INSPECTION_RETURNED',
      title: '巡检记录被退回',
      content: `巡检记录被退回：${returnNote || '请补充信息'}`,
      relatedId: existing.id
    }
  });

  res.json(transformInspection(inspection));
});

router.put('/:id/supplement', async (req, res) => {
  const { supplementNote, checkItems, overallNote, hasIssue, operatorId } = req.body;
  const existing = await prisma.inspection.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: '巡检记录不存在' });

  const inspection = await prisma.inspection.update({
    where: { id: req.params.id },
    data: {
      supplementNote,
      checkItems: checkItems ? serializeJSON(checkItems) : existing.checkItems,
      overallNote: overallNote || existing.overallNote,
      hasIssue: hasIssue !== undefined ? hasIssue : existing.hasIssue,
      supplementAt: new Date(),
      status: 'SUPPLEMENTED',
      statusHistory: {
        create: [{
          fromStatus: existing.status,
          toStatus: 'SUPPLEMENTED',
          operatorId,
          note: supplementNote || '补充信息完成'
        }]
      }
    },
    include: {
      machine: true,
      statusHistory: { orderBy: { createdAt: 'asc' } }
    }
  });

  await prisma.notification.create({
    data: {
      userId: operatorId,
      type: 'INSPECTION_SUPPLEMENT',
      title: '巡检已补录',
      content: '巡检记录已完成补录，请复核',
      relatedId: existing.id
    }
  });

  res.json(transformInspection(inspection));
});

router.put('/:id/review', async (req, res) => {
  const { reviewNote, operatorId, approved } = req.body;
  const existing = await prisma.inspection.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: '巡检记录不存在' });

  const newStatus = approved ? 'REVIEWED' : 'RETURNED';
  const inspection = await prisma.inspection.update({
    where: { id: req.params.id },
    data: {
      status: newStatus,
      reviewedById: approved ? operatorId : null,
      reviewedAt: approved ? new Date() : null,
      reviewNote: approved ? reviewNote : null,
      returnNote: approved ? null : reviewNote,
      statusHistory: {
        create: [{
          fromStatus: existing.status,
          toStatus: newStatus,
          operatorId,
          note: approved ? `复核通过：${reviewNote || ''}` : `复核不通过：${reviewNote || ''}`
        }]
      }
    },
    include: {
      machine: true,
      reviewedBy: { select: { id: true, name: true } },
      statusHistory: { orderBy: { createdAt: 'asc' } }
    }
  });

  await prisma.notification.create({
    data: {
      userId: existing.inspectorId,
      type: 'INSPECTION_REVIEWED',
      title: approved ? '巡检复核通过' : '巡检复核不通过',
      content: approved ? '您的巡检记录已通过复核' : `您的巡检记录复核不通过：${reviewNote || ''}`,
      relatedId: existing.id
    }
  });

  res.json(transformInspection(inspection));
});

export default router;
