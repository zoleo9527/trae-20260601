import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const Role = {
  BREW_MASTER: 'BREW_MASTER',
  PACKAGING_SUPERVISOR: 'PACKAGING_SUPERVISOR',
  SALES_BACKOFFICE: 'SALES_BACKOFFICE'
};

const FillingStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  IN_PRODUCTION: 'IN_PRODUCTION',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED'
};

const PackagingStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  ISSUED: 'ISSUED',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED'
};

const NotificationType = {
  STATUS_CHANGED: 'STATUS_CHANGED',
  COMMENT_ADDED: 'COMMENT_ADDED',
  REJECTED: 'REJECTED',
  APPROVED: 'APPROVED',
  RESUBMITTED: 'RESUBMITTED'
};

const prisma = new PrismaClient();
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

function parseChanges(item) {
  if (item && item.changes && typeof item.changes === 'string') {
    try {
      return { ...item, changes: JSON.parse(item.changes) };
    } catch (e) {
      return item;
    }
  }
  return item;
}

function stringifyChanges(data) {
  if (data && data.changes && typeof data.changes === 'object') {
    return { ...data, changes: JSON.stringify(data.changes) };
  }
  return data;
}

async function createNotification(userId, type, title, message, relatedType, relatedId) {
  return prisma.notification.create({
    data: { userId, type, title, message, relatedType, relatedId }
  });
}

async function notifyRole(role, type, title, message, relatedType, relatedId, excludeUserId = null) {
  const users = await prisma.user.findMany({
    where: { role, id: excludeUserId ? { not: excludeUserId } : undefined }
  });
  return Promise.all(users.map(u => createNotification(u.id, type, title, message, relatedType, relatedId)));
}

app.get('/api/users', async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

app.get('/api/users/:id', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: parseInt(req.params.id) } });
  res.json(user);
});

app.get('/api/notifications/:userId', async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: parseInt(req.params.userId) },
    orderBy: { createdAt: 'desc' },
    take: 20
  });
  res.json(notifications);
});

app.put('/api/notifications/:id/read', async (req, res) => {
  const notification = await prisma.notification.update({
    where: { id: parseInt(req.params.id) },
    data: { read: true }
  });
  res.json(notification);
});

app.get('/api/filling-schedules/available', async (req, res) => {
  const schedules = await prisma.fillingSchedule.findMany({
    where: {
      status: FillingStatus.APPROVED
    },
    include: {
      createdBy: true,
      packagingRequisitions: { include: { history: true } },
      history: { include: { createdBy: true }, orderBy: { createdAt: 'desc' } }
    },
    orderBy: { createdAt: 'desc' }
  });

  const result = schedules.map(s => {
    const lastAdjustment = s.history.find(h => h.action === '排产调整' || h.action === '补录后重提');
    const hasChangeNotification = s.packagingRequisitions.some(r =>
      r.history.some(h => h.scheduleChangeNotified)
    );

    return {
      id: s.id,
      batchNo: s.batchNo,
      productName: s.productName,
      beerType: s.beerType,
      volume: s.volume,
      fillingDate: s.fillingDate,
      targetBottles: s.targetBottles,
      status: s.status,
      currentHandler: s.currentHandler,
      createdBy: s.createdBy,
      lastAdjustment: lastAdjustment ? {
        action: lastAdjustment.action,
        remark: lastAdjustment.remark,
        changes: lastAdjustment.changes ? JSON.parse(lastAdjustment.changes) : null,
        createdAt: lastAdjustment.createdAt,
        createdBy: lastAdjustment.createdBy
      } : null,
      hasChangeNotification
    };
  });

  res.json(result);
});

app.get('/api/filling-schedules', async (req, res) => {
  const schedules = await prisma.fillingSchedule.findMany({
    include: { createdBy: true, history: { include: { createdBy: true }, orderBy: { createdAt: 'desc' } } },
    orderBy: { createdAt: 'desc' }
  });
  const parsed = schedules.map(s => ({
    ...s,
    history: s.history.map(h => parseChanges(h))
  }));
  res.json(parsed);
});

