import { Router } from 'express';
import { SoupBase, AuditLog, TodoItem, SoldOut } from '../models';

const router = Router();

router.get('/', async (req, res) => {
  const soupBases = await SoupBase.findAll({ order: [['createdAt', 'DESC']] });
  res.json(soupBases);
});

router.get('/:id', async (req, res) => {
  const soupBase = await SoupBase.findByPk(req.params.id);
  if (!soupBase) {
    return res.status(404).json({ error: '锅底不存在' });
  }
  res.json(soupBase);
});

router.post('/', async (req, res) => {
  const { name, type, stock, minStock, unit, responsiblePerson, notes } = req.body;
  const { actor, actorRole } = req.headers;
  
  const soupBase = await SoupBase.create({
    name,
    type,
    stock,
    minStock,
    unit: unit || '份',
    status: 'pending',
    responsiblePerson,
    notes: notes || '',
  });

  await AuditLog.create({
    action: 'create',
    targetType: 'soupBase',
    targetId: soupBase.id,
    targetName: soupBase.name,
    actor: actor as string,
    actorRole: actorRole as string,
    details: JSON.stringify({ stock, minStock }),
  });

  if (stock < minStock) {
    await TodoItem.create({
      title: `准备${name}（库存不足）`,
      type: 'soupBase',
      targetId: soupBase.id,
      targetName: soupBase.name,
      assignee: responsiblePerson,
      assigneeRole: '后厨主管',
      priority: 'high',
    });
  }

  res.status(201).json(soupBase);
});

router.put('/:id', async (req, res) => {
  const soupBase = await SoupBase.findByPk(req.params.id);
  if (!soupBase) {
    return res.status(404).json({ error: '锅底不存在' });
  }

  const { actor, actorRole } = req.headers;
  const changes: Record<string, unknown> = {};

  if (req.body.stock !== undefined) {
    changes.stock = req.body.stock;
  }
  if (req.body.status !== undefined) {
    changes.status = req.body.status;
  }
  if (req.body.notes !== undefined) {
    changes.notes = req.body.notes;
  }
  if (req.body.refundReason !== undefined) {
    changes.refundReason = req.body.refundReason;
  }
  if (req.body.supplementNotes !== undefined) {
    changes.supplementNotes = req.body.supplementNotes;
  }
  if (req.body.lastPreparedAt !== undefined) {
    changes.lastPreparedAt = req.body.lastPreparedAt;
  }
  if (req.body.prepareCount !== undefined) {
    changes.prepareCount = req.body.prepareCount;
  }

  await soupBase.update(changes);

  await AuditLog.create({
    action: 'update',
    targetType: 'soupBase',
    targetId: soupBase.id,
    targetName: soupBase.name,
    actor: actor as string,
    actorRole: actorRole as string,
    details: JSON.stringify(changes),
  });

  res.json(soupBase);
});

router.post('/:id/prepare', async (req, res) => {
  const soupBase = await SoupBase.findByPk(req.params.id);
  if (!soupBase) {
    return res.status(404).json({ error: '锅底不存在' });
  }

  const { actor, actorRole } = req.headers;

  await soupBase.update({
    status: 'preparing',
    prepareCount: soupBase.prepareCount + 1,
  });

  await AuditLog.create({
    action: 'update',
    targetType: 'soupBase',
    targetId: soupBase.id,
    targetName: soupBase.name,
    actor: actor as string,
    actorRole: actorRole as string,
    details: JSON.stringify({ status: 'preparing' }),
  });

  res.json(soupBase);
});

router.post('/:id/complete', async (req, res) => {
  const soupBase = await SoupBase.findByPk(req.params.id);
  if (!soupBase) {
    return res.status(404).json({ error: '锅底不存在' });
  }

  const { additionalStock, actor, actorRole } = { ...req.body, ...req.headers };

  await soupBase.update({
    status: 'ready',
    stock: soupBase.stock + (Number(additionalStock) || 10),
    lastPreparedAt: new Date(),
  });

  await AuditLog.create({
    action: 'update',
    targetType: 'soupBase',
    targetId: soupBase.id,
    targetName: soupBase.name,
    actor: actor as string,
    actorRole: actorRole as string,
    details: JSON.stringify({ status: 'ready', addedStock: additionalStock }),
  });

  await SoldOut.update(
    { status: 'resolved', resolvedBy: actor, resolvedAt: new Date() },
    { where: { relatedSoupBaseId: soupBase.id, status: 'active' } }
  );

  await TodoItem.update(
    { completed: true, completedAt: new Date() },
    { where: { targetId: soupBase.id, type: 'soupBase', completed: false } }
  );

  res.json(soupBase);
});

router.delete('/:id', async (req, res) => {
  const soupBase = await SoupBase.findByPk(req.params.id);
  if (!soupBase) {
    return res.status(404).json({ error: '锅底不存在' });
  }

  const { actor, actorRole } = req.headers;

  await AuditLog.create({
    action: 'delete',
    targetType: 'soupBase',
    targetId: soupBase.id,
    targetName: soupBase.name,
    actor: actor as string,
    actorRole: actorRole as string,
    details: JSON.stringify({}),
  });

  await soupBase.destroy();
  res.status(204).end();
});

export default router;
