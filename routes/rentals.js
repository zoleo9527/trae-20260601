const { Router } = require('express');
const { prisma, createAuditLog, paginate, filterRentals } = require('../db');
const router = Router();

router.get('/', async (req, res) => {
  try {
    const { page, pageSize, skip, take } = paginate(req.query);
    const where = filterRentals(req.query);
    const [items, total] = await Promise.all([
      prisma.rentalOrder.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { depositVerifications: true, _count: { select: { coachSchedules: true, rescueRecords: true } } } }),
      prisma.rentalOrder.count({ where })
    ]);
    res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const item = await prisma.rentalOrder.findUnique({
      where: { id: req.params.id },
      include: {
        coachSchedules: true,
        rescueRecords: true,
        depositVerifications: { orderBy: { createdAt: 'desc' } },
        auditLogs: { orderBy: { createdAt: 'desc' } }
      }
    });
    if (!item) return res.status(404).json({ error: '未找到租赁单' });
    res.json(item);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { orderNo, guestName, guestPhone, idCardNo, equipmentType, equipmentCode, size, depositAmount, operatorName, notes } = req.body;
    if (!orderNo || !guestName || !guestPhone || !equipmentType || !equipmentCode || !depositAmount || !operatorName) {
      return res.status(400).json({ error: '缺少必填字段' });
    }
    const existing = await prisma.rentalOrder.findUnique({ where: { orderNo } });
    if (existing) return res.json({ item: existing, created: false });
    const item = await prisma.rentalOrder.create({
      data: { orderNo, guestName, guestPhone, idCardNo: idCardNo || '', equipmentType, equipmentCode, size: size || '', depositAmount: parseFloat(depositAmount), operatorName, notes: notes || '' }
    });
    await createAuditLog('RentalOrder', item.id, 'create', '', 'rented', operatorName, '创建租赁单', { rentalOrderId: item.id });
    res.status(201).json({ item, created: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id/status', async (req, res) => {
  try {
    const { status, operatorName, notes } = req.body;
    const validStatuses = ['rented', 'returned', 'damaged', 'lost'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: '无效状态' });
    if (!operatorName) return res.status(400).json({ error: '操作人必填' });
    const current = await prisma.rentalOrder.findUnique({ where: { id: req.params.id } });
    if (!current) return res.status(404).json({ error: '未找到租赁单' });
    const updated = await prisma.rentalOrder.update({
      where: { id: req.params.id },
      data: { status, notes: notes ? `${current.notes}\n[${new Date().toISOString()}] ${notes}` : current.notes, returnedAt: ['returned', 'damaged', 'lost'].includes(status) ? new Date() : current.returnedAt }
    });
    await createAuditLog('RentalOrder', updated.id, 'status_change', current.status, status, operatorName, notes || `状态变更: ${current.status} → ${status}`, { rentalOrderId: updated.id });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
