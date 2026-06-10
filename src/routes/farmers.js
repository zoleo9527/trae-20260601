const express = require('express');
const { getDb } = require('../db/connection');
const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();
  const farmers = db.prepare('SELECT * FROM farmers ORDER BY id').all();
  res.json({ code: 0, data: farmers });
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const farmer = db.prepare('SELECT * FROM farmers WHERE id = ?').get(req.params.id);
  if (!farmer) return res.status(404).json({ code: 1, message: '农户不存在' });
  res.json({ code: 0, data: farmer });
});

router.post('/', (req, res) => {
  const db = getDb();
  const { name, phone, village, address, notes } = req.body;
  if (!name) return res.status(400).json({ code: 1, message: '缺少必要字段：name' });

  const result = db.prepare(
    'INSERT INTO farmers (name, phone, village, address, notes) VALUES (?, ?, ?, ?, ?)'
  ).run(name, phone || null, village || null, address || null, notes || null);

  const farmer = db.prepare('SELECT * FROM farmers WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ code: 0, data: farmer });
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const { name, phone, village, address, notes } = req.body;
  const farmer = db.prepare('SELECT * FROM farmers WHERE id = ?').get(req.params.id);
  if (!farmer) return res.status(404).json({ code: 1, message: '农户不存在' });

  db.prepare(
    'UPDATE farmers SET name=?, phone=?, village=?, address=?, notes=? WHERE id=?'
  ).run(name || farmer.name, phone !== undefined ? phone : farmer.phone,
        village !== undefined ? village : farmer.village,
        address !== undefined ? address : farmer.address,
        notes !== undefined ? notes : farmer.notes,
        req.params.id);

  const updated = db.prepare('SELECT * FROM farmers WHERE id = ?').get(req.params.id);
  res.json({ code: 0, data: updated });
});

module.exports = router;
