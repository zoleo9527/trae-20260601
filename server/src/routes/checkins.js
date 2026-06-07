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
      p.spec as product_spec
    FROM daily_orders do
    LEFT JOIN customers c ON do.customer_id = c.id
    LEFT JOIN products p ON do.product_id = p.id
    WHERE do.delivery_date = ? AND do.route_id = ?
    ORDER BY c.address
  `).all(checkin.checkin_date, checkin.route_id);

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

module.exports = router;
