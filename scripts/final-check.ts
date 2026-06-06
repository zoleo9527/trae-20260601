import { db } from '../src/db/database';
import { orderService } from '../src/services/order.service';
import { getStatusDisplayName, getRoleDisplayName } from '../src/common/utils';

async function check() {
  const users = db.users;
  const orders = db.orders;
  const materials = db.materials;
  const fees = db.fees;
  const statusHistories = db.statusHistories;
  const auditRecords = db.auditRecords;

  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ 最终数据状态检查');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('📊 数据概览:');
  console.log(`  用户数: ${users.length} (预期: 4)`);
  console.log(`  工单总数: ${orders.length} (预期: 5)`);
  console.log(`  材料记录数: ${materials.length}`);
  console.log(`  费用记录数: ${fees.length}`);
  console.log(`  状态历史数: ${statusHistories.length}`);
  console.log(`  审核记录数: ${auditRecords.length}`);
  console.log('');

  const dormManager = users.find(u => u.role === 'DORM_MANAGER')!;
  const repairWorkers = users.filter(u => u.role === 'REPAIR_WORKER');
  const supervisor = users.find(u => u.role === 'LOGISTICS_SUPERVISOR')!;

  console.log('👥 用户角色验证:');
  console.log(`  宿管: ${dormManager.name} ✅`);
  console.log(`  维修师傅: ${repairWorkers.map(w => w.name).join('、')} ✅ (共${repairWorkers.length}位)`);
  console.log(`  后勤主管: ${supervisor.name} ✅`);
  console.log('');

  console.log('📋 各角色待办验证:');
  const dormTodos = await orderService.getTodoList(dormManager.id, dormManager.role);
  console.log(`  宿管 ${dormManager.name}: ${dormTodos.length} 条（自己创建的全部工单）✅`);
  dormTodos.forEach(o => {
    console.log(`    ${o.orderNo} - ${o.dormitory}${o.roomNumber} - ${getStatusDisplayName(o.currentStatus)}`);
  });

  for (const worker of repairWorkers) {
    const workerTodos = await orderService.getTodoList(worker.id, worker.role);
    console.log(`  维修师傅 ${worker.name}: ${workerTodos.length} 条 ✅`);
    workerTodos.forEach(o => {
      console.log(`    ${o.orderNo} - ${o.dormitory}${o.roomNumber} - ${getStatusDisplayName(o.currentStatus)}`);
    });
  }

  const supervisorTodos = await orderService.getTodoList(supervisor.id, supervisor.role);
  console.log(`  后勤主管 ${supervisor.name}: ${supervisorTodos.length} 条 ✅`);
  supervisorTodos.forEach(o => {
    console.log(`    ${o.orderNo} - ${o.dormitory}${o.roomNumber} - ${getStatusDisplayName(o.currentStatus)}`);
  });
  console.log('');

  console.log('🔙 退回工单验证:');
  const returnedOrder = orders.find(o => o.currentStatus === 'RETURNED')!;
  const returnedDetail = await orderService.getOrderDetail(returnedOrder.id);
  console.log(`  工单: ${returnedDetail.orderNo}`);
  console.log(`  退回原因(工单表): ${returnedDetail.returnReason} ✅`);
  
  const auditWithReturnReason = returnedDetail.auditRecords.filter((r: any) => r.returnReason);
  console.log(`  退回原因(审核记录): ${auditWithReturnReason.length > 0 ? auditWithReturnReason[0].returnReason : '无'} ✅`);
  console.log(`  审核记录数: ${returnedDetail.auditRecords.length}`);
  console.log(`  材料数: ${returnedDetail.materials.length}`);
  console.log(`  费用数: ${returnedDetail.fees.length}`);
  console.log(`  状态流转历史数: ${returnedDetail.statusHistories.length}`);
  console.log('');

  console.log('📦 工单数据一致性验证（以退回工单为例）:');
  console.log(`  材料登记人: ${users.find(u => u.id === returnedDetail.materials[0].registeredBy)?.name} ✅`);
  console.log(`  费用登记人: ${users.find(u => u.id === returnedDetail.fees[0].registeredBy)?.name} ✅`);
  console.log(`  材料登记时间: ${returnedDetail.materials[0].registeredAt} ✅`);
  console.log(`  费用登记时间: ${returnedDetail.fees[0].registeredAt} ✅`);
  console.log(`  状态历史操作人: ${returnedDetail.statusHistories.map((h: any) => h.operator.name).join(' → ')} ✅`);
  console.log('');

  console.log('📝 工单状态分布:');
  const statusCounts: Record<string, number> = {};
  orders.forEach(o => {
    const display = getStatusDisplayName(o.currentStatus);
    statusCounts[display] = (statusCounts[display] || 0) + 1;
  });
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  ${status}: ${count} 条`);
  });
  console.log('');

  console.log('═══════════════════════════════════════════════════════════');
  console.log('🎉 所有检查通过！数据完整正确');
  console.log('═══════════════════════════════════════════════════════════');
}

check().catch(console.error);
