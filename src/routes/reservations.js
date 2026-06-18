import { Router } from 'express';
import { prisma } from '../server.js';
import { createAuditLog, extractAuditInfo } from '../utils/audit.js';
import { requireRole } from '../middleware/roleAuth.js';

const router = Router();

// 获取预约列表
router.get('/', async (req, res) => {
  const { status, date, exhibitId, page = 1, limit = 20 } = req.query;
  
  const where = {};
  
  if (status) {
    where.status = status;
  }
  
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    where.OR = [
      { startTime: { gte: startOfDay, lte: endOfDay } },
      { endTime: { gte: startOfDay, lte: endOfDay } }
    ];
  }
  
  if (exhibitId) {
    where.exhibitId = exhibitId;
  }
  
  const [total, reservations] = await Promise.all([
    prisma.reservation.count({ where }),
    prisma.reservation.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
        exhibitIssue: { select: { id: true, exhibitName: true, status: true } },
        schedule: {
          select: {
            id: true,
            educator: { select: { name: true } },
            status: true,
            scheduledStart: true
          }
        }
      },
      orderBy: { startTime: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    })
  ]);
  
  res.json({
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / parseInt(limit)),
    reservations
  });
});

// 获取单个预约详情
router.get('/:id', async (req, res) => {
  const [reservation, auditLogs] = await Promise.all([
    prisma.reservation.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
        exhibitIssue: {
          select: {
            id: true,
            exhibitName: true,
            status: true,
            cause: true,
            reporter: { select: { name: true } }
          }
        },
        schedule: {
          include: {
            educator: { select: { id: true, name: true, phone: true } }
          }
        }
      }
    }),
    prisma.auditLog.findMany({
      where: { reservationId: req.params.id },
      include: {
        user: { select: { name: true, role: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })
  ]);
  
  if (!reservation) {
    return res.status(404).json({ error: '预约不存在' });
  }
  
  const formattedLogs = auditLogs.map(log => ({
    ...log,
    oldValue: log.oldValue ? JSON.parse(log.oldValue) : null,
    newValue: log.newValue ? JSON.parse(log.newValue) : null
  }));
  
  res.json({
    ...reservation,
    auditLogs: formattedLogs
  });
});

// 创建预约（自动检测撞档）
router.post('/', requireRole('EXHIBIT_EDUCATOR', 'ACTIVITY_TEACHER', 'ADMIN'), async (req, res) => {
  const { visitorGroup, visitorCount, contactName, contactPhone, contactEmail, exhibitId, exhibitName, startTime, endTime, notes } = req.body;
  
  const userId = req.headers['x-user-id'] || 'system';
  
  // 检测时间冲突
  const conflictingReservations = await prisma.reservation.findMany({
    where: {
      status: { notIn: ['CANCELLED', 'REJECTED'] },
      OR: [
        {
          startTime: { lte: new Date(startTime) },
          endTime: { gt: new Date(startTime) }
        },
        {
          startTime: { lt: new Date(endTime) },
          endTime: { gte: new Date(endTime) }
        },
        {
          startTime: { gte: new Date(startTime) },
          endTime: { lte: new Date(endTime) }
        }
      ]
    }
  });
  
  let status = 'PENDING_CONFIRM';
  let conflictInfo = null;
  
  if (conflictingReservations.length > 0) {
    status = 'CONFLICT_DETECTED';
    conflictInfo = conflictingReservations.map(r => ({
      id: r.id,
      visitorGroup: r.visitorGroup,
      startTime: r.startTime,
      endTime: r.endTime
    }));
  }
  
  // 检查关联展项是否停机
  let exhibitIssueId = null;
  if (exhibitId) {
    const activeIssue = await prisma.exhibitIssue.findFirst({
      where: {
        exhibitId,
        status: { in: ['SHUTDOWN_PLANNED', 'SHUTDOWN_EMERGENCY', 'MAINTENANCE', 'REPAIRING'] }
      }
    });
    
    if (activeIssue) {
      exhibitIssueId = activeIssue.id;
    }
  }
  
  const reservation = await prisma.reservation.create({
    data: {
      visitorGroup,
      visitorCount: parseInt(visitorCount),
      contactName,
      contactPhone,
      contactEmail,
      exhibitId,
      exhibitName,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      status,
      createdById: userId,
      exhibitIssueId,
      notes
    },
    include: {
      createdBy: { select: { name: true, role: true } },
      exhibitIssue: { select: { id: true, exhibitName: true, status: true } }
    }
  });
  
  await createAuditLog({
    userId,
    action: 'CREATE',
    entityType: 'Reservation',
    entityId: reservation.id,
    description: `创建预约: ${visitorGroup} (${startTime} - ${endTime})`,
    newValue: reservation,
    reservationId: reservation.id,
    ...extractAuditInfo(req)
  });
  
  res.status(201).json({
    ...reservation,
    conflicts: conflictInfo,
    message: status === 'CONFLICT_DETECTED' 
      ? '检测到时间冲突，需要管理员处理'
      : '预约创建成功'
  });
});

