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

export function runProblemFlowExample(): void {
  sep('【示例2】问题流：预约→排班→催单改派→安装退回→补料→二次安装→归档');
  ServiceFactory.reset();
  const orderService = ServiceFactory.getOrderService();
  const scheduleService = ServiceFactory.getScheduleService();
  const auditService = ServiceFactory.getAuditLogService();
  const db = ServiceFactory.getDatabase();

  const orderNo = 'CL-20260614-002';
  const orderId = db.getOrderByNo(orderNo)?.id || '';
  const today = new Date();

  step(1, `初始订单 - ${orderNo}（钱先生 海淀中关村）`);
  let order = orderService.getOrderById(orderId);
  console.log(`  订单号: ${order.orderNo} | 状态: ${order.status} (${OrderStatus.MEASURED} = 已量尺待预约)`);
  console.log(`  地址: ${order.customerSnapshot.address}`);
  console.log(`  量尺备注: ${order.measureRecord?.notes}`);

  step(2, '导购创建安装预约');
  const apptDate = new Date(today.getTime() + 2 * 86400000).toISOString().slice(0, 10);
  order = orderService.createAppointment(orderId, {
    createdBy: 'U-002',
    preferredDate: apptDate,
    preferredTimeSlot: '10:00-12:00',
    backupDate: new Date(today.getTime() + 3 * 86400000).toISOString().slice(0, 10),
    backupTimeSlot: '14:00-16:00',
    notes: '客户要求安装前1小时电话提醒',
  });
  console.log(`  预约后状态: ${order.status}`);
  console.log(`  首选时间: ${order.appointment?.preferredDate} ${order.appointment?.preferredTimeSlot}`);

  step(3, '店长查询空闲师傅');
  const available = scheduleService.getAvailableInstallers(apptDate, '10:00-12:00');
  console.log(`  ${apptDate} 10:00-12:00 空闲:`, available.map(i => i.name).join('、'));

  step(4, '分配刘师傅(U-005)');
  order = scheduleService.assignSchedule({
    orderId, installerId: 'U-005', assignedBy: 'U-006',
    scheduledDate: apptDate, timeSlot: '10:00-12:00',
    estimatedDurationHours: 2, travelNotes: '中关村约40分钟，注意早高峰',
    toolChecklist: ['电钻', '大理石专用钻头', '水平仪', '梯子'],
  });
  console.log(`  分配后状态: ${order.status} | 师傅: ${db.getUser(order.schedule?.installerId || '')?.name}`);

  step(5, '客户催单 - 标记催单');
  order = orderService.remindOrder(orderId, 'U-006', '客户下周五要搬入，希望尽快');
  order = orderService.addRemark(orderId, { createdBy: 'U-006', content: '钱先生来电催促，希望提前1天安装' });
  console.log(`  催单后状态: ${order.status} (${OrderStatus.REMINDED})`);
  console.log(`  最新备注: ${order.remarkRecords[order.remarkRecords.length - 1].content}`);

  step(6, '改派陈志远 明天08:00-10:00');
  const tmDate = new Date(today.getTime() + 1 * 86400000).toISOString().slice(0, 10);
  order = scheduleService.reassignSchedule({
    orderId, newInstallerId: 'U-004', reassignedBy: 'U-006',
    reason: '客户催单加急，陈师傅明日有空',
    scheduledDate: tmDate, timeSlot: '08:00-10:00', estimatedDurationHours: 2,
  });
  console.log(`  改派后: 陈师傅 ${order.schedule?.scheduledDate} ${order.schedule?.timeSlot}`);

  step(7, '师傅开始安装 → 发现尺寸错+缺件，退回处理');
  order = orderService.startInstallation(orderId, 'U-004');
  order = orderService.returnInstallation(orderId, {
    returnedBy: 'U-004',
    reason: ReturnReason.WRONG_SIZE,
    detailedReason: '窗帘宽度比量尺记录窄15cm，无法覆盖整窗；另缺少幔头安装挂钩12个',
    images: ['现场照片1.jpg', '量尺对比图.jpg'],
  });
  console.log(`  退回后状态: ${order.status} (${OrderStatus.RETURNED})`);
  console.log(`  退回原因: 尺寸错误 | 说明: ${order.returnRecord?.detailedReason}`);

  step(8, '导购待办 - 出现退回任务');
  const sTodos = orderService.getTodosForUser('U-002');
  const rt = sTodos.find(t => t.type === 'RETURN_PENDING');
  console.log(`  导购待办中的退回: ${rt ? rt.title + ' - ' + rt.description : '无'}`);

  step(9, '导购处理退回 + 申请补料');
  order = orderService.handleReturn(orderId, {
    handledBy: 'U-002',
    handlingNotes: '已与工厂沟通重新裁剪，补寄挂钩12个，3天后可重装',
  });
  const supId = orderId + '-TEMP';
  order = orderService.requestSupplement(orderId, {
    requestedBy: 'U-002',
    items: [
      { name: '天鹅绒窗帘(重制)', quantity: 1, unit: '片', description: '按实际窗宽加15cm' },
      { name: '幔头挂钩', quantity: 12, unit: '个', description: '3爪标准挂钩' },
    ],
    urgency: 'URGENT',
    notes: '客户催单，工厂加急',
  });
  const supplementId = order.supplementRecords[order.supplementRecords.length - 1].id;
  console.log(`  处理后状态: ${order.status} (${OrderStatus.MATERIALS_NEEDED}) 补料数: ${order.supplementRecords.length}`);

  step(10, '店长备货 + 师傅收货');
  order = orderService.fulfillSupplement(orderId, supplementId, { fulfilledBy: 'U-006' });
  order = orderService.receiveSupplement(orderId, supplementId, { receivedBy: 'U-004' });
  console.log(`  备货: ${order.supplementRecords[0].fulfilledAt ? '✓' : '✗'} | 收货: ${order.supplementRecords[0].receivedAt ? '✓' : '✗'}`);
  console.log(`  收货后状态: ${order.status}`);

  step(11, '二次预约 + 二次排班');
  const d5 = new Date(today.getTime() + 5 * 86400000).toISOString().slice(0, 10);
  order = orderService.createAppointment(orderId, { createdBy: 'U-002', preferredDate: d5, preferredTimeSlot: '14:00-16:00', notes: '补料完成后二次安装' });
  order = scheduleService.assignSchedule({
    orderId, installerId: 'U-004', assignedBy: 'U-006',
    scheduledDate: d5, timeSlot: '14:00-16:00', estimatedDurationHours: 2,
    toolChecklist: ['电钻', '大理石钻头', '水平仪'],
  });
  console.log(`  二次安装: ${order.appointment?.preferredDate} ${order.appointment?.preferredTimeSlot} | ${order.status}`);

  step(12, '二次安装完成 + 归档');
  order = orderService.startInstallation(orderId, 'U-004');
  order = orderService.completeInstallation(orderId, 'U-004');
  order = orderService.archiveOrder(orderId, 'U-006');
  console.log(`  归档后状态: ${order.status} | 归档时间: ${order.archivedAt?.slice(0, 19)}`);

  step(13, '师傅排班回看 - 陈志远一周排班');
  const s = today.toISOString().slice(0, 10);
  const e = new Date(today.getTime() + 7 * 86400000).toISOString().slice(0, 10);
  const h = scheduleService.getInstallerScheduleRange('U-004', s, e);
  console.log(`  陈志远 ${s}~${e} 排班记录:`);
  h.forEach(x => console.log(`    ${x.scheduledDate} ${x.timeSlot} | ${x.orderNo} ${x.customerName} | ${x.status}`));

  step(14, '审计日志完整回放 - 责任链清晰');
  const logs = auditService.getOrderAuditLogs(orderId);
  console.log(`  审计日志: ${logs.length} 条`);
  logs.forEach((l, i) => {
    const tm = new Date(l.timestamp).toLocaleString('zh-CN');
    console.log(`  ${i + 1}. [${tm}] ${l.operatorName}(${l.operatorRole}) → ${l.action}`);
  });

  step(15, '最终详情确认 - 所有子记录挂同一订单下');
  console.log(`  订单: ${order.orderNo} | 状态: ${order.status}`);
  console.log(`  量尺: ${order.measureRecord?.id} | 预约: ${order.appointment?.id}`);
  console.log(`  最终排班: ${order.schedule?.id} | 师傅: ${db.getUser(order.schedule?.installerId || '')?.name}`);
  console.log(`  退回: ${order.returnRecord?.id || '无'} | 补料: ${order.supplementRecords.length}项 | 备注: ${order.remarkRecords.length}条 | 审计: ${order.auditLogs.length}条`);
  console.log('\n  ✓ 退回有原因、补料有跟踪、催单有记录、最终可归档，责任链清晰。');
}
