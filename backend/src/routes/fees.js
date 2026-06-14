const express = require('express');
const { asyncHandler, AppError } = require('../errors');
const {
  createFeeRecord,
  listFeeRecords,
  getFeeRecordDetail,
  recordPayment,
} = require('../services/feeService');

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
  const result = createFeeRecord(req.body || {}, userId);
  res.json({ success: true, data: result });
}));

router.get('/', asyncHandler(async (req, res) => {
  const { status, type, student_id, offset, limit } = req.query;
  const result = listFeeRecords({
    status,
    type,
    student_id,
    offset: offset ? Number(offset) : 0,
    limit: limit ? Number(limit) : 20,
  });
  res.json({ success: true, data: result });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const result = getFeeRecordDetail(req.params.id);
  res.json({ success: true, data: result });
}));

router.post('/:id/record-payment', asyncHandler(async (req, res) => {
  const { userId } = extractOperator(req);
  const result = recordPayment(req.params.id, req.body || {}, userId);
  res.json({ success: true, data: result });
}));

module.exports = router;
