import { ServiceFactory } from '../mock/serviceFactory';
import { OrderStatus } from '../types';

const sep = (t: string) => {
  console.log('\n' + '='.repeat(80));
  console.log(`  ${t}`);
  console.log('='.repeat(80));
};
const step = (n: number, d: string) => {
  console.log(`\n  [步骤 ${n}] ${d}`);
  console.log('  ' + '-'.repeat(60));
};

export function runTodoExamples(): void {
  sep('【示例0】各角色待办查询 - 初始状态');
  const orderService = ServiceFactory.getOrderService();
  const measurerId = 'U-003';
  const salesGuideId = 'U-001';
  const installerCZ = 'U-004';
  const managerId = 'U-006';

  step(1, '量尺师 张大刚(U-003) 的待办');
  const mTodos = orderService.getTodosForUser(measurerId);
  console.log('  待办数量:', mTodos.length);
  mTodos.forEach(t => console.log(`    - [${t.priority}] ${t.title} | 订单:${t.orderNo} | ${t.description}`));

  step(2, '导购 王小美(U-001) 的待办');
  const sTodos = orderService.getTodosForUser(salesGuideId);
  console.log('  待办数量:', sTodos.length);
  sTodos.forEach(t => console.log(`    - [${t.priority}] ${t.title} | 订单:${t.orderNo} | ${t.description}`));

  step(3, '安装师傅 陈志远(U-004) 的待办');
  const iTodos = orderService.getTodosForUser(installerCZ);
  console.log('  待办数量:', iTodos.length);
  iTodos.forEach(t => console.log(`    - [${t.priority}] ${t.title} | 订单:${t.orderNo} | ${t.description}`));

  step(4, '店长 孙明辉(U-006) 的待办');
  const gTodos = orderService.getTodosForUser(managerId);
  console.log('  待办数量:', gTodos.length);
  gTodos.forEach(t => console.log(`    - [${t.priority}] ${t.title} | 订单:${t.orderNo} | ${t.description}`));
}

export function runHappyPathExample(): void {
  sep('【示例1】顺利流：催单订单 → 开始安装 → 完成 → 归档');
  ServiceFactory.reset();
  const orderService = ServiceFactory.getOrderService();
  const scheduleService = ServiceFactory.getScheduleService();
  const auditService = ServiceFactory.getAuditLogService();
  const db = ServiceFactory.getDatabase();

  const orderNo = 'CL-20260612-003';
  const orderId = db.getOrderByNo(orderNo)?.id || '';

  step(1, `查询订单详情 - ${orderNo}`);
  let order = orderService.getOrderById(orderId);
  console.log(`  订单号: ${order.orderNo}`);
  console.log(`  当前状态: ${order.status}`);
  console.log(`  客户: ${order.customerSnapshot.name} - ${order.customerSnapshot.phone}`);
  console.log(`  地址: ${order.customerSnapshot.address}`);
  console.log(`  商品项数: ${order.productItems.length} | 金额: ¥${order.totalAmount}`);
  console.log(`  量尺: ${order.measureRecord ? '已量尺(' + order.measureRecord.windows.length + '窗)' : '无'}`);
  console.log(`  预约: ${order.appointment ? order.appointment.preferredDate + ' ' + order.appointment.preferredTimeSlot : '无'}`);
  console.log(`  排班: ${order.schedule ? db.getUser(order.schedule.installerId)?.name + ' ' + order.schedule.scheduledDate : '无'}`);

  step(2, '师傅排班回看 - 陈志远近7天排班');
  const today = new Date().toISOString().slice(0, 10);
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const history = scheduleService.getInstallerScheduleRange('U-004', today, nextWeek);
  console.log(`  查询范围: ${today} ~ ${nextWeek} | 记录数: ${history.length}`);
  history.forEach(s => console.log(`    - ${s.scheduledDate} ${s.timeSlot} | ${s.orderNo} ${s.customerName} | ${s.status}`));

  step(3, '安装预约处理 - 陈志远师傅开始上门安装');
  order = orderService.startInstallation(orderId, 'U-004');
  console.log(`  开始后状态: ${order.status} | 排班状态: ${order.schedule?.status}`);
  console.log(`  实际开始: ${order.schedule?.actualStartTime}`);

  step(4, '安装完成 - 师傅确认完工');
  order = orderService.completeInstallation(orderId, 'U-004');
  console.log(`  完成后状态: ${order.status} (${OrderStatus.COMPLETED})`);
  console.log(`  实际结束: ${order.schedule?.actualEndTime}`);

  step(5, '最终归档 - 店长审核归档');
  order = orderService.archiveOrder(orderId, 'U-006');
  console.log(`  归档后状态: ${order.status} (${OrderStatus.ARCHIVED})`);
  console.log(`  归档时间: ${order.archivedAt}`);

  step(6, '审计日志 - 完整操作记录');
  const logs = auditService.getOrderAuditLogs(orderId);
  console.log(`  审计日志总数: ${logs.length} 条`);
  logs.forEach(log => {
    const tm = new Date(log.timestamp).toLocaleString('zh-CN');
    console.log(`    [${tm}] ${log.operatorName}(${log.operatorRole}) | ${log.action}`);
  });

  step(7, '归档后详情确认 - 所有信息在同一条记录');
  order = orderService.getOrderById(orderId);
  console.log(`  订单: ${order.orderNo} | 状态: ${order.status}`);
  console.log(`  量尺记录ID: ${order.measureRecord?.id}`);
  console.log(`  预约记录: ${order.appointment?.id} | ${order.appointment?.preferredDate} ${order.appointment?.preferredTimeSlot}`);
  console.log(`  排班记录: ${order.schedule?.id} | ${db.getUser(order.schedule?.installerId || '')?.name}`);
  console.log(`  实际工时: ${order.schedule?.actualStartTime?.slice(11, 19)} ~ ${order.schedule?.actualEndTime?.slice(11, 19)}`);
  console.log(`  退回记录: ${order.returnRecord ? '有' : '无'} | 补料记录: ${order.supplementRecords.length} | 备注记录: ${order.remarkRecords.length}`);
  console.log(`  审计日志数: ${order.auditLogs.length}`);
  console.log('\n  ✓ 预约/排班/退回/补料/备注/审计 均在同一条订单记录中，责任可追溯。');
}
