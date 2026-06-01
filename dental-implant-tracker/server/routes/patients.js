import express from 'express';
import { roleCheck, verifyToken } from '../auth.js';
import db, { logOperation } from '../db.js';
import { checkOverdue } from '../overdueCheck.js';

const router = express.Router();

router.get('/', verifyToken, roleCheck('frontdesk', 'doctor'), (req, res) => {
  checkOverdue();
  const { search } = req.query;
  let patients;
  if (search) {
    patients = db.prepare(`
      SELECT * FROM patients
      WHERE name LIKE ? OR phone LIKE ?
      ORDER BY created_at DESC
    `).all(`%${search}%`, `%${search}%`);
  } else {
    patients = db.prepare('SELECT * FROM patients ORDER BY created_at DESC').all();
  }

  const nodesStmt = db.prepare(`
    SELECT tn.*, u.name as doctor_name, c.name as consumable_name
    FROM treatment_nodes tn
    LEFT JOIN users u ON tn.doctor_id = u.id AND u.role = 'doctor'
    LEFT JOIN consumables c ON tn.consumable_id = c.id
    WHERE tn.patient_id = ?
    ORDER BY tn.planned_date
  `);
  const result = patients.map((p) => ({
    ...p,
    treatment_nodes: nodesStmt.all(p.id),
  }));
  res.json(result);
});

router.get('/:id', verifyToken, roleCheck('frontdesk', 'doctor'), (req, res) => {
  checkOverdue();
  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
  if (!patient) {
    return res.status(404).json({ error: '患者不存在' });
  }

  const nodes = db.prepare(`
    SELECT tn.*, u.name as doctor_name
    FROM treatment_nodes tn
    LEFT JOIN users u ON tn.doctor_id = u.id AND u.role = 'doctor'
    WHERE tn.patient_id = ?
    ORDER BY tn.planned_date
  `).all(req.params.id);

  const consumables = db.prepare(`
    SELECT * FROM consumables WHERE patient_id = ?
  `).all(req.params.id);

  res.json({ ...patient, treatment_nodes: nodes, consumables });
});

router.post('/', verifyToken, roleCheck('frontdesk', 'doctor'), (req, res) => {
  const { name, phone, gender, age, notes } = req.body;
  if (!name) {
    return res.status(400).json({ error: '患者姓名为必填项' });
  }

  const result = db.prepare(`
    INSERT INTO patients (name, phone, gender, age, notes)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, phone || null, gender || null, age || null, notes || null);

  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(result.lastInsertRowid);
  logOperation(req.user, '创建患者', `创建患者: ${name}`, patient.id);
  res.status(201).json(patient);
});

router.put('/:id', verifyToken, roleCheck('frontdesk', 'doctor'), (req, res) => {
  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
  if (!patient) {
    return res.status(404).json({ error: '患者不存在' });
  }

  const { name, phone, gender, age, notes } = req.body;
  db.prepare(`
    UPDATE patients SET name = ?, phone = ?, gender = ?, age = ?, notes = ?
    WHERE id = ?
  `).run(
    name || patient.name,
    phone !== undefined ? phone : patient.phone,
    gender !== undefined ? gender : patient.gender,
    age !== undefined ? age : patient.age,
    notes !== undefined ? notes : patient.notes,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
  logOperation(req.user, '更新患者', `更新患者信息: ${updated.name}`, req.params.id);
  res.json(updated);
});

export default router;
