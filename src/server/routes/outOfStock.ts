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
  
  let query = 'SELECT * FROM out_of_stock_records WHERE 1=1';
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
  db.get('SELECT * FROM out_of_stock_records WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (!row) {
      res.status(404).json({ error: '记录不存在' });
    } else {
      res.json(row);
    }
  });
});

router.post('/', (req, res) => {
  const { dishId, dishName, storeId, storeName, region, quantity, reason, remark, submitterId, submitterName } = req.body;
  
  if (!dishId || !dishName || !storeId || !storeName || !region || !quantity || !reason || !submitterId || !submitterName) {
    return res.status(400).json({ error: '缺少必填字段' });
  }

  const id = generateId();
  const submitTime = getCurrentTime();

  db.run(
    'INSERT INTO out_of_stock_records (id, dish_id, dish_name, store_id, store_name, region, quantity, reason, remark, status, submitter_id, submitter_name, submit_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, dishId, dishName, storeId, storeName, region, quantity, reason, remark || '', 'pending', submitterId, submitterName, submitTime],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        db.run(
          'INSERT INTO operation_logs (id, type, target_id, action, operator_id, operator_name, operator_role, store_name, region, detail, operation_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [generateId(), 'out_of_stock', id, '提交售罄申请', submitterId, submitterName, '店长', storeName, region, `菜品：${dishName}，数量：${quantity}份，原因：${reason}，备注：${remark || ''}`', submitTime]
        );
        res.status(201).json({ id, dishId, dishName, storeId, storeName, region, quantity, reason, remark, status: 'pending', submitterId, submitterName, submitTime });
      }
    }
  );
});

router.put('/:id/approve', (req, res) => {
  const { approverId, approverName } = req.body;
  
  if (!approverId || !approverName) {
    return res.status(400).json({ error: '缺少审核人信息' });
  }

  const approveTime = getCurrentTime();

  db.get('SELECT * FROM out_of_stock_records WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: '记录不存在' });
    }
    if ((row as { status: string }).status !== 'pending') {
      return res.status(400).json({ error: '只能处理待审核的记录' });
    }

    const record = row as { dish_name: string; store_name: string; region: string };

    db.run(
      'UPDATE out_of_stock_records SET status = ?, approver_id = ?, approver_name = ?, approve_time = ? WHERE id = ?',
      ['approved', approverId, approverName, approveTime, req.params.id],
      (err) => {
        if (err) {
          res.status(500).json({ error: err.message });
        } else {
          db.run(
            'INSERT INTO operation_logs (id, type, target_id, action, operator_id, operator_name, operator_role, store_name, region, detail, operation_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [generateId(), 'out_of_stock', req.params.id, '确认售罄申请', approverId, approverName, '区域督导', '区域督导', record.region, `同意${record.store_name}的${record.dish_name}售罄申请，已生成临时补货单`, approveTime]
          );
          res.json({ status: 'approved', approverId, approverName, approveTime });
        }
      }
    );
  });
});

router.put('/:id/reject', (req, res) => {
  const { approverId, approverName, rejectReason } = req.body;
  
  if (!approverId || !approverName || !rejectReason) {
    return res.status(400).json({ error: '缺少审核人信息或驳回原因' });
  }

  const approveTime = getCurrentTime();

  db.get('SELECT * FROM out_of_stock_records WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: '记录不存在' });
    }
    if ((row as { status: string }).status !== 'pending') {
      return res.status(400).json({ error: '只能处理待审核的记录' });
    }

    const record = row as { dish_name: string; store_name: string; region: string };

    db.run(
      'UPDATE out_of_stock_records SET status = ?, approver_id = ?, approver_name = ?, approve_time = ?, reject_reason = ? WHERE id = ?',
      ['rejected', approverId, approverName, approveTime, rejectReason, req.params.id],
      (err) => {
        if (err) {
          res.status(500).json({ error: err.message });
        } else {
          db.run(
            'INSERT INTO operation_logs (id, type, target_id, action, operator_id, operator_name, operator_role, store_name, region, detail, operation_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [generateId(), 'out_of_stock', req.params.id, '驳回售罄申请', approverId, approverName, '区域督导', '区域督导', record.region, `驳回${record.store_name}${record.dish_name}售罄申请，原因：${rejectReason}`, approveTime]
          );
          res.json({ status: 'rejected', approverId, approverName, approveTime, rejectReason });
        }
      }
    );
  });
});

router.put('/:id/close', (req, res) => {
  const closeTime = getCurrentTime();

  db.get('SELECT * FROM out_of_stock_records WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: '记录不存在' });
    }
    if ((row as { status: string }).status !== 'replenished') {
      return res.status(400).json({ error: '只能关闭已补货的记录' });
    }

    const record = row as { dish_name: string; store_name: string; region: string; submitter_id: string; submitter_name: string };

    db.run(
      'UPDATE out_of_stock_records SET status = ?, close_time = ? WHERE id = ?',
      ['closed', closeTime, req.params.id],
      (err) => {
        if (err) {
          res.status(500).json({ error: err.message });
        } else {
          db.run(
            'INSERT INTO operation_logs (id, type, target_id, action, operator_id, operator_name, operator_role, store_name, region, detail, operation_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [generateId(), 'out_of_stock', req.params.id, '关闭售罄记录', record.submitter_id, record.submitter_name, '店长', record.store_name, record.region, `关闭${record.dish_name}售罄记录，状态已更新为已完成`, closeTime]
          );
          res.json({ status: 'closed', closeTime });
        }
      }
    );
  });
});

export default router;
