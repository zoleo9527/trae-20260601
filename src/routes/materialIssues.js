import { Router } from 'express';
import { prisma } from '../server.js';
import { createAuditLog, extractAuditInfo } from '../utils/audit.js';
import { requireRole } from '../middleware/roleAuth.js';

const router = Router();

router.get('/', async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  
  const where = {};
  if (status) {
    where.status = status;
  }
  
  const [total, issues] = await Promise.all([
    prisma.materialIssue.count({ where }),
    prisma.materialIssue.findMany({
      where,
      include: {
        reporter: { select: { id: true, name: true, role: true } },
        handler: { select: { id: true, name: true } }
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

router.get('/:id', async (req, res) => {
  const issue = await prisma.materialIssue.findUnique({
    where: { id: req.params.id },
    include: {
      reporter: { select: { id: true, name: true, role: true, phone: true } },
      handler: { select: { id: true, name: true, phone: true } }
    }
  });
  
  if (!issue) {
    return res.status(404).json({ error: '材料问题不存在' });
  }
  
  res.json(issue);
});

// 报告材料缺货（活动老师）
router.post('/', requireRole('ACTIVITY_TEACHER', 'ADMIN'), async (req, res) => {
  const { materialName, quantity, unit, issueType, deadline, notes } = req.body;
  
  const userId = req.headers['x-user-id'] || 'system';
  
  const issue = await prisma.materialIssue.create({
    data: {
      materialName,
      quantity: parseInt(quantity),
      unit,
      issueType: issueType || 'MATERIAL_OUT_OF_STOCK',
      reporterId: userId,
      deadline: deadline ? new Date(deadline) : null,
      notes
    },
    include: {
      reporter: { select: { name: true, role: true } }
    }
  });
  
  await createAuditLog({
    userId,
    action: 'CREATE',
    entityType: 'MaterialIssue',
    entityId: issue.id,
    description: `报告材料缺货: ${materialName} x ${quantity}${unit || ''}`,
    newValue: issue,
    ...extractAuditInfo(req)
  });
  
  res.status(201).json({
    message: '材料问题已报告',
    issue
  });
});

// 分配处理人
router.patch('/:id/assign-handler', requireRole('ACTIVITY_TEACHER', 'ADMIN'), async (req, res) => {
  const { handlerId } = req.body;
  
  const issue = await prisma.materialIssue.findUnique({
    where: { id: req.params.id }
  });
  
  if (!issue) {
    return res.status(404).json({ error: '材料问题不存在' });
  }
  
  const userId = req.headers['x-user-id'] || 'system';
  
  const updatedIssue = await prisma.materialIssue.update({
    where: { id: req.params.id },
    data: { handlerId },
    include: {
      handler: { select: { name: true, phone: true } }
    }
  });
  
  await createAuditLog({
    userId,
    action: 'ASSIGN',
    entityType: 'MaterialIssue',
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

// 更新状态
router.patch('/:id/status', requireRole('ACTIVITY_TEACHER', 'ADMIN'), async (req, res) => {
  const { status, resolution } = req.body;
  
  const issue = await prisma.materialIssue.findUnique({
    where: { id: req.params.id }
  });
  
  if (!issue) {
    return res.status(404).json({ error: '材料问题不存在' });
  }
  
  const userId = req.headers['x-user-id'] || 'system';
  
  const updateData = { status };
  if (resolution) updateData.resolution = resolution;
  
  if (status === 'RESOLVED' || status === 'CLOSED') {
    updateData.resolvedAt = new Date();
  }
  
  const updatedIssue = await prisma.materialIssue.update({
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
    entityType: 'MaterialIssue',
    entityId: issue.id,
    description: `更新材料问题状态: ${issue.status} -> ${status}`,
    oldValue: { status: issue.status },
    newValue: { status, resolution },
    ...extractAuditInfo(req)
  });
  
  res.json({
    message: '状态已更新',
    issue: updatedIssue
  });
});

export default router;
