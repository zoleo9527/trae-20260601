import { createApiRouter, ApiRouter, ApiRequest, ApiResponse } from '../mock/handlers';
import { ServiceFactory } from '../mock/serviceFactory';
import { OrderStatus, ReturnReason } from '../types';

const sep = (t: string) => {
  console.log('\n' + '='.repeat(80));
  console.log(`  ${t}`);
  console.log('='.repeat(80));
};
const step = (n: number, d: string) => {
  console.log(`\n  [步骤 ${n}] ${d}`);
  console.log('  ' + '-'.repeat(60));
};


const today = () => new Date().toISOString().slice(0, 10);
const daysLater = (d: number) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);

function showReq(req: ApiRequest): void {
  console.log(`  >>> ${req.method} ${req.path}`, req.query || '', req.body || '');
}

function showRes(res: ApiResponse): void {
  if (res.status === 200) {
    const data = res.data as any;
    if (data && typeof data === 'object' && 'status' in data) {
      console.log(`  <<< ${res.status} status=${data.status}`);
    } else if (Array.isArray(data)) {
      console.log(`  <<< ${res.status} items=${data.length}`);
    } else {
      console.log(`  <<< ${res.status}`, JSON.stringify(data).slice(0, 120));
    }
  } else {
    console.log(`  <<< ${res.status} ${res.message || ''}`);
  }
}

function assertOk(res: ApiResponse, msg: string): void {
  if (res.status !== 200) {
    throw new Error(`Assertion failed: ${msg} - Expected status 200, got ${res.status}. Message: ${res.message || 'no message'}`);
  }
}

function assertEqual(actual: unknown, expected: unknown, msg: string): void {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${msg} - Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}


export function runRemindFlowExample(): void {
  sep('【Flow A】顺利流：催单订单 → 安装 → 完成 → 归档');
  ServiceFactory.reset();
  const router = createApiRouter();

  step(1, 'GET /api/orders/ORD-003 - 查询催单订单详情');
  let req: ApiRequest = { method: 'GET', path: '/api/orders/ORD-003' };
  showReq(req);
  let res = router.invoke(req);
  showRes(res);
  assertOk(res, 'GET /api/orders/ORD-003');
  const o3 = res.data as any;
  assertEqual(o3.status, OrderStatus.REMINDED, 'Order ORD-003 status should be REMINDED');
  assertEqual(!!o3.schedule, true, 'Order ORD-003 should have a schedule');
  console.log(`    客户: ${o3.customerSnapshot.name} | 状态: ${o3.status}`);
  console.log(`    预约: ${o3.appointment?.preferredDate} ${o3.appointment?.preferredTimeSlot}`);
  console.log(`    排班: ${o3.schedule?.scheduledDate} 师傅=${o3.schedule?.installerId}`);

  step(2, 'GET /api/schedules/installer/U-004 - 师傅排班回看');
  req = { method: 'GET', path: '/api/schedules/installer/U-004', query: { startDate: today(), endDate: daysLater(7) } };
  showReq(req);
  res = router.invoke(req);
  showRes(res);
  assertOk(res, 'GET /api/schedules/installer/U-004');
  const schedules = res.data as any[];
  assertEqual(schedules.length > 0, true, 'Installer U-004 should have schedules');
  step(3, 'POST /api/orders/ORD-003/start-installation');
  req = { method: 'POST', path: '/api/orders/ORD-003/start-installation', body: { installerId: 'U-004' } };
  showReq(req);
  res = router.invoke(req);
  showRes(res);
  assertOk(res, 'POST /api/orders/ORD-003/start-installation');
  const orderStart = res.data as any;
  assertEqual(orderStart.status, OrderStatus.INSTALLING, 'Order status should be INSTALLING after start');
  assertEqual(orderStart.schedule.status, 'IN_PROGRESS', 'Schedule status should be IN_PROGRESS after start');

  step(4, 'POST /api/orders/ORD-003/complete');
  req = { method: 'POST', path: '/api/orders/ORD-003/complete', body: { installerId: 'U-004' } };
  showReq(req);
  res = router.invoke(req);
  showRes(res);
  assertOk(res, 'POST /api/orders/ORD-003/complete');
  const orderComplete = res.data as any;
  assertEqual(orderComplete.status, OrderStatus.COMPLETED, 'Order status should be COMPLETED after complete');
  assertEqual(orderComplete.schedule.status, 'COMPLETED', 'Schedule status should be COMPLETED after complete');
  step(5, 'POST /api/orders/ORD-003/archive');
  req = { method: 'POST', path: '/api/orders/ORD-003/archive', body: { operatorId: 'U-001' } };
  showReq(req);
  res = router.invoke(req);
  showRes(res);
  assertOk(res, 'POST /api/orders/ORD-003/archive');
  const orderArchive = res.data as any;
  assertEqual(orderArchive.status, OrderStatus.ARCHIVED, 'Order status should be ARCHIVED after archive');
  assertEqual(!!orderArchive.archivedAt, true, 'Order should have archivedAt after archive');

  step(6, 'GET /api/orders/ORD-003/audit-logs - 完整审计轨迹');
  req = { method: 'GET', path: '/api/orders/ORD-003/audit-logs' };
  showReq(req);
  res = router.invoke(req);
  showRes(res);
  assertOk(res, 'GET /api/orders/ORD-003/audit-logs');
  const auditLogs = res.data as any[];
  assertEqual(auditLogs.length >= 3, true, 'Audit logs should have at least 3 entries (start + complete + archive)');
}

