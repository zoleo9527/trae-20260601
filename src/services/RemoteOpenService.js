import { Op } from 'sequelize';
import {
  RemoteOpenRequest,
  Order,
  Cell,
  Cabinet,
  ExceptionLog,
} from '../models/index.js';
import {
  REMOTE_OPEN_STATUS,
  ORDER_STATUS,
  CELL_STATUS,
  EXCEPTION_TYPE,
} from '../utils/constants.js';
import {
  canTransitionRemoteOpen,
  canRequestRemoteOpen,
  canTransitionCell,
  canCellBeRemoteOpened,
} from './StateMachineService.js';

export async function createRemoteOpenRequest(data) {
  const {
    orderId,
    cellId,
    applicantId,
    applicantName,
    applicantType,
    reason,
  } = data;
  
  const cell = await Cell.findByPk(cellId, {
    include: [
      { model: Cabinet, as: 'cabinet' },
      { model: Order, as: 'orders', where: { id: orderId }, required: false, limit: 1 },
    ],
  });
  if (!cell) {
    throw new Error('格口不存在');
  }
  
  let order = null;
  if (orderId) {
    order = await Order.findByPk(orderId);
    if (!order) {
      throw new Error('订单不存在');
    }
    if (order.cellId !== cellId) {
      throw new Error('订单与格口不匹配');
    }
    if (order.status === ORDER_STATUS.PICKED_UP) {
      throw new Error('已取件订单不能申请远程开柜');
    }
    if (order.status === ORDER_STATUS.CANCELLED) {
      throw new Error('已取消订单不能申请远程开柜');
    }
    if (!canRequestRemoteOpen(order.status)) {
      throw new Error(`订单状态 ${order.status} 未投放，不能申请远程开柜`);
    }
  }
  
  const orderStatus = order?.status;
  const cellCheck = canCellBeRemoteOpened(cell.status, orderStatus);
  if (!cellCheck.allowed) {
    throw new Error(cellCheck.reason);
  }
  
  const request = await RemoteOpenRequest.create({
    orderId,
    cellId,
    cabinetId: cell.cabinetId,
    applicantId,
    applicantName,
    applicantType,
    reason,
    status: REMOTE_OPEN_STATUS.PENDING,
  });
  return request;
}

export async function approveRemoteOpen(id, approverId, approverName, approvalRemark = '') {
  const request = await RemoteOpenRequest.findByPk(id);
  if (!request) {
    throw new Error('申请不存在');
  }
  if (!canTransitionRemoteOpen(request.status, REMOTE_OPEN_STATUS.APPROVED)) {
    throw new Error(`申请状态 ${request.status} 无法审批`);
  }
  await request.update({
    status: REMOTE_OPEN_STATUS.APPROVED,
    approverId,
    approverName,
    approvedAt: new Date(),
    approvalRemark,
  });
  return request;
}

export async function rejectRemoteOpen(id, approverId, approverName, approvalRemark = '') {
  const request = await RemoteOpenRequest.findByPk(id);
  if (!request) {
    throw new Error('申请不存在');
  }
  if (!canTransitionRemoteOpen(request.status, REMOTE_OPEN_STATUS.REJECTED)) {
    throw new Error(`申请状态 ${request.status} 无法审批`);
  }
  await request.update({
    status: REMOTE_OPEN_STATUS.REJECTED,
    approverId,
    approverName,
    approvedAt: new Date(),
    approvalRemark,
  });
  return request;
}

