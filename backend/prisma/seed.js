const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.user.createMany({
    data: [
      { id: 1, name: '张配方', role: 'formulation_engineer', phone: '13800000001' },
      { id: 2, name: '王班长', role: 'production_leader', phone: '13800000002' },
      { id: 3, name: '李质检', role: 'quality_inspector', phone: '13800000003' },
      { id: 4, name: '赵配方', role: 'formulation_engineer', phone: '13800000004' },
      { id: 5, name: '陈班长', role: 'production_leader', phone: '13800000005' },
    ],
  });

  await prisma.formula.createMany({
    data: [
      {
        id: 1, code: 'FP-2026-001', name: '肉鸡中期料', version: 1,
        species: '肉鸡', stage: '中期',
        ingredients: JSON.stringify([
          { name: '玉米', weight: 600 },
          { name: '豆粕', weight: 250 },
          { name: '鱼粉', weight: 50 },
          { name: '预混料', weight: 50 },
          { name: '豆油', weight: 50 },
        ]),
        status: 'approved', submitterId: 1, reviewerId: 4,
        reviewComment: '配比合理，批准投产', reviewedAt: new Date('2026-05-20'),
      },
      {
        id: 2, code: 'FP-2026-002', name: '蛋鸡产蛋期料', version: 2,
        species: '蛋鸡', stage: '产蛋期',
        ingredients: JSON.stringify([
          { name: '玉米', weight: 620 },
          { name: '豆粕', weight: 200 },
          { name: '石粉', weight: 80 },
          { name: '预混料', weight: 50 },
          { name: '豆油', weight: 50 },
        ]),
        status: 'pending_review', submitterId: 1,
      },
      {
        id: 3, code: 'FP-2026-003', name: '乳猪教槽料', version: 1,
        species: '猪', stage: '教槽期',
        ingredients: JSON.stringify([
          { name: '玉米', weight: 500 },
          { name: '豆粕', weight: 200 },
          { name: '乳清粉', weight: 100 },
          { name: '鱼粉', weight: 80 },
          { name: '预混料', weight: 70 },
          { name: '葡萄糖', weight: 50 },
        ]),
        status: 'draft', submitterId: 4,
      },
      {
        id: 4, code: 'FP-2026-004', name: '肉鸡前期料', version: 1,
        species: '肉鸡', stage: '前期',
        ingredients: JSON.stringify([
          { name: '玉米', weight: 550 },
          { name: '豆粕', weight: 300 },
          { name: '鱼粉', weight: 70 },
          { name: '预混料', weight: 50 },
          { name: '豆油', weight: 30 },
        ]),
        status: 'rejected', submitterId: 1, reviewerId: 4,
        reviewComment: '鱼粉比例偏高，成本过高，请调整后重新提交', reviewedAt: new Date('2026-05-22'),
      },
      {
        id: 5, code: 'FP-2026-001', name: '肉鸡中期料', version: 2,
        species: '肉鸡', stage: '中期',
        ingredients: JSON.stringify([
          { name: '玉米', weight: 600 },
          { name: '豆粕', weight: 255 },
          { name: '鱼粉', weight: 45 },
          { name: '预混料', weight: 50 },
          { name: '豆油', weight: 50 },
        ]),
        status: 'approved', submitterId: 1, reviewerId: 4,
        reviewComment: '鱼粉微调后配比更优，批准', reviewedAt: new Date('2026-06-01'),
      },
    ],
  });

  await prisma.batchingPlan.createMany({
    data: [
      {
        id: 1, code: 'TL-2026-001', formulaId: 1,
        plannedQty: 5000, actualQty: 4980,
        status: 'completed', shift: '白班',
        plannedAt: new Date('2026-05-21T08:00:00'),
        startedAt: new Date('2026-05-21T08:30:00'),
        completedAt: new Date('2026-05-21T12:00:00'),
        creatorId: 2,
      },
      {
        id: 2, code: 'TL-2026-002', formulaId: 1,
        plannedQty: 3000,
        status: 'in_progress', shift: '夜班',
        plannedAt: new Date('2026-06-10T20:00:00'),
        startedAt: new Date('2026-06-10T20:30:00'),
        creatorId: 5,
      },
      {
        id: 3, code: 'TL-2026-003', formulaId: 1,
        plannedQty: 8000,
        status: 'pending', shift: '白班',
        plannedAt: new Date('2026-06-11T08:00:00'),
        creatorId: 2,
      },
    ],
  });

  await prisma.batchingRecord.createMany({
    data: [
      {
        id: 1, planId: 1, materialName: '玉米', plannedWeight: 600, actualWeight: 600,
        deviation: 0, deviationRate: 0, operator: '操作员甲', recordedAt: new Date('2026-05-21T08:45:00'),
      },
      {
        id: 2, planId: 1, materialName: '豆粕', plannedWeight: 250, actualWeight: 248,
        deviation: -2, deviationRate: -0.8, operator: '操作员甲', recordedAt: new Date('2026-05-21T09:10:00'),
      },
      {
        id: 3, planId: 1, materialName: '鱼粉', plannedWeight: 50, actualWeight: 45,
        deviation: -5, deviationRate: -10.0, operator: '操作员乙', recordedAt: new Date('2026-05-21T09:30:00'),
      },
      {
        id: 4, planId: 1, materialName: '预混料', plannedWeight: 50, actualWeight: 50,
        deviation: 0, deviationRate: 0, operator: '操作员乙', recordedAt: new Date('2026-05-21T09:50:00'),
      },
      {
        id: 5, planId: 1, materialName: '豆油', plannedWeight: 50, actualWeight: 52,
        deviation: 2, deviationRate: 4.0, operator: '操作员甲', recordedAt: new Date('2026-05-21T10:10:00'),
      },
      {
        id: 6, planId: 2, materialName: '玉米', plannedWeight: 600, actualWeight: 598,
        deviation: -2, deviationRate: -0.33, operator: '操作员丙', recordedAt: new Date('2026-06-10T20:50:00'),
      },
      {
        id: 7, planId: 2, materialName: '豆粕', plannedWeight: 250, actualWeight: 250,
        deviation: 0, deviationRate: 0, operator: '操作员丙', recordedAt: new Date('2026-06-10T21:15:00'),
      },
    ],
  });

  await prisma.inspectionRecord.createMany({
    data: [
      {
        id: 1, planId: 1, inspectorId: 3,
        batchLabelOk: true, deviationOk: false,
        remarks: '鱼粉偏差-10%，超出±5%允许范围，需关注',
        inspectedAt: new Date('2026-05-21T11:00:00'),
      },
      {
        id: 2, planId: 2, inspectorId: 3,
        batchLabelOk: false, deviationOk: true,
        remarks: '批次标签编码与计划不一致，已通知生产班长更正',
        inspectedAt: new Date('2026-06-10T22:00:00'),
      },
    ],
  });

  await prisma.complaint.createMany({
    data: [
      {
        id: 1, code: 'TS-2026-001',
        farmerName: '刘大户', farmerPhone: '13900000001',
        batchCode: 'TL-2026-001',
        category: '增重慢',
        description: '使用批次TL-2026-001饲料喂养肉鸡2周，增重明显低于同期其他批次，怀疑鱼粉含量不足',
        status: 'handling', handlerId: 3,
        handleResult: '已核实鱼粉偏差-10%，配方师正在评估影响',
        handledAt: new Date('2026-06-01'),
      },
      {
        id: 2, code: 'TS-2026-002',
        farmerName: '孙养殖', farmerPhone: '13900000002',
        batchCode: 'TL-2026-001',
        category: '标签错误',
        description: '收到的饲料包装标签生产日期与实际不符',
        status: 'open',
      },
      {
        id: 3, code: 'TS-2026-003',
        farmerName: '周鸡场', farmerPhone: '13900000003',
        batchCode: null,
        category: '增重慢',
        description: '近期多批次肉鸡增重不理想，请求技术支持',
        status: 'open',
      },
    ],
  });

  console.log('Seed data inserted successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