export function runReturnAndSupplementFlowExample(): void {
  sep('【Flow B】问题流：退回 + 补料');
  ServiceFactory.reset();
  const router = createApiRouter();

  step(1, 'POST /api/orders/ORD-002/appointment - 创建预约');
  let req: ApiRequest = {
    method: 'POST', path: '/api/orders/ORD-002/appointment',
    body: { preferredDate: daysLater(3), preferredTimeSlot: '10:00-12:00', createdBy: 'U-001' },
  };
  showReq(req);
  let res = router.invoke(req);
  showRes(res);
  assertOk(res, 'POST /api/orders/ORD-002/appointment');
  const orderAfterAppointment = res.data as any;
  assertEqual(orderAfterAppointment.status, OrderStatus.APPOINTED, 'Order status should be APPOINTED after appointment');
  assertEqual(orderAfterAppointment.appointment.createdBy, 'U-001', 'Appointment createdBy should be U-001');
  step(2, 'GET /api/schedules/available - 查询可用师傅');
  req = { method: 'GET', path: '/api/schedules/available', query: { date: daysLater(3), timeSlot: '10:00-12:00' } };
  showReq(req);
  res = router.invoke(req);
  showRes(res);
  assertOk(res, 'GET /api/schedules/available');

  step(3, 'POST /api/orders/ORD-002/schedule - 指派师傅U-005');
  req = {
    method: 'POST', path: '/api/orders/ORD-002/schedule',
    body: { installerId: 'U-005', scheduledDate: daysLater(3), timeSlot: '10:00-12:00', assignedBy: 'U-002', estimatedDurationHours: 2 },
  };
  showReq(req);
  res = router.invoke(req);
  showRes(res);
  assertOk(res, 'POST /api/orders/ORD-002/schedule');
  const orderAfterSchedule = res.data as any;
  assertEqual(orderAfterSchedule.status, OrderStatus.INSTALLATION_SCHEDULED, 'Order status should be INSTALLATION_SCHEDULED after schedule');
  assertEqual(orderAfterSchedule.schedule.installerId, 'U-005', 'Schedule installerId should be U-005');
  step(4, 'POST /api/orders/ORD-002/remind - 客户催单');
  req = { method: 'POST', path: '/api/orders/ORD-002/remind', body: { operatorId: 'U-001', reason: '客户催促尽快安装' } };
  showReq(req);
  res = router.invoke(req);
  showRes(res);
  assertOk(res, 'POST /api/orders/ORD-002/remind');
  const orderAfterRemind = res.data as any;
  assertEqual(orderAfterRemind.status, OrderStatus.REMINDED, 'Order status should be REMINDED after remind');

  step(5, 'PUT /api/orders/ORD-002/schedule/reassign - 改派U-004');
  req = {
    method: 'PUT', path: '/api/orders/ORD-002/schedule/reassign',
    body: { newInstallerId: 'U-004', reason: 'U-005临时有事', reassignedBy: 'U-002' },
  };
  showReq(req);
  res = router.invoke(req);
  showRes(res);
  assertOk(res, 'PUT /api/orders/ORD-002/schedule/reassign');
  const orderAfterReassign = res.data as any;
  assertEqual(orderAfterReassign.schedule.installerId, 'U-004', 'Schedule installerId should be U-004 after reassign');
  step(6, 'POST /api/orders/ORD-002/start-installation - 开始安装');
  req = { method: 'POST', path: '/api/orders/ORD-002/start-installation', body: { installerId: 'U-004' } };
  showReq(req);
  res = router.invoke(req);
  showRes(res);
  assertOk(res, 'POST /api/orders/ORD-002/start-installation');
  const orderAfterStart = res.data as any;
  assertEqual(orderAfterStart.status, OrderStatus.INSTALLING, 'Order status should be INSTALLING after start');

  step(7, 'POST /api/orders/ORD-002/return - 退回(WRONG_SIZE)');
  req = {
    method: 'POST', path: '/api/orders/ORD-002/return',
    body: { reason: ReturnReason.WRONG_SIZE, detailedReason: '窗户尺寸不符', returnedBy: 'U-004' },
  };
  showReq(req);
  res = router.invoke(req);
  showRes(res);
  assertOk(res, 'POST /api/orders/ORD-002/return');
  const orderAfterReturn = res.data as any;
  assertEqual(orderAfterReturn.status, OrderStatus.RETURNED, 'Order status should be RETURNED after return');
  assertEqual(orderAfterReturn.returnRecord.reason, ReturnReason.WRONG_SIZE, 'Return reason should be WRONG_SIZE');
  step(8, 'POST /api/orders/ORD-002/handle-return - 处理退回');
  req = { method: 'POST', path: '/api/orders/ORD-002/handle-return', body: { handledBy: 'U-002', handlingNotes: '安排补料' } };
  showReq(req);
  res = router.invoke(req);
  showRes(res);
  assertOk(res, 'POST /api/orders/ORD-002/handle-return');
  const orderAfterHandleReturn = res.data as any;
  assertEqual(orderAfterHandleReturn.status, OrderStatus.MEASURED, 'Order status should be MEASURED after handle-return');
  assertEqual(orderAfterHandleReturn.returnRecord.handlingNotes, '安排补料', 'Return handlingNotes should be 安排补料');

  step(9, 'POST /api/orders/ORD-002/supplement - 申请补料');
  req = {
    method: 'POST', path: '/api/orders/ORD-002/supplement',
    body: {
      items: [
        { name: '天鹅绒窗帘(重制)', quantity: 1, unit: '片', description: '按实际窗宽加15cm' },
        { name: '幔头挂钩', quantity: 12, unit: '个', description: '3爪标准挂钩' },
      ],
      urgency: 'URGENT',
      notes: '客户催单，工厂加急',
      requestedBy: 'U-002',
    },
  };
  showReq(req);
  res = router.invoke(req);
  showRes(res);
  assertOk(res, 'POST /api/orders/ORD-002/supplement');
  const orderAfterSupplement = res.data as any;
  assertEqual(orderAfterSupplement.status, OrderStatus.MATERIALS_NEEDED, 'Order status should be MATERIALS_NEEDED after supplement');
  assertEqual(orderAfterSupplement.supplementRecords.length >= 1, true, 'Supplement records should have at least 1 entry');
  const supplement = (res.data as any).supplementRecords?.[(res.data as any).supplementRecords.length - 1];

  step(10, 'POST supplement/fulfill + supplement/receive - 补料发货与签收');
  if (supplement) {
    req = { method: 'POST', path: `/api/orders/ORD-002/supplement/${supplement.id}/fulfill`, body: { fulfilledBy: 'U-003' } };
    showReq(req);
    res = router.invoke(req);
    showRes(res);
    assertOk(res, `POST /api/orders/ORD-002/supplement/${supplement.id}/fulfill`);

    req = { method: 'POST', path: `/api/orders/ORD-002/supplement/${supplement.id}/receive`, body: { receivedBy: 'U-004' } };
    showReq(req);
    res = router.invoke(req);
    showRes(res);
    assertOk(res, `POST /api/orders/ORD-002/supplement/${supplement.id}/receive`);
    const orderAfterReceive = res.data as any;
    assertEqual(orderAfterReceive.status, OrderStatus.MEASURED, 'Order status should be MEASURED after supplement receive');
  }

  step(11, 'POST appointment + POST schedule - 重新预约排班');
  req = {
    method: 'POST', path: '/api/orders/ORD-002/appointment',
    body: { preferredDate: daysLater(5), preferredTimeSlot: '14:00-16:00', createdBy: 'U-001', notes: '补料到货后二次预约' },
  };
  showReq(req);
  res = router.invoke(req);
  showRes(res);
  assertOk(res, 'POST /api/orders/ORD-002/appointment (re-create)');
  const orderAfterReAppointment = res.data as any;
  assertEqual(orderAfterReAppointment.status, OrderStatus.APPOINTED, 'Order status should be APPOINTED after re-appointment');

  req = {
    method: 'POST', path: '/api/orders/ORD-002/schedule',
    body: { installerId: 'U-004', scheduledDate: daysLater(5), timeSlot: '14:00-16:00', assignedBy: 'U-002', estimatedDurationHours: 2 },
  };
  showReq(req);
  res = router.invoke(req);
  showRes(res);
  assertOk(res, 'POST /api/orders/ORD-002/schedule (re-assign)');
  const orderAfterReSchedule = res.data as any;
  assertEqual(orderAfterReSchedule.status, OrderStatus.INSTALLATION_SCHEDULED, 'Order status should be INSTALLATION_SCHEDULED after re-schedule');

  step(12, 'POST start-installation + complete + archive');
  req = { method: 'POST', path: '/api/orders/ORD-002/start-installation', body: { installerId: 'U-004' } };
  showReq(req);
  res = router.invoke(req);
  showRes(res);
  assertOk(res, 'POST /api/orders/ORD-002/start-installation (second)');
  const orderAfterSecondStart = res.data as any;
  assertEqual(orderAfterSecondStart.status, OrderStatus.INSTALLING, 'Order status should be INSTALLING after second start');

  req = { method: 'POST', path: '/api/orders/ORD-002/complete', body: { installerId: 'U-004' } };
  showReq(req);
  res = router.invoke(req);
  showRes(res);
  assertOk(res, 'POST /api/orders/ORD-002/complete (second)');
  const orderAfterSecondComplete = res.data as any;
  assertEqual(orderAfterSecondComplete.status, OrderStatus.COMPLETED, 'Order status should be COMPLETED after second complete');

  req = { method: 'POST', path: '/api/orders/ORD-002/archive', body: { operatorId: 'U-001' } };
  showReq(req);
  res = router.invoke(req);
  showRes(res);
  assertOk(res, 'POST /api/orders/ORD-002/archive (second)');
  const orderAfterSecondArchive = res.data as any;
  assertEqual(orderAfterSecondArchive.status, OrderStatus.ARCHIVED, 'Order status should be ARCHIVED after second archive');

  step(13, 'GET /api/orders/ORD-002/audit-logs - 完整审计轨迹');
  req = { method: 'GET', path: '/api/orders/ORD-002/audit-logs' };
  showReq(req);
  res = router.invoke(req);
  showRes(res);
  assertOk(res, 'GET /api/orders/ORD-002/audit-logs');
  const auditLogsFinal = res.data as any[];
  assertEqual(auditLogsFinal.length >= 12, true, 'Audit logs should have at least 12 entries (all steps)');

  step(14, 'GET /api/users/U-004/todos - 验证师傅U-004无ORD-002相关待办');
  req = { method: 'GET', path: '/api/users/U-004/todos' };
  showReq(req);
  res = router.invoke(req);
  showRes(res);
  assertOk(res, 'GET /api/users/U-004/todos');
  const todosU004 = res.data as any[];
  const ord002Todos = todosU004.filter((t: any) => t.orderNo === 'CL-20260614-002');
  assertEqual(ord002Todos.length, 0, 'Installer U-004 should have 0 todos for ORD-002 (all done)');
  console.log('    U-004 总待办: ' + todosU004.length + ' 条 (其他订单未处理属正常)');
}
export function runArchiveConfirmationExample(): void {
  sep('【Flow C】归档确认流');
  ServiceFactory.reset();
  const router = createApiRouter();

  step(1, '先完成 Flow A 顺利流');
  let req: ApiRequest = { method: 'POST', path: '/api/orders/ORD-003/start-installation', body: { installerId: 'U-004' } };
  let res = router.invoke(req);
  assertOk(res, 'POST /api/orders/ORD-003/start-installation (Flow C)');
  req = { method: 'POST', path: '/api/orders/ORD-003/complete', body: { installerId: 'U-004' } };
  res = router.invoke(req);
  assertOk(res, 'POST /api/orders/ORD-003/complete (Flow C)');
  req = { method: 'POST', path: '/api/orders/ORD-003/archive', body: { operatorId: 'U-001' } };
  res = router.invoke(req);
  assertOk(res, 'POST /api/orders/ORD-003/archive (Flow C)');
  console.log('    (Flow A done, order archived)');

  step(2, 'GET /api/users/U-001/todos - sales guide todos');
  req = { method: 'GET', path: '/api/users/U-001/todos' };
  showReq(req);
  res = router.invoke(req);
  showRes(res);
  assertOk(res, 'GET /api/users/U-001/todos');
  const todosU001 = res.data as any[];
  assertEqual(todosU001.length, 0, 'Sales guide U-001 should have 0 todos');

  step(3, 'GET /api/orders/ORD-003 - verify archived order');
  req = { method: 'GET', path: '/api/orders/ORD-003' };
  showReq(req);
  res = router.invoke(req);
  showRes(res);
  assertOk(res, 'GET /api/orders/ORD-003');
  const order = res.data as any;
  assertEqual(order.status, OrderStatus.ARCHIVED, 'Order status should be ARCHIVED');
  assertEqual(!!order.schedule, true, 'Order should have a schedule');
  assertEqual(!!order.appointment, true, 'Order should have an appointment');

  console.log(`    status: ${order.status}`);
  console.log(`    measure: ${order.measureRecord?"yes":"no"}`);
  console.log(`    appointment: ${order.appointment?"yes":"no"}`);
  console.log(`    schedule: ${order.schedule?"yes":"no"}`);
  console.log(`    return: ${order.returnRecord?"yes":"no"}`);
  console.log(`    supplements: ${order.supplementRecords?.length>0?order.supplementRecords.length+" items":"none"}`);
  console.log(`    remarks: ${order.remarkRecords?.length>0?order.remarkRecords.length+" items":"none"}`);

  step(4, 'GET /api/audit-logs/operator/U-004 - installer audit trail');
  req = { method: 'GET', path: '/api/audit-logs/operator/U-004' };
  showReq(req);
  res = router.invoke(req);
  showRes(res);
  assertOk(res, 'GET /api/audit-logs/operator/U-004');
  const operatorAuditLogs = res.data as any;
  const auditItems = Array.isArray(operatorAuditLogs) ? operatorAuditLogs : (operatorAuditLogs as any).data || [];
  assertEqual(auditItems.length >= 2, true, 'Operator U-004 should have at least 2 audit log entries');
}
