import type { Order, TireSpec, StatusHistoryItem, UserRole } from '../../shared/types.js';
import { VALID_TRANSITIONS, ERROR_CODES, ERROR_MESSAGES } from '../../shared/types.js';
import { orders, statusHistory, usersMap } from '../store/mockStore.js';

export interface ServiceResult<T> {
  code: number;
  message: string;
  data: T | null;
}

function createResult<T>(code: number, data: T | null = null, message?: string): ServiceResult<T> {
  return {
    code,
    message: message ?? ERROR_MESSAGES[code] ?? '未知错误',
    data,
  };
}

export function validateTransition(from: string, to: string): boolean {
  const allowed = VALID_TRANSITIONS[from as keyof typeof VALID_TRANSITIONS] || [];
  return allowed.includes(to as never);
}

export function checkPermission(requiredRole: UserRole, userRole: UserRole): boolean {
  if (userRole === requiredRole) return true;
  if (userRole === 'MANAGER') return true;
  return false;
}

function genId(prefix: string): string {
  return prefix + Math.random().toString(36).slice(2, 10);
}

export function addHistory(
  orderId: string,
  fromStatus: Order['status'] | null,
  toStatus: Order['status'],
  operatorId: string,
  remark: string,
): StatusHistoryItem {
  const user = usersMap[operatorId];
  const item: StatusHistoryItem = {
    id: genId('h'),
    orderId,
    fromStatus,
    toStatus,
    operatorId,
    operatorName: user?.name ?? '未知',
    operatorRole: user?.role ?? 'RECEPTION',
    timestamp: new Date().toISOString(),
    remark,
  };
  statusHistory.push(item);
  return item;
}

export function getOrderById(orderId: string): ServiceResult<Order> {
  const order = orders.find((o) => o.id === orderId);
  if (!order) return createResult(ERROR_CODES.ORDER_NOT_FOUND);
  return createResult(ERROR_CODES.SUCCESS, { ...order });
}

export function listOrders(status?: string): ServiceResult<Order[]> {
  let list = [...orders];
  if (status) list = list.filter((o) => o.status === status);
  list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return createResult(ERROR_CODES.SUCCESS, list);
}

export function getDashboardData(userRole: UserRole): ServiceResult<{
  pendingCount: number;
  exceptionCount: number;
  completedCount: number;
  pendingList: Order[];
  exceptionList: Order[];
  completedList: Order[];
}> {
  const pendingStatuses: Order['status'][] = (() => {
    if (userRole === 'TECHNICIAN') return ['PENDING_SELECTION', 'IN_SELECTION', 'QUOTE_REJECTED'];
    if (userRole === 'MANAGER') return ['PENDING_QUOTE'];
    return ['PENDING_SELECTION', 'IN_SELECTION', 'PENDING_QUOTE', 'QUOTE_REJECTED'];
  })();

  const pendingList = orders.filter((o) => pendingStatuses.includes(o.status));
  const exceptionList = orders.filter((o) => o.isException);
  const completedList = orders.filter((o) => o.status === 'QUOTE_CONFIRMED').slice(0, 5);

  return createResult(ERROR_CODES.SUCCESS, {
    pendingCount: pendingList.length,
    exceptionCount: exceptionList.length,
    completedCount: completedList.length,
    pendingList: pendingList.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    exceptionList: exceptionList.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    completedList: completedList.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  });
}

export interface SelectionSubmitPayload {
  tireSpecs: Omit<TireSpec, 'id'>[];
  basis: string[];
  operatorId: string;
}

