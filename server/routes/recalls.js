const express = require('express');
const router = express.Router();
const db = require('../db');
const dayjs = require('dayjs');

const VALID_TRANSITIONS = {
  initiated: ['reviewing'],
  reviewing: ['executing', 'closed'],
  executing: ['recalled', 'closed'],
  recalled: [],
  closed: []
};

router.get('/', (req, res) => {
  const { status } = req.query;
  let where = [];
  let params = [];

  if (status) {
    where.push('r.status = ?');
    params.push(status);
  }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const list = db.prepare(
    `SELECT r.*, a.name as animal_name, u1.name as reporter_name, u2.name as handler_name FROM recall_records r LEFT JOIN animals a ON r.animal_id = a.id LEFT JOIN users u1 ON r.reporter_id = u1.id LEFT JOIN users u2 ON r.handler_id = u2.id ${whereClause} ORDER BY r.created_at DESC`
  ).all(...params);

  res.json(list);
});

router.get('/:id', (req, res) => {
  const recall = db.prepare(
    `SELECT r.*, a.name as animal_name, u1.name as reporter_name, u2.name as handler_name FROM recall_records r LEFT JOIN animals a ON r.animal_id = a.id LEFT JOIN users u1 ON r.reporter_id = u1.id LEFT JOIN users u2 ON r.handler_id = u2.id WHERE r.id = ?`
  ).get(req.params.id);
  if (!recall) return res.status(404).json({ error: '收回记录不存在' });

  let sourceVisit = null;
  if (recall.source_visit_id) {
    sourceVisit = db.prepare(
      `SELECT v.*, u.name as visitor_name FROM visit_records v LEFT JOIN users u ON v.visitor_id = u.id WHERE v.id = ?`
    ).get(recall.source_visit_id);
  }

  const animal = db.prepare('SELECT * FROM animals WHERE id = ?').get(recall.animal_id);

  const adoptionChain = [];
  if (sourceVisit && sourceVisit.adoption_id) {
    const adoption = db.prepare(
      `SELECT ad.*, u.name as reviewer_name FROM adoption_records ad LEFT JOIN users u ON ad.reviewer_id = u.id WHERE ad.id = ?`
    ).get(sourceVisit.adoption_id);
    if (adoption) adoptionChain.push(adoption);
  }

  res.json({ ...recall, source_visit: sourceVisit, animal, adoption_chain: adoptionChain });
});

router.post('/', (req, res) => {
  const { animal_id, source_visit_id, reason, report_date, reporter_id, reporter_role, handler_id, handler_role } = req.body;
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  const doCreate = db.transaction(() => {
    const result = db.prepare(
      `INSERT INTO recall_records (animal_id, source_visit_id, reason, report_date, reporter_id, reporter_role, status, handler_id, handler_role, resolution, resolved_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(animal_id, source_visit_id || null, reason, report_date || now, reporter_id || null, reporter_role || null, 'initiated', handler_id || null, handler_role || null, null, null, now, now);

    const recallId = result.lastInsertRowid;

    if (source_visit_id) {
      db.prepare('UPDATE visit_records SET status = ?, recall_id = ?, updated_at = ? WHERE id = ?').run('transferred_to_recall', recallId, now, source_visit_id);
    }

    return recallId;
  });

  const recallId = doCreate();
  const recall = db.prepare('SELECT * FROM recall_records WHERE id = ?').get(recallId);
  res.status(201).json(recall);
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const recall = db.prepare('SELECT * FROM recall_records WHERE id = ?').get(id);
  if (!recall) return res.status(404).json({ error: '收回记录不存在' });

  const { status, handler_id, handler_role, resolution } = req.body;
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  if (status && status !== recall.status) {
    const allowed = VALID_TRANSITIONS[recall.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `不允许从 '${recall.status}' 转换到 '${status}'，允许的转换: [${allowed.join(', ')}]` });
    }
  }

  const doUpdate = db.transaction(() => {
    const newStatus = status || recall.status;

    db.prepare(
      `UPDATE recall_records SET status = ?, handler_id = ?, handler_role = ?, resolution = ?, resolved_date = ?, updated_at = ? WHERE id = ?`
    ).run(
      newStatus,
      handler_id ?? recall.handler_id,
      handler_role ?? recall.handler_role,
      resolution ?? recall.resolution,
      (newStatus === 'recalled' || newStatus === 'closed') ? now : null,
      now, id
    );

    if (newStatus === 'recalled') {
      db.prepare('UPDATE animals SET status = ?, updated_at = ? WHERE id = ?').run('recalled', now, recall.animal_id);
    }

    if (newStatus === 'closed' && recall.source_visit_id) {
      db.prepare('UPDATE visit_records SET status = ?, recall_id = ?, updated_at = ? WHERE id = ?').run('need_followup', null, now, recall.source_visit_id);
    }
  });

  doUpdate();
  const updated = db.prepare('SELECT * FROM recall_records WHERE id = ?').get(id);
  res.json(updated);
});

module.exports = router;
