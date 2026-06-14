const express = require('express');
const { asyncHandler, AppError } = require('../errors');
const { getDB } = require('../db');

const router = express.Router();

function extractOperator(req) {
  const userId = req.header('X-User-Id');
  const userRole = req.header('X-User-Role');
  if (!userId || !userRole) {
    throw new AppError('ROLE_UNAUTHORIZED', { hint: '请设置请求头 X-User-Id 和 X-User-Role' });
  }
  return { userId, userRole };
}

router.get('/', asyncHandler(async (req, res) => {
  const dbi = getDB();
  const { target_type, target_id, operator_id, offset = 0, limit = 50 } = req.query;

  let sql = 'SELECT * FROM operation_logs WHERE 1=1';
  const paramsArr = [];

  if (target_type) {
    sql += ' AND target_type = ?';
    paramsArr.push(target_type);
  }
  if (target_id) {
    sql += ' AND target_id = ?';
    paramsArr.push(target_id);
  }
  if (operator_id) {
    sql += ' AND operator_id = ?';
    paramsArr.push(operator_id);
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  paramsArr.push(Number(limit), Number(offset));

  const list = dbi.prepare(sql).all(...paramsArr);
  const total = dbi.prepare('SELECT COUNT(*) as total FROM operation_logs').get().total;

  res.json({
    success: true,
    data: { total, list },
  });
}));

module.exports = router;
