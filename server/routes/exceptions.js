const express = require('express');
const router = express.Router();
const { db } = require('../db');

function addLog(refType, refId, action, oldStatus, newStatus, remark, operatorId, operatorName) {
  db.prepare(`
    INSERT INTO operation_logs (ref_type, ref_id, action, old_status, new_status, remark, operator_id, operator_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(refType, refId, action, oldStatus, newStatus, remark, operatorId, operatorName);
}

router.get('/', (req, res) => {
  const { status, type, priority, customer_id, keyword, page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;

  let where = [];
  let params = [];

  if (status) {
    const statusList = status.split(',').filter(Boolean);
    if (statusList.length > 1) {
      const placeholders = statusList.map(() => '?').join(',');
      where.push(`e.status IN (${placeholders})`);
      params.push(...statusList);
    } else {
      where.push('e.status = ?');
      params.push(status);
    }
  }
  if (type) {
    const typeList = type.split(',').filter(Boolean);
    if (typeList.length > 1) {
      const placeholders = typeList.map(() => '?').join(',');
      where.push(`e.type IN (${placeholders})`);
      params.push(...typeList);
    } else {
      where.push('e.type = ?');
      params.push(type);
    }
  }
  if (priority) { where.push('e.priority = ?'); params.push(priority); }
  if (customer_id) { where.push('e.customer_id = ?'); params.push(customer_id); }
  if (keyword) {
    where.push('(e.title LIKE ? OR e.description LIKE ? OR c.name LIKE ? OR c.company_name LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM exceptions e
    LEFT JOIN customers c ON e.customer_id = c.id
    LEFT JOIN users u ON e.assigned_to = u.id
    LEFT JOIN users u2 ON e.created_by = u2.id
    LEFT JOIN tax_filings tf ON e.tax_filing_id = tf.id
    ${whereSql}
  `).get(...params).count;

  const list = db.prepare(`
    SELECT e.*, c.name as customer_name, c.company_name,
           u.name as assigned_name, u2.name as creator_name,
           tf.period as filing_period, tf.tax_type as filing_tax_type
    FROM exceptions e
    LEFT JOIN customers c ON e.customer_id = c.id
    LEFT JOIN users u ON e.assigned_to = u.id
    LEFT JOIN users u2 ON e.created_by = u2.id
    LEFT JOIN tax_filings tf ON e.tax_filing_id = tf.id
    ${whereSql}
    ORDER BY
      CASE e.priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'normal' THEN 3
        WHEN 'low' THEN 4
      END,
      e.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json({ list, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/stats', (req, res) => {
  const totalOpen = db.prepare("SELECT COUNT(*) as count FROM exceptions WHERE status IN ('open', 'processing')").get().count;
  const urgeCount = db.prepare("SELECT COUNT(*) as count FROM exceptions WHERE type = 'urge' AND status IN ('open', 'processing')").get().count;
  const rejectCount = db.prepare("SELECT COUNT(*) as count FROM exceptions WHERE type = 'reject' AND status IN ('open', 'processing')").get().count;
  const supplementCount = db.prepare("SELECT COUNT(*) as count FROM exceptions WHERE type = 'supplement' AND status IN ('open', 'processing')").get().count;
  const urgentCount = db.prepare("SELECT COUNT(*) as count FROM exceptions WHERE priority = 'urgent' AND status IN ('open', 'processing')").get().count;

  res.json({
    totalOpen,
    urgeCount,
    rejectCount,
    supplementCount,
    urgentCount,
  });
});

router.get('/:id', (req, res) => {
  const exception = db.prepare(`
    SELECT e.*, c.name as customer_name, c.company_name, c.industry,
           c.contact_person, c.contact_phone,
           u.name as assigned_name, u.role as assigned_role,
           u2.name as creator_name,
           tf.period as filing_period, tf.tax_type as filing_tax_type,
           tf.status as filing_status, tf.current_remark as filing_remark
    FROM exceptions e
    LEFT JOIN customers c ON e.customer_id = c.id
    LEFT JOIN users u ON e.assigned_to = u.id
    LEFT JOIN users u2 ON e.created_by = u2.id
    LEFT JOIN tax_filings tf ON e.tax_filing_id = tf.id
    WHERE e.id = ?
  `).get(req.params.id);

  if (!exception) return res.status(404).json({ error: '记录不存在' });

  const logs = db.prepare(`
    SELECT * FROM operation_logs
    WHERE ref_type = 'exception' AND ref_id = ?
    ORDER BY created_at DESC, id DESC
  `).all(req.params.id);

  res.json({ ...exception, logs });
});

router.post('/', (req, res) => {
  const {
    customer_id, tax_filing_id, type, title, description,
    priority = 'normal', related_remark, assigned_to,
    operator_id = 1, operator_name = '张会计'
  } = req.body;

  if (!customer_id || !type || !title) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  const validTypes = ['urge', 'reject', 'supplement'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: '无效的异常类型' });
  }

  const info = db.prepare(`
    INSERT INTO exceptions (customer_id, tax_filing_id, type, status, title, description, priority, related_remark, assigned_to, created_by)
    VALUES (?, ?, ?, 'open', ?, ?, ?, ?, ?, ?)
  `).run(
    customer_id, tax_filing_id || null, type,
    title, description || '', priority, related_remark || '',
    assigned_to || null, operator_id
  );

  const id = info.lastInsertRowid;

  const typeLabels = { urge: '催收提醒', reject: '退回异常', supplement: '补材料提醒' };
  addLog('exception', id, `创建${typeLabels[type]}`,
    null, 'open', description || '', operator_id, operator_name);

  const exception = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(id);
  res.json(exception);
});

router.put('/:id/status', (req, res) => {
  const { status, remark, operator_id = 1, operator_name = '张会计' } = req.body;

  const old = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(req.params.id);
  if (!old) return res.status(404).json({ error: '记录不存在' });

  const validStatuses = ['open', 'processing', 'resolved', 'closed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: '无效的状态值' });
  }

  const updateFields = ['status = ?'];
  const params = [status];

  if (remark !== undefined) {
    updateFields.push('description = ?');
    params.push(remark);
  }

  if (status === 'resolved' || status === 'closed') {
    updateFields.push('resolved_at = CURRENT_TIMESTAMP');
  } else {
    updateFields.push('resolved_at = NULL');
  }

  updateFields.push('updated_at = CURRENT_TIMESTAMP');
  params.push(req.params.id);

  db.prepare(`UPDATE exceptions SET ${updateFields.join(', ')} WHERE id = ?`).run(...params);

  const statusLabels = { open: '待处理', processing: '处理中', resolved: '已解决', closed: '已关闭' };
  const finalRemark = remark !== undefined ? remark : old.description;
  addLog('exception', req.params.id, `状态变更：${statusLabels[old.status]} → ${statusLabels[status]}`,
    old.status, status, finalRemark, operator_id, operator_name);

  const exception = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(req.params.id);
  res.json(exception);
});

router.post('/:id/action/:actionType', (req, res) => {
  const { remark, operator_id = 1, operator_name = '张会计' } = req.body;
  const { id, actionType } = req.params;

  const old = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(id);
  if (!old) return res.status(404).json({ error: '记录不存在' });

  const actions = {
    start: { status: 'processing', label: '开始处理' },
    resolve: { status: 'resolved', label: '标记解决' },
    close: { status: 'closed', label: '关闭' },
    reopen: { status: 'open', label: '重新打开' },
  };

  const action = actions[actionType];
  if (!action) return res.status(400).json({ error: '无效的操作类型' });

  const newDesc = remark || old.description;
  const resolvedAt = (actionType === 'resolve' || actionType === 'close')
    ? 'CURRENT_TIMESTAMP' : 'NULL';

  db.prepare(`
    UPDATE exceptions
    SET status = ?, description = ?, resolved_at = ${resolvedAt}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(action.status, newDesc, id);

  addLog('exception', id, action.label,
    old.status, action.status, newDesc, operator_id, operator_name);

  const exception = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(id);
  res.json(exception);
});

router.put('/:id/remark', (req, res) => {
  const { remark, operator_id = 1, operator_name = '张会计' } = req.body;

  const old = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(req.params.id);
  if (!old) return res.status(404).json({ error: '记录不存在' });

  db.prepare(`
    UPDATE exceptions SET description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(remark, req.params.id);

  addLog('exception', req.params.id, '更新描述',
    old.status, old.status, remark, operator_id, operator_name);

  if (old.tax_filing_id) {
    db.prepare(`
      UPDATE tax_filings SET current_remark = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(remark, old.tax_filing_id);
    addLog('tax_filing', old.tax_filing_id, '备注联动更新（来自异常提醒）',
      null, null, remark, operator_id, operator_name);
  }

  res.json({ success: true, linkedFiling: !!old.tax_filing_id });
});

module.exports = router;
