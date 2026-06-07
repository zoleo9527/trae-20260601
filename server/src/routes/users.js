const express = require('express');
const db = require('../db');
const { authMiddleware, requireRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  const users = db.prepare(`
    SELECT id, username, name, role, created_at FROM users ORDER BY id
  `).all();
  res.json({ users });
});

router.get('/couriers', authMiddleware, (req, res) => {
  const couriers = db.prepare(`
    SELECT id, username, name, role FROM users WHERE role = 'courier' ORDER BY name
  `).all();
  res.json({ couriers });
});

module.exports = router;
