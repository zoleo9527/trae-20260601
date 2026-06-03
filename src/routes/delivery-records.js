import { Router } from 'express';
import { handleResponse } from '../utils/helpers.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validatePagination, validateIdParam } from '../middleware/validator.js';
import * as DeliveryRecordService from '../services/DeliveryRecordService.js';

const router = Router();

router.get('/', validatePagination, asyncHandler(async (req, res) => {
  const result = await DeliveryRecordService.getDeliveryRecordList(req.query);
  handleResponse(res, result);
}));

router.get('/:id', validateIdParam, asyncHandler(async (req, res) => {
  const record = await DeliveryRecordService.getDeliveryRecordDetail(req.params.id);
  handleResponse(res, record);
}));

export default router;
