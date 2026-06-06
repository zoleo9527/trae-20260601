import { db } from './db/database';
import { Role, RepairStatus, AuditResult } from './types';
import { generateOrderNo } from './common/utils';

async function main() {
  console.log('🌱 开始初始化种子数据...');

  db.reset();

  console.log('👤 创建用户...');
  
  const dormManager = {
    id: db.generateId(),
    name: '王宿管',
    role: Role.DORM_MANAGER,
    phone: '13800138001',
    createdAt: db.now(),
    updatedAt: db.now(),
  };
  db.users.push(dormManager);

  const repairWorker1 = {
    id: db.generateId(),
    name: '李师傅',
    role: Role.REPAIR_WORKER,
    phone: '13800138002',
    createdAt: db.now(),
    updatedAt: db.now(),
  };
  db.users.push(repairWorker1);

  const repairWorker2 = {
    id: db.generateId(),
    name: '张师傅',
    role: Role.REPAIR_WORKER,
    phone: '13800138003',
    createdAt: db.now(),
    updatedAt: db.now(),
  };
  db.users.push(repairWorker2);

  const supervisor = {
    id: db.generateId(),
    name: '赵主管',
    role: Role.LOGISTICS_SUPERVISOR,
    phone: '13800138004',
    createdAt: db.now(),
    updatedAt: db.now(),
  };
  db.users.push(supervisor);

  console.log('✅ 用户创建完成');
  console.log('  宿管:', dormManager.id, dormManager.name);
  console.log('  维修师傅1:', repairWorker1.id, repairWorker1.name);
  console.log('  维修师傅2:', repairWorker2.id, repairWorker2.name);
  console.log('  后勤主管:', supervisor.id, supervisor.name);

  console.log('📋 创建维修工单...');

  const order1 = {
    id: db.generateId(),
    orderNo: generateOrderNo(),
    dormitory: '1号楼',
    roomNumber: '101',
    issueType: '水电维修',
    description: '卫生间水龙头漏水',
    currentStatus: RepairStatus.CREATED,
    creatorId: dormManager.id,
    createdAt: db.now(),
    updatedAt: db.now(),
  };
  db.orders.push(order1);
  db.statusHistories.push({
    id: db.generateId(),
    orderId: order1.id,
    toStatus: RepairStatus.CREATED,
    operatorId: dormManager.id,
    operatedAt: db.now(),
    remark: '创建维修工单',
  });

  const order2 = {
    id: db.generateId(),
    orderNo: generateOrderNo(),
    dormitory: '2号楼',
    roomNumber: '203',
    issueType: '家具维修',
    description: '书桌抽屉损坏',
    currentStatus: RepairStatus.ASSIGNED,
    creatorId: dormManager.id,
    assigneeId: repairWorker1.id,
    createdAt: db.now(),
    updatedAt: db.now(),
  };
  db.orders.push(order2);
  db.statusHistories.push({
    id: db.generateId(),
    orderId: order2.id,
    toStatus: RepairStatus.CREATED,
    operatorId: dormManager.id,
    operatedAt: db.now(),
    remark: '创建维修工单',
  });
  db.statusHistories.push({
    id: db.generateId(),
    orderId: order2.id,
    fromStatus: RepairStatus.CREATED,
    toStatus: RepairStatus.ASSIGNED,
    operatorId: supervisor.id,
    operatedAt: db.now(),
    remark: `派单给维修师傅: ${repairWorker1.name}`,
  });

  const order3 = {
    id: db.generateId(),
    orderNo: generateOrderNo(),
    dormitory: '3号楼',
    roomNumber: '305',
    issueType: '水电维修',
    description: '电灯不亮，需要更换',
    currentStatus: RepairStatus.MATERIAL_REGISTERED,
    creatorId: dormManager.id,
    assigneeId: repairWorker2.id,
    createdAt: db.now(),
    updatedAt: db.now(),
  };
  db.orders.push(order3);
  db.statusHistories.push({
    id: db.generateId(),
    orderId: order3.id,
    toStatus: RepairStatus.CREATED,
    operatorId: dormManager.id,
    operatedAt: db.now(),
    remark: '创建维修工单',
  });
  db.statusHistories.push({
    id: db.generateId(),
    orderId: order3.id,
    fromStatus: RepairStatus.CREATED,
    toStatus: RepairStatus.ASSIGNED,
    operatorId: supervisor.id,
    operatedAt: db.now(),
    remark: `派单给维修师傅: ${repairWorker2.name}`,
  });
  db.materials.push({
    id: db.generateId(),
    orderId: order3.id,
    materialName: 'LED灯泡',
    specification: '220V 15W',
    quantity: 2,
    unit: '个',
    unitPrice: 25.00,
    registeredBy: repairWorker2.id,
    registeredAt: db.now(),
    note: '暖白光',
  });
  db.materials.push({
    id: db.generateId(),
    orderId: order3.id,
    materialName: '绝缘胶带',
    quantity: 1,
    unit: '卷',
    unitPrice: 5.00,
    registeredBy: repairWorker2.id,
    registeredAt: db.now(),
  });
  db.statusHistories.push({
    id: db.generateId(),
    orderId: order3.id,
    fromStatus: RepairStatus.ASSIGNED,
    toStatus: RepairStatus.MATERIAL_REGISTERED,
    operatorId: repairWorker2.id,
    operatedAt: db.now(),
    remark: '登记维修材料',
  });

  const order4 = {
    id: db.generateId(),
    orderNo: generateOrderNo(),
    dormitory: '1号楼',
    roomNumber: '402',
    issueType: '门窗维修',
    description: '窗户把手松动',
    currentStatus: RepairStatus.FEE_REGISTERED,
    creatorId: dormManager.id,
    assigneeId: repairWorker1.id,
    supplementNote: '用户希望周末上门维修',
    createdAt: db.now(),
    updatedAt: db.now(),
  };
  db.orders.push(order4);
  db.statusHistories.push({
    id: db.generateId(),
    orderId: order4.id,
    toStatus: RepairStatus.CREATED,
    operatorId: dormManager.id,
    operatedAt: db.now(),
    remark: '创建维修工单',
  });
  db.statusHistories.push({
    id: db.generateId(),
    orderId: order4.id,
    fromStatus: RepairStatus.CREATED,
    toStatus: RepairStatus.ASSIGNED,
    operatorId: supervisor.id,
    operatedAt: db.now(),
    remark: `派单给维修师傅: ${repairWorker1.name}`,
  });
  db.materials.push({
    id: db.generateId(),
    orderId: order4.id,
    materialName: '窗户把手',
    specification: '不锈钢',
    quantity: 1,
    unit: '个',
    unitPrice: 35.00,
    registeredBy: repairWorker1.id,
    registeredAt: db.now(),
  });
  db.materials.push({
    id: db.generateId(),
    orderId: order4.id,
    materialName: '螺丝套装',
    quantity: 1,
    unit: '套',
    unitPrice: 8.00,
    registeredBy: repairWorker1.id,
    registeredAt: db.now(),
  });
  db.statusHistories.push({
    id: db.generateId(),
    orderId: order4.id,
    fromStatus: RepairStatus.ASSIGNED,
    toStatus: RepairStatus.MATERIAL_REGISTERED,
    operatorId: repairWorker1.id,
    operatedAt: db.now(),
    remark: '登记维修材料',
  });
  db.fees.push({
    id: db.generateId(),
    orderId: order4.id,
    feeType: '材料费',
    amount: 43.00,
    registeredBy: repairWorker1.id,
    registeredAt: db.now(),
    note: '把手35 + 螺丝8',
  });
  db.fees.push({
    id: db.generateId(),
    orderId: order4.id,
    feeType: '人工费',
    amount: 50.00,
    registeredBy: repairWorker1.id,
    registeredAt: db.now(),
    note: '上门维修服务费',
  });
  db.statusHistories.push({
    id: db.generateId(),
    orderId: order4.id,
    fromStatus: RepairStatus.MATERIAL_REGISTERED,
    toStatus: RepairStatus.FEE_REGISTERED,
    operatorId: repairWorker1.id,
    operatedAt: db.now(),
    remark: '登记维修费用',
  });

  const order5 = {
    id: db.generateId(),
    orderNo: generateOrderNo(),
    dormitory: '2号楼',
    roomNumber: '501',
    issueType: '水电维修',
    description: '空调插座接触不良',
    currentStatus: RepairStatus.RETURNED,
    creatorId: dormManager.id,
    assigneeId: repairWorker2.id,
    returnReason: '费用明细不清晰，人工费标准需要重新核对',
    createdAt: db.now(),
    updatedAt: db.now(),
  };
  db.orders.push(order5);
  db.statusHistories.push({
    id: db.generateId(),
    orderId: order5.id,
    toStatus: RepairStatus.CREATED,
    operatorId: dormManager.id,
    operatedAt: db.now(),
    remark: '创建维修工单',
  });
  db.statusHistories.push({
    id: db.generateId(),
    orderId: order5.id,
    fromStatus: RepairStatus.CREATED,
    toStatus: RepairStatus.ASSIGNED,
    operatorId: supervisor.id,
    operatedAt: db.now(),
    remark: `派单给维修师傅: ${repairWorker2.name}`,
  });
  db.materials.push({
    id: db.generateId(),
    orderId: order5.id,
    materialName: '16A插座',
    specification: '空调专用',
    quantity: 1,
    unit: '个',
    unitPrice: 18.00,
    registeredBy: repairWorker2.id,
    registeredAt: db.now(),
  });
  db.statusHistories.push({
    id: db.generateId(),
    orderId: order5.id,
    fromStatus: RepairStatus.ASSIGNED,
    toStatus: RepairStatus.MATERIAL_REGISTERED,
    operatorId: repairWorker2.id,
    operatedAt: db.now(),
    remark: '登记维修材料',
  });
  db.fees.push({
    id: db.generateId(),
    orderId: order5.id,
    feeType: '材料费',
    amount: 18.00,
    registeredBy: repairWorker2.id,
    registeredAt: db.now(),
  });
  db.fees.push({
    id: db.generateId(),
    orderId: order5.id,
    feeType: '人工费',
    amount: 80.00,
    registeredBy: repairWorker2.id,
    registeredAt: db.now(),
  });
  db.statusHistories.push({
    id: db.generateId(),
    orderId: order5.id,
    fromStatus: RepairStatus.MATERIAL_REGISTERED,
    toStatus: RepairStatus.FEE_REGISTERED,
    operatorId: repairWorker2.id,
    operatedAt: db.now(),
    remark: '登记维修费用',
  });
  db.auditRecords.push({
    id: db.generateId(),
    orderId: order5.id,
    auditorId: supervisor.id,
    auditResult: AuditResult.REJECTED,
    auditAt: db.now(),
    auditOpinion: '费用需要重新核对',
  });
  db.statusHistories.push({
    id: db.generateId(),
    orderId: order5.id,
    fromStatus: RepairStatus.FEE_REGISTERED,
    toStatus: RepairStatus.RETURNED,
    operatorId: supervisor.id,
    operatedAt: db.now(),
    remark: '审核退回: 费用明细不清晰，人工费标准需要重新核对',
  });

  db.save();

  console.log('✅ 维修工单创建完成');
  console.log('  工单1 (待派单):', order1.id, order1.orderNo);
  console.log('  工单2 (待维修):', order2.id, order2.orderNo);
  console.log('  工单3 (材料已登记):', order3.id, order3.orderNo);
  console.log('  工单4 (费用已登记):', order4.id, order4.orderNo);
  console.log('  工单5 (已退回):', order5.id, order5.orderNo);

  console.log('\n🎉 种子数据初始化完成！');
  console.log('\n📝 测试账号：');
  console.log('  宿管 ID:', dormManager.id, '- 王宿管');
  console.log('  维修师傅 ID:', repairWorker1.id, '- 李师傅');
  console.log('  维修师傅 ID:', repairWorker2.id, '- 张师傅');
  console.log('  后勤主管 ID:', supervisor.id, '- 赵主管');
}

main()
  .catch((e) => {
    console.error('❌ 种子数据初始化失败:', e);
    process.exit(1);
  });
