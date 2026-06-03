import { Op } from 'sequelize';
import {
  Order,
  Cell,
  Cabinet,
  DeliveryRecord,
  PickupCode,
  TimeoutReminder,
  ExceptionLog,
} from '../models/index.js';
import {
  ORDER_STATUS,
  CELL_STATUS,
  EXCEPTION_TYPE,
  PICKUP_CODE_STATUS,
  TIMEOUT_REMINDER_STATUS,
  PICKUP_TIMEOUT_HOURS,
} from '../utils/constants.js';
import {
  canTransitionOrder,
  canTransitionCell,
  isCellOccupied,
  calculateTimeout,
  isOrderTimeout,
} from './StateMachineService.js';
import { generateOrderNo, generatePickupCode } from '../utils/helpers.js';
import dayjs from 'dayjs';

export async function createOrder(data) {
  const orderNo = generateOrderNo();
  const order = await Order.create({
    ...data,
    orderNo,
    status: ORDER_STATUS.CREATED,
  });
  return order;
}

export async function assignCell(orderId, cabinetId, preferredSize = 'medium') {
  const order = await Order.findByPk(orderId);
  if (!order) {
    throw new Error('订单不存在');
  }
  if (!canTransitionOrder(order.status, ORDER_STATUS.CELL_ASSIGNED)) {
    throw new Error(`订单状态 ${order.status} 无法分配格口`);
  }
  const { findAvailableCell, updateCellStatus } = await import('./CabinetService.js');
  const cell = await findAvailableCell(cabinetId, preferredSize);
  if (!cell) {
    throw new Error('该柜机暂无可用格口');
  }
  if (isCellOccupied(cell.status)) {
    throw new Error('格口已被占用');
  }
  await updateCellStatus(cell.id, CELL_STATUS.OCCUPIED, `订单 ${order.orderNo} 占用`);
  await cell.update({ currentOrderId: orderId });
  await order.update({
    cabinetId,
    cellId: cell.id,
    status: ORDER_STATUS.CELL_ASSIGNED,
    assignedAt: new Date(),
  });
  return { order, cell };
}

export async function deliverOrder(orderId, deliveryData) {
  const order = await Order.findByPk(orderId);
  if (!order) {
    throw new Error('订单不存在');
  }
  if (!canTransitionOrder(order.status, ORDER_STATUS.DELIVERED)) {
    throw new Error(`订单状态 ${order.status} 无法投放`);
  }
  if (!order.cellId) {
    throw new Error('订单未分配格口');
  }
  const cell = await Cell.findByPk(order.cellId);
  if (!cell || cell.currentOrderId !== orderId) {
    throw new Error('格口信息不匹配');
  }
  if (!canTransitionCell(cell.status, CELL_STATUS.DELIVERED)) {
    throw new Error(`格口状态 ${cell.status} 无法投放`);
  }
  await cell.update({
    status: CELL_STATUS.DELIVERED,
    lastStatusChange: new Date(),
  });
  const { updateCellStatus } = await import('./CabinetService.js');
  await updateCellStatus(cell.id, CELL_STATUS.DELIVERED, `订单 ${order.orderNo} 已投放`);
  const deliveredAt = new Date();
  const timeoutAt = calculateTimeout(deliveredAt);
  await order.update({
    status: ORDER_STATUS.DELIVERED,
    deliveredAt,
    timeoutAt,
  });
  await DeliveryRecord.create({
    orderId,
    cellId: order.cellId,
    cabinetId: order.cabinetId,
    ...deliveryData,
  });
  const pickupCode = generatePickupCode();
  await PickupCode.create({
    orderId,
    cellId: order.cellId,
    code: pickupCode,
    status: PICKUP_CODE_STATUS.ACTIVE,
    expiredAt: timeoutAt,
  });
  return { order, cell, pickupCode };
}

export async function pickupByCode(code, userId) {
  const pickupCode = await PickupCode.findOne({
    where: {
      code,
      status: PICKUP_CODE_STATUS.ACTIVE,
    },
    include: [{ model: Order, as: 'order' }],
  });
  if (!pickupCode) {
    await ExceptionLog.create({
      exceptionType: EXCEPTION_TYPE.PICKUP_CODE_INVALID,
      description: `取件码 ${code} 无效`,
      userId,
      detail: JSON.stringify({ code, userId }),
    });
    throw new Error('取件码无效或已过期');
  }
  const order = pickupCode.order;
  if (!order) {
    throw new Error('关联订单不存在');
  }
  if (order.userId !== userId) {
    throw new Error('无权取此件');
  }
  if (!canTransitionOrder(order.status, ORDER_STATUS.PICKED_UP)) {
    if (order.status === ORDER_STATUS.PICKED_UP) {
      throw new Error('订单已取件');
    }
    throw new Error(`订单状态 ${order.status} 无法取件`);
  }
  const cell = await Cell.findByPk(order.cellId);
  if (!cell) {
    throw new Error('格口不存在');
  }
  if (pickupCode.expiredAt && dayjs().isAfter(pickupCode.expiredAt)) {
    await ExceptionLog.create({
      exceptionType: EXCEPTION_TYPE.PICKUP_CODE_INVALID,
      orderId: order.id,
      cellId: cell.id,
      cabinetId: order.cabinetId,
      userId,
      description: `取件码 ${code} 已过期`,
      detail: JSON.stringify({ expiredAt: pickupCode.expiredAt }),
    });
    throw new Error('取件码已过期');
  }
  await pickupCode.update({
    status: PICKUP_CODE_STATUS.USED,
    usedAt: new Date(),
    usedBy: userId,
  });
  const { updateCellStatus } = await import('./CabinetService.js');
  await updateCellStatus(cell.id, CELL_STATUS.AVAILABLE, `订单 ${order.orderNo} 已取件`);
  await cell.update({ currentOrderId: null });
  await order.update({
    status: ORDER_STATUS.PICKED_UP,
    pickedUpAt: new Date(),
  });
  return { order, cell, pickupCode };
}

