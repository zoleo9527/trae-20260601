const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const users = db.prepare('SELECT id, name, role, phone, created_at FROM users ORDER BY id').all();
  res.json(users);
});

router.get('/:role', (req, res) => {
  const { role } = req.params;
  const users = db.prepare('SELECT id, name, role, phone, created_at FROM users WHERE role = ? ORDER BY id').all(role);
  res.json(users);
});

module.exports = router;
