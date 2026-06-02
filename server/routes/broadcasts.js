const express = require('express');
const { getDb } = require('../db');
const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { confirmed, schedule_id } = req.query;

  let sql = `
    SELECT bl.*, s.channel, s.time_slot, s.schedule_date, s.duration,
      o.order_no, o.client_name, m.file_name
    FROM broadcast_logs bl
    JOIN schedules s ON bl.schedule_id = s.id
    JOIN orders o ON s.order_id = o.id
    JOIN materials m ON s.material_id = m.id
    WHERE 1=1
  `;
  const params = [];

  if (confirmed !== undefined) {
    sql += ' AND bl.confirmed = ?';
    params.push(confirmed);
  }
  if (schedule_id) {
    sql += ' AND bl.schedule_id = ?';
    params.push(schedule_id);
  }

  sql += ' ORDER BY bl.created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

router.put('/:id/confirm', (req, res) => {
  const db = getDb();
  const { confirmed_by, notes } = req.body;

  db.prepare(`
    UPDATE broadcast_logs SET confirmed=1, confirmed_by=?, confirmed_time=datetime('now','localtime'), notes=?
    WHERE id=?
  `).run(confirmed_by, notes || '', req.params.id);

  const broadcast = db.prepare(`
    SELECT bl.*, s.order_id FROM broadcast_logs bl
    JOIN schedules s ON bl.schedule_id = s.id
    WHERE bl.id = ?
  `).get(req.params.id);

  db.prepare(`
    INSERT INTO audit_logs (order_id, action, from_status, to_status, operator, notes)
    VALUES (?, 'broadcast_confirmed', 'aired_pending', 'confirmed', ?, ?)
  `).run(broadcast.order_id, confirmed_by, notes || '播出确认完成');

  const unconfirmed = db.prepare(`
    SELECT COUNT(*) as cnt FROM broadcast_logs bl
    JOIN schedules s ON bl.schedule_id = s.id
    WHERE s.order_id = ? AND bl.confirmed = 0 AND bl.air_status = 'aired'
  `).get(broadcast.order_id);

  if (unconfirmed.cnt === 0) {
    db.prepare('UPDATE orders SET status="completed", updated_at=datetime("now","localtime") WHERE id=?').run(broadcast.order_id);
    db.prepare(`
      INSERT INTO audit_logs (order_id, action, from_status, to_status, operator, notes)
      VALUES (?, 'order_status_change', 'aired_pending', 'completed', '系统', '所有排期已确认，订单完成')
    `).run(broadcast.order_id);
  }

  res.json({ success: true });
});

module.exports = router;
