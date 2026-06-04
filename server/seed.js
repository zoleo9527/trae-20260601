import { PrismaClient } from '@prisma/client';

const Role = {
  BREW_MASTER: 'BREW_MASTER',
  PACKAGING_SUPERVISOR: 'PACKAGING_SUPERVISOR',
  SALES_BACKOFFICE: 'SALES_BACKOFFICE'
};

const FillingStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  IN_PRODUCTION: 'IN_PRODUCTION',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED'
};

const PackagingStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  ISSUED: 'ISSUED',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED'
};

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  await prisma.notification.deleteMany();
  await prisma.packagingRequisitionHistory.deleteMany();
  await prisma.fillingScheduleHistory.deleteMany();
  await prisma.packagingRequisition.deleteMany();
  await prisma.fillingSchedule.deleteMany();
  await prisma.user.deleteMany();

  const brewMaster = await prisma.user.create({
    data: { name: '张大酿酒师', role: Role.BREW_MASTER, avatar: '🍺' }
  });

  const packagingSupervisor = await prisma.user.create({
    data: { name: '李主管', role: Role.PACKAGING_SUPERVISOR, avatar: '📦' }
  });

  const salesBackoffice = await prisma.user.create({
    data: { name: '王内勤', role: Role.SALES_BACKOFFICE, avatar: '💼' }
  });

  console.log('Users created:', { brewMaster: brewMaster.id, packagingSupervisor: packagingSupervisor.id, salesBackoffice: salesBackoffice.id });

  const s1 = await prisma.fillingSchedule.create({
    data: {
      batchNo: 'FILL-2026060001',
      productName: '春日小麦啤',
      beerType: 'WHEAT',
      volume: 2000,
      fillingDate: new Date('2026-06-06'),
      targetBottles: 8000,
      status: FillingStatus.APPROVED,
      currentHandler: Role.BREW_MASTER,
      createdById: brewMaster.id
    }
  });

  await prisma.fillingScheduleHistory.createMany({
    data: [
      { scheduleId: s1.id, action: '创建灌装排产', remark: '销售订单SO-20260601需求：8000瓶春日小麦，6月8日前发货', newStatus: FillingStatus.DRAFT, createdById: brewMaster.id, createdAt: new Date('2026-06-01T09:00:00') },
      { scheduleId: s1.id, action: '提交审核', remark: '发酵罐F-03已成熟，原麦汁浓度12.5°P，酒精度4.5%vol，符合灌装要求', oldStatus: FillingStatus.DRAFT, newStatus: FillingStatus.SUBMITTED, createdById: brewMaster.id, createdAt: new Date('2026-06-01T14:30:00') },
      { scheduleId: s1.id, action: '添加备注', remark: '请确认包装材料库存：330ml透明瓶、金色皇冠盖、春日小麦专用标签', createdById: packagingSupervisor.id, createdAt: new Date('2026-06-01T15:10:00') },
      { scheduleId: s1.id, action: '复核通过', remark: '库存已确认：330ml瓶库存30000，标签库存15000，纸箱库存500。客户标签稿已确认，可以安排。', oldStatus: FillingStatus.SUBMITTED, newStatus: FillingStatus.APPROVED, createdById: salesBackoffice.id, createdAt: new Date('2026-06-02T10:00:00') },
      { scheduleId: s1.id, action: '排产调整', remark: '2号线设备维护，灌装日期从6月5日延后至6月6日', oldStatus: FillingStatus.APPROVED, newStatus: FillingStatus.APPROVED, createdById: brewMaster.id, createdAt: new Date('2026-06-04T08:00:00'), changes: JSON.stringify({ fillingDate: { old: '2026-06-05', new: '2026-06-06' } }) }
    ]
  });

  const s2 = await prisma.fillingSchedule.create({
    data: {
      batchNo: 'FILL-2026060002',
      productName: '经典IPA',
      beerType: 'IPA',
      volume: 3000,
      fillingDate: new Date('2026-06-08'),
      targetBottles: 12000,
      status: FillingStatus.REJECTED,
      currentHandler: Role.BREW_MASTER,
      createdById: brewMaster.id
    }
  });

  await prisma.fillingScheduleHistory.createMany({
    data: [
      { scheduleId: s2.id, action: '创建灌装排产', remark: '经销商补货订单，经典IPA库存预警', newStatus: FillingStatus.DRAFT, createdById: brewMaster.id, createdAt: new Date('2026-06-02T09:00:00') },
      { scheduleId: s2.id, action: '提交审核', remark: '发酵罐F-05和F-06双罐合并，干投酒花72小时后已稳定', oldStatus: FillingStatus.DRAFT, newStatus: FillingStatus.SUBMITTED, createdById: brewMaster.id, createdAt: new Date('2026-06-03T10:00:00') },
      { scheduleId: s2.id, action: '驳回', remark: '目标瓶数12000与3000L酒液不匹配（330ml瓶应为约9000瓶）。请重新核算灌装量。', oldStatus: FillingStatus.SUBMITTED, newStatus: FillingStatus.REJECTED, createdById: salesBackoffice.id, createdAt: new Date('2026-06-03T16:00:00') }
    ]
  });

  const s3 = await prisma.fillingSchedule.create({
    data: {
      batchNo: 'FILL-2026060003',
      productName: '黑夜世涛',
      beerType: 'STOUT',
      volume: 1500,
      fillingDate: new Date('2026-06-10'),
      targetBottles: 3000,
      status: FillingStatus.SUBMITTED,
      currentHandler: Role.SALES_BACKOFFICE,
      createdById: brewMaster.id
    }
  });

  await prisma.fillingScheduleHistory.createMany({
    data: [
      { scheduleId: s3.id, action: '创建灌装排产', remark: '电商平台618活动备货，初始目标6000瓶', newStatus: FillingStatus.DRAFT, createdById: brewMaster.id, createdAt: new Date('2026-06-03T11:00:00') },
      { scheduleId: s3.id, action: '提交审核', remark: '发酵罐F-08世涛已熟成，准备灌装', oldStatus: FillingStatus.DRAFT, newStatus: FillingStatus.SUBMITTED, createdById: brewMaster.id, createdAt: new Date('2026-06-03T12:00:00') },
      { scheduleId: s3.id, action: '添加备注', remark: '瓶型建议用500ml棕色瓶，避光保存世涛风味更好。另1500L约等于3000瓶（500ml），6000瓶需要3000L酒液', createdById: packagingSupervisor.id, createdAt: new Date('2026-06-03T14:00:00') },
      { scheduleId: s3.id, action: '驳回', remark: '目标瓶数6000与1500L酒液不匹配（500ml瓶应为约3000瓶）。请重新核算灌装量并确认瓶型。', oldStatus: FillingStatus.SUBMITTED, newStatus: FillingStatus.REJECTED, createdById: salesBackoffice.id, createdAt: new Date('2026-06-03T16:00:00') },
      { scheduleId: s3.id, action: '补录后重提', remark: '已采纳建议，瓶型改为500ml棕色瓶，目标瓶数调整为3000瓶', oldStatus: FillingStatus.REJECTED, newStatus: FillingStatus.SUBMITTED, createdById: brewMaster.id, createdAt: new Date('2026-06-04T09:00:00'), changes: JSON.stringify({ targetBottles: { old: 6000, new: 3000 } }) }
    ]
  });

  const s4 = await prisma.fillingSchedule.create({
    data: {
      batchNo: 'FILL-2026050001',
      productName: '桂花小麦',
      beerType: 'WHEAT',
      volume: 2500,
      fillingDate: new Date('2026-05-20'),
      targetBottles: 10000,
      status: FillingStatus.COMPLETED,
      currentHandler: Role.SALES_BACKOFFICE,
      createdById: brewMaster.id
    }
  });

  await prisma.fillingScheduleHistory.createMany({
    data: [
      { scheduleId: s4.id, action: '创建灌装排产', remark: '5月常规生产计划', newStatus: FillingStatus.DRAFT, createdById: brewMaster.id, createdAt: new Date('2026-05-15T09:00:00') },
      { scheduleId: s4.id, action: '提交审核', remark: '发酵正常，准备灌装', oldStatus: FillingStatus.DRAFT, newStatus: FillingStatus.SUBMITTED, createdById: brewMaster.id, createdAt: new Date('2026-05-18T10:00:00') },
      { scheduleId: s4.id, action: '复核通过', remark: '包装材料齐全，同意灌装', oldStatus: FillingStatus.SUBMITTED, newStatus: FillingStatus.APPROVED, createdById: salesBackoffice.id, createdAt: new Date('2026-05-18T14:00:00') },
      { scheduleId: s4.id, action: '开始生产', remark: '灌装线2号线，早班8点开始', oldStatus: FillingStatus.APPROVED, newStatus: FillingStatus.IN_PRODUCTION, createdById: brewMaster.id, createdAt: new Date('2026-05-20T08:00:00') },
      { scheduleId: s4.id, action: '添加备注', remark: '上午10点暂停1小时，更换杀菌机滤芯', createdById: brewMaster.id, createdAt: new Date('2026-05-20T10:00:00') },
      { scheduleId: s4.id, action: '灌装完成', remark: '实际产出9850瓶，损耗1.5%，合格', oldStatus: FillingStatus.IN_PRODUCTION, newStatus: FillingStatus.COMPLETED, createdById: brewMaster.id, createdAt: new Date('2026-05-20T18:00:00') }
    ]
  });

  const p1 = await prisma.packagingRequisition.create({
    data: {
      requisitionNo: 'PACK-2026060001',
      scheduleId: s1.id,
      bottleType: '330ml透明瓶',
      bottleCount: 8200,
      labelType: '春日小麦专用',
      cartonType: '12瓶装彩色纸箱',
      requiredDate: new Date('2026-06-05'),
      status: PackagingStatus.APPROVED,
      currentHandler: Role.BREW_MASTER,
      scheduleVersion: 1,
      createdById: packagingSupervisor.id
    }
  });

  await prisma.packagingRequisitionHistory.createMany({
    data: [
      { requisitionId: p1.id, action: '创建包装领用', remark: '按灌装计划8000瓶，备2.5%损耗，共8200瓶', newStatus: PackagingStatus.PENDING, createdById: packagingSupervisor.id, createdAt: new Date('2026-06-02T11:00:00') },
      { requisitionId: p1.id, action: '添加备注', remark: '请确认标签批次：20260415印刷，保质期至20270414', createdById: salesBackoffice.id, createdAt: new Date('2026-06-02T14:00:00') },
      { requisitionId: p1.id, action: '审核通过', remark: '标签批次已确认，在有效期内。同意发放。', oldStatus: PackagingStatus.PENDING, newStatus: PackagingStatus.APPROVED, createdById: salesBackoffice.id, createdAt: new Date('2026-06-02T15:30:00') }
    ]
  });

  const p2 = await prisma.packagingRequisition.create({
    data: {
      requisitionNo: 'PACK-2026060002',
      scheduleId: s4.id,
      bottleType: '330ml棕色瓶',
      bottleCount: 10200,
      labelType: '桂花小麦',
      cartonType: '24瓶装牛皮纸箱',
      requiredDate: new Date('2026-05-20'),
      status: PackagingStatus.COMPLETED,
      currentHandler: Role.SALES_BACKOFFICE,
      scheduleVersion: 1,
      createdById: packagingSupervisor.id
    }
  });

  await prisma.packagingRequisitionHistory.createMany({
    data: [
      { requisitionId: p2.id, action: '创建包装领用', remark: '5月桂花小麦生产计划', newStatus: PackagingStatus.PENDING, createdById: packagingSupervisor.id, createdAt: new Date('2026-05-18T15:00:00') },
      { requisitionId: p2.id, action: '审核通过', remark: '材料齐全', oldStatus: PackagingStatus.PENDING, newStatus: PackagingStatus.APPROVED, createdById: salesBackoffice.id, createdAt: new Date('2026-05-19T09:00:00') },
      { requisitionId: p2.id, action: '物料已发放', remark: '瓶子10200、标签10200、纸箱425个，已从仓库A区发放', oldStatus: PackagingStatus.APPROVED, newStatus: PackagingStatus.ISSUED, createdById: brewMaster.id, createdAt: new Date('2026-05-20T07:30:00') },
      { requisitionId: p2.id, action: '领用完成', remark: '实际使用瓶子10050，剩余150瓶退回仓库。损耗1.5%，正常。', oldStatus: PackagingStatus.ISSUED, newStatus: PackagingStatus.COMPLETED, createdById: packagingSupervisor.id, createdAt: new Date('2026-05-21T09:00:00') }
    ]
  });

  const p3 = await prisma.packagingRequisition.create({
    data: {
      requisitionNo: 'PACK-2026060003',
      scheduleId: s1.id,
      bottleType: '500ml听装',
      bottleCount: 4000,
      labelType: '春日小麦听装',
      cartonType: '24听装托盘',
      requiredDate: new Date('2026-06-06'),
      status: PackagingStatus.REJECTED,
      currentHandler: Role.PACKAGING_SUPERVISOR,
      scheduleVersion: 1,
      createdById: packagingSupervisor.id
    }
  });

  await prisma.packagingRequisitionHistory.createMany({
    data: [
      { requisitionId: p3.id, action: '创建包装领用', remark: '电商平台听装订单', newStatus: PackagingStatus.PENDING, createdById: packagingSupervisor.id, createdAt: new Date('2026-06-03T10:00:00') },
      { requisitionId: p3.id, action: '退回', remark: '听装线6月6日已预约给另一批次。请改到6月7日或改用瓶装。', oldStatus: PackagingStatus.PENDING, newStatus: PackagingStatus.REJECTED, createdById: salesBackoffice.id, createdAt: new Date('2026-06-03T16:00:00') }
    ]
  });

  const scheduleChange = await prisma.fillingScheduleHistory.findFirst({
    where: { scheduleId: s1.id, action: '排产调整' },
    orderBy: { createdAt: 'desc' }
  });

  if (scheduleChange) {
    const changes = JSON.parse(scheduleChange.changes || '{}');
    const changeDesc = Object.entries(changes)
      .map(([key, val]) => `${key}: ${val.old} → ${val.new}`)
      .join('，');

    await prisma.packagingRequisitionHistory.create({
      data: {
        requisition: { connect: { id: p1.id } },
        action: '关联排产变更提醒',
        remark: `⚠️ 关联灌装排产FILL-2026060001有变更：${changeDesc}，${scheduleChange.remark}`,
        scheduleChangeNotified: true,
        changeHandled: false,
        createdBy: { connect: { id: scheduleChange.createdById } },
        createdAt: scheduleChange.createdAt
      }
    });
  }

  const p4 = await prisma.packagingRequisition.create({
    data: {
      requisitionNo: 'PACK-2026060004',
      scheduleId: s1.id,
      bottleType: '330ml透明瓶',
      bottleCount: 4200,
      labelType: '春日小麦专用A',
      cartonType: '12瓶装彩色纸箱',
      requiredDate: new Date('2026-06-07'),
      status: PackagingStatus.APPROVED,
      currentHandler: Role.BREW_MASTER,
      scheduleVersion: 1,
      createdById: packagingSupervisor.id
    }
  });

  await prisma.packagingRequisitionHistory.createMany({
    data: [
      { requisitionId: p4.id, action: '创建包装领用', remark: '补货订单，半批4200瓶', newStatus: PackagingStatus.PENDING, createdById: packagingSupervisor.id, createdAt: new Date('2026-06-03T09:00:00') },
      { requisitionId: p4.id, action: '审核通过', remark: '库存充足，安排发放', oldStatus: PackagingStatus.PENDING, newStatus: PackagingStatus.APPROVED, createdById: salesBackoffice.id, createdAt: new Date('2026-06-03T11:00:00') }
    ]
  });

  const handledChange = await prisma.packagingRequisitionHistory.create({
    data: {
      requisition: { connect: { id: p4.id } },
      action: '关联排产变更提醒',
      remark: `⚠️ 关联灌装排产FILL-2026060001有变更：灌装日期延后1天至6月6日`,
      scheduleChangeNotified: true,
      changeHandled: true,
      changeAffected: false,
      createdBy: { connect: { id: brewMaster.id } },
      createdAt: new Date('2026-06-04T08:10:00')
    }
  });

  await prisma.packagingRequisitionHistory.create({
    data: {
      requisition: { connect: { id: p4.id } },
      action: '变更处置',
      remark: '需求日期为6月7日，排产延后至6月6日不影响领用计划，确认不受影响。',
      changes: JSON.stringify({ affected: false }),
      createdBy: { connect: { id: packagingSupervisor.id } },
      createdAt: new Date('2026-06-04T09:00:00')
    }
  });

  console.log('Seed data created successfully!');
  console.log(`\n=== 验收样例数据 ===`);
  console.log(`1. 灌装排产 FILL-2026060001 [已通过] - 可从详情页点"开始生产"→"完成"，含5条历史备注`);
  console.log(`2. 灌装排产 FILL-2026060002 [已驳回] - 可从详情页修改后"补录后重提"，含3条历史备注（含驳回原因）`);
  console.log(`3. 灌装排产 FILL-2026060003 [待复核] - 已修改过重提，含5条历史备注（含驳回节点+变更记录）`);
  console.log(`4. 灌装排产 FILL-2026050001 [已完成] - 完整流程样例，含6条历史备注`);
  console.log(`5. 包装领用 PACK-2026060001 [已通过] - ⚠️ 变更待处置：关联排产变更未处理，可点击"处置变更"测试`);
  console.log(`6. 包装领用 PACK-2026060004 [已通过] - ✓ 变更已处置：排产变更已确认不受影响`);
  console.log(`7. 包装领用 PACK-2026050001 [已完成] - 完整流程样例，含4条历史备注`);
  console.log(`8. 包装领用 PACK-2026060003 [已退回] - 可修改后"补录后重提"，含退回原因`);
  console.log(`\n用户账号：`);
  console.log(`- 酿酒师: ${brewMaster.name} (ID: ${brewMaster.id})`);
  console.log(`- 包装主管: ${packagingSupervisor.name} (ID: ${packagingSupervisor.id})`);
  console.log(`- 销售内勤: ${salesBackoffice.name} (ID: ${salesBackoffice.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
