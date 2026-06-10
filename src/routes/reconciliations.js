const express = require('express');
const { getDb } = require('../db/connection');
const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { credit_sale_id, role, status } = req.query;

  let sql = `
    SELECT r.*, cs.farmer_id, f.name AS farmer_name,
           u.name AS confirmer_name, cs.total_amount AS sale_total
    FROM reconciliations r
    JOIN credit_sales cs ON r.credit_sale_id = cs.id
    JOIN farmers f ON cs.farmer_id = f.id
    JOIN users u ON r.confirmed_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (credit_sale_id) {
    sql += ' AND r.credit_sale_id = ?';
    params.push(credit_sale_id);
  }
  if (role) {
    sql += ' AND r.role = ?';
    params.push(role);
  }
  if (status) {
    sql += ' AND r.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY r.created_at DESC, r.id DESC';

  const records = db.prepare(sql).all(...params);
  res.json({ code: 0, data: records });
});

router.post('/', (req, res) => {
  const db = getDb();
  const { credit_sale_id, confirmed_by, role, status, notes } = req.body;

  if (!credit_sale_id || !confirmed_by || !role) {
    return res.status(400).json({ code: 1, message: '缺少必要字段：credit_sale_id, confirmed_by, role' });
  }

  const result = db.prepare(`
    INSERT INTO reconciliations (credit_sale_id, confirmed_by, role, status, notes)
    VALUES (?, ?, ?, ?, ?)
  `).run(credit_sale_id, confirmed_by, role, status || 'pending', notes || null);

  if (status === 'disputed') {
    db.prepare(`UPDATE credit_sales SET status = 'disputed' WHERE id = ? AND status != 'paid'`).run(credit_sale_id);
  }

  const record = db.prepare(`
    SELECT r.*, u.name AS confirmer_name FROM reconciliations r
    JOIN users u ON r.confirmed_by = u.id WHERE r.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({ code: 0, data: record });
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const { status, notes } = req.body;
  const record = db.prepare('SELECT * FROM reconciliations WHERE id = ?').get(req.params.id);
  if (!record) return res.status(404).json({ code: 1, message: '对账记录不存在' });

  const updates = [];
  const params = [];
  if (status) { updates.push('status = ?'); params.push(status); }
  if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }

  if (!updates.length) return res.status(400).json({ code: 1, message: '没有要更新的字段' });

  params.push(req.params.id);
  db.prepare(`UPDATE reconciliations SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  if (status === 'disputed') {
    db.prepare(`UPDATE credit_sales SET status = 'disputed' WHERE id = ? AND status != 'paid'`).run(record.credit_sale_id);
  }

  const updated = db.prepare(`
    SELECT r.*, u.name AS confirmer_name FROM reconciliations r
    JOIN users u ON r.confirmed_by = u.id WHERE r.id = ?
  `).get(req.params.id);

  res.json({ code: 0, data: updated });
});

router.post('/sale/:saleId/confirm-all', (req, res) => {
  const db = getDb();
  const { saleId } = req.params;
  const { owner_id, technician_id, warehouse_id } = req.body;

  const sale = db.prepare('SELECT * FROM credit_sales WHERE id = ?').get(saleId);
  if (!sale) return res.status(404).json({ code: 1, message: '赊销单不存在' });

  const insertRec = db.prepare(`
    INSERT INTO reconciliations (credit_sale_id, confirmed_by, role, status, notes)
    VALUES (?, ?, ?, 'confirmed', ?)
  `);

  const transaction = db.transaction(() => {
    if (owner_id) insertRec.run(saleId, owner_id, 'owner', '门店老板确认');
    if (technician_id) insertRec.run(saleId, technician_id, 'technician', '农技员确认');
    if (warehouse_id) insertRec.run(saleId, warehouse_id, 'warehouse', '仓管确认');
  });

  transaction();

  const allRecords = db.prepare('SELECT * FROM reconciliations WHERE credit_sale_id = ?').all(saleId);
  res.json({ code: 0, data: allRecords });
});

module.exports = router;
