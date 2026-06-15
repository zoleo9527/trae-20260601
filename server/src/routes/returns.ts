import express from 'express';
import db from '../db.js';
import type { ReturnExchangeRequest, ReturnItem, OperationLog } from '../types.js';

const router = express.Router();

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function generateRequestNo(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `RE${dateStr}${random}`;
}

function addOperationLog(
  requestId: string | null,
  reissueId: string | null,
  action: string,
  operator: string,
  operatorRole: string,
  detail?: string,
  oldStatus?: string,
  newStatus?: string
) {
  const logId = generateId();
  db.prepare(`
    INSERT INTO operation_logs (id, request_id, reissue_id, action, operator, operator_role, detail, old_status, new_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
  `).run(logId, requestId, reissueId, action, operator, operatorRole, detail || null, oldStatus || null, newStatus || null);
}

router.get('/', (req, res) => {
  const { status, type, keyword, page = '1', pageSize = '20' } = req.query;
  const pageNum = parseInt(page as string);
  const pageSizeNum = parseInt(pageSize as string);
  const offset = (pageNum - 1) * pageSizeNum;

  let whereClauses: string[] = [];
  let params: any[] = [];

  if (status) {
    whereClauses.push('r.status = ?');
    params.push(status);
  }
  if (type) {
    whereClauses.push('r.type = ?');
    params.push(type);
  }
  if (keyword) {
    whereClauses.push('(r.request_no LIKE ? OR s.order_no LIKE ? OR s.customer_name LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countResult = db.prepare(`
    SELECT COUNT(*) as total FROM return_exchange_requests r
    LEFT JOIN sales_orders s ON r.order_id = s.id
    ${whereSql}
  `).get(...params) as { total: number };

  const requests = db.prepare(`
    SELECT r.*, s.order_no, s.customer_name, s.customer_phone, s.address,
           (SELECT COUNT(*) FROM return_items ri WHERE ri.request_id = r.id) as item_count
    FROM return_exchange_requests r
    LEFT JOIN sales_orders s ON r.order_id = s.id
    ${whereSql}
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSizeNum, offset);

  res.json({
    list: requests,
    total: countResult.total,
    page: pageNum,
    pageSize: pageSizeNum,
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;

  const request = db.prepare(`
    SELECT r.*, s.order_no, s.customer_name, s.customer_phone, s.address, s.total_amount
    FROM return_exchange_requests r
    LEFT JOIN sales_orders s ON r.order_id = s.id
    WHERE r.id = ?
  `).get(id) as ReturnExchangeRequest & { order_no?: string; customer_name?: string };

  if (!request) {
    res.status(404).json({ error: '退换货申请不存在' });
    return;
  }

  const returnItems = db.prepare(`
    SELECT * FROM return_items WHERE request_id = ?
  `).all(id) as ReturnItem[];

  const reissue = db.prepare(`
    SELECT * FROM reissue_tracking WHERE request_id = ? ORDER BY created_at DESC LIMIT 1
  `).get(id);

  const reissueItems = reissue ? db.prepare(`
    SELECT * FROM reissue_items WHERE reissue_id = ?
  `).all((reissue as any).id) : [];

  const logs = db.prepare(`
    SELECT * FROM operation_logs 
    WHERE request_id = ? OR reissue_id = (SELECT id FROM reissue_tracking WHERE request_id = ? LIMIT 1)
    ORDER BY created_at ASC
  `).all(id, id) as OperationLog[];

  const attachments = db.prepare(`
    SELECT * FROM attachments WHERE request_id = ?
  `).all(id);

  res.json({
    ...request,
    returnItems,
    reissue: reissue ? { ...reissue, items: reissueItems } : null,
    logs,
    attachments,
  });
});

router.post('/', (req, res) => {
  const { order_id, type, reason, reason_category, applicant, applicant_role, remarks, items } = req.body;

  if (!order_id || !type || !applicant || !applicant_role || !items || items.length === 0) {
    res.status(400).json({ error: '缺少必要参数' });
    return;
  }

  const id = generateId();
  const requestNo = generateRequestNo();

  const insertRequest = db.prepare(`
    INSERT INTO return_exchange_requests 
    (id, request_no, order_id, type, status, reason, reason_category, applicant, applicant_role, remarks, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))
  `);

  const insertItem = db.prepare(`
    INSERT INTO return_items (id, request_id, product_name, product_code, quantity, unit, warehouse_location)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    insertRequest.run(id, requestNo, order_id, type, reason || null, reason_category || null, applicant, applicant_role, remarks || null);

    for (const item of items) {
      insertItem.run(
        generateId(), id, item.product_name, item.product_code || null,
        item.quantity, item.unit || null, item.warehouse_location || null
      );
    }

    addOperationLog(id, null, '创建草稿', applicant, applicant_role, '创建退换货申请草稿', undefined, 'draft');
  });

  transaction();

  const newRequest = db.prepare('SELECT * FROM return_exchange_requests WHERE id = ?').get(id);
  res.status(201).json(newRequest);
});

router.put('/:id/submit', (req, res) => {
  const { id } = req.params;
  const { operator, operator_role, remark } = req.body;

  const request = db.prepare('SELECT * FROM return_exchange_requests WHERE id = ?').get(id) as ReturnExchangeRequest;
  if (!request) {
    res.status(404).json({ error: '退换货申请不存在' });
    return;
  }
  if (request.status !== 'draft') {
    res.status(400).json({ error: '只有草稿状态可以提交' });
    return;
  }

  db.prepare(`
    UPDATE return_exchange_requests 
    SET status = 'pending_warehouse', updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(id);

  addOperationLog(id, null, '提交申请', operator, operator_role, remark || '提交退换货申请，等待仓库确认', 'draft', 'pending_warehouse');

  const updated = db.prepare('SELECT * FROM return_exchange_requests WHERE id = ?').get(id);
  res.json(updated);
});

router.put('/:id/warehouse-confirm', (req, res) => {
  const { id } = req.params;
  const { operator, operator_role, items, remark } = req.body;

  const request = db.prepare('SELECT * FROM return_exchange_requests WHERE id = ?').get(id) as ReturnExchangeRequest;
  if (!request) {
    res.status(404).json({ error: '退换货申请不存在' });
    return;
  }
  if (request.status !== 'pending_warehouse') {
    res.status(400).json({ error: '只有待仓库确认状态可以确认' });
    return;
  }

  const updateItem = db.prepare(`
    UPDATE return_items 
    SET actual_quantity = ?, inspection_result = ?, inspection_remark = ?
    WHERE id = ?
  `);

  const transaction = db.transaction(() => {
    if (items && items.length > 0) {
      for (const item of items) {
        updateItem.run(item.actual_quantity || null, item.inspection_result || null, item.inspection_remark || null, item.id);
      }
    }

    const nextStatus = request.type === 'exchange' ? 'warehouse_confirmed' : 'warehouse_confirmed';
    db.prepare(`
      UPDATE return_exchange_requests 
      SET status = ?, warehouse_confirmer = ?, warehouse_confirm_time = datetime('now', 'localtime'), 
          updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(nextStatus, operator, id);

    addOperationLog(id, null, '仓库确认', operator, operator_role, remark || '仓库确认收到退货，验收完成', 'pending_warehouse', nextStatus);
  });

  transaction();

  const updated = db.prepare('SELECT * FROM return_exchange_requests WHERE id = ?').get(id);
  res.json(updated);
});

router.put('/:id/cancel', (req, res) => {
  const { id } = req.params;
  const { operator, operator_role, reason } = req.body;

  const request = db.prepare('SELECT * FROM return_exchange_requests WHERE id = ?').get(id) as ReturnExchangeRequest;
  if (!request) {
    res.status(404).json({ error: '退换货申请不存在' });
    return;
  }
  if (request.status === 'completed' || request.status === 'cancelled') {
    res.status(400).json({ error: '当前状态不可取消' });
    return;
  }

  db.prepare(`
    UPDATE return_exchange_requests 
    SET status = 'cancelled', updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(id);

  addOperationLog(id, null, '取消申请', operator, operator_role, reason || '取消退换货申请', request.status, 'cancelled');

  const updated = db.prepare('SELECT * FROM return_exchange_requests WHERE id = ?').get(id);
  res.json(updated);
});

router.post('/batch-warehouse-confirm', (req, res) => {
  const { ids, operator, operator_role, remark } = req.body;

  if (!ids || ids.length === 0) {
    res.status(400).json({ error: '请选择要确认的申请' });
    return;
  }

  const validIds: string[] = [];
  for (const id of ids) {
    const request = db.prepare('SELECT * FROM return_exchange_requests WHERE id = ?').get(id) as ReturnExchangeRequest;
    if (request && request.status === 'pending_warehouse') {
      validIds.push(id);
    }
  }

  if (validIds.length === 0) {
    res.status(400).json({ error: '没有可确认的申请' });
    return;
  }

  const placeholders = validIds.map(() => '?').join(',');
  
  const transaction = db.transaction(() => {
    db.prepare(`
      UPDATE return_exchange_requests 
      SET status = 'warehouse_confirmed', warehouse_confirmer = ?, 
          warehouse_confirm_time = datetime('now', 'localtime'),
          updated_at = datetime('now', 'localtime')
      WHERE id IN (${placeholders}) AND status = 'pending_warehouse'
    `).run(operator, ...validIds);

    for (const id of validIds) {
      addOperationLog(id, null, '批量仓库确认', operator, operator_role, remark || '批量仓库确认', 'pending_warehouse', 'warehouse_confirmed');
    }
  });

  transaction();

  res.json({ success: true, count: validIds.length, message: `成功确认 ${validIds.length} 条申请` });
});

router.post('/batch-cancel', (req, res) => {
  const { ids, operator, operator_role, reason } = req.body;

  if (!ids || ids.length === 0) {
    res.status(400).json({ error: '请选择要取消的申请' });
    return;
  }

  const validIds: string[] = [];
  const cancelledStatuses = ['draft', 'pending_warehouse', 'warehouse_confirmed'];
  
  for (const id of ids) {
    const request = db.prepare('SELECT * FROM return_exchange_requests WHERE id = ?').get(id) as ReturnExchangeRequest;
    if (request && cancelledStatuses.includes(request.status)) {
      validIds.push(id);
    }
  }

  if (validIds.length === 0) {
    res.status(400).json({ error: '没有可取消的申请' });
    return;
  }

  const placeholders = validIds.map(() => '?').join(',');
  
  const transaction = db.transaction(() => {
    const stmt = db.prepare(`
      UPDATE return_exchange_requests 
      SET status = 'cancelled', updated_at = datetime('now', 'localtime')
      WHERE id IN (${placeholders}) AND status IN ('draft', 'pending_warehouse', 'warehouse_confirmed')
    `);
    stmt.run(...validIds);

    for (const id of validIds) {
      const request = db.prepare('SELECT status FROM return_exchange_requests WHERE id = ?').get(id) as { status: string };
      addOperationLog(id, null, '批量取消', operator, operator_role, reason || '批量取消申请', request.status, 'cancelled');
    }
  });

  transaction();

  res.json({ success: true, count: validIds.length, message: `成功取消 ${validIds.length} 条申请` });
});

router.get('/:id/logs', (req, res) => {
  const { id } = req.params;
  const logs = db.prepare(`
    SELECT * FROM operation_logs 
    WHERE request_id = ? OR reissue_id = (SELECT id FROM reissue_tracking WHERE request_id = ? LIMIT 1)
    ORDER BY created_at ASC
  `).all(id, id);
  res.json(logs);
});

export default router;
