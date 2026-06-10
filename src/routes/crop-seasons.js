const express = require('express');
const { getDb } = require('../db/connection');
const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();
  const seasons = db.prepare('SELECT * FROM crop_seasons ORDER BY start_date DESC').all();
  res.json({ code: 0, data: seasons });
});

router.post('/', (req, res) => {
  const db = getDb();
  const { name, start_date, end_date } = req.body;
  if (!name || !start_date || !end_date) {
    return res.status(400).json({ code: 1, message: '缺少必要字段：name, start_date, end_date' });
  }
  const result = db.prepare(
    'INSERT INTO crop_seasons (name, start_date, end_date) VALUES (?, ?, ?)'
  ).run(name, start_date, end_date);

  const season = db.prepare('SELECT * FROM crop_seasons WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ code: 0, data: season });
});

module.exports = router;
