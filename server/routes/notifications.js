import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { user_id, unread_only } = req.query;

  let sql = `
    SELECT n.*, u.name as user_name FROM notifications n
    JOIN users u ON n.user_id = u.id WHERE 1=1
  `;
  const params = [];

  if (user_id) { sql += ' AND n.user_id = ?'; params.push(user_id); }
  if (unread_only === 'true') { sql += ' AND n.read = 0'; }

  sql += ' ORDER BY n.created_at DESC LIMIT 50';

  res.json({ notifications: db.prepare(sql).all(...params) });
});

router.get('/unread-count/:userId', (req, res) => {
  const db = getDb();
  const count = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0').get(req.params.userId);
  res.json(count);
});

router.put('/:id/read', (req, res) => {
  const db = getDb();
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.put('/read-all/:userId', (req, res) => {
  const db = getDb();
  db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(req.params.userId);
  res.json({ ok: true });
});

export default router;
