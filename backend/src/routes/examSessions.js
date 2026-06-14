const express = require('express');
const { asyncHandler, AppError } = require('../errors');
const {
  createExamSession,
  listExamSessions,
  getExamSessionDetail,
  updateExamSession,
  getAvailableSessions,
} = require('../services/examSessionService');

const router = express.Router();

function extractOperator(req) {
  const userId = req.header('X-User-Id');
  const userRole = req.header('X-User-Role');
  if (!userId || !userRole) {
    throw new AppError('ROLE_UNAUTHORIZED', { hint: '请设置请求头 X-User-Id 和 X-User-Role' });
  }
  return { userId, userRole };
}

router.post('/', asyncHandler(async (req, res) => {
  const { userId } = extractOperator(req);
  const result = createExamSession(req.body || {}, userId);
  res.json({ success: true, data: result });
}));

router.get('/', asyncHandler(async (req, res) => {
  const { subject, status, start_date, end_date, offset, limit } = req.query;
  const result = listExamSessions({
    subject: subject ? Number(subject) : null,
    status,
    start_date,
    end_date,
    offset: offset ? Number(offset) : 0,
    limit: limit ? Number(limit) : 20,
  });
  res.json({ success: true, data: result });
}));

router.get('/available', asyncHandler(async (req, res) => {
  const { subject } = req.query;
  const result = getAvailableSessions(subject ? Number(subject) : null);
  res.json({ success: true, data: result });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const result = getExamSessionDetail(req.params.id);
  res.json({ success: true, data: result });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const { userId } = extractOperator(req);
  const result = updateExamSession(req.params.id, req.body || {}, userId);
  res.json({ success: true, data: result });
}));

module.exports = router;
