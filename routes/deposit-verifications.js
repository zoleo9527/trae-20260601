const { Router } = require('express');
const { prisma, createAuditLog, paginate, filterDepositVerifications } = require('../db');
const router = Router();

router.get('/', async (req, res) => {
  try {
    const { page, pageSize, skip, take } = paginate(req.query);
    const where = filterDepositVerifications(req.query);
    const [items, total] = await Promise.all([
      prisma.depositVerification.findMany({
        where, skip, take, orderBy: { createdAt: 'desc' },
        include: { rentalOrder: { select: { orderNo: true, guestName: true, equipmentType: true, equipmentCode: true, status: true, depositAmount: true, depositStatus: true } } }
      }),
      prisma.depositVerification.count({ where })
    ]);
    res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const item = await prisma.depositVerification.findUnique({
      where: { id: req.params.id },
      include: { rentalOrder: { include: { coachSchedules: true, rescueRecords: true } }, auditLogs: { orderBy: { createdAt: 'desc' } } }
    });
    if (!item) return res.status(404).json({ error: '未找到核验记录' });
    res.json(item);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { rentalOrderId, verificationType, depositAmount, actualRefund, damageDeducted, damageNotes, verifierName, evidencePhotos, notes } = req.body;
    if (!rentalOrderId || !depositAmount || !verifierName) {
      return res.status(400).json({ error: '缺少必填字段' });
    }
    const rental = await prisma.rentalOrder.findUnique({ where: { id: rentalOrderId } });
    if (!rental) return res.status(400).json({ error: '关联租赁单不存在' });
    const item = await prisma.depositVerification.create({
      data: {
        rentalOrderId,
        verificationType: verificationType || 'return_check',
        depositAmount: parseFloat(depositAmount),
        actualRefund: actualRefund != null ? parseFloat(actualRefund) : null,
        damageDeducted: damageDeducted ? parseFloat(damageDeducted) : 0,
        damageNotes: damageNotes || '',
        verifierName,
        evidencePhotos: evidencePhotos || '',
        notes: notes || ''
      }
    });
    await createAuditLog('DepositVerification', item.id, 'create', '', 'pending', verifierName, '创建押金核验', { depositVerificationId: item.id });
    res.status(201).json(item);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id/verify', async (req, res) => {
  try {
    const { status, actualRefund, damageDeducted, damageNotes, verifierName, notes } = req.body;
    const validStatuses = ['verified', 'refunded', 'forfeited'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: '无效核验状态' });
    if (!verifierName) return res.status(400).json({ error: '核验人必填' });
    const current = await prisma.depositVerification.findUnique({ where: { id: req.params.id } });
    if (!current) return res.status(404).json({ error: '未找到核验记录' });
    if (current.status !== 'pending') return res.status(400).json({ error: '该核验已处理，不可重复操作' });
    const updated = await prisma.depositVerification.update({
      where: { id: req.params.id },
      data: {
        status,
        actualRefund: actualRefund != null ? parseFloat(actualRefund) : null,
        damageDeducted: damageDeducted != null ? parseFloat(damageDeducted) : current.damageDeducted,
        damageNotes: damageNotes || current.damageNotes,
        notes: notes ? `${current.notes}\n[${new Date().toISOString()}] ${notes}` : current.notes,
        verifiedAt: new Date()
      }
    });
    await prisma.rentalOrder.update({
      where: { id: current.rentalOrderId },
      data: { depositStatus: status === 'refunded' ? 'refunded' : status === 'forfeited' ? 'forfeited' : 'verified' }
    });
    await createAuditLog('DepositVerification', updated.id, 'verify', current.status, status, verifierName, notes || `押金核验: ${current.status} → ${status}`, { depositVerificationId: updated.id });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
