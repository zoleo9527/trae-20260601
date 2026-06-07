const express = require('express');
const db = require('../db');
const { authMiddleware, requireRoles } = require('../middleware/auth');
const { logOperation } = require('../utils/logger');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  const { status, checkinId, dailyOrderId, type } = req.query;
  let sql = `
    SELECT 
      e.*,
      do.delivery_date,
      c.name as customer_name,
      c.address as customer_address,
      p.name as product_name,
      p.spec as product_spec,
      r.name as route_name,
      u.name as reporter_name
    FROM exceptions e
    LEFT JOIN daily_orders do ON e.daily_order_id = do.id
    LEFT JOIN customers c ON do.customer_id = c.id
    LEFT JOIN products p ON do.product_id = p.id
    LEFT JOIN routes r ON do.route_id = r.id
    LEFT JOIN users u ON e.reported_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    sql += ' AND e.status = ?';
    params.push(status);
  }
  if (checkinId) {
    sql += ' AND e.checkin_id = ?';
    params.push(checkinId);
  }
  if (dailyOrderId) {
    sql += ' AND e.daily_order_id = ?';
    params.push(dailyOrderId);
  }
  if (type) {
    sql += ' AND e.type = ?';
    params.push(type);
  }

  sql += ' ORDER BY e.created_at DESC';

  const exceptions = db.prepare(sql).all(...params);
  res.json({ exceptions });
});

router.get('/:id', authMiddleware, (req, res) => {
  const exception = db.prepare(`
    SELECT 
      e.*,
      do.delivery_date,
      do.quantity,
      c.name as customer_name,
      c.phone as customer_phone,
      c.address as customer_address,
      p.name as product_name,
      p.spec as product_spec,
      r.name as route_name,
      u.name as reporter_name
    FROM exceptions e
    LEFT JOIN daily_orders do ON e.daily_order_id = do.id
    LEFT JOIN customers c ON do.customer_id = c.id
    LEFT JOIN products p ON do.product_id = p.id
    LEFT JOIN routes r ON do.route_id = r.id
    LEFT JOIN users u ON e.reported_by = u.id
    WHERE e.id = ?
  `).get(req.params.id);

  if (!exception) {
    return res.status(404).json({ error: '异常记录不存在' });
  }

  const replenishments = db.prepare(`
    SELECT 
      r.*,
      u1.name as handler_name,
      u2.name as confirmer_name
    FROM replenishments r
    LEFT JOIN users u1 ON r.handled_by = u1.id
    LEFT JOIN users u2 ON r.confirmed_by = u2.id
    WHERE r.exception_id = ?
    ORDER BY r.created_at DESC
  `).all(req.params.id);

  res.json({ exception, replenishments });
});

router.post('/', authMiddleware, (req, res) => {
  const { daily_order_id, checkin_id, type, description } = req.body;

  if (!daily_order_id || !type) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  const validTypes = ['missed', 'damaged', 'wrong_product', 'customer_absent', 'other'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: '无效的异常类型' });
  }

  const order = db.prepare('SELECT * FROM daily_orders WHERE id = ?').get(daily_order_id);
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  let finalCheckinId = checkin_id;
  if (!finalCheckinId && order.delivery_date && order.route_id) {
    const checkin = db.prepare(`
      SELECT id FROM morning_checkins 
      WHERE checkin_date = ? AND route_id = ?
      LIMIT 1
    `).get(order.delivery_date, order.route_id);
    if (checkin) {
      finalCheckinId = checkin.id;
    }
  }

  const result = db.prepare(`
    INSERT INTO exceptions (daily_order_id, checkin_id, reported_by, type, description, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `).run(daily_order_id, finalCheckinId || null, req.user.id, type, description || null);

  db.prepare('UPDATE daily_orders SET status = ? WHERE id = ?').run('exception', daily_order_id);

  if (finalCheckinId) {
    const exceptionCount = db.prepare(`
      SELECT COUNT(*) as count FROM daily_orders 
      WHERE delivery_date = ? AND route_id = ? AND status = 'exception'
    `).get(order.delivery_date, order.route_id).count;

    db.prepare(`
      UPDATE morning_checkins SET exception_orders = ? WHERE id = ?
    `).run(exceptionCount, finalCheckinId);
  }

  logOperation(req.user.id, 'create_exception', 'exception', result.lastInsertRowid, {
    daily_order_id,
    checkin_id: finalCheckinId,
    type,
    description
  });

  res.json({ id: result.lastInsertRowid, message: '异常已上报', checkin_id: finalCheckinId });
});

router.put('/:id/status', authMiddleware, (req, res) => {
  const { status, remark } = req.body;
  const validStatuses = ['pending', 'processing', 'resolved', 'closed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: '无效的状态' });
  }

  const exception = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(req.params.id);
  if (!exception) {
    return res.status(404).json({ error: '异常记录不存在' });
  }

  db.prepare('UPDATE exceptions SET status = ?, updated_at = ? WHERE id = ?')
    .run(status, new Date().toISOString(), req.params.id);

  logOperation(req.user.id, 'update_exception_status', 'exception', req.params.id, {
    oldStatus: exception.status,
    newStatus: status,
    remark
  });

  res.json({ message: '状态更新成功' });
});

module.exports = router;
