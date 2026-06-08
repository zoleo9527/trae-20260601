const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');

const router = express.Router();

router.get('/', (req, res) => {
  const tasks = db.prepare('SELECT * FROM cutting_tasks ORDER BY created_at DESC').all();
  res.json(tasks);
});

router.get('/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM cutting_tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: '分割任务不存在' });
  res.json(task);
});

router.post('/', (req, res) => {
  const { batch_id, task_number, target_specification, target_quantity, assignee, inspection_id, spec_adjustment, status, remark } = req.body;

  if (!inspection_id) {
    return res.status(400).json({ error: '必须传入 inspection_id 引用验收记录' });
  }

  const inspection = db.prepare('SELECT * FROM inspections WHERE id = ?').get(inspection_id);
  if (!inspection) {
    return res.status(404).json({ error: '引用的验收记录不存在' });
  }

  if (inspection.result !== 'passed' && inspection.result !== 'conditional') {
    return res.status(400).json({ error: '验收未放行，无法创建分割任务' });
  }

  const inspection_conclusion = JSON.stringify({
    result: inspection.result,
    storage_decision: inspection.storage_decision,
    issues: inspection.issues
  });

  const id = uuidv4();
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  db.prepare('INSERT INTO cutting_tasks (id, batch_id, task_number, target_specification, target_quantity, assignee, inspection_id, inspection_conclusion, spec_adjustment, status, remark, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(id, batch_id, task_number, target_specification, target_quantity, assignee, inspection_id, inspection_conclusion, spec_adjustment, status || 'pending', remark, now, now);
  const task = db.prepare('SELECT * FROM cutting_tasks WHERE id = ?').get(id);
  res.status(201).json(task);
});

router.put('/:id', (req, res) => {
  const { batch_id, task_number, target_specification, target_quantity, assignee, spec_adjustment, status, remark } = req.body;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const info = db.prepare('UPDATE cutting_tasks SET batch_id = ?, task_number = ?, target_specification = ?, target_quantity = ?, assignee = ?, spec_adjustment = ?, status = ?, remark = ?, updated_at = ? WHERE id = ?').run(batch_id, task_number, target_specification, target_quantity, assignee, spec_adjustment, status, remark, now, req.params.id);
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
