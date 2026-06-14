const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const { status, project_id, user_name, search, page = 1, limit = 20 } = req.query;
  let query = 'SELECT * FROM certificates WHERE 1=1';
  const params = [];

  if (status) {
    if (status === 'pending') {
      query += ' AND status IN ("pending", "creating", "pending_review")';
    } else if (status === 'issued') {
      query += ' AND status = "issued"';
    } else if (status === 'abnormal') {
      query += ' AND status IN ("needs_correction", "cancelled", "revoked")';
    } else {
      query += ' AND status = ?';
      params.push(status);
    }
  }
  if (project_id) {
    query += ' AND project_id = ?';
    params.push(project_id);
  }
  if (user_name) {
    query += ' AND user_name LIKE ?';
    params.push(`%${user_name}%`);
  }
  if (search) {
    query += ' AND (user_name LIKE ? OR certificate_number LIKE ? OR user_department LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY created_at DESC';
  const offset = (parseInt(page) - 1) * parseInt(limit);
  query += ` LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const certificates = db.prepare(query).all(...params);

  const countQuery = 'SELECT COUNT(*) as total FROM certificates WHERE 1=1' +
    (status ? (status === 'pending' ? ' AND status IN ("pending", "creating", "pending_review")' :
               status === 'issued' ? ' AND status = "issued"' :
               status === 'abnormal' ? ' AND status IN ("needs_correction", "cancelled", "revoked")' :
               ' AND status = ?') : '');

  const countParams = status && !['pending', 'issued', 'abnormal'].includes(status) ? [status] : [];
  const { total } = db.prepare(countQuery).get(...countParams);

  const stats = {
    total: db.prepare('SELECT COUNT(*) as count FROM certificates').get().count,
    pending: db.prepare('SELECT COUNT(*) as count FROM certificates WHERE status IN ("pending", "creating", "pending_review")').get().count,
    issued: db.prepare('SELECT COUNT(*) as count FROM certificates WHERE status = "issued"').get().count,
    abnormal: db.prepare('SELECT COUNT(*) as count FROM certificates WHERE status IN ("needs_correction", "cancelled", "revoked")').get().count
  };

  res.json({
    certificates,
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

  const certificate = db.prepare('SELECT * FROM certificates WHERE id = ?').get(id);
  if (!certificate) {
    return res.status(404).json({ error: '证书未找到' });
  }

  const history = db.prepare(`
    SELECT * FROM certificate_history WHERE certificate_id = ? ORDER BY created_at ASC
  `).all(id);

  const project = db.prepare('SELECT * FROM training_projects WHERE id = ?').get(certificate.project_id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(certificate.user_id);

  const relatedExceptions = db.prepare(`
    SELECT * FROM exceptions WHERE project_id = ? ORDER BY created_at DESC
  `).all(certificate.project_id);

  res.json({
    certificate,
    history,
    project,
    user,
    relatedExceptions
  });
});

router.get('/:id/history', (req, res) => {
  const { id } = req.params;

  const history = db.prepare(`
    SELECT * FROM certificate_history WHERE certificate_id = ? ORDER BY created_at ASC
  `).all(id);

  res.json({ history });
});

router.post('/', (req, res) => {
  const { project_id, project_name, user_id, user_name, user_department, created_by } = req.body;

  const lastCert = db.prepare('SELECT certificate_number FROM certificates ORDER BY id DESC LIMIT 1').get();
  let nextNum = 1;
  if (lastCert) {
    const match = lastCert.certificate_number.match(/CERT-(\d+)-(\d+)/);
    if (match) {
      nextNum = parseInt(match[2]) + 1;
    }
  }
  const certificate_number = `CERT-${new Date().getFullYear()}-${String(nextNum).padStart(4, '0')}`;

  const result = db.prepare(`
    INSERT INTO certificates (certificate_number, project_id, project_name, user_id, user_name, user_department, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
  `).run(certificate_number, project_id, project_name, user_id, user_name, user_department, created_by);

  const certId = result.lastInsertRowid;

  db.prepare(`
    INSERT INTO certificate_history (certificate_id, action, to_status, operator_id, operator_name, remark)
    VALUES (?, 'auto_generated', 'pending', ?, '系统', '系统自动生成待发放记录')
  `).run(certId, created_by);

  res.json({ id: certId, certificate_number, message: '证书创建成功' });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { status, remark, operator_id, operator_name, correction_reason, revoke_reason } = req.body;

  const certificate = db.prepare('SELECT * FROM certificates WHERE id = ?').get(id);
  if (!certificate) {
    return res.status(404).json({ error: '证书未找到' });
  }

  const oldStatus = certificate.status;

  let updateFields = 'status = ?, updated_at = datetime("now")';
  let updateValues = [status];

  if (correction_reason) {
    updateFields += ', correction_reason = ?';
    updateValues.push(correction_reason);
  }
  if (revoke_reason) {
    updateFields += ', revoke_reason = ?';
    updateValues.push(revoke_reason);
  }
  if (status === 'issued') {
    updateFields += ', issue_date = date("now")';
  }
  if (status === 'issued' && operator_id) {
    updateFields += ', issued_by = ?';
    updateValues.push(operator_id);
  }

  updateValues.push(id);
  db.prepare(`UPDATE certificates SET ${updateFields} WHERE id = ?`).run(...updateValues);

  const actionMap = {
    'creating': 'created',
    'pending_review': 'submitted',
    'needs_correction': 'info_error_detected',
    'approved': 'approved',
    'issued': 'issued',
    'cancelled': 'cancelled',
    'revoked': 'revoked'
  };

  db.prepare(`
    INSERT INTO certificate_history (certificate_id, action, from_status, to_status, operator_id, operator_name, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, actionMap[status] || 'status_changed', oldStatus, status, operator_id, operator_name, remark);

  if (['issued', 'cancelled', 'revoked'].includes(status)) {
    recalculateEffectEvaluation(certificate.project_id, {
      type: 'certificate_status_change',
      certificate_id: id,
      old_status: oldStatus,
      new_status: status,
      remark
    });
  }

  res.json({
    message: '证书状态更新成功',
    oldStatus,
    newStatus: status
  });
});

