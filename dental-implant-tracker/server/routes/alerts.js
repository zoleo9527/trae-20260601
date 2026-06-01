import express from 'express';
import { roleCheck, verifyToken } from '../auth.js';
import db, { logOperation } from '../db.js';

const router = express.Router();

router.post('/check-overdue', verifyToken, roleCheck('frontdesk', 'doctor'), (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const overdueNodes = db.prepare(`
    SELECT tn.*, p.name as patient_name
    FROM treatment_nodes tn
    JOIN patients p ON tn.patient_id = p.id
    WHERE tn.status = 'planned'
      AND tn.planned_date < ?
  `).all(today);

  let created = 0;
  for (const node of overdueNodes) {
    const existing = db.prepare(`
      SELECT id FROM alerts
      WHERE patient_id = ? AND type = 'missed_followup' AND is_read = 0
    `).get(node.patient_id);
    if (!existing) {
      db.prepare(`
        INSERT INTO alerts (patient_id, type, message)
        VALUES (?, 'missed_followup', ?)
      `).run(
        node.patient_id,
        `${node.patient_name}的${node.node_type}已逾期（计划日期：${node.planned_date}），请尽快处理`
      );
      created++;
    }
  }

  res.json({ checked: overdueNodes.length, created });
});

router.get('/', verifyToken, roleCheck('frontdesk', 'doctor'), (req, res) => {
  const { is_read, patient_id } = req.query;
  let sql = 'SELECT a.*, p.name as patient_name FROM alerts a LEFT JOIN patients p ON a.patient_id = p.id WHERE 1=1';
  const params = [];

  if (is_read !== undefined) {
    sql += ' AND a.is_read = ?';
    params.push(is_read === '1' || is_read === 'true' ? 1 : 0);
  }
  if (patient_id) {
    sql += ' AND a.patient_id = ?';
    params.push(patient_id);
  }

  sql += ' ORDER BY a.created_at DESC';
  const alerts = db.prepare(sql).all(...params);
  res.json(alerts);
});

router.put('/:id/read', verifyToken, roleCheck('frontdesk', 'doctor'), (req, res) => {
  const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);
  if (!alert) {
    return res.status(404).json({ error: '提醒不存在' });
  }

  db.prepare('UPDATE alerts SET is_read = 1 WHERE id = ?').run(req.params.id);
  const updated = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);
  logOperation(req.user, '标记提醒已读', `标记提醒已读: ${alert.message}`, alert.patient_id);
  res.json(updated);
});

router.post('/', verifyToken, roleCheck('frontdesk', 'doctor'), (req, res) => {
  const { patient_id, type, message } = req.body;
  if (!type || !message) {
    return res.status(400).json({ error: '提醒类型和消息为必填项' });
  }

  const result = db.prepare(`
    INSERT INTO alerts (patient_id, type, message)
    VALUES (?, ?, ?)
  `).run(patient_id || null, type, message);

  const alert = db.prepare(`
    SELECT a.*, p.name as patient_name
    FROM alerts a
    LEFT JOIN patients p ON a.patient_id = p.id
    WHERE a.id = ?
  `).get(result.lastInsertRowid);

  logOperation(req.user, '创建提醒', `创建提醒: ${message}`, patient_id || null);
  res.status(201).json(alert);
});

export default router;
