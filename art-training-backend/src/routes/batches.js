const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');

const router = express.Router();

router.get('/', (req, res) => {
  const batches = db.prepare('SELECT * FROM batches ORDER BY created_at DESC').all();
  res.json(batches);
});

router.get('/:id/timeline', (req, res) => {
  const batch = db.prepare('SELECT * FROM batches WHERE id = ?').get(req.params.id);
  if (!batch) return res.status(404).json({ error: '批次不存在' });
  const inspections = db.prepare('SELECT * FROM inspections WHERE batch_id = ? ORDER BY created_at ASC').all(req.params.id);
  const cuttingTasks = db.prepare('SELECT * FROM cutting_tasks WHERE batch_id = ? ORDER BY created_at ASC').all(req.params.id).map(t => {
    let parsed = {};
    try { parsed = JSON.parse(t.inspection_conclusion || '{}'); } catch (e) {}
    return { ...t, inspection_result: parsed.result || null, inspection_storage_decision: parsed.storage_decision || null, inspection_issues: parsed.issues || null, spec_adjustment: t.spec_adjustment || null };
  });
  const releases = db.prepare('SELECT * FROM releases WHERE batch_id = ? ORDER BY created_at ASC').all(req.params.id);
  const rejections = db.prepare('SELECT * FROM rejections WHERE batch_id = ? ORDER BY created_at ASC').all(req.params.id);
  res.json({ batch, inspections, cutting_tasks: cuttingTasks, releases, rejections });
});

router.get('/:id', (req, res) => {
  const batch = db.prepare('SELECT * FROM batches WHERE id = ?').get(req.params.id);
  if (!batch) return res.status(404).json({ error: '批次不存在' });
  res.json(batch);
});

router.post('/', (req, res) => {
  const { batch_number, supplier, product_type, quantity, unit, temperature, weight, specification, status, remark } = req.body;
  const id = uuidv4();
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  db.prepare('INSERT INTO batches (id, batch_number, supplier, product_type, quantity, unit, temperature, weight, specification, status, remark, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(id, batch_number, supplier, product_type, quantity, unit || 'kg', temperature, weight, specification, status || 'pending', remark, now, now);
  const batch = db.prepare('SELECT * FROM batches WHERE id = ?').get(id);
  res.status(201).json(batch);
});

router.put('/:id', (req, res) => {
  const { batch_number, supplier, product_type, quantity, unit, temperature, weight, specification, status, remark } = req.body;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const info = db.prepare('UPDATE batches SET batch_number = ?, supplier = ?, product_type = ?, quantity = ?, unit = ?, temperature = ?, weight = ?, specification = ?, status = ?, remark = ?, updated_at = ? WHERE id = ?').run(batch_number, supplier, product_type, quantity, unit, temperature, weight, specification, status, remark, now, req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: '批次不存在' });
  const batch = db.prepare('SELECT * FROM batches WHERE id = ?').get(req.params.id);
  res.json(batch);
});

router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM batches WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: '批次不存在' });
  res.status(204).send();
});

module.exports = router;
