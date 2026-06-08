const express = require('express');
const dayjs = require('dayjs');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.get('/', (req, res) => {
  const { status, type } = req.query;
  let sql = 'SELECT * FROM exceptions WHERE 1=1';
  const params = [];
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (type) {
    sql += ' AND exceptionType = ?';
    params.push(type);
  }
  sql += ' ORDER BY createdAt DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: '异常记录不存在' });
  }
  res.json(row);
});

router.post('/', (req, res) => {
  const { patrolId, title, exceptionType, description, severity, submitter, attachments } = req.body;
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const status = 'pending';

  const result = db.prepare(
    'INSERT INTO exceptions (patrolId, title, exceptionType, description, severity, submitter, submitTime, status, attachments, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(patrolId || null, title, exceptionType, description || '', severity || 'low', submitter, now, status, attachments || '[]', now, now);

  db.prepare(
    'INSERT INTO status_logs (recordType, recordId, fromStatus, toStatus, operator, operateTime, note) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run('exception', result.lastInsertRowid, '', status, submitter, now, '提交异常记录');

  const row = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
});

router.put('/:id/handle', (req, res) => {
  const exception = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(req.params.id);
  if (!exception) {
    return res.status(404).json({ error: '异常记录不存在' });
  }

  const { handler, handleNote } = req.body;
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const fromStatus = exception.status;

  db.prepare(
    'UPDATE exceptions SET status = ?, handler = ?, handleTime = ?, handleNote = ?, updatedAt = ? WHERE id = ?'
  ).run('handling', handler, now, handleNote || '', now, req.params.id);

  db.prepare(
    'INSERT INTO status_logs (recordType, recordId, fromStatus, toStatus, operator, operateTime, note) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run('exception', req.params.id, fromStatus, 'handling', handler, now, '开始处理异常');

  const row = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(req.params.id);
  res.json(row);
});

router.put('/:id/resolve', (req, res) => {
  const exception = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(req.params.id);
  if (!exception) {
    return res.status(404).json({ error: '异常记录不存在' });
  }

  const { handleNote } = req.body;
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const fromStatus = exception.status;

  db.prepare(
    'UPDATE exceptions SET status = ?, handleNote = ?, updatedAt = ? WHERE id = ?'
  ).run('resolved', handleNote || exception.handleNote || '', now, req.params.id);

  db.prepare(
    'INSERT INTO status_logs (recordType, recordId, fromStatus, toStatus, operator, operateTime, note) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run('exception', req.params.id, fromStatus, 'resolved', exception.handler || req.user.username, now, '处理完成');

  const row = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(req.params.id);
  res.json(row);
});

router.put('/:id/confirm', (req, res) => {
  const exception = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(req.params.id);
  if (!exception) {
    return res.status(404).json({ error: '异常记录不存在' });
  }

  const { confirmer } = req.body;
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const fromStatus = exception.status;

  db.prepare(
    'UPDATE exceptions SET status = ?, confirmer = ?, confirmTime = ?, updatedAt = ? WHERE id = ?'
  ).run('confirmed', confirmer, now, now, req.params.id);

  db.prepare(
    'INSERT INTO status_logs (recordType, recordId, fromStatus, toStatus, operator, operateTime, note) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run('exception', req.params.id, fromStatus, 'confirmed', confirmer, now, '确认处理');

  const row = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(req.params.id);
  res.json(row);
});

module.exports = router;
