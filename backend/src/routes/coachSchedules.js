const express = require('express');
const { asyncHandler, AppError } = require('../errors');
const {
  listCoaches,
  getCoachDetail,
  createSchedule,
  listSchedules,
  getScheduleDetail,
  bookSchedule,
  completeSchedule,
  cancelSchedule,
} = require('../services/coachService');

const router = express.Router();

function extractOperator(req) {
  const userId = req.header('X-User-Id');
  const userRole = req.header('X-User-Role');
  if (!userId || !userRole) {
    throw new AppError('ROLE_UNAUTHORIZED', { hint: '请设置请求头 X-User-Id 和 X-User-Role' });
  }
  return { userId, userRole };
}

router.get('/coaches', asyncHandler(async (req, res) => {
  const { status, offset, limit } = req.query;
  const result = listCoaches({
    status,
    offset: offset ? Number(offset) : 0,
    limit: limit ? Number(limit) : 20,
  });
  res.json({ success: true, data: result });
}));

router.get('/coaches/:id', asyncHandler(async (req, res) => {
  const result = getCoachDetail(req.params.id);
  res.json({ success: true, data: result });
}));

router.post('/schedules', asyncHandler(async (req, res) => {
  const { userId } = extractOperator(req);
  const result = createSchedule(req.body || {}, userId);
  res.json({ success: true, data: result });
}));

router.get('/schedules', asyncHandler(async (req, res) => {
  const { coach_id, student_id, schedule_date, status, type, offset, limit } = req.query;
  const result = listSchedules({
    coach_id,
    student_id,
    schedule_date,
    status,
    type,
    offset: offset ? Number(offset) : 0,
    limit: limit ? Number(limit) : 50,
  });
  res.json({ success: true, data: result });
}));

router.get('/schedules/:id', asyncHandler(async (req, res) => {
  const result = getScheduleDetail(req.params.id);
  res.json({ success: true, data: result });
}));

router.post('/schedules/:id/book', asyncHandler(async (req, res) => {
  const { userId } = extractOperator(req);
  const result = bookSchedule(req.params.id, req.body || {}, userId);
  res.json({ success: true, data: result });
}));

router.post('/schedules/:id/complete', asyncHandler(async (req, res) => {
  const { userId } = extractOperator(req);
  const result = completeSchedule(req.params.id, userId);
  res.json({ success: true, data: result });
}));

router.post('/schedules/:id/cancel', asyncHandler(async (req, res) => {
  const { userId } = extractOperator(req);
  const result = cancelSchedule(req.params.id, req.body || {}, userId);
  res.json({ success: true, data: result });
}));

module.exports = router;
