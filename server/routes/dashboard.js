import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

router.get('/pressure', (req, res) => {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];

  const pendingInspections = db.prepare(`
    SELECT ic.*, h.code as house_code, h.name as house_name, u.name as feeder_name
    FROM inspection_cards ic
    JOIN houses h ON ic.house_id = h.id
    JOIN users u ON ic.feeder_id = u.id
    WHERE ic.status IN ('pending', 'in_progress', 'pending_confirm')
    ORDER BY CASE ic.status WHEN 'in_progress' THEN 0 WHEN 'pending_confirm' THEN 1 ELSE 2 END, ic.date, ic.shift
  `).all();

  const stuckCards = db.prepare(`
    SELECT ic.*, h.code as house_code, h.name as house_name, u.name as feeder_name,
      CAST((julianday('now','localtime') - julianday(ic.started_at)) * 24 AS INTEGER) as hours_since_start
    FROM inspection_cards ic
    JOIN houses h ON ic.house_id = h.id
    JOIN users u ON ic.feeder_id = u.id
    WHERE ic.status = 'in_progress' AND ic.started_at IS NOT NULL
      AND (julianday('now','localtime') - julianday(ic.started_at)) * 24 > 2
    ORDER BY hours_since_start DESC
  `).all();

  const incompleteEggRecords = db.prepare(`
    SELECT er.*, h.code as house_code, h.name as house_name, u.name as sorter_name,
      ic.status as inspection_status, uf.name as feeder_name
    FROM egg_records er
    JOIN houses h ON er.house_id = h.id
    JOIN users u ON er.sorter_id = u.id
    LEFT JOIN inspection_cards ic ON er.inspection_card_id = ic.id
    LEFT JOIN users uf ON ic.feeder_id = uf.id
    WHERE er.status IN ('pending', 'abnormal')
    ORDER BY CASE er.status WHEN 'abnormal' THEN 0 ELSE 1 END, er.date, er.shift
  `).all();

  const openExceptions = db.prepare(`
    SELECT e.*, h.code as house_code, h.name as house_name, u.name as handler_name
    FROM exceptions e
    JOIN houses h ON e.house_id = h.id
    LEFT JOIN users u ON e.handler_id = u.id
    WHERE e.status IN ('open', 'assigned', 'handling')
    ORDER BY CASE e.severity WHEN 'critical' THEN 1 WHEN 'urgent' THEN 2 WHEN 'warning' THEN 3 ELSE 4 END
  `).all();

  const todayInspectionStats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'pending_confirm' THEN 1 ELSE 0 END) as pending_confirm,
      SUM(CASE WHEN status = 'abnormal' THEN 1 ELSE 0 END) as abnormal
    FROM inspection_cards WHERE date = ?
  `).get(today);

  const todayEggStats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
      SUM(CASE WHEN status = 'recorded' THEN 1 ELSE 0 END) as recorded,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'abnormal' THEN 1 ELSE 0 END) as abnormal,
      SUM(total_count) as total_eggs
    FROM egg_records WHERE date = ?
  `).get(today);

  const responsibilityMap = db.prepare(`
    SELECT
      u.id as user_id, u.name, u.role,
      COUNT(DISTINCT ic.id) as pending_inspections,
      COUNT(DISTINCT er.id) as pending_egg_records,
      COUNT(DISTINCT e.id) as open_exceptions
    FROM users u
    LEFT JOIN inspection_cards ic ON ic.feeder_id = u.id AND ic.status IN ('pending','in_progress','pending_confirm')
    LEFT JOIN egg_records er ON er.sorter_id = u.id AND er.status IN ('pending','abnormal')
    LEFT JOIN exceptions e ON e.handler_id = u.id AND e.status IN ('open','assigned','handling')
    GROUP BY u.id
    ORDER BY (pending_inspections + pending_egg_records + open_exceptions) DESC
  `).all();

  res.json({
    pendingInspections,
    stuckCards,
    incompleteEggRecords,
    openExceptions,
    todayInspectionStats,
    todayEggStats,
    responsibilityMap,
  });
});

router.get('/houses', (req, res) => {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];

  const houses = db.prepare(`
    SELECT h.*,
      (SELECT COUNT(*) FROM inspection_cards WHERE house_id = h.id AND status IN ('pending','in_progress')) as pending_inspections,
      (SELECT COUNT(*) FROM inspection_cards WHERE house_id = h.id AND status = 'pending_confirm') as pending_confirm_inspections,
      (SELECT COUNT(*) FROM egg_records WHERE house_id = h.id AND status IN ('pending','abnormal')) as pending_egg_records,
      (SELECT COUNT(*) FROM exceptions WHERE house_id = h.id AND status IN ('open','assigned','handling')) as open_exceptions,
      (SELECT status FROM inspection_cards WHERE house_id = h.id AND date = ? ORDER BY id DESC LIMIT 1) as latest_inspection_status
    FROM houses h
    WHERE h.status = 'active'
    ORDER BY h.code
  `).all(today);

  res.json({ houses });
});

export default router;
