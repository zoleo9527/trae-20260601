import express from 'express';
import db from '../db.js';
import type { ReissueTracking, ReissueItem, OperationLog } from '../types.js';

const router = express.Router();

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function generateTrackingNo(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `BH${dateStr}${random}`;
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
  const { status, keyword, page = '1', pageSize = '20' } = req.query;
  const pageNum = parseInt(page as string);
  const pageSizeNum = parseInt(pageSize as string);
  const offset = (pageNum - 1) * pageSizeNum;

  let whereClauses: string[] = [];
  let params: any[] = [];

  if (status) {
    whereClauses.push('rt.status = ?');
    params.push(status);
  }
  if (keyword) {
    whereClauses.push('(rt.tracking_no LIKE ? OR r.request_no LIKE ? OR s.order_no LIKE ? OR s.customer_name LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countResult = db.prepare(`
    SELECT COUNT(*) as total FROM reissue_tracking rt
    LEFT JOIN return_exchange_requests r ON rt.request_id = r.id
    LEFT JOIN sales_orders s ON r.order_id = s.id
    ${whereSql}
  `).get(...params) as { total: number };

  const reissues = db.prepare(`
    SELECT rt.*, r.request_no, r.type as request_type, s.order_no, s.customer_name, s.address,
           (SELECT COUNT(*) FROM reissue_items ri WHERE ri.reissue_id = rt.id) as item_count
    FROM reissue_tracking rt
    LEFT JOIN return_exchange_requests r ON rt.request_id = r.id
    LEFT JOIN sales_orders s ON r.order_id = s.id
    ${whereSql}
    ORDER BY rt.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSizeNum, offset);

  res.json({
    list: reissues,
    total: countResult.total,
    page: pageNum,
    pageSize: pageSizeNum,
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;

  const reissue = db.prepare(`
    SELECT rt.*, r.request_no, r.type as request_type, r.status as request_status,
           s.order_no, s.customer_name, s.customer_phone, s.address
    FROM reissue_tracking rt
    LEFT JOIN return_exchange_requests r ON rt.request_id = r.id
    LEFT JOIN sales_orders s ON r.order_id = s.id
    WHERE rt.id = ?
  `).get(id);

  if (!reissue) {
    res.status(404).json({ error: '补发跟踪不存在' });
    return;
  }

  const items = db.prepare(`
    SELECT * FROM reissue_items WHERE reissue_id = ?
  `).all(id) as ReissueItem[];

  const logs = db.prepare(`
    SELECT * FROM operation_logs 
    WHERE reissue_id = ? OR request_id = (SELECT request_id FROM reissue_tracking WHERE id = ?)
    ORDER BY created_at ASC
  `).all(id, id) as OperationLog[];

  const attachments = db.prepare(`
    SELECT * FROM attachments WHERE reissue_id = ?
  `).all(id);

  res.json({
    ...reissue,
    items,
    logs,
    attachments,
  });
});

router.post('/', (req, res) => {
  const { request_id, handler, handler_role, items, driver_name, vehicle_no, estimated_delivery_date, remarks } = req.body;

  if (!request_id || !handler || !handler_role || !items || items.length === 0) {
    res.status(400).json({ error: '缺少必要参数' });
    return;
  }

  const request = db.prepare('SELECT * FROM return_exchange_requests WHERE id = ?').get(request_id);
  if (!request) {
    res.status(404).json({ error: '退换货申请不存在' });
    return;
  }

  const id = generateId();
  const trackingNo = generateTrackingNo();

  const transaction = db.transaction(() => {
    db.prepare(`
      INSERT INTO reissue_tracking 
      (id, request_id, tracking_no, status, handler, handler_role, driver_name, vehicle_no, estimated_delivery_date, remarks, created_at, updated_at)
      VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))
    `).run(id, request_id, trackingNo, handler, handler_role, driver_name || null, vehicle_no || null, estimated_delivery_date || null, remarks || null);

    const insertItem = db.prepare(`
      INSERT INTO reissue_items (id, reissue_id, product_name, product_code, quantity, unit, warehouse_location)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of items) {
      insertItem.run(
        generateId(), id, item.product_name, item.product_code || null,
        item.quantity, item.unit || null, item.warehouse_location || null
      );
    }

    db.prepare(`
      UPDATE return_exchange_requests 
      SET status = 'reissuing', reissue_handler = ?, reissue_handle_time = datetime('now', 'localtime'),
          updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(handler, request_id);

    addOperationLog(request_id, id, '创建补发单', handler, handler_role, '创建补发跟踪单', (request as any).status, 'reissuing');
  });

  transaction();

  const newReissue = db.prepare('SELECT * FROM reissue_tracking WHERE id = ?').get(id);
  res.status(201).json(newReissue);
});

router.put('/:id/picking', (req, res) => {
  const { id } = req.params;
  const { operator, operator_role, warehouse_location, remark } = req.body;

  const reissue = db.prepare('SELECT * FROM reissue_tracking WHERE id = ?').get(id) as ReissueTracking;
  if (!reissue) {
    res.status(404).json({ error: '补发跟踪不存在' });
    return;
  }
  if (reissue.status !== 'pending') {
    res.status(400).json({ error: '只有待处理状态可以开始拣货' });
    return;
  }

  db.prepare(`
    UPDATE reissue_tracking 
    SET status = 'picking', warehouse_location = ?, updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(warehouse_location || reissue.warehouse_location, id);

  addOperationLog(reissue.request_id, id, '开始拣货', operator, operator_role, remark || '仓库开始拣货', 'pending', 'picking');

  const updated = db.prepare('SELECT * FROM reissue_tracking WHERE id = ?').get(id);
  res.json(updated);
});

router.put('/:id/ship', (req, res) => {
  const { id } = req.params;
  const { operator, operator_role, driver_name, vehicle_no, remark } = req.body;

  const reissue = db.prepare('SELECT * FROM reissue_tracking WHERE id = ?').get(id) as ReissueTracking;
  if (!reissue) {
    res.status(404).json({ error: '补发跟踪不存在' });
    return;
  }
  if (reissue.status !== 'picking') {
    res.status(400).json({ error: '只有拣货中状态可以发货' });
    return;
  }

  db.prepare(`
    UPDATE reissue_tracking 
    SET status = 'shipped', driver_name = ?, vehicle_no = ?, updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(driver_name || reissue.driver_name, vehicle_no || reissue.vehicle_no, id);

  addOperationLog(reissue.request_id, id, '发货', operator, operator_role, remark || '货物已发出', 'picking', 'shipped');

  const updated = db.prepare('SELECT * FROM reissue_tracking WHERE id = ?').get(id);
  res.json(updated);
});

router.put('/:id/out-for-delivery', (req, res) => {
  const { id } = req.params;
  const { operator, operator_role, remark } = req.body;

  const reissue = db.prepare('SELECT * FROM reissue_tracking WHERE id = ?').get(id) as ReissueTracking;
  if (!reissue) {
    res.status(404).json({ error: '补发跟踪不存在' });
    return;
  }
  if (reissue.status !== 'shipped') {
    res.status(400).json({ error: '只有已发货状态可以标记为派送中' });
    return;
  }

  db.prepare(`
    UPDATE reissue_tracking 
    SET status = 'out_for_delivery', updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(id);

  addOperationLog(reissue.request_id, id, '派送中', operator, operator_role, remark || '货物正在派送中', 'shipped', 'out_for_delivery');

  const updated = db.prepare('SELECT * FROM reissue_tracking WHERE id = ?').get(id);
  res.json(updated);
});

router.put('/:id/deliver', (req, res) => {
  const { id } = req.params;
  const { operator, operator_role, signer_name, remark } = req.body;

  const reissue = db.prepare('SELECT * FROM reissue_tracking WHERE id = ?').get(id) as ReissueTracking;
  if (!reissue) {
    res.status(404).json({ error: '补发跟踪不存在' });
    return;
  }
  if (reissue.status !== 'out_for_delivery') {
    res.status(400).json({ error: '只有派送中状态可以签收' });
    return;
  }

  const transaction = db.transaction(() => {
    db.prepare(`
      UPDATE reissue_tracking 
      SET status = 'delivered', signer_name = ?, sign_time = datetime('now', 'localtime'),
          actual_delivery_date = date('now', 'localtime'), updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(signer_name || null, id);

    db.prepare(`
      UPDATE return_exchange_requests 
      SET status = 'completed', completer = ?, complete_time = datetime('now', 'localtime'),
          updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(operator, reissue.request_id);

    addOperationLog(reissue.request_id, id, '签收完成', operator, operator_role, remark || '客户已签收，补发完成', 'out_for_delivery', 'delivered');
    addOperationLog(reissue.request_id, id, '退换货完成', operator, operator_role, '退换货申请全部完成', 'reissuing', 'completed');
  });

  transaction();

  const updated = db.prepare('SELECT * FROM reissue_tracking WHERE id = ?').get(id);
  res.json(updated);
});

router.put('/:id/cancel', (req, res) => {
  const { id } = req.params;
  const { operator, operator_role, reason } = req.body;

  const reissue = db.prepare('SELECT * FROM reissue_tracking WHERE id = ?').get(id) as ReissueTracking;
  if (!reissue) {
    res.status(404).json({ error: '补发跟踪不存在' });
    return;
  }
  if (reissue.status === 'delivered' || reissue.status === 'cancelled') {
    res.status(400).json({ error: '当前状态不可取消' });
    return;
  }

  db.prepare(`
    UPDATE reissue_tracking 
    SET status = 'cancelled', updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(id);

  addOperationLog(reissue.request_id, id, '取消补发', operator, operator_role, reason || '取消补发', reissue.status, 'cancelled');

  const updated = db.prepare('SELECT * FROM reissue_tracking WHERE id = ?').get(id);
  res.json(updated);
});

router.get('/request/:requestId', (req, res) => {
  const { requestId } = req.params;
  const reissues = db.prepare(`
    SELECT * FROM reissue_tracking WHERE request_id = ? ORDER BY created_at DESC
  `).all(requestId);
  res.json(reissues);
});

export default router;
