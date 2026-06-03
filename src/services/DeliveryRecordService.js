import { Op } from 'sequelize';
import {
  DeliveryRecord,
  Order,
  Cell,
  Cabinet,
} from '../models/index.js';

export async function getDeliveryRecordList(params = {}) {
  const {
    page = 1,
    pageSize = 20,
    orderId,
    cabinetId,
    cellId,
    deliveryStaffId,
    startDate,
    endDate,
  } = params;
  const where = {};
  if (orderId) where.orderId = orderId;
  if (cabinetId) where.cabinetId = cabinetId;
  if (cellId) where.cellId = cellId;
  if (deliveryStaffId) where.deliveryStaffId = deliveryStaffId;
  if (startDate) where.deliveryTime = { ...where.deliveryTime, [Op.gte]: startDate };
  if (endDate) where.deliveryTime = { ...where.deliveryTime, [Op.lte]: endDate };
  const { count, rows } = await DeliveryRecord.findAndCountAll({
    where,
    include: [
      { model: Order, as: 'order' },
      { model: Cell, as: 'cell' },
      { model: Cabinet, as: 'cabinet' },
    ],
    offset: (page - 1) * pageSize,
    limit: pageSize,
    order: [['deliveryTime', 'DESC']],
  });
  return { total: count, list: rows, page, pageSize };
}

export async function getDeliveryRecordDetail(id) {
  const record = await DeliveryRecord.findByPk(id, {
    include: [
      { model: Order, as: 'order' },
      { model: Cell, as: 'cell' },
      { model: Cabinet, as: 'cabinet' },
    ],
  });
  if (!record) {
    throw new Error('投递记录不存在');
  }
  return record;
}
