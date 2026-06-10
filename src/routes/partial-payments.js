const express = require('express');
const { getDb } = require('../db/connection');
const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { credit_sale_id } = req.query;

  let sql = `
    SELECT pp2.*, cs.farmer_id, f.name AS farmer_name, u.name AS received_by_name
    FROM partial_payments pp2
    JOIN credit_sales cs ON pp2.credit_sale_id = cs.id
    JOIN farmers f ON cs.farmer_id = f.id
    JOIN users u ON pp2.received_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (credit_sale_id) {
    sql += ' AND pp2.credit_sale_id = ?';
    params.push(credit_sale_id);
  }

  sql += ' ORDER BY pp2.payment_date DESC, pp2.id DESC';

  const payments = db.prepare(sql).all(...params);
  res.json({ code: 0, data: payments });
});

router.post('/', (req, res) => {
  const db = getDb();
  const { credit_sale_id, payment_plan_id, amount, payment_date, payment_method, received_by, notes } = req.body;

  if (!credit_sale_id || !amount || !payment_date || !payment_method || !received_by) {
    return res.status(400).json({ code: 1, message: '缺少必要字段：credit_sale_id, amount, payment_date, payment_method, received_by' });
  }

  const sale = db.prepare('SELECT * FROM credit_sales WHERE id = ?').get(credit_sale_id);
  if (!sale) return res.status(404).json({ code: 1, message: '赊销单不存在' });

  if (payment_plan_id) {
    const plan = db.prepare('SELECT * FROM payment_plans WHERE id = ?').get(payment_plan_id);
    if (!plan) return res.status(400).json({ code: 1, message: '回款计划不存在' });
    if (plan.credit_sale_id !== credit_sale_id) {
      return res.status(400).json({ code: 1, message: '回款计划不属于当前赊销单' });
    }
  }

  const insertPayment = db.prepare(`
    INSERT INTO partial_payments (credit_sale_id, payment_plan_id, amount, payment_date, payment_method, received_by, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const updateSalePaid = db.prepare(`
    UPDATE credit_sales SET paid_amount = paid_amount + ?, status = ? WHERE id = ?
  `);
  const updatePlanPaid = db.prepare(`
    UPDATE payment_plans SET actual_paid_amount = actual_paid_amount + ?, status = ? WHERE id = ?
  `);

  const PROTECTED_STATUSES = new Set(['disputed', 'overdue']);

  const allPlansPaid = (saleId) => {
    const unpaid = db.prepare(
      "SELECT id FROM payment_plans WHERE credit_sale_id = ? AND status != 'paid'"
    ).all(saleId);
    return unpaid.length === 0;
  };

  const transaction = db.transaction(() => {
    const result = insertPayment.run(
      credit_sale_id, payment_plan_id || null, amount, payment_date, payment_method, received_by, notes || null
    );

    if (payment_plan_id) {
      const plan = db.prepare('SELECT * FROM payment_plans WHERE id = ?').get(payment_plan_id);
      const newPlanPaid = plan.actual_paid_amount + amount;
      let newPlanStatus;
      if (newPlanPaid >= plan.planned_amount) {
        newPlanStatus = 'paid';
      } else if (newPlanPaid > 0) {
        newPlanStatus = 'partial';
      } else {
        newPlanStatus = plan.status;
      }
      updatePlanPaid.run(amount, newPlanStatus, payment_plan_id);
    }

    const newPaidAmount = sale.paid_amount + amount;
    let newSaleStatus;
    if (newPaidAmount >= sale.total_amount && allPlansPaid(credit_sale_id)) {
      newSaleStatus = 'paid';
    } else if (PROTECTED_STATUSES.has(sale.status)) {
      newSaleStatus = sale.status;
    } else if (newPaidAmount > 0) {
      newSaleStatus = 'partial';
    } else {
      newSaleStatus = sale.status;
    }
    updateSalePaid.run(amount, newSaleStatus, credit_sale_id);

    return result.lastInsertRowid;
  });

  const paymentId = transaction();
  const payment = db.prepare(`
    SELECT pp2.*, u.name AS received_by_name FROM partial_payments pp2
    JOIN users u ON pp2.received_by = u.id WHERE pp2.id = ?
  `).get(paymentId);

  const updatedSale = db.prepare('SELECT * FROM credit_sales WHERE id = ?').get(credit_sale_id);

  res.status(201).json({
    code: 0,
    data: { payment, updated_sale: updatedSale }
  });
});

module.exports = router;
