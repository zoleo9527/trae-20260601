const express = require('express');
const dayjs = require('dayjs');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

function parseAttachments(row) {
  if (!row) return row;
  if (typeof row.attachments === 'string') {
    try { row.attachments = JSON.parse(row.attachments); } catch { row.attachments = []; }
  }
  if (!Array.isArray(row.attachments)) row.attachments = [];
  return row;
}

router.get('/', (req, res) => {
  const { status, date } = req.query;
  let sql = 'SELECT * FROM patrols WHERE 1=1';
  const params = [];
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (date) {
    sql += ' AND patrolDate = ?';
    params.push(date);
  }
  sql += ' ORDER BY createdAt DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(parseAttachments));
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM patrols WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: '巡场记录不存在' });
  }
  res.json(parseAttachments(row));
});

router.post('/', (req, res) => {
  const { patrolDate, area, submitter, notes, attachments } = req.body;
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const status = 'pending';

  const result = db.prepare(
    'INSERT INTO patrols (patrolDate, area, submitter, submitTime, status, notes, attachments, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(patrolDate, area, submitter, now, status, notes || '', attachments || '[]', now, now);

  db.prepare(
    'INSERT INTO status_logs (recordType, recordId, fromStatus, toStatus, operator, operateTime, note) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run('patrol', result.lastInsertRowid, '', status, submitter, now, '提交巡场记录');

  const row = db.prepare('SELECT * FROM patrols WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(parseAttachments(row));
});

router.put('/:id/confirm', (req, res) => {
  const patrol = db.prepare('SELECT * FROM patrols WHERE id = ?').get(req.params.id);
  if (!patrol) {
    return res.status(404).json({ error: '巡场记录不存在' });
  }

  const { status, confirmer } = req.body;
  if (!['confirmed', 'has_exception'].includes(status)) {
    return res.status(400).json({ error: '无效的状态值' });
  }

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const fromStatus = patrol.status;

  db.prepare(
    'UPDATE patrols SET status = ?, confirmer = ?, confirmTime = ?, updatedAt = ? WHERE id = ?'
  ).run(status, confirmer, now, now, req.params.id);

  db.prepare(
    'INSERT INTO status_logs (recordType, recordId, fromStatus, toStatus, operator, operateTime, note) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run('patrol', req.params.id, fromStatus, status, confirmer, now, '确认巡场');

  const row = db.prepare('SELECT * FROM patrols WHERE id = ?').get(req.params.id);
  res.json(parseAttachments(row));
});

router.post('/:id/attachments', (req, res) => {
  const patrol = db.prepare('SELECT * FROM patrols WHERE id = ?').get(req.params.id);
  if (!patrol) {
    return res.status(404).json({ error: '巡场记录不存在' });
  }

  const { filename, uploader } = req.body;
  if (!filename || !uploader) {
    return res.status(400).json({ error: 'filename 和 uploader 为必填' });
  }

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const existing = JSON.parse(patrol.attachments || '[]');
  const newAttachment = {
    filename,
    uploader,
    uploadTime: now,
    fileSize: Math.floor(Math.random() * 900 + 100) + 'KB',
  };
  existing.push(newAttachment);

  db.prepare('UPDATE patrols SET attachments = ?, updatedAt = ? WHERE id = ?').run(JSON.stringify(existing), now, req.params.id);

  db.prepare(
    'INSERT INTO status_logs (recordType, recordId, fromStatus, toStatus, operator, operateTime, note) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run('patrol', req.params.id, patrol.status, patrol.status, uploader, now, '添加附件: ' + filename);

  const row = db.prepare('SELECT * FROM patrols WHERE id = ?').get(req.params.id);
  res.json(parseAttachments(row));
});

module.exports = router;
