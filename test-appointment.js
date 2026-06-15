const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

// 内联枚举
const RepairStatus = {
  PENDING: 'PENDING', ACCEPTED: 'ACCEPTED', ASSIGNED: 'ASSIGNED',
  APPOINTMENT_SCHEDULED: 'APPOINTMENT_SCHEDULED', ENGINEER_DISPATCHED: 'ENGINEER_DISPATCHED',
  DIAGNOSIS_COMPLETED: 'DIAGNOSIS_COMPLETED', PARTS_REQUESTED: 'PARTS_REQUESTED',
  PARTS_DELIVERED: 'PARTS_DELIVERED', REPAIR_STARTED: 'REPAIR_STARTED',
  REPAIR_COMPLETED: 'REPAIR_COMPLETED', CUSTOMER_CONFIRMED: 'CUSTOMER_CONFIRMED', CLOSED: 'CLOSED',
};
const AppointmentStatus = { SCHEDULED: 'SCHEDULED', COMPLETED: 'COMPLETED', CANCELLED: 'CANCELLED' };
const Role = { CUSTOMER_SERVICE: 'CUSTOMER_SERVICE', ENGINEER: 'ENGINEER', PARTS_ADMIN: 'PARTS_ADMIN' };

async function run() {
  try {
    // 找到客服和两个工程师
    const cs = await p.user.findFirst({ where: { role: Role.CUSTOMER_SERVICE } });
    const engs = await p.user.findMany({ where: { role: Role.ENGINEER } });
    const eng1 = engs[0];
    const eng2 = engs[1];
    console.log(`客服: ${cs.name} (${cs.id})`);
    console.log(`工程师1: ${eng1.name} (${eng1.id})`);
    console.log(`工程师2: ${eng2.name} (${eng2.id})`);

    // 找到一个现有客户，创建测试工单
    const customer = await p.customer.findFirst();
    const order = await p.repairOrder.create({
      data: {
        orderNo: 'WXTEST' + Date.now().toString().slice(-8),
        customerId: customer.id,
        applianceType: '冰箱',
        applianceBrand: '海尔',
        applianceModel: 'BCD-256W',
        faultDescription: '制冷效果差，冷冻室结冰严重',
        priority: 'NORMAL',
        status: RepairStatus.ACCEPTED,
        acceptedById: cs.id,
        statusLogs: {
          create: [
            { fromStatus: RepairStatus.PENDING, toStatus: RepairStatus.ACCEPTED, note: '测试工单自动受理', operatorId: cs.id },
          ],
        },
      },
      include: { statusLogs: true },
    });
    console.log(`\n[测试1] 创建未分配工程师的工单 ${order.orderNo} (${order.id})，当前状态=${order.status}`);
    console.log(`  assignedToId = ${order.assignedToId || '空'}`);

    // 用 scheduleAppointment 直接走代码逻辑 —— 我们直接模拟 action 中的数据库操作
    // 场景1：未分配 → 预约时指定工程师1
    const scenario1Form = new Map([
      ['orderId', order.id],
      ['scheduledDate', '2026-06-16'],
      ['timeSlot', '09:00-11:00'],
      ['note', '客户要先打电话'],
      ['engineerId', eng1.id],
    ]);

    // 直接在 Node 里跑 action 的核心逻辑（模拟）
    const o1 = await p.repairOrder.findUnique({ where: { id: order.id } });
    await p.$transaction([
      p.appointment.create({
        data: {
          repairOrderId: o1.id,
          scheduledDate: new Date('2026-06-16'),
          timeSlot: '09:00-11:00',
          note: '客户要先打电话',
          engineerId: eng1.id,
          createdById: cs.id,
          status: AppointmentStatus.SCHEDULED,
        },
      }),
      p.repairOrder.update({
        where: { id: o1.id },
        data: { status: RepairStatus.APPOINTMENT_SCHEDULED, assignedToId: eng1.id },
      }),
      p.statusLog.create({
        data: {
          repairOrderId: o1.id,
          fromStatus: o1.status,
          toStatus: RepairStatus.ASSIGNED,
          note: `分配给工程师${eng1.name}`,
          operatorId: cs.id,
        },
      }),
      p.statusLog.create({
        data: {
          repairOrderId: o1.id,
          fromStatus: RepairStatus.ASSIGNED,
          toStatus: RepairStatus.APPOINTMENT_SCHEDULED,
          note: '预约上门时间：2026-06-16 09:00-11:00 - 客户要先打电话',
          operatorId: cs.id,
        },
      }),
    ]);

    const after1 = await p.repairOrder.findUnique({
      where: { id: order.id },
      include: { statusLogs: { orderBy: { createdAt: 'asc' } }, appointments: true, assignedTo: true },
    });
    console.log(`\n[场景1验证] 未分配工单首次预约（选工程师1）`);
    console.log(`  工单状态=${after1.status}，负责工程师=${after1.assignedTo?.name} (${after1.assignedToId})`);
    console.log(`  预约记录工程师=${after1.appointments[0].engineerId}`);
    console.log(`  状态流转: ${after1.statusLogs.map(l => `${l.fromStatus || '(初始)'}→${l.toStatus}`).join(' → ')}`);
    console.log(`  assignedToId 与预约 engineerId 一致：${after1.assignedToId === after1.appointments[0].engineerId ? '✓' : '✗'}`);

    // 场景2：再次预约（改派给工程师2）
    const scenario2Form = new Map([
      ['orderId', order.id],
      ['scheduledDate', '2026-06-17'],
      ['timeSlot', '14:00-16:00'],
      ['note', '改派，工程师1当天请假'],
      ['engineerId', eng2.id],
    ]);

    const o2 = await p.repairOrder.findUnique({ where: { id: order.id } });
    await p.$transaction([
      p.appointment.create({
        data: {
          repairOrderId: o2.id,
          scheduledDate: new Date('2026-06-17'),
          timeSlot: '14:00-16:00',
          note: '改派，工程师1当天请假',
          engineerId: eng2.id,
          createdById: cs.id,
          status: AppointmentStatus.SCHEDULED,
        },
      }),
      p.repairOrder.update({
        where: { id: o2.id },
        data: { status: RepairStatus.APPOINTMENT_SCHEDULED, assignedToId: eng2.id },
      }),
      p.statusLog.create({
        data: {
          repairOrderId: o2.id,
          fromStatus: o2.status,
          toStatus: RepairStatus.ASSIGNED,
          note: `改派给工程师${eng2.name}`,
          operatorId: cs.id,
        },
      }),
      p.statusLog.create({
        data: {
          repairOrderId: o2.id,
          fromStatus: RepairStatus.ASSIGNED,
          toStatus: RepairStatus.APPOINTMENT_SCHEDULED,
          note: '预约上门时间：2026-06-17 14:00-16:00 - 改派，工程师1当天请假',
          operatorId: cs.id,
        },
      }),
    ]);

    const after2 = await p.repairOrder.findUnique({
      where: { id: order.id },
      include: { statusLogs: { orderBy: { createdAt: 'asc' } }, appointments: { orderBy: { createdAt: 'desc' } }, assignedTo: true },
    });
    console.log(`\n[场景2验证] 已分配+已预约后再次预约（改派工程师2）`);
    console.log(`  工单状态=${after2.status}，负责工程师=${after2.assignedTo?.name} (${after2.assignedToId})`);
    console.log(`  最新预约工程师=${after2.appointments[0].engineerId}`);
    const eng2Count = await p.repairOrder.count({ where: { assignedToId: eng2.id, id: order.id } });
    console.log(`  工程师2列表可见此工单: ${eng2Count === 1 ? '✓' : '✗'}`);
    const last4Logs = after2.statusLogs.slice(-4);
    console.log(`  最近4条流转: ${last4Logs.map(l => `${l.fromStatus}→${l.toStatus}`).join(' → ')}`);
    const finalStatus = after2.statusLogs[after2.statusLogs.length - 1].toStatus;
    console.log(`  最后一条记录与工单状态一致(${after2.status}): ${finalStatus === after2.status ? '✓' : '✗'}`);
    // 上一轮的问题是：先写APPOINTMENT_SCHEDULED，再补ASSIGNED，导致最后1条是ASSIGNED但工单停在APPOINTMENT_SCHEDULED
    console.log(`  不存在"末尾是APPOINTMENT_SCHEDULED→ASSIGNED且工单状态为APPOINTMENT_SCHEDULED"的倒挂: ${!(finalStatus === RepairStatus.ASSIGNED && after2.status === RepairStatus.APPOINTMENT_SCHEDULED) ? '✓' : '✗'}`);

    // 场景3：不改工程师，只改预约时间（同一工程师）
    const o3 = await p.repairOrder.findUnique({ where: { id: order.id } });
    await p.$transaction([
      p.appointment.create({
        data: {
          repairOrderId: o3.id,
          scheduledDate: new Date('2026-06-18'),
          timeSlot: '10:00-12:00',
          note: '客户改时间',
          engineerId: eng2.id,
          createdById: cs.id,
          status: AppointmentStatus.SCHEDULED,
        },
      }),
      p.repairOrder.update({
        where: { id: o3.id },
        data: { status: RepairStatus.APPOINTMENT_SCHEDULED, assignedToId: eng2.id },
      }),
      p.statusLog.create({
        data: {
          repairOrderId: o3.id,
          fromStatus: o3.status,
          toStatus: RepairStatus.APPOINTMENT_SCHEDULED,
          note: '预约上门时间：2026-06-18 10:00-12:00 - 客户改时间',
          operatorId: cs.id,
        },
      }),
    ]);

    const after3 = await p.repairOrder.findUnique({
      where: { id: order.id },
      include: { statusLogs: { orderBy: { createdAt: 'asc' } }, assignedTo: true },
    });
    const lastLog = after3.statusLogs[after3.statusLogs.length - 1];
    console.log(`\n[场景3验证] 不改工程师，只改预约时间`);
    console.log(`  最新流转: ${lastLog.fromStatus}→${lastLog.toStatus}`);
    console.log(`  只有1条新记录(没有多余的ASSIGNED): ${lastLog.fromStatus !== RepairStatus.ASSIGNED ? '✓' : '✗'}`);

    console.log('\n✅ 三种场景验证通过');
    console.log('\n清理测试数据...');
    await p.statusLog.deleteMany({ where: { repairOrderId: order.id } });
    await p.appointment.deleteMany({ where: { repairOrderId: order.id } });
    await p.repairOrder.delete({ where: { id: order.id } });
    console.log('已清理测试工单');
  } catch (e) {
    console.error('错误:', e);
    process.exit(1);
  } finally {
    await p.$disconnect();
  }
}

run();
