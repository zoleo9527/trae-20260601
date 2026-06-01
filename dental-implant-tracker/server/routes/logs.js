import express from 'express';
import { verifyToken } from '../auth.js';
import db from '../db.js';

const router = express.Router();

router.get('/', verifyToken, (req, res) => {
  const { patient_id, user_id, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let sql = 'SELECT * FROM operation_logs WHERE 1=1';
  let countSql = 'SELECT COUNT(*) as total FROM operation_logs WHERE 1=1';
  const params = [];
  const countParams = [];

  if (patient_id) {
    sql += ' AND patient_id = ?';
    countSql += ' AND patient_id = ?';
    params.push(patient_id);
    countParams.push(patient_id);
  }
  if (user_id) {
    sql += ' AND user_id = ?';
    countSql += ' AND user_id = ?';
    params.push(user_id);
    countParams.push(user_id);
  }

  const { total } = db.prepare(countSql).get(...countParams);

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const logs = db.prepare(sql).all(...params);

  res.json({
    logs,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      total_pages: Math.ceil(total / parseInt(limit))
    }
  });
});

export default router;
