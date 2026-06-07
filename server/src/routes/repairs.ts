import { Router } from 'express';
import { prisma } from '../index.js';

const router = Router();

function parseJSON(str: string | null | undefined) {
  if (!str) return [];
  try { return JSON.parse(str); } catch { return []; }
}

function serializeJSON(obj: any) {
  if (obj === null || obj === undefined) return '[]';
  if (typeof obj === 'string') return obj;
  return JSON.stringify(obj);
}

function transformRepair(item: any) {
  return {
    ...item,
    partsUsed: parseJSON(item.partsUsed)
  };
}

router.get('/', async (req, res) => {
  const { status, machineId, assignedToId, creatorId } = req.query;
  const repairs = await prisma.repairOrder.findMany({
    where: {
      ...(status && { status: status as string }),
      ...(machineId && { machineId: machineId as string }),
      ...(assignedToId && { assignedToId: assignedToId as string }),
      ...(creatorId && { creatorId: creatorId as string })
    },
    include: {
      machine: true,
      creator: { select: { id: true, name: true, role: true } },
      assignedTo: { select: { id: true, name: true, role: true } },
      reviewedBy: { select: { id: true, name: true, role: true } },
      inspection: {
        select: {
          id: true,
          overallNote: true,
          inspector: { select: { id: true, name: true } }
        }
      },
      statusHistory: {
        orderBy: { createdAt: 'asc' },
        include: {
          operator: { select: { id: true, name: true, role: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(repairs.map(transformRepair));
});

router.get('/:id', async (req, res) => {
  const repair = await prisma.repairOrder.findUnique({
    where: { id: req.params.id },
    include: {
      machine: true,
      creator: { select: { id: true, name: true, role: true } },
      assignedTo: { select: { id: true, name: true, role: true } },
      reviewedBy: { select: { id: true, name: true, role: true } },
      inspection: {
        include: {
          machine: true,
          inspector: { select: { id: true, name: true } },
          statusHistory: true
        }
      },
      statusHistory: {
        orderBy: { createdAt: 'asc' },
        include: {
          operator: { select: { id: true, name: true, role: true } }
        }
      }
    }
  });
  if (!repair) return res.status(404).json({ error: '维修工单不存在' });
  res.json(transformRepair(repair));
});

router.post('/', async (req, res) => {
  const { machineId, creatorId, inspectionId, title, description, priority, carryOverInspectionNote = true } = req.body;
  
  let inspectionNoteSnapshot: string | null = null;
  if (inspectionId && carryOverInspectionNote) {
    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      select: { overallNote: true }
    });
    inspectionNoteSnapshot = inspection?.overallNote || null;
  }

  const repair = await prisma.repairOrder.create({
    data: {
      machineId,
      creatorId,
      inspectionId,
      title,
      description,
      priority,
      carryOverInspectionNote,
      inspectionNoteSnapshot,
      partsUsed: '[]',
      status: 'DRAFT',
      statusHistory: {
        create: [{ toStatus: 'DRAFT', operatorId: creatorId, note: '创建维修工单' }]
      }
    },
    include: {
      machine: true,
      creator: { select: { id: true, name: true } }
    }
  });
  res.status(201).json(transformRepair(repair));
});

router.put('/:id/submit', async (req, res) => {
  const { operatorId } = req.body;
  const existing = await prisma.repairOrder.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: '工单不存在' });

  const repair = await prisma.repairOrder.update({
    where: { id: req.params.id },
    data: {
      status: 'PENDING_APPROVAL',
      statusHistory: {
        create: [{
          fromStatus: existing.status,
          toStatus: 'PENDING_APPROVAL',
          operatorId,
          note: '提交审批'
        }]
      }
    },
    include: { statusHistory: { orderBy: { createdAt: 'asc' } } }
  });
  res.json(transformRepair(repair));
});

router.put('/:id/approve', async (req, res) => {
  const { operatorId } = req.body;
  const existing = await prisma.repairOrder.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: '工单不存在' });

  const repair = await prisma.repairOrder.update({
    where: { id: req.params.id },
    data: {
      status: 'APPROVED',
      statusHistory: {
        create: [{
          fromStatus: existing.status,
          toStatus: 'APPROVED',
          operatorId,
          note: '审批通过'
        }]
      }
    },
    include: { statusHistory: { orderBy: { createdAt: 'asc' } } }
  });

  await prisma.machine.update({
    where: { id: existing.machineId },
    data: { status: 'MAINTENANCE' }
  });

  res.json(transformRepair(repair));
});

router.put('/:id/assign', async (req, res) => {
  const { operatorId, assignedToId } = req.body;
  const existing = await prisma.repairOrder.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: '工单不存在' });

  const repair = await prisma.repairOrder.update({
    where: { id: req.params.id },
    data: {
      status: 'ASSIGNED',
      assignedToId,
      assignedAt: new Date(),
      statusHistory: {
        create: [{
          fromStatus: existing.status,
          toStatus: 'ASSIGNED',
          operatorId,
          note: '指派维修人员'
        }]
      }
    },
    include: {
      assignedTo: { select: { id: true, name: true } },
      statusHistory: { orderBy: { createdAt: 'asc' } }
    }
  });

  await prisma.notification.create({
    data: {
      userId: assignedToId,
      type: 'REPAIR_ASSIGNED',
      title: '新的维修任务',
      content: `您有新的维修任务：${existing.title}`,
      relatedId: existing.id
    }
  });

  res.json(transformRepair(repair));
});

