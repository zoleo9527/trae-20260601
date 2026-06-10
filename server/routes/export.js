import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

router.get('/inspections', (req, res) => {
  const db = getDb();
  const { date, house_id, start_date, end_date } = req.query;

  let sql = `
    SELECT ic.date, ic.shift, ic.status,
      h.code as house_code, h.name as house_name,
      u.name as feeder_name,
      ic.temperature, ic.humidity, ic.ventilation, ic.water_system, ic.feed_system, ic.manure_system,
      ic.dead_count, ic.sick_count, ic.notes,
      ic.started_at, ic.completed_at
    FROM inspection_cards ic
    JOIN houses h ON ic.house_id = h.id
    JOIN users u ON ic.feeder_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (date) { sql += ' AND ic.date = ?'; params.push(date); }
  if (house_id) { sql += ' AND ic.house_id = ?'; params.push(house_id); }
  if (start_date) { sql += ' AND ic.date >= ?'; params.push(start_date); }
  if (end_date) { sql += ' AND ic.date <= ?'; params.push(end_date); }

  sql += ' ORDER BY ic.date DESC, ic.shift, h.code';

  const rows = db.prepare(sql).all(...params);

  const headers = ['日期', '班次', '鸡舍', '饲养员', '状态', '温度', '湿度', '通风', '饮水', '饲喂', '清粪', '死亡', '病鸡', '备注', '开始时间', '完成时间'];
  const shiftMap = { morning: '早班', afternoon: '午班', night: '夜班' };
  const statusMap = { pending: '待巡检', in_progress: '巡检中', pending_confirm: '待确认', completed: '已完成', abnormal: '异常' };
  const normalMap = { normal: '正常', poor: '差', off: '停', leak: '漏水', blocked: '堵塞', jam: '卡料', low: '不足', clogged: '堵塞', overflow: '溢出' };

  const csvRows = [headers.join(',')];
  for (const r of rows) {
    csvRows.push([
      r.date,
      shiftMap[r.shift] || r.shift,
      `"${r.house_name}"`,
      r.feeder_name,
      statusMap[r.status] || r.status,
      r.temperature ?? '',
      r.humidity ?? '',
      normalMap[r.ventilation] || r.ventilation || '',
      normalMap[r.water_system] || r.water_system || '',
      normalMap[r.feed_system] || r.feed_system || '',
      normalMap[r.manure_system] || r.manure_system || '',
      r.dead_count ?? 0,
      r.sick_count ?? 0,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
      r.started_at || '',
      r.completed_at || '',
    ].join(','));
  }

  const bom = '\uFEFF';
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=inspections_export.csv');
  res.send(bom + csvRows.join('\n'));
});

router.get('/egg-records', (req, res) => {
  const db = getDb();
  const { date, house_id, start_date, end_date } = req.query;

  let sql = `
    SELECT er.date, er.shift, er.status,
      h.code as house_code, h.name as house_name,
      u.name as sorter_name,
      er.total_count, er.grade_a, er.grade_b, er.grade_c,
      er.cracked, er.dirty, er.soft_shell, er.notes
    FROM egg_records er
    JOIN houses h ON er.house_id = h.id
    JOIN users u ON er.sorter_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (date) { sql += ' AND er.date = ?'; params.push(date); }
  if (house_id) { sql += ' AND er.house_id = ?'; params.push(house_id); }
  if (start_date) { sql += ' AND er.date >= ?'; params.push(start_date); }
  if (end_date) { sql += ' AND er.date <= ?'; params.push(end_date); }

  sql += ' ORDER BY er.date DESC, er.shift, h.code';

  const rows = db.prepare(sql).all(...params);

  const headers = ['日期', '班次', '鸡舍', '分拣员', '状态', '总数', 'A级', 'B级', 'C级', '破损', '脏蛋', '软壳', '备注'];
  const shiftMap = { morning: '早班', afternoon: '午班', night: '夜班' };
  const statusMap = { pending: '待录入', recorded: '已录入', confirmed: '已确认', abnormal: '异常' };

  const csvRows = [headers.join(',')];
  for (const r of rows) {
    csvRows.push([
      r.date,
      shiftMap[r.shift] || r.shift,
      `"${r.house_name}"`,
      r.sorter_name,
      statusMap[r.status] || r.status,
      r.total_count,
      r.grade_a,
      r.grade_b,
      r.grade_c,
      r.cracked,
      r.dirty,
      r.soft_shell,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ].join(','));
  }

  const bom = '\uFEFF';
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=egg_records_export.csv');
  res.send(bom + csvRows.join('\n'));
});

export default router;
