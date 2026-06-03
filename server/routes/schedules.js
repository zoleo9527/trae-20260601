const express = require('express');
const { getDb } = require('../db');
const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { date, channel, status, start_date, end_date } = req.query;

  let sql = `
    SELECT s.*, o.order_no, o.client_name, m.file_name, m.version as material_version, m.duration as material_duration
    FROM schedules s
    JOIN orders o ON s.order_id = o.id
    JOIN materials m ON s.material_id = m.id
    WHERE 1=1
  `;
  const params = [];

  if (date) {
    sql += ' AND s.schedule_date = ?';
    params.push(date);
  }
  if (channel) {
    sql += ' AND s.channel = ?';
    params.push(channel);
  }
  if (status) {
    sql += ' AND s.status = ?';
    params.push(status);
  }
  if (start_date) {
    sql += ' AND s.schedule_date >= ?';
    params.push(start_date);
  }
  if (end_date) {
    sql += ' AND s.schedule_date <= ?';
    params.push(end_date);
  }

  sql += ' ORDER BY s.schedule_date, s.channel, s.time_slot';
  res.json(db.prepare(sql).all(...params));
});

router.get('/channels', (req, res) => {
  const db = getDb();
  const channels = db.prepare('SELECT DISTINCT channel FROM schedules ORDER BY channel').all();
  res.json(channels.map(c => c.channel));
});

router.get('/calendar', (req, res) => {
  const db = getDb();
  const { start_date, end_date } = req.query;

  const start = start_date || new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const end = end_date || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

  const schedules = db.prepare(`
    SELECT s.*, o.order_no, o.client_name, m.file_name, m.version as material_version
    FROM schedules s
    JOIN orders o ON s.order_id = o.id
    JOIN materials m ON s.material_id = m.id
    WHERE s.schedule_date BETWEEN ? AND ?
    ORDER BY s.schedule_date, s.channel, s.time_slot
  `).all(start, end);

  const byDate = {};
  for (const s of schedules) {
    if (!byDate[s.schedule_date]) byDate[s.schedule_date] = [];
    byDate[s.schedule_date].push(s);
  }

  res.json({ start, end, schedules: byDate });
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const { channel, time_slot, schedule_date, status, conflict_note } = req.body;

  db.prepare(`
    UPDATE schedules SET channel=?, time_slot=?, schedule_date=?, status=?, conflict_note=?
    WHERE id=?
  `).run(channel, time_slot, schedule_date, status, conflict_note || null, req.params.id);

  db.prepare(`
    INSERT INTO audit_logs (order_id, action, from_status, to_status, operator, notes)
    SELECT order_id, 'schedule_update', ?, ?, '排期-刘排', ?
    FROM schedules WHERE id=?
  `).run(status, status, `排期更新：${channel} ${schedule_date} ${time_slot}`, req.params.id);

  res.json({ success: true });
});

router.post('/batch-resolve', (req, res) => {
  const db = getDb();
  const { updates } = req.body;

  if (!updates || !Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ error: '请提供排期更新数据' });
  }

  const transaction = db.transaction(() => {
    const results = [];
    for (const u of updates) {
      const { id, channel, time_slot, schedule_date, position, status, conflict_note } = u;
      const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(id);
      if (!schedule) continue;

      const oldStatus = schedule.status;
      const newStatus = status || (oldStatus === 'conflict' ? 'scheduled' : oldStatus);

      db.prepare(`
        UPDATE schedules SET channel=?, time_slot=?, schedule_date=?, position=?, status=?, conflict_note=?
        WHERE id=?
      `).run(
        channel || schedule.channel,
        time_slot || schedule.time_slot,
        schedule_date || schedule.schedule_date,
        position || schedule.position,
        newStatus,
        conflict_note || null,
        id
      );

      db.prepare(`
        INSERT INTO audit_logs (order_id, action, from_status, to_status, operator, notes)
        VALUES (?, 'schedule_update', ?, ?, '排期-刘排', ?)
      `).run(
        schedule.order_id,
        oldStatus,
        newStatus,
        `排期${oldStatus === 'conflict' ? '冲突解决' : '更新'}：${channel || schedule.channel} ${schedule_date || schedule.schedule_date} ${time_slot || schedule.time_slot}`
      );

      results.push({ id, oldStatus, newStatus });
    }
    return results;
  });

  try {
    const results = transaction();
    res.json({ success: true, results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/check-conflict', (req, res) => {
  const db = getDb();
  const { channel, time_slot, schedule_date, exclude_id } = req.body;

  let sql = `SELECT s.*, o.order_no, o.client_name FROM schedules s JOIN orders o ON s.order_id = o.id WHERE s.channel=? AND s.time_slot=? AND s.schedule_date=? AND s.status != 'cancelled'`;
  const params = [channel, time_slot, schedule_date];

  if (exclude_id) {
    sql += ' AND s.id != ?';
    params.push(exclude_id);
  }

  const conflicts = db.prepare(sql).all(...params);
  res.json({ hasConflict: conflicts.length > 0, conflicts });
});

module.exports = router;
