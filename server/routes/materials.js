const express = require('express');
const { getDb } = require('../db');
const router = express.Router();

router.post('/', (req, res) => {
  const db = getDb();
  const { order_id, file_name, file_type, duration } = req.body;

  if (!order_id || !file_name || !file_type) {
    return res.status(400).json({ error: '订单ID、文件名、文件类型为必填项' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);
  if (!order) return res.status(404).json({ error: '订单不存在' });

  if (!['draft', 'submitted', 'in_review', 'revision_needed', 'material_rejected'].includes(order.status)) {
    return res.status(400).json({ error: '当前订单状态不允许录入素材' });
  }

  const existingMaxVersion = db.prepare(
    'SELECT MAX(version) as max_ver FROM materials WHERE order_id = ?'
  ).get(order_id);
  const nextVersion = (existingMaxVersion.max_ver || 0) + 1;

  const result = db.prepare(`
    INSERT INTO materials (order_id, file_name, file_type, duration, version, status)
    VALUES (?, ?, ?, ?, ?, 'pending_review')
  `).run(order_id, file_name, file_type, duration || 15, nextVersion);

  const oldStatus = order.status;
  if (oldStatus === 'draft') {
    db.prepare('UPDATE orders SET status="submitted", updated_at=datetime("now","localtime") WHERE id=?').run(order_id);
    db.prepare(`
      INSERT INTO audit_logs (order_id, action, from_status, to_status, operator, notes)
      VALUES (?, 'order_status_change', ?, 'submitted', ?, '提交订单，素材待审核')
    `).run(order_id, oldStatus, order.sales_person);
  } else if (oldStatus === 'revision_needed' || oldStatus === 'material_rejected') {
    db.prepare('UPDATE orders SET status="in_review", updated_at=datetime("now","localtime") WHERE id=?').run(order_id);
    db.prepare(`
      INSERT INTO audit_logs (order_id, action, from_status, to_status, operator, notes)
      VALUES (?, 'order_status_change', ?, 'in_review', ?, '重新提交素材，进入审核')
    `).run(order_id, oldStatus, order.sales_person);
  }

  db.prepare(`
    INSERT INTO audit_logs (order_id, material_id, action, from_status, to_status, operator, notes)
    VALUES (?, ?, 'material_upload', null, 'pending_review', ?, ?)
  `).run(order_id, result.lastInsertRowid, order.sales_person, `上传素材 V${nextVersion}: ${file_name}`);

  const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(material);
});

router.get('/', (req, res) => {
  const db = getDb();
  const { status, order_id } = req.query;

  let sql = `
    SELECT m.*, o.order_no, o.client_name
    FROM materials m
    JOIN orders o ON m.order_id = o.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    sql += ' AND m.status = ?';
    params.push(status);
  }
  if (order_id) {
    sql += ' AND m.order_id = ?';
    params.push(order_id);
  }

  sql += ' ORDER BY m.upload_time DESC';
  res.json(db.prepare(sql).all(...params));
});

router.put('/:id/review', (req, res) => {
  const db = getDb();
  const { status, review_notes, reviewer } = req.body;

  const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);
  if (!material) return res.status(404).json({ error: 'Material not found' });

  db.prepare(`
    UPDATE materials SET status=?, review_notes=?, reviewer=?, review_time=datetime('now','localtime')
    WHERE id=?
  `).run(status, review_notes, reviewer, req.params.id);

  db.prepare(`
    INSERT INTO audit_logs (order_id, material_id, action, from_status, to_status, operator, notes)
    VALUES (?, ?, 'material_review', ?, ?, ?, ?)
  `).run(material.order_id, req.params.id, material.status, status, reviewer, review_notes || '');

  if (status === 'approved') {
    const activeMaterials = db.prepare(
      'SELECT id, status, version FROM materials WHERE order_id = ? AND status NOT IN ("revision_needed", "rejected")'
    ).all(material.order_id);
    const allActiveApproved = activeMaterials.length > 0 && activeMaterials.every(m => m.status === 'approved');

    if (allActiveApproved) {
      const order = db.prepare('SELECT status FROM orders WHERE id = ?').get(material.order_id);
      const prevStatus = order.status;
      if (prevStatus !== 'scheduled') {
        db.prepare('UPDATE orders SET status="scheduled", updated_at=datetime("now","localtime") WHERE id=?').run(material.order_id);
        db.prepare(`
          INSERT INTO audit_logs (order_id, action, from_status, to_status, operator, notes)
          VALUES (?, 'order_status_change', ?, 'scheduled', '系统', '所有有效素材审核通过，订单进入排期')
        `).run(material.order_id, prevStatus);
      }
    }
  }

  if (status === 'rejected') {
    const order = db.prepare('SELECT status FROM orders WHERE id = ?').get(material.order_id);
    if (order.status !== 'material_rejected') {
      db.prepare('UPDATE orders SET status="material_rejected", updated_at=datetime("now","localtime") WHERE id=?').run(material.order_id);
      db.prepare(`
        INSERT INTO audit_logs (order_id, action, from_status, to_status, operator, notes)
        VALUES (?, 'order_status_change', ?, 'material_rejected', '系统', '素材审核不通过')
      `).run(material.order_id, order.status);
    }
  }

  if (status === 'revision_needed') {
    const order = db.prepare('SELECT status FROM orders WHERE id = ?').get(material.order_id);
    if (order.status !== 'revision_needed') {
      db.prepare('UPDATE orders SET status="revision_needed", updated_at=datetime("now","localtime") WHERE id=?').run(material.order_id);
      db.prepare(`
        INSERT INTO audit_logs (order_id, action, from_status, to_status, operator, notes)
        VALUES (?, 'order_status_change', ?, 'revision_needed', '系统', '客户需要修改素材')
      `).run(material.order_id, order.status);
    }
  }

  res.json({ success: true });
});

module.exports = router;
