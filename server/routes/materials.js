const express = require('express');
const { getDb } = require('../db');
const router = express.Router();

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
    const allMaterials = db.prepare('SELECT COUNT(*) as total, SUM(CASE WHEN status="approved" THEN 1 ELSE 0 END) as approved FROM materials WHERE order_id = ?').get(material.order_id);
    if (allMaterials.approved === allMaterials.total) {
      db.prepare('UPDATE orders SET status="scheduled", updated_at=datetime("now","localtime") WHERE id=?').run(material.order_id);
      db.prepare(`
        INSERT INTO audit_logs (order_id, action, from_status, to_status, operator, notes)
        VALUES (?, 'order_status_change', 'in_review', 'scheduled', '系统', '所有素材审核通过，订单进入排期')
      `).run(material.order_id);
    }
  }

  if (status === 'rejected' || status === 'revision_needed') {
    db.prepare('UPDATE orders SET status="material_rejected", updated_at=datetime("now","localtime") WHERE id=? AND status NOT IN ("material_rejected")').run(material.order_id);
  }

  res.json({ success: true });
});

module.exports = router;
