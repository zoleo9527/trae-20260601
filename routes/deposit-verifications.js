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
    const rental = await prisma.rentalOrder.findUnique({
      where: { id: rentalOrderId },
      include: { depositVerifications: { orderBy: { createdAt: 'desc' } } }
    });
    if (!rental) return res.status(400).json({ error: '关联租赁单不存在' });

    const vType = verificationType || 'return_check';
    const existingPending = rental.depositVerifications.find(v => v.status === 'pending' && v.verificationType === vType);
    if (existingPending) {
      return res.json({ item: existingPending, created: false, message: '该租赁单已有待处理的同类型核验记录，已复用返回' });
    }
    const existingAnyPending = rental.depositVerifications.find(v => v.status === 'pending');
    if (existingAnyPending) {
      return res.status(409).json({ error: '该租赁单已有待处理的核验记录(类型: ' + (existingAnyPending.verificationType === 'return_check' ? '归还核验' : '损坏评估') + ')，请先处理完成后再创建新核验', existingId: existingAnyPending.id });
    }

    const item = await prisma.depositVerification.create({
      data: {
        rentalOrderId,
        verificationType: vType,
        depositAmount: parseFloat(depositAmount),
        actualRefund: actualRefund != null ? parseFloat(actualRefund) : null,
        damageDeducted: damageDeducted ? parseFloat(damageDeducted) : 0,
        damageNotes: damageNotes || '',
        verifierName,
        evidencePhotos: evidencePhotos || '',
        notes: notes || ''
      }
    });
    await createAuditLog('DepositVerification', item.id, 'create', '', 'pending', verifierName, '创建押金核验', { depositVerificationId: item.id, rentalOrderId });
    res.status(201).json({ item, created: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id/verify', async (req, res) => {
  try {
    const { status, actualRefund, damageDeducted, damageNotes, verifierName, notes } = req.body;
    const validStatuses = ['verified', 'refunded', 'forfeited'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: '无效核验状态' });
    if (!verifierName) return res.status(400).json({ error: '核验人必填' });
    const current = await prisma.depositVerification.findUnique({
      where: { id: req.params.id },
      include: { rentalOrder: { select: { id: true, orderNo: true, notes: true, status: true, depositStatus: true } } }
    });
    if (!current) return res.status(404).json({ error: '未找到核验记录' });
    if (current.status !== 'pending') return res.status(400).json({ error: '该核验已处理，不可重复操作' });

    const finalDamageDeducted = damageDeducted != null ? parseFloat(damageDeducted) : current.damageDeducted;
    const finalActualRefund = actualRefund != null ? parseFloat(actualRefund) : null;
    const finalDamageNotes = damageNotes || current.damageNotes;
    const finalNotes = notes ? `${current.notes}\n[${new Date().toISOString()}] ${notes}` : current.notes;

    const updated = await prisma.depositVerification.update({
      where: { id: req.params.id },
      data: {
        status,
        actualRefund: finalActualRefund,
        damageDeducted: finalDamageDeducted,
        damageNotes: finalDamageNotes,
        notes: finalNotes,
        verifiedAt: new Date()
      }
    });

    const depositStatus = status === 'refunded' ? 'refunded' : status === 'forfeited' ? 'forfeited' : 'verified';
    const conclusion = `[${new Date().toISOString()}] 押金核验结论: 类型=${current.verificationType === 'return_check' ? '归还核验' : '损坏评估'}, 结果=${status === 'verified' ? '核验通过' : status === 'refunded' ? '已退还' : '已扣押'}, 押金=¥${current.depositAmount}, 扣除=¥${finalDamageDeducted}, 退还=¥${finalActualRefund || 0}, 核验人=${verifierName}${finalDamageNotes ? ', 损坏说明=' + finalDamageNotes : ''}${notes ? ', 备注=' + notes : ''}`;
    await prisma.rentalOrder.update({
      where: { id: current.rentalOrderId },
      data: {
        depositStatus,
        notes: current.rentalOrder.notes ? current.rentalOrder.notes + '\n' + conclusion : conclusion
      }
    });

    await createAuditLog('DepositVerification', updated.id, 'verify', current.status, status, verifierName, notes || `押金核验: ${current.status} → ${status}`, { depositVerificationId: updated.id, rentalOrderId: current.rentalOrderId });
    await createAuditLog('RentalOrder', current.rentalOrderId, 'deposit_status_change', current.rentalOrder.depositStatus, depositStatus, verifierName, conclusion, { rentalOrderId: current.rentalOrderId });

    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
