const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const records = db.prepare(`SELECT h.*, u1.name as from_user_name, u2.name as to_user_name FROM shift_handovers h JOIN users u1 ON h.from_user_id = u1.id JOIN users u2 ON h.to_user_id = u2.id ORDER BY h.created_at DESC`).all();
  res.json(records);
});
