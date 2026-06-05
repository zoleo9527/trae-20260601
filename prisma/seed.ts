import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const USER_IDS = {
  FLORIST: '00000000-0000-0000-0000-000000000001',
  DISPATCHER: '00000000-0000-0000-0000-000000000002',
  AFTERCARE: '00000000-0000-0000-0000-000000000003',
};

const now = new Date();
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000);

async function main() {
  await prisma.user.upsert({
    where: { id: USER_IDS.FLORIST },
    update: {},
    create: {
      id: USER_IDS.FLORIST,
      name: '花艺师-小林',
      role: 'FLORIST',
    },
  });

  await prisma.user.upsert({
    where: { id: USER_IDS.DISPATCHER },
    update: {},
    create: {
      id: USER_IDS.DISPATCHER,
      name: '配送调度-老周',
      role: 'DISPATCHER',
    },
  });

  await prisma.user.upsert({
    where: { id: USER_IDS.AFTERCARE },
    update: {},
    create: {
      id: USER_IDS.AFTERCARE,
      name: '售后客服-小张',
      role: 'AFTERCARE',
    },
  });

  console.log('Created 3 users');

  const procurementsData = [
    {
      flowerName: '红玫瑰',
      quantity: 100,
      unit: '扎',
      supplier: '昆明斗南花市-张记',
      urgency: 'CRITICAL',
      status: 'PENDING',
      remarks: '红玫瑰-厄瓜多尔进口，花苞需直径4cm以上',
      createdById: USER_IDS.FLORIST,
      createdAt: hoursAgo(2),
    },
    {
      flowerName: '白色百合',
      quantity: 50,
      unit: '扎',
      supplier: '云南花卉集散中心',
      urgency: 'URGENT',
      status: 'PENDING',
      remarks: '白色百合-注意保鲜期，周末配送需加冰袋',
      createdById: USER_IDS.FLORIST,
      createdAt: hoursAgo(5),
    },
    {
      flowerName: '粉色康乃馨',
      quantity: 200,
      unit: '扎',
      supplier: '广州岭南花市',
      urgency: 'NORMAL',
      status: 'PENDING',
      remarks: '粉色康乃馨-母亲节备货，需5月8日前到货',
      createdById: USER_IDS.FLORIST,
      createdAt: hoursAgo(8),
    },
    {
      flowerName: '向日葵',
      quantity: 80,
      unit: '扎',
      supplier: '昆明斗南花市-张记',
      urgency: 'URGENT',
      status: 'IN_PROGRESS',
      remarks: '向日葵-花盘直径需15cm以上，茎秆粗壮',
      createdById: USER_IDS.FLORIST,
      createdAt: daysAgo(1),
    },
    {
      flowerName: '满天星',
      quantity: 60,
      unit: '扎',
      supplier: '云南花卉集散中心',
      urgency: 'CRITICAL',
      status: 'IN_PROGRESS',
      remarks: '满天星-白色，花朵饱满无黄叶',
      createdById: USER_IDS.FLORIST,
      createdAt: daysAgo(1),
    },
    {
      flowerName: '郁金香',
      quantity: 120,
      unit: '扎',
      supplier: '广州岭南花市',
      urgency: 'NORMAL',
      status: 'IN_PROGRESS',
      remarks: '郁金香-多色混装，花苞紧闭未开放',
      createdById: USER_IDS.FLORIST,
      createdAt: daysAgo(2),
    },
    {
      flowerName: '洋桔梗',
      quantity: 70,
      unit: '扎',
      supplier: '昆明斗南花市-张记',
      urgency: 'NORMAL',
      status: 'REJECTED',
      remarks: '洋桔梗-紫色，花朵新鲜无损伤',
      createdById: USER_IDS.FLORIST,
      createdAt: daysAgo(3),
    },
    {
      flowerName: '非洲菊',
      quantity: 90,
      unit: '扎',
      supplier: '云南花卉集散中心',
      urgency: 'NORMAL',
      status: 'REJECTED',
      remarks: '非洲菊-橙色，花茎直立无弯曲',
      createdById: USER_IDS.FLORIST,
      createdAt: daysAgo(4),
    },
    {
      flowerName: '绣球花',
      quantity: 40,
      unit: '扎',
      supplier: '广州岭南花市',
      urgency: 'NORMAL',
      status: 'CLOSED',
      remarks: '绣球花-蓝色，花朵饱满色泽均匀',
      createdById: USER_IDS.FLORIST,
      createdAt: daysAgo(5),
    },
    {
      flowerName: '芍药',
      quantity: 55,
      unit: '扎',
      supplier: '昆明斗南花市-张记',
      urgency: 'NORMAL',
      status: 'CLOSED',
      remarks: '芍药-粉色重瓣，花朵大而饱满',
      createdById: USER_IDS.FLORIST,
      createdAt: daysAgo(6),
    },
    {
      flowerName: '雏菊',
      quantity: 150,
      unit: '扎',
      supplier: '云南花卉集散中心',
      urgency: 'NORMAL',
      status: 'NEEDS_REVIEW',
      remarks: '雏菊-多色混装，用于桌花布置',
      createdById: USER_IDS.FLORIST,
      createdAt: daysAgo(2),
    },
    {
      flowerName: '马蹄莲',
      quantity: 65,
      unit: '扎',
      supplier: '广州岭南花市',
      urgency: 'NORMAL',
      status: 'NEEDS_REVIEW',
      remarks: '马蹄莲-白色，花型优美用于婚礼',
      createdById: USER_IDS.FLORIST,
      createdAt: daysAgo(3),
    },
  ];

  const createdProcurements = [];
  for (const data of procurementsData) {
    const procurement = await prisma.procurement.create({ data });
    createdProcurements.push(procurement);
  }

  console.log(`Created ${createdProcurements.length} procurements`);

  const pendingProcurements = createdProcurements.filter(p => p.status === 'PENDING');
  for (const p of pendingProcurements) {
    await prisma.statusChange.create({
      data: {
        procurementId: p.id,
        fromStatus: 'PENDING',
        toStatus: 'PENDING',
        changedById: USER_IDS.FLORIST,
        changedAt: p.createdAt,
        reason: '创建采购单',
      },
    });
  }

  const inProgressProcurements = createdProcurements.filter(p => p.status === 'IN_PROGRESS');
  for (const p of inProgressProcurements) {
    await prisma.statusChange.create({
      data: {
        procurementId: p.id,
        fromStatus: 'PENDING',
        toStatus: 'IN_PROGRESS',
        changedById: USER_IDS.DISPATCHER,
        changedAt: hoursAgo(1),
        reason: '提交审核，等待分级',
      },
    });
  }

  const rejectedProcurements = createdProcurements.filter(p => p.status === 'REJECTED');
  const rejectionReasons = [
    '部分花朵有压损，新鲜度不足',
    '花茎弯曲较多，不符合品质要求',
  ];
  for (let i = 0; i < rejectedProcurements.length; i++) {
    const p = rejectedProcurements[i];
    await prisma.statusChange.createMany({
      data: [
        {
          procurementId: p.id,
          fromStatus: 'PENDING',
          toStatus: 'IN_PROGRESS',
          changedById: USER_IDS.DISPATCHER,
          changedAt: daysAgo(2),
          reason: '提交审核',
        },
        {
          procurementId: p.id,
          fromStatus: 'IN_PROGRESS',
          toStatus: 'REJECTED',
          changedById: USER_IDS.AFTERCARE,
          changedAt: daysAgo(1),
          reason: rejectionReasons[i],
        },
      ],
    });

    await prisma.grading.create({
      data: {
        procurementId: p.id,
        level: 'SCRAP',
        gradedById: USER_IDS.AFTERCARE,
        gradedAt: daysAgo(1),
        anomalyNote: rejectionReasons[i],
        remarks: '品质不合格，做报废处理并退回',
      },
    });
  }

  const closedProcurements = createdProcurements.filter(p => p.status === 'CLOSED');
  const gradingLevels = ['A', 'B'];
  const gradingRemarks = [
    '品质优良，花朵饱满色泽鲜艳',
    '整体良好，少量花朵偏小',
  ];
  for (let i = 0; i < closedProcurements.length; i++) {
    const p = closedProcurements[i];
    await prisma.statusChange.createMany({
      data: [
        {
          procurementId: p.id,
          fromStatus: 'PENDING',
          toStatus: 'IN_PROGRESS',
          changedById: USER_IDS.DISPATCHER,
          changedAt: daysAgo(4),
          reason: '提交审核',
        },
        {
          procurementId: p.id,
          fromStatus: 'IN_PROGRESS',
          toStatus: 'CLOSED',
          changedById: USER_IDS.AFTERCARE,
          changedAt: daysAgo(3),
          reason: '分级完成，采购关闭',
        },
      ],
    });

    await prisma.grading.create({
      data: {
        procurementId: p.id,
        level: gradingLevels[i],
        gradedById: USER_IDS.AFTERCARE,
        gradedAt: daysAgo(3),
        remarks: gradingRemarks[i],
      },
    });
  }

  const needsReviewProcurements = createdProcurements.filter(p => p.status === 'NEEDS_REVIEW');
  const reviewReasons = [
    '客户反馈部分花材不新鲜，需回查',
    '数量核对有差异，需重新清点',
  ];
  for (let i = 0; i < needsReviewProcurements.length; i++) {
    const p = needsReviewProcurements[i];
    await prisma.statusChange.createMany({
      data: [
        {
          procurementId: p.id,
          fromStatus: 'PENDING',
          toStatus: 'IN_PROGRESS',
          changedById: USER_IDS.DISPATCHER,
          changedAt: daysAgo(1),
          reason: '提交审核',
        },
        {
          procurementId: p.id,
          fromStatus: 'IN_PROGRESS',
          toStatus: 'NEEDS_REVIEW',
          changedById: USER_IDS.AFTERCARE,
          changedAt: hoursAgo(6),
          reason: reviewReasons[i],
        },
      ],
    });
  }

  const statusChangeCount = await prisma.statusChange.count();
  const gradingCount = await prisma.grading.count();

  console.log('Seed completed!');
  console.log(`Users: 3`);
  console.log(`Procurements: ${createdProcurements.length}`);
  console.log(`Gradings: ${gradingCount}`);
  console.log(`StatusChanges: ${statusChangeCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
