import { db } from './db';
import {
  AuthTokenPayload, CarSource, CarStatus, OperationLog, OperationLogWithContext,
  OperationType, UserRole, CAR_STATUS_LABEL, ApprovalStage
} from './types';

export interface ServiceResult<T> {
  ok: boolean;
  message?: string;
  data?: T;
}

interface Operator {
  userId: string;
  name: string;
  role: UserRole;
}

function opFromAuth(user: AuthTokenPayload): Operator {
  return { userId: user.userId, name: user.name, role: user.role };
}

function recordLog(carId: string, op: Operator, type: OperationType, from: CarStatus | null, to: CarStatus, remark?: string, price?: number): OperationLog {
  return db.addLog({
    carId,
    operationType: type,
    operatorId: op.userId,
    operatorName: op.name,
    operatorRole: op.role,
    fromStatus: from,
    toStatus: to,
    remark,
    price
  });
}

export function createCarSource(user: AuthTokenPayload, input: {
  brand: string; model: string; year: number; mileage: number;
  color?: string; plateNumber?: string; vin?: string;
  ownerName?: string; ownerPhone?: string; sourceChannel?: string; expectedPrice?: number;
  remark?: string;
}): ServiceResult<CarSource> {
  if (!input.brand || !input.model || !input.year || !input.mileage) {
    return { ok: false, message: '品牌、车型、年份、里程为必填项' };
  }
  const car = db.createCar({
    brand: input.brand.trim(),
    model: input.model.trim(),
    year: input.year,
    mileage: input.mileage,
    color: input.color,
    plateNumber: input.plateNumber,
    vin: input.vin,
    ownerName: input.ownerName,
    ownerPhone: input.ownerPhone,
    sourceChannel: input.sourceChannel,
    expectedPrice: input.expectedPrice,
    createdBy: user.userId,
    currentStatus: 'draft'
  });
  recordLog(car.id, opFromAuth(user), 'create', null, 'draft', input.remark || '新建车源');
  return { ok: true, data: car };
}

export function submitToManager(user: AuthTokenPayload, carId: string, remark?: string): ServiceResult<CarSource> {
  const car = db.findCarById(carId);
  if (!car) return { ok: false, message: '车源不存在' };
  if (car.currentStatus !== 'draft') return { ok: false, message: `当前状态为「${CAR_STATUS_LABEL[car.currentStatus]}」，无法提交` };

  const managers = db.listUsersByRole('manager');
  const handler = managers[0];
  const updated = db.updateCar(carId, { currentStatus: 'manager_pending', currentHandlerId: handler?.id })!;
  recordLog(carId, opFromAuth(user), 'submit', 'draft', 'manager_pending', remark, undefined);
  return { ok: true, data: updated };
}

export function managerApprove(user: AuthTokenPayload, carId: string, managerPrice: number, remark?: string, assignAppraiserId?: string): ServiceResult<CarSource> {
  if (user.role !== 'manager' && user.role !== 'admin') return { ok: false, message: '只有收车经理可以操作' };
  const car = db.findCarById(carId);
  if (!car) return { ok: false, message: '车源不存在' };
  if (!['draft', 'manager_pending'].includes(car.currentStatus)) {
    return { ok: false, message: `当前状态为「${CAR_STATUS_LABEL[car.currentStatus]}」，收车经理无法处理` };
  }
  if (!managerPrice || managerPrice <= 0) return { ok: false, message: '请填写有效的收车估价' };

  const appraisers = db.listUsersByRole('appraiser');
  const targetId = assignAppraiserId || appraisers[0]?.id;
  const updated = db.updateCar(carId, {
    currentStatus: 'appraiser_pending',
    currentHandlerId: targetId,
    managerPrice
  })!;
  recordLog(carId, opFromAuth(user), 'manager_approve', car.currentStatus, 'appraiser_pending', remark, managerPrice);
  return { ok: true, data: updated };
}

export function managerReject(user: AuthTokenPayload, carId: string, remark: string): ServiceResult<CarSource> {
  if (user.role !== 'manager' && user.role !== 'admin') return { ok: false, message: '只有收车经理可以操作' };
  const car = db.findCarById(carId);
  if (!car) return { ok: false, message: '车源不存在' };
  if (!['draft', 'manager_pending'].includes(car.currentStatus)) {
    return { ok: false, message: `当前状态为「${CAR_STATUS_LABEL[car.currentStatus]}」，收车经理无法处理` };
  }
  if (!remark?.trim()) return { ok: false, message: '驳回必须填写原因' };
  const updated = db.updateCar(carId, { currentStatus: 'rejected', currentHandlerId: undefined })!;
  recordLog(carId, opFromAuth(user), 'manager_reject', car.currentStatus, 'rejected', remark);
  return { ok: true, data: updated };
}

