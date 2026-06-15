import { PrismaClient } from '@prisma/client';

const Role = {
  CUSTOMER_SERVICE: 'CUSTOMER_SERVICE',
  ENGINEER: 'ENGINEER',
  PARTS_ADMIN: 'PARTS_ADMIN',
} as const;
type Role = (typeof Role)[keyof typeof Role];

const RepairStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  ASSIGNED: 'ASSIGNED',
  APPOINTMENT_SCHEDULED: 'APPOINTMENT_SCHEDULED',
  ENGINEER_DISPATCHED: 'ENGINEER_DISPATCHED',
  DIAGNOSIS_DONE: 'DIAGNOSIS_DONE',
  PARTS_REQUESTED: 'PARTS_REQUESTED',
  PARTS_DELIVERED: 'PARTS_DELIVERED',
  REPAIR_IN_PROGRESS: 'REPAIR_IN_PROGRESS',
  REPAIR_COMPLETED: 'REPAIR_COMPLETED',
  CUSTOMER_CONFIRMED: 'CUSTOMER_CONFIRMED',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
} as const;
type RepairStatus = (typeof RepairStatus)[keyof typeof RepairStatus];

const AppointmentStatus = {
  SCHEDULED: 'SCHEDULED',
  CONFIRMED: 'CONFIRMED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  RESCHEDULED: 'RESCHEDULED',
  CANCELLED: 'CANCELLED',
} as const;
type AppointmentStatus = (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

const PartRequestStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  DELIVERED: 'DELIVERED',
} as const;
type PartRequestStatus = (typeof PartRequestStatus)[keyof typeof PartRequestStatus];

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化数据...');

  await prisma.partRequestItem.deleteMany();
  await prisma.partRequest.deleteMany();
  await prisma.part.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.statusLog.deleteMany();
  await prisma.repairOrder.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  const cs1 = await prisma.user.create({
    data: {
      username: 'kefu01',
      password: '123456',
      name: '王芳',
      role: Role.CUSTOMER_SERVICE,
      phone: '13800000001',
    },
  });

  const cs2 = await prisma.user.create({
    data: {
      username: 'kefu02',
      password: '123456',
      name: '李明',
      role: Role.CUSTOMER_SERVICE,
      phone: '13800000002',
    },
  });

  const eng1 = await prisma.user.create({
    data: {
      username: 'weixiu01',
      password: '123456',
      name: '张师傅',
      role: Role.ENGINEER,
      phone: '13900000001',
    },
  });

  const eng2 = await prisma.user.create({
    data: {
      username: 'weixiu02',
      password: '123456',
      name: '刘师傅',
      role: Role.ENGINEER,
      phone: '13900000002',
    },
  });

  const partsAdmin = await prisma.user.create({
    data: {
      username: 'peijian01',
      password: '123456',
      name: '赵管理员',
      role: Role.PARTS_ADMIN,
      phone: '13700000001',
    },
  });

  console.log('演示账号创建完成');
  console.log('客服账号: kefu01 / kefu02, 密码: 123456');
  console.log('维修工程师: weixiu01 / weixiu02, 密码: 123456');
  console.log('配件管理员: peijian01, 密码: 123456');

  const customer1 = await prisma.customer.create({
    data: {
      name: '陈女士',
      phone: '13612345678',
      address: '北京市朝阳区建国路88号现代城3号楼1502',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: '周先生',
      phone: '13687654321',
      address: '北京市海淀区中关村大街1号科技大厦A座2201',
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: '吴阿姨',
      phone: '13511112222',
      address: '北京市西城区西直门外大街1号院5号楼803',
    },
  });

  const customer4 = await prisma.customer.create({
    data: {
      name: '孙先生',
      phone: '13533334444',
      address: '北京市东城区东长安街1号东方广场C2座1205',
    },
  });

  const order1 = await prisma.repairOrder.create({
    data: {
      orderNo: 'WX20260528001',
      customerId: customer1.id,
      applianceType: '空调',
      applianceBrand: '格力',
      applianceModel: 'KFR-35GW',
      faultDescription: '空调制冷效果差，开了一晚上温度降不下来，还有异响',
      status: RepairStatus.CLOSED,
      priority: 'HIGH',
      acceptedById: cs1.id,
      assignedToId: eng1.id,
      closedById: cs1.id,
      closedNote: '客户回访满意度5星，维修完成无其他问题',
      createdAt: new Date('2026-05-28T09:15:00'),
    },
  });

  await prisma.statusLog.createMany({
    data: [
      {
        repairOrderId: order1.id,
        fromStatus: null,
        toStatus: RepairStatus.PENDING,
        note: '客户来电报修，已记录故障信息',
        operatorId: cs1.id,
        createdAt: new Date('2026-05-28T09:15:00'),
      },
      {
        repairOrderId: order1.id,
        fromStatus: RepairStatus.PENDING,
        toStatus: RepairStatus.ACCEPTED,
        note: '客服王芳受理，确认在保修期内',
        operatorId: cs1.id,
        createdAt: new Date('2026-05-28T09:22:00'),
      },
      {
        repairOrderId: order1.id,
        fromStatus: RepairStatus.ACCEPTED,
        toStatus: RepairStatus.ASSIGNED,
        note: '分配给张师傅负责，已电话通知',
        operatorId: cs1.id,
        createdAt: new Date('2026-05-28T09:30:00'),
      },
      {
        repairOrderId: order1.id,
        fromStatus: RepairStatus.ASSIGNED,
        toStatus: RepairStatus.APPOINTMENT_SCHEDULED,
        note: '与客户约定5月29日上午9:00-11:00上门',
        operatorId: cs1.id,
        createdAt: new Date('2026-05-28T09:45:00'),
      },
      {
        repairOrderId: order1.id,
        fromStatus: RepairStatus.APPOINTMENT_SCHEDULED,
        toStatus: RepairStatus.ENGINEER_DISPATCHED,
        note: '张师傅已出发，预计40分钟到达',
        operatorId: eng1.id,
        createdAt: new Date('2026-05-29T08:20:00'),
      },
      {
        repairOrderId: order1.id,
        fromStatus: RepairStatus.ENGINEER_DISPATCHED,
        toStatus: RepairStatus.DIAGNOSIS_DONE,
        note: '现场检测：压缩机启动电容损坏，制冷剂不足，需要更换电容补充制冷剂',
        operatorId: eng1.id,
        createdAt: new Date('2026-05-29T09:40:00'),
      },
      {
        repairOrderId: order1.id,
        fromStatus: RepairStatus.DIAGNOSIS_DONE,
        toStatus: RepairStatus.PARTS_REQUESTED,
        note: '申请启动电容1个，R410A制冷剂1罐',
        operatorId: eng1.id,
        createdAt: new Date('2026-05-29T09:45:00'),
      },
      {
        repairOrderId: order1.id,
        fromStatus: RepairStatus.PARTS_REQUESTED,
        toStatus: RepairStatus.PARTS_DELIVERED,
        note: '配件已从客户附近网点调出，张师傅已领取',
        operatorId: partsAdmin.id,
        createdAt: new Date('2026-05-29T10:10:00'),
      },
      {
        repairOrderId: order1.id,
        fromStatus: RepairStatus.PARTS_DELIVERED,
        toStatus: RepairStatus.REPAIR_IN_PROGRESS,
        note: '开始维修，更换电容并补充制冷剂',
        operatorId: eng1.id,
        createdAt: new Date('2026-05-29T10:25:00'),
      },
      {
        repairOrderId: order1.id,
        fromStatus: RepairStatus.REPAIR_IN_PROGRESS,
        toStatus: RepairStatus.REPAIR_COMPLETED,
        note: '维修完成，试运行30分钟，制冷正常，无异响，客户现场确认',
        operatorId: eng1.id,
        createdAt: new Date('2026-05-29T11:30:00'),
      },
      {
        repairOrderId: order1.id,
        fromStatus: RepairStatus.REPAIR_COMPLETED,
        toStatus: RepairStatus.CUSTOMER_CONFIRMED,
        note: '客户确认维修满意，签字验收',
        operatorId: cs2.id,
        createdAt: new Date('2026-05-29T14:00:00'),
      },
      {
        repairOrderId: order1.id,
        fromStatus: RepairStatus.CUSTOMER_CONFIRMED,
        toStatus: RepairStatus.CLOSED,
        note: '客服回访完成，客户满意度5星，工单关闭',
        operatorId: cs1.id,
        createdAt: new Date('2026-05-30T10:00:00'),
      },
    ],
  });

  await prisma.appointment.create({
    data: {
      repairOrderId: order1.id,
      scheduledDate: new Date('2026-05-29'),
      timeSlot: '09:00-11:00',
      status: AppointmentStatus.COMPLETED,
      note: '客户确认时间可配合',
      engineerId: eng1.id,
      createdById: cs1.id,
      createdAt: new Date('2026-05-28T09:45:00'),
      completedAt: new Date('2026-05-29T11:30:00'),
      completionNote: '按时上门，维修完成',
    },
  });

  const order2 = await prisma.repairOrder.create({
    data: {
      orderNo: 'WX20260605002',
      customerId: customer2.id,
      applianceType: '冰箱',
      applianceBrand: '海尔',
      applianceModel: 'BCD-458WDVMU1',
      faultDescription: '冰箱不制冷，冷冻室食物已开始解冻，运行时噪音很大',
      status: RepairStatus.REPAIR_COMPLETED,
      priority: 'URGENT',
      acceptedById: cs2.id,
      assignedToId: eng2.id,
      createdAt: new Date('2026-06-05T14:30:00'),
    },
  });

  await prisma.statusLog.createMany({
    data: [
      {
        repairOrderId: order2.id,
        fromStatus: null,
        toStatus: RepairStatus.PENDING,
        note: '客户紧急报修，称食物可能全部坏掉',
        operatorId: cs2.id,
        createdAt: new Date('2026-06-05T14:30:00'),
      },
      {
        repairOrderId: order2.id,
        fromStatus: RepairStatus.PENDING,
        toStatus: RepairStatus.ACCEPTED,
        note: '客服李明受理，标记为紧急工单',
        operatorId: cs2.id,
        createdAt: new Date('2026-06-05T14:35:00'),
      },
      {
        repairOrderId: order2.id,
        fromStatus: RepairStatus.ACCEPTED,
        toStatus: RepairStatus.ASSIGNED,
        note: '紧急分配给刘师傅，要求2小时内到场',
        operatorId: cs2.id,
        createdAt: new Date('2026-06-05T14:40:00'),
      },
      {
        repairOrderId: order2.id,
        fromStatus: RepairStatus.ASSIGNED,
        toStatus: RepairStatus.APPOINTMENT_SCHEDULED,
        note: '客户要求立即上门，约定当天下午16:30前到达',
        operatorId: cs2.id,
        createdAt: new Date('2026-06-05T14:45:00'),
      },
      {
        repairOrderId: order2.id,
        fromStatus: RepairStatus.APPOINTMENT_SCHEDULED,
        toStatus: RepairStatus.ENGINEER_DISPATCHED,
        note: '刘师傅已出发，携带常用配件',
        operatorId: eng2.id,
        createdAt: new Date('2026-06-05T15:00:00'),
      },
      {
        repairOrderId: order2.id,
        fromStatus: RepairStatus.ENGINEER_DISPATCHED,
        toStatus: RepairStatus.DIAGNOSIS_DONE,
        note: '检查发现：主板损坏，压缩机正常。需更换变频主板',
        operatorId: eng2.id,
        createdAt: new Date('2026-06-05T16:00:00'),
      },
      {
        repairOrderId: order2.id,
        fromStatus: RepairStatus.DIAGNOSIS_DONE,
        toStatus: RepairStatus.PARTS_REQUESTED,
        note: '申请海尔变频主板1块，客户同意付费维修',
        operatorId: eng2.id,
        createdAt: new Date('2026-06-05T16:10:00'),
      },
      {
        repairOrderId: order2.id,
        fromStatus: RepairStatus.PARTS_REQUESTED,
        toStatus: RepairStatus.PARTS_DELIVERED,
        note: '中心库有现货，已安排同城快递，预计次日上午送达',
        operatorId: partsAdmin.id,
        createdAt: new Date('2026-06-05T16:30:00'),
      },
      {
        repairOrderId: order2.id,
        fromStatus: RepairStatus.PARTS_DELIVERED,
        toStatus: RepairStatus.REPAIR_IN_PROGRESS,
        note: '已收到主板，开始更换',
        operatorId: eng2.id,
        createdAt: new Date('2026-06-06T10:15:00'),
      },
      {
        repairOrderId: order2.id,
        fromStatus: RepairStatus.REPAIR_IN_PROGRESS,
        toStatus: RepairStatus.REPAIR_COMPLETED,
        note: '主板更换完成，制冷恢复正常，已告知客户需运行2小时后再放入食物',
        operatorId: eng2.id,
        createdAt: new Date('2026-06-06T11:45:00'),
      },
    ],
  });

  await prisma.appointment.create({
    data: {
      repairOrderId: order2.id,
      scheduledDate: new Date('2026-06-05'),
      timeSlot: '16:00-18:00',
      status: AppointmentStatus.COMPLETED,
      note: '紧急上门，优先处理',
      engineerId: eng2.id,
      createdById: cs2.id,
      createdAt: new Date('2026-06-05T14:45:00'),
      completedAt: new Date('2026-06-06T11:45:00'),
      completionNote: '主板更换完成，二次上门收尾',
    },
  });

  const order3 = await prisma.repairOrder.create({
    data: {
      orderNo: 'WX20260610003',
      customerId: customer3.id,
      applianceType: '洗衣机',
      applianceBrand: '西门子',
      applianceModel: 'WM12P2C00W',
      faultDescription: '洗衣机不脱水，显示故障码E23，重启无效',
      status: RepairStatus.PARTS_DELIVERED,
      priority: 'NORMAL',
      acceptedById: cs1.id,
      assignedToId: eng1.id,
      createdAt: new Date('2026-06-10T08:45:00'),
    },
  });

  await prisma.statusLog.createMany({
    data: [
      {
        repairOrderId: order3.id,
        fromStatus: null,
        toStatus: RepairStatus.PENDING,
        note: '吴阿姨来电报修，说洗衣机用了5年多了',
        operatorId: cs1.id,
        createdAt: new Date('2026-06-10T08:45:00'),
      },
      {
        repairOrderId: order3.id,
        fromStatus: RepairStatus.PENDING,
        toStatus: RepairStatus.ACCEPTED,
        note: '客服王芳受理，判断可能是排水泵问题',
        operatorId: cs1.id,
        createdAt: new Date('2026-06-10T08:55:00'),
      },
      {
        repairOrderId: order3.id,
        fromStatus: RepairStatus.ACCEPTED,
        toStatus: RepairStatus.ASSIGNED,
        note: '分配张师傅，吴阿姨要求上午上门方便',
        operatorId: cs1.id,
        createdAt: new Date('2026-06-10T09:00:00'),
      },
      {
        repairOrderId: order3.id,
        fromStatus: RepairStatus.ASSIGNED,
        toStatus: RepairStatus.APPOINTMENT_SCHEDULED,
        note: '预约6月11日上午10:00-12:00上门',
        operatorId: cs1.id,
        createdAt: new Date('2026-06-10T09:10:00'),
      },
      {
        repairOrderId: order3.id,
        fromStatus: RepairStatus.APPOINTMENT_SCHEDULED,
        toStatus: RepairStatus.ENGINEER_DISPATCHED,
        note: '张师傅已出发',
        operatorId: eng1.id,
        createdAt: new Date('2026-06-11T09:30:00'),
      },
      {
        repairOrderId: order3.id,
        fromStatus: RepairStatus.ENGINEER_DISPATCHED,
        toStatus: RepairStatus.DIAGNOSIS_DONE,
        note: '检测结果：排水泵叶轮损坏，电机线圈烧毁，需更换排水泵总成',
        operatorId: eng1.id,
        createdAt: new Date('2026-06-11T10:45:00'),
      },
      {
        repairOrderId: order3.id,
        fromStatus: RepairStatus.DIAGNOSIS_DONE,
        toStatus: RepairStatus.PARTS_REQUESTED,
        note: '申请西门子洗衣机排水泵总成1套',
        operatorId: eng1.id,
        createdAt: new Date('2026-06-11T10:50:00'),
      },
      {
        repairOrderId: order3.id,
        fromStatus: RepairStatus.PARTS_REQUESTED,
        toStatus: RepairStatus.PARTS_DELIVERED,
        note: '配件已通过顺丰发出，预计6月12日上午送达',
        operatorId: partsAdmin.id,
        createdAt: new Date('2026-06-11T15:00:00'),
      },
    ],
  });

  await prisma.appointment.create({
    data: {
      repairOrderId: order3.id,
      scheduledDate: new Date('2026-06-11'),
      timeSlot: '10:00-12:00',
      status: AppointmentStatus.COMPLETED,
      note: '吴阿姨在家等候',
      engineerId: eng1.id,
      createdById: cs1.id,
      createdAt: new Date('2026-06-10T09:10:00'),
      completedAt: new Date('2026-06-11T11:00:00'),
      completionNote: '完成检测，等待配件送达后二次上门',
    },
  });

  const order4 = await prisma.repairOrder.create({
    data: {
      orderNo: 'WX20260614004',
      customerId: customer4.id,
      applianceType: '热水器',
      applianceBrand: 'A.O.史密斯',
      applianceModel: 'E80VC0',
      faultDescription: '热水器不出热水，显示屏闪烁，使用8年',
      status: RepairStatus.ACCEPTED,
      priority: 'NORMAL',
      acceptedById: cs2.id,
      createdAt: new Date('2026-06-14T16:20:00'),
    },
  });

  await prisma.statusLog.createMany({
    data: [
      {
        repairOrderId: order4.id,
        fromStatus: null,
        toStatus: RepairStatus.PENDING,
        note: '孙先生在线提交报修单',
        operatorId: cs2.id,
        createdAt: new Date('2026-06-14T16:20:00'),
      },
      {
        repairOrderId: order4.id,
        fromStatus: RepairStatus.PENDING,
        toStatus: RepairStatus.ACCEPTED,
        note: '客服李明受理，已电话回拨确认故障详情',
        operatorId: cs2.id,
        createdAt: new Date('2026-06-14T16:30:00'),
      },
    ],
  });

  const order5 = await prisma.repairOrder.create({
    data: {
      orderNo: 'WX20260615005',
      customerId: customer1.id,
      applianceType: '微波炉',
      applianceBrand: '美的',
      applianceModel: 'M3-L233B',
      faultDescription: '微波炉加热不均匀，有时候完全不加热',
      status: RepairStatus.PENDING,
      priority: 'LOW',
      createdAt: new Date('2026-06-15T09:05:00'),
    },
  });

  await prisma.statusLog.create({
    data: {
      repairOrderId: order5.id,
      fromStatus: null,
      toStatus: RepairStatus.PENDING,
      note: '客户陈女士二次来电报修（去年修过一次），建议派上次的张师傅',
      operatorId: cs1.id,
      createdAt: new Date('2026-06-15T09:05:00'),
    },
  });

  console.log('客户及报修单数据创建完成');

  const part1 = await prisma.part.create({
    data: {
      partNo: 'PJ-001',
      name: '空调压缩机启动电容 35uF',
      category: '空调配件',
      stock: 58,
      unit: '个',
      price: 45,
    },
  });

  const part2 = await prisma.part.create({
    data: {
      partNo: 'PJ-002',
      name: 'R410A制冷剂',
      category: '空调配件',
      stock: 25,
      unit: '罐',
      price: 120,
    },
  });

  const part3 = await prisma.part.create({
    data: {
      partNo: 'PJ-003',
      name: '海尔冰箱变频主板',
      category: '冰箱配件',
      stock: 3,
      unit: '块',
      price: 680,
    },
  });

  const part4 = await prisma.part.create({
    data: {
      partNo: 'PJ-004',
      name: '西门子洗衣机排水泵总成',
      category: '洗衣机配件',
      stock: 8,
      unit: '套',
      price: 285,
    },
  });

  const part5 = await prisma.part.create({
    data: {
      partNo: 'PJ-005',
      name: 'A.O.史密斯加热管',
      category: '热水器配件',
      stock: 12,
      unit: '根',
      price: 320,
    },
  });

  const part6 = await prisma.part.create({
    data: {
      partNo: 'PJ-006',
      name: '美的微波炉磁控管',
      category: '微波炉配件',
      stock: 15,
      unit: '个',
      price: 180,
    },
  });

  const part7 = await prisma.part.create({
    data: {
      partNo: 'PJ-007',
      name: '空调遥控器 通用型',
      category: '空调配件',
      stock: 50,
      unit: '个',
      price: 35,
    },
  });

  console.log('配件库存数据创建完成');

  const pr1 = await prisma.partRequest.create({
    data: {
      repairOrderId: order1.id,
      status: PartRequestStatus.DELIVERED,
      requestedById: eng1.id,
      approvedById: partsAdmin.id,
      note: '现场检测后申请，客户在保修期内',
      approvalNote: '保修工单，免费出库',
      createdAt: new Date('2026-05-29T09:45:00'),
      deliveredAt: new Date('2026-05-29T10:10:00'),
    },
  });

  await prisma.partRequestItem.createMany({
    data: [
      { partRequestId: pr1.id, partId: part1.id, quantity: 1, deliveredQty: 1 },
      { partRequestId: pr1.id, partId: part2.id, quantity: 1, deliveredQty: 1 },
    ],
  });

  const pr2 = await prisma.partRequest.create({
    data: {
      repairOrderId: order2.id,
      status: PartRequestStatus.DELIVERED,
      requestedById: eng2.id,
      approvedById: partsAdmin.id,
      note: '紧急工单，主板损坏，客户付费',
      approvalNote: '已审批，按原价收费680元+人工费',
      createdAt: new Date('2026-06-05T16:10:00'),
      deliveredAt: new Date('2026-06-06T09:30:00'),
    },
  });

  await prisma.partRequestItem.create({
    data: { partRequestId: pr2.id, partId: part3.id, quantity: 1, deliveredQty: 1 },
  });

  const pr3 = await prisma.partRequest.create({
    data: {
      repairOrderId: order3.id,
      status: PartRequestStatus.APPROVED,
      requestedById: eng1.id,
      approvedById: partsAdmin.id,
      note: '排水泵损坏，吴阿姨家过保了，报价已确认',
      approvalNote: '已审批，顺丰寄出',
      createdAt: new Date('2026-06-11T10:50:00'),
    },
  });

  await prisma.partRequestItem.create({
    data: { partRequestId: pr3.id, partId: part4.id, quantity: 1, deliveredQty: 1 },
  });

  console.log('配件申请记录创建完成');
  console.log('全部数据初始化成功！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
