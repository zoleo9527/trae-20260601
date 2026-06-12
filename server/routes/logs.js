const express = require('express');
const router = express.Router();
const { db } = require('../db');

router.get('/', (req, res) => {
  const { ref_type, ref_id } = req.query;

  let where = [];
  let params = [];

  if (ref_type) { where.push('ref_type = ?'); params.push(ref_type); }
  if (ref_id) { where.push('ref_id = ?'); params.push(ref_id); }

  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const logs = db.prepare(`
    SELECT * FROM operation_logs
    ${whereSql}
    ORDER BY created_at DESC, id DESC
    LIMIT 200
  `).all(...params);

  res.json(logs);
});

router.post('/', (req, res) => {
  const { ref_type, ref_id, action, old_status, new_status, remark, operator_id = 1, operator_name = '系统' } = req.body;

  if (!ref_type || !ref_id || !action) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  const info = db.prepare(`
    INSERT INTO operation_logs (ref_type, ref_id, action, old_status, new_status, remark, operator_id, operator_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(ref_type, ref_id, action, old_status || null, new_status || null, remark || '', operator_id, operator_name);

  res.json({ id: info.lastInsertRowid, success: true });
});

module.exports = router;
