import { Router } from 'express';
import { handleResponse } from '../utils/helpers.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateRequired, validatePagination, validateIdParam } from '../middleware/validator.js';
import * as ExceptionService from '../services/ExceptionService.js';

const router = Router();

router.get('/', validatePagination, asyncHandler(async (req, res) => {
  const result = await ExceptionService.getExceptionList(req.query);
  handleResponse(res, result);
}));

router.get('/stats', asyncHandler(async (req, res) => {
  const result = await ExceptionService.getExceptionStats(req.query);
  handleResponse(res, result);
}));

router.post('/', validateRequired(['exceptionType']), asyncHandler(async (req, res) => {
  const log = await ExceptionService.createExceptionLog(req.body);
  handleResponse(res, log, '异常记录创建成功', 201);
}));

router.get('/:id', validateIdParam, asyncHandler(async (req, res) => {
  const log = await ExceptionService.getExceptionDetail(req.params.id);
  handleResponse(res, log);
}));

router.post('/:id/handle', validateIdParam, validateRequired(['handledBy', 'handleResult']), asyncHandler(async (req, res) => {
  const { handledBy, handleResult } = req.body;
  const log = await ExceptionService.handleException(req.params.id, handledBy, handleResult);
  handleResponse(res, log, '处理成功');
}));

router.post('/report/door-stuck', validateRequired(['cellId', 'userId']), asyncHandler(async (req, res) => {
  const { cellId, userId, description } = req.body;
  const log = await ExceptionService.reportDoorStuck(cellId, userId, description);
  handleResponse(res, log, '已上报柜门卡住异常', 201);
}));

router.post('/report/pickup-code-invalid', validateRequired(['orderId', 'userId', 'code']), asyncHandler(async (req, res) => {
  const { orderId, userId, code, description } = req.body;
  const log = await ExceptionService.reportPickupCodeInvalid(orderId, userId, code, description);
  handleResponse(res, log, '已上报取件码无效异常', 201);
}));

export default router;