app.get('/api/filling-schedules/:id', async (req, res) => {
  const schedule = await prisma.fillingSchedule.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      createdBy: true,
      history: { include: { createdBy: true }, orderBy: { createdAt: 'desc' } },
      packagingRequisitions: { include: { createdBy: true, history: { include: { createdBy: true } } } }
    }
  });
  const parsed = {
    ...schedule,
    history: schedule.history.map(h => parseChanges(h)),
    packagingRequisitions: schedule.packagingRequisitions.map(r => ({
      ...r,
      history: r.history.map(h => parseChanges(h))
    }))
  };
  res.json(parsed);
});

app.post('/api/filling-schedules', async (req, res) => {
  const { productName, beerType, volume, fillingDate, targetBottles, createdById } = req.body;
  const batchNo = `FILL-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(Date.now()).slice(-4)}`;

  const schedule = await prisma.fillingSchedule.create({
    data: {
      batchNo, productName, beerType, volume,
      fillingDate: new Date(fillingDate), targetBottles,
      status: FillingStatus.DRAFT,
      currentHandler: Role.BREW_MASTER,
      createdById
    }
  });

  await prisma.fillingScheduleHistory.create({
    data: {
      scheduleId: schedule.id,
      action: '创建灌装排产',
      remark: '新建灌装排产单',
      newStatus: FillingStatus.DRAFT,
      createdById
    }
  });

  res.json(schedule);
});

app.put('/api/filling-schedules/:id/submit', async (req, res) => {
  const { userId, remark } = req.body;
  const id = parseInt(req.params.id);

  const schedule = await prisma.fillingSchedule.update({
    where: { id },
    data: { status: FillingStatus.SUBMITTED, currentHandler: Role.SALES_BACKOFFICE }
  });

  await prisma.fillingScheduleHistory.create({
    data: {
      scheduleId: id, action: '提交审核',
      oldStatus: FillingStatus.DRAFT, newStatus: FillingStatus.SUBMITTED,
      remark: remark || '提交销售内勤复核', createdById: userId
    }
  });

  await notifyRole(Role.SALES_BACKOFFICE, NotificationType.STATUS_CHANGED,
    `灌装排产 ${schedule.batchNo} 待复核`,
    `酿酒师提交了灌装排产 ${schedule.productName}，请及时复核`,
    'FillingSchedule', id, userId);

  res.json(schedule);
});

app.put('/api/filling-schedules/:id/approve', async (req, res) => {
  const { userId, remark } = req.body;
  const id = parseInt(req.params.id);

  const schedule = await prisma.fillingSchedule.update({
    where: { id },
    data: { status: FillingStatus.APPROVED, currentHandler: Role.PACKAGING_SUPERVISOR }
  });

  await prisma.fillingScheduleHistory.create({
    data: {
      scheduleId: id, action: '复核通过',
      oldStatus: FillingStatus.SUBMITTED, newStatus: FillingStatus.APPROVED,
      remark: remark || '销售内勤复核通过', createdById: userId
    }
  });

  await notifyRole(Role.PACKAGING_SUPERVISOR, NotificationType.APPROVED,
    `灌装排产 ${schedule.batchNo} 已通过`,
    `灌装排产 ${schedule.productName} 复核通过，可安排包装领用`,
    'FillingSchedule', id);

  await notifyRole(Role.BREW_MASTER, NotificationType.APPROVED,
    `灌装排产 ${schedule.batchNo} 已通过`,
    `您提交的灌装排产 ${schedule.productName} 已复核通过`,
    'FillingSchedule', id, userId);

  res.json(schedule);
});

app.put('/api/filling-schedules/:id/reject', async (req, res) => {
  const { userId, remark } = req.body;
  const id = parseInt(req.params.id);

  if (!remark || !remark.trim()) {
    return res.status(400).json({ error: '驳回原因不能为空' });
  }

  const schedule = await prisma.fillingSchedule.update({
    where: { id },
    data: { status: FillingStatus.REJECTED, currentHandler: Role.BREW_MASTER }
  });

  await prisma.fillingScheduleHistory.create({
    data: {
      scheduleId: id, action: '驳回',
      oldStatus: FillingStatus.SUBMITTED, newStatus: FillingStatus.REJECTED,
      remark: remark.trim(), createdById: userId
    }
  });

  await notifyRole(Role.BREW_MASTER, NotificationType.REJECTED,
    `灌装排产 ${schedule.batchNo} 被驳回`,
    `灌装排产 ${schedule.productName} 被驳回：${remark.trim()}`,
    'FillingSchedule', id, userId);

  res.json(schedule);
});

