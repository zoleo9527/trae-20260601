const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

router.get('/registration/:registrationId', (req, res) => {
  const db = getDb();
  const documents = db.prepare(
    'SELECT * FROM registration_documents WHERE registration_id = ?'
  ).all(req.params.registrationId);
  res.json({ code: 0, data: documents });
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const { document_value, upload_status, rejection_reason, verified_by } = req.body;

  const doc = db.prepare('SELECT * FROM registration_documents WHERE id = ?').get(req.params.id);
  if (!doc) {
    return res.status(404).json({ code: 1, msg: '资料项不存在' });
  }

  const now = "datetime('now','localtime')";

  if (document_value !== undefined) {
    db.prepare(
      `UPDATE registration_documents SET document_value = ?, upload_status = 'uploaded', uploaded_at = ${now} WHERE id = ?`
    ).run(document_value, req.params.id);
  }

  if (upload_status === 'verified') {
    if (!verified_by) {
      return res.status(400).json({ code: 1, msg: '审核人ID不能为空' });
    }
    db.prepare(
      `UPDATE registration_documents SET upload_status = 'verified', verified_at = ${now}, verified_by = ?, rejection_reason = NULL WHERE id = ?`
    ).run(verified_by, req.params.id);
  }

  if (upload_status === 'rejected') {
    if (!rejection_reason) {
      return res.status(400).json({ code: 1, msg: '退回原因不能为空' });
    }
    db.prepare(
      `UPDATE registration_documents SET upload_status = 'rejected', rejection_reason = ?, verified_at = ${now}, verified_by = ? WHERE id = ?`
    ).run(rejection_reason, verified_by || null, req.params.id);
  }

  const updated = db.prepare('SELECT * FROM registration_documents WHERE id = ?').get(req.params.id);
  res.json({ code: 0, data: updated });
});

router.post('/batch-verify', (req, res) => {
  const db = getDb();
  const { document_ids, upload_status, verified_by, rejection_reason } = req.body;

  if (!Array.isArray(document_ids) || document_ids.length === 0) {
    return res.status(400).json({ code: 1, msg: '请提供资料项ID列表' });
  }
  if (!upload_status || !verified_by) {
    return res.status(400).json({ code: 1, msg: '审核状态和审核人ID不能为空' });
  }

  const now = "datetime('now','localtime')";
  const results = [];
  const updateStmt = db.prepare(
    `UPDATE registration_documents SET upload_status = ?, verified_at = ${now}, verified_by = ?, rejection_reason = ? WHERE id = ?`
  );

  for (const id of document_ids) {
    const doc = db.prepare('SELECT * FROM registration_documents WHERE id = ?').get(id);
    if (doc) {
      updateStmt.run(upload_status, verified_by, upload_status === 'rejected' ? (rejection_reason || null) : null, id);
      results.push({ id, status: 'updated' });
    } else {
      results.push({ id, status: 'not_found' });
    }
  }

  res.json({ code: 0, data: results });
});

router.post('/resubmit', (req, res) => {
  const db = getDb();
  const { registration_id, document_id, resubmitted_by, note } = req.body;

  if (!registration_id || !document_id || !resubmitted_by) {
    return res.status(400).json({ code: 1, msg: '报名ID、资料项ID和补件人不能为空' });
  }

  const doc = db.prepare('SELECT * FROM registration_documents WHERE id = ? AND registration_id = ?').get(document_id, registration_id);
  if (!doc) {
    return res.status(404).json({ code: 1, msg: '资料项不存在或不属于该报名' });
  }

  db.prepare(
    `INSERT INTO resubmission_logs (registration_id, document_id, resubmitted_by, note) VALUES (?, ?, ?, ?)`
  ).run(registration_id, document_id, resubmitted_by, note || null);

  db.prepare(
    `UPDATE registration_documents SET upload_status = 'uploaded', rejection_reason = NULL, uploaded_at = datetime('now','localtime') WHERE id = ?`
  ).run(document_id);

  const log = db.prepare('SELECT * FROM resubmission_logs ORDER BY id DESC LIMIT 1').get();
  res.json({ code: 0, data: log });
});

router.put('/resubmit/:id/confirm', (req, res) => {
  const db = getDb();
  const { confirmed_by } = req.body;

  if (!confirmed_by) {
    return res.status(400).json({ code: 1, msg: '确认人ID不能为空' });
  }

  const log = db.prepare('SELECT * FROM resubmission_logs WHERE id = ?').get(req.params.id);
  if (!log) {
    return res.status(404).json({ code: 1, msg: '补件记录不存在' });
  }
  if (log.confirmed_at) {
    return res.status(400).json({ code: 1, msg: '该补件已被确认，请勿重复操作' });
  }

  db.prepare(
    `UPDATE resubmission_logs SET confirmed_by = ?, confirmed_at = datetime('now','localtime') WHERE id = ?`
  ).run(confirmed_by, req.params.id);

  db.prepare(
    `INSERT INTO audit_logs (registration_id, action, operator_id, operator_role, comment) VALUES (?, 'resubmit', ?, 'academic', '确认补件资料')`
  ).run(log.registration_id, confirmed_by);

  const updated = db.prepare('SELECT * FROM resubmission_logs WHERE id = ?').get(req.params.id);
  res.json({ code: 0, data: updated });
});

module.exports = router;
