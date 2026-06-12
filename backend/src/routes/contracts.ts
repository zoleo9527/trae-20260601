import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { getNextSequence } from '../database';
import { authenticate, AuthRequest, requireRoles } from '../middleware/auth';
import { logOperation, getEntityLogs } from '../utils/operationLogger';
import { getContractStatusDisplay } from '../utils/statusMachine';
import { Contract, ContractClause } from '../types';

const router = express.Router();

router.get('/', authenticate, (req: AuthRequest, res) => {
  const { propertyId, status, createdBy } = req.query;
  let contracts = Array.from(db.contracts.values());

  if (propertyId) {
    contracts = contracts.filter((c) => c.propertyId === propertyId);
  }
  if (status) {
    contracts = contracts.filter((c) => c.status === status);
  }
  if (createdBy && req.user?.role === 'rental_consultant') {
    contracts = contracts.filter((c) => c.createdBy === req.user!.id);
  }

  contracts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const result = contracts.map((c) => ({
    ...c,
    statusDisplay: getContractStatusDisplay(c.status),
  }));

  res.json(result);
});

router.get('/:id', authenticate, (req, res) => {
  const contract = db.contracts.get(req.params.id);
  if (!contract) {
    res.status(404).json({ error: '合同不存在' });
    return;
  }

  const property = db.properties.get(contract.propertyId);
  const quotation = db.quotations.get(contract.quotationId);
  const logs = getEntityLogs('contract', contract.id);

  res.json({
    ...contract,
    statusDisplay: getContractStatusDisplay(contract.status),
    property,
    quotation,
    logs,
  });
});

router.post('/', authenticate, requireRoles('rental_consultant'), (req: AuthRequest, res) => {
  const {
    propertyId,
    quotationId,
    customerName,
    customerPhone,
    companyName,
    leaseStartDate,
    leaseEndDate,
    leaseTerm,
    monthlyRent,
    paymentMethod,
    depositAmount,
    rentFreePeriod,
    clauses,
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
  const contract: Contract = {
    id: uuidv4(),
    contractNo: getNextSequence('CO'),
    propertyId,
    quotationId,
    customerName,
    customerPhone,
    companyName,
    leaseStartDate,
    leaseEndDate,
    leaseTerm: Number(leaseTerm),
    monthlyRent: Number(monthlyRent),
    annualRent: Number(monthlyRent) * 12,
    paymentMethod,
    depositAmount: Number(depositAmount),
    rentFreePeriod: Number(rentFreePeriod),
    clauses: clauses || [],
    attachments: [],
    status: 'draft',
    createdBy: req.user.id,
    createdByName: req.user.name,
    createdAt: now,
    updatedAt: now,
  };

  db.contracts.set(contract.id, contract);

  logOperation({
    entityType: 'contract',
    entityId: contract.id,
    action: 'create',
    description: `创建合同 ${contract.contractNo}`,
    operator: req.user,
    newStatus: 'draft',
    details: { customerName, monthlyRent },
  });

  if (property) {
    property.status = 'contract_drafting';
    property.updatedAt = now;
    db.properties.set(property.id, property);

    logOperation({
      entityType: 'property',
      entityId: property.id,
      action: 'draft_contract',
      description: '开始起草合同',
      operator: req.user,
      oldStatus: 'quotation_approved',
      newStatus: 'contract_drafting',
    });
  }

  res.status(201).json(contract);
});

router.put('/:id', authenticate, requireRoles('rental_consultant'), (req: AuthRequest, res) => {
  const contract = db.contracts.get(req.params.id);
  if (!contract) {
    res.status(404).json({ error: '合同不存在' });
    return;
  }

  if (!req.user || contract.createdBy !== req.user.id) {
    res.status(403).json({ error: '只能修改自己创建的合同' });
    return;
  }

  if (contract.status !== 'draft' && contract.status !== 'rejected') {
    res.status(400).json({ error: '只能修改草稿或已拒绝的合同' });
    return;
  }

  const updates = req.body;
  if (updates.monthlyRent) {
    updates.annualRent = Number(updates.monthlyRent) * 12;
  }

  const updatedContract: Contract = {
    ...contract,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  db.contracts.set(contract.id, updatedContract);

  logOperation({
    entityType: 'contract',
    entityId: contract.id,
    action: 'update',
    description: '更新合同内容',
    operator: req.user,
    details: Object.keys(updates),
  });

  res.json(updatedContract);
});

router.post('/:id/submit-review', authenticate, requireRoles('rental_consultant'), (req: AuthRequest, res) => {
  const contract = db.contracts.get(req.params.id);
  if (!contract) {
    res.status(404).json({ error: '合同不存在' });
    return;
  }

  if (!req.user || contract.createdBy !== req.user.id) {
    res.status(403).json({ error: '只能提交自己创建的合同' });
    return;
  }

  if (contract.status !== 'draft' && contract.status !== 'rejected') {
    res.status(400).json({ error: '只能提交草稿或已拒绝的合同' });
    return;
  }

  const oldStatus = contract.status;
  contract.status = 'under_review';
  contract.updatedAt = new Date().toISOString();

  db.contracts.set(contract.id, contract);

  logOperation({
    entityType: 'contract',
    entityId: contract.id,
    action: 'submit_review',
    description: `提交合同 ${contract.contractNo} 审核`,
    operator: req.user,
    oldStatus,
    newStatus: 'under_review',
  });

  const property = db.properties.get(contract.propertyId);
  if (property) {
    property.status = 'contract_reviewing';
    property.updatedAt = new Date().toISOString();
    db.properties.set(property.id, property);

    logOperation({
      entityType: 'property',
      entityId: property.id,
      action: 'submit_contract_review',
      description: '合同已提交审核',
      operator: req.user,
      oldStatus: 'contract_drafting',
      newStatus: 'contract_reviewing',
    });
  }

  res.json({
    ...contract,
    statusDisplay: getContractStatusDisplay(contract.status),
  });
});

router.post('/:id/approve', authenticate, requireRoles('operation_manager'), (req: AuthRequest, res) => {
  const contract = db.contracts.get(req.params.id);
  if (!contract) {
    res.status(404).json({ error: '合同不存在' });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: '未认证' });
    return;
  }

  if (contract.status !== 'under_review') {
    res.status(400).json({ error: '只能审核已提交的合同' });
    return;
  }

  const { reviewComment } = req.body;
  const oldStatus = contract.status;

  contract.status = 'approved';
  contract.reviewerId = req.user.id;
  contract.reviewerName = req.user.name;
  contract.reviewComment = reviewComment;
  contract.reviewedAt = new Date().toISOString();
  contract.updatedAt = new Date().toISOString();

  db.contracts.set(contract.id, contract);

  logOperation({
    entityType: 'contract',
    entityId: contract.id,
    action: 'approve',
    description: `审核通过合同 ${contract.contractNo}`,
    operator: req.user,
    oldStatus,
    newStatus: 'approved',
    details: { reviewComment },
  });

  res.json({
    ...contract,
    statusDisplay: getContractStatusDisplay(contract.status),
  });
});

