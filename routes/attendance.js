const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const { project_id, status } = req.query;
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

  query += ' ORDER BY registered_at DESC';

  const registrations = db.prepare(query).all(...params);

  res.json({ registrations });
});

router.put('/:id/check-in', (req, res) => {
  const { id } = req.params;
  const { operator_id, remarks } = req.body;

  db.prepare(`
    UPDATE training_registrations
    SET status = 'attended',
        check_in_time = datetime('now'),
        remarks = ?
    WHERE id = ?
  `).run(remarks || null, id);

  const registration = db.prepare('SELECT * FROM training_registrations WHERE id = ?').get(id);

  res.json({
    message: '签到成功',
    registration
  });
});

router.put('/:id/check-out', (req, res) => {
  const { id } = req.params;

  db.prepare(`
    UPDATE training_registrations
    SET check_out_time = datetime('now')
    WHERE id = ?
  `).run(id);

  const registration = db.prepare('SELECT * FROM training_registrations WHERE id = ?').get(id);

  res.json({
    message: '签退成功',
    registration
  });
});

module.exports = router;
