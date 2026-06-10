const express = require('express');
const db = require('../db');
const { logAudit, getPagination, paginateResult, createNotification } = require('../utils');

const router = express.Router();

router.get('/', (req, res) => {
  const { status, page, pageSize } = req.query;
  const { offset, limit, page: p, pageSize: ps } = getPagination(page, pageSize);

  let whereSql = 'WHERE 1=1';
  const params = [];

  if (status) {
    whereSql += ' AND wt.status = ?';
    params.push(status);
  }

  const countSql = `SELECT COUNT(*) as total FROM warehouse_transfers wt ${whereSql}`;
  const total = db.prepare(countSql).get(...params).total;

  const listSql = `
    SELECT wt.*, gt.task_no, r.group_name, r.reception_no,
           u.name as received_by_name
    FROM warehouse_transfers wt
    LEFT JOIN guide_tasks gt ON wt.guide_task_id = gt.id
    LEFT JOIN receptions r ON gt.reception_id = r.id
    LEFT JOIN users u ON wt.received_by = u.id
    ${whereSql}
    ORDER BY wt.id DESC
    LIMIT ? OFFSET ?
  `;
  const list = db.prepare(listSql).all(...params, limit, offset);

  res.json(paginateResult(total, list, p, ps));
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const transfer = db.prepare(`
    SELECT wt.*, gt.task_no, gt.picking_area,
           r.group_name, r.reception_no, r.people_count,
           u.name as guide_name, ur.name as received_by_name
    FROM warehouse_transfers wt
    LEFT JOIN guide_tasks gt ON wt.guide_task_id = gt.id
    LEFT JOIN receptions r ON gt.reception_id = r.id
    LEFT JOIN users u ON gt.guide_id = u.id
    LEFT JOIN users ur ON wt.received_by = ur.id
    WHERE wt.id = ?
  `).get(id);

  if (!transfer) {
    return res.status(404).json({ error: '交接单不存在' });
  }

  const attachments = db.prepare(`
    SELECT * FROM attachments WHERE biz_type = 'warehouse_transfer' AND biz_id = ? ORDER BY id DESC
  `).all(id);

  const auditLogs = db.prepare(`
    SELECT * FROM audit_logs WHERE biz_type = 'warehouse_transfer' AND biz_id = ? ORDER BY id DESC
  `).all(id);

  if (transfer.fruit_details) {
    try {
      transfer.fruit_details_parsed = JSON.parse(transfer.fruit_details);
    } catch (e) {
      transfer.fruit_details_parsed = null;
    }
  }

  res.json({
    ...transfer,
    attachments,
    auditLogs
  });
});

router.post('/:id/receive', (req, res) => {
  const { id } = req.params;
  const { fruit_details, total_weight, remark } = req.body;

  const transfer = db.prepare('SELECT * FROM warehouse_transfers WHERE id = ?').get(id);
  if (!transfer) return res.status(404).json({ error: '交接单不存在' });
  if (transfer.status !== 'pending') {
    return res.status(400).json({ error: '只有待接收状态的交接单才能接收' });
  }

  db.prepare(`
    UPDATE warehouse_transfers SET
      status = 'received',
      received_by = ?,
      fruit_details = ?,
      total_weight = ?,
      received_time = datetime('now', 'localtime'),
      remark = ?,
      updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(
    req.currentUser.id,
    fruit_details ? JSON.stringify(fruit_details) : transfer.fruit_details,
    total_weight !== undefined ? total_weight : transfer.total_weight,
    remark || transfer.remark || '',
    id
  );

  logAudit('warehouse_transfer', id, '接收', req.currentUser, '仓库已接收果品');

  const task = db.prepare('SELECT reception_id FROM guide_tasks WHERE id = ?').get(transfer.guide_task_id);
  if (task) {
    const reception = db.prepare('SELECT id, reception_no, group_name, created_by FROM receptions WHERE id = ?').get(task.reception_id);
    if (reception && reception.created_by) {
      createNotification({
        userId: reception.created_by,
        title: '果品已被仓库接收',
        content: `${reception.reception_no} ${reception.group_name}：${transfer.transfer_no} 已由仓库接收，等待入库`,
        bizType: 'reception',
        bizId: reception.id,
        receptionId: reception.id,
        type: 'reception'
      });
    }
  }

  const updated = db.prepare(`
    SELECT wt.*, u.name as received_by_name
    FROM warehouse_transfers wt
    LEFT JOIN users u ON wt.received_by = u.id
    WHERE wt.id = ?
  `).get(id);

  res.json(updated);
});

router.post('/:id/store', (req, res) => {
  const { id } = req.params;
  const { storage_location, remark } = req.body;

  const transfer = db.prepare('SELECT * FROM warehouse_transfers WHERE id = ?').get(id);
  if (!transfer) return res.status(404).json({ error: '交接单不存在' });
  if (transfer.status === 'stored') {
    return res.status(400).json({ error: '已入库，不能重复操作' });
  }
  if (transfer.status === 'pending') {
    return res.status(400).json({ error: '请先接收再入库' });
  }

  db.prepare(`
    UPDATE warehouse_transfers SET
      status = 'stored',
      storage_location = ?,
      stored_time = datetime('now', 'localtime'),
      remark = ?,
      updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(
    storage_location || '',
    remark || transfer.remark || '',
    id
  );

  const task = db.prepare('SELECT reception_id FROM guide_tasks WHERE id = ?').get(transfer.guide_task_id);
  if (task) {
    db.prepare(
      "UPDATE receptions SET status = 'completed', updated_at = datetime('now', 'localtime') WHERE id = ?"
    ).run(task.reception_id);
    logAudit('reception', task.reception_id, '完成', req.currentUser, '接待单全部流程完成');

    const reception = db.prepare('SELECT id, reception_no, group_name, created_by FROM receptions WHERE id = ?').get(task.reception_id);
    if (reception && reception.created_by) {
      createNotification({
        userId: reception.created_by,
        title: '接待单已完成全部流程',
        content: `${reception.reception_no} ${reception.group_name}：果品已全部入库，接待流程结束`,
        bizType: 'reception',
        bizId: reception.id,
        receptionId: reception.id,
        type: 'reception'
      });
    }
  }

  logAudit('warehouse_transfer', id, '入库', req.currentUser, `果品已入库，库位：${storage_location || '未指定'}`);

  const updated = db.prepare(`
    SELECT wt.*, u.name as received_by_name
    FROM warehouse_transfers wt
    LEFT JOIN users u ON wt.received_by = u.id
    WHERE wt.id = ?
  `).get(id);

  res.json(updated);
});

router.post('/batch-receive', (req, res) => {
  const { ids, remark } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: '请选择要操作的记录' });
  }

  let affected = 0;
  const receivedIds = [];

  const tx = db.transaction((transferIds) => {
    for (const transferId of transferIds) {
      const transfer = db.prepare('SELECT * FROM warehouse_transfers WHERE id = ?').get(transferId);
      if (transfer && transfer.status === 'pending') {
        db.prepare(`
          UPDATE warehouse_transfers SET
            status = 'received',
            received_by = ?,
            received_time = datetime('now', 'localtime'),
            remark = ?,
            updated_at = datetime('now', 'localtime')
          WHERE id = ?
        `).run(req.currentUser.id, remark || '批量接收', transferId);

        receivedIds.push(transferId);
        affected++;
      }
    }
  });

  tx(ids);

  receivedIds.forEach(id => {
    logAudit('warehouse_transfer', id, '批量接收', req.currentUser, remark || '批量接收');
  });

  res.json({ affected, ids: receivedIds });
});

module.exports = router;
