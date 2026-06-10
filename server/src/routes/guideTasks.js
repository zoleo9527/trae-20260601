const express = require('express');
const db = require('../db');
const { logAudit, getPagination, paginateResult, generateNo, createNotificationForRole } = require('../utils');

const router = express.Router();

router.get('/', (req, res) => {
  const { status, guide_id, page, pageSize, reception_id } = req.query;
  const { offset, limit, page: p, pageSize: ps } = getPagination(page, pageSize);

  let whereSql = 'WHERE 1=1';
  const params = [];

  if (status) {
    whereSql += ' AND gt.status = ?';
    params.push(status);
  }
  if (guide_id) {
    whereSql += ' AND gt.guide_id = ?';
    params.push(guide_id);
  }
  if (reception_id) {
    whereSql += ' AND gt.reception_id = ?';
    params.push(reception_id);
  }

  const countSql = `SELECT COUNT(*) as total FROM guide_tasks gt ${whereSql}`;
  const total = db.prepare(countSql).get(...params).total;

  const listSql = `
    SELECT gt.*, r.group_name, r.reception_no, r.scheduled_date,
           u.name as guide_name, ua.name as assigned_by_name
    FROM guide_tasks gt
    LEFT JOIN receptions r ON gt.reception_id = r.id
    LEFT JOIN users u ON gt.guide_id = u.id
    LEFT JOIN users ua ON gt.assigned_by = ua.id
    ${whereSql}
    ORDER BY gt.id DESC
    LIMIT ? OFFSET ?
  `;
  const list = db.prepare(listSql).all(...params, limit, offset);

  res.json(paginateResult(total, list, p, ps));
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const task = db.prepare(`
    SELECT gt.*, r.group_name, r.reception_no, r.people_count, r.contact_person, r.contact_phone,
           u.name as guide_name, ua.name as assigned_by_name
    FROM guide_tasks gt
    LEFT JOIN receptions r ON gt.reception_id = r.id
    LEFT JOIN users u ON gt.guide_id = u.id
    LEFT JOIN users ua ON gt.assigned_by = ua.id
    WHERE gt.id = ?
  `).get(id);

  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }

  const warehouseTransfer = db.prepare(`
    SELECT wt.*, u.name as received_by_name
    FROM warehouse_transfers wt
    LEFT JOIN users u ON wt.received_by = u.id
    WHERE wt.guide_task_id = ?
    ORDER BY wt.id DESC
    LIMIT 1
  `).get(id);

  const attachments = db.prepare(`
    SELECT * FROM attachments WHERE biz_type = 'guide_task' AND biz_id = ? ORDER BY id DESC
  `).all(id);

  const auditLogs = db.prepare(`
    SELECT * FROM audit_logs WHERE biz_type = 'guide_task' AND biz_id = ? ORDER BY id DESC
  `).all(id);

  if (task.fruit_details) {
    try {
      task.fruit_details_parsed = JSON.parse(task.fruit_details);
    } catch (e) {
      task.fruit_details_parsed = null;
    }
  }
  if (warehouseTransfer && warehouseTransfer.fruit_details) {
    try {
      warehouseTransfer.fruit_details_parsed = JSON.parse(warehouseTransfer.fruit_details);
    } catch (e) {
      warehouseTransfer.fruit_details_parsed = null;
    }
  }

  res.json({
    ...task,
    warehouseTransfer,
    attachments,
    auditLogs
  });
});

router.post('/:id/start', (req, res) => {
  const { id } = req.params;
  const task = db.prepare('SELECT * FROM guide_tasks WHERE id = ?').get(id);
  if (!task) return res.status(404).json({ error: '任务不存在' });
  if (task.status !== 'assigned') {
    return res.status(400).json({ error: '只有已分配状态的任务才能开始' });
  }

  db.prepare(`
    UPDATE guide_tasks SET
      status = 'in_progress',
      start_time = datetime('now', 'localtime'),
      updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(id);

  db.prepare(
    "UPDATE receptions SET status = 'picking', updated_at = datetime('now', 'localtime') WHERE id = ?"
  ).run(task.reception_id);

  logAudit('guide_task', id, '开始采摘', req.currentUser, '向导开始采摘任务');
  logAudit('reception', task.reception_id, '开始采摘', req.currentUser, '接待进入采摘阶段');

  const updated = db.prepare('SELECT * FROM guide_tasks WHERE id = ?').get(id);
  res.json(updated);
});

router.post('/:id/complete', (req, res) => {
  const { id } = req.params;
  const { fruit_details, total_weight, remark } = req.body;

  const task = db.prepare('SELECT * FROM guide_tasks WHERE id = ?').get(id);
  if (!task) return res.status(404).json({ error: '任务不存在' });
  if (task.status === 'completed') {
    return res.status(400).json({ error: '任务已完成' });
  }

  db.prepare(`
    UPDATE guide_tasks SET
      status = 'completed',
      fruit_details = ?,
      total_weight = ?,
      remark = ?,
      end_time = datetime('now', 'localtime'),
      updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(
    JSON.stringify(fruit_details || []),
    total_weight || 0,
    remark || task.remark,
    id
  );

  const transferNo = generateNo('CK');
  const transferStmt = db.prepare(`
    INSERT INTO warehouse_transfers (
      transfer_no, guide_task_id, received_by, status,
      fruit_details, total_weight, remark
    ) VALUES (?, ?, NULL, 'pending', ?, ?, ?)
  `);
  const transferResult = transferStmt.run(
    transferNo, id,
    JSON.stringify(fruit_details || []),
    total_weight || 0,
    '向导采摘完成，待仓库接收'
  );

  logAudit('guide_task', id, '完成采摘', req.currentUser, `采摘完成，总重量 ${total_weight || 0}斤`);
  logAudit('warehouse_transfer', transferResult.lastInsertRowid, '创建', req.currentUser, `创建交接单 ${transferNo}，待仓库接收`);

  createNotificationForRole({
    role: 'warehouse',
    title: '有新的果品待入库',
    content: `${transferNo}：${task.task_no} 向导已完成采摘，总重量 ${total_weight || 0} 斤，请及时接收`,
    bizType: 'warehouse_transfer',
    bizId: transferResult.lastInsertRowid,
    type: 'warehouse'
  });

  const updated = db.prepare('SELECT * FROM guide_tasks WHERE id = ?').get(id);
  res.json(updated);
});

router.post('/batch-complete', (req, res) => {
  const { ids, remark } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: '请选择要操作的记录' });
  }

  let affected = 0;
  const completedIds = [];

  const tx = db.transaction((taskIds) => {
    for (const taskId of taskIds) {
      const task = db.prepare('SELECT * FROM guide_tasks WHERE id = ?').get(taskId);
      if (task && task.status !== 'completed') {
        db.prepare(`
          UPDATE guide_tasks SET
            status = 'completed',
            end_time = datetime('now', 'localtime'),
            updated_at = datetime('now', 'localtime')
          WHERE id = ?
        `).run(taskId);

        const transferNo = generateNo('CK');
        db.prepare(`
          INSERT INTO warehouse_transfers (
            transfer_no, guide_task_id, received_by, status, total_weight, remark
          ) VALUES (?, ?, NULL, 'pending', 0, ?)
        `).run(transferNo, taskId, remark || '批量完成');

        completedIds.push(taskId);
        affected++;
      }
    }
  });

  tx(ids);

  completedIds.forEach(id => {
    logAudit('guide_task', id, '批量完成', req.currentUser, remark || '批量完成采摘');
  });

  res.json({ affected, ids: completedIds });
});

module.exports = router;