export function appraiserSubmit(user: AuthTokenPayload, carId: string, appraiserPrice: number, remark?: string): ServiceResult<CarSource> {
  if (user.role !== 'appraiser' && user.role !== 'admin') return { ok: false, message: '只有评估师可以操作' };
  const car = db.findCarById(carId);
  if (!car) return { ok: false, message: '车源不存在' };
  if (car.currentStatus !== 'appraiser_pending') {
    return { ok: false, message: `当前状态为「${CAR_STATUS_LABEL[car.currentStatus]}」，评估师无需处理` };
  }
  if (car.currentHandlerId && car.currentHandlerId !== user.userId && user.role !== 'admin') {
    return { ok: false, message: '该车源分配给其他评估师' };
  }
  if (!appraiserPrice || appraiserPrice <= 0) return { ok: false, message: '请填写有效的现场评估价' };

  const finances = db.listUsersByRole('finance');
  const updated = db.updateCar(carId, {
    currentStatus: 'finance_pending',
    currentHandlerId: finances[0]?.id,
    appraiserPrice
  })!;
  recordLog(carId, opFromAuth(user), 'appraiser_submit', 'appraiser_pending', 'finance_pending', remark, appraiserPrice);
  return { ok: true, data: updated };
}

export function appraiserReject(user: AuthTokenPayload, carId: string, remark: string): ServiceResult<CarSource> {
  if (user.role !== 'appraiser' && user.role !== 'admin') return { ok: false, message: '只有评估师可以操作' };
  const car = db.findCarById(carId);
  if (!car) return { ok: false, message: '车源不存在' };
  if (car.currentStatus !== 'appraiser_pending') {
    return { ok: false, message: `当前状态为「${CAR_STATUS_LABEL[car.currentStatus]}」，评估师无法处理` };
  }
  if (!remark?.trim()) return { ok: false, message: '驳回必须填写原因' };
  const updated = db.updateCar(carId, { currentStatus: 'rejected', currentHandlerId: undefined })!;
  recordLog(carId, opFromAuth(user), 'appraiser_reject', 'appraiser_pending', 'rejected', remark);
  return { ok: true, data: updated };
}

export function financeApprove(user: AuthTokenPayload, carId: string, finalPrice: number, remark?: string): ServiceResult<CarSource> {
  if (user.role !== 'finance' && user.role !== 'admin') return { ok: false, message: '只有金融专员可以操作' };
  const car = db.findCarById(carId);
  if (!car) return { ok: false, message: '车源不存在' };
  if (car.currentStatus !== 'finance_pending') {
    return { ok: false, message: `当前状态为「${CAR_STATUS_LABEL[car.currentStatus]}」，金融专员无需处理` };
  }
  if (!finalPrice || finalPrice <= 0) return { ok: false, message: '请填写有效的审批价' };

  const updated = db.updateCar(carId, {
    currentStatus: 'approved',
    currentHandlerId: undefined,
    finalPrice
  })!;
  recordLog(carId, opFromAuth(user), 'finance_approve', 'finance_pending', 'approved', remark, finalPrice);
  return { ok: true, data: updated };
}

export function financeReject(user: AuthTokenPayload, carId: string, remark: string): ServiceResult<CarSource> {
  if (user.role !== 'finance' && user.role !== 'admin') return { ok: false, message: '只有金融专员可以操作' };
  const car = db.findCarById(carId);
  if (!car) return { ok: false, message: '车源不存在' };
  if (car.currentStatus !== 'finance_pending') {
    return { ok: false, message: `当前状态为「${CAR_STATUS_LABEL[car.currentStatus]}」，金融专员无法处理` };
  }
  if (!remark?.trim()) return { ok: false, message: '驳回必须填写原因' };
  const updated = db.updateCar(carId, { currentStatus: 'rejected', currentHandlerId: undefined })!;
  recordLog(carId, opFromAuth(user), 'finance_reject', 'finance_pending', 'rejected', remark);
  return { ok: true, data: updated };
}

