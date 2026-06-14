const express = require('express');
const { asyncHandler, AppError } = require('../errors');
const {
  createExamBooking,
  listExamBookings,
  getExamBookingDetail,
  approveBooking,
  rejectBooking,
  bookExamSession,
  recordExamResult,
  cancelBooking,
} = require('../services/examBookingService');

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
  const result = createExamBooking(req.body || {}, userId);
  res.json({ success: true, data: result });
}));

router.get('/', asyncHandler(async (req, res) => {
  const { status, subject, student_id, exam_session_id, is_makeup, needs_attention, offset, limit } = req.query;
  const result = listExamBookings({
    status,
    subject: subject ? Number(subject) : null,
    student_id,
    exam_session_id,
    is_makeup: is_makeup !== undefined ? is_makeup === 'true' || is_makeup === '1' : null,
    needs_attention: needs_attention !== undefined ? needs_attention === 'true' || needs_attention === '1' : null,
    offset: offset ? Number(offset) : 0,
    limit: limit ? Number(limit) : 20,
  });
  res.json({ success: true, data: result });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const result = getExamBookingDetail(req.params.id);
  res.json({ success: true, data: result });
}));

router.post('/:id/approve', asyncHandler(async (req, res) => {
  const { userId } = extractOperator(req);
  const result = approveBooking(req.params.id, req.body || {}, userId);
  res.json({ success: true, data: result });
}));

router.post('/:id/reject', asyncHandler(async (req, res) => {
  const { userId } = extractOperator(req);
  const result = rejectBooking(req.params.id, req.body || {}, userId);
  res.json({ success: true, data: result });
}));

router.post('/:id/book-session', asyncHandler(async (req, res) => {
  const { userId } = extractOperator(req);
  const { exam_session_id } = req.body || {};
  const result = bookExamSession(req.params.id, exam_session_id, userId);
  res.json({ success: true, data: result });
}));

router.post('/:id/record-result', asyncHandler(async (req, res) => {
  const { userId } = extractOperator(req);
  const result = recordExamResult(req.params.id, req.body || {}, userId);
  res.json({ success: true, data: result });
}));

router.post('/:id/cancel', asyncHandler(async (req, res) => {
  const { userId } = extractOperator(req);
  const result = cancelBooking(req.params.id, req.body || {}, userId);
  res.json({ success: true, data: result });
}));

module.exports = router;
