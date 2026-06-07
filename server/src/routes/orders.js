const express = require('express');
const dayjs = require('dayjs');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { logOperation } = require('../utils/logger');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  const { date, routeId, status, customerId } = req.query;
  let sql = `
    SELECT 
      do.*,
      c.name as customer_name,
      c.phone as customer_phone,
      c.address as customer_address,
      p.name as product_name,
      p.spec as product_spec,
      r.name as route_name
    FROM daily_orders do
    LEFT JOIN customers c ON do.customer_id = c.id
    LEFT JOIN products p ON do.product_id = p.id
    LEFT JOIN routes r ON do.route_id = r.id
    WHERE 1=1
  `;
  const params = [];

  if (date) {
    sql += ' AND do.delivery_date = ?';
    params.push(date);
  }
  if (routeId) {
    sql += ' AND do.route_id = ?';
    params.push(routeId);
  }
  if (status) {
    sql += ' AND do.status = ?';
    params.push(status);
  }
  if (customerId) {
    sql += ' AND do.customer_id = ?';
    params.push(customerId);
  }

  sql += ' ORDER BY do.delivery_date DESC, do.id DESC';

  const orders = db.prepare(sql).all(...params);
  res.json({ orders });
});

router.get('/:id', authMiddleware, (req, res) => {
  const order = db.prepare(`
    SELECT 
      do.*,
      c.name as customer_name,
      c.phone as customer_phone,
      c.address as customer_address,
      p.name as product_name,
      p.spec as product_spec,
      r.name as route_name
    FROM daily_orders do
    LEFT JOIN customers c ON do.customer_id = c.id
    LEFT JOIN products p ON do.product_id = p.id
    LEFT JOIN routes r ON do.route_id = r.id
    WHERE do.id = ?
  `).get(req.params.id);

  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  res.json({ order });
});

router.put('/:id/status', authMiddleware, (req, res) => {
  const { status, remark } = req.body;
  const validStatuses = ['pending', 'signed', 'exception', 'replenished'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: '无效的状态' });
  }

  const order = db.prepare('SELECT * FROM daily_orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  db.prepare('UPDATE daily_orders SET status = ? WHERE id = ?').run(status, req.params.id);
  logOperation(req.user.id, 'update_order_status', 'daily_order', req.params.id, {
    oldStatus: order.status,
    newStatus: status,
    remark
  });

  res.json({ message: '状态更新成功' });
});

router.get('/summary/daily', authMiddleware, (req, res) => {
  const { date } = req.query;
  const targetDate = date || dayjs().format('YYYY-MM-DD');

  const summary = db.prepare(`
    SELECT 
      route_id,
      r.name as route_name,
      COUNT(*) as total,
      SUM(CASE WHEN status = 'signed' THEN 1 ELSE 0 END) as signed,
      SUM(CASE WHEN status = 'exception' THEN 1 ELSE 0 END) as exception,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'replenished' THEN 1 ELSE 0 END) as replenished
    FROM daily_orders do
    LEFT JOIN routes r ON do.route_id = r.id
    WHERE delivery_date = ?
    GROUP BY route_id
    ORDER BY route_id
  `).all(targetDate);

  res.json({ date: targetDate, summary });
});

module.exports = router;
