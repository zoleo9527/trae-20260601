const express = require('express');
const db = require('../database/db');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

router.get('/', (req, res) => {
  const { is_read, page = 1, pageSize = 50 } = req.query;
  const offset = (page - 1) * pageSize;

  let where = 'WHERE user_id = ?';
  const params = [req.user.id];

  if (is_read !== undefined && is_read !== '') {
    where += ' AND is_read = ?';
    params.push(Number(is_read));
  }

  const countSql = `SELECT COUNT(*) as cnt FROM notifications ${where}`;
  const total = db.prepare(countSql).get(...params).cnt;

  const list = db.prepare(`SELECT * FROM notifications ${where} ORDER BY id DESC LIMIT ? OFFSET ?`)
    .all(...params, Number(pageSize), offset);

  const unreadCount = db.prepare('SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id).cnt;

  res.json({ code: 200, data: { list, total, unreadCount } });
});

router.put('/read/:id', (req, res) => {
  const id = req.params.id;
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(id, req.user.id);
  res.json({ code: 200, message: '已标记为已读' });
});

router.put('/read-all', (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
  res.json({ code: 200, message: '全部标记已读' });
});

module.exports = router;
