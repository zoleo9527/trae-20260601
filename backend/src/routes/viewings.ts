import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { authenticate, AuthRequest, requireRoles } from '../middleware/auth';
import { logOperation, getEntityLogs } from '../utils/operationLogger';
import { ViewingRecord } from '../types';

const router = express.Router();

router.get('/', authenticate, (req: AuthRequest, res) => {
  const { propertyId, status, consultantId } = req.query;
  let viewings = Array.from(db.viewingRecords.values());

  if (propertyId) {
    viewings = viewings.filter((v) => v.propertyId === propertyId);
  }
  if (status) {
    viewings = viewings.filter((v) => v.status === status);
  }
  if (consultantId && req.user?.role === 'rental_consultant') {
    viewings = viewings.filter((v) => v.consultantId === req.user!.id);
  }

  viewings.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  res.json(viewings);
});

router.get('/:id', authenticate, (req, res) => {
  const viewing = db.viewingRecords.get(req.params.id);
  if (!viewing) {
    res.status(404).json({ error: '看房记录不存在' });
    return;
  }

  const property = db.properties.get(viewing.propertyId);
  const logs = getEntityLogs('viewing', viewing.id);

  res.json({
    ...viewing,
    property,
    logs,
  });
});

router.post('/', authenticate, requireRoles('rental_consultant'), (req: AuthRequest, res) => {
  const {
    propertyId,
    customerName,
    customerPhone,
    companyName,
    scheduledAt,
    needs,
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
  const viewing: ViewingRecord = {
    id: uuidv4(),
    propertyId,
    customerName,
    customerPhone,
    companyName,
    scheduledAt,
    consultantId: req.user.id,
    consultantName: req.user.name,
    interestLevel: 'low',
    needs,
    status: 'scheduled',
    createdAt: now,
  };

  db.viewingRecords.set(viewing.id, viewing);

  logOperation({
    entityType: 'viewing',
    entityId: viewing.id,
    action: 'create',
    description: `预约看房 - ${property.building} ${property.floor} ${property.roomNumber}`,
    operator: req.user,
    details: { customerName, scheduledAt },
  });

  if (property && (property.status === 'vacant' || property.status === 'viewing_completed' || property.status === 'quotation_rejected')) {
    const oldStatus = property.status;
    property.status = 'viewing_scheduled';
    property.updatedAt = new Date().toISOString();
    db.properties.set(property.id, property);

    logOperation({
      entityType: 'property',
      entityId: property.id,
      action: 'schedule_viewing',
      description: `预约看房 - ${customerName}`,
      operator: req.user,
      oldStatus,
      newStatus: 'viewing_scheduled',
    });
  }

  res.status(201).json(viewing);
});

router.put('/:id', authenticate, requireRoles('rental_consultant'), (req: AuthRequest, res) => {
  const viewing = db.viewingRecords.get(req.params.id);
  if (!viewing) {
    res.status(404).json({ error: '看房记录不存在' });
    return;
  }

  if (!req.user || viewing.consultantId !== req.user.id) {
    res.status(403).json({ error: '只能修改自己创建的看房记录' });
    return;
  }

  const updates = req.body;
  const updatedViewing: ViewingRecord = {
    ...viewing,
    ...updates,
  };

  db.viewingRecords.set(viewing.id, updatedViewing);

  logOperation({
    entityType: 'viewing',
    entityId: viewing.id,
    action: 'update',
    description: '更新看房记录',
    operator: req.user,
    details: updates,
  });

  res.json(updatedViewing);
});

router.post('/:id/complete', authenticate, requireRoles('rental_consultant'), (req: AuthRequest, res) => {
  const viewing = db.viewingRecords.get(req.params.id);
  if (!viewing) {
    res.status(404).json({ error: '看房记录不存在' });
    return;
  }

  if (!req.user || viewing.consultantId !== req.user.id) {
    res.status(403).json({ error: '只能完成自己的看房记录' });
    return;
  }

  const { feedback, interestLevel, nextFollowUp } = req.body;

  viewing.status = 'completed';
  viewing.actualAt = new Date().toISOString();
  viewing.feedback = feedback;
  viewing.interestLevel = interestLevel;
  viewing.nextFollowUp = nextFollowUp;

  db.viewingRecords.set(viewing.id, viewing);

  logOperation({
    entityType: 'viewing',
    entityId: viewing.id,
    action: 'complete',
    description: '完成看房，记录反馈',
    operator: req.user,
    oldStatus: 'scheduled',
    newStatus: 'completed',
    details: { feedback, interestLevel },
  });

  const property = db.properties.get(viewing.propertyId);
  if (property) {
    property.status = 'viewing_completed';
    property.updatedAt = new Date().toISOString();
    db.properties.set(property.id, property);

    logOperation({
      entityType: 'property',
      entityId: property.id,
      action: 'complete_viewing',
      description: `看房完成，客户兴趣度：${interestLevel === 'high' ? '高' : interestLevel === 'medium' ? '中' : '低'}`,
      operator: req.user,
      oldStatus: 'viewing_scheduled',
      newStatus: 'viewing_completed',
    });
  }

  res.json(viewing);
});

router.post('/:id/cancel', authenticate, requireRoles('rental_consultant'), (req: AuthRequest, res) => {
  const viewing = db.viewingRecords.get(req.params.id);
  if (!viewing) {
    res.status(404).json({ error: '看房记录不存在' });
    return;
  }

  if (!req.user || viewing.consultantId !== req.user.id) {
    res.status(403).json({ error: '只能取消自己的看房记录' });
    return;
  }

  const { reason } = req.body;
  viewing.status = 'cancelled';

  db.viewingRecords.set(viewing.id, viewing);

  logOperation({
    entityType: 'viewing',
    entityId: viewing.id,
    action: 'cancel',
    description: `取消看房，原因：${reason || '未说明'}`,
    operator: req.user,
    oldStatus: 'scheduled',
    newStatus: 'cancelled',
  });

  const property = db.properties.get(viewing.propertyId);
  if (property && property.status === 'viewing_scheduled') {
    property.status = 'vacant';
    property.updatedAt = new Date().toISOString();
    db.properties.set(property.id, property);
  }

  res.json(viewing);
});

export default router;
