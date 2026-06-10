const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const { role } = req.query;
  let sql = 'SELECT id, username, name, role, phone, created_at FROM users WHERE 1=1';
  const params = [];
  if (role) {
    sql += ' AND role = ?';
    params.push(role);
  }
  sql += ' ORDER BY id';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

router.get('/guides', (req, res) => {
  const rows = db.prepare(
    "SELECT id, username, name, role, phone FROM users WHERE role = 'guide' ORDER BY id"
  ).all();
  res.json(rows);
});

router.get('/current', (req, res) => {
  res.json(req.currentUser);
});

router.post('/switch-role', (req, res) => {
  const { role } = req.body;
  if (!['service', 'guide', 'warehouse'].includes(role)) {
    return res.status(400).json({ error: '无效的角色' });
  }

  const user = db.prepare(
    'SELECT id, username, name, role, phone FROM users WHERE role = ? ORDER BY id LIMIT 1'
  ).get(role);

  if (!user) {
    return res.status(404).json({ error: '该角色没有可用用户' });
  }

  res.setHeader('Set-Cookie', `current_user_id=${user.id}; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`);
  res.json(user);
});

module.exports = router;
