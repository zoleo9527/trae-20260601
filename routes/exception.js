const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const { type, status, priority, project_id, page = 1, limit = 20 } = req.query;
  let query = 'SELECT * FROM exceptions WHERE 1=1';
  const params = [];

  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (priority) {
    query += ' AND priority = ?';
    params.push(priority);
  }
  if (project_id) {
    query += ' AND project_id = ?';
    params.push(project_id);
  }

  query += ' ORDER BY created_at DESC';
  const offset = (parseInt(page) - 1) * parseInt(limit);
  query += ` LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const exceptions = db.prepare(query).all(...params);

  const countQuery = 'SELECT COUNT(*) as total FROM exceptions WHERE 1=1' +
    (type ? ' AND type = ?' : '') +
    (status ? ' AND status = ?' : '') +
    (priority ? ' AND priority = ?' : '') +
    (project_id ? ' AND project_id = ?' : '');

  const countParams = [];
  if (type) countParams.push(type);
  if (status) countParams.push(status);
  if (priority) countParams.push(priority);
  if (project_id) countParams.push(project_id);

  const { total } = db.prepare(countQuery).get(...countParams);

  const stats = {
    total: db.prepare('SELECT COUNT(*) as count FROM exceptions').get().count,
    discovered: db.prepare('SELECT COUNT(*) as count FROM exceptions WHERE status = "discovered"').get().count,
    assigned: db.prepare('SELECT COUNT(*) as count FROM exceptions WHERE status = "assigned"').get().count,
    processing: db.prepare('SELECT COUNT(*) as count FROM exceptions WHERE status = "processing"').get().count,
    resolved: db.prepare('SELECT COUNT(*) as count FROM exceptions WHERE status = "resolved"').get().count
  };

  res.json({
    exceptions,
    stats,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    }
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;

  const exception = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(id);
  if (!exception) {
    return res.status(404).json({ error: '异常记录未找到' });
  }

  const history = db.prepare(`
    SELECT * FROM exception_history WHERE exception_id = ? ORDER BY created_at ASC
  `).all(id);

  const project = db.prepare('SELECT * FROM training_projects WHERE id = ?').get(exception.project_id);

  res.json({
    exception,
    history,
    project
  });
});

router.get('/:id/history', (req, res) => {
  const { id } = req.params;

  const history = db.prepare(`
    SELECT * FROM exception_history WHERE exception_id = ? ORDER BY created_at ASC
  `).all(id);

  res.json({ history });
});

router.post('/', (req, res) => {
  const {
    type, project_id, project_name, description, priority,
    discovered_by, discovered_by_name, assigned_to, assigned_to_name
  } = req.body;

  const lastExc = db.prepare("SELECT exception_number FROM exceptions ORDER BY id DESC LIMIT 1").get();
  let nextNum = 1;
  if (lastExc) {
    const match = lastExc.exception_number.match(/EXC-(\d+)-(\d+)/);
    if (match) {
      nextNum = parseInt(match[2]) + 1;
    }
  }
  const exception_number = `EXC-${new Date().getFullYear()}-${String(nextNum).padStart(4, '0')}`;

  const result = db.prepare(`
    INSERT INTO exceptions (exception_number, type, project_id, project_name, description, status, priority, discovered_by, discovered_by_name, assigned_to, assigned_to_name)
    VALUES (?, ?, ?, ?, ?, 'discovered', ?, ?, ?, ?, ?)
  `).run(exception_number, type, project_id, project_name, description, priority || 'medium', discovered_by, discovered_by_name, assigned_to || null, assigned_to_name || null);

  const excId = result.lastInsertRowid;

  db.prepare(`
    INSERT INTO exception_history (exception_id, action, operator_id, operator_name, remark)
    VALUES (?, 'discovered', ?, ?, '异常被标记')
  `).run(excId, discovered_by, discovered_by_name);

  if (assigned_to) {
    db.prepare(`
      INSERT INTO exception_history (exception_id, action, operator_id, operator_name, remark)
      VALUES (?, 'assigned', ?, ?, '已分配处理人')
    `).run(excId, discovered_by, discovered_by_name);
  }

  if (type === 'certificate_error' || type === 'certificate_duplicate' || type === 'certificate_missed') {
    db.prepare(`
      UPDATE effect_evaluations
      SET report_status = 'frozen',
          frozen_reason = '存在未解决的证书异常，数据待核查',
          updated_at = datetime('now')
      WHERE project_id = ?
    `).run(project_id);
  }

  res.json({ id: excId, exception_number, message: '异常记录创建成功' });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { status, assigned_to, assigned_to_name, resolution, resolved_by, resolved_by_name, remark, operator_id, operator_name } = req.body;

  const exception = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(id);
  if (!exception) {
    return res.status(404).json({ error: '异常记录未找到' });
  }

  let updateFields = '';
  const updateValues = [];

  if (status) {
    updateFields += 'status = ?';
    updateValues.push(status);

    if (status === 'assigned' && assigned_to) {
      updateFields += ', assigned_to = ?, assigned_to_name = ?';
      updateValues.push(assigned_to, assigned_to_name);
    }

    if (status === 'resolved') {
      updateFields += ', resolution = ?, resolved_by = ?, resolved_by_name = ?, resolved_at = datetime("now")';
      updateValues.push(resolution, resolved_by, resolved_by_name);
    }
  }

  if (updateValues.length > 0) {
    updateValues.push(id);
    db.prepare(`UPDATE exceptions SET ${updateFields} WHERE id = ?`).run(...updateValues);
  }

  if (status) {
    let action = '';
    let actionRemark = remark || '';

    switch (status) {
      case 'assigned':
        action = 'assigned';
        actionRemark = actionRemark || `已分配给 ${assigned_to_name}`;
        break;
      case 'processing':
        action = 'processing_started';
        actionRemark = actionRemark || '开始处理异常';
        break;
      case 'resolved':
        action = 'resolved';
        actionRemark = actionRemark || resolution;
        break;
      case 'closed':
        action = 'closed';
        actionRemark = actionRemark || '异常已关闭';
        break;
      default:
        action = 'status_changed';
    }

    db.prepare(`
      INSERT INTO exception_history (exception_id, action, operator_id, operator_name, remark)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, action, operator_id || resolved_by, operator_name || resolved_by_name, actionRemark);

    if (status === 'resolved' && (exception.type === 'certificate_error' || exception.type === 'certificate_duplicate' || exception.type === 'certificate_missed')) {
      const unresolvedCount = db.prepare(`
        SELECT COUNT(*) as count FROM exceptions
        WHERE project_id = ? AND type LIKE 'certificate_%' AND status NOT IN ('resolved', 'closed')
      `).get(exception.project_id).count;

      if (unresolvedCount === 0) {
        db.prepare(`
          UPDATE effect_evaluations
          SET report_status = 'draft',
              frozen_reason = NULL,
              updated_at = datetime('now')
          WHERE project_id = ?
        `).run(exception.project_id);

        const { recalculateEffectEvaluation } = require('./evaluation');
      }
    }
  }

  res.json({
    message: '异常状态更新成功',
    exception: db.prepare('SELECT * FROM exceptions WHERE id = ?').get(id)
  });
});

module.exports = router;
