const express = require('express');
const { asyncHandler, AppError } = require('../errors');
const {
  createMakeupExam,
  listMakeupExams,
  getMakeupExamDetail,
  getMakeupExamHistory,
  recordMakeupPayment,
  bookMakeupExam,
  completeMakeupExam,
  cancelMakeupExam,
  getMakeupReviewData,
} = require('../services/makeupExamService');

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
  const result = createMakeupExam(req.body || {}, userId);
  res.json({ success: true, data: result });
}));

router.get('/', asyncHandler(async (req, res) => {
  const { status, subject, student_id, offset, limit } = req.query;
  const result = listMakeupExams({
    status,
    subject: subject ? Number(subject) : null,
    student_id,
    offset: offset ? Number(offset) : 0,
    limit: limit ? Number(limit) : 20,
  });
  res.json({ success: true, data: result });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const result = getMakeupExamDetail(req.params.id);
  res.json({ success: true, data: result });
}));

router.get('/:id/review', asyncHandler(async (req, res) => {
  const result = getMakeupReviewData(req.params.id);
  res.json({ success: true, data: result });
}));

router.get('/student/:studentId/history', asyncHandler(async (req, res) => {
  const { subject } = req.query;
  const result = getMakeupExamHistory(
    req.params.studentId,
    subject ? Number(subject) : null
  );
  res.json({ success: true, data: result });
}));

router.post('/:id/record-payment', asyncHandler(async (req, res) => {
  const { userId } = extractOperator(req);
  const result = recordMakeupPayment(req.params.id, req.body || {}, userId);
  res.json({ success: true, data: result });
}));

router.post('/:id/book-exam', asyncHandler(async (req, res) => {
  const { userId } = extractOperator(req);
  const result = bookMakeupExam(req.params.id, req.body || {}, userId);
  res.json({ success: true, data: result });
}));

router.post('/:id/complete', asyncHandler(async (req, res) => {
  const { userId } = extractOperator(req);
  const result = completeMakeupExam(req.params.id, userId);
  res.json({ success: true, data: result });
}));

router.post('/:id/cancel', asyncHandler(async (req, res) => {
  const { userId } = extractOperator(req);
  const result = cancelMakeupExam(req.params.id, req.body || {}, userId);
  res.json({ success: true, data: result });
}));

module.exports = router;
