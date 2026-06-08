const express = require('express');
const dayjs = require('dayjs');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

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
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM patrols WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: '巡场记录不存在' });
  }
  res.json(row);
});

router.post('/', (req, res) => {
  const { patrolDate, area, submitter, notes } = req.body;
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const status = 'pending';

  const result = db.prepare(
    'INSERT INTO patrols (patrolDate, area, submitter, submitTime, status, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(patrolDate, area, submitter, now, status, notes || '', now, now);

  db.prepare(
    'INSERT INTO status_logs (recordType, recordId, fromStatus, toStatus, operator, operateTime, note) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run('patrol', result.lastInsertRowid, '', status, submitter, now, '提交巡场记录');

  const row = db.prepare('SELECT * FROM patrols WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
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
  res.json(row);
});

module.exports = router;
