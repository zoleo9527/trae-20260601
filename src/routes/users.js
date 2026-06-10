const express = require('express');
const { getDb } = require('../db/connection');
const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();
  const users = db.prepare('SELECT id, name, role, phone, created_at FROM users ORDER BY id').all();
  res.json({ code: 0, data: users });
});

module.exports = router;
