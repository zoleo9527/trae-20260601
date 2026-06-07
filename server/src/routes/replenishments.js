const express = require('express');
const db = require('../db');
const { authMiddleware, requireRoles } = require('../middleware/auth');
const { logOperation } = require('../utils/logger');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  const { status, exceptionId, dailyOrderId } = req.query;
  let sql = `
    SELECT 
      r.*,
      e.type as exception_type,
      e.description as exception_description,
      do.delivery_date,
      c.name as customer_name,
      c.address as customer_address,
      p.name as product_name,
      u1.name as handler_name,
      u2.name as confirmer_name
    FROM replenishments r
    LEFT JOIN exceptions e ON r.exception_id = e.id
    LEFT JOIN daily_orders do ON r.daily_order_id = do.id
    LEFT JOIN customers c ON do.customer_id = c.id
    LEFT JOIN products p ON do.product_id = p.id
    LEFT JOIN users u1 ON r.handled_by = u1.id
    LEFT JOIN users u2 ON r.confirmed_by = u2.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    sql += ' AND r.status = ?';
    params.push(status);
  }
  if (exceptionId) {
    sql += ' AND r.exception_id = ?';
    params.push(exceptionId);
  }
  if (dailyOrderId) {
    sql += ' AND r.daily_order_id = ?';
    params.push(dailyOrderId);
  }

  sql += ' ORDER BY r.created_at DESC';

  const replenishments = db.prepare(sql).all(...params);
  res.json({ replenishments });
});

router.get('/:id', authMiddleware, (req, res) => {
  const replenishment = db.prepare(`
    SELECT 
      r.*,
      e.type as exception_type,
      e.description as exception_description,
      do.delivery_date,
      do.quantity,
      c.name as customer_name,
      c.phone as customer_phone,
      c.address as customer_address,
      p.name as product_name,
      p.spec as product_spec,
      u1.name as handler_name,
      u2.name as confirmer_name
    FROM replenishments r
    LEFT JOIN exceptions e ON r.exception_id = e.id
    LEFT JOIN daily_orders do ON r.daily_order_id = do.id
    LEFT JOIN customers c ON do.customer_id = c.id
    LEFT JOIN products p ON do.product_id = p.id
    LEFT JOIN users u1 ON r.handled_by = u1.id
    LEFT JOIN users u2 ON r.confirmed_by = u2.id
    WHERE r.id = ?
  `).get(req.params.id);

  if (!replenishment) {
    return res.status(404).json({ error: '补送记录不存在' });
  }

  res.json({ replenishment });
});

router.post('/', authMiddleware, requireRoles('courier', 'customer_service', 'clerk'), (req, res) => {
  const { exception_id, daily_order_id, quantity, method, remark } = req.body;

  if (!exception_id || !daily_order_id || !quantity || !method) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  const validMethods = ['redelivery', 'refund', 'replace'];
  if (!validMethods.includes(method)) {
    return res.status(400).json({ error: '无效的补送方式' });
  }

  const result = db.prepare(`
    INSERT INTO replenishments (exception_id, daily_order_id, handled_by, quantity, method, remark, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `).run(exception_id, daily_order_id, req.user.id, quantity, method, remark || null);

  db.prepare('UPDATE exceptions SET status = ? WHERE id = ?').run('processing', exception_id);

  logOperation(req.user.id, 'create_replenishment', 'replenishment', result.lastInsertRowid, {
    exception_id,
    daily_order_id,
    quantity,
    method
  });

  res.json({ id: result.lastInsertRowid, message: '补送安排已创建' });
});

router.put('/:id/deliver', authMiddleware, requireRoles('courier'), (req, res) => {
  const { remark } = req.body;
  const replenishmentId = req.params.id;

  const replenishment = db.prepare('SELECT * FROM replenishments WHERE id = ?').get(replenishmentId);
  if (!replenishment) {
    return res.status(404).json({ error: '补送记录不存在' });
  }

  if (replenishment.status !== 'pending') {
    return res.status(400).json({ error: '只能配送待处理的补送' });
  }

  db.prepare(`
    UPDATE replenishments 
    SET status = 'delivered', remark = ?, delivered_at = ?
    WHERE id = ?
  `).run(remark || replenishment.remark, new Date().toISOString(), replenishmentId);

  logOperation(req.user.id, 'deliver_replenishment', 'replenishment', replenishmentId, { remark });

  res.json({ message: '补送已完成，等待确认' });
});

router.put('/:id/confirm', authMiddleware, requireRoles('clerk', 'customer_service'), (req, res) => {
  const { remark } = req.body;
  const replenishmentId = req.params.id;

  const replenishment = db.prepare('SELECT * FROM replenishments WHERE id = ?').get(replenishmentId);
  if (!replenishment) {
    return res.status(404).json({ error: '补送记录不存在' });
  }

  if (replenishment.status !== 'delivered') {
    return res.status(400).json({ error: '只能确认已配送的补送' });
  }

  db.prepare(`
    UPDATE replenishments 
    SET confirmed_by = ?, status = 'confirmed', remark = ?, confirmed_at = ?
    WHERE id = ?
  `).run(req.user.id, remark || replenishment.remark, new Date().toISOString(), replenishmentId);

  db.prepare('UPDATE exceptions SET status = ? WHERE id = ?').run('resolved', replenishment.exception_id);
  db.prepare('UPDATE daily_orders SET status = ? WHERE id = ?').run('replenished', replenishment.daily_order_id);

  logOperation(req.user.id, 'confirm_replenishment', 'replenishment', replenishmentId, {
    remark,
    confirmed_by: req.user.id
  });

  res.json({ message: '补送已确认，流程闭环' });
});

module.exports = router;