export function cancelCarSource(user: AuthTokenPayload, carId: string, remark?: string): ServiceResult<CarSource> {
  const car = db.findCarById(carId);
  if (!car) return { ok: false, message: '车源不存在' };
  if (['approved', 'cancelled'].includes(car.currentStatus)) {
    return { ok: false, message: `当前状态为「${CAR_STATUS_LABEL[car.currentStatus]}」，无法取消` };
  }
  if (car.createdBy !== user.userId && user.role !== 'admin') {
    return { ok: false, message: '只有创建人或管理员可以取消' };
  }
  const updated = db.updateCar(carId, { currentStatus: 'cancelled', currentHandlerId: undefined })!;
  recordLog(carId, opFromAuth(user), 'cancel', car.currentStatus, 'cancelled', remark);
  return { ok: true, data: updated };
}

export function addComment(user: AuthTokenPayload, carId: string, remark: string): ServiceResult<OperationLog> {
  const car = db.findCarById(carId);
  if (!car) return { ok: false, message: '车源不存在' };
  if (!remark?.trim()) return { ok: false, message: '备注内容不能为空' };
  const log = recordLog(carId, opFromAuth(user), 'add_comment', car.currentStatus, car.currentStatus, remark);
  db.updateCar(carId, {});
  return { ok: true, data: log };
}

export function getCarDetail(_user: AuthTokenPayload, carId: string): ServiceResult<{ car: CarSource; logs: OperationLog[] }> {
  const car = db.findCarById(carId);
  if (!car) return { ok: false, message: '车源不存在' };
  const logs = db.listLogsByCar(carId);
  return { ok: true, data: { car, logs } };
}

export function listCarsForUser(user: AuthTokenPayload, query?: { status?: CarStatus[]; keyword?: string; scope?: 'mine' | 'all' | 'pending' }): ServiceResult<CarSource[]> {
  const filters: { status?: CarStatus[]; handlerId?: string; createdBy?: string; keyword?: string } = { keyword: query?.keyword };
  if (query?.status?.length) filters.status = query.status;

  switch (query?.scope) {
    case 'mine':
      filters.createdBy = user.userId;
      break;
    case 'pending':
      filters.handlerId = user.userId;
      if (!filters.status) {
        filters.status = ['manager_pending', 'appraiser_pending', 'finance_pending'];
      }
      break;
    case 'all':
    default:
      if (user.role === 'manager') {
        filters.status = filters.status || ['draft', 'manager_pending', 'appraiser_pending', 'finance_pending', 'approved', 'rejected', 'cancelled'];
      } else if (user.role === 'appraiser') {
        filters.status = filters.status || ['appraiser_pending', 'finance_pending', 'approved', 'rejected', 'cancelled'];
      } else if (user.role === 'finance') {
        filters.status = filters.status || ['finance_pending', 'approved', 'rejected', 'cancelled'];
      }
      break;
  }
  return { ok: true, data: db.listCars(filters) };
}

