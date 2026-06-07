const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/order/:orderId', authMiddleware, (req, res) => {
  const orderId = req.params.orderId;

  const order = db.prepare(`
    SELECT do.*, c.name as customer_name, p.name as product_name, r.name as route_name
    FROM daily_orders do
    LEFT JOIN customers c ON do.customer_id = c.id
    LEFT JOIN products p ON do.product_id = p.id
    LEFT JOIN routes r ON do.route_id = r.id
    WHERE do.id = ?
  `).get(orderId);

  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  const events = [];

  events.push({
    type: 'order_created',
    time: order.created_at,
    title: '订单生成',
    description: `${order.customer_name} - ${order.product_name} x${order.quantity}`,
    user: null
  });

  const checkins = db.prepare(`
    SELECT mc.*, u1.name as courier_name, u2.name as clerk_name
    FROM morning_checkins mc
    LEFT JOIN users u1 ON mc.courier_id = u1.id
    LEFT JOIN users u2 ON mc.clerk_id = u2.id
    WHERE mc.checkin_date = ? AND mc.route_id = ?
  `).all(order.delivery_date, order.route_id);

  checkins.forEach(c => {
    if (c.submitted_at) {
      events.push({
        type: 'checkin_submitted',
        time: c.submitted_at,
        title: '晨配签到提交',
        description: `${c.courier_name} 提交了 ${c.route_name} 签到，共${c.total_orders}单，已签${c.signed_orders}单，异常${c.exception_orders}单`,
        user: c.courier_name
      });
    }
    if (c.confirmed_at) {
      events.push({
        type: 'checkin_confirmed',
        time: c.confirmed_at,
        title: '晨配签到确认',
        description: `${c.clerk_name} 确认了签到`,
        user: c.clerk_name
      });
    }
  });

  const exceptions = db.prepare(`
    SELECT e.*, u.name as reporter_name
    FROM exceptions e
    LEFT JOIN users u ON e.reported_by = u.id
    WHERE e.daily_order_id = ?
    ORDER BY e.created_at
  `).all(orderId);

  exceptions.forEach(e => {
    const typeMap = {
      missed: '漏送',
      damaged: '破损',
      wrong_product: '错送',
      customer_absent: '客户不在',
      other: '其他'
    };
    events.push({
      type: 'exception_reported',
      time: e.created_at,
      title: `异常上报: ${typeMap[e.type] || e.type}`,
      description: e.description || '无详细描述',
      user: e.reporter_name
    });

    if (e.status === 'resolved') {
      events.push({
        type: 'exception_resolved',
        time: e.updated_at,
        title: '异常已解决',
        description: '',
        user: null
      });
    }
  });

  const replenishments = db.prepare(`
    SELECT r.*, u1.name as handler_name, u2.name as confirmer_name
    FROM replenishments r
    LEFT JOIN users u1 ON r.handled_by = u1.id
    LEFT JOIN users u2 ON r.confirmed_by = u2.id
    WHERE r.daily_order_id = ?
    ORDER BY r.created_at
  `).all(orderId);

  const methodMap = {
    redelivery: '重新配送',
    refund: '退款',
    replace: '换货'
  };

  replenishments.forEach(r => {
    events.push({
      type: 'replenishment_created',
      time: r.created_at,
      title: `补送安排: ${methodMap[r.method]}`,
      description: `数量: ${r.quantity}${r.remark ? '，备注: ' + r.remark : ''}`,
      user: r.handler_name
    });

    if (r.delivered_at) {
      events.push({
        type: 'replenishment_delivered',
        time: r.delivered_at,
        title: '补送已配送',
        description: '',
        user: r.handler_name
      });
    }

    if (r.confirmed_at) {
      events.push({
        type: 'replenishment_confirmed',
        time: r.confirmed_at,
        title: '补送已确认',
        description: '',
        user: r.confirmer_name
      });
    }
  });

  const logs = db.prepare(`
    SELECT ol.*, u.name as user_name
    FROM operation_logs ol
    LEFT JOIN users u ON ol.user_id = u.id
    WHERE ol.target_type = 'daily_order' AND ol.target_id = ?
    ORDER BY ol.created_at
  `).all(orderId);

  logs.forEach(l => {
    let detail = '';
    try {
      const parsed = JSON.parse(l.detail);
      if (parsed.oldStatus && parsed.newStatus) {
        detail = `状态从 ${parsed.oldStatus} 变更为 ${parsed.newStatus}`;
      }
    } catch (e) {}
    events.push({
      type: 'operation_log',
      time: l.created_at,
      title: '操作记录',
      description: detail || l.action,
      user: l.user_name
    });
  });

  events.sort((a, b) => new Date(a.time) - new Date(b.time));

  res.json({ order, timeline: events });
});

router.get('/checkin/:checkinId', authMiddleware, (req, res) => {
  const checkinId = req.params.checkinId;

  const checkin = db.prepare(`
    SELECT mc.*, r.name as route_name, u1.name as courier_name, u2.name as clerk_name
    FROM morning_checkins mc
    LEFT JOIN routes r ON mc.route_id = r.id
    LEFT JOIN users u1 ON mc.courier_id = u1.id
    LEFT JOIN users u2 ON mc.clerk_id = u2.id
    WHERE mc.id = ?
  `).get(checkinId);

  if (!checkin) {
    return res.status(404).json({ error: '签到记录不存在' });
  }

  const events = [];

  events.push({
    type: 'checkin_created',
    time: checkin.created_at,
    title: '签到记录创建',
    description: `${checkin.route_name}，共${checkin.total_orders}单`,
    user: null
  });

  if (checkin.submitted_at) {
    events.push({
      type: 'checkin_submitted',
      time: checkin.submitted_at,
      title: '签到提交',
      description: `已签${checkin.signed_orders}单，异常${checkin.exception_orders}单${checkin.remark ? '，备注: ' + checkin.remark : ''}`,
      user: checkin.courier_name
    });
  }

  if (checkin.confirmed_at) {
    events.push({
      type: 'checkin_confirmed',
      time: checkin.confirmed_at,
      title: '签到确认',
      description: checkin.remark || '',
      user: checkin.clerk_name
    });
  }

  const logs = db.prepare(`
    SELECT ol.*, u.name as user_name
    FROM operation_logs ol
    LEFT JOIN users u ON ol.user_id = u.id
    WHERE ol.target_type = 'morning_checkin' AND ol.target_id = ?
    ORDER BY ol.created_at
  `).all(checkinId);

  logs.forEach(l => {
    events.push({
      type: 'operation_log',
      time: l.created_at,
      title: '操作记录',
      description: l.action,
      user: l.user_name
    });
  });

  events.sort((a, b) => new Date(a.time) - new Date(b.time));

  res.json({ checkin, timeline: events });
});

module.exports = router;
