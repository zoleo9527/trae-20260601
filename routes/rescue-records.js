const { Router } = require('express');
const { prisma, createAuditLog, paginate, filterRescueRecords } = require('../db');
const router = Router();

router.get('/', async (req, res) => {
  try {
    const { page, pageSize, skip, take } = paginate(req.query);
    const where = filterRescueRecords(req.query);
    const [items, total] = await Promise.all([
      prisma.rescueRecord.findMany({
        where, skip, take, orderBy: { createdAt: 'desc' },
        include: {
          rentalOrder: { select: { orderNo: true, equipmentType: true, status: true, depositStatus: true } },
          coachSchedule: { select: { coachName: true, scheduleDate: true, timeSlot: true, status: true } }
        }
      }),
      prisma.rescueRecord.count({ where })
    ]);
    res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const item = await prisma.rescueRecord.findUnique({
      where: { id: req.params.id },
      include: { rentalOrder: true, coachSchedule: true, auditLogs: { orderBy: { createdAt: 'desc' } } }
    });
    if (!item) return res.status(404).json({ error: '未找到救援记录' });
    res.json(item);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { guestName, guestPhone, incidentType, incidentTime, location, description, severity, rentalOrderId, coachScheduleId, operatorName, evidenceNotes } = req.body;
    if (!guestName || !incidentType || !incidentTime || !location || !description || !operatorName) {
      return res.status(400).json({ error: '缺少必填字段' });
    }
    if (rentalOrderId) {
      const rental = await prisma.rentalOrder.findUnique({ where: { id: rentalOrderId } });
      if (!rental) return res.status(400).json({ error: '关联租赁单不存在' });
    }
    if (coachScheduleId) {
      const coach = await prisma.coachSchedule.findUnique({ where: { id: coachScheduleId } });
      if (!coach) return res.status(400).json({ error: '关联排班记录不存在' });
    }
    const item = await prisma.rescueRecord.create({
      data: {
        guestName, guestPhone: guestPhone || '',
        incidentType, incidentTime: new Date(incidentTime),
        location, description,
        severity: severity || 'minor',
        rentalOrderId: rentalOrderId || null,
        coachScheduleId: coachScheduleId || null,
        operatorName,
        evidenceNotes: evidenceNotes || ''
      }
    });
    await createAuditLog('RescueRecord', item.id, 'create', '', 'reported', operatorName, '创建救援记录', { rescueRecordId: item.id });
    res.status(201).json(item);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id/status', async (req, res) => {
  try {
    const { status, operatorName, notes } = req.body;
    const validStatuses = ['reported', 'in_treatment', 'resolved'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: '无效状态' });
    if (!operatorName) return res.status(400).json({ error: '操作人必填' });
    const current = await prisma.rescueRecord.findUnique({ where: { id: req.params.id } });
    if (!current) return res.status(404).json({ error: '未找到救援记录' });
    const updated = await prisma.rescueRecord.update({
      where: { id: req.params.id },
      data: {
        status,
        evidenceNotes: notes ? `${current.evidenceNotes}\n[${new Date().toISOString()}] ${notes}` : current.evidenceNotes,
        resolvedAt: status === 'resolved' ? new Date() : current.resolvedAt
      }
    });
    await createAuditLog('RescueRecord', updated.id, 'status_change', current.status, status, operatorName, notes || `状态变更: ${current.status} → ${status}`, { rescueRecordId: updated.id });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
