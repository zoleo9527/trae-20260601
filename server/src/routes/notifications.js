const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const { read, page = 1, pageSize = 20 } = req.query;
  const userId = req.currentUser.id;
  const offset = (page - 1) * pageSize;
  const limit = parseInt(pageSize);

  let whereSql = 'WHERE user_id = ?';
  const params = [userId];

  if (read === '0') {
    whereSql += ' AND is_read = 0';
  }

  const countSql = `SELECT COUNT(*) as total FROM notifications ${whereSql}`;
  const total = db.prepare(countSql).get(...params).total;

  const listSql = `
    SELECT * FROM notifications
    ${whereSql}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `;
  const list = db.prepare(listSql).all(...params, limit, offset);

  res.json({
    total,
    list,
    page: parseInt(page),
    pageSize: limit,
    totalPages: Math.ceil(total / limit)
  });
});

router.get('/unread-count', (req, res) => {
  const userId = req.currentUser.id;
  const row = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(userId);
  res.json({ count: row.count });
});

router.post('/:id/read', (req, res) => {
  const { id } = req.params;
  const userId = req.currentUser.id;
  db.prepare(
    "UPDATE notifications SET is_read = 1, read_time = datetime('now', 'localtime') WHERE id = ? AND user_id = ?"
  ).run(id, userId);
  res.json({ message: '已标记已读' });
});

router.post('/read-all', (req, res) => {
  const userId = req.currentUser.id;
  const result = db.prepare(
    "UPDATE notifications SET is_read = 1, read_time = datetime('now', 'localtime') WHERE user_id = ? AND is_read = 0"
  ).run(userId);
  res.json({ affected: result.changes });
});

module.exports = router;