export function submitSelection(
  orderId: string,
  payload: SelectionSubmitPayload,
): ServiceResult<Order> {
  const orderIdx = orders.findIndex((o) => o.id === orderId);
  if (orderIdx === -1) return createResult(ERROR_CODES.ORDER_NOT_FOUND);

  const order = orders[orderIdx];
  const user = usersMap[payload.operatorId];
  if (!user) {
    return createResult(ERROR_CODES.PERMISSION_DENIED, null, '无操作权限：操作员不存在');
  }
  if (user.role !== 'TECHNICIAN') {
    return createResult(ERROR_CODES.PERMISSION_DENIED, null, '无操作权限：仅技师可提交选型');
  }

  if (!payload.tireSpecs || payload.tireSpecs.length === 0) {
    return createResult(ERROR_CODES.INVALID_PARAMS, null, '轮胎规格不能为空');
  }
  for (const ts of payload.tireSpecs) {
    if (!ts.brand || !ts.size || ts.unitPrice <= 0 || ts.quantity <= 0) {
      return createResult(ERROR_CODES.INVALID_PARAMS, null, '轮胎规格参数不完整');
    }
  }

  const currentStatus = order.status;
  const canGoToPending =
    currentStatus === 'IN_SELECTION' || currentStatus === 'QUOTE_REJECTED';
  if (!canGoToPending) {
    return createResult(ERROR_CODES.INVALID_TRANSITION, null, `当前状态[${currentStatus}]不可提交选型`);
  }

  if (currentStatus === 'IN_SELECTION' && order.selectionResponsible && order.selectionResponsible !== user.id) {
    return createResult(ERROR_CODES.PERMISSION_DENIED, null, `无操作权限：此工单选型责任人是${order.selectionResponsibleName}`);
  }
  if (currentStatus === 'QUOTE_REJECTED' && order.selectionResponsible && order.selectionResponsible !== user.id) {
    return createResult(ERROR_CODES.PERMISSION_DENIED, null, '无操作权限：驳回工单需原选型技师重新处理');
  }

  const newSpecs: TireSpec[] = payload.tireSpecs.map((ts) => ({
    ...ts,
    id: genId('t'),
  }));
  const subtotal = newSpecs.reduce((sum, ts) => sum + ts.unitPrice * ts.quantity, 0);
  const laborFee = newSpecs.reduce((sum, ts) => sum + ts.quantity * 50, 0);

  order.tireSpecs = newSpecs;
  order.selectionResponsible = user.id;
  order.selectionResponsibleName = user.name;
  order.basisMaterials = [...(order.basisMaterials || []), ...payload.basis];
  order.quote = {
    subtotal,
    laborFee,
    discount: 0,
    total: subtotal + laborFee,
  };
  order.status = 'PENDING_QUOTE';
  order.rejectReason = null;
  order.updatedAt = new Date().toISOString();
  order.isException = false;
  order.exceptionReason = undefined;
  orders[orderIdx] = order;

  addHistory(orderId, currentStatus, 'PENDING_QUOTE', payload.operatorId, `提交选型，${newSpecs.length}款轮胎`);

  return createResult(ERROR_CODES.SUCCESS, { ...order });
}

export function claimSelection(orderId: string, operatorId: string): ServiceResult<Order> {
  const orderIdx = orders.findIndex((o) => o.id === orderId);
  if (orderIdx === -1) return createResult(ERROR_CODES.ORDER_NOT_FOUND);
  const order = orders[orderIdx];
  const user = usersMap[operatorId];
  if (!user) {
    return createResult(ERROR_CODES.PERMISSION_DENIED, null, '无操作权限：操作员不存在');
  }
  if (user.role !== 'TECHNICIAN') {
    return createResult(ERROR_CODES.PERMISSION_DENIED, null, '无操作权限：仅技师可领取选型工单');
  }
  if (order.status !== 'PENDING_SELECTION' && order.status !== 'QUOTE_REJECTED') {
    return createResult(ERROR_CODES.INVALID_TRANSITION, null, '当前状态不可领取');
  }
  if (order.selectionResponsible && order.selectionResponsible !== user.id) {
    return createResult(ERROR_CODES.PERMISSION_DENIED, null, `无操作权限：此工单已由技师${order.selectionResponsibleName}领取`);
  }
  if (order.status === 'QUOTE_REJECTED' && order.selectionResponsible && order.selectionResponsible !== user.id) {
    return createResult(ERROR_CODES.PERMISSION_DENIED, null, '无操作权限：驳回工单需原选型技师重新处理');
  }
  const fromStatus = order.status;
  order.status = 'IN_SELECTION';
  order.selectionResponsible = user.id;
  order.selectionResponsibleName = user.name;
  order.updatedAt = new Date().toISOString();
  order.isException = false;
  order.exceptionReason = undefined;
  orders[orderIdx] = order;
  addHistory(orderId, fromStatus, 'IN_SELECTION', operatorId, '技师领取工单开始选型');
  return createResult(ERROR_CODES.SUCCESS, { ...order });
}

