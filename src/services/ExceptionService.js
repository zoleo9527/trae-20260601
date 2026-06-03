import { Op } from 'sequelize';
import {
  ExceptionLog,
  Order,
  Cell,
  Cabinet,
} from '../models/index.js';
import { EXCEPTION_TYPE } from '../utils/constants.js';
import { getExceptionTypeDescription } from './StateMachineService.js';

export async function createExceptionLog(data) {
  const { exceptionType, description, ...rest } = data;
  const log = await ExceptionLog.create({
    exceptionType,
    description: description || getExceptionTypeDescription(exceptionType),
    ...rest,
  });
  return log;
}

export async function handleException(id, handledBy, handleResult) {
  const log = await ExceptionLog.findByPk(id);
  if (!log) {
    throw new Error('异常记录不存在');
  }
  await log.update({
    handled: true,
    handledBy,
    handledAt: new Date(),
    handleResult,
  });
  return log;
}

export async function reportDoorStuck(cellId, userId, description = '') {
  const cell = await Cell.findByPk(cellId);
  if (!cell) {
    throw new Error('格口不存在');
  }
  const log = await ExceptionLog.create({
    exceptionType: EXCEPTION_TYPE.DOOR_STUCK,
    cabinetId: cell.cabinetId,
    cellId,
    userId,
    description: description || '柜门卡住无法打开',
    handled: false,
  });
  return log;
}

export async function reportPickupCodeInvalid(orderId, userId, code, description = '') {
  const order = await Order.findByPk(orderId);
  if (!order) {
    throw new Error('订单不存在');
  }
  const log = await ExceptionLog.create({
    exceptionType: EXCEPTION_TYPE.PICKUP_CODE_INVALID,
    orderId,
    cellId: order.cellId,
    cabinetId: order.cabinetId,
    userId,
    description: description || `取件码 ${code} 无效`,
    detail: JSON.stringify({ code }),
    handled: false,
  });
  return log;
}

export async function getExceptionList(params = {}) {
  const {
    page = 1,
    pageSize = 20,
    exceptionType,
    handled,
    cabinetId,
    cellId,
    orderId,
    startDate,
    endDate,
  } = params;
  const where = {};
  if (exceptionType) where.exceptionType = exceptionType;
  if (handled !== undefined) where.handled = handled;
  if (cabinetId) where.cabinetId = cabinetId;
  if (cellId) where.cellId = cellId;
  if (orderId) where.orderId = orderId;
  if (startDate) where.createdAt = { ...where.createdAt, [Op.gte]: startDate };
  if (endDate) where.createdAt = { ...where.createdAt, [Op.lte]: endDate };
  const { count, rows } = await ExceptionLog.findAndCountAll({
    where,
    include: [
      { model: Order, as: 'order' },
      { model: Cell, as: 'cell' },
      { model: Cabinet, as: 'cabinet' },
    ],
    offset: (page - 1) * pageSize,
    limit: pageSize,
    order: [['handled', 'ASC'], ['createdAt', 'DESC']],
  });
  return { total: count, list: rows, page, pageSize };
}

export async function getExceptionDetail(id) {
  const log = await ExceptionLog.findByPk(id, {
    include: [
      { model: Order, as: 'order' },
      { model: Cell, as: 'cell' },
      { model: Cabinet, as: 'cabinet' },
    ],
  });
  if (!log) {
    throw new Error('异常记录不存在');
  }
  return log;
}

export async function getExceptionStats(params = {}) {
  const { cabinetId, startDate, endDate } = params;
  const where = {};
  if (cabinetId) where.cabinetId = cabinetId;
  if (startDate) where.createdAt = { ...where.createdAt, [Op.gte]: startDate };
  if (endDate) where.createdAt = { ...where.createdAt, [Op.lte]: endDate };
  const total = await ExceptionLog.count({ where });
  const unhandled = await ExceptionLog.count({ where: { ...where, handled: false } });
  const byType = await ExceptionLog.count({
    where,
    group: ['exceptionType'],
    attributes: ['exceptionType'],
  });
  return {
    total,
    unhandled,
    handled: total - unhandled,
    byType,
  };
}
