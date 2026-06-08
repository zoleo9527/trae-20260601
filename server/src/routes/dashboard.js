const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

router.get('/stats', (req, res) => {
  try {
    const db = getDb();

    const totalContainers = db.prepare('SELECT COUNT(*) as count FROM containers').get().count;
    const inYard = db.prepare("SELECT COUNT(*) as count FROM containers WHERE status IN ('IN_YARD', 'ALLOCATED')").get().count;
    const misplaced = db.prepare("SELECT COUNT(*) as count FROM containers WHERE status = 'MISPLACED'").get().count;

    const overdueFees = db.prepare(`
      SELECT COUNT(*) as count, SUM(total_fee) as total
      FROM fee_items WHERE status IN ('PENDING', 'DISPUTED')
    `).get();

    const missedInspections = db.prepare("SELECT COUNT(*) as count FROM inspection_plans WHERE status = 'MISSED'").get().count;

    const pendingAllocations = db.prepare(`
      SELECT COUNT(*) as count FROM containers
      WHERE status IN ('ENTERING', 'IN_YARD') AND slot_id IS NULL
    `).get().count;

    const entering = db.prepare("SELECT COUNT(*) as count FROM containers WHERE status = 'ENTERING'").get().count;
    const departing = db.prepare("SELECT COUNT(*) as count FROM containers WHERE status = 'DEPARTING'").get().count;
    const departed = db.prepare("SELECT COUNT(*) as count FROM containers WHERE status = 'DEPARTED'").get().count;
    const disputedFees = db.prepare("SELECT COUNT(*) as count FROM fee_items WHERE status = 'DISPUTED'").get().count;

    const slotsEmpty = db.prepare("SELECT COUNT(*) as count FROM slots WHERE status = 'EMPTY'").get().count;
    const slotsOccupied = db.prepare("SELECT COUNT(*) as count FROM slots WHERE status = 'OCCUPIED'").get().count;
    const slotsTotal = db.prepare('SELECT COUNT(*) as count FROM slots').get().count;

    res.json({
      success: true,
      data: {
        containers: { total: totalContainers, inYard, misplaced, entering, departing, departed },
        fees: {
          overdueCount: overdueFees.count,
          overdueTotal: overdueFees.total || 0,
          disputedCount: disputedFees,
        },
        inspections: { missed: missedInspections },
        allocations: { pending: pendingAllocations },
        slots: { total: slotsTotal, empty: slotsEmpty, occupied: slotsOccupied, utilization: ((slotsOccupied / slotsTotal) * 100).toFixed(1) + '%' },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/recent-alerts', (req, res) => {
  try {
    const db = getDb();
    const limit = Number(req.query.limit) || 20;

    const statusChanges = db.prepare(`
      SELECT id, container_no, from_status, to_status, changed_by, changed_at, reason, detail, 'STATUS_CHANGE' as alert_type
      FROM status_change_logs
      ORDER BY changed_at DESC LIMIT ?
    `).all(limit);

    const misplaced = db.prepare(`
      SELECT c.id, c.container_no, c.status, s.slot_code, s.allowed_type, 'MISPLACED' as alert_type
      FROM containers c JOIN slots s ON c.slot_id = s.id
      WHERE c.status = 'MISPLACED'
         OR (s.allowed_type != '' AND s.allowed_type != c.type AND s.allowed_type NOT LIKE '%' || c.type || '%')
      LIMIT ?
    `).all(limit);

    const missedInspections = db.prepare(`
      SELECT ip.id, ip.container_no, ip.plan_type, ip.planned_date, ip.missed_reason, 'MISSED_INSPECTION' as alert_type
      FROM inspection_plans ip WHERE ip.status = 'MISSED'
      LIMIT ?
    `).all(limit);

    const disputedFees = db.prepare(`
      SELECT fi.id, fi.container_no, fi.total_fee, fi.dispute_reason, fi.dispute_handler, 'FEE_DISPUTE' as alert_type
      FROM fee_items fi WHERE fi.status = 'DISPUTED'
      LIMIT ?
    `).all(limit);

    const allAlerts = [
      ...statusChanges.map(a => ({ ...a, alert_type: 'STATUS_CHANGE', severity: 'info' })),
      ...misplaced.map(a => ({ ...a, alert_type: 'MISPLACED', severity: 'warning' })),
      ...missedInspections.map(a => ({ ...a, alert_type: 'MISSED_INSPECTION', severity: 'danger' })),
      ...disputedFees.map(a => ({ ...a, alert_type: 'FEE_DISPUTE', severity: 'warning' })),
    ];

    res.json({ success: true, data: allAlerts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
