const express = require('express');
const { getDb } = require('../db/connection');
const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { credit_sale_id, status, overdue } = req.query;

  let sql = `
    SELECT pp.*, cs.farmer_id, cs.total_amount AS sale_total, cs.status AS sale_status,
           f.name AS farmer_name, cs2.name AS season_name
    FROM payment_plans pp
    JOIN credit_sales cs ON pp.credit_sale_id = cs.id
    JOIN farmers f ON cs.farmer_id = f.id
    JOIN crop_seasons cs2 ON cs.crop_season_id = cs2.id
    WHERE 1=1
  `;
  const params = [];

  if (credit_sale_id) {
    sql += ' AND pp.credit_sale_id = ?';
    params.push(credit_sale_id);
  }
  if (status) {
    sql += ' AND pp.status = ?';
    params.push(status);
  }
  if (overdue === '1' || overdue === 'true') {
    sql += ` AND pp.status != 'paid' AND pp.planned_date < date('now', 'localtime')`;
  }

  sql += ' ORDER BY pp.planned_date ASC';

  const plans = db.prepare(sql).all(...params);
  res.json({ code: 0, data: plans });
});

router.get('/overdue-summary', (req, res) => {
  const db = getDb();
  const overduePlans = db.prepare(`
    SELECT pp.*, cs.farmer_id, f.name AS farmer_name, f.phone AS farmer_phone, f.village,
           cs.total_amount AS sale_total, cs.paid_amount AS sale_paid,
           cs2.name AS season_name
    FROM payment_plans pp
    JOIN credit_sales cs ON pp.credit_sale_id = cs.id
    JOIN farmers f ON cs.farmer_id = f.id
    JOIN crop_seasons cs2 ON cs.crop_season_id = cs2.id
    WHERE pp.status != 'paid' AND pp.planned_date < date('now', 'localtime')
    ORDER BY pp.planned_date ASC
  `).all();

  const summary = {
    total_overdue_amount: overduePlans.reduce((sum, p) => sum + (p.planned_amount - p.actual_paid_amount), 0),
    overdue_count: overduePlans.length,
    overdue_plans: overduePlans
  };

  res.json({ code: 0, data: summary });
});

router.post('/', (req, res) => {
  const db = getDb();
  const { credit_sale_id, planned_amount, planned_date, notes } = req.body;

  if (!credit_sale_id || !planned_amount || !planned_date) {
    return res.status(400).json({ code: 1, message: '缺少必要字段：credit_sale_id, planned_amount, planned_date' });
  }

  const result = db.prepare(`
    INSERT INTO payment_plans (credit_sale_id, planned_amount, planned_date, status, actual_paid_amount, notes)
    VALUES (?, ?, ?, 'pending', 0, ?)
  `).run(credit_sale_id, planned_amount, planned_date, notes || null);

  const plan = db.prepare('SELECT * FROM payment_plans WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ code: 0, data: plan });
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const { status, actual_paid_amount, notes } = req.body;
  const plan = db.prepare('SELECT * FROM payment_plans WHERE id = ?').get(req.params.id);
  if (!plan) return res.status(404).json({ code: 1, message: '回款计划不存在' });

  const updates = [];
  const params = [];
  if (status) { updates.push('status = ?'); params.push(status); }
  if (actual_paid_amount !== undefined) { updates.push('actual_paid_amount = ?'); params.push(actual_paid_amount); }
  if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }

  if (!updates.length) return res.status(400).json({ code: 1, message: '没有要更新的字段' });

  params.push(req.params.id);
  db.prepare(`UPDATE payment_plans SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const updated = db.prepare('SELECT * FROM payment_plans WHERE id = ?').get(req.params.id);
  res.json({ code: 0, data: updated });
});

router.post('/refresh-overdue', (req, res) => {
  const db = getDb();
  const result = db.prepare(`
    UPDATE payment_plans
    SET status = 'overdue'
    WHERE status = 'pending' AND planned_date < date('now', 'localtime')
  `).run();

  res.json({ code: 0, data: { updated_count: result.changes, message: `已将 ${result.changes} 条计划标记为逾期` } });
});

module.exports = router;
