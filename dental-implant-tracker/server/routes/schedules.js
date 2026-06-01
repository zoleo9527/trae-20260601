import express from 'express';
import { roleCheck, verifyToken } from '../auth.js';
import db, { logOperation } from '../db.js';

const router = express.Router();

router.get('/patient/:patientId', verifyToken, (req, res) => {
  const nodes = db.prepare(`
    SELECT tn.*, u.name as doctor_name, c.name as consumable_name
    FROM treatment_nodes tn
    LEFT JOIN users u ON tn.doctor_id = u.id
    LEFT JOIN consumables c ON tn.consumable_id = c.id
    WHERE tn.patient_id = ?
    ORDER BY tn.planned_date
  `).all(req.params.patientId);
  res.json(nodes);
});

router.get('/daily', verifyToken, (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ error: '请提供日期参数' });
  }

  const nodes = db.prepare(`
    SELECT tn.*, p.name as patient_name, u.name as doctor_name
    FROM treatment_nodes tn
    JOIN patients p ON tn.patient_id = p.id
    LEFT JOIN users u ON tn.doctor_id = u.id
    WHERE tn.planned_date = ?
    ORDER BY tn.node_type
  `).all(date);
  res.json(nodes);
});

router.post('/', verifyToken, roleCheck('frontdesk', 'doctor'), (req, res) => {
  const { patient_id, node_type, planned_date, doctor_id, consumable_id, notes } = req.body;
  if (!patient_id || !node_type || !planned_date) {
    return res.status(400).json({ error: '患者ID、节点类型和计划日期为必填项' });
  }

  const result = db.prepare(`
    INSERT INTO treatment_nodes (patient_id, node_type, planned_date, doctor_id, consumable_id, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(patient_id, node_type, planned_date, doctor_id || null, consumable_id || null, notes || null);

  const node = db.prepare(`
    SELECT tn.*, u.name as doctor_name
    FROM treatment_nodes tn
    LEFT JOIN users u ON tn.doctor_id = u.id
    WHERE tn.id = ?
  `).get(result.lastInsertRowid);

  logOperation(req.user, '创建治疗节点', `创建${node_type}节点, 计划日期: ${planned_date}`, patient_id);
  res.status(201).json(node);
});

router.put('/:id', verifyToken, (req, res) => {
  const existing = db.prepare('SELECT * FROM treatment_nodes WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: '治疗节点不存在' });
  }

  const { planned_date, actual_date, status, notes, doctor_id, consumable_id, node_type } = req.body;
  db.prepare(`
    UPDATE treatment_nodes SET
      planned_date = ?, actual_date = ?, status = ?, notes = ?,
      doctor_id = ?, consumable_id = ?, node_type = ?
    WHERE id = ?
  `).run(
    planned_date || existing.planned_date,
    actual_date !== undefined ? actual_date : existing.actual_date,
    status || existing.status,
    notes !== undefined ? notes : existing.notes,
    doctor_id !== undefined ? doctor_id : existing.doctor_id,
    consumable_id !== undefined ? consumable_id : existing.consumable_id,
    node_type || existing.node_type,
    req.params.id
  );

  const updated = db.prepare(`
    SELECT tn.*, u.name as doctor_name
    FROM treatment_nodes tn
    LEFT JOIN users u ON tn.doctor_id = u.id
    WHERE tn.id = ?
  `).get(req.params.id);

  logOperation(req.user, '更新治疗节点', `更新${existing.node_type}节点`, existing.patient_id);
  res.json(updated);
});

router.delete('/:id', verifyToken, roleCheck('frontdesk'), (req, res) => {
  const existing = db.prepare('SELECT * FROM treatment_nodes WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: '治疗节点不存在' });
  }

  db.prepare('DELETE FROM treatment_nodes WHERE id = ?').run(req.params.id);
  logOperation(req.user, '删除治疗节点', `删除${existing.node_type}节点`, existing.patient_id);
  res.json({ message: '已删除' });
});

router.post('/:id/complete', verifyToken, roleCheck('doctor'), (req, res) => {
  const existing = db.prepare('SELECT * FROM treatment_nodes WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: '治疗节点不存在' });
  }

  const { notes } = req.body;
  const today = new Date().toISOString().slice(0, 10);

  db.prepare(`
    UPDATE treatment_nodes SET status = 'completed', actual_date = ?, notes = ?
    WHERE id = ?
  `).run(today, notes || existing.notes, req.params.id);

  const updated = db.prepare(`
    SELECT tn.*, u.name as doctor_name
    FROM treatment_nodes tn
    LEFT JOIN users u ON tn.doctor_id = u.id
    WHERE tn.id = ?
  `).get(req.params.id);

  logOperation(req.user, '完成治疗节点', `完成${existing.node_type}节点`, existing.patient_id);
  res.json(updated);
});

router.post('/:id/reschedule', verifyToken, roleCheck('frontdesk', 'doctor'), (req, res) => {
  const existing = db.prepare('SELECT * FROM treatment_nodes WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: '治疗节点不存在' });
  }

  const { new_date, reason } = req.body;
  if (!new_date) {
    return res.status(400).json({ error: '请提供新的计划日期' });
  }

  const oldDate = existing.planned_date;
  db.prepare(`
    UPDATE treatment_nodes SET status = 'rescheduled', notes = ?
    WHERE id = ?
  `).run(reason ? `${existing.notes || ''}\n改期原因: ${reason}` : existing.notes, req.params.id);

  const result = db.prepare(`
    INSERT INTO treatment_nodes (patient_id, node_type, planned_date, doctor_id, consumable_id, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, 'planned')
  `).run(
    existing.patient_id,
    existing.node_type,
    new_date,
    existing.doctor_id,
    existing.consumable_id,
    `从${oldDate}改期至${new_date}${reason ? `，原因: ${reason}` : ''}`
  );

  const patient = db.prepare('SELECT name FROM patients WHERE id = ?').get(existing.patient_id);

  db.prepare(`
    INSERT INTO alerts (patient_id, type, message)
    VALUES (?, 'reschedule', ?)
  `).run(
    existing.patient_id,
    `${patient.name}的${existing.node_type}从${oldDate}改期至${new_date}${reason ? `，原因: ${reason}` : ''}`
  );

  const newNode = db.prepare(`
    SELECT tn.*, u.name as doctor_name
    FROM treatment_nodes tn
    LEFT JOIN users u ON tn.doctor_id = u.id
    WHERE tn.id = ?
  `).get(result.lastInsertRowid);

  logOperation(req.user, '改期治疗节点', `${existing.node_type}从${oldDate}改期至${new_date}`, existing.patient_id);
  res.json({ old_node: existing, new_node: newNode });
});

export default router;