app.put('/api/filling-schedules/:id/resubmit', async (req, res) => {
  const { userId, remark, ...updates } = req.body;
  const id = parseInt(req.params.id);

  const oldSchedule = await prisma.fillingSchedule.findUnique({ where: { id } });

  const schedule = await prisma.fillingSchedule.update({
    where: { id },
    data: {
      ...updates,
      fillingDate: updates.fillingDate ? new Date(updates.fillingDate) : undefined,
      status: FillingStatus.SUBMITTED,
      currentHandler: Role.SALES_BACKOFFICE
    }
  });

  const changes = {};
  Object.keys(updates).forEach(key => {
    if (oldSchedule[key] !== schedule[key]) {
      changes[key] = { old: oldSchedule[key], new: schedule[key] };
    }
  });

  await prisma.fillingScheduleHistory.create({
    data: stringifyChanges({
      scheduleId: id, action: '补录后重提',
      oldStatus: FillingStatus.REJECTED, newStatus: FillingStatus.SUBMITTED,
      remark: remark || '修改后重新提交复核', changes, createdById: userId
    })
  });

  const relatedRequisitions = await prisma.packagingRequisition.findMany({ where: { scheduleId: id } });
  for (const req of relatedRequisitions) {
    await prisma.packagingRequisitionHistory.create({
      data: {
        requisitionId: req.id, action: '关联排产变更',
        remark: `关联灌装排产已变更，请确认是否影响包装需求`,
        scheduleChangeNotified: true, createdById: userId
      }
    });
  }

  await notifyRole(Role.SALES_BACKOFFICE, NotificationType.RESUBMITTED,
    `灌装排产 ${schedule.batchNo} 已重提`,
    `灌装排产 ${schedule.productName} 修改后重新提交，请复核`,
    'FillingSchedule', id, userId);

  if (relatedRequisitions.length > 0) {
    await notifyRole(Role.PACKAGING_SUPERVISOR, NotificationType.STATUS_CHANGED,
      `关联排产 ${schedule.batchNo} 已变更`,
      `您有 ${relatedRequisitions.length} 个包装领用关联的灌装排产已变更，请确认`,
      'FillingSchedule', id);
  }

  res.json(schedule);
});

app.put('/api/filling-schedules/:id/start-production', async (req, res) => {
  const { userId, remark } = req.body;
  const id = parseInt(req.params.id);

  const schedule = await prisma.fillingSchedule.update({
    where: { id },
    data: { status: FillingStatus.IN_PRODUCTION, currentHandler: Role.BREW_MASTER }
  });

  await prisma.fillingScheduleHistory.create({
    data: {
      scheduleId: id, action: '开始生产',
      oldStatus: FillingStatus.APPROVED, newStatus: FillingStatus.IN_PRODUCTION,
      remark: remark || '开始灌装生产', createdById: userId
    }
  });

  res.json(schedule);
});

app.put('/api/filling-schedules/:id/complete', async (req, res) => {
  const { userId, remark } = req.body;
  const id = parseInt(req.params.id);

  const schedule = await prisma.fillingSchedule.update({
    where: { id },
    data: { status: FillingStatus.COMPLETED, currentHandler: Role.SALES_BACKOFFICE }
  });

  await prisma.fillingScheduleHistory.create({
    data: {
      scheduleId: id, action: '灌装完成',
      oldStatus: FillingStatus.IN_PRODUCTION, newStatus: FillingStatus.COMPLETED,
      remark: remark || '灌装生产完成', createdById: userId
    }
  });

  await notifyRole(Role.SALES_BACKOFFICE, NotificationType.STATUS_CHANGED,
    `灌装排产 ${schedule.batchNo} 已完成`,
    `灌装排产 ${schedule.productName} 生产完成，可安排发货`,
    'FillingSchedule', id);

  res.json(schedule);
});