export function exportApprovalSheet(_user: AuthTokenPayload, carId: string): ServiceResult<{ filename: string; content: string; format: 'csv' | 'txt' }> {
  const detail = getCarDetail(_user, carId);
  if (!detail.ok || !detail.data) return { ok: false, message: detail.message };
  const { car, logs } = detail.data;

  const handlerUser = car.currentHandlerId ? db.findUserById(car.currentHandlerId) : null;
  const handlerLabel = handlerUser
    ? `${handlerUser.name}（${roleLabel(handlerUser.role)}）`
    : car.currentStatus === 'approved' ? '已审批通过，无待处理人'
    : car.currentStatus === 'rejected' ? '已驳回，无待处理人'
    : car.currentStatus === 'cancelled' ? '已取消，无待处理人'
    : '暂无';

  const latestLog = logs.length > 0 ? logs[logs.length - 1] : null;
  const latestTime = latestLog ? latestLog.createdAt : car.updatedAt;

  const keyRemarks = logs
    .filter(l => l.remark && l.remark.trim() && ['submit', 'manager_approve', 'manager_reject', 'appraiser_submit', 'appraiser_reject', 'finance_approve', 'finance_reject', 'cancel', 'add_comment'].includes(l.operationType))
    .map(l => `[${l.createdAt}] ${l.operatorName}: ${l.remark}`)
    .slice(-5);

  const lines: string[] = [];
  lines.push('======= 二手车源收购审批单 =======');
  lines.push(`车源编号: ${car.carNo}`);
  lines.push(`车辆信息: ${car.brand} ${car.model} / ${car.year}年 / ${car.mileage.toLocaleString()}公里`);
  lines.push(`颜色: ${car.color || '-'}  车牌: ${car.plateNumber || '-'}  VIN: ${car.vin || '-'}`);
  lines.push(`车主: ${car.ownerName || '-'}  联系电话: ${car.ownerPhone || '-'}`);
  lines.push(`来源渠道: ${car.sourceChannel || '-'}`);
  lines.push('');
  lines.push(`车主期望价: ${car.expectedPrice ? '¥' + car.expectedPrice.toLocaleString() : '-'}`);
  lines.push(`收车经理估价: ${car.managerPrice ? '¥' + car.managerPrice.toLocaleString() : '-'}`);
  lines.push(`评估师现场价: ${car.appraiserPrice ? '¥' + car.appraiserPrice.toLocaleString() : '-'}`);
  lines.push(`金融审批价: ${car.finalPrice ? '¥' + car.finalPrice.toLocaleString() : '-'}`);
  lines.push(`当前状态: ${CAR_STATUS_LABEL[car.currentStatus]}`);
  lines.push('');
  lines.push('--- 交班关键信息 ---');
  lines.push(`当前责任人: ${handlerLabel}`);
  lines.push(`最近处理时间: ${latestTime}`);
  lines.push(`关键备注摘要:`);
  if (keyRemarks.length > 0) {
    keyRemarks.forEach(r => lines.push(`  · ${r}`));
  } else {
    lines.push('  （无）');
  }
  lines.push('');
  lines.push('--- 流转历史（按时间顺序） ---');
  logs.forEach((log, idx) => {
    const from = log.fromStatus ? CAR_STATUS_LABEL[log.fromStatus] : '（无）';
    const to = CAR_STATUS_LABEL[log.toStatus];
    const priceTxt = log.price ? `  价格: ¥${log.price.toLocaleString()}` : '';
    lines.push(`${idx + 1}. [${log.createdAt}] ${log.operatorName}(${roleLabel(log.operatorRole)}) 操作:${operationLabel(log.operationType)}  ${from} → ${to}${priceTxt}`);
    if (log.remark) lines.push(`   备注: ${log.remark}`);
  });
  lines.push('');
  lines.push(`导出时间: ${new Date().toISOString()}`);
  return { ok: true, data: { filename: `审批单_${car.carNo}.txt`, content: lines.join('\n'), format: 'txt' } };
}

export function exportOperationLogs(
  user: AuthTokenPayload,
  query?: {
    from?: string; to?: string;
    operationType?: OperationType[]; operatorId?: string;
    handlerRole?: UserRole[]; stage?: ApprovalStage[];
  }
): ServiceResult<{ filename: string; content: string; format: 'csv' | 'txt' }> {
  const result = listLogsWithContext(user, query);
  if (!result.ok || !result.data) return { ok: false, message: result.message };
  const logs = result.data;

  const header = [
    '时间', '操作人', '角色', '车源编号', '操作类型',
    '起始状态', '目标状态', '价格', '备注',
    '审批阶段', '当前责任人', '最近处理时间', '关键备注摘要'
  ];
  const rows = [header.join(',')];
  logs.forEach(log => {
    rows.push([
      log.createdAt,
      log.operatorName,
      roleLabel(log.operatorRole),
      log.carNo || log.carId.slice(0, 8),
      operationLabel(log.operationType),
      log.fromStatus ? CAR_STATUS_LABEL[log.fromStatus] : '',
      CAR_STATUS_LABEL[log.toStatus],
      log.price ? String(log.price) : '',
      `"${(log.remark || '').replace(/"/g, '""')}"`,
      log.approvalStage ? APPROVAL_STAGE_LABEL[log.approvalStage] : '',
      `"${log.currentHandlerName || '-'}"`,
      log.latestHandledAt || '',
      `"${(log.keyRemarksSummary || '-').replace(/"/g, '""')}"`
    ].join(','));
  });
  return { ok: true, data: { filename: `操作日志_${new Date().toISOString().slice(0, 10)}.csv`, content: '\ufeff' + rows.join('\n'), format: 'csv' } };
}

function roleLabel(r: UserRole): string {
  return { admin: '管理员', manager: '收车经理', appraiser: '评估师', finance: '金融专员' }[r];
}

function operationLabel(t: OperationType): string {
  return {
    create: '创建车源',
    submit: '提交审批',
    manager_approve: '收车经理通过',
    manager_reject: '收车经理驳回',
    appraiser_submit: '评估师完成估价',
    appraiser_reject: '评估师驳回',
    finance_approve: '金融审批通过',
    finance_reject: '金融审批驳回',
    cancel: '取消车源',
    update_info: '更新信息',
    add_comment: '添加备注'
  }[t];
}

