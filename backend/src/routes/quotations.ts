import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { getNextSequence } from '../database';
import { authenticate, AuthRequest, requireRoles } from '../middleware/auth';
import { logOperation, getEntityLogs } from '../utils/operationLogger';
import { getQuotationStatusDisplay } from '../utils/statusMachine';
import { Quotation, QuotationItem } from '../types';

const router = express.Router();

router.get('/', authenticate, (req: AuthRequest, res) => {
  const { propertyId, status, consultantId } = req.query;
  let quotations = Array.from(db.quotations.values());

  if (propertyId) {
    quotations = quotations.filter((q) => q.propertyId === propertyId);
  }
  if (status) {
    quotations = quotations.filter((q) => q.status === status);
  }
  if (consultantId && req.user?.role === 'rental_consultant') {
    quotations = quotations.filter((q) => q.consultantId === req.user!.id);
  }

  quotations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const result = quotations.map((q) => ({
    ...q,
    statusDisplay: getQuotationStatusDisplay(q.status),
  }));

  res.json(result);
});

router.get('/:id', authenticate, (req, res) => {
  const quotation = db.quotations.get(req.params.id);
  if (!quotation) {
    res.status(404).json({ error: '报价单不存在' });
    return;
  }

  const property = db.properties.get(quotation.propertyId);
  const viewing = quotation.viewingRecordId ? db.viewingRecords.get(quotation.viewingRecordId) : null;
  const logs = getEntityLogs('quotation', quotation.id);

  res.json({
    ...quotation,
    statusDisplay: getQuotationStatusDisplay(quotation.status),
    property,
    viewing,
    logs,
  });
});

