const express = require('express');
const { getDb } = require('../db/connection');
const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { farmer_id, crop_season_id, status, product_type } = req.query;

  let sql = `
    SELECT cs.*, f.name AS farmer_name, f.phone AS farmer_phone, f.village,
           cs2.name AS season_name, u.name AS operator_name
    FROM credit_sales cs
    JOIN farmers f ON cs.farmer_id = f.id
    JOIN crop_seasons cs2 ON cs.crop_season_id = cs2.id
    LEFT JOIN users u ON cs.operator_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (farmer_id) {
    sql += ' AND cs.farmer_id = ?';
    params.push(farmer_id);
  }
  if (crop_season_id) {
    sql += ' AND cs.crop_season_id = ?';
    params.push(crop_season_id);
  }
  if (status) {
    sql += ' AND cs.status = ?';
    params.push(status);
  }

  if (product_type) {
    sql += ` AND cs.id IN (SELECT credit_sale_id FROM sale_items WHERE product_type = ?)`;
    params.push(product_type);
  }

  sql += ' ORDER BY cs.sale_date DESC, cs.id DESC';

  const sales = db.prepare(sql).all(...params);

  const enriched = sales.map(sale => {
    const items = db.prepare(
      'SELECT * FROM sale_items WHERE credit_sale_id = ? ORDER BY id'
    ).all(sale.id);
    const plans = db.prepare(
      'SELECT * FROM payment_plans WHERE credit_sale_id = ? ORDER BY planned_date'
    ).all(sale.id);
    return { ...sale, items, payment_plans: plans };
  });

  res.json({ code: 0, data: enriched });
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const sale = db.prepare(`
    SELECT cs.*, f.name AS farmer_name, f.phone AS farmer_phone, f.village, f.address,
           cs2.name AS season_name, u.name AS operator_name
    FROM credit_sales cs
    JOIN farmers f ON cs.farmer_id = f.id
    JOIN crop_seasons cs2 ON cs.crop_season_id = cs2.id
    LEFT JOIN users u ON cs.operator_id = u.id
    WHERE cs.id = ?
  `).get(req.params.id);

  if (!sale) return res.status(404).json({ code: 1, message: '赊销单不存在' });

  const items = db.prepare('SELECT * FROM sale_items WHERE credit_sale_id = ? ORDER BY id').all(sale.id);
  const plans = db.prepare('SELECT * FROM payment_plans WHERE credit_sale_id = ? ORDER BY planned_date').all(sale.id);
  const payments = db.prepare('SELECT * FROM partial_payments WHERE credit_sale_id = ? ORDER BY payment_date').all(sale.id);
  const collections = db.prepare('SELECT * FROM collection_records WHERE credit_sale_id = ? ORDER BY visit_date DESC').all(sale.id);
  const reconciliations = db.prepare('SELECT * FROM reconciliations WHERE credit_sale_id = ? ORDER BY created_at DESC').all(sale.id);

  res.json({
    code: 0,
    data: { ...sale, items, payment_plans: plans, payments, collections, reconciliations }
  });
});

router.post('/', (req, res) => {
  const db = getDb();
  const { farmer_id, crop_season_id, sale_date, operator_id, notes, items } = req.body;

  if (!farmer_id || !crop_season_id || !sale_date || !items || !items.length) {
    return res.status(400).json({ code: 1, message: '缺少必要字段：farmer_id, crop_season_id, sale_date, items' });
  }

  let total_amount = 0;
  for (const item of items) {
    item.subtotal = item.quantity * item.unit_price;
    total_amount += item.subtotal;
  }

  const insertSale = db.prepare(`
    INSERT INTO credit_sales (farmer_id, crop_season_id, sale_date, total_amount, paid_amount, status, operator_id, notes)
    VALUES (?, ?, ?, ?, 0, 'pending', ?, ?)
  `);
  const insertItem = db.prepare(`
    INSERT INTO sale_items (credit_sale_id, product_type, product_name, unit, quantity, unit_price, subtotal)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    const result = insertSale.run(farmer_id, crop_season_id, sale_date, total_amount, operator_id || null, notes || null);
    const saleId = result.lastInsertRowid;
    for (const item of items) {
      insertItem.run(saleId, item.product_type, item.product_name, item.unit, item.quantity, item.unit_price, item.subtotal);
    }
    return saleId;
  });

  const saleId = transaction();
  const sale = db.prepare('SELECT * FROM credit_sales WHERE id = ?').get(saleId);

  res.status(201).json({ code: 0, data: sale });
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const { status, notes } = req.body;
  const sale = db.prepare('SELECT * FROM credit_sales WHERE id = ?').get(req.params.id);
  if (!sale) return res.status(404).json({ code: 1, message: '赊销单不存在' });

  const updates = [];
  const params = [];
  if (status) { updates.push('status = ?'); params.push(status); }
  if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }

  if (!updates.length) return res.status(400).json({ code: 1, message: '没有要更新的字段' });

  params.push(req.params.id);
  db.prepare(`UPDATE credit_sales SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const updated = db.prepare('SELECT * FROM credit_sales WHERE id = ?').get(req.params.id);
  res.json({ code: 0, data: updated });
});

module.exports = router;
