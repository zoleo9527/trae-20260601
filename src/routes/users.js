const express = require('express');
const { asyncHandler, AppError } = require('../errors');
const {
  listUsers,
  getUser,
  getMyTodos,
  markNotificationRead,
  listExamRooms,
  listInvigilatorAssignments,
} = require('../services/userService');

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
  const { role } = req.query;
  res.json({ success: true, data: listUsers(role) });
}));

router.get('/me', asyncHandler(async (req, res) => {
  const { userId } = extractOperator(req);
  res.json({ success: true, data: getUser(userId) });
}));

router.get('/me/todos', asyncHandler(async (req, res) => {
  const { userId, userRole } = extractOperator(req);
  getUser(userId);
  res.json({ success: true, data: getMyTodos(userId, userRole) });
}));

router.post('/notifications/:id/read', asyncHandler(async (req, res) => {
  const { userId } = extractOperator(req);
  res.json({ success: true, data: markNotificationRead(req.params.id, userId) });
}));

router.get('/exam-rooms', asyncHandler(async (req, res) => {
  res.json({ success: true, data: listExamRooms() });
}));

router.get('/invigilator-assignments', asyncHandler(async (req, res) => {
  res.json({ success: true, data: listInvigilatorAssignments() });
}));

module.exports = router;
