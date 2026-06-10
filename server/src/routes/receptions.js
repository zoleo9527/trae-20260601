const express = require('express');
const db = require('../db');
const { generateNo, logAudit, getPagination, paginateResult } = require('../utils');

const router = express.Router();

router.get('/', (req, res) => {
  const { status, date_from, date_to, keyword, page, pageSize } = req.query;
  const { offset, limit, page: p, pageSize: ps } = getPagination(page, pageSize);

  let whereSql = 'WHERE 1=1';
  const params = [];

  if (status) {
    whereSql += ' AND r.status = ?';
    params.push(status);
  }
  if (date_from) {
    whereSql += ' AND r.scheduled_date >= ?';
    params.push(date_from);
  }
  if (date_to) {
    whereSql += ' AND r.scheduled_date <= ?';
    params.push(date_to);
  }
  if (keyword) {
    whereSql += ' AND (r.group_name LIKE ? OR r.contact_person LIKE ? OR r.reception_no LIKE ?)';
    const kw = `%${keyword}%`;
    params.push(kw, kw, kw);
  }

  const countSql = `SELECT COUNT(*) as total FROM receptions r ${whereSql}`;
  const total = db.prepare(countSql).get(...params).total;

  const listSql = `
    SELECT r.*, u.name as created_by_name
    FROM receptions r
    LEFT JOIN users u ON r.created_by = u.id
    ${whereSql}
    ORDER BY r.id DESC
    LIMIT ? OFFSET ?
  `;
  const list = db.prepare(listSql).all(...params, limit, offset);

  res.json(paginateResult(total, list, p, ps));
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const reception = db.prepare(`
    SELECT r.*, u.name as created_by_name
    FROM receptions r
    LEFT JOIN users u ON r.created_by = u.id
    WHERE r.id = ?
  `).get(id);

  if (!reception) {
    return res.status(404).json({ error: '接待单不存在' });
  }

  const guideTasks = db.prepare(`
    SELECT gt.*, u.name as guide_name, ua.name as assigned_by_name
    FROM guide_tasks gt
    LEFT JOIN users u ON gt.guide_id = u.id
    LEFT JOIN users ua ON gt.assigned_by = ua.id
    WHERE gt.reception_id = ?
    ORDER BY gt.id DESC
  `).all(id);

  const attachments = db.prepare(`
    SELECT * FROM attachments WHERE biz_type = 'reception' AND biz_id = ? ORDER BY id DESC
  `).all(id);

  const auditLogs = db.prepare(`
    SELECT * FROM audit_logs WHERE biz_type = 'reception' AND biz_id = ? ORDER BY id DESC
  `).all(id);

  guideTasks.forEach(task => {
    if (task.fruit_details) {
      try {
        task.fruit_details_parsed = JSON.parse(task.fruit_details);
      } catch (e) {
        task.fruit_details_parsed = null;
      }
    }
  });

  res.json({
    ...reception,
    guideTasks,
    attachments,
    auditLogs
  });
});

