import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { authenticate, AuthRequest, requireRoles } from '../middleware/auth';
import { logOperation, getEntityLogs } from '../utils/operationLogger';
import { canTransition, getTransitionAction, getStatusDisplay, propertyStatusTransitions } from '../utils/statusMachine';
import { Property, PropertyStatus } from '../types';

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const { building, status, floor } = req.query;
  let properties = Array.from(db.properties.values());

  if (building) {
    properties = properties.filter((p) => p.building.includes(building as string));
  }
  if (status) {
    properties = properties.filter((p) => p.status === status);
  }
  if (floor) {
    properties = properties.filter((p) => p.floor === floor);
  }

  const result = properties.map((p) => ({
    ...p,
    statusDisplay: getStatusDisplay(p.status),
  }));

  res.json(result);
});

router.get('/:id', authenticate, (req, res) => {
  const property = db.properties.get(req.params.id);
  if (!property) {
    res.status(404).json({ error: '房源不存在' });
    return;
  }

  const logs = getEntityLogs('property', property.id);

  res.json({
    ...property,
    statusDisplay: getStatusDisplay(property.status),
    logs,
  });
});

router.post('/', authenticate, requireRoles('operation_manager'), (req: AuthRequest, res) => {
  const { building, floor, roomNumber, area, unitPrice, decoration, orientation, description, facilities } = req.body;

  const now = new Date().toISOString();
  const property: Property = {
    id: uuidv4(),
    building,
    floor,
    roomNumber,
    area: Number(area),
    unitPrice: Number(unitPrice),
    decoration,
    orientation,
    description,
    facilities: facilities || [],
    status: 'vacant',
    createdAt: now,
    updatedAt: now,
  };

  db.properties.set(property.id, property);

  if (req.user) {
    logOperation({
      entityType: 'property',
      entityId: property.id,
      action: 'create',
      description: `创建房源 ${building} ${floor} ${roomNumber}`,
      operator: req.user,
      newStatus: 'vacant',
    });
  }

  res.status(201).json(property);
});

router.put('/:id', authenticate, requireRoles('operation_manager'), (req: AuthRequest, res) => {
  const property = db.properties.get(req.params.id);
  if (!property) {
    res.status(404).json({ error: '房源不存在' });
    return;
  }

  const updates = req.body;
  const updatedProperty: Property = {
    ...property,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  db.properties.set(property.id, updatedProperty);

  if (req.user) {
    logOperation({
      entityType: 'property',
      entityId: property.id,
      action: 'update',
      description: `更新房源信息`,
      operator: req.user,
      details: updates,
    });
  }

  res.json(updatedProperty);
});

router.post('/:id/transition', authenticate, (req: AuthRequest, res) => {
  const property = db.properties.get(req.params.id);
  if (!property) {
    res.status(404).json({ error: '房源不存在' });
    return;
  }

  const { toStatus, remark } = req.body;
  const targetStatus = toStatus as PropertyStatus;

  if (!req.user) {
    res.status(401).json({ error: '未认证' });
    return;
  }

  if (!canTransition(property.status, targetStatus, req.user.role)) {
    res.status(403).json({ error: '无权执行此状态变更' });
    return;
  }

  const transition = getTransitionAction(property.status, targetStatus);
  const oldStatus = property.status;

  property.status = targetStatus;
  property.updatedAt = new Date().toISOString();
  db.properties.set(property.id, property);

  logOperation({
    entityType: 'property',
    entityId: property.id,
    action: transition?.action || 'status_change',
    description: transition?.description || `状态从 ${oldStatus} 变更为 ${targetStatus}`,
    operator: req.user,
    oldStatus,
    newStatus: targetStatus,
    details: { remark },
  });

  res.json({
    ...property,
    statusDisplay: getStatusDisplay(property.status),
  });
});

router.get('/:id/available-transitions', authenticate, (req: AuthRequest, res) => {
  const property = db.properties.get(req.params.id);
  if (!property) {
    res.status(404).json({ error: '房源不存在' });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: '未认证' });
    return;
  }

  const availableTransitions = propertyStatusTransitions.filter(
    (t) => t.from === property.status && t.allowedRoles.includes(req.user!.role)
  );

  res.json(availableTransitions);
});

router.get('/:id/related', authenticate, (req, res) => {
  const propertyId = req.params.id;

  const viewings = Array.from(db.viewingRecords.values()).filter(
    (v) => v.propertyId === propertyId
  );
  const quotations = Array.from(db.quotations.values()).filter(
    (q) => q.propertyId === propertyId
  );
  const contracts = Array.from(db.contracts.values()).filter(
    (c) => c.propertyId === propertyId
  );
  const handovers = Array.from(db.handoverForms.values()).filter(
    (h) => h.propertyId === propertyId
  );
  const deposits = Array.from(db.depositRecords.values()).filter(
    (d) => d.propertyId === propertyId
  );

  res.json({
    viewings,
    quotations,
    contracts,
    handovers,
    deposits,
  });
});

router.get('/statistics/summary', authenticate, (req, res) => {
  const properties = Array.from(db.properties.values());
  const statusCounts: Record<string, number> = {};

  properties.forEach((p) => {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
  });

  const totalArea = properties.reduce((sum, p) => sum + p.area, 0);
  const occupiedArea = properties
    .filter((p) => p.status === 'occupied')
    .reduce((sum, p) => sum + p.area, 0);

  res.json({
    total: properties.length,
    totalArea,
    occupiedArea,
    occupancyRate: totalArea > 0 ? (occupiedArea / totalArea) * 100 : 0,
    statusCounts,
  });
});

export default router;
