import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { getNextSequence } from '../database';
import { authenticate, AuthRequest, requireRoles } from '../middleware/auth';
import { logOperation, getEntityLogs } from '../utils/operationLogger';
import { getDepositStatusDisplay } from '../utils/statusMachine';
import { DepositRecord } from '../types';

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const { propertyId, contractId, status, type } = req.query;
  let deposits = Array.from(db.depositRecords.values());

  if (propertyId) {
    deposits = deposits.filter((d) => d.propertyId === propertyId);
  }
  if (contractId) {
    deposits = deposits.filter((d) => d.contractId === contractId);
  }
  if (status) {
    deposits = deposits.filter((d) => d.status === status);
  }
  if (type) {
    deposits = deposits.filter((d) => d.type === type);
  }

  deposits.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const result = deposits.map((d) => ({
    ...d,
    statusDisplay: getDepositStatusDisplay(d.status),
  }));

  res.json(result);
});

router.get('/:id', authenticate, (req, res) => {
  const deposit = db.depositRecords.get(req.params.id);
  if (!deposit) {
    res.status(404).json({ error: '押金记录不存在' });
    return;
  }

  const property = db.properties.get(deposit.propertyId);
  const contract = db.contracts.get(deposit.contractId);
  const logs = getEntityLogs('deposit', deposit.id);

  res.json({
    ...deposit,
    statusDisplay: getDepositStatusDisplay(deposit.status),
    property,
    contract,
    logs,
  });
});

router.post('/', authenticate, requireRoles('rental_consultant', 'operation_manager'), (req: AuthRequest, res) => {
  const {
    propertyId,
    contractId,
    customerName,
    amount,
    type,
  } = req.body;

  if (!req.user) {
    res.status(401).json({ error: '未认证' });
    return;
  }

  const now = new Date().toISOString();
  const deposit: DepositRecord = {
    id: uuidv4(),
    depositNo: getNextSequence('DP'),
    propertyId,
    contractId,
    customerName,
    amount: Number(amount),
    type,
    status: 'unpaid',
    createdBy: req.user.id,
    createdByName: req.user.name,
    createdAt: now,
    updatedAt: now,
  };

  db.depositRecords.set(deposit.id, deposit);

  logOperation({
    entityType: 'deposit',
    entityId: deposit.id,
    action: 'create',
    description: `创建押金记录 ${deposit.depositNo}，金额：¥${amount}`,
    operator: req.user,
    newStatus: 'unpaid',
    details: { customerName, amount, type },
  });

  res.status(201).json(deposit);
});

router.post('/:id/confirm-payment', authenticate, requireRoles('finance'), (req: AuthRequest, res) => {
  const deposit = db.depositRecords.get(req.params.id);
  if (!deposit) {
    res.status(404).json({ error: '押金记录不存在' });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: '未认证' });
    return;
  }

  if (deposit.status !== 'unpaid') {
    res.status(400).json({ error: '只能确认未支付的押金' });
    return;
  }

  const oldStatus = deposit.status;
  deposit.status = 'paid';
  deposit.paidAt = new Date().toISOString();
  deposit.updatedAt = new Date().toISOString();

  db.depositRecords.set(deposit.id, deposit);

  logOperation({
    entityType: 'deposit',
    entityId: deposit.id,
    action: 'confirm_payment',
    description: `确认押金 ${deposit.depositNo} 已到账，金额：¥${deposit.amount}`,
    operator: req.user,
    oldStatus,
    newStatus: 'paid',
  });

  res.json({
    ...deposit,
    statusDisplay: getDepositStatusDisplay(deposit.status),
  });
});

router.post('/:id/start-refund', authenticate, requireRoles('operation_manager'), (req: AuthRequest, res) => {
  const deposit = db.depositRecords.get(req.params.id);
  if (!deposit) {
    res.status(404).json({ error: '押金记录不存在' });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: '未认证' });
    return;
  }

  if (deposit.status !== 'paid') {
    res.status(400).json({ error: '只能退还已支付的押金' });
    return;
  }

  const { refundAmount } = req.body;
  const oldStatus = deposit.status;

  deposit.status = 'refunding';
  deposit.refundAmount = Number(refundAmount) || deposit.amount;
  deposit.updatedAt = new Date().toISOString();

  db.depositRecords.set(deposit.id, deposit);

  logOperation({
    entityType: 'deposit',
    entityId: deposit.id,
    action: 'start_refund',
    description: `申请退还押金 ${deposit.depositNo}，退款金额：¥${deposit.refundAmount}`,
    operator: req.user,
    oldStatus,
    newStatus: 'refunding',
    details: { refundAmount: deposit.refundAmount },
  });

  res.json({
    ...deposit,
    statusDisplay: getDepositStatusDisplay(deposit.status),
  });
});