router.post('/', authenticate, requireRoles('rental_consultant'), (req: AuthRequest, res) => {
  const {
    propertyId,
    customerName,
    customerPhone,
    companyName,
    viewingRecordId,
    leaseTerm,
    rentFreePeriod,
    paymentMethod,
    depositMonths,
    items,
    remarks,
    validUntil,
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

  const totalAmount = (items as QuotationItem[]).reduce((sum, item) => sum + item.amount, 0);

  const now = new Date().toISOString();
  const quotation: Quotation = {
    id: uuidv4(),
    quotationNo: getNextSequence('QO'),
    propertyId,
    customerName,
    customerPhone,
    companyName,
    viewingRecordId,
    consultantId: req.user.id,
    consultantName: req.user.name,
    leaseTerm: Number(leaseTerm),
    rentFreePeriod: Number(rentFreePeriod),
    paymentMethod,
    depositMonths: Number(depositMonths),
    items,
    totalAmount,
    remarks,
    status: 'draft',
    validUntil,
    createdAt: now,
    updatedAt: now,
  };

  db.quotations.set(quotation.id, quotation);

  logOperation({
    entityType: 'quotation',
    entityId: quotation.id,
    action: 'create',
    description: `创建报价单 ${quotation.quotationNo}`,
    operator: req.user,
    newStatus: 'draft',
    details: { customerName, totalAmount },
  });

  res.status(201).json(quotation);
});

router.put('/:id', authenticate, requireRoles('rental_consultant'), (req: AuthRequest, res) => {
  const quotation = db.quotations.get(req.params.id);
  if (!quotation) {
    res.status(404).json({ error: '报价单不存在' });
    return;
  }

  if (!req.user || quotation.consultantId !== req.user.id) {
    res.status(403).json({ error: '只能修改自己创建的报价单' });
    return;
  }

  if (quotation.status !== 'draft' && quotation.status !== 'rejected') {
    res.status(400).json({ error: '只能修改草稿或已拒绝的报价单' });
    return;
  }

  const updates = req.body;
  if (updates.items) {
    updates.totalAmount = updates.items.reduce((sum: number, item: QuotationItem) => sum + item.amount, 0);
  }

  const updatedQuotation: Quotation = {
    ...quotation,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  db.quotations.set(quotation.id, updatedQuotation);

  logOperation({
    entityType: 'quotation',
    entityId: quotation.id,
    action: 'update',
    description: '更新报价单',
    operator: req.user,
    details: updates,
  });

  res.json(updatedQuotation);
});

router.post('/:id/submit', authenticate, requireRoles('rental_consultant'), (req: AuthRequest, res) => {
  const quotation = db.quotations.get(req.params.id);
  if (!quotation) {
    res.status(404).json({ error: '报价单不存在' });
    return;
  }

  if (!req.user || quotation.consultantId !== req.user.id) {
    res.status(403).json({ error: '只能提交自己创建的报价单' });
    return;
  }

  if (quotation.status !== 'draft' && quotation.status !== 'rejected') {
    res.status(400).json({ error: '只能提交草稿或已拒绝的报价单' });
    return;
  }

  const oldStatus = quotation.status;
  quotation.status = 'submitted';
  quotation.updatedAt = new Date().toISOString();

  db.quotations.set(quotation.id, quotation);

  logOperation({
    entityType: 'quotation',
    entityId: quotation.id,
    action: 'submit',
    description: `提交报价单 ${quotation.quotationNo}，等待运营经理确认`,
    operator: req.user,
    oldStatus,
    newStatus: 'submitted',
  });

  const property = db.properties.get(quotation.propertyId);
  if (property) {
    property.status = 'quotation_submitted';
    property.updatedAt = new Date().toISOString();
    db.properties.set(property.id, property);

    logOperation({
      entityType: 'property',
      entityId: property.id,
      action: 'submit_quotation',
      description: '报价单已提交，等待确认',
      operator: req.user,
      oldStatus: property.status,
      newStatus: 'quotation_submitted',
    });
  }

  res.json({
    ...quotation,
    statusDisplay: getQuotationStatusDisplay(quotation.status),
  });
});

router.post('/:id/approve', authenticate, requireRoles('operation_manager'), (req: AuthRequest, res) => {
  const quotation = db.quotations.get(req.params.id);
  if (!quotation) {
    res.status(404).json({ error: '报价单不存在' });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: '未认证' });
    return;
  }

  if (quotation.status !== 'submitted') {
    res.status(400).json({ error: '只能确认已提交的报价单' });
    return;
  }

  const { approvalComment } = req.body;
  const oldStatus = quotation.status;

  quotation.status = 'approved';
  quotation.approverId = req.user.id;
  quotation.approverName = req.user.name;
  quotation.approvalComment = approvalComment;
  quotation.approvedAt = new Date().toISOString();
  quotation.updatedAt = new Date().toISOString();

  db.quotations.set(quotation.id, quotation);

  logOperation({
    entityType: 'quotation',
    entityId: quotation.id,
    action: 'approve',
    description: `确认报价单 ${quotation.quotationNo}`,
    operator: req.user,
    oldStatus,
    newStatus: 'approved',
    details: { approvalComment },
  });

  const property = db.properties.get(quotation.propertyId);
  if (property) {
    property.status = 'quotation_approved';
    property.updatedAt = new Date().toISOString();
    db.properties.set(property.id, property);

    logOperation({
      entityType: 'property',
      entityId: property.id,
      action: 'approve_quotation',
      description: '报价已确认，可以起草合同',
      operator: req.user,
      oldStatus: 'quotation_submitted',
      newStatus: 'quotation_approved',
    });
  }

  res.json({
    ...quotation,
    statusDisplay: getQuotationStatusDisplay(quotation.status),
  });
});

router.post('/:id/reject', authenticate, requireRoles('operation_manager'), (req: AuthRequest, res) => {
  const quotation = db.quotations.get(req.params.id);
  if (!quotation) {
    res.status(404).json({ error: '报价单不存在' });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: '未认证' });
    return;
  }

  if (quotation.status !== 'submitted') {
    res.status(400).json({ error: '只能拒绝已提交的报价单' });
    return;
  }

  const { approvalComment } = req.body;
  const oldStatus = quotation.status;

  quotation.status = 'rejected';
  quotation.approverId = req.user.id;
  quotation.approverName = req.user.name;
  quotation.approvalComment = approvalComment;
  quotation.updatedAt = new Date().toISOString();

  db.quotations.set(quotation.id, quotation);

  logOperation({
    entityType: 'quotation',
    entityId: quotation.id,
    action: 'reject',
    description: `拒绝报价单 ${quotation.quotationNo}`,
    operator: req.user,
    oldStatus,
    newStatus: 'rejected',
    details: { approvalComment },
  });

  const property = db.properties.get(quotation.propertyId);
  if (property) {
    property.status = 'quotation_pending';
    property.updatedAt = new Date().toISOString();
    db.properties.set(property.id, property);
  }

  res.json({
    ...quotation,
    statusDisplay: getQuotationStatusDisplay(quotation.status),
  });
});

export default router;
