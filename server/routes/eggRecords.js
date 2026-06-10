import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { date, house_id, status, shift, sorter_id } = req.query;

  let sql = `
    SELECT er.*,
      h.code as house_code, h.name as house_name, h.current_count,
      u.name as sorter_name,
      ic.status as inspection_status, ic.feeder_id,
      uf.name as feeder_name
    FROM egg_records er
    JOIN houses h ON er.house_id = h.id
    JOIN users u ON er.sorter_id = u.id
    LEFT JOIN inspection_cards ic ON er.inspection_card_id = ic.id
    LEFT JOIN users uf ON ic.feeder_id = uf.id
    WHERE 1=1
  `;
  const params = [];

  if (date) { sql += ' AND er.date = ?'; params.push(date); }
  if (house_id) { sql += ' AND er.house_id = ?'; params.push(house_id); }
  if (status) { sql += ' AND er.status = ?'; params.push(status); }
  if (shift) { sql += ' AND er.shift = ?'; params.push(shift); }
  if (sorter_id) { sql += ' AND er.sorter_id = ?'; params.push(sorter_id); }

  sql += ' ORDER BY er.date DESC, er.shift, h.code';

  const rows = db.prepare(sql).all(...params);
  res.json({ records: rows });
});

router.get('/history', (req, res) => {
  const db = getDb();
  const { house_id, start_date, end_date } = req.query;

  if (!house_id) return res.status(400).json({ error: '请指定鸡舍' });

  let sql = `
    SELECT er.date, er.shift,
      er.total_count, er.grade_a, er.grade_b, er.grade_c,
      er.cracked, er.dirty, er.soft_shell, er.status,
      u.name as sorter_name,
      ic.status as inspection_status, ic.temperature, ic.humidity, ic.dead_count, ic.sick_count,
      uf.name as feeder_name
    FROM egg_records er
    JOIN users u ON er.sorter_id = u.id
    LEFT JOIN inspection_cards ic ON er.inspection_card_id = ic.id
    LEFT JOIN users uf ON ic.feeder_id = uf.id
    WHERE er.house_id = ?
  `;
  const params = [house_id];

  if (start_date) { sql += ' AND er.date >= ?'; params.push(start_date); }
  if (end_date) { sql += ' AND er.date <= ?'; params.push(end_date); }

  sql += ' ORDER BY er.date ASC, er.shift';

  const rows = db.prepare(sql).all(...params);

  const house = db.prepare('SELECT * FROM houses WHERE id = ?').get(house_id);
  res.json({ house, records: rows });
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const record = db.prepare(`
    SELECT er.*,
      h.code as house_code, h.name as house_name, h.current_count, h.breed, h.age_weeks,
      u.name as sorter_name, u.phone as sorter_phone,
      ic.id as inspection_card_id, ic.status as inspection_status, ic.temperature, ic.humidity,
      ic.ventilation, ic.water_system, ic.feed_system, ic.manure_system,
      ic.dead_count as insp_dead_count, ic.sick_count as insp_sick_count,
      ic.feeder_id, uf.name as feeder_name
    FROM egg_records er
    JOIN houses h ON er.house_id = h.id
    JOIN users u ON er.sorter_id = u.id
    LEFT JOIN inspection_cards ic ON er.inspection_card_id = ic.id
    LEFT JOIN users uf ON ic.feeder_id = uf.id
    WHERE er.id = ?
  `).get(req.params.id);

  if (!record) return res.status(404).json({ error: '产蛋记录不存在' });

  const exceptions = db.prepare(`
    SELECT e.*, u.name as handler_name
    FROM exceptions e
    LEFT JOIN users u ON e.handler_id = u.id
    WHERE e.source_type = 'egg_record' AND e.source_id = ?
  `).all(req.params.id);

  const attachments = db.prepare(`
    SELECT a.*, u.name as uploader_name
    FROM attachments a
    JOIN users u ON a.uploaded_by = u.id
    WHERE a.target_type = 'egg_record' AND a.target_id = ?
  `).all(req.params.id);

  res.json({ record, exceptions, attachments });
});

