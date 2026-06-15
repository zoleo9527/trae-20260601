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


export function runRemindFlowExample(): void {
  sep('【Flow A】顺利流：催单订单 → 安装 → 完成 → 归档');
  ServiceFactory.reset();
  const router = createApiRouter();

  step(1, 'GET /api/orders/ORD-003 - 查询催单订单详情');
  let req: ApiRequest = { method: 'GET', path: '/api/orders/ORD-003' };
  showReq(req);
  let res = router.invoke(req);
  showRes(res);
  const o3 = res.data as any;
  console.log(`    客户: ${o3.customerSnapshot.name} | 状态: ${o3.status}`);
  console.log(`    预约: ${o3.appointment?.preferredDate} ${o3.appointment?.preferredTimeSlot}`);
  console.log(`    排班: ${o3.schedule?.scheduledDate} 师傅=${o3.schedule?.installerId}`);

  step(2, 'GET /api/schedules/installer/U-004 - 师傅排班回看');
  req = { method: 'GET', path: '/api/schedules/installer/U-004', query: { startDate: today(), endDate: daysLater(7) } };
  showReq(req);
  res = router.invoke(req);
  showRes(res);
  step(3, 'POST /api/orders/ORD-003/start-installation');
  req = { method: 'POST', path: '/api/orders/ORD-003/start-installation', body: { installerId: 'U-004' } };
  showReq(req);
  res = router.invoke(req);
  showRes(res);

  step(4, 'POST /api/orders/ORD-003/complete');
  req = { method: 'POST', path: '/api/orders/ORD-003/complete', body: { installerId: 'U-004' } };
  showReq(req);
  res = router.invoke(req);
  showRes(res);
  step(5, 'POST /api/orders/ORD-003/archive');
  req = { method: 'POST', path: '/api/orders/ORD-003/archive', body: { operatorId: 'U-001' } };
  showReq(req);
  res = router.invoke(req);
  showRes(res);

  step(6, 'GET /api/orders/ORD-003/audit-logs - 完整审计轨迹');
  req = { method: 'GET', path: '/api/orders/ORD-003/audit-logs' };
  showReq(req);
  res = router.invoke(req);
  showRes(res);
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
  step(2, 'GET /api/schedules/available - 查询可用师傅');
  req = { method: 'GET', path: '/api/schedules/available', query: { date: daysLater(3), timeSlot: '10:00-12:00' } };
  showReq(req);
  res = router.invoke(req);
  showRes(res);

  step(3, 'POST /api/orders/ORD-002/schedule - 指派师傅U-005');
  req = {
    method: 'POST', path: '/api/orders/ORD-002/schedule',
    body: { installerId: 'U-005', scheduledDate: daysLater(3), timeSlot: '10:00-12:00', assignedBy: 'U-002', estimatedDurationHours: 2 },
  };
  showReq(req);
  res = router.invoke(req);
  showRes(res);
  step(4, 'POST /api/orders/ORD-002/remind - 客户催单');
  req = { method: 'POST', path: '/api/orders/ORD-002/remind', body: { operatorId: 'U-001', reason: '客户催促尽快安装' } };
  showReq(req);
  res = router.invoke(req);
  showRes(res);

  step(5, 'PUT /api/orders/ORD-002/schedule/reassign - 改派U-004');
  req = {
    method: 'PUT', path: '/api/orders/ORD-002/schedule/reassign',
    body: { newInstallerId: 'U-004', reason: 'U-005临时有事', reassignedBy: 'U-002' },
  };
  showReq(req);
  res = router.invoke(req);
  showRes(res);
  step(6, 'POST /api/orders/ORD-002/start-installation - 开始安装');
  req = { method: 'POST', path: '/api/orders/ORD-002/start-installation', body: { installerId: 'U-004' } };
  showReq(req);
  res = router.invoke(req);
  showRes(res);

  step(7, 'POST /api/orders/ORD-002/return - 退回(WRONG_SIZE)');
  req = {
    method: 'POST', path: '/api/orders/ORD-002/return',
    body: { reason: ReturnReason.WRONG_SIZE, detailedReason: '窗户尺寸不符', returnedBy: 'U-004' },
  };
  showReq(req);
  res = router.invoke(req);
  showRes(res);
  step(8, 'POST /api/orders/ORD-002/handle-return - 处理退回');
  req = { method: 'POST', path: '/api/orders/ORD-002/handle-return', body: { handledBy: 'U-002', handlingNotes: '安排补料' } };
  showReq(req);
  res = router.invoke(req);
  showRes(res);

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
  const supplement = (res.data as any).supplementRecords?.[(res.data as any).supplementRecords.length - 1];

  step(10, 'POST supplement/fulfill + supplement/receive - 补料发货与签收');
  if (supplement) {
    req = { method: 'POST', path: `/api/orders/ORD-002/supplement/${supplement.id}/fulfill`, body: { fulfilledBy: 'U-003' } };
    showReq(req);
    res = router.invoke(req);
    showRes(res);

    req = { method: 'POST', path: `/api/orders/ORD-002/supplement/${supplement.id}/receive`, body: { receivedBy: 'U-004' } };
    showReq(req);
    res = router.invoke(req);
    showRes(res);
  }

  step(11, 'POST appointment + POST schedule - 重新预约排班');
  req = {
    method: 'POST', path: '/api/orders/ORD-002/appointment',
    body: { preferredDate: daysLater(5), preferredTimeSlot: '14:00-16:00', createdBy: 'U-001', notes: '补料到货后二次预约' },
  };
  showReq(req);
  res = router.invoke(req);
  showRes(res);

  req = {
    method: 'POST', path: '/api/orders/ORD-002/schedule',
    body: { installerId: 'U-004', scheduledDate: daysLater(5), timeSlot: '14:00-16:00', assignedBy: 'U-002', estimatedDurationHours: 2 },
  };
  showReq(req);
  res = router.invoke(req);
  showRes(res);

  step(12, 'POST start-installation + complete + archive');
  req = { method: 'POST', path: '/api/orders/ORD-002/start-installation', body: { installerId: 'U-004' } };
  showReq(req);
  res = router.invoke(req);
  showRes(res);

  req = { method: 'POST', path: '/api/orders/ORD-002/complete', body: { installerId: 'U-004' } };
  showReq(req);
  res = router.invoke(req);
  showRes(res);

  req = { method: 'POST', path: '/api/orders/ORD-002/archive', body: { operatorId: 'U-001' } };
  showReq(req);
  res = router.invoke(req);
  showRes(res);
}
export function runArchiveConfirmationExample(): void {
  sep('【Flow C】归档确认流');
  ServiceFactory.reset();
  const router = createApiRouter();

  step(1, '先完成 Flow A 顺利流');
  let req: ApiRequest = { method: 'POST', path: '/api/orders/ORD-003/start-installation', body: { installerId: 'U-004' } };
  router.invoke(req);
  req = { method: 'POST', path: '/api/orders/ORD-003/complete', body: { installerId: 'U-004' } };
  router.invoke(req);
  req = { method: 'POST', path: '/api/orders/ORD-003/archive', body: { operatorId: 'U-001' } };
  router.invoke(req);
  console.log('    (Flow A done, order archived)');

  step(2, 'GET /api/users/U-001/todos - sales guide todos');
  req = { method: 'GET', path: '/api/users/U-001/todos' };
  showReq(req);
  let res = router.invoke(req);
  showRes(res);

  step(3, 'GET /api/orders/ORD-003 - verify archived order');
  req = { method: 'GET', path: '/api/orders/ORD-003' };
  showReq(req);
  res = router.invoke(req);
  showRes(res);
  const order = res.data as any;

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
}