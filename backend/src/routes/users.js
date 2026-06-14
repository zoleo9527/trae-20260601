const express = require('express');
const { asyncHandler, AppError } = require('../errors');
const { listUsers, getMyTodos, getRoleDashboardConfig, getUserById, getRoleName } = require('../services/userService');

const router = express.Router();

function extractOperator(req) {
  const userId = req.header('X-User-Id');
  const userRole = req.header('X-User-Role');
  if (!userId || !userRole) {
    throw new AppError('ROLE_UNAUTHORIZED', { hint: '请设置请求头 X-User-Id 和 X-User-Role' });
  }
  return { userId, userRole };
}

router.get('/me', asyncHandler(async (req, res) => {
  const { userId, userRole } = extractOperator(req);
  const user = getUserById(userId);
  res.json({
    success: true,
    data: {
      ...user,
      role_name: getRoleName(user.role),
    },
  });
}));

router.get('/me/todos', asyncHandler(async (req, res) => {
  const { userId, userRole } = extractOperator(req);
  const todos = getMyTodos(userId, userRole);
  res.json({ success: true, data: todos });
}));

router.get('/me/dashboard-config', asyncHandler(async (req, res) => {
  const { userRole } = extractOperator(req);
  const config = getRoleDashboardConfig(userRole);
  res.json({ success: true, data: config });
}));

router.get('/', asyncHandler(async (req, res) => {
  const { role } = req.query;
  const users = listUsers(role);
  res.json({ success: true, data: users });
}));

module.exports = router;
