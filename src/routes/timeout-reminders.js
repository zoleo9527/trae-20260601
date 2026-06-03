import { Router } from 'express';
import { handleResponse } from '../utils/helpers.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validatePagination, validateIdParam } from '../middleware/validator.js';
import * as TimeoutReminderService from '../services/TimeoutReminderService.js';

const router = Router();

router.get('/', validatePagination, asyncHandler(async (req, res) => {
  const result = await TimeoutReminderService.getTimeoutReminderList(req.query);
  handleResponse(res, result);
}));

router.get('/pending', asyncHandler(async (req, res) => {
  const result = await TimeoutReminderService.getPendingReminders();
  handleResponse(res, result);
}));

router.get('/:id', validateIdParam, asyncHandler(async (req, res) => {
  const reminder = await TimeoutReminderService.getTimeoutReminderDetail(req.params.id);
  handleResponse(res, reminder);
}));

router.post('/:id/mark-sent', validateIdParam, asyncHandler(async (req, res) => {
  const reminder = await TimeoutReminderService.markAsSent(req.params.id);
  handleResponse(res, reminder, '已标记为已发送');
}));

router.post('/:id/acknowledge', validateIdParam, asyncHandler(async (req, res) => {
  const reminder = await TimeoutReminderService.markAsAcknowledged(req.params.id);
  handleResponse(res, reminder, '已确认');
}));

export default router;
