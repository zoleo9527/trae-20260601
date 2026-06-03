import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import {
  PickupCode,
  Order,
  Cell,
  Cabinet,
  ExceptionLog,
} from '../models/index.js';
import {
  PICKUP_CODE_STATUS,
  ORDER_STATUS,
  EXCEPTION_TYPE,
  PICKUP_TIMEOUT_HOURS,
} from '../utils/constants.js';
import { generatePickupCode } from '../utils/helpers.js';
import { canTransitionOrder } from './StateMachineService.js';
import dayjs from 'dayjs';

export async function getPickupCodeList(params = {}) {
  const {
    page = 1,
    pageSize = 20,
    orderId,
    cellId,
    cabinetId,
    status,
    code,
    startDate,
    endDate,
  } = params;

  const where = {};
  if (orderId) where.orderId = orderId;
  if (cellId) where.cellId = cellId;
  if (status) where.status = status;
  if (code) where.code = code;

  const include = [
    { model: Order, as: 'order' },
    { model: Cell, as: 'cell' },
  ];

  if (cabinetId) {
    include.push({ model: Cabinet, as: 'cabinet', where: { id: cabinetId }, required: true });
  } else {
    include.push({ model: Cabinet, as: 'cabinet', required: false });
  }

  if (startDate) where.generatedAt = { ...where.generatedAt, [Op.gte]: startDate };
  if (endDate) where.generatedAt = { ...where.generatedAt, [Op.lte]: endDate };

  const { count, rows } = await PickupCode.findAndCountAll({
    where,
    include,
    offset: (page - 1) * pageSize,
    limit: pageSize,
    order: [['generatedAt', 'DESC']],
  });
  return { total: count, list: rows, page, pageSize };
}

export async function getPickupCodeDetail(id) {
  const pickupCode = await PickupCode.findByPk(id, {
    include: [
      { model: Order, as: 'order' },
      { model: Cell, as: 'cell' },
    ],
  });
  if (!pickupCode) {
    throw new Error('取件码不存在');
  }
  return pickupCode;
}

export async function invalidateAndRegenerateCode(orderId, operatorId, reason = '') {
  const t = await sequelize.transaction();

  try {
    const order = await Order.findByPk(orderId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.status !== ORDER_STATUS.DELIVERED && order.status !== ORDER_STATUS.TIMEOUT) {
      throw new Error(`订单状态 ${order.status} 不支持重发取件码，仅已投放或超时订单可操作`);
    }

    const activeCodes = await PickupCode.findAll({
      where: {
        orderId,
        status: PICKUP_CODE_STATUS.ACTIVE,
      },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    for (const code of activeCodes) {
      await code.update({
        status: PICKUP_CODE_STATUS.EXPIRED,
        remark: `客服 ${operatorId} 作废：${reason || '取件码失效'}`,
      }, { transaction: t });
    }

    const newCodeStr = generatePickupCode();
    const timeoutAt = order.timeoutAt || dayjs().add(PICKUP_TIMEOUT_HOURS, 'hour').toDate();
    const newPickupCode = await PickupCode.create({
      orderId,
      cellId: order.cellId,
      code: newCodeStr,
      status: PICKUP_CODE_STATUS.ACTIVE,
      expiredAt: timeoutAt,
      remark: `客服 ${operatorId} 重发`,
    }, { transaction: t });

    await ExceptionLog.create({
      exceptionType: EXCEPTION_TYPE.PICKUP_CODE_INVALID,
      orderId,
      cellId: order.cellId,
      cabinetId: order.cabinetId,
      userId: order.userId,
      operatorId,
      description: `客服 ${operatorId} 处理取件码失效：${reason || '用户反馈取件码无法使用'}`,
      detail: JSON.stringify({
        invalidatedCodes: activeCodes.map(c => c.code),
        newCode: newCodeStr,
        reason,
      }),
      handled: true,
      handledBy: operatorId,
      handledAt: new Date(),
      handleResult: `作废旧码 ${activeCodes.map(c => c.code).join(', ')}，生成新码 ${newCodeStr}`,
    }, { transaction: t });

    await t.commit();

    return {
      id: newPickupCode.id,
      orderId: newPickupCode.orderId,
      cellId: newPickupCode.cellId,
      cabinetId: newPickupCode.cabinetId,
      code: newPickupCode.code,
      status: newPickupCode.status,
      generatedAt: newPickupCode.generatedAt,
      expiredAt: newPickupCode.expiredAt,
      remark: newPickupCode.remark,
      invalidatedCodes: activeCodes.map(c => c.code),
    };
  } catch (error) {
    if (!t.finished) {
      await t.rollback();
    }
    throw error;
  }
}
