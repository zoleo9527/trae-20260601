import { Router } from 'express';
import { handleResponse } from '../utils/helpers.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateRequired, validatePagination, validateIdParam } from '../middleware/validator.js';
import * as RemoteOpenService from '../services/RemoteOpenService.js';

const router = Router();

router.get('/', validatePagination, asyncHandler(async (req, res) => {
  const result = await RemoteOpenService.getRemoteOpenList(req.query);
  handleResponse(res, result);
}));

router.post('/', validateRequired(['cellId', 'applicantId', 'reason']), asyncHandler(async (req, res) => {
  const request = await RemoteOpenService.createRemoteOpenRequest(req.body);
  handleResponse(res, request, '申请创建成功', 201);
}));

router.get('/:id', validateIdParam, asyncHandler(async (req, res) => {
  const request = await RemoteOpenService.getRemoteOpenDetail(req.params.id);
  handleResponse(res, request);
}));

router.post('/:id/approve', validateIdParam, validateRequired(['approverId']), asyncHandler(async (req, res) => {
  const { approverId, approverName, approvalRemark } = req.body;
  const request = await RemoteOpenService.approveRemoteOpen(req.params.id, approverId, approverName, approvalRemark);
  handleResponse(res, request, '审批通过');
}));

router.post('/:id/reject', validateIdParam, validateRequired(['approverId']), asyncHandler(async (req, res) => {
  const { approverId, approverName, approvalRemark } = req.body;
  const request = await RemoteOpenService.rejectRemoteOpen(req.params.id, approverId, approverName, approvalRemark);
  handleResponse(res, request, '已拒绝');
}));

router.post('/:id/execute', validateIdParam, asyncHandler(async (req, res) => {
  const { success, executionResult } = req.body;
  const request = await RemoteOpenService.executeRemoteOpen(req.params.id, success !== false, executionResult);
  handleResponse(res, request, success !== false ? '执行成功' : '执行失败');
}));

router.post('/customer-service/open', validateRequired(['cellId', 'operatorId', 'operatorName']), asyncHandler(async (req, res) => {
  const { cellId, operatorId, operatorName, reason } = req.body;
  const result = await RemoteOpenService.customerServiceRemoteOpen(cellId, operatorId, operatorName, reason);
  handleResponse(res, result, '客服远程开柜成功');
}));

export default router;
