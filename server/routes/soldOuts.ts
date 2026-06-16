import { Router } from 'express';
import { SoldOut, SoldOutHistory, AuditLog, TodoItem, SoupBase } from '../models';

const router = Router();

router.get('/', async (req, res) => {
  const { status } = req.query;
  const whereClause = status ? { status } : {};
  const soldOuts = await SoldOut.findAll({ 
    where: whereClause,
    include: [{ model: SoldOutHistory, as: 'history' }],
    order: [['reportedAt', 'DESC']],
  });
  res.json(soldOuts);
});

router.get('/:id', async (req, res) => {
  const soldOut = await SoldOut.findByPk(req.params.id, {
    include: [{ model: SoldOutHistory, as: 'history' }],
  });
  if (!soldOut) {
    return res.status(404).json({ error: '沽清记录不存在' });
  }
  res.json(soldOut);
});

router.post('/', async (req, res) => {
  const { itemName, category, reason, notes, refundReason, supplementNotes, relatedSoupBaseId } = req.body;
  const { actor, actorRole } = req.headers;

  const soldOut = await SoldOut.create({
    itemName,
    category,
    reason,
    status: 'active',
    reportedBy: actor as string,
    notes: notes || '',
    refundReason,
    supplementNotes,
    relatedSoupBaseId,
  });

  await SoldOutHistory.create({
    soldOutId: soldOut.id,
    action: 'reported',
    actor: actor as string,
    description: `报告${itemName}沽清：${reason}`,
  });

  await AuditLog.create({
    action: 'create',
    targetType: 'soldOut',
    targetId: soldOut.id,
    targetName: soldOut.itemName,
    actor: actor as string,
    actorRole: actorRole as string,
    details: JSON.stringify({ reason, category }),
  });

  let assignee = '李主管';
  let assigneeRole = '后厨主管';
  if (actorRole === '后厨主管') {
    assignee = '王经理';
    assigneeRole = '前厅经理';
  }

  await TodoItem.create({
    title: `处理${itemName}沽清`,
    type: 'soldOut',
    targetId: soldOut.id,
    targetName: soldOut.itemName,
    assignee,
    assigneeRole,
    priority: 'high',
  });

  res.status(201).json(soldOut);
});

router.put('/:id', async (req, res) => {
  const soldOut = await SoldOut.findByPk(req.params.id);
  if (!soldOut) {
    return res.status(404).json({ error: '沽清记录不存在' });
  }

  const { actor, actorRole } = req.headers;
  const changes: Record<string, unknown> = {};

  if (req.body.notes !== undefined) {
    changes.notes = req.body.notes;
  }
  if (req.body.refundReason !== undefined) {
    changes.refundReason = req.body.refundReason;
  }
  if (req.body.supplementNotes !== undefined) {
    changes.supplementNotes = req.body.supplementNotes;
  }

  await soldOut.update(changes);

  await SoldOutHistory.create({
    soldOutId: soldOut.id,
    action: 'updated',
    actor: actor as string,
    description: `更新${soldOut.itemName}沽清信息`,
  });

  await AuditLog.create({
    action: 'update',
    targetType: 'soldOut',
    targetId: soldOut.id,
    targetName: soldOut.itemName,
    actor: actor as string,
    actorRole: actorRole as string,
    details: JSON.stringify(changes),
  });

  res.json(soldOut);
});

router.post('/:id/confirm', async (req, res) => {
  const soldOut = await SoldOut.findByPk(req.params.id);
  if (!soldOut) {
    return res.status(404).json({ error: '沽清记录不存在' });
  }

  const { actor, actorRole } = req.headers;

  await SoldOutHistory.create({
    soldOutId: soldOut.id,
    action: 'confirmed',
    actor: actor as string,
    description: `确认${soldOut.itemName}沽清`,
  });

  await AuditLog.create({
    action: 'confirm',
    targetType: 'soldOut',
    targetId: soldOut.id,
    targetName: soldOut.itemName,
    actor: actor as string,
    actorRole: actorRole as string,
    details: JSON.stringify({}),
  });

  res.json(soldOut);
});

router.post('/:id/resolve', async (req, res) => {
  const soldOut = await SoldOut.findByPk(req.params.id);
  if (!soldOut) {
    return res.status(404).json({ error: '沽清记录不存在' });
  }

  const { actor, actorRole } = req.headers;

  await soldOut.update({
    status: 'resolved',
    resolvedBy: actor as string,
    resolvedAt: new Date(),
  });

  await SoldOutHistory.create({
    soldOutId: soldOut.id,
    action: 'resolved',
    actor: actor as string,
    description: `解决${soldOut.itemName}沽清`,
  });

  await AuditLog.create({
    action: 'resolve',
    targetType: 'soldOut',
    targetId: soldOut.id,
    targetName: soldOut.itemName,
    actor: actor as string,
    actorRole: actorRole as string,
    details: JSON.stringify({}),
  });

  await TodoItem.update(
    { completed: true, completedAt: new Date() },
    { where: { targetId: soldOut.id, type: 'soldOut', completed: false } }
  );

  if (soldOut.relatedSoupBaseId) {
    const soupBase = await SoupBase.findByPk(soldOut.relatedSoupBaseId);
    if (soupBase) {
      await soupBase.update({ status: 'ready' });
    }
  }

  res.json(soldOut);
});

router.delete('/:id', async (req, res) => {
  const soldOut = await SoldOut.findByPk(req.params.id);
  if (!soldOut) {
    return res.status(404).json({ error: '沽清记录不存在' });
  }

  const { actor, actorRole } = req.headers;

  await AuditLog.create({
    action: 'delete',
    targetType: 'soldOut',
    targetId: soldOut.id,
    targetName: soldOut.itemName,
    actor: actor as string,
    actorRole: actorRole as string,
    details: JSON.stringify({}),
  });

  await soldOut.destroy();
  res.status(204).end();
});

export default router;