export async function pickupByOrderId(orderId, userId) {
  const order = await Order.findByPk(orderId);
  if (!order) {
    throw new Error('订单不存在');
  }
  if (order.userId !== userId) {
    throw new Error('无权取此件');
  }
  const activeCode = await PickupCode.findOne({
    where: {
      orderId,
      status: PICKUP_CODE_STATUS.ACTIVE,
    },
  });
  if (!activeCode) {
    throw new Error('无有效取件码');
  }
  return pickupByCode(activeCode.code, userId);
}

export async function cancelOrder(orderId, operatorId, reason = '') {
  const order = await Order.findByPk(orderId);
  if (!order) {
    throw new Error('订单不存在');
  }
  if (!canTransitionOrder(order.status, ORDER_STATUS.CANCELLED)) {
    throw new Error(`订单状态 ${order.status} 无法取消`);
  }
  if (order.cellId) {
    const cell = await Cell.findByPk(order.cellId);
    if (cell && cell.currentOrderId === orderId) {
      if (canTransitionCell(cell.status, CELL_STATUS.AVAILABLE)) {
        const { updateCellStatus } = await import('./CabinetService.js');
        await updateCellStatus(cell.id, CELL_STATUS.AVAILABLE, `订单 ${order.orderNo} 已取消`);
        await cell.update({ currentOrderId: null });
      }
    }
  }
  await order.update({
    status: ORDER_STATUS.CANCELLED,
    remark: reason ? `取消原因: ${reason}` : order.remark,
  });
  return order;
}

export async function checkAndProcessTimeout() {
  const now = new Date();
  const orders = await Order.findAll({
    where: {
      status: ORDER_STATUS.DELIVERED,
      timeoutAt: { [Op.lte]: now },
    },
  });
  const results = [];
  for (const order of orders) {
    if (canTransitionOrder(order.status, ORDER_STATUS.TIMEOUT)) {
      await order.update({ status: ORDER_STATUS.TIMEOUT });
      await ExceptionLog.create({
        exceptionType: EXCEPTION_TYPE.TIMEOUT_UNPICKED,
        orderId: order.id,
        cellId: order.cellId,
        cabinetId: order.cabinetId,
        userId: order.userId,
        description: `订单 ${order.orderNo} 超时${PICKUP_TIMEOUT_HOURS}小时未取件`,
      });
      const existingReminder = await TimeoutReminder.findOne({
        where: { orderId: order.id, status: TIMEOUT_REMINDER_STATUS.PENDING },
      });
      if (!existingReminder) {
        await TimeoutReminder.create({
          orderId: order.id,
          userId: order.userId,
          cabinetId: order.cabinetId,
          cellId: order.cellId,
          timeoutHours: PICKUP_TIMEOUT_HOURS,
          status: TIMEOUT_REMINDER_STATUS.PENDING,
          content: `您的洗衣订单已超时${PICKUP_TIMEOUT_HOURS}小时未取，请尽快前往取件`,
        });
      }
      results.push(order);
    }
  }
  return results;
}

export async function getOrderList(params = {}) {
  const {
    page = 1,
    pageSize = 20,
    status,
    userId,
    cabinetId,
    startDate,
    endDate,
    keyword,
  } = params;
  const where = {};
  if (status) where.status = status;
  if (userId) where.userId = userId;
  if (cabinetId) where.cabinetId = cabinetId;
  if (startDate) where.createdAt = { ...where.createdAt, [Op.gte]: startDate };
  if (endDate) where.createdAt = { ...where.createdAt, [Op.lte]: endDate };
  if (keyword) {
    where[Op.or] = [
      { orderNo: { [Op.like]: `%${keyword}%` } },
      { userName: { [Op.like]: `%${keyword}%` } },
      { userPhone: { [Op.like]: `%${keyword}%` } },
    ];
  }
  const { count, rows } = await Order.findAndCountAll({
    where,
    include: [
      { model: Cabinet, as: 'cabinet' },
      { model: Cell, as: 'cell' },
    ],
    offset: (page - 1) * pageSize,
    limit: pageSize,
    order: [['createdAt', 'DESC']],
  });
  return { total: count, list: rows, page, pageSize };
}

export async function getOrderDetail(id) {
  const order = await Order.findByPk(id, {
    include: [
      { model: Cabinet, as: 'cabinet' },
      { model: Cell, as: 'cell' },
      { model: DeliveryRecord, as: 'deliveryRecord' },
      { model: PickupCode, as: 'pickupCodes' },
      { model: TimeoutReminder, as: 'timeoutReminders' },
    ],
  });
  if (!order) {
    throw new Error('订单不存在');
  }
  return order;
}
