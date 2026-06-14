const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/projects', (req, res) => {
  const { status, type, format, search, page = 1, limit = 20 } = req.query;
  let query = 'SELECT * FROM training_projects WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  if (format) {
    query += ' AND format = ?';
    params.push(format);
  }
  if (search) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY created_at DESC';

  const offset = (parseInt(page) - 1) * parseInt(limit);
  query += ` LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const projects = db.prepare(query).all(...params);

  const countQuery = 'SELECT COUNT(*) as total FROM training_projects WHERE 1=1' +
    (status ? ' AND status = ?' : '') +
    (type ? ' AND type = ?' : '') +
    (format ? ' AND format = ?' : '') +
    (search ? ' AND (name LIKE ? OR description LIKE ?)' : '');

  const countParams = [];
  if (status) countParams.push(status);
  if (type) countParams.push(type);
  if (format) countParams.push(format);
  if (search) countParams.push(`%${search}%`, `%${search}%`);

  const { total } = db.prepare(countQuery).get(...countParams);

  const projectsWithStats = projects.map(project => {
    const regStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'attended' THEN 1 ELSE 0 END) as attended,
        SUM(CASE WHEN status IN ('absent', 'cancelled') THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN status = 'registered' THEN 1 ELSE 0 END) as registered
      FROM training_registrations WHERE project_id = ?
    `).get(project.id);

    const certStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'issued' THEN 1 ELSE 0 END) as issued,
        SUM(CASE WHEN status NOT IN ('issued', 'cancelled', 'revoked') THEN 1 ELSE 0 END) as pending
      FROM certificates WHERE project_id = ?
    `).get(project.id);

    return {
      ...project,
      registration_stats: regStats,
      certificate_stats: certStats
    };
  });

  res.json({
    projects: projectsWithStats,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    }
  });
});

router.get('/projects/:id', (req, res) => {
  const { id } = req.params;

  const project = db.prepare('SELECT * FROM training_projects WHERE id = ?').get(id);
  if (!project) {
    return res.status(404).json({ error: '培训项目未找到' });
  }

  const registrations = db.prepare(`
    SELECT * FROM training_registrations WHERE project_id = ? ORDER BY registered_at DESC
  `).all(id);

  const certificates = db.prepare(`
    SELECT * FROM certificates WHERE project_id = ? ORDER BY created_at DESC
  `).all(id);

  const homeworks = db.prepare(`
    SELECT * FROM homework_submissions WHERE project_id = ? ORDER BY submission_date DESC
  `).all(id);

  const evaluation = db.prepare(`
    SELECT * FROM effect_evaluations WHERE project_id = ? ORDER BY created_at DESC LIMIT 1
  `).get(id);

  const exceptions = db.prepare(`
    SELECT * FROM exceptions WHERE project_id = ? ORDER BY created_at DESC
  `).all(id);

  res.json({
    project,
    registrations,
    certificates,
    homeworks,
    evaluation,
    exceptions
  });
});

router.post('/projects', (req, res) => {
  const { name, type, format, instructor_id, instructor_name, start_date, end_date, max_participants, description, created_by } = req.body;

  const result = db.prepare(`
    INSERT INTO training_projects (name, type, format, instructor_id, instructor_name, start_date, end_date, max_participants, description, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, type, format, instructor_id, instructor_name, start_date, end_date, max_participants, description, created_by);

  res.json({ id: result.lastInsertRowid, message: '培训项目创建成功' });
});

router.put('/projects/:id', (req, res) => {
  const { id } = req.params;
  const { status, ...otherFields } = req.body;

  if (status) {
    db.prepare('UPDATE training_projects SET status = ?, updated_at = datetime("now") WHERE id = ?').run(status, id);
  }

  if (Object.keys(otherFields).length > 0) {
    const fields = Object.keys(otherFields).map(key => `${key} = ?`).join(', ');
    const values = Object.values(otherFields);
    db.prepare(`UPDATE training_projects SET ${fields}, updated_at = datetime("now") WHERE id = ?`).run(...values, id);
  }

  res.json({ message: '培训项目更新成功' });
});

router.get('/registrations', (req, res) => {
  const { project_id, status, user_name, page = 1, limit = 20 } = req.query;
  let query = 'SELECT * FROM training_registrations WHERE 1=1';
  const params = [];

  if (project_id) {
    query += ' AND project_id = ?';
    params.push(project_id);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (user_name) {
    query += ' AND user_name LIKE ?';
    params.push(`%${user_name}%`);
  }

  query += ' ORDER BY registered_at DESC';
  const offset = (parseInt(page) - 1) * parseInt(limit);
  query += ` LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const registrations = db.prepare(query).all(...params);
  res.json({ registrations });
});

router.put('/registrations/:id', (req, res) => {
  const { id } = req.params;
  const { status, absence_reason, remarks } = req.body;

  db.prepare(`
    UPDATE training_registrations
    SET status = ?, absence_reason = ?, remarks = ?
    WHERE id = ?
  `).run(status, absence_reason || null, remarks || null, id);

  res.json({ message: '报名状态更新成功' });
});

module.exports = router;