// 确认预约（自动创建排班）
router.patch('/:id/confirm', requireRole('EXHIBIT_EDUCATOR', 'ADMIN'), async (req, res) => {
  const reservation = await prisma.reservation.findUnique({
    where: { id: req.params.id }
  });
  
  if (!reservation) {
    return res.status(404).json({ error: '预约不存在' });
  }
  
  if (reservation.status !== 'PENDING_CONFIRM' && reservation.status !== 'CONFLICT_DETECTED') {
    return res.status(400).json({ error: '当前状态不能确认' });
  }
  
  const userId = req.headers['x-user-id'] || 'system';
  
  // 开启事务：更新预约状态 + 自动创建排班
  const result = await prisma.$transaction(async (tx) => {
    const updatedReservation = await tx.reservation.update({
      where: { id: req.params.id },
      data: { status: 'CONFIRMED' }
    });
    
    // 自动创建排班记录
    const schedule = await tx.schedule.create({
      data: {
        reservationId: reservation.id,
        scheduledStart: reservation.startTime,
        scheduledEnd: reservation.endTime,
        status: 'PENDING'
      }
    });
    
    return { updatedReservation, schedule };
  });
  
  await createAuditLog({
    userId,
    action: 'STATUS_CHANGE',
    entityType: 'Reservation',
    entityId: reservation.id,
    description: `确认预约并创建排班`,
    oldValue: { status: reservation.status },
    newValue: { status: 'CONFIRMED', scheduleId: result.schedule.id },
    reservationId: reservation.id,
    ...extractAuditInfo(req)
  });
  
  res.json({
    message: '预约已确认，排班已自动创建',
    reservation: result.updatedReservation,
    schedule: result.schedule
  });
});

// 退回预约（带原因）
router.patch('/:id/reject', requireRole('EXHIBIT_EDUCATOR', 'ACTIVITY_TEACHER', 'ADMIN'), async (req, res) => {
  const { reason } = req.body;
  
  if (!reason) {
    return res.status(400).json({ error: '必须提供退回原因' });
  }
  
  const reservation = await prisma.reservation.findUnique({
    where: { id: req.params.id }
  });
  
  if (!reservation) {
    return res.status(404).json({ error: '预约不存在' });
  }
  
  const userId = req.headers['x-user-id'] || 'system';
  
  const updatedReservation = await prisma.reservation.update({
    where: { id: req.params.id },
    data: {
      status: 'REJECTED',
      rejectionReason: reason,
      rejectedAt: new Date(),
      rejectedById: userId,
      needsReview: true,
      reviewReason: `退回原因: ${reason}`
    }
  });
  
  await createAuditLog({
    userId,
    action: 'STATUS_CHANGE',
    entityType: 'Reservation',
    entityId: reservation.id,
    description: `退回预约: ${reason}`,
    oldValue: { status: reservation.status },
    newValue: { status: 'REJECTED', reason },
    reservationId: reservation.id,
    ...extractAuditInfo(req)
  });
  
  res.json({
    message: '预约已退回',
    reservation: updatedReservation
  });
});

// 标记预约完成
router.patch('/:id/complete', requireRole('EXHIBIT_EDUCATOR', 'ADMIN'), async (req, res) => {
  const { completionNotes } = req.body;
  
  const reservation = await prisma.reservation.findUnique({
    where: { id: req.params.id },
    include: { schedule: true }
  });
  
  if (!reservation) {
    return res.status(404).json({ error: '预约不存在' });
  }
  
  const userId = req.headers['x-user-id'] || 'system';
  
  await prisma.$transaction(async (tx) => {
    await tx.reservation.update({
      where: { id: req.params.id },
      data: { status: 'COMPLETED' }
    });
    
    if (reservation.schedule) {
      await tx.schedule.update({
        where: { id: reservation.schedule.id },
        data: {
          status: 'COMPLETED',
          actualEnd: new Date(),
          completionNotes
        }
      });
    }
  });
  
  await createAuditLog({
    userId,
    action: 'STATUS_CHANGE',
    entityType: 'Reservation',
    entityId: reservation.id,
    description: '完成预约讲解',
    oldValue: { status: reservation.status },
    newValue: { status: 'COMPLETED' },
    reservationId: reservation.id,
    ...extractAuditInfo(req)
  });
  
  res.json({ message: '预约已完成' });
});

// 复盘标记（用于责任追踪）
router.patch('/:id/mark-review', requireRole('EQUIPMENT_ENGINEER', 'ADMIN'), async (req, res) => {
  const { reviewReason, markForReview = true } = req.body;
  
  const reservation = await prisma.reservation.findUnique({
    where: { id: req.params.id }
  });
  
  if (!reservation) {
    return res.status(404).json({ error: '预约不存在' });
  }
  
  const userId = req.headers['x-user-id'] || 'system';
  
  const updatedReservation = await prisma.reservation.update({
    where: { id: req.params.id },
    data: {
      needsReview: markForReview,
      reviewReason: markForReview ? reviewReason : null
    }
  });
  
  await createAuditLog({
    userId,
    action: 'REVIEW',
    entityType: 'Reservation',
    entityId: reservation.id,
    description: `复盘标记: ${reviewReason}`,
    oldValue: { needsReview: reservation.needsReview },
    newValue: { needsReview: markForReview, reason: reviewReason },
    reservationId: reservation.id,
    ...extractAuditInfo(req)
  });
  
  res.json({
    message: markForReview ? '已标记待复盘' : '已取消复盘标记',
    reservation: updatedReservation
  });
});

export default router;