router.post('/batch', (req, res) => {
  const { certificate_ids, action, operator_id, operator_name, remark } = req.body;

  if (!certificate_ids || !Array.isArray(certificate_ids) || certificate_ids.length === 0) {
    return res.status(400).json({ error: '请选择要处理的证书' });
  }

  const results = [];
  const affectedProjects = new Set();

  certificate_ids.forEach(id => {
    const certificate = db.prepare('SELECT * FROM certificates WHERE id = ?').get(id);
    if (certificate) {
      affectedProjects.add(certificate.project_id);

      db.prepare(`UPDATE certificates SET status = ?, updated_at = datetime("now") WHERE id = ?`).run(action, id);

      db.prepare(`
        INSERT INTO certificate_history (certificate_id, action, from_status, to_status, operator_id, operator_name, remark)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, action, certificate.status, action, operator_id, operator_name, remark);

      results.push({ id, status: action });
    }
  });

  affectedProjects.forEach(projectId => {
    recalculateEffectEvaluation(projectId, {
      type: 'batch_status_change',
      action,
      count: certificate_ids.length
    });
  });

  res.json({
    message: `成功处理 ${results.length} 张证书`,
    results
  });
});

function recalculateEffectEvaluation(projectId, trigger) {
  try {
    const totalRegistered = db.prepare(`
      SELECT COUNT(*) as count FROM training_registrations WHERE project_id = ? AND status = 'attended'
    `).get(projectId).count;

    if (totalRegistered === 0) return;

    const totalIssued = db.prepare(`
      SELECT COUNT(*) as count FROM certificates WHERE project_id = ? AND status = 'issued'
    `).get(projectId).count;

    const totalCancelled = db.prepare(`
      SELECT COUNT(*) as count FROM certificates WHERE project_id = ? AND status IN ('cancelled', 'revoked')
    `).get(projectId).count;

    const issuanceRate = (totalIssued / totalRegistered) * 100;
    const passRate = ((totalIssued - totalCancelled) / totalRegistered) * 100;

    db.prepare(`
      UPDATE effect_evaluations
      SET issuance_rate = ?, pass_rate = ?, report_status = 'published', last_recalculated_at = datetime("now"), recalculate_trigger = ?, updated_at = datetime("now")
      WHERE project_id = ?
    `).run(issuanceRate, passRate, JSON.stringify(trigger), projectId);

    console.log(`项目 ${projectId} 效果评估已重新计算: 发放率=${issuanceRate.toFixed(2)}%, 通过率=${passRate.toFixed(2)}%`);
  } catch (error) {
    console.error('重新计算效果评估失败:', error);
  }
}

module.exports = router;
