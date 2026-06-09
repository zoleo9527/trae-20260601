const express = require('express');
const router = express.Router();
const db = require('../db');
const dayjs = require('dayjs');

router.get('/', (req, res) => {
  const { status, adoption_id, animal_id } = req.query;
  let where = [];
  let params = [];

  if (status) {
    where.push('v.status = ?');
    params.push(status);
  }
  if (adoption_id) {
    where.push('v.adoption_id = ?');
    params.push(adoption_id);
  }
  if (animal_id) {
    where.push('v.animal_id = ?');
    params.push(animal_id);
  }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const list = db.prepare(
    `SELECT v.*, a.name as animal_name, u.name as visitor_name FROM visit_records v LEFT JOIN animals a ON v.animal_id = a.id LEFT JOIN users u ON v.visitor_id = u.id ${whereClause} ORDER BY v.visit_date DESC`
  ).all(...params);

  res.json(list);
});

router.get('/:id', (req, res) => {
  const visit = db.prepare(
    `SELECT v.*, a.name as animal_name, u.name as visitor_name FROM visit_records v LEFT JOIN animals a ON v.animal_id = a.id LEFT JOIN users u ON v.visitor_id = u.id WHERE v.id = ?`
  ).get(req.params.id);
  if (!visit) return res.status(404).json({ error: '回访记录不存在' });
  res.json(visit);
});

router.post('/', (req, res) => {
  const { animal_id, adoption_id, visit_date, visitor_id, visitor_role, health_status, behavior_status, environment_status, notes, status, next_visit_date } = req.body;
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  const result = db.prepare(
    `INSERT INTO visit_records (animal_id, adoption_id, visit_date, visitor_id, visitor_role, health_status, behavior_status, environment_status, notes, status, recall_id, next_visit_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(animal_id, adoption_id || null, visit_date, visitor_id || null, visitor_role || null, health_status || null, behavior_status || null, environment_status || null, notes || null, status || 'pending', null, next_visit_date || null, now, now);

  const visit = db.prepare('SELECT * FROM visit_records WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(visit);
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const visit = db.prepare('SELECT * FROM visit_records WHERE id = ?').get(id);
  if (!visit) return res.status(404).json({ error: '回访记录不存在' });

  const { animal_id, adoption_id, visit_date, visitor_id, visitor_role, health_status, behavior_status, environment_status, notes, status, next_visit_date } = req.body;
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const newStatus = status ?? visit.status;

  const doUpdate = db.prepare(
    `UPDATE visit_records SET animal_id = ?, adoption_id = ?, visit_date = ?, visitor_id = ?, visitor_role = ?, health_status = ?, behavior_status = ?, environment_status = ?, notes = ?, status = ?, next_visit_date = ?, updated_at = ? WHERE id = ?`
  );

  const createRecallAndUpdateVisit = db.transaction(() => {
    const recallResult = db.prepare(
      `INSERT INTO recall_records (animal_id, source_visit_id, reason, report_date, reporter_id, reporter_role, status, handler_id, handler_role, resolution, resolved_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      animal_id ?? visit.animal_id,
      id,
      notes || '回访转异常收回',
      now,
      visitor_id ?? visit.visitor_id,
      visitor_role ?? visit.visitor_role,
      'initiated',
      null, null, null, null, now, now
    );
    const recallId = recallResult.lastInsertRowid;
    doUpdate.run(
      animal_id ?? visit.animal_id,
      adoption_id ?? visit.adoption_id,
      visit_date ?? visit.visit_date,
      visitor_id ?? visit.visitor_id,
      visitor_role ?? visit.visitor_role,
      health_status ?? visit.health_status,
      behavior_status ?? visit.behavior_status,
      environment_status ?? visit.environment_status,
      notes ?? visit.notes,
      'transferred_to_recall',
      next_visit_date ?? visit.next_visit_date,
      now, id
    );
    db.prepare('UPDATE visit_records SET recall_id = ? WHERE id = ?').run(recallId, id);
    return recallId;
  });

  if (newStatus === 'transferred_to_recall' && visit.status !== 'transferred_to_recall') {
    const recallId = createRecallAndUpdateVisit();
    const updated = db.prepare('SELECT * FROM visit_records WHERE id = ?').get(id);
    return res.json({ ...updated, created_recall_id: recallId });
  }

  doUpdate.run(
    animal_id ?? visit.animal_id,
    adoption_id ?? visit.adoption_id,
    visit_date ?? visit.visit_date,
    visitor_id ?? visit.visitor_id,
    visitor_role ?? visit.visitor_role,
    health_status ?? visit.health_status,
    behavior_status ?? visit.behavior_status,
    environment_status ?? visit.environment_status,
    notes ?? visit.notes,
    newStatus,
    next_visit_date ?? visit.next_visit_date,
    now, id
  );

  const updated = db.prepare('SELECT * FROM visit_records WHERE id = ?').get(id);
  res.json(updated);
});

router.put('/batch', (req, res) => {
  const { ids, status } = req.body;
  if (!Array.isArray(ids) || !status) return res.status(400).json({ error: '需要提供ids数组和status' });

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const validStatuses = ['pending', 'completed', 'need_followup', 'transferred_to_recall'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: '无效的状态值' });

  const updateOne = db.prepare('UPDATE visit_records SET status = ?, updated_at = ? WHERE id = ?');
  const batchUpdate = db.transaction(() => {
    let updated = 0;
    for (const id of ids) {
      const r = updateOne.run(status, now, id);
      updated += r.changes;
    }
    return updated;
  });

  const count = batchUpdate();
  res.json({ updated: count });
});

module.exports = router;
