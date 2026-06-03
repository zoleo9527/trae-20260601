import { Op } from 'sequelize';
import {
  TimeoutReminder,
  Order,
  Cell,
  Cabinet,
} from '../models/index.js';
import { TIMEOUT_REMINDER_STATUS } from '../utils/constants.js';

export async function createTimeoutReminder(data) {
  const reminder = await TimeoutReminder.create(data);
  return reminder;
}

export async function markAsSent(id, sentAt = new Date()) {
  const reminder = await TimeoutReminder.findByPk(id);
  if (!reminder) {
    throw new Error('提醒记录不存在');
  }
  await reminder.update({
    status: TIMEOUT_REMINDER_STATUS.SENT,
    sentAt,
  });
  return reminder;
}

export async function markAsAcknowledged(id, acknowledgedAt = new Date()) {
  const reminder = await TimeoutReminder.findByPk(id);
  if (!reminder) {
    throw new Error('提醒记录不存在');
  }
  await reminder.update({
    status: TIMEOUT_REMINDER_STATUS.ACKNOWLEDGED,
    acknowledgedAt,
  });
  return reminder;
}

export async function getPendingReminders() {
  const reminders = await TimeoutReminder.findAll({
    where: {
      status: TIMEOUT_REMINDER_STATUS.PENDING,
    },
    include: [
      { model: Order, as: 'order' },
      { model: Cell, as: 'cell' },
      { model: Cabinet, as: 'cabinet' },
    ],
    order: [['createdAt', 'ASC']],
  });
  return reminders;
}

export async function getTimeoutReminderList(params = {}) {
  const {
    page = 1,
    pageSize = 20,
    status,
    userId,
    cabinetId,
    startDate,
    endDate,
  } = params;
  const where = {};
  if (status) where.status = status;
  if (userId) where.userId = userId;
  if (cabinetId) where.cabinetId = cabinetId;
  if (startDate) where.createdAt = { ...where.createdAt, [Op.gte]: startDate };
  if (endDate) where.createdAt = { ...where.createdAt, [Op.lte]: endDate };
  const { count, rows } = await TimeoutReminder.findAndCountAll({
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

export async function getTimeoutReminderDetail(id) {
  const reminder = await TimeoutReminder.findByPk(id, {
    include: [
      { model: Order, as: 'order' },
      { model: Cell, as: 'cell' },
      { model: Cabinet, as: 'cabinet' },
    ],
  });
  if (!reminder) {
    throw new Error('提醒记录不存在');
  }
  return reminder;
}
