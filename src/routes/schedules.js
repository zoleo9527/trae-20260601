import { Router } from 'express';
import { prisma } from '../server.js';
import { createAuditLog, extractAuditInfo } from '../utils/audit.js';
import { requireRole } from '../middleware/roleAuth.js';

const router = Router();

// 获取排班列表
router.get('/', async (req, res) => {
  const { educatorId, status, date, page = 1, limit = 20 } = req.query;
  
  const where = {};
  
  if (educatorId) {
    where.educatorId = educatorId;
  }
  
  if (status) {
    where.status = status;
  }
  
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    where.scheduledStart = { gte: startOfDay, lte: endOfDay };
  }
  
  const [total, schedules] = await Promise.all([
    prisma.schedule.count({ where }),
    prisma.schedule.findMany({
      where,
      include: {
        reservation: {
          select: {
            id: true,
            visitorGroup: true,
            visitorCount: true,
            startTime: true,
            endTime: true,
            status: true,
            contactName: true,
            contactPhone: true
          }
        },
        educator: { select: { id: true, name: true, phone: true, role: true } }
      },
      orderBy: { scheduledStart: 'asc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    })
  ]);
  
  res.json({
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / parseInt(limit)),
    schedules
  });
});

// 获取展教员可用时间（查询某时间段内未被占用的展教员）
router.get('/available-educators', async (req, res) => {
  const { startTime, endTime } = req.query;
  
  if (!startTime || !endTime) {
    return res.status(400).json({ error: '需要提供 startTime 和 endTime' });
  }
  
  const educators = await prisma.user.findMany({
    where: {
      role: 'EXHIBIT_EDUCATOR',
      isActive: true
    }
  });
  
  const bookedSchedules = await prisma.schedule.findMany({
    where: {
      status: { notIn: ['CANCELLED'] },
      OR: [
        {
          scheduledStart: { lte: new Date(startTime) },
          scheduledEnd: { gt: new Date(startTime) }
        },
        {
          scheduledStart: { lt: new Date(endTime) },
          scheduledEnd: { gte: new Date(endTime) }
        },
        {
          scheduledStart: { gte: new Date(startTime) },
          scheduledEnd: { lte: new Date(endTime) }
        }
      ]
    },
    select: {
      educatorId: true,
      scheduledStart: true,
      scheduledEnd: true,
      reservation: { select: { visitorGroup: true } }
    }
  });
  
  const bookedEducatorIds = new Set(bookedSchedules.map(s => s.educatorId).filter(Boolean));
  
  const availableEducators = educators.filter(e => !bookedEducatorIds.has(e.id));
  const busyEducators = educators.filter(e => bookedEducatorIds.has(e.id));
  
  res.json({
    available: availableEducators.map(e => ({ id: e.id, name: e.name, phone: e.phone })),
    busy: busyEducators.map(e => {
      const schedule = bookedSchedules.find(s => s.educatorId === e.id);
      return {
        id: e.id,
        name: e.name,
        phone: e.phone,
        bookedSchedule: {
          startTime: schedule.scheduledStart,
          endTime: schedule.scheduledEnd,
          visitorGroup: schedule.reservation.visitorGroup
        }
      };
    })
  });
});

// 获取单个排班详情
router.get('/:id', async (req, res) => {
  const schedule = await prisma.schedule.findUnique({
    where: { id: req.params.id },
    include: {
      reservation: {
        include: {
          createdBy: { select: { name: true, role: true } },
          exhibitIssue: { select: { exhibitName: true, status: true } }
        }
      },
      educator: { select: { id: true, name: true, phone: true, email: true, role: true } }
    }
  });
  
  if (!schedule) {
    return res.status(404).json({ error: '排班不存在' });
  }
  
  res.json(schedule);
});

// 分配排班人员
router.patch('/:id/assign', requireRole('EXHIBIT_EDUCATOR', 'ADMIN'), async (req, res) => {
  const { educatorId } = req.body;
  
  const schedule = await prisma.schedule.findUnique({
    where: { id: req.params.id }
  });
  
  if (!schedule) {
    return res.status(404).json({ error: '排班不存在' });
  }
  
  const userId = req.headers['x-user-id'] || 'system';
  
  const updatedSchedule = await prisma.schedule.update({
    where: { id: req.params.id },
    data: {
      educatorId,
      assignedAt: new Date(),
      assignedById: userId,
      status: 'ASSIGNED'
    },
    include: {
      educator: { select: { name: true, phone: true } },
      reservation: { select: { visitorGroup: true, startTime: true } }
    }
  });
  
  await createAuditLog({
    userId,
    action: 'ASSIGN',
    entityType: 'Schedule',
    entityId: schedule.id,
    description: `分配排班: ${updatedSchedule.educator?.name}`,
    oldValue: { educatorId: schedule.educatorId },
    newValue: { educatorId, assignedById: userId },
    reservationId: schedule.reservationId,
    ...extractAuditInfo(req)
  });
  
  res.json({
    message: '排班已分配',
    schedule: updatedSchedule
  });
});

// 开始执行排班
router.patch('/:id/start', requireRole('EXHIBIT_EDUCATOR', 'ADMIN'), async (req, res) => {
  const schedule = await prisma.schedule.findUnique({
    where: { id: req.params.id }
  });
  
  if (!schedule) {
    return res.status(404).json({ error: '排班不存在' });
  }
  
  const userId = req.headers['x-user-id'] || 'system';
  
  await prisma.$transaction(async (tx) => {
    await tx.schedule.update({
      where: { id: req.params.id },
      data: {
        status: 'IN_PROGRESS',
        actualStart: new Date()
      }
    });
    
    await tx.reservation.update({
      where: { id: schedule.reservationId },
      data: { status: 'IN_PROGRESS' }
    });
  });
  
  await createAuditLog({
    userId,
    action: 'STATUS_CHANGE',
    entityType: 'Schedule',
    entityId: schedule.id,
    description: '开始执行排班',
    oldValue: { status: schedule.status },
    newValue: { status: 'IN_PROGRESS' },
    reservationId: schedule.reservationId,
    ...extractAuditInfo(req)
  });
  
  res.json({ message: '排班已开始执行' });
});

// 完成排班
router.patch('/:id/complete', requireRole('EXHIBIT_EDUCATOR', 'ADMIN'), async (req, res) => {
  const { completionNotes, handoverNotes } = req.body;
  
  const schedule = await prisma.schedule.findUnique({
    where: { id: req.params.id }
  });
  
  if (!schedule) {
    return res.status(404).json({ error: '排班不存在' });
  }
  
  const userId = req.headers['x-user-id'] || 'system';
  
  await prisma.$transaction(async (tx) => {
    await tx.schedule.update({
      where: { id: req.params.id },
      data: {
        status: 'COMPLETED',
        actualEnd: new Date(),
        completionNotes,
        handoverNotes
      }
    });
    
    await tx.reservation.update({
      where: { id: schedule.reservationId },
      data: { status: 'COMPLETED' }
    });
  });
  
  await createAuditLog({
    userId,
    action: 'STATUS_CHANGE',
    entityType: 'Schedule',
    entityId: schedule.id,
    description: '完成排班',
    oldValue: { status: schedule.status },
    newValue: { status: 'COMPLETED' },
    reservationId: schedule.reservationId,
    ...extractAuditInfo(req)
  });
  
  res.json({ message: '排班已完成' });
});

// 取消排班
router.patch('/:id/cancel', requireRole('EXHIBIT_EDUCATOR', 'ADMIN'), async (req, res) => {
  const { reason } = req.body;
  
  const schedule = await prisma.schedule.findUnique({
    where: { id: req.params.id }
  });
  
  if (!schedule) {
    return res.status(404).json({ error: '排班不存在' });
  }
  
  const userId = req.headers['x-user-id'] || 'system';
  
  await prisma.$transaction(async (tx) => {
    await tx.schedule.update({
      where: { id: req.params.id },
      data: {
        status: 'CANCELLED'
      }
    });
    
    await tx.reservation.update({
      where: { id: schedule.reservationId },
      data: { status: 'CANCELLED' }
    });
  });
  
  await createAuditLog({
    userId,
    action: 'STATUS_CHANGE',
    entityType: 'Schedule',
    entityId: schedule.id,
    description: `取消排班: ${reason || '未说明原因'}`,
    oldValue: { status: schedule.status },
    newValue: { status: 'CANCELLED', reason },
    reservationId: schedule.reservationId,
    ...extractAuditInfo(req)
  });
  
  res.json({ message: '排班已取消' });
});

export default router;
