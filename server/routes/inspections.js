import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { date, house_id, status, shift, feeder_id } = req.query;

  let sql = `
    SELECT ic.*,
      h.code as house_code, h.name as house_name, h.current_count,
      u.name as feeder_name, u.role as feeder_role
    FROM inspection_cards ic
    JOIN houses h ON ic.house_id = h.id
    JOIN users u ON ic.feeder_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (date) { sql += ' AND ic.date = ?'; params.push(date); }
  if (house_id) { sql += ' AND ic.house_id = ?'; params.push(house_id); }
  if (status) { sql += ' AND ic.status = ?'; params.push(status); }
  if (shift) { sql += ' AND ic.shift = ?'; params.push(shift); }
  if (feeder_id) { sql += ' AND ic.feeder_id = ?'; params.push(feeder_id); }

  sql += ' ORDER BY CASE ic.status WHEN \'pending\' THEN 1 WHEN \'in_progress\' THEN 2 WHEN \'pending_confirm\' THEN 3 WHEN \'abnormal\' THEN 4 WHEN \'completed\' THEN 5 END, ic.date DESC, ic.shift, h.code';

  const rows = db.prepare(sql).all(...params);
  res.json({ inspections: rows });
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const card = db.prepare(`
    SELECT ic.*,
      h.code as house_code, h.name as house_name, h.current_count, h.breed, h.age_weeks,
      u.name as feeder_name, u.role as feeder_role, u.phone as feeder_phone
    FROM inspection_cards ic
    JOIN houses h ON ic.house_id = h.id
    JOIN users u ON ic.feeder_id = u.id
    WHERE ic.id = ?
  `).get(req.params.id);

  if (!card) return res.status(404).json({ error: '巡检卡不存在' });

  const eggRecords = db.prepare(`
    SELECT er.*, u.name as sorter_name
    FROM egg_records er
    JOIN users u ON er.sorter_id = u.id
    WHERE er.inspection_card_id = ?
  `).all(req.params.id);

  const exceptions = db.prepare(`
    SELECT e.*, u.name as handler_name
    FROM exceptions e
    LEFT JOIN users u ON e.handler_id = u.id
    WHERE e.source_type = 'inspection' AND (e.source_id = ? OR (e.source_id IS NULL AND e.house_id = ?))
  `).all(req.params.id, card.house_id);

  const attachments = db.prepare(`
    SELECT a.*, u.name as uploader_name
    FROM attachments a
    JOIN users u ON a.uploaded_by = u.id
    WHERE a.target_type = 'inspection' AND a.target_id = ?
  `).all(req.params.id);

  res.json({ card, eggRecords, exceptions, attachments });
});

router.post('/', (req, res) => {
  const db = getDb();
  const { house_id, date, shift, feeder_id } = req.body;

  const existing = db.prepare(
    'SELECT id FROM inspection_cards WHERE house_id = ? AND date = ? AND shift = ?'
  ).get(house_id, date, shift);
  if (existing) return res.status(409).json({ error: '该鸡舍当班巡检卡已存在' });

  const r = db.prepare(`
    INSERT INTO inspection_cards (house_id, date, shift, feeder_id, status)
    VALUES (?, ?, ?, ?, 'pending')
  `).run(house_id, date, shift, feeder_id);

  res.json({ id: r.lastInsertRowid });
});

router.put('/:id/start', (req, res) => {
  const db = getDb();
  const card = db.prepare('SELECT status FROM inspection_cards WHERE id = ?').get(req.params.id);
  if (!card) return res.status(404).json({ error: '巡检卡不存在' });
  if (card.status !== 'pending') return res.status(400).json({ error: '只能从待巡检状态开始' });

  db.prepare(`
    UPDATE inspection_cards SET status = 'in_progress', started_at = datetime('now','localtime'), updated_at = datetime('now','localtime')
    WHERE id = ?
  `).run(req.params.id);

  res.json({ ok: true });
});

router.put('/:id/complete', (req, res) => {
  const db = getDb();
  const card = db.prepare('SELECT status FROM inspection_cards WHERE id = ?').get(req.params.id);
  if (!card) return res.status(404).json({ error: '巡检卡不存在' });
  if (card.status !== 'in_progress') return res.status(400).json({ error: '只能从巡检中状态提交' });

  const {
    temperature, humidity, ventilation, water_system, feed_system, manure_system,
    dead_count, sick_count, notes, is_abnormal
  } = req.body;

  const status = is_abnormal ? 'abnormal' : 'pending_confirm';

  db.prepare(`
    UPDATE inspection_cards SET
      status = ?, temperature = ?, humidity = ?, ventilation = ?, water_system = ?,
      feed_system = ?, manure_system = ?, dead_count = ?, sick_count = ?, notes = ?,
      completed_at = datetime('now','localtime'), updated_at = datetime('now','localtime')
    WHERE id = ?
  `).run(status, temperature, humidity, ventilation, water_system, feed_system, manure_system,
    dead_count || 0, sick_count || 0, notes, req.params.id);

  if (is_abnormal) {
    const cardInfo = db.prepare(`
      SELECT ic.house_id, h.code, h.name FROM inspection_cards ic JOIN houses h ON ic.house_id = h.id WHERE ic.id = ?
    `).get(req.params.id);

    const abnormalItems = [];
    if (ventilation && ventilation !== 'normal') abnormalItems.push(`通风${ventilation}`);
    if (water_system && water_system !== 'normal') abnormalItems.push(`饮水${water_system}`);
    if (feed_system && feed_system !== 'normal') abnormalItems.push(`饲喂${feed_system}`);
    if (manure_system && manure_system !== 'normal') abnormalItems.push(`清粪${manure_system}`);
    if (dead_count > 2) abnormalItems.push(`死亡${dead_count}只`);
    if (sick_count > 3) abnormalItems.push(`病鸡${sick_count}只`);

    const severity = dead_count > 2 || sick_count > 5 ? 'urgent' : 'warning';

    db.prepare(`
      INSERT INTO exceptions (source_type, source_id, house_id, severity, category, description, handler_role, status)
      VALUES ('inspection', ?, ?, ?, '巡检异常', ?, 'manager', 'open')
    `).run(
      req.params.id, cardInfo.house_id, severity,
      `${cardInfo.name}巡检异常：${abnormalItems.join('、')}${notes ? '。' + notes : ''}`
    );

    const excId = db.prepare('SELECT last_insert_rowid() as id').get().id;
    db.prepare(`
      INSERT INTO exception_timeline (exception_id, action, content, operator_id, operator_name)
      VALUES (?, 'created', ?, ?, '系统')
    `).run(excId, `${cardInfo.name}巡检异常自动上报：${abnormalItems.join('、')}`, req.body.feeder_id || null);
  }

  res.json({ ok: true, status });
});

router.put('/:id/confirm', (req, res) => {
  const db = getDb();
  const card = db.prepare('SELECT status FROM inspection_cards WHERE id = ?').get(req.params.id);
  if (!card) return res.status(404).json({ error: '巡检卡不存在' });
  if (card.status !== 'pending_confirm') return res.status(400).json({ error: '只能确认待确认状态的巡检卡' });

  const { confirmer_id } = req.body;

  db.prepare(`
    UPDATE inspection_cards SET status = 'completed', confirmed_at = datetime('now','localtime'), confirmer_id = ?, updated_at = datetime('now','localtime')
    WHERE id = ?
  `).run(confirmer_id || null, req.params.id);

  res.json({ ok: true });
});

export default router;