app.get('/api/packaging-requisitions', async (req, res) => {
  const requisitions = await prisma.packagingRequisition.findMany({
    include: {
      createdBy: true,
      schedule: true,
      history: { include: { createdBy: true }, orderBy: { createdAt: 'desc' } }
    },
    orderBy: { createdAt: 'desc' }
  });
  const parsed = requisitions.map(r => {
    const changeNotifications = r.history.filter(h => h.scheduleChangeNotified);
    const pendingChanges = changeNotifications.filter(h => !h.changeHandled);
    const confirmedChanges = changeNotifications.filter(h => h.changeHandled);
    return {
      ...r,
      history: r.history.map(h => parseChanges(h)),
      pendingChangeCount: pendingChanges.length,
      hasPendingChange: pendingChanges.length > 0,
      hasConfirmedChange: confirmedChanges.length > 0
    };
  });
  res.json(parsed);
});

app.get('/api/packaging-requisitions/:id', async (req, res) => {
  const requisition = await prisma.packagingRequisition.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      createdBy: true,
      schedule: { include: { history: { include: { createdBy: true } } } },
      history: { include: { createdBy: true }, orderBy: { createdAt: 'desc' } }
    }
  });
  const changeNotifications = requisition.history.filter(h => h.scheduleChangeNotified);
  const pendingChanges = changeNotifications.filter(h => !h.changeHandled);
  const confirmedChanges = changeNotifications.filter(h => h.changeHandled);
  const parsed = {
    ...requisition,
    history: requisition.history.map(h => parseChanges(h)),
    schedule: {
      ...requisition.schedule,
      history: requisition.schedule.history.map(h => parseChanges(h))
    },
    pendingChangeCount: pendingChanges.length,
    hasPendingChange: pendingChanges.length > 0,
    hasConfirmedChange: confirmedChanges.length > 0,
    pendingChanges: pendingChanges,
    confirmedChanges: confirmedChanges
  };
  res.json(parsed);
});

app.post('/api/packaging-requisitions', async (req, res) => {
  const { scheduleId, bottleType, bottleCount, labelType, cartonType, requiredDate, createdById } = req.body;

  const schedule = await prisma.fillingSchedule.findUnique({ where: { id: parseInt(scheduleId) } });
  if (!schedule) {
    return res.status(400).json({ error: '关联的灌装排产不存在' });
  }

  const statusLabel = {
    DRAFT: '草稿', SUBMITTED: '待复核', REJECTED: '已驳回',
    APPROVED: '已通过', IN_PRODUCTION: '生产中', COMPLETED: '已完成'
  };

  if (schedule.status !== FillingStatus.APPROVED) {
    return res.status(400).json({
      error: `灌装排产 ${schedule.batchNo} 当前状态为「${statusLabel[schedule.status]}」，仅允许从已通过的排产发起领用`
    });
  }

  const requisitionNo = `PACK-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(Date.now()).slice(-4)}`;

  const requisition = await prisma.packagingRequisition.create({
    data: {
      requisitionNo, scheduleId: parseInt(scheduleId), bottleType, bottleCount: parseInt(bottleCount),
      labelType, cartonType, requiredDate: new Date(requiredDate),
      status: PackagingStatus.PENDING, currentHandler: Role.SALES_BACKOFFICE,
      createdById: parseInt(createdById)
    }
  });

  await prisma.packagingRequisitionHistory.create({
    data: {
      requisitionId: requisition.id, action: '创建包装领用',
      remark: '新建包装领用申请', newStatus: PackagingStatus.PENDING, createdById: parseInt(createdById)
    }
  });

  await notifyRole(Role.SALES_BACKOFFICE, NotificationType.STATUS_CHANGED,
    `包装领用 ${requisitionNo} 待审核`,
    `新的包装领用申请已提交，请及时审核`,
    'PackagingRequisition', requisition.id);

  res.json(requisition);
});