export interface QuoteActionPayload {
  action: 'confirm' | 'reject';
  rejectReason?: string;
  operatorId: string;
}

export function processQuote(
  orderId: string,
  payload: QuoteActionPayload,
): ServiceResult<Order> {
  const orderIdx = orders.findIndex((o) => o.id === orderId);
  if (orderIdx === -1) return createResult(ERROR_CODES.ORDER_NOT_FOUND);

  const order = orders[orderIdx];
  const user = usersMap[payload.operatorId];
  if (!user) {
    return createResult(ERROR_CODES.PERMISSION_DENIED, null, '无操作权限：操作员不存在');
  }
  if (user.role !== 'MANAGER') {
    return createResult(ERROR_CODES.PERMISSION_DENIED, null, '无操作权限：仅店长可处理报价');
  }
  if (order.status !== 'PENDING_QUOTE') {
    return createResult(ERROR_CODES.INVALID_TRANSITION, null, `当前状态[${order.status}]不可处理报价`);
  }
  if (!order.quote) {
    return createResult(ERROR_CODES.INVALID_AMOUNT, null, '报价数据缺失');
  }
  if (order.quote.total <= 0) {
    return createResult(ERROR_CODES.INVALID_AMOUNT, null, '报价金额异常：总金额不能为零或负数');
  }
  if (order.quote.total > 1000000) {
    return createResult(ERROR_CODES.INVALID_AMOUNT, null, '报价金额异常：单笔订单金额超过上限');
  }
  if (!order.selectionResponsible || !order.selectionResponsibleName) {
    return createResult(ERROR_CODES.INVALID_TRANSITION, null, '选型责任未记录，报价前必须完成选型责任人确认');
  }

  if (payload.action === 'reject') {
    if (!payload.rejectReason || payload.rejectReason.trim().length === 0) {
      return createResult(ERROR_CODES.REJECT_REASON_EMPTY);
    }
    order.status = 'QUOTE_REJECTED';
    order.rejectReason = payload.rejectReason.trim();
    order.quoteResponsible = user.id;
    order.quoteResponsibleName = user.name;
    order.updatedAt = new Date().toISOString();
    order.isException = true;
    order.exceptionReason = '报价被驳回，等待重新选型';
    orders[orderIdx] = order;
    addHistory(orderId, 'PENDING_QUOTE', 'QUOTE_REJECTED', payload.operatorId, `驳回报价：${payload.rejectReason}`);
    return createResult(ERROR_CODES.SUCCESS, { ...order });
  }

  order.status = 'QUOTE_CONFIRMED';
  order.quoteResponsible = user.id;
  order.quoteResponsibleName = user.name;
  order.rejectReason = null;
  order.updatedAt = new Date().toISOString();
  order.isException = false;
  order.exceptionReason = undefined;
  orders[orderIdx] = order;
  addHistory(orderId, 'PENDING_QUOTE', 'QUOTE_CONFIRMED', payload.operatorId, '店长确认报价');
  return createResult(ERROR_CODES.SUCCESS, { ...order });
}

export function getQuoteDetail(orderId: string): ServiceResult<{
  order: Order;
  history: StatusHistoryItem[];
}> {
  const order = orders.find((o) => o.id === orderId);
  if (!order) return createResult(ERROR_CODES.ORDER_NOT_FOUND);
  const history = statusHistory
    .filter((h) => h.orderId === orderId)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return createResult(ERROR_CODES.SUCCESS, { order: { ...order }, history });
}

export function getOrderHistory(orderId: string): ServiceResult<StatusHistoryItem[]> {
  const order = orders.find((o) => o.id === orderId);
  if (!order) return createResult(ERROR_CODES.ORDER_NOT_FOUND);
  const history = statusHistory
    .filter((h) => h.orderId === orderId)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return createResult(ERROR_CODES.SUCCESS, history);
}
