const express = require('express');
const { asyncHandler, AppError } = require('../errors');
const {
  generateAdmissionTicket,
  getTicketDetail,
  getTicketByRegistration,
  listTickets,
} = require('../services/ticketService');
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
  const { userId, userRole } = extractOperator(req);
  checkRole(userId, ['admin_staff', 'invigilator']);
  const { registration_id, exam_room_id } = req.body || {};
  if (!registration_id) {
    throw new AppError('VALIDATION_ERROR', { registration_id: '报名ID不能为空' });
  }
  const ticket = generateAdmissionTicket(registration_id, {
    operatorId: userId,
    operatorRole: userRole,
    examRoomId: exam_room_id,
  });
  res.json({ success: true, data: ticket });
}));

router.get('/', asyncHandler(async (req, res) => {
  const { roomCode, offset, limit } = req.query;
  const result = listTickets({ roomCode, offset, limit });
  res.json({ success: true, data: result });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const ticket = getTicketDetail(req.params.id);
  res.json({ success: true, data: ticket });
}));

router.get('/by-registration/:registrationId', asyncHandler(async (req, res) => {
  const ticket = getTicketByRegistration(req.params.registrationId);
  res.json({ success: true, data: ticket });
}));

module.exports = router;