router.get('/export', (req, res) => {
  const { status, date_from, date_to, keyword } = req.query;

  let whereSql = 'WHERE 1=1';
  const params = [];

  if (status) {
    whereSql += ' AND r.status = ?';
    params.push(status);
  }
  if (date_from) {
    whereSql += ' AND r.scheduled_date >= ?';
    params.push(date_from);
  }
  if (date_to) {
    whereSql += ' AND r.scheduled_date <= ?';
    params.push(date_to);
  }
  if (keyword) {
    whereSql += ' AND (r.group_name LIKE ? OR r.contact_person LIKE ? OR r.reception_no LIKE ?)';
    const kw = `%${keyword}%`;
    params.push(kw, kw, kw);
  }

  const list = db.prepare(`
    SELECT r.reception_no, r.group_name, r.contact_person, r.contact_phone,
           r.people_count, r.scheduled_date, r.scheduled_time, r.source,
           r.status, r.remark, u.name as created_by_name, r.created_at
    FROM receptions r
    LEFT JOIN users u ON r.created_by = u.id
    ${whereSql}
    ORDER BY r.id DESC
  `).all(...params);

  const statusMap = {
    pending: '待分配',
    assigned: '已分配',
    picking: '采摘中',
    completed: '已完成',
    cancelled: '已取消'
  };

  let csv = '\uFEFF单号,团体名称,联系人,联系电话,人数,预约日期,预约时间,来源,状态,备注,创建人,创建时间\n';
  list.forEach(item => {
    const row = [
      item.reception_no,
      item.group_name,
      item.contact_person || '',
      item.contact_phone || '',
      item.people_count,
      item.scheduled_date,
      item.scheduled_time || '',
      item.source || '',
      statusMap[item.status] || item.status,
      (item.remark || '').replace(/,/g, '，'),
      item.created_by_name || '',
      item.created_at
    ];
    csv += row.join(',') + '\n';
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="receptions_${Date.now()}.csv"`);
  res.send(csv);
});

router.post('/', (req, res) => {
  const {
    group_name, contact_person, contact_phone, people_count,
    scheduled_date, scheduled_time, source, remark
  } = req.body;

  if (!group_name || !scheduled_date) {
    return res.status(400).json({ error: '团体名称和预约日期为必填项' });
  }

  const receptionNo = generateNo('JD');
  const stmt = db.prepare(`
    INSERT INTO receptions (
      reception_no, group_name, contact_person, contact_phone,
      people_count, scheduled_date, scheduled_time, source,
      status, remark, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
  `);

  const result = stmt.run(
    receptionNo, group_name, contact_person || '', contact_phone || '',
    people_count || 0, scheduled_date, scheduled_time || '', source || '',
    remark || '', req.currentUser.id
  );

  const id = result.lastInsertRowid;
  logAudit('reception', id, '创建', req.currentUser, `创建接待单 ${receptionNo}`);

  const newReception = db.prepare('SELECT * FROM receptions WHERE id = ?').get(id);
  res.status(201).json(newReception);
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
    group_name, contact_person, contact_phone, people_count,
    scheduled_date, scheduled_time, source, remark, status
  } = req.body;

  const existing = db.prepare('SELECT * FROM receptions WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: '接待单不存在' });
  }

  const stmt = db.prepare(`
    UPDATE receptions SET
      group_name = ?, contact_person = ?, contact_phone = ?,
      people_count = ?, scheduled_date = ?, scheduled_time = ?,
      source = ?, remark = ?, status = ?, updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `);

  stmt.run(
    group_name || existing.group_name,
    contact_person !== undefined ? contact_person : existing.contact_person,
    contact_phone !== undefined ? contact_phone : existing.contact_phone,
    people_count !== undefined ? people_count : existing.people_count,
    scheduled_date || existing.scheduled_date,
    scheduled_time !== undefined ? scheduled_time : existing.scheduled_time,
    source !== undefined ? source : existing.source,
    remark !== undefined ? remark : existing.remark,
    status || existing.status,
    id
  );

  logAudit('reception', id, '更新', req.currentUser, '更新接待单信息');

  const updated = db.prepare('SELECT * FROM receptions WHERE id = ?').get(id);
  res.json(updated);
});

router.post('/:id/assign-guide', (req, res) => {
  const { id } = req.params;
  const { guide_id, picking_area, remark } = req.body;

  const reception = db.prepare('SELECT * FROM receptions WHERE id = ?').get(id);
  if (!reception) {
    return res.status(404).json({ error: '接待单不存在' });
  }
  if (reception.status === 'cancelled') {
    return res.status(400).json({ error: '已取消的接待单不能分配向导' });
  }

  const guide = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'guide'").get(guide_id);
  if (!guide) {
    return res.status(400).json({ error: '向导不存在或身份无效' });
  }

  const taskNo = generateNo('RW');
  const taskStmt = db.prepare(`
    INSERT INTO guide_tasks (
      task_no, reception_id, guide_id, assigned_by, status,
      picking_area, remark
    ) VALUES (?, ?, ?, ?, 'assigned', ?, ?)
  `);

  const result = taskStmt.run(
    taskNo, id, guide_id, req.currentUser.id,
    picking_area || '', remark || ''
  );

  const taskId = result.lastInsertRowid;

  db.prepare(
    "UPDATE receptions SET status = 'assigned', updated_at = datetime('now', 'localtime') WHERE id = ?"
  ).run(id);

  logAudit('reception', id, '分配向导', req.currentUser, `分配向导 ${guide.name}，任务号 ${taskNo}`);
  logAudit('guide_task', taskId, '创建', req.currentUser, `创建向导任务 ${taskNo}`);

  const task = db.prepare('SELECT * FROM guide_tasks WHERE id = ?').get(taskId);
  res.status(201).json(task);
});

router.post('/batch-status', (req, res) => {
  const { ids, status, remark } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: '请选择要操作的记录' });
  }
  if (!status) {
    return res.status(400).json({ error: '请指定目标状态' });
  }

  const placeholders = ids.map(() => '?').join(',');
  const stmt = db.prepare(`
    UPDATE receptions SET status = ?, updated_at = datetime('now', 'localtime')
    WHERE id IN (${placeholders})
  `);

  const result = stmt.run(status, ...ids);
  ids.forEach(id => {
    logAudit('reception', id, '批量更新状态', req.currentUser, `状态改为 ${status}`);
  });

  res.json({ affected: result.changes, ids, status });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM receptions WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: '接待单不存在' });
  }

  db.prepare("UPDATE receptions SET status = 'cancelled', updated_at = datetime('now', 'localtime') WHERE id = ?").run(id);
  logAudit('reception', id, '取消', req.currentUser, '取消接待单');

  res.json({ message: '已取消' });
});

module.exports = router;
