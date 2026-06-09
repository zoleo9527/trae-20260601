const express = require('express');
const router = express.Router();
const db = require('../db');
const dayjs = require('dayjs');

router.get('/', (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: '需要提供user_id参数' });

  const list = db.prepare(
    `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC`
  ).all(user_id);
  res.json(list);
});

router.put('/:id/read', (req, res) => {
  const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.id);
  if (!notification) return res.status(404).json({ error: '通知不存在' });

  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
  const updated = db.prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.put('/read-all', (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: '需要提供user_id' });

  const result = db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0').run(user_id);
  res.json({ updated: result.changes });
});

module.exports = router;
