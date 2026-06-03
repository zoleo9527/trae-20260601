import { Router } from 'express';
import { handleResponse } from '../utils/helpers.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validatePagination, validateIdParam, validateRequired } from '../middleware/validator.js';
import * as PickupCodeService from '../services/PickupCodeService.js';

const router = Router();

router.get('/', validatePagination, asyncHandler(async (req, res) => {
  const result = await PickupCodeService.getPickupCodeList(req.query);
  handleResponse(res, result);
}));

router.get('/:id', validateIdParam, asyncHandler(async (req, res) => {
  const pickupCode = await PickupCodeService.getPickupCodeDetail(req.params.id);
  handleResponse(res, pickupCode);
}));

router.post('/invalidate-and-regenerate', validateRequired(['orderId', 'operatorId']), asyncHandler(async (req, res) => {
  const { orderId, operatorId, reason } = req.body;
  const result = await PickupCodeService.invalidateAndRegenerateCode(orderId, operatorId, reason);
  handleResponse(res, result, '取件码已作废并生成新码');
}));

export default router;
