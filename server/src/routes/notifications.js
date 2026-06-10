const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const { read, page = 1, pageSize = 20 } = req.query;
  const userId = req.currentUser.id;
  const offset = (page - 1) * pageSize;
  const limit = parseInt(pageSize);

  let whereSql = 'WHERE n.user_id = ?';
  const params = [userId];

  if (read === '0') {
    whereSql += ' AND n.is_read = 0';
  }

  const countSql = `SELECT COUNT(*) as total FROM notifications n ${whereSql}`;
  const total = db.prepare(countSql).get(...params).total;

  const listSql = `
    SELECT
      n.id, n.user_id, n.title, n.content, n.biz_type, n.biz_id,
      n.type, n.is_read, n.read_time, n.created_at,
      COALESCE(
        n.reception_id,
        CASE
          WHEN n.biz_type = 'reception' THEN n.biz_id
          WHEN n.biz_type = 'guide_task' THEN gt.reception_id
          WHEN n.biz_type = 'warehouse_transfer' THEN gt2.reception_id
          ELSE NULL
        END
      ) as reception_id
    FROM notifications n
    LEFT JOIN guide_tasks gt ON n.biz_type = 'guide_task' AND n.biz_id = gt.id
    LEFT JOIN warehouse_transfers wt ON n.biz_type = 'warehouse_transfer' AND n.biz_id = wt.id
    LEFT JOIN guide_tasks gt2 ON wt.guide_task_id = gt2.id
    ${whereSql}
    ORDER BY n.id DESC
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
