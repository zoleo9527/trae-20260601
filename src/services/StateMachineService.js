import {
  CELL_STATUS,
  ORDER_STATUS,
  REMOTE_OPEN_STATUS,
  EXCEPTION_TYPE,
  PICKUP_CODE_STATUS,
  PICKUP_TIMEOUT_HOURS,
} from '../utils/constants.js';
import dayjs from 'dayjs';

export const CELL_TRANSITIONS = {
  [CELL_STATUS.AVAILABLE]: [CELL_STATUS.OCCUPIED, CELL_STATUS.MAINTENANCE, CELL_STATUS.MALFUNCTION],
  [CELL_STATUS.OCCUPIED]: [CELL_STATUS.DELIVERED, CELL_STATUS.AVAILABLE, CELL_STATUS.MALFUNCTION],
  [CELL_STATUS.DELIVERED]: [CELL_STATUS.AVAILABLE, CELL_STATUS.MALFUNCTION],
  [CELL_STATUS.MALFUNCTION]: [CELL_STATUS.AVAILABLE, CELL_STATUS.MAINTENANCE],
  [CELL_STATUS.MAINTENANCE]: [CELL_STATUS.AVAILABLE, CELL_STATUS.MALFUNCTION],
};

export const ORDER_TRANSITIONS = {
  [ORDER_STATUS.CREATED]: [ORDER_STATUS.CELL_ASSIGNED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CELL_ASSIGNED]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.DELIVERED]: [ORDER_STATUS.PICKED_UP, ORDER_STATUS.TIMEOUT],
  [ORDER_STATUS.PICKED_UP]: [],
  [ORDER_STATUS.CANCELLED]: [],
  [ORDER_STATUS.TIMEOUT]: [ORDER_STATUS.PICKED_UP],
};

export const REMOTE_OPEN_TRANSITIONS = {
  [REMOTE_OPEN_STATUS.PENDING]: [REMOTE_OPEN_STATUS.APPROVED, REMOTE_OPEN_STATUS.REJECTED],
  [REMOTE_OPEN_STATUS.APPROVED]: [REMOTE_OPEN_STATUS.EXECUTED, REMOTE_OPEN_STATUS.FAILED],
  [REMOTE_OPEN_STATUS.REJECTED]: [],
  [REMOTE_OPEN_STATUS.EXECUTED]: [],
  [REMOTE_OPEN_STATUS.FAILED]: [],
};

export function canTransitionCell(currentStatus, targetStatus) {
  const allowed = CELL_TRANSITIONS[currentStatus] || [];
  return allowed.includes(targetStatus);
}

export function canTransitionOrder(currentStatus, targetStatus) {
  const allowed = ORDER_TRANSITIONS[currentStatus] || [];
  return allowed.includes(targetStatus);
}

export function canTransitionRemoteOpen(currentStatus, targetStatus) {
  const allowed = REMOTE_OPEN_TRANSITIONS[currentStatus] || [];
  return allowed.includes(targetStatus);
}

export function canRequestRemoteOpen(orderStatus) {
  return [ORDER_STATUS.DELIVERED, ORDER_STATUS.TIMEOUT].includes(orderStatus);
}

export function canCellBeRemoteOpened(cellStatus, orderStatus) {
  if (cellStatus !== CELL_STATUS.DELIVERED) {
    return { allowed: false, reason: `格口状态 ${cellStatus} 不允许远程开柜，仅已投放(${CELL_STATUS.DELIVERED})的格口可开柜` };
  }
  if (!orderStatus) {
    return { allowed: false, reason: '该格口无关联有效订单' };
  }
  if (orderStatus === ORDER_STATUS.PICKED_UP) {
    return { allowed: false, reason: `订单状态 ${orderStatus} 已取件，不允许远程开柜` };
  }
  if (orderStatus === ORDER_STATUS.CANCELLED) {
    return { allowed: false, reason: `订单状态 ${orderStatus} 已取消，不允许远程开柜` };
  }
  if (!canRequestRemoteOpen(orderStatus)) {
    return { allowed: false, reason: `订单状态 ${orderStatus} 未投放，不允许远程开柜` };
  }
  return { allowed: true, reason: '' };
}

export function isCellOccupied(cellStatus) {
  return [CELL_STATUS.OCCUPIED, CELL_STATUS.DELIVERED].includes(cellStatus);
}

export function calculateTimeout(deliveredAt) {
  return dayjs(deliveredAt).add(PICKUP_TIMEOUT_HOURS, 'hour').toDate();
}

export function isOrderTimeout(deliveredAt) {
  if (!deliveredAt) return false;
  return dayjs().isAfter(calculateTimeout(deliveredAt));
}

export function getExceptionTypeDescription(type) {
  const descriptions = {
    [EXCEPTION_TYPE.DOOR_STUCK]: '柜门卡住无法打开',
    [EXCEPTION_TYPE.PICKUP_CODE_INVALID]: '取件码无效或已过期',
    [EXCEPTION_TYPE.CELL_OCCUPIED_ERROR]: '格口占用状态异常',
    [EXCEPTION_TYPE.TIMEOUT_UNPICKED]: '超时未取件',
    [EXCEPTION_TYPE.CABINET_OFFLINE]: '柜机离线',
    [EXCEPTION_TYPE.OTHER]: '其他异常',
  };
  return descriptions[type] || '未知异常';
}

export function getPickupCodeStatus(cellStatus, orderStatus, expiredAt) {
  if (orderStatus === ORDER_STATUS.PICKED_UP) {
    return PICKUP_CODE_STATUS.USED;
  }
  if (expiredAt && dayjs().isAfter(expiredAt)) {
    return PICKUP_CODE_STATUS.EXPIRED;
  }
  if ([CELL_STATUS.DELIVERED].includes(cellStatus) &&
      [ORDER_STATUS.DELIVERED, ORDER_STATUS.TIMEOUT].includes(orderStatus)) {
    return PICKUP_CODE_STATUS.ACTIVE;
  }
  return PICKUP_CODE_STATUS.EXPIRED;
}
