import { Router } from 'express';
import { handleResponse } from '../utils/helpers.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateRequired, validatePagination, validateIdParam } from '../middleware/validator.js';
import * as OrderService from '../services/OrderService.js';

const router = Router();

router.get('/', validatePagination, asyncHandler(async (req, res) => {
  const result = await OrderService.getOrderList(req.query);
  handleResponse(res, result);
}));

router.post('/', validateRequired(['userId']), asyncHandler(async (req, res) => {
  const order = await OrderService.createOrder(req.body);
  handleResponse(res, order, '订单创建成功', 201);
}));

router.get('/:id', validateIdParam, asyncHandler(async (req, res) => {
  const order = await OrderService.getOrderDetail(req.params.id);
  handleResponse(res, order);
}));

router.post('/:id/assign-cell', validateIdParam, validateRequired(['cabinetId']), asyncHandler(async (req, res) => {
  const { cabinetId, preferredSize } = req.body;
  const result = await OrderService.assignCell(req.params.id, cabinetId, preferredSize);
  handleResponse(res, result, '格口分配成功');
}));

router.post('/:id/deliver', validateIdParam, validateRequired(['deliveryStaffId']), asyncHandler(async (req, res) => {
  const result = await OrderService.deliverOrder(req.params.id, req.body);
  handleResponse(res, result, '投放成功');
}));

router.post('/pickup-by-code', validateRequired(['code', 'userId']), asyncHandler(async (req, res) => {
  const { code, userId } = req.body;
  const result = await OrderService.pickupByCode(code, userId);
  handleResponse(res, result, '取件成功');
}));

router.post('/:id/pickup', validateIdParam, validateRequired(['userId']), asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const result = await OrderService.pickupByOrderId(req.params.id, userId);
  handleResponse(res, result, '取件成功');
}));

router.post('/:id/cancel', validateIdParam, validateRequired(['operatorId']), asyncHandler(async (req, res) => {
  const { operatorId, reason } = req.body;
  const order = await OrderService.cancelOrder(req.params.id, operatorId, reason);
  handleResponse(res, order, '取消成功');
}));

router.post('/check-timeout', asyncHandler(async (req, res) => {
  const result = await OrderService.checkAndProcessTimeout();
  handleResponse(res, result, `处理了 ${result.length} 个超时订单`);
}));

export default router;
