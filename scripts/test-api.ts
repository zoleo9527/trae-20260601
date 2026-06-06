import { db } from '../src/db/database';
import { orderService } from '../src/services/order.service';
import { userService } from '../src/services/user.service';
import { getStatusDisplayName, getRoleDisplayName } from '../src/common/utils';

async function test() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 校园维修系统 - 主链路测试');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    db.reset();

    console.log('0️⃣  创建测试用户');
    const dormManager = await userService.createUser({
      name: '王宿管',
      role: 'DORM_MANAGER' as any,
      phone: '13800138001',
    });
    const repairWorker = await userService.createUser({
      name: '李师傅',
      role: 'REPAIR_WORKER' as any,
      phone: '13800138002',
    });
    const supervisor = await userService.createUser({
      name: '赵主管',
      role: 'LOGISTICS_SUPERVISOR' as any,
      phone: '13800138004',
    });
    console.log(`   ✅ 测试用户创建完成`);
    console.log('');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('👀 各角色待办查询（初始状态）');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('1️⃣  宿管待办 - 王宿管');
    const dormManagerTodos = await orderService.getTodoList(dormManager.id, dormManager.role);
    console.log(`   ✅ 共 ${dormManagerTodos.length} 条待办`);
    console.log('');

    console.log('2️⃣  维修师傅待办 - 李师傅');
    const workerTodos = await orderService.getTodoList(repairWorker.id, repairWorker.role);
    console.log(`   ✅ 共 ${workerTodos.length} 条待办`);
    console.log('');

    console.log('3️⃣  后勤主管待办 - 赵主管');
    const supervisorTodos = await orderService.getTodoList(supervisor.id, supervisor.role);
    console.log(`   ✅ 共 ${supervisorTodos.length} 条待办`);
    console.log('');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔄 完整流程测试');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('4️⃣  宿管创建维修工单');
    const newOrder = await orderService.createOrder({
      dormitory: '3号楼',
      roomNumber: '201',
      issueType: '水电维修',
      description: '阳台水管漏水严重',
      creatorId: dormManager.id,
    });
    console.log(`   ✅ 创建成功: ${newOrder.orderNo}`);
    console.log(`      当前状态: ${getStatusDisplayName(newOrder.currentStatus)}`);
    console.log(`      工单ID: ${newOrder.id}`);
    console.log('');

    console.log('5️⃣  后勤主管派单');
    const assignedOrder = await orderService.assignOrder({
      orderId: newOrder.id,
      assigneeId: repairWorker.id,
      operatorId: supervisor.id,
      remark: '紧急工单，请尽快处理',
    });
    console.log(`   ✅ 派单成功`);
    console.log(`      当前状态: ${getStatusDisplayName(assignedOrder.currentStatus)}`);
    console.log(`      指派维修师傅: ${assignedOrder.assignee?.name}`);
    console.log('');

    console.log('6️⃣  维修师傅登记材料');
    const materialOrder = await orderService.registerMaterials({
      orderId: assignedOrder.id,
      materials: [
        {
          materialName: 'PVC水管',
          specification: '20mm',
          quantity: 2,
          unit: '米',
          unitPrice: 15.00,
          note: '优质PVC管',
        },
        {
          materialName: '水管接头',
          quantity: 3,
          unit: '个',
          unitPrice: 5.00,
        },
        {
          materialName: '防水胶带',
          quantity: 1,
          unit: '卷',
          unitPrice: 8.00,
        },
      ],
      operatorId: repairWorker.id,
    });
    console.log(`   ✅ 材料登记成功`);
    console.log(`      当前状态: ${getStatusDisplayName(materialOrder.currentStatus)}`);
    console.log(`      材料明细:`);
    materialOrder.materials.forEach(m => {
      console.log(`        - ${m.materialName} ${m.specification || ''}: ${m.quantity}${m.unit} × ${m.unitPrice}元`);
    });
    console.log('');

    console.log('7️⃣  维修师傅登记费用');
    const feeOrder = await orderService.registerFees({
      orderId: materialOrder.id,
      fees: [
        {
          feeType: '材料费',
          amount: 53.00,
          note: '水管30 + 接头15 + 胶带8',
        },
        {
          feeType: '人工费',
          amount: 60.00,
          note: '维修时长约1.5小时',
        },
      ],
      operatorId: repairWorker.id,
    });
    console.log(`   ✅ 费用登记成功`);
    console.log(`      当前状态: ${getStatusDisplayName(feeOrder.currentStatus)}`);
    console.log(`      费用明细:`);
    feeOrder.fees.forEach(f => {
      console.log(`        - ${f.feeType}: ${f.amount}元 (${f.note || ''})`);
    });
    console.log('');

    console.log('8️⃣  补充备注');
    const notedOrder = await orderService.supplementNote({
      orderId: feeOrder.id,
      note: '漏水点已修复，试水正常',
      operatorId: repairWorker.id,
    });
    console.log(`   ✅ 补充备注成功`);
    console.log(`      补充备注: ${notedOrder.supplementNote}`);
    console.log('');

    console.log('9️⃣  后勤主管审核通过');
    const completedOrder = await orderService.auditOrder({
      orderId: notedOrder.id,
      auditorId: supervisor.id,
      auditResult: 'APPROVED',
      auditOpinion: '费用合理，材料使用正常',
    });
    console.log(`   ✅ 审核通过`);
    console.log(`      当前状态: ${getStatusDisplayName(completedOrder.currentStatus)}`);
    console.log('');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 工单完整信息回看（含状态流转历史）');
    console.log('═══════════════════════════════════════════════════════════\n');

    const orderDetail = await orderService.getOrderDetail(newOrder.id);
    console.log(`工单编号: ${orderDetail.orderNo}`);
    console.log(`宿舍信息: ${orderDetail.dormitory} ${orderDetail.roomNumber}`);
    console.log(`问题类型: ${orderDetail.issueType}`);
    console.log(`问题描述: ${orderDetail.description}`);
    console.log(`当前状态: ${getStatusDisplayName(orderDetail.currentStatus)}`);
    console.log(`创建人: ${orderDetail.creator.name} (${getRoleDisplayName(orderDetail.creator.role)})`);
    console.log(`维修师傅: ${orderDetail.assignee?.name} (${getRoleDisplayName(orderDetail.assignee?.role || '')})`);
    console.log('');

    console.log('📦 维修材料:');
    if (orderDetail.materials.length > 0) {
      orderDetail.materials.forEach(m => {
        console.log(`  ${m.materialName} ${m.specification || ''}`);
        console.log(`    数量: ${m.quantity}${m.unit} | 单价: ${m.unitPrice}元 | 登记时间: ${m.registeredAt.toLocaleString()}`);
        if (m.note) console.log(`    备注: ${m.note}`);
      });
    } else {
      console.log('  暂无材料记录');
    }
    console.log('');

    console.log('💰 维修费用:');
    if (orderDetail.fees.length > 0) {
      orderDetail.fees.forEach(f => {
        console.log(`  ${f.feeType}: ${f.amount}元`);
        console.log(`    登记时间: ${f.registeredAt.toLocaleString()}`);
        if (f.note) console.log(`    备注: ${f.note}`);
      });
      const totalFee = orderDetail.fees.reduce((sum, f) => sum + f.amount, 0);
      console.log(`  费用合计: ${totalFee}元`);
    } else {
      console.log('  暂无费用记录');
    }
    console.log('');

    console.log('📝 退回原因:');
    console.log(`  ${orderDetail.returnReason || '无'}`);
    console.log('');

    console.log('📌 补充备注:');
    console.log(`  ${orderDetail.supplementNote || '无'}`);
    console.log('');

    console.log('📜 状态流转历史:');
    orderDetail.statusHistories.forEach((h, idx) => {
      console.log(`  ${idx + 1}. ${h.operatedAt.toLocaleString()}`);
      console.log(`     操作人: ${h.operator.name} (${getRoleDisplayName(h.operator.role)})`);
      if (h.fromStatus) {
        console.log(`     ${getStatusDisplayName(h.fromStatus)} → ${getStatusDisplayName(h.toStatus)}`);
      } else {
        console.log(`     初始状态: ${getStatusDisplayName(h.toStatus)}`);
      }
      if (h.remark) console.log(`     备注: ${h.remark}`);
    });
    console.log('');

    console.log('🔍 审核记录:');
    if (orderDetail.auditRecords.length > 0) {
      orderDetail.auditRecords.forEach(r => {
        console.log(`  ${r.auditAt.toLocaleString()}`);
        console.log(`    审核人: ${r.auditor.name}`);
        console.log(`    结果: ${r.auditResult === 'APPROVED' ? '通过' : '退回'}`);
        if (r.auditOpinion) console.log(`    意见: ${r.auditOpinion}`);
      });
    } else {
      console.log('  暂无审核记录');
    }
    console.log('');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ 测试退回流程');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('1️⃣  再创建一个工单用于退回测试');
    const returnTestOrder = await orderService.createOrder({
      dormitory: '1号楼',
      roomNumber: '305',
      issueType: '家具维修',
      description: '椅子腿松动',
      creatorId: dormManager.id,
    });
    console.log(`   ✅ 创建成功: ${returnTestOrder.orderNo}`);
    console.log('');

    console.log('2️⃣  派单');
    const assignedReturnOrder = await orderService.assignOrder({
      orderId: returnTestOrder.id,
      assigneeId: repairWorker.id,
      operatorId: supervisor.id,
    });
    console.log(`   ✅ 派单成功`);
    console.log('');

    console.log('3️⃣  登记材料');
    const materialReturnOrder = await orderService.registerMaterials({
      orderId: assignedReturnOrder.id,
      materials: [
        {
          materialName: '螺丝',
          quantity: 8,
          unit: '个',
          unitPrice: 0.5,
        },
      ],
      operatorId: repairWorker.id,
    });
    console.log(`   ✅ 材料登记成功`);
    console.log('');

    console.log('4️⃣  登记费用');
    const feeReturnOrder = await orderService.registerFees({
      orderId: materialReturnOrder.id,
      fees: [
        { feeType: '材料费', amount: 4.00 },
        { feeType: '人工费', amount: 200.00 },
      ],
      operatorId: repairWorker.id,
    });
    console.log(`   ✅ 费用登记成功`);
    console.log('');

    console.log('5️⃣  后勤主管审核退回');
    const returnedOrder = await orderService.auditOrder({
      orderId: feeReturnOrder.id,
      auditorId: supervisor.id,
      auditResult: 'REJECTED',
      returnReason: '人工费过高，请重新核实收费标准',
      auditOpinion: '简单紧固螺丝，人工费不应超过50元',
    });
    console.log(`   ✅ 审核退回成功`);
    console.log(`      当前状态: ${getStatusDisplayName(returnedOrder.currentStatus)}`);
    console.log(`      退回原因: ${returnedOrder.returnReason}`);
    console.log('');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ 退回后重新登记费用并审核通过');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('1️⃣  维修师傅重新登记材料（退回后可以修改）');
    const reMaterialOrder = await orderService.registerMaterials({
      orderId: returnedOrder.id,
      materials: [
        {
          materialName: '螺丝',
          quantity: 4,
          unit: '个',
          unitPrice: 0.5,
          note: '只用了4颗',
        },
      ],
      operatorId: repairWorker.id,
    });
    console.log(`   ✅ 材料重新登记成功`);
    console.log(`      当前状态: ${getStatusDisplayName(reMaterialOrder.currentStatus)}`);
    console.log('');

    console.log('2️⃣  维修师傅重新登记费用');
    const reFeeOrder = await orderService.registerFees({
      orderId: reMaterialOrder.id,
      fees: [
        { feeType: '材料费', amount: 2.00, note: '4颗螺丝' },
        { feeType: '人工费', amount: 30.00, note: '简单维修' },
      ],
      operatorId: repairWorker.id,
    });
    console.log(`   ✅ 费用重新登记成功`);
    console.log(`      当前状态: ${getStatusDisplayName(reFeeOrder.currentStatus)}`);
    console.log('');

    console.log('3️⃣  后勤主管审核通过');
    const finalOrder = await orderService.auditOrder({
      orderId: reFeeOrder.id,
      auditorId: supervisor.id,
      auditResult: 'APPROVED',
      auditOpinion: '费用合理',
    });
    console.log(`   ✅ 审核通过`);
    console.log(`      当前状态: ${getStatusDisplayName(finalOrder.currentStatus)}`);
    console.log('');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('👀 各角色待办查询（流程完成后）');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('1️⃣  宿管待办 - 王宿管');
    const finalDormTodos = await orderService.getTodoList(dormManager.id, dormManager.role);
    console.log(`   ✅ 共 ${finalDormTodos.length} 条待办（已完成和已退回的工单）`);
    finalDormTodos.forEach(o => console.log(`      ${o.orderNo} - ${o.issueType} - ${getStatusDisplayName(o.currentStatus)}`));
    console.log('');

    console.log('2️⃣  维修师傅待办 - 李师傅');
    const finalWorkerTodos = await orderService.getTodoList(repairWorker.id, repairWorker.role);
    console.log(`   ✅ 共 ${finalWorkerTodos.length} 条待办`);
    finalWorkerTodos.forEach(o => console.log(`      ${o.orderNo} - ${o.issueType} - ${getStatusDisplayName(o.currentStatus)}`));
    console.log('');

    console.log('3️⃣  后勤主管待办 - 赵主管');
    const finalSupervisorTodos = await orderService.getTodoList(supervisor.id, supervisor.role);
    console.log(`   ✅ 共 ${finalSupervisorTodos.length} 条待办`);
    finalSupervisorTodos.forEach(o => console.log(`      ${o.orderNo} - ${o.issueType} - ${getStatusDisplayName(o.currentStatus)}`));
    console.log('');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 数据统计');
    console.log('═══════════════════════════════════════════════════════════\n');

    const allOrders = await orderService.getAllOrders();
    console.log(`总工单数量: ${allOrders.length}`);
    
    const statusCount: Record<string, number> = {};
    allOrders.forEach(o => {
      statusCount[o.currentStatus] = (statusCount[o.currentStatus] || 0) + 1;
    });
    console.log('各状态工单数量:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`  ${getStatusDisplayName(status)}: ${count}`);
    });

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎉 所有测试通过！主链路运行正常');
    console.log('═══════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    if (error instanceof Error) {
      console.error('错误信息:', error.message);
      console.error('错误堆栈:', error.stack);
    }
    process.exit(1);
  }
}

test();
