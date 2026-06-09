const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/login', (req, res) => {
  const { name, role } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE name = ? AND role = ?').get(name, role);
  if (!user) return res.status(401).json({ error: '用户名或角色不匹配' });
  res.json({ id: user.id, name: user.name, role: user.role, phone: user.phone });
});

router.get('/users', (req, res) => {
  const users = db.prepare('SELECT id, name, role, phone FROM users ORDER BY id').all();
  res.json(users);
});

router.get('/users/:role', (req, res) => {
  const users = db.prepare('SELECT id, name, role, phone FROM users WHERE role = ? ORDER BY id').all(req.params.role);
  res.json(users);
});

module.exports = router;
