const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');

const router = express.Router();

router.get('/', (req, res) => {
  const { inspection_result, storage_decision } = req.query;
  let tasks = db.prepare('SELECT * FROM cutting_tasks ORDER BY created_at DESC').all();
  if (inspection_result || storage_decision) {
    tasks = tasks.filter(t => {
      let parsed = {};
      try { parsed = JSON.parse(t.inspection_conclusion || '{}'); } catch (e) {}
      if (inspection_result && parsed.result !== inspection_result) return false;
      if (storage_decision && parsed.storage_decision !== storage_decision) return false;
      return true;
    });
  }
  res.json(tasks);
});

router.get('/pending-dispatch', (req, res) => {
  const tasks = db.prepare("SELECT * FROM cutting_tasks WHERE status = 'pending'").all();
  const result = tasks.filter(t => {
    try { const p = JSON.parse(t.inspection_conclusion || '{}'); return p.result === 'passed' || p.result === 'conditional'; } catch(e) { return false; }
  }).map(t => {
    let parsed = {};
    try { parsed = JSON.parse(t.inspection_conclusion || '{}'); } catch(e) {}
    const batch = db.prepare('SELECT * FROM batches WHERE id = ?').get(t.batch_id);
    return {
      task_number: t.task_number,
      batch_number: batch ? batch.batch_number : null,
      target_specification: t.target_specification,
      target_quantity: t.target_quantity,
      assignee: t.assignee,
      inspection_storage_decision: parsed.storage_decision || null,
      spec_adjustment: t.spec_adjustment || null,
    };
  });
  res.json(result);
});

router.get('/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM cutting_tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: '分割任务不存在' });
  res.json(task);
});

router.post('/', (req, res) => {
  const { batch_id, task_number, target_specification, target_quantity, assignee, inspection_id, spec_adjustment, status, remark } = req.body;
  if (inspection_id) {
    const inspection = db.prepare('SELECT * FROM inspections WHERE id = ?').get(inspection_id);
    if (!inspection) return res.status(400).json({ error: '验收记录不存在' });
    if (inspection.result !== 'passed' && inspection.result !== 'conditional') {
      return res.status(400).json({ error: '只能基于合格或有条件合格的验收创建分割任务' });
    }
  }
  const id = uuidv4();
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  let inspection_conclusion = null;
  if (inspection_id) {
    const inspection = db.prepare('SELECT * FROM inspections WHERE id = ?').get(inspection_id);
    inspection_conclusion = JSON.stringify({ result: inspection.result, storage_decision: inspection.storage_decision || null, issues: inspection.issues || null });
  }
  db.prepare('INSERT INTO cutting_tasks (id, batch_id, task_number, target_specification, target_quantity, assignee, inspection_id, inspection_conclusion, spec_adjustment, status, remark, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(id, batch_id, task_number, target_specification, target_quantity, assignee, inspection_id || null, inspection_conclusion, spec_adjustment || null, status || 'pending', remark, now, now);
  const task = db.prepare('SELECT * FROM cutting_tasks WHERE id = ?').get(id);
  res.status(201).json(task);
});

router.put('/:id', (req, res) => {
  const { batch_id, task_number, target_specification, target_quantity, assignee, spec_adjustment, status, remark } = req.body;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const info = db.prepare('UPDATE cutting_tasks SET batch_id = ?, task_number = ?, target_specification = ?, target_quantity = ?, assignee = ?, spec_adjustment = ?, status = ?, remark = ?, updated_at = ? WHERE id = ?').run(batch_id, task_number, target_specification, target_quantity, assignee, spec_adjustment || null, status, remark, now, req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: '分割任务不存在' });
  const task = db.prepare('SELECT * FROM cutting_tasks WHERE id = ?').get(req.params.id);
  res.json(task);
});

router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM cutting_tasks WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: '分割任务不存在' });
  res.status(204).send();
});

module.exports = router;
