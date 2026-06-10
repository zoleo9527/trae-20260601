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

module.exports = router;
