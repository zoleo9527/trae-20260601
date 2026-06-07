const express = require('express');
const dayjs = require('dayjs');
const db = require('../db');
const { authMiddleware, requireRoles } = require('../middleware/auth');
const { logOperation } = require('../utils/logger');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  const { date, routeId, status, courierId } = req.query;
  let sql = `
    SELECT 
      mc.*,
      r.name as route_name,
      u1.name as courier_name,
      u2.name as clerk_name
    FROM morning_checkins mc
    LEFT JOIN routes r ON mc.route_id = r.id
    LEFT JOIN users u1 ON mc.courier_id = u1.id
    LEFT JOIN users u2 ON mc.clerk_id = u2.id
    WHERE 1=1
  `;
  const params = [];

  if (date) {
    sql += ' AND mc.checkin_date = ?';
    params.push(date);
  }
  if (routeId) {
    sql += ' AND mc.route_id = ?';
    params.push(routeId);
  }
  if (status) {
    sql += ' AND mc.status = ?';
    params.push(status);
  }
  if (courierId) {
    sql += ' AND mc.courier_id = ?';
    params.push(courierId);
  }

  sql += ' ORDER BY mc.checkin_date DESC, mc.id DESC';

  const checkins = db.prepare(sql).all(...params);
  res.json({ checkins });
});

router.get('/:id', authMiddleware, (req, res) => {
  const checkin = db.prepare(`
    SELECT 
      mc.*,
      r.name as route_name,
      u1.name as courier_name,
      u2.name as clerk_name
    FROM morning_checkins mc
    LEFT JOIN routes r ON mc.route_id = r.id
    LEFT JOIN users u1 ON mc.courier_id = u1.id
    LEFT JOIN users u2 ON mc.clerk_id = u2.id
    WHERE mc.id = ?
  `).get(req.params.id);

  if (!checkin) {
    return res.status(404).json({ error: '签到记录不存在' });
  }

  const orders = db.prepare(`
    SELECT 
      do.*,
      c.name as customer_name,
      c.address as customer_address,
      p.name as product_name,
      p.spec as product_spec,
      e.id as exception_id,
      e.type as exception_type,
      e.status as exception_status,
      e.description as exception_description
    FROM daily_orders do
    LEFT JOIN customers c ON do.customer_id = c.id
    LEFT JOIN products p ON do.product_id = p.id
    LEFT JOIN exceptions e ON e.daily_order_id = do.id AND e.checkin_id = ?
    WHERE do.delivery_date = ? AND do.route_id = ?
    ORDER BY c.address
  `).all(req.params.id, checkin.checkin_date, checkin.route_id);

  const exceptions = db.prepare(`
    SELECT 
      e.*,
      u.name as reporter_name
    FROM exceptions e
    LEFT JOIN users u ON e.reported_by = u.id
    WHERE e.checkin_id = ?
  `).all(req.params.id);

  res.json({ checkin, orders, exceptions });
});

router.post('/', authMiddleware, requireRoles('courier', 'clerk'), (req, res) => {
  const { checkin_date, route_id, courier_id, remark } = req.body;

  if (!checkin_date || !route_id || !courier_id) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  const existing = db.prepare(`
    SELECT id FROM morning_checkins WHERE checkin_date = ? AND route_id = ?
  `).get(checkin_date, route_id);

  if (existing) {
    return res.status(400).json({ error: '该路线当日签到已存在', checkinId: existing.id });
  }

  const totalOrders = db.prepare(`
    SELECT COUNT(*) as count FROM daily_orders 
    WHERE delivery_date = ? AND route_id = ?
  `).get(checkin_date, route_id).count;

  const result = db.prepare(`
    INSERT INTO morning_checkins (checkin_date, route_id, courier_id, total_orders, signed_orders, exception_orders, status, remark)
    VALUES (?, ?, ?, ?, 0, 0, 'draft', ?)
  `).run(checkin_date, route_id, courier_id, totalOrders, remark);

  logOperation(req.user.id, 'create_checkin', 'morning_checkin', result.lastInsertRowid, {
    checkin_date,
    route_id,
    courier_id
  });

  res.json({ id: result.lastInsertRowid, message: '签到记录创建成功' });
});

router.put('/:id/submit', authMiddleware, requireRoles('courier', 'clerk'), (req, res) => {
  const { signed_orders, exception_orders, remark } = req.body;
  const checkinId = req.params.id;

  const checkin = db.prepare('SELECT * FROM morning_checkins WHERE id = ?').get(checkinId);
  if (!checkin) {
    return res.status(404).json({ error: '签到记录不存在' });
  }

  if (checkin.status !== 'draft') {
    return res.status(400).json({ error: '只能提交草稿状态的签到' });
  }

  db.prepare(`
    UPDATE morning_checkins 
    SET signed_orders = ?, exception_orders = ?, status = 'submitted', remark = ?, submitted_at = ?
    WHERE id = ?
  `).run(signed_orders || 0, exception_orders || 0, remark || checkin.remark, new Date().toISOString(), checkinId);

  logOperation(req.user.id, 'submit_checkin', 'morning_checkin', checkinId, {
    signed_orders,
    exception_orders,
    remark
  });

  res.json({ message: '签到已提交，等待文员确认' });
});

