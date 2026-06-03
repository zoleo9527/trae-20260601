import { Router } from 'express';
import { handleResponse } from '../utils/helpers.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateRequired, validateIdParam } from '../middleware/validator.js';
import * as CabinetService from '../services/CabinetService.js';

const router = Router();

router.get('/:id', validateIdParam, asyncHandler(async (req, res) => {
  const cell = await CabinetService.getCellDetail(req.params.id);
  handleResponse(res, cell);
}));

router.patch('/:id/status', validateIdParam, validateRequired(['status']), asyncHandler(async (req, res) => {
  const { status, remark } = req.body;
  const cell = await CabinetService.updateCellStatus(req.params.id, status, remark);
  handleResponse(res, cell, '状态更新成功');
}));

router.patch('/:id/hardware', validateIdParam, asyncHandler(async (req, res) => {
  const { lockStatus, doorStatus } = req.body;
  const cell = await CabinetService.updateCellHardwareStatus(req.params.id, lockStatus, doorStatus);
  handleResponse(res, cell, '硬件状态更新成功');
}));

export default router;
