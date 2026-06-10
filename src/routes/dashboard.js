const express = require('express');
const { getDb } = require('../db/connection');
const router = express.Router();

router.get('/overview', (req, res) => {
  const db = getDb();

  const totalDebt = db.prepare(`
    SELECT COALESCE(SUM(total_amount - paid_amount), 0) AS total_debt,
           COUNT(*) AS total_sales,
           SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
           SUM(CASE WHEN status = 'partial' THEN 1 ELSE 0 END) AS partial_count,
           SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) AS overdue_count,
           SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid_count,
           SUM(CASE WHEN status = 'disputed' THEN 1 ELSE 0 END) AS disputed_count,
           SUM(total_amount) AS total_sales_amount,
           SUM(paid_amount) AS total_paid_amount
    FROM credit_sales
  `).get();

  const overdueAmount = db.prepare(`
    SELECT COALESCE(SUM(pp.planned_amount - pp.actual_paid_amount), 0) AS overdue_amount,
               COUNT(*) AS overdue_plan_count
    FROM payment_plans pp
    WHERE pp.status != 'paid' AND pp.planned_date < date('now', 'localtime')
  `).get();

  const farmerDebts = db.prepare(`
    SELECT f.id AS farmer_id, f.name AS farmer_name, f.phone, f.village,
           COUNT(cs.id) AS sale_count,
           SUM(cs.total_amount) AS total_amount,
           SUM(cs.paid_amount) AS paid_amount,
           SUM(cs.total_amount - cs.paid_amount) AS outstanding_amount,
           SUM(CASE WHEN cs.status = 'overdue' THEN 1 ELSE 0 END) AS overdue_count,
           SUM(CASE WHEN cs.status = 'disputed' THEN 1 ELSE 0 END) AS disputed_count
    FROM farmers f
    JOIN credit_sales cs ON f.id = cs.farmer_id
    GROUP BY f.id
    ORDER BY outstanding_amount DESC
  `).all();

  const productTypeSummary = db.prepare(`
    SELECT si.product_type,
           SUM(si.quantity) AS total_quantity,
           SUM(si.subtotal) AS total_amount
    FROM sale_items si
    JOIN credit_sales cs ON si.credit_sale_id = cs.id
    WHERE cs.status != 'paid'
    GROUP BY si.product_type
    ORDER BY total_amount DESC
  `).all();

  const seasonSummary = db.prepare(`
    SELECT cs2.id AS season_id, cs2.name AS season_name,
           COUNT(cs.id) AS sale_count,
           SUM(cs.total_amount) AS total_amount,
           SUM(cs.paid_amount) AS paid_amount,
           SUM(cs.total_amount - cs.paid_amount) AS outstanding_amount
    FROM crop_seasons cs2
    JOIN credit_sales cs ON cs2.id = cs.crop_season_id
    GROUP BY cs2.id
  `).all();

  res.json({
    code: 0,
    data: {
      total_summary: totalDebt,
      overdue_summary: overdueAmount,
      farmer_debts: farmerDebts,
      product_type_summary: productTypeSummary,
      season_summary: seasonSummary
    }
  });
});

router.get('/farmer/:farmerId', (req, res) => {
  const db = getDb();
  const { farmerId } = req.params;

  const farmer = db.prepare('SELECT * FROM farmers WHERE id = ?').get(farmerId);
  if (!farmer) return res.status(404).json({ code: 1, message: '农户不存在' });

  const sales = db.prepare(`
    SELECT cs.*, cs2.name AS season_name
    FROM credit_sales cs
    JOIN crop_seasons cs2 ON cs.crop_season_id = cs2.id
    WHERE cs.farmer_id = ?
    ORDER BY cs.sale_date DESC
  `).all(farmerId);

  const enrichedSales = sales.map(sale => {
    const items = db.prepare('SELECT * FROM sale_items WHERE credit_sale_id = ?').all(sale.id);
    const plans = db.prepare('SELECT * FROM payment_plans WHERE credit_sale_id = ?').all(sale.id);
    const payments = db.prepare('SELECT pp2.*, u.name AS received_by_name FROM partial_payments pp2 JOIN users u ON pp2.received_by = u.id WHERE pp2.credit_sale_id = ?').all(sale.id);
    const collections = db.prepare('SELECT cr.*, u.name AS collector_name FROM collection_records cr JOIN users u ON cr.collector_id = u.id WHERE cr.credit_sale_id = ?').all(sale.id);
    const reconciliations = db.prepare('SELECT r.*, u.name AS confirmer_name FROM reconciliations r JOIN users u ON r.confirmed_by = u.id WHERE r.credit_sale_id = ?').all(sale.id);
    return { ...sale, items, payment_plans: plans, payments, collections, reconciliations };
  });

  const summary = {
    total_amount: sales.reduce((s, x) => s + x.total_amount, 0),
    paid_amount: sales.reduce((s, x) => s + x.paid_amount, 0),
    outstanding_amount: sales.reduce((s, x) => s + (x.total_amount - x.paid_amount), 0),
    sale_count: sales.length,
    overdue_count: sales.filter(s => s.status === 'overdue').length,
    disputed_count: sales.filter(s => s.status === 'disputed').length
  };

  res.json({
    code: 0,
    data: { farmer, summary, sales: enrichedSales }
  });
});

module.exports = router;
