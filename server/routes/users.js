const express = require('express');
const router = express.Router();
const { db } = require('../db');

router.get('/', (req, res) => {
  const { role } = req.query;
  let sql = 'SELECT id, name, role, avatar, created_at FROM users';
  let params = [];

  if (role) {
    sql += ' WHERE role = ?';
    params.push(role);
  }
  sql += ' ORDER BY id ASC';

  const users = db.prepare(sql).all(...params);
  res.json(users);
});

router.get('/current', (req, res) => {
  const user = db.prepare('SELECT id, name, role, avatar FROM users WHERE id = 1').get();
  res.json(user || { id: 1, name: '访客', role: 'accountant', avatar: '👤' });
});

router.get('/:id', (req, res) => {
  const user = db.prepare('SELECT id, name, role, avatar, created_at FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  res.json(user);
});

module.exports = router;
