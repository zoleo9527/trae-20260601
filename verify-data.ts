import { users } from './src/data/users';
import { customers } from './src/data/customers';
import { houses } from './src/data/houses';
import { saleControls } from './src/data/saleControls';
import { operationLogs } from './src/data/operationLogs';

console.log('=== 数据验证报告 ===\n');

// 用户统计
console.log('1. 用户数据:');
console.log(`   总数: ${users.length}`);
console.log(`   置业顾问: ${users.filter(u => u.role === 'consultant').length}人 (张伟、李娜、王强)`);
console.log(`   案场经理: ${users.filter(u => u.role === 'manager').length}人 (刘芳、陈明)`);
console.log(`   销控专员: ${users.filter(u => u.role === 'controller').length}人 (赵静)`);
users.forEach(u => console.log(`   - ${u.name} (${u.roleName})`));
console.log('');

// 客户统计
console.log('2. 客户数据:');
console.log(`   总数: ${customers.length}`);
const levelCounts = { A: 0, B: 0, C: 0, D: 0 };
customers.forEach(c => levelCounts[c.level]++);
console.log(`   等级分布: A级${levelCounts.A}人, B级${levelCounts.B}人, C级${levelCounts.C}人, D级${levelCounts.D}人`);
const consultantCounts: Record<string, number> = {};
customers.forEach(c => {
  const consultant = users.find(u => u.id === c.consultantId)?.name || c.consultantId;
  consultantCounts[consultant] = (consultantCounts[consultant] || 0) + 1;
});
console.log(`   关联顾问: ${Object.entries(consultantCounts).map(([k, v]) => `${k}${v}人`).join(', ')}`);
console.log('');

// 房源统计
console.log('3. 房源数据:');
console.log(`   总数: ${houses.length}`);
const buildingCounts: Record<string, number> = {};
const statusCounts: Record<string, number> = { available: 0, locked: 0, sold: 0, reserved: 0 };
const layoutCounts: Record<string, number> = {};
houses.forEach(h => {
  buildingCounts[h.building] = (buildingCounts[h.building] || 0) + 1;
  statusCounts[h.status]++;
  layoutCounts[h.layout] = (layoutCounts[h.layout] || 0) + 1;
});
console.log(`   楼栋分布: ${Object.entries(buildingCounts).map(([k, v]) => `${k}${v}套`).join(', ')}`);
console.log(`   状态分布: 可售${statusCounts.available}套, 锁定${statusCounts.locked}套, 已售${statusCounts.sold}套, 预留${statusCounts.reserved}套`);
console.log(`   户型分布: ${Object.entries(layoutCounts).map(([k, v]) => `${k}${v}套`).join(', ')}`);
console.log(`   面积范围: ${Math.min(...houses.map(h => h.area))}-${Math.max(...houses.map(h => h.area))}平米`);
console.log(`   单价范围: ${Math.min(...houses.map(h => h.unitPrice))}-${Math.max(...houses.map(h => h.unitPrice))}元/平米`);
console.log('');

// 销控记录统计
console.log('4. 销控记录:');
console.log(`   总数: ${saleControls.length}`);
const stageCounts: Record<string, number> = { application: 0, review: 0, lock: 0, completed: 0, rejected: 0 };
saleControls.forEach(sc => stageCounts[sc.stage]++);
console.log(`   阶段分布: 申请中${stageCounts.application}条, 审核中${stageCounts.review}条, 锁定中${stageCounts.lock}条, 已完成${stageCounts.completed}条, 已驳回${stageCounts.rejected}条`);
saleControls.forEach((sc, i) => {
  console.log(`   [${i + 1}] ${sc.house.houseNumber} - ${sc.customer.name} - ${sc.stageName} (备注${sc.remarks.length}条)`);
});
console.log('');

// 操作日志统计
console.log('5. 操作日志:');
console.log(`   总数: ${operationLogs.length}`);
const opTypeCounts: Record<string, number> = {};
operationLogs.forEach(log => {
  opTypeCounts[log.operationTypeName] = (opTypeCounts[log.operationTypeName] || 0) + 1;
});
console.log(`   类型分布: ${Object.entries(opTypeCounts).map(([k, v]) => `${k}${v}条`).join(', ')}`);
const logPerSc: Record<string, number> = {};
operationLogs.forEach(log => {
  logPerSc[log.saleControlId] = (logPerSc[log.saleControlId] || 0) + 1;
});
console.log(`   单条销控平均日志数: ${(operationLogs.length / saleControls.length).toFixed(1)}条`);
console.log(`   含remarkSource的日志: ${operationLogs.filter(l => l.remarkSource).length}条`);
console.log('');

// 数据关联验证
console.log('6. 关联验证:');
let allValid = true;
saleControls.forEach((sc, i) => {
  const houseExists = houses.find(h => h.id === sc.houseId);
  const customerExists = customers.find(c => c.id === sc.customerId);
  const applicantExists = users.find(u => u.id === sc.applicantId);
  const handlerExists = users.find(u => u.id === sc.currentHandlerId);
  if (!houseExists || !customerExists || !applicantExists || !handlerExists) {
    console.log(`   ❌ 销控记录[${i + 1}]存在无效关联`);
    allValid = false;
  }
});
operationLogs.forEach((log, i) => {
  const scExists = saleControls.find(sc => sc.id === log.saleControlId);
  const operatorExists = users.find(u => u.id === log.operatorId);
  if (!scExists || !operatorExists) {
    console.log(`   ❌ 操作日志[${i + 1}]存在无效关联`);
    allValid = false;
  }
});
if (allValid) {
  console.log('   ✅ 所有数据关联正确');
}
console.log('');

// 备注复用验证
console.log('7. 备注复用验证:');
saleControls.forEach((sc, i) => {
  if (sc.remarks.length > 1) {
    const sources = sc.remarks.map(r => r.sourceName).join(' → ');
    console.log(`   销控[${i + 1}]: ${sc.remarks.length}条备注, 来源: ${sources}`);
  }
});

console.log('\n=== 数据验证完成 ===');
