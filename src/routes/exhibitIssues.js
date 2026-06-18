import { Router } from 'express';
import { prisma } from '../server.js';
import { createAuditLog, extractAuditInfo } from '../utils/audit.js';
import { requireRole } from '../middleware/roleAuth.js';

const router = Router();

// 获取展项问题列表
router.get('/', async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  
  const where = {};
  if (status) {
    where.status = status;
  }
  
  const [total, issues] = await Promise.all([
    prisma.exhibitIssue.count({ where }),
    prisma.exhibitIssue.findMany({
      where,
      include: {
        reporter: { select: { id: true, name: true, role: true } },
        handler: { select: { id: true, name: true } },
        affectedReservations: {
          select: {
            id: true,
            visitorGroup: true,
            startTime: true,
            status: true
          }
        }
      },
      orderBy: { reportedAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    })
  ]);
  
  res.json({
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / parseInt(limit)),
    issues
  });
});

// 获取单个展项问题详情
router.get('/:id', async (req, res) => {
  const issue = await prisma.exhibitIssue.findUnique({
    where: { id: req.params.id },
    include: {
      reporter: { select: { id: true, name: true, role: true, phone: true } },
      handler: { select: { id: true, name: true, phone: true } },
      affectedReservations: {
        include: {
          createdBy: { select: { name: true } }
        }
      },
      auditLogs: {
        orderBy: { createdAt: 'desc' },
        take: 30
      }
    }
  });
  
  if (!issue) {
    return res.status(404).json({ error: '展项问题不存在' });
  }
  
  res.json(issue);
});

// 报告展项停机（展教员或设备工程师）
router.post('/', requireRole('EXHIBIT_EDUCATOR', 'EQUIPMENT_ENGINEER', 'ADMIN'), async (req, res) => {
  const { exhibitId, exhibitName, status, cause, deadline } = req.body;
  
  const userId = req.headers['x-user-id'] || 'system';
  
  const issue = await prisma.exhibitIssue.create({
    data: {
      exhibitId,
      exhibitName,
      status,
      cause,
      reporterId: userId,
      deadline: deadline ? new Date(deadline) : null
    },
    include: {
      reporter: { select: { name: true, role: true } }
    }
  });
  
  await createAuditLog({
    userId,
    action: 'CREATE',
    entityType: 'ExhibitIssue',
    entityId: issue.id,
    description: `报告展项停机: ${exhibitName} - ${cause}`,
    newValue: issue,
    ...extractAuditInfo(req)
  });
  
  res.status(201).json({
    message: '展项问题已报告',
    issue
  });
});

// 分配处理人（设备工程师）
router.patch('/:id/assign-handler', requireRole('EQUIPMENT_ENGINEER', 'ADMIN'), async (req, res) => {
  const { handlerId } = req.body;
  
  const issue = await prisma.exhibitIssue.findUnique({
    where: { id: req.params.id }
  });
  
  if (!issue) {
    return res.status(404).json({ error: '展项问题不存在' });
  }
  
  const userId = req.headers['x-user-id'] || 'system';
  
  const updatedIssue = await prisma.exhibitIssue.update({
    where: { id: req.params.id },
    data: { handlerId },
    include: {
      handler: { select: { name: true, phone: true } }
    }
  });
  
  await createAuditLog({
    userId,
    action: 'ASSIGN',
    entityType: 'ExhibitIssue',
    entityId: issue.id,
    description: `分配处理人: ${updatedIssue.handler?.name}`,
    oldValue: { handlerId: issue.handlerId },
    newValue: { handlerId },
    ...extractAuditInfo(req)
  });
  
  res.json({
    message: '处理人已分配',
    issue: updatedIssue
  });
});

// 更新展项问题状态
router.patch('/:id/status', requireRole('EQUIPMENT_ENGINEER', 'ADMIN'), async (req, res) => {
  const { status, notes, resolution } = req.body;
  
  const issue = await prisma.exhibitIssue.findUnique({
    where: { id: req.params.id }
  });
  
  if (!issue) {
    return res.status(404).json({ error: '展项问题不存在' });
  }
  
  const userId = req.headers['x-user-id'] || 'system';
  
  const updateData = { status };
  if (notes) updateData.notes = notes;
  
  if (['RESOLVED', 'CLOSED', 'NORMAL', 'MAINTENANCE'].includes(status)) {
    updateData.resolvedAt = new Date();
  }
  
  const updatedIssue = await prisma.exhibitIssue.update({
    where: { id: req.params.id },
    data: updateData,
    include: {
      reporter: { select: { name: true } },
      handler: { select: { name: true } }
    }
  });
  
  await createAuditLog({
    userId,
    action: 'STATUS_CHANGE',
    entityType: 'ExhibitIssue',
    entityId: issue.id,
    description: `更新展项状态: ${issue.status} -> ${status}`,
    oldValue: { status: issue.status },
    newValue: { status, notes, resolution },
    ...extractAuditInfo(req)
  });
  
  res.json({
    message: '状态已更新',
    issue: updatedIssue
  });
});

// 添加复盘记录（责任追踪）
router.patch('/:id/review', requireRole('EQUIPMENT_ENGINEER', 'ADMIN'), async (req, res) => {
  const { reviewRecord } = req.body;
  
  if (!reviewRecord) {
    return res.status(400).json({ error: '需要提供复盘记录' });
  }
  
  const issue = await prisma.exhibitIssue.findUnique({
    where: { id: req.params.id }
  });
  
  if (!issue) {
    return res.status(404).json({ error: '展项问题不存在' });
  }
  
  const userId = req.headers['x-user-id'] || 'system';
  
  const updatedIssue = await prisma.exhibitIssue.update({
    where: { id: req.params.id },
    data: { reviewRecord }
  });
  
  await createAuditLog({
    userId,
    action: 'REVIEW',
    entityType: 'ExhibitIssue',
    entityId: issue.id,
    description: '添加复盘记录',
    newValue: { reviewRecord },
    ...extractAuditInfo(req)
  });
  
  res.json({
    message: '复盘记录已添加',
    issue: updatedIssue
  });
});

// 获取受影响的预约（撞档列表）
router.get('/:id/affected-reservations', async (req, res) => {
  const issue = await prisma.exhibitIssue.findUnique({
    where: { id: req.params.id },
    include: {
      affectedReservations: {
        include: {
          createdBy: { select: { name: true, role: true } },
          schedule: {
            select: {
              educator: { select: { name: true } },
              status: true
            }
          }
        },
        orderBy: { startTime: 'asc' }
      }
    }
  });
  
  if (!issue) {
    return res.status(404).json({ error: '展项问题不存在' });
  }
  
  res.json({
    issue: {
      id: issue.id,
      exhibitName: issue.exhibitName,
      status: issue.status
    },
    affectedReservations: issue.affectedReservations
  });
});

export default router;
