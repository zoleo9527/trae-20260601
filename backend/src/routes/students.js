const express = require('express');
const { asyncHandler } = require('../errors');
const {
  createStudent,
  listStudents,
  getStudentDetail,
  updateStudent,
  advanceSubject,
} = require('../services/studentService');

const router = express.Router();

function extractOperator(req) {
  const userId = req.header('X-User-Id');
  const userRole = req.header('X-User-Role');
  if (!userId || !userRole) {
    throw new AppError('ROLE_UNAUTHORIZED', { hint: '请设置请求头 X-User-Id 和 X-User-Role' });
  }
  return { userId, userRole };
}

const { AppError } = require('../errors');

router.post('/', asyncHandler(async (req, res) => {
  const { userId } = extractOperator(req);
  const result = createStudent(req.body || {}, userId);
  res.json({ success: true, data: result });
}));

router.get('/', asyncHandler(async (req, res) => {
  const { status, keyword, coach_id, current_subject, offset, limit } = req.query;
  const result = listStudents({
    status,
    keyword,
    coach_id,
    current_subject: current_subject ? Number(current_subject) : null,
    offset: offset ? Number(offset) : 0,
    limit: limit ? Number(limit) : 20,
  });
  res.json({ success: true, data: result });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const result = getStudentDetail(req.params.id);
  res.json({ success: true, data: result });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const { userId } = extractOperator(req);
  const result = updateStudent(req.params.id, req.body || {}, userId);
  res.json({ success: true, data: result });
}));

router.post('/:id/advance-subject', asyncHandler(async (req, res) => {
  const { userId } = extractOperator(req);
  const result = advanceSubject(req.params.id, userId);
  res.json({ success: true, data: result });
}));

module.exports = router;
