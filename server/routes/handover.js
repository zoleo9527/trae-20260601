const express = require('express');
const router = express.Router();
const db = require('../db');
const dayjs = require('dayjs');

router.get('/preview', (req, res) => {
  const { from_user_id } = req.query;
  if (!from_user_id) return res.status(400).json({ error: '需要提供 from_user_id' });

  const pendingVisits = db.prepare(
    `SELECT v.id, v.animal_id, v.status, v.visit_date, v.next_visit_date, v.health_status,
            a.name as animal_name, u.name as visitor_name
     FROM visit_records v
     LEFT JOIN animals a ON v.animal_id = a.id
     LEFT JOIN users u ON v.visitor_id = u.id
     WHERE v.visitor_id = ? AND v.status IN ('pending', 'need_followup')
     ORDER BY v.visit_date ASC`
  ).all(from_user_id);

  const activeRecalls = db.prepare(
    `SELECT r.id, r.animal_id, r.status, r.reason, r.report_date,
            a.name as animal_name,
            u1.name as reporter_name, u2.name as handler_name
     FROM recall_records r
     LEFT JOIN animals a ON r.animal_id = a.id
     LEFT JOIN users u1 ON r.reporter_id = u1.id
     LEFT JOIN users u2 ON r.handler_id = u2.id
     WHERE (r.reporter_id = ? OR r.handler_id = ?)
       AND r.status IN ('initiated', 'reviewing', 'executing')
     ORDER BY r.created_at DESC`
  ).all(from_user_id, from_user_id);

  res.json({
    pending_visits: pendingVisits,
    active_recalls: activeRecalls,
    pending_visits_count: pendingVisits.length,
    active_recalls_count: activeRecalls.length,
  });
});

router.get('/', (req, res) => {
  const list = db.prepare(
    `SELECT h.*, u1.name as from_user_name, u2.name as to_user_name
     FROM shift_handovers h
     JOIN users u1 ON h.from_user_id = u1.id
     JOIN users u2 ON h.to_user_id = u2.id
     ORDER BY h.created_at DESC`
  ).all();
  res.json(list);
});

function expandHandover(id) {
  const handover = db.prepare(
    `SELECT h.*, u1.name as from_user_name, u2.name as to_user_name
     FROM shift_handovers h
     JOIN users u1 ON h.from_user_id = u1.id
     JOIN users u2 ON h.to_user_id = u2.id
     WHERE h.id = ?`
  ).get(id);
  if (!handover) return null;

  const pendingVisits = [];
  if (handover.visit_ids) {
    const ids = handover.visit_ids.split(',').map(Number).filter(Boolean);
    if (ids.length) {
      const placeholders = ids.map(() => '?').join(',');
      const rows = db.prepare(
        `SELECT v.id, v.animal_id, v.status, v.visit_date, v.next_visit_date, v.health_status,
                a.name as animal_name, u.name as visitor_name
         FROM visit_records v
         LEFT JOIN animals a ON v.animal_id = a.id
         LEFT JOIN users u ON v.visitor_id = u.id
         WHERE v.id IN (${placeholders})`
      ).all(...ids);
      pendingVisits.push(...rows);
    }
  }

  const activeRecalls = [];
  if (handover.recall_ids) {
    const ids = handover.recall_ids.split(',').map(Number).filter(Boolean);
    if (ids.length) {
      const placeholders = ids.map(() => '?').join(',');
      const rows = db.prepare(
        `SELECT r.id, r.animal_id, r.status, r.reason, r.report_date,
                a.name as animal_name,
                u1.name as reporter_name, u2.name as handler_name
         FROM recall_records r
         LEFT JOIN animals a ON r.animal_id = a.id
         LEFT JOIN users u1 ON r.reporter_id = u1.id
         LEFT JOIN users u2 ON r.handler_id = u2.id
         WHERE r.id IN (${placeholders})`
      ).all(...ids);
      activeRecalls.push(...rows);
    }
  }

  const attachments = db.prepare(
    `SELECT id, file_name, file_path, file_size, uploaded_at FROM attachments WHERE entity_type = 'handover' AND entity_id = ?`
  ).all(id);

  return {
    ...handover,
    pending_visits: pendingVisits,
    active_recalls: activeRecalls,
    attachments,
    pending_visits_count: handover.pending_visits,
    active_recalls_count: handover.active_recalls,
  };
}

router.get('/:id', (req, res) => {
  const result = expandHandover(req.params.id);
  if (!result) return res.status(404).json({ error: '交班记录不存在' });
  res.json(result);
});

router.post('/', (req, res) => {
  const { from_user_id, to_user_id, handover_date, summary, key_notes } = req.body;
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  const pendingVisitsCount = db.prepare(
    `SELECT COUNT(*) as count FROM visit_records WHERE visitor_id = ? AND status IN ('pending', 'need_followup')`
  ).get(from_user_id).count;

  const activeRecallsCount = db.prepare(
    `SELECT COUNT(*) as count FROM recall_records WHERE (reporter_id = ? OR handler_id = ?) AND status IN ('initiated', 'reviewing', 'executing')`
  ).get(from_user_id, from_user_id).count;

  const visitRows = db.prepare(
    `SELECT id FROM visit_records WHERE visitor_id = ? AND status IN ('pending', 'need_followup')`
  ).all(from_user_id);
  const visitIds = visitRows.map(r => r.id).join(',');

  const recallRows = db.prepare(
    `SELECT id FROM recall_records WHERE (reporter_id = ? OR handler_id = ?) AND status IN ('initiated', 'reviewing', 'executing')`
  ).all(from_user_id, from_user_id);
  const recallIds = recallRows.map(r => r.id).join(',');

  const result = db.prepare(
    `INSERT INTO shift_handovers (from_user_id, to_user_id, handover_date, pending_visits, active_recalls, summary, key_notes, visit_ids, recall_ids, status, confirmed_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(from_user_id, to_user_id, handover_date || now, pendingVisitsCount, activeRecallsCount, summary || null, key_notes || null, visitIds || null, recallIds || null, 'pending', null, now);

  const expanded = expandHandover(result.lastInsertRowid);
  res.status(201).json(expanded);
});

router.put('/:id', (req, res) => {
  const handover = db.prepare('SELECT * FROM shift_handovers WHERE id = ?').get(req.params.id);
  if (!handover) return res.status(404).json({ error: '交班记录不存在' });

  const { summary, key_notes } = req.body;

  db.prepare(
    'UPDATE shift_handovers SET summary = ?, key_notes = ? WHERE id = ?'
  ).run(
    summary ?? handover.summary,
    key_notes ?? handover.key_notes,
    req.params.id
  );

  const expanded = expandHandover(req.params.id);
  res.json(expanded);
});

router.put('/:id/confirm', (req, res) => {
  const handover = db.prepare('SELECT * FROM shift_handovers WHERE id = ?').get(req.params.id);
  if (!handover) return res.status(404).json({ error: '交班记录不存在' });

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  db.prepare('UPDATE shift_handovers SET status = ?, confirmed_at = ? WHERE id = ?').run('confirmed', now, req.params.id);

  const expanded = expandHandover(req.params.id);
  res.json(expanded);
});

module.exports = router;
