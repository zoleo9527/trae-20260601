const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');

const router = express.Router();

function getLatestInspection(batchId) {
  return db.prepare('SELECT * FROM inspections WHERE batch_id = ? ORDER BY created_at DESC LIMIT 1').get(batchId);
}

function buildSummary(batchId) {
  const latestInsp = getLatestInspection(batchId);
  const tasks = db.prepare('SELECT * FROM cutting_tasks WHERE batch_id = ?').all(batchId);
  const rels = db.prepare('SELECT * FROM releases WHERE batch_id = ?').all(batchId);
  const rejs = db.prepare('SELECT * FROM rejections WHERE batch_id = ?').all(batchId);
  return {
    latest_inspection_result: latestInsp ? latestInsp.result : null,
    latest_storage_decision: latestInsp ? latestInsp.storage_decision : null,
    has_release: rels.length > 0,
    has_rejection: rejs.length > 0,
    spec_adjustment_count: tasks.filter(t => t.spec_adjustment && t.spec_adjustment.trim() !== '').length,
  };
}

router.get('/stats', (req, res) => {
  const batches = db.prepare('SELECT * FROM batches').all();
  const byStatus = {};
  const byInspectionResult = {};
  let abnormalCount = 0;
  for (const b of batches) {
    byStatus[b.status] = (byStatus[b.status] || 0) + 1;
    const latestInsp = getLatestInspection(b.id);
    if (latestInsp) {
      byInspectionResult[latestInsp.result] = (byInspectionResult[latestInsp.result] || 0) + 1;
    }
    const hasRejectedInsp = latestInsp && latestInsp.result === 'rejected';
    const hasRejections = db.prepare('SELECT COUNT(*) as c FROM rejections WHERE batch_id = ?').get(b.id).c > 0;
    if (hasRejectedInsp || hasRejections) abnormalCount++;
  }
  res.json({ total: batches.length, by_status: byStatus, by_inspection_result: byInspectionResult, abnormal_count: abnormalCount });
});

router.get('/', (req, res) => {
  const { status, supplier, product_type, inspection_result } = req.query;
  let batches = db.prepare('SELECT * FROM batches ORDER BY created_at DESC').all();
  if (status) batches = batches.filter(b => b.status === status);
  if (supplier) batches = batches.filter(b => b.supplier === supplier);
  if (product_type) batches = batches.filter(b => b.product_type === product_type);
  if (inspection_result) batches = batches.filter(b => { const l = getLatestInspection(b.id); return l && l.result === inspection_result; });
  res.json(batches);
});

router.get('/:id/timeline', (req, res) => {
  const batch = db.prepare('SELECT * FROM batches WHERE id = ?').get(req.params.id);
  if (!batch) return res.status(404).json({ error: '批次不存在' });
  const inspections = db.prepare('SELECT * FROM inspections WHERE batch_id = ? ORDER BY created_at ASC').all(req.params.id);
  const cuttingTasks = db.prepare('SELECT * FROM cutting_tasks WHERE batch_id = ? ORDER BY created_at ASC').all(req.params.id).map(t => {
    let p = {};
    try { p = JSON.parse(t.inspection_conclusion || '{}'); } catch (e) {}
    return { ...t, inspection_result: p.result || null, inspection_storage_decision: p.storage_decision || null, inspection_issues: p.issues || null, spec_adjustment: t.spec_adjustment || null };
  });
  const releases = db.prepare('SELECT * FROM releases WHERE batch_id = ? ORDER BY created_at ASC').all(req.params.id);
  const rejections = db.prepare('SELECT * FROM rejections WHERE batch_id = ? ORDER BY created_at ASC').all(req.params.id);
  const summary = buildSummary(req.params.id);
  res.json({ batch, inspections, cutting_tasks: cuttingTasks, releases, rejections, summary });
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
