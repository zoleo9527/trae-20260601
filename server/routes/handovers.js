const express = require('express');
const dayjs = require('dayjs');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM handovers ORDER BY createdAt DESC').all();
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM handovers WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: '交班记录不存在' });
  }
  res.json(row);
});

router.post('/', (req, res) => {
  const { shiftDate, fromRole, fromUser, toRole, toUser, notes } = req.body;
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  const pendingPatrolCount = db.prepare("SELECT COUNT(*) as count FROM patrols WHERE status = 'pending'").get().count;
  const pendingExceptionCount = db.prepare("SELECT COUNT(*) as count FROM exceptions WHERE status IN ('pending', 'handling')").get().count;

  const result = db.prepare(
    'INSERT INTO handovers (shiftDate, fromRole, fromUser, toRole, toUser, pendingPatrolCount, pendingExceptionCount, notes, status, submitTime, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(shiftDate, fromRole, fromUser, toRole, toUser, pendingPatrolCount, pendingExceptionCount, notes || '', 'pending', now, now);

  db.prepare(
    'INSERT INTO status_logs (recordType, recordId, fromStatus, toStatus, operator, operateTime, note) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run('handover', result.lastInsertRowid, '', 'pending', fromUser, now, '发起交班');

  const row = db.prepare('SELECT * FROM handovers WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
});

router.put('/:id/accept', (req, res) => {
  const handover = db.prepare('SELECT * FROM handovers WHERE id = ?').get(req.params.id);
  if (!handover) {
    return res.status(404).json({ error: '交班记录不存在' });
  }

  const { toUser } = req.body;
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const fromStatus = handover.status;

  db.prepare(
    'UPDATE handovers SET status = ?, acceptTime = ? WHERE id = ?'
  ).run('accepted', now, req.params.id);

  db.prepare(
    'INSERT INTO status_logs (recordType, recordId, fromStatus, toStatus, operator, operateTime, note) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run('handover', req.params.id, fromStatus, 'accepted', toUser, now, '接收交班');

  const row = db.prepare('SELECT * FROM handovers WHERE id = ?').get(req.params.id);
  res.json(row);
});

module.exports = router;
