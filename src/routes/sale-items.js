const express = require('express');
const { getDb } = require('../db/connection');
const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { credit_sale_id, warehouse_confirmed } = req.query;

  let sql = `
    SELECT si.*, cs.farmer_id, f.name AS farmer_name, cs.sale_date,
           u.name AS warehouse_confirmer_name
    FROM sale_items si
    JOIN credit_sales cs ON si.credit_sale_id = cs.id
    JOIN farmers f ON cs.farmer_id = f.id
    LEFT JOIN users u ON si.warehouse_confirmed_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (credit_sale_id) {
    sql += ' AND si.credit_sale_id = ?';
    params.push(credit_sale_id);
  }
  if (warehouse_confirmed !== undefined) {
    sql += ' AND si.warehouse_out_confirmed = ?';
    params.push(warehouse_confirmed === '1' || warehouse_confirmed === 'true' ? 1 : 0);
  }

  sql += ' ORDER BY si.id';

  const items = db.prepare(sql).all(...params);
  res.json({ code: 0, data: items });
});

router.put('/:id/warehouse-confirm', (req, res) => {
  const db = getDb();
  const { confirmed_by } = req.body;

  if (!confirmed_by) {
    return res.status(400).json({ code: 1, message: '缺少必要字段：confirmed_by (仓管用户ID)' });
  }

  const item = db.prepare('SELECT * FROM sale_items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ code: 1, message: '出库明细不存在' });

  db.prepare(`
    UPDATE sale_items
    SET warehouse_out_confirmed = 1, warehouse_confirmed_by = ?, warehouse_confirmed_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(confirmed_by, req.params.id);

  const updated = db.prepare(`
    SELECT si.*, u.name AS warehouse_confirmer_name
    FROM sale_items si
    LEFT JOIN users u ON si.warehouse_confirmed_by = u.id
    WHERE si.id = ?
  `).get(req.params.id);

  res.json({ code: 0, data: updated });
});

module.exports = router;
