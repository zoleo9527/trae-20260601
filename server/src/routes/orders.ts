import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/', (req, res) => {
  const { status, keyword, page = '1', pageSize = '20' } = req.query;
  const pageNum = parseInt(page as string);
  const pageSizeNum = parseInt(pageSize as string);
  const offset = (pageNum - 1) * pageSizeNum;

  let whereClauses: string[] = [];
  let params: any[] = [];

  if (status) {
    whereClauses.push('status = ?');
    params.push(status);
  }
  if (keyword) {
    whereClauses.push('(order_no LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countResult = db.prepare(`
    SELECT COUNT(*) as total FROM sales_orders ${whereSql}
  `).get(...params) as { total: number };

  const orders = db.prepare(`
    SELECT * FROM sales_orders
    ${whereSql}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSizeNum, offset);

  res.json({
    list: orders,
    total: countResult.total,
    page: pageNum,
    pageSize: pageSizeNum,
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;

  const order = db.prepare('SELECT * FROM sales_orders WHERE id = ?').get(id);
  if (!order) {
    res.status(404).json({ error: '订单不存在' });
    return;
  }

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
  const receipt = db.prepare('SELECT * FROM delivery_receipts WHERE order_id = ? ORDER BY delivery_date DESC LIMIT 1').get(id);

  res.json({
    ...order,
    items,
    delivery_receipt: receipt || null,
  });
});

router.get('/:id/receipts', (req, res) => {
  const { id } = req.params;
  const receipts = db.prepare('SELECT * FROM delivery_receipts WHERE order_id = ? ORDER BY delivery_date DESC').all(id);
  res.json(receipts);
});

export default router;
