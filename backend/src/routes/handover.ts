import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { getNextSequence } from '../database';
import { authenticate, AuthRequest, requireRoles } from '../middleware/auth';
import { logOperation, getEntityLogs } from '../utils/operationLogger';
import { getHandoverStatusDisplay } from '../utils/statusMachine';
import { HandoverForm } from '../types';

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const { propertyId, contractId, status, type } = req.query;
  let handovers = Array.from(db.handoverForms.values());

  if (propertyId) {
    handovers = handovers.filter((h) => h.propertyId === propertyId);
  }
  if (contractId) {
    handovers = handovers.filter((h) => h.contractId === contractId);
  }
  if (status) {
    handovers = handovers.filter((h) => h.status === status);
  }
  if (type) {
    handovers = handovers.filter((h) => h.type === type);
  }

  handovers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const result = handovers.map((h) => ({
    ...h,
    statusDisplay: getHandoverStatusDisplay(h.status),
  }));

  res.json(result);
});

router.get('/:id', authenticate, (req, res) => {
  const handover = db.handoverForms.get(req.params.id);
  if (!handover) {
    res.status(404).json({ error: '交接单不存在' });
    return;
  }

  const property = db.properties.get(handover.propertyId);
  const contract = db.contracts.get(handover.contractId);
  const logs = getEntityLogs('handover', handover.id);

  res.json({
    ...handover,
    statusDisplay: getHandoverStatusDisplay(handover.status),
    property,
    contract,
    logs,
  });
});

router.post('/', authenticate, requireRoles('rental_consultant'), (req: AuthRequest, res) => {
  const {
    propertyId,
    contractId,
    type,
    handoverDate,
    items,
    remarks,
  } = req.body;

  if (!req.user) {
    res.status(401).json({ error: '未认证' });
    return;
  }

  const property = db.properties.get(propertyId);
  if (!property) {
    res.status(404).json({ error: '房源不存在' });
    return;
  }

  const now = new Date().toISOString();
  const handover: HandoverForm = {
    id: uuidv4(),
    handoverNo: getNextSequence('HO'),
    propertyId,
    contractId,
    type,
    handoverDate,
    items: items || [],
    remarks,
    status: 'in_progress',
    createdBy: req.user.id,
    createdByName: req.user.name,
    createdAt: now,
    updatedAt: now,
  };

  db.handoverForms.set(handover.id, handover);

  logOperation({
    entityType: 'handover',
    entityId: handover.id,
    action: 'create',
    description: `创建${type === 'move_in' ? '入住' : '退租'}交接单 ${handover.handoverNo}`,
    operator: req.user,
    newStatus: 'in_progress',
  });

  if (property) {
    property.status = 'handover_pending';
    property.updatedAt = now;
    db.properties.set(property.id, property);

    logOperation({
      entityType: 'property',
      entityId: property.id,
      action: 'prepare_handover',
      description: `准备${type === 'move_in' ? '入住' : '退租'}交接`,
      operator: req.user,
      oldStatus: 'contract_signed',
      newStatus: 'handover_pending',
    });
  }

  res.status(201).json(handover);
});

router.put('/:id', authenticate, (req: AuthRequest, res) => {
  const handover = db.handoverForms.get(req.params.id);
  if (!handover) {
    res.status(404).json({ error: '交接单不存在' });
    return;
  }

  if (handover.status === 'completed') {
    res.status(400).json({ error: '已完成的交接单不能修改' });
    return;
  }

  const updates = req.body;
  const updatedHandover: HandoverForm = {
    ...handover,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  db.handoverForms.set(handover.id, updatedHandover);

  if (req.user) {
    logOperation({
      entityType: 'handover',
      entityId: handover.id,
      action: 'update',
      description: '更新交接单',
      operator: req.user,
      details: Object.keys(updates),
    });
  }

  res.json(updatedHandover);
});

router.post('/:id/sign-receiver', authenticate, (req: AuthRequest, res) => {
  const handover = db.handoverForms.get(req.params.id);
  if (!handover) {
    res.status(404).json({ error: '交接单不存在' });
    return;
  }

  const { receiverName } = req.body;
  handover.receiverName = receiverName;
  handover.receiverSignAt = new Date().toISOString();
  handover.updatedAt = new Date().toISOString();

  db.handoverForms.set(handover.id, handover);

  if (req.user) {
    logOperation({
      entityType: 'handover',
      entityId: handover.id,
      action: 'sign_receiver',
      description: `接收方 ${receiverName} 签字确认`,
      operator: req.user,
    });
  }

  res.json(handover);
});

router.post('/:id/complete', authenticate, requireRoles('operation_manager'), (req: AuthRequest, res) => {
  const handover = db.handoverForms.get(req.params.id);
  if (!handover) {
    res.status(404).json({ error: '交接单不存在' });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: '未认证' });
    return;
  }

  if (!handover.receiverSignAt) {
    res.status(400).json({ error: '接收方尚未签字，不能完成交接' });
    return;
  }

  const { delivererName, disputes } = req.body;
  const oldStatus = handover.status;

  handover.status = disputes ? 'disputed' : 'completed';
  handover.delivererName = delivererName || req.user.name;
  handover.delivererSignAt = new Date().toISOString();
  handover.disputes = disputes;
  handover.updatedAt = new Date().toISOString();

  db.handoverForms.set(handover.id, handover);

  logOperation({
    entityType: 'handover',
    entityId: handover.id,
    action: 'complete',
    description: `交接${disputes ? '存在争议' : '完成'}`,
    operator: req.user,
    oldStatus,
    newStatus: handover.status,
    details: { disputes },
  });

  const property = db.properties.get(handover.propertyId);
  if (property) {
    property.status = 'handover_completed';
    property.updatedAt = new Date().toISOString();
    db.properties.set(property.id, property);

    logOperation({
      entityType: 'property',
      entityId: property.id,
      action: 'complete_handover',
      description: `${handover.type === 'move_in' ? '入住' : '退租'}交接完成`,
      operator: req.user,
      oldStatus: 'handover_pending',
      newStatus: 'handover_completed',
    });

    if (handover.type === 'move_in' && !disputes) {
      setTimeout(() => {
        property.status = 'occupied';
        property.updatedAt = new Date().toISOString();
        db.properties.set(property.id, property);

        logOperation({
          entityType: 'property',
          entityId: property.id,
          action: 'confirm_occupied',
          description: '确认入住',
          operator: req.user!,
          oldStatus: 'handover_completed',
          newStatus: 'occupied',
        });
      }, 100);
    }
  }

  res.json({
    ...handover,
    statusDisplay: getHandoverStatusDisplay(handover.status),
  });
});

export default router;
