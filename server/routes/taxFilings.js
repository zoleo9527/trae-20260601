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
  const { status, period, tax_type, customer_id, keyword, page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;

  let where = [];
  let params = [];

  if (status) {
    const statusList = status.split(',').filter(Boolean);
    if (statusList.length > 1) {
      const placeholders = statusList.map(() => '?').join(',');
      where.push(`tf.status IN (${placeholders})`);
      params.push(...statusList);
    } else {
      where.push('tf.status = ?');
      params.push(status);
    }
  }
  if (period) { where.push('tf.period = ?'); params.push(period); }
  if (tax_type) { where.push('tf.tax_type = ?'); params.push(tax_type); }
  if (customer_id) { where.push('tf.customer_id = ?'); params.push(customer_id); }
  if (keyword) {
    where.push('(c.name LIKE ? OR c.company_name LIKE ? OR tf.current_remark LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM tax_filings tf
    LEFT JOIN customers c ON tf.customer_id = c.id
    LEFT JOIN users u ON c.accountant_id = u.id
    ${whereSql}
  `).get(...params).count;

  const list = db.prepare(`
    SELECT tf.*, c.name as customer_name, c.company_name, c.tax_type as customer_tax_type,
           u.name as accountant_name
    FROM tax_filings tf
    LEFT JOIN customers c ON tf.customer_id = c.id
    LEFT JOIN users u ON c.accountant_id = u.id
    ${whereSql}
    ORDER BY tf.due_date ASC, tf.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json({ list, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/:id', (req, res) => {
  const filing = db.prepare(`
    SELECT tf.*, c.name as customer_name, c.company_name, c.industry,
           c.contact_person, c.contact_phone, c.tax_type as customer_tax_type,
           u_acc.name as accountant_name, u_mgr.name as manager_name
    FROM tax_filings tf
    LEFT JOIN customers c ON tf.customer_id = c.id
    LEFT JOIN users u_acc ON c.accountant_id = u_acc.id
    LEFT JOIN users u_mgr ON c.manager_id = u_mgr.id
    WHERE tf.id = ?
  `).get(req.params.id);

  if (!filing) return res.status(404).json({ error: '记录不存在' });

  const relatedExceptions = db.prepare(`
    SELECT e.*, u.name as assigned_name
    FROM exceptions e
    LEFT JOIN users u ON e.assigned_to = u.id
    WHERE e.tax_filing_id = ?
    ORDER BY e.created_at DESC
  `).all(req.params.id);

  const logs = db.prepare(`
    SELECT * FROM operation_logs
    WHERE ref_type = 'tax_filing' AND ref_id = ?
    ORDER BY created_at DESC, id DESC
  `).all(req.params.id);

  res.json({ ...filing, relatedExceptions, logs });
});

router.post('/', (req, res) => {
  const { customer_id, period, tax_type, due_date, current_remark, operator_id = 1, operator_name = '张会计' } = req.body;

  if (!customer_id || !period || !tax_type) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  const info = db.prepare(`
    INSERT INTO tax_filings (customer_id, period, tax_type, status, due_date, current_remark, created_by)
    VALUES (?, ?, ?, 'pending', ?, ?, ?)
  `).run(customer_id, period, tax_type, due_date || null, current_remark || '', operator_id);

  const id = info.lastInsertRowid;
  addLog('tax_filing', id, '创建申报记录', null, 'pending', current_remark || '', operator_id, operator_name);

  const filing = db.prepare('SELECT * FROM tax_filings WHERE id = ?').get(id);
  res.json(filing);
});

router.put('/:id/status', (req, res) => {
  const { status, remark, operator_id = 1, operator_name = '张会计' } = req.body;

  const old = db.prepare('SELECT * FROM tax_filings WHERE id = ?').get(req.params.id);
  if (!old) return res.status(404).json({ error: '记录不存在' });

  const validStatuses = ['pending', 'in_progress', 'submitted', 'approved', 'rejected', 'completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: '无效的状态值' });
  }

  const newRemark = remark !== undefined ? remark : old.current_remark;

  db.prepare(`
    UPDATE tax_filings
    SET status = ?, current_remark = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, newRemark, req.params.id);

  const statusLabels = {
    pending: '待处理', in_progress: '处理中', submitted: '已提交',
    approved: '审核通过', rejected: '已退回', completed: '已完成'
  };

  addLog('tax_filing', req.params.id, `状态变更：${statusLabels[old.status]} → ${statusLabels[status]}`,
    old.status, status, newRemark, operator_id, operator_name);

  if (status === 'rejected') {
    const exceptionInfo = db.prepare(`
      INSERT INTO exceptions (customer_id, tax_filing_id, type, status, title, description, priority, related_remark, assigned_to, created_by)
      VALUES (?, ?, 'reject', 'open', ?, ?, 'high', ?, ?, ?)
    `).run(
      old.customer_id, req.params.id,
      `${old.period}申报被退回`,
      `申报状态变为已退回，备注：${newRemark || '无'}`,
      newRemark || '',
      1, operator_id
    );
    addLog('exception', exceptionInfo.lastInsertRowid, '自动创建异常（申报退回）',
      null, 'open', newRemark || '', operator_id, operator_name);
  }

  const filing = db.prepare('SELECT * FROM tax_filings WHERE id = ?').get(req.params.id);
  res.json(filing);
});

router.put('/:id/remark', (req, res) => {
  const { remark, operator_id = 1, operator_name = '张会计' } = req.body;

  const old = db.prepare('SELECT * FROM tax_filings WHERE id = ?').get(req.params.id);
  if (!old) return res.status(404).json({ error: '记录不存在' });

  db.prepare(`
    UPDATE tax_filings SET current_remark = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(remark, req.params.id);

  addLog('tax_filing', req.params.id, '更新备注',
    old.status, old.status, remark, operator_id, operator_name);

  const relatedExceptions = db.prepare(
    "SELECT id FROM exceptions WHERE tax_filing_id = ? AND status IN ('open', 'processing')"
  ).all(req.params.id);

  relatedExceptions.forEach(ex => {
    db.prepare(`
      UPDATE exceptions SET related_remark = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(remark, ex.id);
    addLog('exception', ex.id, '备注联动更新（来自税期申报）',
      null, null, remark, operator_id, operator_name);
  });

  res.json({ success: true, updatedRelated: relatedExceptions.length });
});

router.post('/:id/action/:actionType', (req, res) => {
  const { remark, operator_id = 1, operator_name = '张会计' } = req.body;
  const { id, actionType } = req.params;

  const old = db.prepare('SELECT * FROM tax_filings WHERE id = ?').get(id);
  if (!old) return res.status(404).json({ error: '记录不存在' });

  const actions = {
    start: { status: 'in_progress', label: '开始处理' },
    submit: { status: 'submitted', label: '提交申报' },
    approve: { status: 'approved', label: '审核通过' },
    reject: { status: 'rejected', label: '退回申报' },
    complete: { status: 'completed', label: '完成归档' },
    reopen: { status: 'pending', label: '重新打开' },
  };

  const action = actions[actionType];
  if (!action) return res.status(400).json({ error: '无效的操作类型' });

  const newRemark = remark || old.current_remark;

  db.prepare(`
    UPDATE tax_filings
    SET status = ?, current_remark = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(action.status, newRemark, id);

  addLog('tax_filing', id, action.label,
    old.status, action.status, newRemark, operator_id, operator_name);

  if (actionType === 'reject') {
    const exInfo = db.prepare(`
      INSERT INTO exceptions (customer_id, tax_filing_id, type, status, title, description, priority, related_remark, assigned_to, created_by)
      VALUES (?, ?, 'reject', 'open', ?, ?, 'high', ?, ?, ?)
    `).run(
      old.customer_id, id,
      `${old.period}申报被退回`,
      newRemark || '申报被退回，需重新处理',
      newRemark || '',
      1, operator_id
    );
    addLog('exception', exInfo.lastInsertRowid, '自动创建异常（申报退回）',
      null, 'open', newRemark, operator_id, operator_name);
  }

  const filing = db.prepare('SELECT * FROM tax_filings WHERE id = ?').get(id);
  res.json(filing);
});

module.exports = router;