app.put('/api/packaging-requisitions/:id/approve', async (req, res) => {
  const { userId, remark } = req.body;
  const id = parseInt(req.params.id);

  const requisition = await prisma.packagingRequisition.update({
    where: { id },
    data: { status: PackagingStatus.APPROVED, currentHandler: Role.BREW_MASTER }
  });

  await prisma.packagingRequisitionHistory.create({
    data: {
      requisitionId: id, action: '审核通过',
      oldStatus: PackagingStatus.PENDING, newStatus: PackagingStatus.APPROVED,
      remark: remark || '销售内勤审核通过', createdById: userId
    }
  });

  await notifyRole(Role.BREW_MASTER, NotificationType.APPROVED,
    `包装领用 ${requisition.requisitionNo} 已通过`,
    `包装领用审核通过，可安排发放`,
    'PackagingRequisition', id);

  await notifyRole(Role.PACKAGING_SUPERVISOR, NotificationType.APPROVED,
    `包装领用 ${requisition.requisitionNo} 已通过`,
    `您提交的包装领用已审核通过`,
    'PackagingRequisition', id, userId);

  res.json(requisition);
});

app.put('/api/packaging-requisitions/:id/reject', async (req, res) => {
  const { userId, remark } = req.body;
  const id = parseInt(req.params.id);

  if (!remark || !remark.trim()) {
    return res.status(400).json({ error: '退回原因不能为空' });
  }

  const requisition = await prisma.packagingRequisition.update({
    where: { id },
    data: { status: PackagingStatus.REJECTED, currentHandler: Role.PACKAGING_SUPERVISOR }
  });

  await prisma.packagingRequisitionHistory.create({
    data: {
      requisitionId: id, action: '退回',
      oldStatus: PackagingStatus.PENDING, newStatus: PackagingStatus.REJECTED,
      remark: remark.trim(), createdById: userId
    }
  });

  await notifyRole(Role.PACKAGING_SUPERVISOR, NotificationType.REJECTED,
    `包装领用 ${requisition.requisitionNo} 被退回`,
    `包装领用被退回：${remark.trim()}`,
    'PackagingRequisition', id, userId);

  res.json(requisition);
});

app.put('/api/packaging-requisitions/:id/resubmit', async (req, res) => {
  const { userId, remark, ...updates } = req.body;
  const id = parseInt(req.params.id);

  const old = await prisma.packagingRequisition.findUnique({ where: { id } });

  const requisition = await prisma.packagingRequisition.update({
    where: { id },
    data: {
      ...updates,
      requiredDate: updates.requiredDate ? new Date(updates.requiredDate) : undefined,
      bottleCount: updates.bottleCount ? parseInt(updates.bottleCount) : undefined,
      status: PackagingStatus.PENDING, currentHandler: Role.SALES_BACKOFFICE
    }
  });

  const changes = {};
  Object.keys(updates).forEach(key => {
    if (old[key] !== requisition[key]) {
      changes[key] = { old: old[key], new: requisition[key] };
    }
  });

  await prisma.packagingRequisitionHistory.create({
    data: stringifyChanges({
      requisitionId: id, action: '补录后重提',
      oldStatus: PackagingStatus.REJECTED, newStatus: PackagingStatus.PENDING,
      remark: remark || '修改后重新提交', changes, createdById: userId
    })
  });

  await notifyRole(Role.SALES_BACKOFFICE, NotificationType.RESUBMITTED,
    `包装领用 ${requisition.requisitionNo} 已重提`,
    `包装领用修改后重新提交，请审核`,
    'PackagingRequisition', id, userId);

  res.json(requisition);
});

app.put('/api/packaging-requisitions/:id/issue', async (req, res) => {
  const { userId, remark } = req.body;
  const id = parseInt(req.params.id);

  const requisition = await prisma.packagingRequisition.update({
    where: { id },
    data: { status: PackagingStatus.ISSUED, currentHandler: Role.PACKAGING_SUPERVISOR }
  });

  await prisma.packagingRequisitionHistory.create({
    data: {
      requisitionId: id, action: '物料已发放',
      oldStatus: PackagingStatus.APPROVED, newStatus: PackagingStatus.ISSUED,
      remark: remark || '包装材料已发放', createdById: userId
    }
  });

  await notifyRole(Role.PACKAGING_SUPERVISOR, NotificationType.STATUS_CHANGED,
    `包装领用 ${requisition.requisitionNo} 物料已发`,
    `包装材料已发放，请确认接收`,
    'PackagingRequisition', id);

  res.json(requisition);
});