router.put('/:id/confirm', authMiddleware, requireRoles('clerk'), (req, res) => {
  const { remark } = req.body;
  const checkinId = req.params.id;

  const checkin = db.prepare('SELECT * FROM morning_checkins WHERE id = ?').get(checkinId);
  if (!checkin) {
    return res.status(404).json({ error: '签到记录不存在' });
  }

  if (checkin.status !== 'submitted') {
    return res.status(400).json({ error: '只能确认已提交的签到' });
  }

  db.prepare(`
    UPDATE morning_checkins 
    SET clerk_id = ?, status = 'confirmed', remark = ?, confirmed_at = ?
    WHERE id = ?
  `).run(req.user.id, remark || checkin.remark, new Date().toISOString(), checkinId);

  logOperation(req.user.id, 'confirm_checkin', 'morning_checkin', checkinId, {
    remark,
    clerk_id: req.user.id
  });

  res.json({ message: '签到已确认' });
});

router.put('/:id/orders/:orderId/status', authMiddleware, requireRoles('courier', 'clerk'), (req, res) => {
  const checkinId = req.params.id;
  const orderId = req.params.orderId;
  const { status } = req.body;

  const checkin = db.prepare('SELECT * FROM morning_checkins WHERE id = ?').get(checkinId);
  if (!checkin) {
    return res.status(404).json({ error: '签到记录不存在' });
  }

  const order = db.prepare('SELECT * FROM daily_orders WHERE id = ? AND delivery_date = ? AND route_id = ?').get(
    orderId, checkin.checkin_date, checkin.route_id
  );
  if (!order) {
    return res.status(404).json({ error: '订单不存在或不属于该签到' });
  }

  const validStatuses = ['pending', 'signed', 'exception'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: '无效的状态' });
  }

  const oldStatus = order.status;
  db.prepare('UPDATE daily_orders SET status = ? WHERE id = ?').run(status, orderId);

  const signedCount = db.prepare(`
    SELECT COUNT(*) as count FROM daily_orders 
    WHERE delivery_date = ? AND route_id = ? AND status = 'signed'
  `).get(checkin.checkin_date, checkin.route_id).count;

  const exceptionCount = db.prepare(`
    SELECT COUNT(*) as count FROM daily_orders 
    WHERE delivery_date = ? AND route_id = ? AND status = 'exception'
  `).get(checkin.checkin_date, checkin.route_id).count;

  db.prepare(`
    UPDATE morning_checkins SET signed_orders = ?, exception_orders = ? WHERE id = ?
  `).run(signedCount, exceptionCount, checkinId);

  logOperation(req.user.id, 'update_order_in_checkin', 'daily_order', orderId, {
    checkinId,
    oldStatus,
    newStatus: status
  });

  res.json({ message: '订单状态更新成功', signedCount, exceptionCount });
});

router.post('/:id/orders/:orderId/exception', authMiddleware, requireRoles('courier', 'clerk'), (req, res) => {
  const checkinId = req.params.id;
  const orderId = req.params.orderId;
  const { type, description } = req.body;

  const checkin = db.prepare('SELECT * FROM morning_checkins WHERE id = ?').get(checkinId);
  if (!checkin) {
    return res.status(404).json({ error: '签到记录不存在' });
  }

  const order = db.prepare('SELECT * FROM daily_orders WHERE id = ? AND delivery_date = ? AND route_id = ?').get(
    orderId, checkin.checkin_date, checkin.route_id
  );
  if (!order) {
    return res.status(404).json({ error: '订单不存在或不属于该签到' });
  }

  const validTypes = ['missed', 'damaged', 'wrong_product', 'customer_absent', 'other'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: '无效的异常类型' });
  }

  const existing = db.prepare('SELECT id FROM exceptions WHERE daily_order_id = ? AND checkin_id = ?').get(orderId, checkinId);
  if (existing) {
    return res.status(400).json({ error: '该订单已在本次签到中上报过异常' });
  }

  const result = db.prepare(`
    INSERT INTO exceptions (daily_order_id, checkin_id, reported_by, type, description, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `).run(orderId, checkinId, req.user.id, type, description || null);

  db.prepare('UPDATE daily_orders SET status = ? WHERE id = ?').run('exception', orderId);

  const exceptionCount = db.prepare(`
    SELECT COUNT(*) as count FROM daily_orders 
    WHERE delivery_date = ? AND route_id = ? AND status = 'exception'
  `).get(checkin.checkin_date, checkin.route_id).count;

  db.prepare(`
    UPDATE morning_checkins SET exception_orders = ? WHERE id = ?
  `).run(exceptionCount, checkinId);

  logOperation(req.user.id, 'report_exception_in_checkin', 'exception', result.lastInsertRowid, {
    checkinId,
    daily_order_id: orderId,
    type,
    description
  });

  res.json({ id: result.lastInsertRowid, message: '异常已上报', exceptionCount });
});

module.exports = router;
