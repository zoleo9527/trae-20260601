const express = require('express');
const { asyncHandler, AppError } = require('../errors');
const { getDashboardData } = require('../services/dashboardService');

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
  const { userId, userRole } = extractOperator(req);
  const result = getDashboardData(userId, userRole);
  res.json({ success: true, data: result });
}));

module.exports = router;
