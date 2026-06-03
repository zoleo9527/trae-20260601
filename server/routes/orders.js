const express = require('express');
const { getDb } = require('../db');
const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { status, search } = req.query;

  let sql = `
    SELECT o.*, 
      COUNT(DISTINCT m.id) as material_count,
      COUNT(DISTINCT s.id) as schedule_count,
      GROUP_CONCAT(DISTINCT m.status) as material_statuses
    FROM orders o
    LEFT JOIN materials m ON m.order_id = o.id
    LEFT JOIN schedules s ON s.order_id = o.id
    WHERE 1=1
  `;
  const params = [];

  if (status && status !== 'all') {
    sql += ' AND o.status = ?';
    params.push(status);
  }

  if (search) {
    sql += ' AND (o.order_no LIKE ? OR o.client_name LIKE ? OR o.brand LIKE ? OR o.sales_person LIKE ?)';
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }

  sql += ' GROUP BY o.id ORDER BY o.updated_at DESC';

  const orders = db.prepare(sql).all(...params);
  res.json(orders);
});

router.get('/stats', (req, res) => {
  const db = getDb();

  const statusCounts = db.prepare(`
    SELECT status, COUNT(*) as count FROM orders GROUP BY status
  `).all();

  const conflictCount = db.prepare(`
    SELECT COUNT(*) as count FROM schedules WHERE status = 'conflict'
  `).get().count;

  const pendingReview = db.prepare(`
    SELECT COUNT(*) as count FROM materials WHERE status = 'pending_review'
  `).get().count;

  const pendingConfirm = db.prepare(`
    SELECT COUNT(*) as count FROM broadcast_logs WHERE confirmed = 0 AND air_status = 'aired'
  `).get().count;

  const recentAudits = db.prepare(`
    SELECT a.*, o.order_no, o.client_name
    FROM audit_logs a
    LEFT JOIN orders o ON a.order_id = o.id
    ORDER BY a.created_at DESC
    LIMIT 10
  `).all();

  const todaySchedules = db.prepare(`
    SELECT s.*, o.order_no, o.client_name, m.file_name
    FROM schedules s
    JOIN orders o ON s.order_id = o.id
    JOIN materials m ON s.material_id = m.id
    WHERE s.schedule_date = date('now', 'localtime')
    ORDER BY s.time_slot
  `).all();

  res.json({
    statusCounts,
    conflictCount,
    pendingReview,
    pendingConfirm,
    recentAudits,
    todaySchedules
  });
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const materials = db.prepare('SELECT * FROM materials WHERE order_id = ? ORDER BY version, id').all(req.params.id);
  const schedules = db.prepare(`
    SELECT s.*, m.file_name, m.version as material_version
    FROM schedules s
    LEFT JOIN materials m ON s.material_id = m.id
    WHERE s.order_id = ?
    ORDER BY s.schedule_date, s.time_slot
  `).all(req.params.id);

  const broadcasts = db.prepare(`
    SELECT bl.*, s.channel, s.time_slot, s.schedule_date
    FROM broadcast_logs bl
    JOIN schedules s ON bl.schedule_id = s.id
    WHERE s.order_id = ?
    ORDER BY bl.created_at DESC
  `).all(req.params.id);

  const audits = db.prepare(`
    SELECT * FROM audit_logs WHERE order_id = ? ORDER BY created_at DESC
  `).all(req.params.id);

  res.json({ ...order, materials, schedules, broadcasts, audits });
});

router.put('/:id/status', (req, res) => {
  const db = getDb();
  const { status, operator, notes } = req.body;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  db.prepare('UPDATE orders SET status = ?, updated_at = datetime("now", "localtime") WHERE id = ?').run(status, req.params.id);

  db.prepare(`
    INSERT INTO audit_logs (order_id, action, from_status, to_status, operator, notes)
    VALUES (?, 'order_status_change', ?, ?, ?, ?)
  `).run(req.params.id, order.status, status, operator || '系统', notes || '');

  res.json({ success: true });
});

router.post('/', (req, res) => {
  const db = getDb();
  const { client_name, brand, product, sales_person, total_amount, notes } = req.body;

  if (!client_name || !brand || !sales_person) {
    return res.status(400).json({ error: '客户名称、品牌、销售为必填项' });
  }

  const year = new Date().getFullYear();
  const prefix = `ADS-${year}-`;
  const maxRow = db.prepare(
    "SELECT order_no FROM orders WHERE order_no LIKE ? ORDER BY order_no DESC LIMIT 1"
  ).get(`${prefix}%`);
  let seq = 1;
  if (maxRow) {
    const parsed = parseInt(maxRow.order_no.slice(prefix.length), 10);
    if (!isNaN(parsed)) seq = parsed + 1;
  }
  const order_no = `${prefix}${String(seq).padStart(3, '0')}`;

  const result = db.prepare(`
    INSERT INTO orders (order_no, client_name, brand, product, sales_person, total_amount, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, 'draft', ?)
  `).run(order_no, client_name, brand, product || null, sales_person, total_amount || 0, notes || null);

  db.prepare(`
    INSERT INTO audit_logs (order_id, action, from_status, to_status, operator, notes)
    VALUES (?, 'order_status_change', null, 'draft', ?, ?)
  `).run(result.lastInsertRowid, sales_person, '创建订单');

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(order);
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const { client_name, brand, product, sales_person, total_amount, notes } = req.body;

  db.prepare(`
    UPDATE orders SET client_name=?, brand=?, product=?, sales_person=?, total_amount=?, notes=?, updated_at=datetime('now','localtime')
    WHERE id=?
  `).run(client_name, brand, product, sales_person, total_amount, notes, req.params.id);

  res.json({ success: true });
});

module.exports = router;
