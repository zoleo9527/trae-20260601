import express from 'express';
import { roleCheck, verifyToken } from '../auth.js';
import db, { logOperation } from '../db.js';

const router = express.Router();

router.get('/', verifyToken, (req, res) => {
  const { category, status, search } = req.query;
  let sql = 'SELECT * FROM consumables WHERE 1=1';
  const params = [];

  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (search) {
    sql += ' AND (name LIKE ? OR model LIKE ? OR batch_no LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  sql += ' ORDER BY created_at DESC';
  const consumables = db.prepare(sql).all(...params);
  res.json(consumables);
});

router.get('/:id', verifyToken, (req, res) => {
  const consumable = db.prepare(`
    SELECT c.*, p.name as patient_name
    FROM consumables c
    LEFT JOIN patients p ON c.patient_id = p.id
    WHERE c.id = ?
  `).get(req.params.id);
  if (!consumable) {
    return res.status(404).json({ error: '耗材不存在' });
  }
  res.json(consumable);
});

router.post('/', verifyToken, roleCheck('warehouse'), (req, res) => {
  const { name, model, batch_no, category, stock_qty, unit, status, location } = req.body;
  if (!name || !category) {
    return res.status(400).json({ error: '耗材名称和类别为必填项' });
  }

  const result = db.prepare(`
    INSERT INTO consumables (name, model, batch_no, category, stock_qty, unit, status, location)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name, model || null, batch_no || null, category,
    stock_qty || 0, unit || '个', status || 'available', location || null
  );

  const consumable = db.prepare('SELECT * FROM consumables WHERE id = ?').get(result.lastInsertRowid);
  logOperation(req.user, '添加耗材', `添加耗材: ${name}`, null);
  res.status(201).json(consumable);
});

router.put('/:id', verifyToken, roleCheck('warehouse'), (req, res) => {
  const existing = db.prepare('SELECT * FROM consumables WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: '耗材不存在' });
  }

  const { name, model, batch_no, category, stock_qty, unit, status, location } = req.body;
  db.prepare(`
    UPDATE consumables SET
      name = ?, model = ?, batch_no = ?, category = ?,
      stock_qty = ?, unit = ?, status = ?, location = ?
    WHERE id = ?
  `).run(
    name || existing.name,
    model !== undefined ? model : existing.model,
    batch_no !== undefined ? batch_no : existing.batch_no,
    category || existing.category,
    stock_qty !== undefined ? stock_qty : existing.stock_qty,
    unit || existing.unit,
    status || existing.status,
    location !== undefined ? location : existing.location,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM consumables WHERE id = ?').get(req.params.id);
  logOperation(req.user, '更新耗材', `更新耗材: ${updated.name}`, null);
  res.json(updated);
});

router.post('/:id/lock', verifyToken, roleCheck('frontdesk', 'doctor'), (req, res) => {
  const consumable = db.prepare('SELECT * FROM consumables WHERE id = ?').get(req.params.id);
  if (!consumable) {
    return res.status(404).json({ error: '耗材不存在' });
  }

  const { patient_id } = req.body;
  if (!patient_id) {
    return res.status(400).json({ error: '请指定患者' });
  }

  if (consumable.stock_qty - consumable.locked_qty - consumable.used_qty <= 0) {
    return res.status(400).json({ error: '库存不足，无法锁定' });
  }

  db.prepare(`
    UPDATE consumables SET
      locked_qty = locked_qty + 1,
      patient_id = ?,
      status = 'locked'
    WHERE id = ?
  `).run(patient_id, req.params.id);

  const updated = db.prepare('SELECT * FROM consumables WHERE id = ?').get(req.params.id);
  logOperation(req.user, '锁定耗材', `锁定耗材: ${consumable.name}给患者ID:${patient_id}`, patient_id);
  res.json(updated);
});

router.post('/:id/unlock', verifyToken, roleCheck('frontdesk', 'doctor'), (req, res) => {
  const consumable = db.prepare('SELECT * FROM consumables WHERE id = ?').get(req.params.id);
  if (!consumable) {
    return res.status(404).json({ error: '耗材不存在' });
  }

  if (consumable.locked_qty <= 0) {
    return res.status(400).json({ error: '该耗材未被锁定' });
  }

  const newLockedQty = consumable.locked_qty - 1;
  const newStatus = newLockedQty === 0 ? 'available' : 'locked';
  const newPatientId = newLockedQty === 0 ? null : consumable.patient_id;

  db.prepare(`
    UPDATE consumables SET
      locked_qty = ?,
      patient_id = ?,
      status = ?
    WHERE id = ?
  `).run(newLockedQty, newPatientId, newStatus, req.params.id);

  const updated = db.prepare('SELECT * FROM consumables WHERE id = ?').get(req.params.id);
  logOperation(req.user, '解锁耗材', `解锁耗材: ${consumable.name}`, consumable.patient_id);
  res.json(updated);
});

router.post('/:id/use', verifyToken, roleCheck('doctor'), (req, res) => {
  const consumable = db.prepare('SELECT * FROM consumables WHERE id = ?').get(req.params.id);
  if (!consumable) {
    return res.status(404).json({ error: '耗材不存在' });
  }

  if (consumable.locked_qty <= 0) {
    return res.status(400).json({ error: '该耗材未被锁定，无法使用' });
  }

  const { patient_id } = req.body;

  db.prepare(`
    UPDATE consumables SET
      used_qty = used_qty + 1,
      locked_qty = locked_qty - 1,
      status = 'used'
    WHERE id = ?
  `).run(req.params.id);

  const newLockedQty = consumable.locked_qty - 1;
  if (newLockedQty === 0) {
    db.prepare('UPDATE consumables SET patient_id = NULL WHERE id = ?').run(req.params.id);
  }

  const updated = db.prepare('SELECT * FROM consumables WHERE id = ?').get(req.params.id);
  logOperation(req.user, '使用耗材', `使用耗材: ${consumable.name}`, patient_id || consumable.patient_id);
  res.json(updated);
});

export default router;