app.put('/api/packaging-requisitions/:id/complete', async (req, res) => {
  const { userId, remark } = req.body;
  const id = parseInt(req.params.id);

  const requisition = await prisma.packagingRequisition.update({
    where: { id },
    data: { status: PackagingStatus.COMPLETED, currentHandler: Role.SALES_BACKOFFICE }
  });

  await prisma.packagingRequisitionHistory.create({
    data: {
      requisitionId: id, action: '领用完成',
      oldStatus: PackagingStatus.ISSUED, newStatus: PackagingStatus.COMPLETED,
      remark: remark || '包装领用流程完成', createdById: userId
    }
  });

  await notifyRole(Role.SALES_BACKOFFICE, NotificationType.STATUS_CHANGED,
    `包装领用 ${requisition.requisitionNo} 已完成`,
    `包装领用流程已完成`,
    'PackagingRequisition', id);

  res.json(requisition);
});

app.put('/api/packaging-requisitions/:id/confirm-change', async (req, res) => {
  const { userId, affected, remark, historyId } = req.body;
  const id = parseInt(req.params.id);

  if (affected === undefined || affected === null) {
    return res.status(400).json({ error: '请选择是否受排产变更影响' });
  }

  const targetHistoryId = historyId ? parseInt(historyId) : null;

  let changeNotification;
  if (targetHistoryId) {
    changeNotification = await prisma.packagingRequisitionHistory.findFirst({
      where: { id: targetHistoryId, requisitionId: id, scheduleChangeNotified: true }
    });
  } else {
    changeNotification = await prisma.packagingRequisitionHistory.findFirst({
      where: { requisitionId: id, scheduleChangeNotified: true, changeHandled: false },
      orderBy: { createdAt: 'desc' }
    });
  }

  if (!changeNotification) {
    return res.status(400).json({ error: '未找到待处理的排产变更通知' });
  }

  await prisma.packagingRequisitionHistory.update({
    where: { id: changeNotification.id },
    data: { changeHandled: true, changeAffected: affected }
  });

  await prisma.packagingRequisitionHistory.create({
    data: {
      requisitionId: id,
      action: '变更处置',
      remark: remark || (affected ? '已确认受排产变更影响，将调整领用计划' : '已确认不受排产变更影响'),
      changes: JSON.stringify({ affected }),
      createdById: parseInt(userId)
    }
  });

  res.json({ success: true });
});

app.put('/api/packaging-requisitions/:id/add-comment', async (req, res) => {
  const { userId, remark } = req.body;
  const id = parseInt(req.params.id);

  const history = await prisma.packagingRequisitionHistory.create({
    data: {
      requisitionId: id, action: '添加备注',
      remark, createdById: userId
    }
  });

  const requisition = await prisma.packagingRequisition.findUnique({ where: { id } });
  const creatorId = requisition.createdById;
  if (creatorId !== userId) {
    await createNotification(creatorId, NotificationType.COMMENT_ADDED,
      `包装领用 ${requisition.requisitionNo} 有新备注`,
      remark, 'PackagingRequisition', id);
  }

  res.json(history);
});

app.put('/api/filling-schedules/:id/add-comment', async (req, res) => {
  const { userId, remark } = req.body;
  const id = parseInt(req.params.id);

  const history = await prisma.fillingScheduleHistory.create({
    data: {
      scheduleId: id, action: '添加备注',
      remark, createdById: userId
    }
  });

  const schedule = await prisma.fillingSchedule.findUnique({ where: { id } });
  const creatorId = schedule.createdById;
  if (creatorId !== userId) {
    await createNotification(creatorId, NotificationType.COMMENT_ADDED,
      `灌装排产 ${schedule.batchNo} 有新备注`,
      remark, 'FillingSchedule', id);
  }

  res.json(history);
});

app.get('/api/stats/summary', async (req, res) => {
  const [fillingStats, packagingStats] = await Promise.all([
    prisma.fillingSchedule.groupBy({
      by: ['status'],
      _count: { status: true }
    }),
    prisma.packagingRequisition.groupBy({
      by: ['status'],
      _count: { status: true }
    })
  ]);
  res.json({ fillingStats, packagingStats });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
