const express = require('express');
const router = express.Router();
const db = require('../db');
const dayjs = require('dayjs');

router.get('/', (req, res) => {
  const list = db.prepare(
    `SELECT h.*, u1.name as from_user_name, u2.name as to_user_name FROM shift_handovers h JOIN users u1 ON h.from_user_id = u1.id JOIN users u2 ON h.to_user_id = u2.id ORDER BY h.created_at DESC`
  ).all();
  res.json(list);
});

router.get('/:id', (req, res) => {
  const handover = db.prepare(
    `SELECT h.*, u1.name as from_user_name, u2.name as to_user_name FROM shift_handovers h JOIN users u1 ON h.from_user_id = u1.id JOIN users u2 ON h.to_user_id = u2.id WHERE h.id = ?`
  ).get(req.params.id);
  if (!handover) return res.status(404).json({ error: '交班记录不存在' });
  res.json(handover);
});

router.post('/', (req, res) => {
  const { from_user_id, to_user_id, handover_date, summary, key_notes } = req.body;
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  const pendingVisits = db.prepare(
    `SELECT COUNT(*) as count FROM visit_records WHERE visitor_id = ? AND status IN ('pending', 'need_followup')`
  ).get(from_user_id).count;

  const activeRecalls = db.prepare(
    `SELECT COUNT(*) as count FROM recall_records WHERE status NOT IN ('closed', 'recalled')`
  ).get().count;

  const visitRows = db.prepare(
    `SELECT id FROM visit_records WHERE visitor_id = ? AND status IN ('pending', 'need_followup')`
  ).all(from_user_id);
  const visitIds = visitRows.map(r => r.id).join(',');

  const recallRows = db.prepare(
    `SELECT id FROM recall_records WHERE status NOT IN ('closed', 'recalled')`
  ).all();
  const recallIds = recallRows.map(r => r.id).join(',');

  const result = db.prepare(
    `INSERT INTO shift_handovers (from_user_id, to_user_id, handover_date, pending_visits, active_recalls, summary, key_notes, visit_ids, recall_ids, status, confirmed_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(from_user_id, to_user_id, handover_date || now, pendingVisits, activeRecalls, summary || null, key_notes || null, visitIds || null, recallIds || null, 'pending', null, now);

  const handover = db.prepare('SELECT * FROM shift_handovers WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(handover);
});

router.put('/:id/confirm', (req, res) => {
  const handover = db.prepare('SELECT * FROM shift_handovers WHERE id = ?').get(req.params.id);
  if (!handover) return res.status(404).json({ error: '交班记录不存在' });

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  db.prepare('UPDATE shift_handovers SET status = ?, confirmed_at = ? WHERE id = ?').run('confirmed', now, req.params.id);

  const updated = db.prepare('SELECT * FROM shift_handovers WHERE id = ?').get(req.params.id);
  res.json(updated);
});

module.exports = router;