router.post('/:id/confirm-refund', authenticate, requireRoles('finance'), (req: AuthRequest, res) => {
  const deposit = db.depositRecords.get(req.params.id);
  if (!deposit) {
    res.status(404).json({ error: '押金记录不存在' });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: '未认证' });
    return;
  }

  if (deposit.status !== 'refunding') {
    res.status(400).json({ error: '只能确认退款中的押金' });
    return;
  }

  const oldStatus = deposit.status;
  deposit.status = 'refunded';
  deposit.refundAt = new Date().toISOString();
  deposit.updatedAt = new Date().toISOString();

  db.depositRecords.set(deposit.id, deposit);

  logOperation({
    entityType: 'deposit',
    entityId: deposit.id,
    action: 'confirm_refund',
    description: `押金 ${deposit.depositNo} 已退还，金额：¥${deposit.refundAmount}`,
    operator: req.user,
    oldStatus,
    newStatus: 'refunded',
  });

  res.json({
    ...deposit,
    statusDisplay: getDepositStatusDisplay(deposit.status),
  });
});

router.post('/:id/deduct', authenticate, requireRoles('operation_manager', 'finance'), (req: AuthRequest, res) => {
  const deposit = db.depositRecords.get(req.params.id);
  if (!deposit) {
    res.status(404).json({ error: '押金记录不存在' });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: '未认证' });
    return;
  }

  if (deposit.status !== 'paid') {
    res.status(400).json({ error: '只能扣除已支付的押金' });
    return;
  }

  const { deductionReason, deductionAmount, refundAmount } = req.body;
  const oldStatus = deposit.status;

  deposit.status = 'deducted';
  deposit.deductionReason = deductionReason;
  deposit.deductionAmount = Number(deductionAmount);
  deposit.refundAmount = Number(refundAmount) || (deposit.amount - Number(deductionAmount));
  deposit.updatedAt = new Date().toISOString();

  db.depositRecords.set(deposit.id, deposit);

  logOperation({
    entityType: 'deposit',
    entityId: deposit.id,
    action: 'deduct',
    description: `扣除押金 ${deposit.depositNo}，扣除金额：¥${deductionAmount}，原因：${deductionReason}`,
    operator: req.user,
    oldStatus,
    newStatus: 'deducted',
    details: { deductionReason, deductionAmount, refundAmount: deposit.refundAmount },
  });

  if (deposit.refundAmount && deposit.refundAmount > 0) {
    deposit.status = 'refunding';
    deposit.updatedAt = new Date().toISOString();
    db.depositRecords.set(deposit.id, deposit);
  }

  res.json({
    ...deposit,
    statusDisplay: getDepositStatusDisplay(deposit.status),
  });
});

router.post('/:id/dispute', authenticate, (req: AuthRequest, res) => {
  const deposit = db.depositRecords.get(req.params.id);
  if (!deposit) {
    res.status(404).json({ error: '押金记录不存在' });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: '未认证' });
    return;
  }

  const { disputes } = req.body;
  const oldStatus = deposit.status;

  deposit.status = 'disputed';
  deposit.disputes = disputes;
  deposit.updatedAt = new Date().toISOString();

  db.depositRecords.set(deposit.id, deposit);

  logOperation({
    entityType: 'deposit',
    entityId: deposit.id,
    action: 'raise_dispute',
    description: `押金 ${deposit.depositNo} 存在争议：${disputes}`,
    operator: req.user,
    oldStatus,
    newStatus: 'disputed',
    details: { disputes },
  });

  res.json({
    ...deposit,
    statusDisplay: getDepositStatusDisplay(deposit.status),
  });
});

router.get('/statistics/summary', authenticate, (req, res) => {
  const deposits = Array.from(db.depositRecords.values());

  const totalUnpaid = deposits.filter(d => d.status === 'unpaid').reduce((sum, d) => sum + d.amount, 0);
  const totalPaid = deposits.filter(d => d.status === 'paid').reduce((sum, d) => sum + d.amount, 0);
  const totalRefunding = deposits.filter(d => d.status === 'refunding').reduce((sum, d) => sum + (d.refundAmount || 0), 0);
  const totalRefunded = deposits.filter(d => d.status === 'refunded').reduce((sum, d) => sum + (d.refundAmount || 0), 0);
  const totalDeducted = deposits.filter(d => d.status === 'deducted' || d.deductionAmount).reduce((sum, d) => sum + (d.deductionAmount || 0), 0);
  const totalDisputed = deposits.filter(d => d.status === 'disputed').length;

  res.json({
    total: deposits.length,
    totalUnpaid,
    totalPaid,
    totalRefunding,
    totalRefunded,
    totalDeducted,
    totalDisputed,
  });
});

export default router;