export const OPERATION_LABEL: Record<OperationType, string> = {
  create: '创建车源',
  submit: '提交审批',
  manager_approve: '收车经理通过',
  manager_reject: '收车经理驳回',
  appraiser_submit: '评估师完成估价',
  appraiser_reject: '评估师驳回',
  finance_approve: '金融审批通过',
  finance_reject: '金融审批驳回',
  cancel: '取消车源',
  update_info: '更新信息',
  add_comment: '添加备注'
};

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: '管理员',
  manager: '收车经理',
  appraiser: '评估师',
  finance: '金融专员'
};

export const APPROVAL_STAGE_LABEL: Record<ApprovalStage, string> = {
  manager: '收车经理阶段',
  appraiser: '评估师阶段',
  finance: '金融审批阶段',
  done: '已完成',
  terminal: '已终止'
};

function statusToStage(status: CarStatus): ApprovalStage {
  switch (status) {
    case 'draft':
    case 'manager_pending': return 'manager';
    case 'appraiser_pending': return 'appraiser';
    case 'finance_pending': return 'finance';
    case 'approved': return 'done';
    case 'rejected':
    case 'cancelled': return 'terminal';
  }
}

function getCarHandoverContext(carId: string): {
  car: CarSource | undefined;
  carNo: string;
  handlerName: string;
  handlerRole?: UserRole;
  latestHandledAt: string;
  keyRemarksSummary: string;
  stage: ApprovalStage;
} {
  const car = db.findCarById(carId);
  const carLogs = car ? db.listLogsByCar(carId) : [];
  const handlerUser = car?.currentHandlerId ? db.findUserById(car.currentHandlerId) : undefined;
  const latestLog = carLogs.length > 0 ? carLogs[carLogs.length - 1] : null;

  const keyRemarks = carLogs
    .filter(l => l.remark && l.remark.trim() &&
      ['submit', 'manager_approve', 'manager_reject', 'appraiser_submit', 'appraiser_reject',
       'finance_approve', 'finance_reject', 'cancel', 'add_comment'].includes(l.operationType))
    .map(l => `${l.operatorName}: ${l.remark}`)
    .slice(-3)
    .join('；') || '-';

  return {
    car,
    carNo: car?.carNo || carId.slice(0, 8),
    handlerName: handlerUser?.name || (
      car?.currentStatus === 'approved' ? '已审批通过' :
      car?.currentStatus === 'rejected' ? '已驳回' :
      car?.currentStatus === 'cancelled' ? '已取消' : '-'
    ),
    handlerRole: handlerUser?.role,
    latestHandledAt: latestLog?.createdAt || car?.updatedAt || '-',
    keyRemarksSummary: keyRemarks,
    stage: car ? statusToStage(car.currentStatus) : 'terminal'
  };
}

export function listLogsWithContext(
  _user: AuthTokenPayload,
  query?: {
    from?: string; to?: string;
    operationType?: OperationType[]; operatorId?: string;
    handlerRole?: UserRole[]; stage?: ApprovalStage[];
  }
): ServiceResult<OperationLogWithContext[]> {
  const logs = db.listAllLogs({
    from: query?.from, to: query?.to,
    operationType: query?.operationType, operatorId: query?.operatorId
  });

  const carCtxCache = new Map<string, ReturnType<typeof getCarHandoverContext>>();
  function ctxOf(carId: string) {
    if (!carCtxCache.has(carId)) carCtxCache.set(carId, getCarHandoverContext(carId));
    return carCtxCache.get(carId)!;
  }

  let enriched: OperationLogWithContext[] = logs.map(log => {
    const ctx = ctxOf(log.carId);
    return {
      ...log,
      carNo: ctx.carNo,
      currentHandlerName: ctx.handlerName,
      currentHandlerRole: ctx.handlerRole,
      latestHandledAt: ctx.latestHandledAt,
      keyRemarksSummary: ctx.keyRemarksSummary,
      approvalStage: ctx.stage
    };
  });

  if (query?.handlerRole?.length) {
    enriched = enriched.filter(l => l.currentHandlerRole && query.handlerRole!.includes(l.currentHandlerRole));
  }
  if (query?.stage?.length) {
    enriched = enriched.filter(l => l.approvalStage && query.stage!.includes(l.approvalStage));
  }

  return { ok: true, data: enriched };
}
