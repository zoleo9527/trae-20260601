const express = require('express');
const { asyncHandler, AppError } = require('../errors');
const {
  createRegistration,
  listRegistrations,
  getRegistrationDetail,
  auditRegistration,
  addSupplementRemark,
} = require('../services/registrationService');
const { checkRole } = require('../services/userService');

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
  const reg = createRegistration(req.body || {});
  res.json({ success: true, data: reg });
}));

router.get('/', asyncHandler(async (req, res) => {
  const { status, keyword, offset, limit } = req.query;
  const result = listRegistrations({ status, keyword, offset, limit });
  res.json({ success: true, data: result });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const detail = getRegistrationDetail(req.params.id);
  res.json({ success: true, data: detail });
}));

router.post('/:id/audit', asyncHandler(async (req, res) => {
  const { userId, userRole } = extractOperator(req);
  checkRole(userId, ['admin_staff']);
  const { action, reason } = req.body || {};
  const result = auditRegistration(req.params.id, {
    action,
    reason,
    auditorId: userId,
    auditorRole: userRole,
  });
  res.json({ success: true, data: result });
}));

router.post('/:id/supplement', asyncHandler(async (req, res) => {
  const { userId, userRole } = extractOperator(req);
  checkRole(userId, ['tech_support', 'admin_staff']);
  const { remark } = req.body || {};
  const result = addSupplementRemark(req.params.id, {
    remark,
    operatorId: userId,
    operatorRole: userRole,
  });
  res.json({ success: true, data: result });
}));

module.exports = router;
