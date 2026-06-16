import { Router } from 'express';
import { Order, AuditLog, TodoItem, SoupBase } from '../models';

const router = Router();

router.get('/', async (req, res) => {
  const { status, isGroupBuy } = req.query;
  const whereClause: Record<string, unknown> = {};
  if (status) {
    whereClause.status = status;
  }
  if (isGroupBuy !== undefined) {
    whereClause.isGroupBuy = isGroupBuy === 'true';
  }
  
  const orders = await Order.findAll({ 
    include: [{ model: SoupBase, as: 'soupBase' }],
    order: [['createdAt', 'DESC']],
  });
  res.json(orders);
});

router.get('/:id', async (req, res) => {
  const order = await Order.findByPk(req.params.id, {
    include: [{ model: SoupBase, as: 'soupBase' }],
  });
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  res.json(order);
});

router.post('/', async (req, res) => {
  const { tableNumber, customerName, phone, soupBaseId, soupBaseName, soupBaseType, dishes, totalAmount, isGroupBuy, groupBuyCode, notes } = req.body;
  const { actor, actorRole } = req.headers;

  const order = await Order.create({
    tableNumber,
    customerName,
    phone,
    soupBaseId,
    soupBaseName,
    soupBaseType,
    dishes: typeof dishes === 'string' ? dishes : JSON.stringify(dishes),
    totalAmount,
    paidAmount: 0,
    status: 'pending',
    isGroupBuy: isGroupBuy || false,
    groupBuyCode,
    groupBuyVerified: false,
    createdBy: actor as string,
    notes: notes || '',
  });

  await AuditLog.create({
    action: 'create',
    targetType: 'order',
    targetId: order.id,
    targetName: `${order.tableNumber}订单`,
    actor: actor as string,
    actorRole: actorRole as string,
    details: JSON.stringify({ isGroupBuy, totalAmount, groupBuyCode }),
  });

  if (isGroupBuy) {
    await TodoItem.create({
      title: `核销${order.tableNumber}团购券`,
      type: 'order',
      targetId: order.id,
      targetName: `${order.tableNumber}订单`,
      assignee: '张收银',
      assigneeRole: '收银',
      priority: 'high',
    });
  }

  if (actorRole === '前厅经理') {
    await TodoItem.create({
      title: `确认${order.tableNumber}订单`,
      type: 'order',
      targetId: order.id,
      targetName: `${order.tableNumber}订单`,
      assignee: '王经理',
      assigneeRole: '前厅经理',
      priority: 'medium',
    });
  }

  res.status(201).json(order);
});

router.put('/:id', async (req, res) => {
  const order = await Order.findByPk(req.params.id);
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  const { actor, actorRole } = req.headers;
  const changes: Record<string, unknown> = {};

  if (req.body.status !== undefined) {
    changes.status = req.body.status;
  }
  if (req.body.paidAmount !== undefined) {
    changes.paidAmount = req.body.paidAmount;
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
  if (req.body.servedAt !== undefined) {
    changes.servedAt = req.body.servedAt;
  }
  if (req.body.completedAt !== undefined) {
    changes.completedAt = req.body.completedAt;
  }

  await order.update(changes);

  await AuditLog.create({
    action: 'update',
    targetType: 'order',
    targetId: order.id,
    targetName: `${order.tableNumber}订单`,
    actor: actor as string,
    actorRole: actorRole as string,
    details: JSON.stringify(changes),
  });

  res.json(order);
});

router.post('/:id/verify', async (req, res) => {
  const order = await Order.findByPk(req.params.id);
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (!order.isGroupBuy) {
    return res.status(400).json({ error: '该订单不是团购订单' });
  }

  const { actor, actorRole } = req.headers;

  await order.update({
    groupBuyVerified: true,
    status: 'confirmed',
    paidAmount: order.totalAmount,
  });

  await AuditLog.create({
    action: 'confirm',
    targetType: 'order',
    targetId: order.id,
    targetName: `${order.tableNumber}订单`,
    actor: actor as string,
    actorRole: actorRole as string,
    details: JSON.stringify({ groupBuyVerified: true, groupBuyCode: order.groupBuyCode }),
  });

  await TodoItem.update(
    { completed: true, completedAt: new Date() },
    { where: { targetId: order.id, type: 'order', completed: false } }
  );

  res.json(order);
});

router.post('/:id/confirm', async (req, res) => {
  const order = await Order.findByPk(req.params.id);
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  const { actor, actorRole } = req.headers;

  await order.update({ status: 'confirmed' });

  await AuditLog.create({
    action: 'confirm',
    targetType: 'order',
    targetId: order.id,
    targetName: `${order.tableNumber}订单`,
    actor: actor as string,
    actorRole: actorRole as string,
    details: JSON.stringify({ status: 'confirmed' }),
  });

  res.json(order);
});

router.post('/:id/serve', async (req, res) => {
  const order = await Order.findByPk(req.params.id);
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  const { actor, actorRole } = req.headers;

  await order.update({ status: 'served', servedAt: new Date() });

  await AuditLog.create({
    action: 'update',
    targetType: 'order',
    targetId: order.id,
    targetName: `${order.tableNumber}订单`,
    actor: actor as string,
    actorRole: actorRole as string,
    details: JSON.stringify({ status: 'served' }),
  });

  res.json(order);
});

router.post('/:id/complete', async (req, res) => {
  const order = await Order.findByPk(req.params.id);
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  const { actor, actorRole } = req.headers;

  await order.update({ status: 'completed', completedAt: new Date() });

  await AuditLog.create({
    action: 'update',
    targetType: 'order',
    targetId: order.id,
    targetName: `${order.tableNumber}订单`,
    actor: actor as string,
    actorRole: actorRole as string,
    details: JSON.stringify({ status: 'completed' }),
  });

  if (order.soupBaseId) {
    const soupBase = await SoupBase.findByPk(order.soupBaseId);
    if (soupBase && soupBase.stock > 0) {
      await soupBase.update({ stock: soupBase.stock - 1 });
    }
  }

  res.json(order);
});

router.delete('/:id', async (req, res) => {
  const order = await Order.findByPk(req.params.id);
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  const { actor, actorRole } = req.headers;

  await AuditLog.create({
    action: 'delete',
    targetType: 'order',
    targetId: order.id,
    targetName: `${order.tableNumber}订单`,
    actor: actor as string,
    actorRole: actorRole as string,
    details: JSON.stringify({}),
  });

  await order.destroy();
  res.status(204).end();
});

export default router;
