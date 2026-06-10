const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const rows = db.prepare(
    'SELECT id, name, unit, price, is_active FROM fruits WHERE is_active = 1 ORDER BY id'
  ).all();
  res.json(rows);
});

router.get('/all', (req, res) => {
  const rows = db.prepare('SELECT id, name, unit, price, is_active FROM fruits ORDER BY id').all();
  res.json(rows);
});

module.exports = router;
