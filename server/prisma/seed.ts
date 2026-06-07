import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始播种数据...');

  await prisma.notification.deleteMany();
  await prisma.repairStatusLog.deleteMany();
  await prisma.repairOrder.deleteMany();
  await prisma.inspectionStatusLog.deleteMany();
  await prisma.inspection.deleteMany();
  await prisma.machine.deleteMany();
  await prisma.user.deleteMany();

  const users = await Promise.all([
    prisma.user.create({
      data: {
        username: 'admin',
        name: '张网管',
        role: 'NETWORK_ADMIN',
        password: '123456'
      }
    }),
    prisma.user.create({
      data: {
        username: 'event',
        name: '李运营',
        role: 'EVENT_OPERATOR',
        password: '123456'
      }
    }),
    prisma.user.create({
      data: {
        username: 'manager',
        name: '王店长',
        role: 'STORE_MANAGER',
        password: '123456'
      }
    }),
    prisma.user.create({
      data: {
        username: 'tech',
        name: '赵技师',
        role: 'TECHNICIAN',
        password: '123456'
      }
    })
  ]);

  console.log('✅ 创建用户:', users.map(u => `${u.name}(${u.role})`).join(', '));

  const [admin, eventOp, manager, tech] = users;

  const machines = await Promise.all([
    prisma.machine.create({
      data: {
        machineNo: 'PC-001',
        name: '电竞区1号机',
        area: '电竞A区',
        status: 'IDLE',
        config: 'RTX 4090, i9-14900K, 32GB RAM'
      }
    }),
    prisma.machine.create({
      data: {
        machineNo: 'PC-002',
        name: '电竞区2号机',
        area: '电竞A区',
        status: 'IN_USE',
        config: 'RTX 4090, i9-14900K, 32GB RAM'
      }
    }),
    prisma.machine.create({
      data: {
        machineNo: 'PC-003',
        name: '普通区1号机',
        area: '普通B区',
        status: 'BROKEN',
        config: 'RTX 3060, i5-12400F, 16GB RAM'
      }
    }),
    prisma.machine.create({
      data: {
        machineNo: 'PC-004',
        name: '包厢区1号机',
        area: 'VIP包厢',
        status: 'MAINTENANCE',
        config: 'RTX 4080, i7-13700K, 32GB RAM'
      }
    }),
    prisma.machine.create({
      data: {
        machineNo: 'PC-005',
        name: '电竞区3号机',
        area: '电竞A区',
        status: 'IDLE',
        config: 'RTX 4070Ti, i7-13700K, 32GB RAM'
      }
    })
  ]);

  console.log('✅ 创建机器:', machines.map(m => m.machineNo).join(', '));

  const checkItemsTemplate = JSON.stringify({
    systemBoot: true,
    displayNormal: true,
    keyboardMouse: true,
    networkStable: true,
    gameLaunch: true,
    peripherals: true,
    cleanliness: true
  });

  const inspection1 = await prisma.inspection.create({
    data: {
      machineId: machines[2].id,
      inspectorId: admin.id,
      status: 'COMPLETED',
      checkItems: JSON.stringify({
        systemBoot: true,
        displayNormal: false,
        keyboardMouse: true,
        networkStable: false,
        gameLaunch: true,
        peripherals: true,
        cleanliness: true
      }),
      overallNote: '显示器闪屏，网络时断时续，疑似显卡和网卡问题。需要技术人员进一步检测。',
      hasIssue: true,
      statusHistory: {
        create: [
          { toStatus: 'PENDING', operatorId: admin.id, note: '创建巡检任务' },
          { fromStatus: 'PENDING', toStatus: 'IN_PROGRESS', operatorId: admin.id, note: '开始巡检' },
          { fromStatus: 'IN_PROGRESS', toStatus: 'COMPLETED', operatorId: admin.id, note: '完成巡检，发现问题' }
        ]
      }
    }
  });

  const inspection2 = await prisma.inspection.create({
    data: {
      machineId: machines[3].id,
      inspectorId: admin.id,
      status: 'RETURNED',
      checkItems: JSON.stringify({
        systemBoot: false,
        displayNormal: true,
        keyboardMouse: true,
        networkStable: true,
        gameLaunch: true,
        peripherals: true,
        cleanliness: true
      }),
      overallNote: '开不了机，按电源没反应',
      hasIssue: true,
      returnNote: '巡检记录不完整，请补充具体检测步骤和详细现象描述',
      reviewedById: manager.id,
      statusHistory: {
        create: [
          { toStatus: 'PENDING', operatorId: admin.id, note: '创建巡检任务' },
          { fromStatus: 'PENDING', toStatus: 'IN_PROGRESS', operatorId: admin.id, note: '开始巡检' },
          { fromStatus: 'IN_PROGRESS', toStatus: 'COMPLETED', operatorId: admin.id, note: '提交巡检' },
          { fromStatus: 'COMPLETED', toStatus: 'RETURNED', operatorId: manager.id, note: '退回补录：记录不完整' }
        ]
      }
    }
  });

  const inspection3 = await prisma.inspection.create({
    data: {
      machineId: machines[0].id,
      inspectorId: admin.id,
      status: 'REVIEWED',
      checkItems: checkItemsTemplate,
      overallNote: '设备运行正常，无异常',
      hasIssue: false,
      reviewedById: manager.id,
      reviewedAt: new Date(),
      reviewNote: '巡检合格',
      statusHistory: {
        create: [
          { toStatus: 'PENDING', operatorId: admin.id, note: '创建巡检任务' },
          { fromStatus: 'PENDING', toStatus: 'IN_PROGRESS', operatorId: admin.id, note: '开始巡检' },
          { fromStatus: 'IN_PROGRESS', toStatus: 'COMPLETED', operatorId: admin.id, note: '完成巡检' },
          { fromStatus: 'COMPLETED', toStatus: 'REVIEWED', operatorId: manager.id, note: '复核通过' }
        ]
      }
    }
  });

  console.log('✅ 创建巡检记录 3 条');

  const repair1 = await prisma.repairOrder.create({
    data: {
      inspectionId: inspection1.id,
      machineId: machines[2].id,
      creatorId: admin.id,
      title: 'PC-003 显示器闪屏+网络故障',
      description: '巡检发现显示器频繁闪屏，网络连接不稳定，时断时续',
      priority: 'HIGH',
      status: 'ASSIGNED',
      assignedToId: tech.id,
      assignedAt: new Date(),
      carryOverInspectionNote: true,
      inspectionNoteSnapshot: '显示器闪屏，网络时断时续，疑似显卡和网卡问题。需要技术人员进一步检测。',
      partsUsed: '[]',
      statusHistory: {
        create: [
          { toStatus: 'DRAFT', operatorId: admin.id, note: '创建维修工单' },
          { fromStatus: 'DRAFT', toStatus: 'PENDING_APPROVAL', operatorId: admin.id, note: '提交审批' },
          { fromStatus: 'PENDING_APPROVAL', toStatus: 'APPROVED', operatorId: manager.id, note: '店长审批通过' },
          { fromStatus: 'APPROVED', toStatus: 'ASSIGNED', operatorId: manager.id, note: '指派给赵技师' }
        ]
      }
    }
  });

  const repair2 = await prisma.repairOrder.create({
    data: {
      machineId: machines[1].id,
      creatorId: eventOp.id,
      title: 'PC-002 耳机没声音',
      description: '顾客反映耳机插孔没有声音输出，比赛前需要修好',
      priority: 'CRITICAL',
      status: 'COMPLETED',
      assignedToId: tech.id,
      assignedAt: new Date(Date.now() - 3600000),
      repairedAt: new Date(),
      repairNote: '前置音频接口松动，重新焊接后恢复正常',
      partsUsed: JSON.stringify([{ name: '音频焊接点', quantity: 1, cost: 0 }]),
      laborHours: 0.5,
      statusHistory: {
        create: [
          { toStatus: 'DRAFT', operatorId: eventOp.id, note: '赛事运营创建工单' },
          { fromStatus: 'DRAFT', toStatus: 'PENDING_APPROVAL', operatorId: eventOp.id, note: '提交审批' },
          { fromStatus: 'PENDING_APPROVAL', toStatus: 'APPROVED', operatorId: manager.id, note: '紧急审批通过' },
          { fromStatus: 'APPROVED', toStatus: 'ASSIGNED', operatorId: manager.id, note: '指派给赵技师' },
          { fromStatus: 'ASSIGNED', toStatus: 'IN_PROGRESS', operatorId: tech.id, note: '开始维修' },
          { fromStatus: 'IN_PROGRESS', toStatus: 'COMPLETED', operatorId: tech.id, note: '维修完成' }
        ]
      }
    }
  });

  const repair3 = await prisma.repairOrder.create({
    data: {
      machineId: machines[4].id,
      creatorId: admin.id,
      title: 'PC-005 键盘按键失灵',
      description: 'WASD 部分按键反应不灵敏，顾客经常投诉',
      priority: 'MEDIUM',
      status: 'REVIEWED',
      assignedToId: tech.id,
      assignedAt: new Date(Date.now() - 86400000),
      repairedAt: new Date(Date.now() - 43200000),
      repairNote: '更换机械键盘轴体 4 个，测试正常',
      partsUsed: JSON.stringify([{ name: 'Cherry MX 红轴', quantity: 4, cost: 20 }]),
      laborHours: 1,
      reviewedById: manager.id,
      reviewedAt: new Date(),
      reviewNote: '维修合格，费用确认',
      statusHistory: {
        create: [
          { toStatus: 'DRAFT', operatorId: admin.id, note: '创建工单' },
          { fromStatus: 'DRAFT', toStatus: 'PENDING_APPROVAL', operatorId: admin.id, note: '提交审批' },
          { fromStatus: 'PENDING_APPROVAL', toStatus: 'APPROVED', operatorId: manager.id, note: '审批通过' },
          { fromStatus: 'APPROVED', toStatus: 'ASSIGNED', operatorId: manager.id, note: '指派给赵技师' },
          { fromStatus: 'ASSIGNED', toStatus: 'IN_PROGRESS', operatorId: tech.id, note: '开始维修' },
          { fromStatus: 'IN_PROGRESS', toStatus: 'COMPLETED', operatorId: tech.id, note: '维修完成' },
          { fromStatus: 'COMPLETED', toStatus: 'REVIEWED', operatorId: manager.id, note: '复核通过' }
        ]
      }
    }
  });

  console.log('✅ 创建维修工单 3 条');

  await prisma.notification.createMany({
    data: [
      {
        userId: admin.id,
        type: 'INSPECTION_RETURNED',
        title: '巡检记录被退回',
        content: 'PC-004 的巡检记录被王店长退回，请补充完整信息',
        relatedId: inspection2.id
      },
      {
        userId: tech.id,
        type: 'REPAIR_ASSIGNED',
        title: '新的维修任务',
        content: 'PC-003 显示器闪屏+网络故障，优先级：高',
        relatedId: repair1.id
      },
      {
        userId: manager.id,
        type: 'REPAIR_COMPLETED',
        title: '维修完成待复核',
        content: 'PC-002 耳机故障已维修完成，请复核',
        relatedId: repair2.id
      }
    ]
  });

  console.log('✅ 创建通知 3 条');
  console.log('\n🎉 数据播种完成！');
  console.log('\n登录账号：');
  console.log('  网管: admin / 123456');
  console.log('  赛事运营: event / 123456');
  console.log('  店长: manager / 123456');
  console.log('  技师: tech / 123456');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