router.post('/:id/reject', authenticate, requireRoles('operation_manager'), (req: AuthRequest, res) => {
  const contract = db.contracts.get(req.params.id);
  if (!contract) {
    res.status(404).json({ error: '合同不存在' });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: '未认证' });
    return;
  }

  if (contract.status !== 'under_review') {
    res.status(400).json({ error: '只能审核已提交的合同' });
    return;
  }

  const { reviewComment } = req.body;
  const oldStatus = contract.status;

  contract.status = 'rejected';
  contract.reviewerId = req.user.id;
  contract.reviewerName = req.user.name;
  contract.reviewComment = reviewComment;
  contract.reviewedAt = new Date().toISOString();
  contract.updatedAt = new Date().toISOString();

  db.contracts.set(contract.id, contract);

  logOperation({
    entityType: 'contract',
    entityId: contract.id,
    action: 'reject',
    description: `拒绝合同 ${contract.contractNo}`,
    operator: req.user,
    oldStatus,
    newStatus: 'rejected',
    details: { reviewComment },
  });

  const property = db.properties.get(contract.propertyId);
  if (property) {
    property.status = 'contract_drafting';
    property.updatedAt = new Date().toISOString();
    db.properties.set(property.id, property);
  }

  res.json({
    ...contract,
    statusDisplay: getContractStatusDisplay(contract.status),
  });
});

router.post('/:id/sign', authenticate, requireRoles('operation_manager'), (req: AuthRequest, res) => {
  const contract = db.contracts.get(req.params.id);
  if (!contract) {
    res.status(404).json({ error: '合同不存在' });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: '未认证' });
    return;
  }

  if (contract.status !== 'approved') {
    res.status(400).json({ error: '只能签署已批准的合同' });
    return;
  }

  const { signatoryPartyA, signatoryPartyB } = req.body;
  const oldStatus = contract.status;

  contract.status = 'signed';
  contract.signatoryPartyA = signatoryPartyA;
  contract.signatoryPartyB = signatoryPartyB;
  contract.signedAt = new Date().toISOString();
  contract.updatedAt = new Date().toISOString();

  db.contracts.set(contract.id, contract);

  logOperation({
    entityType: 'contract',
    entityId: contract.id,
    action: 'sign',
    description: `签署合同 ${contract.contractNo}`,
    operator: req.user,
    oldStatus,
    newStatus: 'signed',
    details: { signatoryPartyA, signatoryPartyB },
  });

  const property = db.properties.get(contract.propertyId);
  if (property) {
    property.status = 'contract_signed';
    property.updatedAt = new Date().toISOString();
    db.properties.set(property.id, property);

    logOperation({
      entityType: 'property',
      entityId: property.id,
      action: 'approve_contract',
      description: '合同已签署',
      operator: req.user,
      oldStatus: 'contract_reviewing',
      newStatus: 'contract_signed',
    });
  }

  res.json({
    ...contract,
    statusDisplay: getContractStatusDisplay(contract.status),
  });
});

export default router;