router.put('/:id/start', async (req, res) => {
  const { operatorId } = req.body;
  const existing = await prisma.repairOrder.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: '工单不存在' });

  const repair = await prisma.repairOrder.update({
    where: { id: req.params.id },
    data: {
      status: 'IN_PROGRESS',
      statusHistory: {
        create: [{
          fromStatus: existing.status,
          toStatus: 'IN_PROGRESS',
          operatorId,
          note: '开始维修'
        }]
      }
    },
    include: { statusHistory: { orderBy: { createdAt: 'asc' } } }
  });
  res.json(transformRepair(repair));
});

router.put('/:id/complete', async (req, res) => {
  const { operatorId, repairNote, partsUsed, laborHours } = req.body;
  const existing = await prisma.repairOrder.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: '工单不存在' });

  const repair = await prisma.repairOrder.update({
    where: { id: req.params.id },
    data: {
      status: 'COMPLETED',
      repairedAt: new Date(),
      repairNote,
      partsUsed: serializeJSON(partsUsed),
      laborHours,
      statusHistory: {
        create: [{
          fromStatus: existing.status,
          toStatus: 'COMPLETED',
          operatorId,
          note: '维修完成'
        }]
      }
    },
    include: { statusHistory: { orderBy: { createdAt: 'asc' } } }
  });

  await prisma.notification.create({
    data: {
      userId: existing.creatorId,
      type: 'REPAIR_COMPLETED',
      title: '维修完成',
      content: `工单 ${existing.title} 已维修完成，请复核`,
      relatedId: existing.id
    }
  });

  res.json(transformRepair(repair));
});

router.put('/:id/return', async (req, res) => {
  const { operatorId, returnNote } = req.body;
  const existing = await prisma.repairOrder.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: '工单不存在' });

  const repair = await prisma.repairOrder.update({
    where: { id: req.params.id },
    data: {
      status: 'RETURNED',
      returnNote,
      statusHistory: {
        create: [{
          fromStatus: existing.status,
          toStatus: 'RETURNED',
          operatorId,
          note: returnNote || '退回'
        }]
      }
    },
    include: { statusHistory: { orderBy: { createdAt: 'asc' } } }
  });

  if (existing.assignedToId) {
    await prisma.notification.create({
      data: {
        userId: existing.assignedToId,
        type: 'REPAIR_RETURNED',
        title: '维修工单被退回',
        content: `工单 ${existing.title} 被退回：${returnNote || ''}`,
        relatedId: existing.id
      }
    });
  }

  res.json(transformRepair(repair));
});

router.put('/:id/review', async (req, res) => {
  const { operatorId, reviewNote, approved } = req.body;
  const existing = await prisma.repairOrder.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: '工单不存在' });

  const newStatus = approved ? 'REVIEWED' : 'REOPENED';
  const repair = await prisma.repairOrder.update({
    where: { id: req.params.id },
    data: {
      status: newStatus,
      reviewedById: approved ? operatorId : null,
      reviewedAt: approved ? new Date() : null,
      reviewNote,
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
      reviewedBy: { select: { id: true, name: true } },
      statusHistory: { orderBy: { createdAt: 'asc' } }
    }
  });

  if (approved) {
    await prisma.machine.update({
      where: { id: existing.machineId },
      data: { status: 'IDLE' }
    });
  }

  if (existing.assignedToId) {
    await prisma.notification.create({
      data: {
        userId: existing.assignedToId,
        type: 'REPAIR_REVIEWED',
        title: approved ? '维修复核通过' : '维修复核不通过',
        content: approved ? '您的维修工单已通过复核' : `工单复核不通过：${reviewNote || ''}`,
        relatedId: existing.id
      }
    });
  }

  res.json(transformRepair(repair));
});

export default router;
