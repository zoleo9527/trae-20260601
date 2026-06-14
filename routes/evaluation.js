const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const { project_id, report_status, page = 1, limit = 20 } = req.query;
  let query = 'SELECT * FROM effect_evaluations WHERE 1=1';
  const params = [];

  if (project_id) {
    query += ' AND project_id = ?';
    params.push(project_id);
  }
  if (report_status) {
    query += ' AND report_status = ?';
    params.push(report_status);
  }

  query += ' ORDER BY created_at DESC';
  const offset = (parseInt(page) - 1) * parseInt(limit);
  query += ` LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const evaluations = db.prepare(query).all(...params);

  const stats = {
    total: db.prepare('SELECT COUNT(*) as count FROM effect_evaluations').get().count,
    published: db.prepare('SELECT COUNT(*) as count FROM effect_evaluations WHERE report_status = "published"').get().count,
    draft: db.prepare('SELECT COUNT(*) as count FROM effect_evaluations WHERE report_status = "draft"').get().count,
    frozen: db.prepare('SELECT COUNT(*) as count FROM effect_evaluations WHERE report_status = "frozen"').get().count
  };

  const avgScores = db.prepare(`
    SELECT
      AVG(satisfaction_score) as avg_satisfaction,
      AVG(completion_rate) as avg_completion,
      AVG(pass_rate) as avg_pass,
      AVG(issuance_rate) as avg_issuance
    FROM effect_evaluations WHERE report_status = 'published'
  `).get();

  res.json({
    evaluations,
    stats,
    avgScores,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: stats.total,
      totalPages: Math.ceil(stats.total / parseInt(limit))
    }
  });
});

router.get('/statistics', (req, res) => {
  const { start_date, end_date, department } = req.query;

  const monthlyTrend = db.prepare(`
    SELECT
      strftime('%Y-%m', published_at) as month,
      AVG(satisfaction_score) as avg_satisfaction,
      AVG(completion_rate) as avg_completion,
      AVG(pass_rate) as avg_pass,
      COUNT(*) as total_projects
    FROM effect_evaluations
    WHERE report_status = 'published'
    GROUP BY strftime('%Y-%m', published_at)
    ORDER BY month DESC
    LIMIT 12
  `).all();

  const projectTypeStats = db.prepare(`
    SELECT
      tp.type,
      COUNT(DISTINCT tp.id) as project_count,
      AVG(ee.satisfaction_score) as avg_satisfaction,
      AVG(ee.completion_rate) as avg_completion
    FROM training_projects tp
    LEFT JOIN effect_evaluations ee ON tp.id = ee.project_id
    GROUP BY tp.type
  `).all();

  const instructorStats = db.prepare(`
    SELECT
      tp.instructor_name,
      COUNT(DISTINCT tp.id) as project_count,
      AVG(ee.satisfaction_score) as avg_satisfaction,
      AVG(ee.issuance_rate) as avg_issuance
    FROM training_projects tp
    LEFT JOIN effect_evaluations ee ON tp.id = ee.project_id
    GROUP BY tp.instructor_name
  `).all();

  res.json({
    monthlyTrend,
    projectTypeStats,
    instructorStats
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;

  const evaluation = db.prepare('SELECT * FROM effect_evaluations WHERE id = ?').get(id);
  if (!evaluation) {
    return res.status(404).json({ error: '效果评估未找到' });
  }

  const project = db.prepare('SELECT * FROM training_projects WHERE id = ?').get(evaluation.project_id);

  const certificates = db.prepare(`
    SELECT
      status,
      COUNT(*) as count
    FROM certificates
    WHERE project_id = ?
    GROUP BY status
  `).all(evaluation.project_id);

  const registrations = db.prepare(`
    SELECT
      status,
      COUNT(*) as count
    FROM training_registrations
    WHERE project_id = ?
    GROUP BY status
  `).all(evaluation.project_id);

  const exceptions = db.prepare(`
    SELECT * FROM exceptions WHERE project_id = ? ORDER BY created_at DESC
  `).all(evaluation.project_id);

  res.json({
    evaluation,
    project,
    certificates: certificates.reduce((acc, curr) => {
      acc[curr.status] = curr.count;
      return acc;
    }, {}),
    registrations: registrations.reduce((acc, curr) => {
      acc[curr.status] = curr.count;
      return acc;
    }, {}),
    exceptions
  });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { satisfaction_score, behavior_change_score, performance_improvement, report_status, frozen_reason } = req.body;

  const evaluation = db.prepare('SELECT * FROM effect_evaluations WHERE id = ?').get(id);
  if (!evaluation) {
    return res.status(404).json({ error: '效果评估未找到' });
  }

  let updateFields = 'updated_at = datetime("now")';
  const updateValues = [];

  if (satisfaction_score !== undefined) {
    updateFields += ', satisfaction_score = ?';
    updateValues.push(satisfaction_score);
  }
  if (behavior_change_score !== undefined) {
    updateFields += ', behavior_change_score = ?';
    updateValues.push(behavior_change_score);
  }
  if (performance_improvement !== undefined) {
    updateFields += ', performance_improvement = ?';
    updateValues.push(performance_improvement);
  }
  if (report_status !== undefined) {
    updateFields += ', report_status = ?';
    updateValues.push(report_status);
    if (report_status === 'published') {
      updateFields += ', published_at = datetime("now")';
    }
  }
  if (frozen_reason !== undefined) {
    updateFields += ', frozen_reason = ?';
    updateValues.push(frozen_reason);
  }

  updateValues.push(id);
  db.prepare(`UPDATE effect_evaluations SET ${updateFields} WHERE id = ?`).run(...updateValues);

  res.json({ message: '效果评估更新成功' });
});

router.post('/recalculate/:projectId', (req, res) => {
  const { projectId } = req.params;
  const { reason } = req.body;

  const project = db.prepare('SELECT * FROM training_projects WHERE id = ?').get(projectId);
  if (!project) {
    return res.status(404).json({ error: '培训项目未找到' });
  }

  const totalRegistered = db.prepare(`
    SELECT COUNT(*) as count FROM training_registrations WHERE project_id = ? AND status = 'attended'
  `).get(projectId).count;

  const completionRate = db.prepare(`
    SELECT
      CASE
        WHEN COUNT(*) = 0 THEN 0
        ELSE (SUM(CASE WHEN status = 'attended' THEN 1 ELSE 0 END) * 100.0 / COUNT(*))
      END as rate
    FROM training_registrations WHERE project_id = ?
  `).get(projectId).rate;

  const totalIssued = db.prepare(`
    SELECT COUNT(*) as count FROM certificates WHERE project_id = ? AND status = 'issued'
  `).get(projectId).count;

  const totalCancelled = db.prepare(`
    SELECT COUNT(*) as count FROM certificates WHERE project_id = ? AND status IN ('cancelled', 'revoked')
  `).get(projectId).count;

  const issuanceRate = totalRegistered > 0 ? (totalIssued / totalRegistered) * 100 : 0;
  const passRate = totalRegistered > 0 ? ((totalIssued - totalCancelled) / totalRegistered) * 100 : 0;

  db.prepare(`
    UPDATE effect_evaluations
    SET completion_rate = ?,
        issuance_rate = ?,
        pass_rate = ?,
        report_status = 'published',
        published_at = datetime('now'),
        last_recalculated_at = datetime('now'),
        recalculate_trigger = ?,
        updated_at = datetime('now')
    WHERE project_id = ?
  `).run(completionRate, issuanceRate, passRate, JSON.stringify({ reason, triggered_at: new Date().toISOString() }), projectId);

  const evaluation = db.prepare('SELECT * FROM effect_evaluations WHERE project_id = ?').get(projectId);

  res.json({
    message: '效果评估重新计算完成',
    evaluation,
    details: {
      completion_rate: completionRate.toFixed(2),
      issuance_rate: issuanceRate.toFixed(2),
      pass_rate: passRate.toFixed(2)
    }
  });
});

module.exports = router;