export async function executeRemoteOpen(id, success = true, executionResult = '') {
  const request = await RemoteOpenRequest.findByPk(id, {
    include: [
      { model: Order, as: 'order' },
      { model: Cell, as: 'cell' },
    ],
  });
  if (!request) {
    throw new Error('申请不存在');
  }
  if (request.status !== REMOTE_OPEN_STATUS.APPROVED) {
    throw new Error('申请未通过审批，无法执行');
  }
  const targetStatus = success ? REMOTE_OPEN_STATUS.EXECUTED : REMOTE_OPEN_STATUS.FAILED;
  if (!canTransitionRemoteOpen(request.status, targetStatus)) {
    throw new Error(`申请状态 ${request.status} 无法执行`);
  }
  await request.update({
    status: targetStatus,
    executedAt: new Date(),
    executionResult: executionResult || (success ? '远程开柜成功' : '远程开柜失败'),
  });
  if (success && request.cellId) {
    const { updateCellHardwareStatus } = await import('./CabinetService.js');
    await updateCellHardwareStatus(request.cellId, false, false);
    if (request.order && request.order.status === ORDER_STATUS.PICKED_UP) {
      if (canTransitionCell(request.cell.status, CELL_STATUS.AVAILABLE)) {
        const { updateCellStatus } = await import('./CabinetService.js');
        await updateCellStatus(request.cellId, CELL_STATUS.AVAILABLE, '客服远程开柜后释放');
        await Cell.update({ currentOrderId: null }, { where: { id: request.cellId } });
      }
    }
  }
  if (!success && request.cellId) {
    await ExceptionLog.create({
      exceptionType: EXCEPTION_TYPE.DOOR_STUCK,
      orderId: request.orderId,
      cellId: request.cellId,
      cabinetId: request.cabinetId,
      userId: request.order?.userId,
      operatorId: request.approverId,
      description: `远程开柜失败，柜门卡住`,
      detail: JSON.stringify({ requestId: id, executionResult }),
    });
  }
  return request;
}

export async function customerServiceRemoteOpen(cellId, operatorId, operatorName, reason = '') {
  const cell = await Cell.findByPk(cellId, {
    include: [
      { model: Cabinet, as: 'cabinet' },
      { 
        model: Order, 
        as: 'orders', 
        where: { 
          status: { [Op.in]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.TIMEOUT] } 
        }, 
        required: false,
        order: [['createdAt', 'DESC']],
        limit: 1,
      },
    ],
  });
  if (!cell) {
    throw new Error('格口不存在');
  }
  
  const activeOrder = cell.orders && cell.orders[0];
  
  const cellCheck = canCellBeRemoteOpened(cell.status, activeOrder?.status);
  if (!cellCheck.allowed) {
    throw new Error(cellCheck.reason);
  }
  
  if (!activeOrder) {
    throw new Error('该格口无有效已投放订单，无法远程开柜');
  }
  
  if (activeOrder.cellId !== cellId) {
    throw new Error('订单与格口不匹配');
  }
  
  if (activeOrder.status === ORDER_STATUS.PICKED_UP) {
    throw new Error('该格口订单已取件，无需远程开柜');
  }
  
  if (activeOrder.status === ORDER_STATUS.CANCELLED) {
    throw new Error('该格口订单已取消，无法远程开柜');
  }
  
  if (!canRequestRemoteOpen(activeOrder.status)) {
    throw new Error(`订单状态 ${activeOrder.status} 未投放，无法远程开柜`);
  }
  
  const request = await createRemoteOpenRequest({
    orderId: activeOrder.id,
    cellId,
    applicantId: operatorId,
    applicantName: operatorName,
    applicantType: 'customer_service',
    reason: reason || '客服人工开柜',
  });
  
  await approveRemoteOpen(request.id, operatorId, operatorName, '客服直接审批');
  
  const result = await executeRemoteOpen(request.id, true, '客服远程开柜');
  
  return result;
}

export async function getRemoteOpenList(params = {}) {
  const {
    page = 1,
    pageSize = 20,
    status,
    cabinetId,
    applicantId,
    startDate,
    endDate,
  } = params;
  const where = {};
  if (status) where.status = status;
  if (cabinetId) where.cabinetId = cabinetId;
  if (applicantId) where.applicantId = applicantId;
  if (startDate) where.createdAt = { ...where.createdAt, [Op.gte]: startDate };
  if (endDate) where.createdAt = { ...where.createdAt, [Op.lte]: endDate };
  const { count, rows } = await RemoteOpenRequest.findAndCountAll({
    where,
    include: [
      { model: Order, as: 'order' },
      { model: Cell, as: 'cell' },
      { model: Cabinet, as: 'cabinet' },
    ],
    offset: (page - 1) * pageSize,
    limit: pageSize,
    order: [['createdAt', 'DESC']],
  });
  return { total: count, list: rows, page, pageSize };
}

export async function getRemoteOpenDetail(id) {
  const request = await RemoteOpenRequest.findByPk(id, {
    include: [
      { model: Order, as: 'order' },
      { model: Cell, as: 'cell' },
      { model: Cabinet, as: 'cabinet' },
    ],
  });
  if (!request) {
    throw new Error('申请不存在');
  }
  return request;
}
