import express from 'express';
import { db } from '../database';

const router = express.Router();

const generateId = () => Math.random().toString(36).substring(2, 9);

const getCurrentTime = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
};

router.get('/', (req, res) => {
  const { status, storeId, region, dishName, startTime, endTime } = req.query;
  
  let query = 'SELECT * FROM replenish_orders WHERE 1=1';
  const params: string[] = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status as string);
  }
  if (storeId) {
    query += ' AND store_id = ?';
    params.push(storeId as string);
  }
  if (region) {
    query += ' AND region = ?';
    params.push(region as string);
  }
  if (dishName) {
    query += ' AND dish_name LIKE ?';
    params.push(`%${dishName}%`);
  }
  if (startTime) {
    query += ' AND submit_time >= ?';
    params.push(startTime as string);
  }
  if (endTime) {
    query += ' AND submit_time <= ?';
    params.push(endTime as string);
  }

  query += ' ORDER BY submit_time DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

router.get('/:id', (req, res) => {
  db.get('SELECT * FROM replenish_orders WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (!row) {
      res.status(404).json({ error: '补货单不存在' });
    } else {
      res.json(row);
    }
  });
});

router.post('/', (req, res) => {
  const { outOfStockId, dishId, dishName, storeId, storeName, region, requestedQuantity, remark, submitterId, submitterName } = req.body;
  
  if (!outOfStockId || !dishId || !dishName || !storeId || !storeName || !region || !requestedQuantity || !submitterId || !submitterName) {
    return res.status(400).json({ error: '缺少必填字段' });
  }

  const id = generateId();
  const submitTime = getCurrentTime();

  db.run(
    'INSERT INTO replenish_orders (id, out_of_stock_id, dish_id, dish_name, store_id, store_name, region, requested_quantity, actual_quantity, status, remark, submitter_id, submitter_name, submit_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, outOfStockId, dishId, dishName, storeId, storeName, region, requestedQuantity, requestedQuantity, 'pending', remark || '', submitterId, submitterName, submitTime],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        db.run(
          'UPDATE out_of_stock_records SET replenish_order_id = ? WHERE id = ?',
          [id, outOfStockId]
        );
        db.run(
          'INSERT INTO operation_logs (id, type, target_id, action, operator_id, operator_name, operator_role, store_name, region, detail, operation_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [generateId(), 'replenish', id, '创建临时补货单', submitterId, submitterName, '区域督导', '区域督导', region, `为${storeName}创建${dishName}补货单，数量：${requestedQuantity}，备注：${remark || ''}`, submitTime]
        );
        res.status(201).json({ id, outOfStockId, dishId, dishName, storeId, storeName, region, requestedQuantity, actualQuantity: requestedQuantity, status: 'pending', remark, submitterId, submitterName, submitTime });
      }
    }
  );
});

router.put('/:id/confirm', (req, res) => {
  const { confirmerId, confirmerName } = req.body;
  
  if (!confirmerId || !confirmerName) {
    return res.status(400).json({ error: '缺少确认人信息' });
  }

  const confirmTime = getCurrentTime();

  db.get('SELECT * FROM replenish_orders WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: '补货单不存在' });
    }
    if ((row as { status: string }).status !== 'pending') {
      return res.status(400).json({ error: '只能确认待确认的补货单' });
    }

    const order = row as { dish_name: string; store_name: string; region: string };

    db.run(
      'UPDATE replenish_orders SET status = ?, confirmer_id = ?, confirmer_name = ?, confirm_time = ? WHERE id = ?',
      ['confirmed', confirmerId, confirmerName, confirmTime, req.params.id],
      (err) => {
        if (err) {
          res.status(500).json({ error: err.message });
        } else {
          db.run(
            'INSERT INTO operation_logs (id, type, target_id, action, operator_id, operator_name, operator_role, store_name, region, detail, operation_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [generateId(), 'replenish', req.params.id, '确认补货单', confirmerId, confirmerName, '采购', '采购部', '总部', `确认${order.store_name}${order.dish_name}补货单，安排配送`, confirmTime]
          );
          res.json({ status: 'confirmed', confirmerId, confirmerName, confirmTime });
        }
      }
    );
  });
});

router.put('/:id/complete', (req, res) => {
  const completionTime = getCurrentTime();

  db.get('SELECT * FROM replenish_orders WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: '补货单不存在' });
    }
    if ((row as { status: string }).status !== 'confirmed') {
      return res.status(400).json({ error: '只能完成已确认的补货单' });
    }

    const order = row as { dish_name: string; store_name: string; region: string; actual_quantity: number; confirmer_id: string; confirmer_name: string; out_of_stock_id: string };

    db.run(
      'UPDATE replenish_orders SET status = ?, completion_time = ? WHERE id = ?',
      ['completed', completionTime, req.params.id],
      (err) => {
        if (err) {
          res.status(500).json({ error: err.message });
        } else {
          db.run(
            'UPDATE out_of_stock_records SET status = ? WHERE replenish_order_id = ?',
            ['replenished', req.params.id]
          );
          db.run(
            'INSERT INTO operation_logs (id, type, target_id, action, operator_id, operator_name, operator_role, store_name, region, detail, operation_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [generateId(), 'replenish', req.params.id, '完成补货', order.confirmer_id, order.confirmer_name, '采购', '采购部', '总部', `${order.store_name}${order.dish_name}补货完成，数量：${order.actual_quantity}`, completionTime]
          );
          res.json({ status: 'completed', completionTime });
        }
      }
    );
  });
});

router.put('/:id/cancel', (req, res) => {
  const { cancelReason } = req.body;
  
  if (!cancelReason) {
    return res.status(400).json({ error: '缺少取消原因' });
  }

  const cancelTime = getCurrentTime();

  db.get('SELECT * FROM replenish_orders WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: '补货单不存在' });
    }
    if ((row as { status: string }).status === 'completed') {
      return res.status(400).json({ error: '已完成的补货单不能取消' });
    }

    const order = row as { dish_name: string; store_name: string; region: string; submitter_id: string; submitter_name: string; out_of_stock_id: string };

    db.run(
      'UPDATE replenish_orders SET status = ?, cancel_reason = ? WHERE id = ?',
      ['cancelled', cancelReason, req.params.id],
      (err) => {
        if (err) {
          res.status(500).json({ error: err.message });
        } else {
          db.run(
            'UPDATE out_of_stock_records SET status = ?, replenish_order_id = ? WHERE id = ?',
            ['approved', null, order.out_of_stock_id]
          );
          db.run(
            'INSERT INTO operation_logs (id, type, target_id, action, operator_id, operator_name, operator_role, store_name, region, detail, operation_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [generateId(), 'replenish', req.params.id, '取消补货单', order.submitter_id, order.submitter_name, '区域督导', '区域督导', order.region, `取消${order.store_name}${order.dish_name}补货单，原因：${cancelReason}`, cancelTime]
          );
          res.json({ status: 'cancelled', cancelReason });
        }
      }
    );
  });
});

export default router;
