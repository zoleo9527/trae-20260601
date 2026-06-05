const { Router } = require('express');
const { prisma, createAuditLog, paginate, filterCoachSchedules } = require('../db');
const router = Router();

router.get('/', async (req, res) => {
  try {
    const { page, pageSize, skip, take } = paginate(req.query);
    const where = filterCoachSchedules(req.query);
    const [items, total] = await Promise.all([
      prisma.coachSchedule.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { rentalOrder: { select: { orderNo: true, equipmentType: true, status: true } }, _count: { select: { rescueRecords: true } } } }),
      prisma.coachSchedule.count({ where })
    ]);
    res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const item = await prisma.coachSchedule.findUnique({
      where: { id: req.params.id },
      include: { rentalOrder: true, rescueRecords: true, auditLogs: { orderBy: { createdAt: 'desc' } } }
    });
    if (!item) return res.status(404).json({ error: '未找到排班记录' });
    res.json(item);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { coachName, guestName, guestPhone, scheduleDate, timeSlot, courseType, rentalOrderId, operatorName, notes } = req.body;
    if (!coachName || !guestName || !scheduleDate || !timeSlot || !courseType || !operatorName) {
      return res.status(400).json({ error: '缺少必填字段' });
    }
    if (rentalOrderId) {
      const rental = await prisma.rentalOrder.findUnique({ where: { id: rentalOrderId } });
      if (!rental) return res.status(400).json({ error: '关联租赁单不存在' });
    }
    const item = await prisma.coachSchedule.create({
      data: { coachName, guestName, guestPhone: guestPhone || '', scheduleDate, timeSlot, courseType, rentalOrderId: rentalOrderId || null, operatorName, notes: notes || '' }
    });
    await createAuditLog('CoachSchedule', item.id, 'create', '', 'scheduled', operatorName, '创建教练排班', { coachScheduleId: item.id });
    res.status(201).json(item);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id/status', async (req, res) => {
  try {
    const { status, operatorName, notes } = req.body;
    const validStatuses = ['scheduled', 'in_progress', 'completed', 'no_show'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: '无效状态' });
    if (!operatorName) return res.status(400).json({ error: '操作人必填' });
    const current = await prisma.coachSchedule.findUnique({ where: { id: req.params.id } });
    if (!current) return res.status(404).json({ error: '未找到排班记录' });
    const updated = await prisma.coachSchedule.update({
      where: { id: req.params.id },
      data: { status, notes: notes ? `${current.notes}\n[${new Date().toISOString()}] ${notes}` : current.notes, completedAt: ['completed', 'no_show'].includes(status) ? new Date() : current.completedAt }
    });
    await createAuditLog('CoachSchedule', updated.id, 'status_change', current.status, status, operatorName, notes || `状态变更: ${current.status} → ${status}`, { coachScheduleId: updated.id });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
