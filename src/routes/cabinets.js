import { Router } from 'express';
import { handleResponse } from '../utils/helpers.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateRequired, validatePagination, validateIdParam } from '../middleware/validator.js';
import * as CabinetService from '../services/CabinetService.js';
import * as CabinetStatusService from '../services/CabinetStatusService.js';

const router = Router();

router.get('/', validatePagination, asyncHandler(async (req, res) => {
  const result = await CabinetService.getCabinetList(req.query);
  handleResponse(res, result);
}));

router.post('/', validateRequired(['cabinetNo', 'name', 'location']), asyncHandler(async (req, res) => {
  const cabinet = await CabinetService.createCabinet(req.body);
  handleResponse(res, cabinet, '创建成功', 201);
}));

router.get('/:id', validateIdParam, asyncHandler(async (req, res) => {
  const cabinet = await CabinetService.getCabinetDetail(req.params.id);
  handleResponse(res, cabinet);
}));

router.put('/:id', validateIdParam, asyncHandler(async (req, res) => {
  const cabinet = await CabinetService.updateCabinet(req.params.id, req.body);
  handleResponse(res, cabinet, '更新成功');
}));

router.patch('/:id/status', validateIdParam, validateRequired(['status']), asyncHandler(async (req, res) => {
  const { status, remark } = req.body;
  const cabinet = await CabinetService.updateCabinetStatus(req.params.id, status, remark);
  handleResponse(res, cabinet, '状态更新成功');
}));

router.post('/heartbeat', validateRequired(['cabinetNo']), asyncHandler(async (req, res) => {
  const { cabinetNo, ipAddress } = req.body;
  const cabinet = await CabinetService.heartbeat(cabinetNo, ipAddress);
  handleResponse(res, cabinet, '心跳上报成功');
}));

router.post('/:id/cells', validateIdParam, validateRequired(['cells']), asyncHandler(async (req, res) => {
  const cells = await CabinetService.addCells(req.params.id, req.body.cells);
  handleResponse(res, cells, '格口添加成功', 201);
}));

router.get('/:id/cells', validateIdParam, validatePagination, asyncHandler(async (req, res) => {
  const result = await CabinetService.getCellList(req.params.id, req.query);
  handleResponse(res, result);
}));

router.get('/:id/status', validateIdParam, asyncHandler(async (req, res) => {
  const result = await CabinetStatusService.getCabinetRealTimeStatus(req.params.id);
  handleResponse(res, result);
}));

router.post('/status/upload', validateRequired(['cabinetNo', 'cellStatuses']), asyncHandler(async (req, res) => {
  const { cabinetNo, cellStatuses } = req.body;
  const result = await CabinetStatusService.uploadCellStatus(cabinetNo, cellStatuses);
  handleResponse(res, result, '状态上报成功');
}));

export default router;