router.post('/', (req, res) => {
  const db = getDb();
  const { house_id, date, shift, inspection_card_id, sorter_id, total_count, grade_a, grade_b, grade_c, cracked, dirty, soft_shell, notes } = req.body;

  const existing = db.prepare(
    'SELECT id FROM egg_records WHERE house_id = ? AND date = ? AND shift = ?'
  ).get(house_id, date, shift);
  if (existing) return res.status(409).json({ error: '该鸡舍当班产蛋记录已存在' });

  const r = db.prepare(`
    INSERT INTO egg_records (house_id, date, shift, inspection_card_id, sorter_id, total_count, grade_a, grade_b, grade_c, cracked, dirty, soft_shell, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'recorded', ?)
  `).run(house_id, date, shift, inspection_card_id || null, sorter_id,
    total_count || 0, grade_a || 0, grade_b || 0, grade_c || 0,
    cracked || 0, dirty || 0, soft_shell || 0, notes);

  res.json({ id: r.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const record = db.prepare('SELECT * FROM egg_records WHERE id = ?').get(req.params.id);
  if (!record) return res.status(404).json({ error: '产蛋记录不存在' });

  const {
    inspection_card_id, total_count, grade_a, grade_b, grade_c,
    cracked, dirty, soft_shell, notes, status
  } = req.body;

  const nextStatus = status || (record.status === 'pending' ? 'recorded' : record.status);

  db.prepare(`
    UPDATE egg_records SET
      inspection_card_id = ?, total_count = ?, grade_a = ?, grade_b = ?, grade_c = ?,
      cracked = ?, dirty = ?, soft_shell = ?, notes = ?, status = ?,
      updated_at = datetime('now','localtime')
    WHERE id = ?
  `).run(
    inspection_card_id || record.inspection_card_id,
    total_count ?? record.total_count,
    grade_a ?? record.grade_a,
    grade_b ?? record.grade_b,
    grade_c ?? record.grade_c,
    cracked ?? record.cracked,
    dirty ?? record.dirty,
    soft_shell ?? record.soft_shell,
    notes ?? record.notes,
    nextStatus,
    req.params.id
  );

  res.json({ ok: true });
});

router.put('/:id/confirm', (req, res) => {
  const db = getDb();
  const record = db.prepare('SELECT status, house_id, total_count, grade_a, grade_b, grade_c, cracked, dirty, soft_shell FROM egg_records WHERE id = ?').get(req.params.id);
  if (!record) return res.status(404).json({ error: '产蛋记录不存在' });

  db.prepare(`
    UPDATE egg_records SET status = 'confirmed', updated_at = datetime('now','localtime') WHERE id = ?
  `).run(req.params.id);

  res.json({ ok: true });
});

router.put('/:id/mark-abnormal', (req, res) => {
  const db = getDb();
  const { reason } = req.body;
  const record = db.prepare('SELECT * FROM egg_records WHERE id = ?').get(req.params.id);
  if (!record) return res.status(404).json({ error: '产蛋记录不存在' });

  db.prepare(`
    UPDATE egg_records SET status = 'abnormal', notes = ?, updated_at = datetime('now','localtime') WHERE id = ?
  `).run(reason || '标记为异常', req.params.id);

  const house = db.prepare('SELECT * FROM houses WHERE id = ?').get(record.house_id);

  db.prepare(`
    INSERT INTO exceptions (source_type, source_id, house_id, severity, category, description, handler_role, status)
    VALUES ('egg_record', ?, ?, 'warning', '产蛋异常', ?, 'manager', 'open')
  `).run(req.params.id, record.house_id, `${house.name}产蛋异常：${reason || '分拣员标记异常'}`);

  res.json({ ok: true });
});

export default router;
