const express = require('express');
const { getDb } = require('../db/connection');
const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { credit_sale_id, collector_id } = req.query;

  let sql = `
    SELECT cr.*, cs.farmer_id, f.name AS farmer_name, f.phone AS farmer_phone,
           u.name AS collector_name
    FROM collection_records cr
    JOIN credit_sales cs ON cr.credit_sale_id = cs.id
    JOIN farmers f ON cs.farmer_id = f.id
    JOIN users u ON cr.collector_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (credit_sale_id) {
    sql += ' AND cr.credit_sale_id = ?';
    params.push(credit_sale_id);
  }
  if (collector_id) {
    sql += ' AND cr.collector_id = ?';
    params.push(collector_id);
  }

  sql += ' ORDER BY cr.visit_date DESC, cr.id DESC';

  const records = db.prepare(sql).all(...params);
  res.json({ code: 0, data: records });
});

router.post('/', (req, res) => {
  const db = getDb();
  const { credit_sale_id, collector_id, visit_date, visit_type, content, farmer_response, next_action } = req.body;

  if (!credit_sale_id || !collector_id || !visit_date || !visit_type || !content) {
    return res.status(400).json({ code: 1, message: '缺少必要字段：credit_sale_id, collector_id, visit_date, visit_type, content' });
  }

  const result = db.prepare(`
    INSERT INTO collection_records (credit_sale_id, collector_id, visit_date, visit_type, content, farmer_response, next_action)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(credit_sale_id, collector_id, visit_date, visit_type, content, farmer_response || null, next_action || null);

  const record = db.prepare(`
    SELECT cr.*, u.name AS collector_name FROM collection_records cr
    JOIN users u ON cr.collector_id = u.id WHERE cr.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({ code: 0, data: record });
});

module.exports = router;
