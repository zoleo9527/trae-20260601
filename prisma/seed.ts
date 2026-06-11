import { PrismaClient } from '@prisma/client';
import { Role, ReportStatus, MaterialType, LogAction } from '../src/lib/types';

const prisma = new PrismaClient();

async function main() {
  await prisma.activityLog.deleteMany();
  await prisma.material.deleteMany();
  await prisma.salesReport.deleteMany();
  await prisma.user.deleteMany();
  await prisma.brand.deleteMany();

  const leasingManager = await prisma.user.create({
    data: { name: '张伟', role: Role.LEASING_MANAGER },
  });

  const supervisor = await prisma.user.create({
    data: { name: '李芳', role: Role.OPERATION_SUPERVISOR },
  });

  const brand1 = await prisma.brand.create({
    data: { name: '耐克', code: 'NIKE001', storeName: '耐克奥特莱斯店' },
  });

  const brand2 = await prisma.brand.create({
    data: { name: '阿迪达斯', code: 'ADIDAS001', storeName: '阿迪达斯奥特莱斯店' },
  });

  const brand3 = await prisma.brand.create({
    data: { name: '李宁', code: 'LI-NING001', storeName: '李宁奥特莱斯店' },
  });

  const brandManager1 = await prisma.user.create({
    data: { name: '王店长', role: Role.BRAND_MANAGER, brandId: brand1.id },
  });

  const brandManager2 = await prisma.user.create({
    data: { name: '赵店长', role: Role.BRAND_MANAGER, brandId: brand2.id },
  });

  const brandManager3 = await prisma.user.create({
    data: { name: '陈店长', role: Role.BRAND_MANAGER, brandId: brand3.id },
  });

  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const daysLater = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  async function createReport(data: any, materials: any[], logs: any[]) {
    const report = await prisma.salesReport.create({ data });
    if (materials.length > 0) {
      await prisma.material.createMany({
        data: materials.map((m) => ({ ...m, salesReportId: report.id })),
      });
    }
    if (logs.length > 0) {
      await prisma.activityLog.createMany({
        data: logs.map((l) => ({ ...l, salesReportId: report.id })),
      });
    }
    return report;
  }

  await createReport(
    {
      reportNo: 'SR202605001',
      brandId: brand1.id,
      reportMonth: '2026-05',
      salesAmount: 286500,
      rentDeduction: 57300,
      netSettlement: 229200,
      status: ReportStatus.SETTLED,
      submitterId: brandManager1.id,
      submittedAt: daysAgo(15),
      materialsCheckerId: supervisor.id,
      materialsCheckedAt: daysAgo(12),
      reviewerId: leasingManager.id,
      reviewedAt: daysAgo(8),
      settlerId: leasingManager.id,
      settledAt: daysAgo(5),
      settlementAmount: 229200,
      settlementDate: daysAgo(5),
      paymentMethod: '银行转账',
      remark: '5月销售正常结算',
    },
    [
      { name: '销售小票汇总', type: MaterialType.SALES_SLIP, received: true, receivedAt: daysAgo(12) },
      { name: '结算对账单', type: MaterialType.SETTLEMENT_STATEMENT, received: true, receivedAt: daysAgo(12) },
      { name: '增值税发票', type: MaterialType.INVOICE, received: true, receivedAt: daysAgo(10) },
    ],
    [
      { action: LogAction.SUBMIT, operatorId: brandManager1.id, operatorName: '王店长', remark: '提交5月销售上报', oldStatus: ReportStatus.DRAFT, newStatus: ReportStatus.SUBMITTED, createdAt: daysAgo(15) },
      { action: LogAction.RECEIVE_MATERIALS, operatorId: supervisor.id, operatorName: '李芳', remark: '材料收齐，进入复核', oldStatus: ReportStatus.SUBMITTED, newStatus: ReportStatus.MATERIALS_COMPLETE, createdAt: daysAgo(12) },
      { action: LogAction.REVIEW_PASS, operatorId: leasingManager.id, operatorName: '张伟', remark: '复核通过', oldStatus: ReportStatus.MATERIALS_COMPLETE, newStatus: ReportStatus.REVIEW_PASSED, createdAt: daysAgo(8) },
      { action: LogAction.SETTLE, operatorId: leasingManager.id, operatorName: '张伟', remark: '费用已结算，金额229,200元', oldStatus: ReportStatus.REVIEW_PASSED, newStatus: ReportStatus.SETTLED, createdAt: daysAgo(5) },
    ]
  );

  await createReport(
    {
      reportNo: 'SR202605002',
      brandId: brand2.id,
      reportMonth: '2026-05',
      salesAmount: 198000,
      rentDeduction: 39600,
      netSettlement: 158400,
      status: ReportStatus.MATERIALS_MISSING,
      submitterId: brandManager2.id,
      submittedAt: daysAgo(10),
      materialsCheckerId: supervisor.id,
      materialsCheckedAt: daysAgo(7),
      missingMaterials: '缺少销售小票原件和增值税发票',
      deadline: daysLater(3),
      remark: '材料不全，需补充',
    },
    [
      { name: '销售小票汇总', type: MaterialType.SALES_SLIP, received: false, remark: '仅提供了电子版，需补原件' },
      { name: '结算对账单', type: MaterialType.SETTLEMENT_STATEMENT, received: true, receivedAt: daysAgo(7) },
      { name: '增值税发票', type: MaterialType.INVOICE, received: false, remark: '未提供' },
    ],
    [
      { action: LogAction.SUBMIT, operatorId: brandManager2.id, operatorName: '赵店长', remark: '提交5月销售上报', oldStatus: ReportStatus.DRAFT, newStatus: ReportStatus.SUBMITTED, createdAt: daysAgo(10) },
      { action: LogAction.MARK_MISSING, operatorId: supervisor.id, operatorName: '李芳', remark: '材料缺失：缺少销售小票原件和增值税发票', oldStatus: ReportStatus.SUBMITTED, newStatus: ReportStatus.MATERIALS_MISSING, createdAt: daysAgo(7) },
    ]
  );

  await createReport(
    {
      reportNo: 'SR202605003',
      brandId: brand3.id,
      reportMonth: '2026-05',
      salesAmount: 145000,
      rentDeduction: 29000,
      netSettlement: 116000,
      status: ReportStatus.OVERDUE,
      isOverdue: true,
      submitterId: brandManager3.id,
      submittedAt: daysAgo(20),
      materialsCheckerId: supervisor.id,
      materialsCheckedAt: daysAgo(18),
      deadline: daysAgo(5),
      missingMaterials: '补充材料超期未提交',
      remark: '超时未补材料',
    },
    [
      { name: '销售小票汇总', type: MaterialType.SALES_SLIP, received: true, receivedAt: daysAgo(18) },
      { name: '结算对账单', type: MaterialType.SETTLEMENT_STATEMENT, received: false, remark: '需补充后才能进入复核' },
      { name: '增值税发票', type: MaterialType.INVOICE, received: false },
    ],
    [
      { action: LogAction.SUBMIT, operatorId: brandManager3.id, operatorName: '陈店长', remark: '提交5月销售上报', oldStatus: ReportStatus.DRAFT, newStatus: ReportStatus.SUBMITTED, createdAt: daysAgo(20) },
      { action: LogAction.MARK_MISSING, operatorId: supervisor.id, operatorName: '李芳', remark: '材料缺失，要求3日内补充对账单和发票', oldStatus: ReportStatus.SUBMITTED, newStatus: ReportStatus.MATERIALS_MISSING, createdAt: daysAgo(18) },
      { action: LogAction.MARK_OVERDUE, operatorId: null, operatorName: '系统', remark: '补充材料超期未提交，自动标记为超时', oldStatus: ReportStatus.MATERIALS_MISSING, newStatus: ReportStatus.OVERDUE, createdAt: daysAgo(5) },
    ]
  );

  await createReport(
    {
      reportNo: 'SR202605004',
      brandId: brand1.id,
      reportMonth: '2026-04',
      salesAmount: 320000,
      rentDeduction: 64000,
      netSettlement: 256000,
      status: ReportStatus.REVIEW_REJECTED,
      submitterId: brandManager1.id,
      submittedAt: daysAgo(25),
      materialsCheckerId: supervisor.id,
      materialsCheckedAt: daysAgo(22),
      reviewerId: leasingManager.id,
      reviewedAt: daysAgo(18),
      rejectReason: '销售数据与系统记录不符，差额约15,000元，需品牌方核实后重新提交',
      remark: '复核不通过',
    },
    [
      { name: '销售小票汇总', type: MaterialType.SALES_SLIP, received: true, receivedAt: daysAgo(22) },
      { name: '结算对账单', type: MaterialType.SETTLEMENT_STATEMENT, received: true, receivedAt: daysAgo(22) },
      { name: '增值税发票', type: MaterialType.INVOICE, received: true, receivedAt: daysAgo(21) },
    ],
    [
      { action: LogAction.SUBMIT, operatorId: brandManager1.id, operatorName: '王店长', remark: '提交4月销售上报', oldStatus: ReportStatus.DRAFT, newStatus: ReportStatus.SUBMITTED, createdAt: daysAgo(25) },
      { action: LogAction.RECEIVE_MATERIALS, operatorId: supervisor.id, operatorName: '李芳', remark: '材料收齐', oldStatus: ReportStatus.SUBMITTED, newStatus: ReportStatus.MATERIALS_COMPLETE, createdAt: daysAgo(22) },
      { action: LogAction.REVIEW_REJECT, operatorId: leasingManager.id, operatorName: '张伟', remark: '销售数据与系统记录不符，差额约15,000元，需品牌方核实后重新提交', oldStatus: ReportStatus.MATERIALS_COMPLETE, newStatus: ReportStatus.REVIEW_REJECTED, createdAt: daysAgo(18) },
    ]
  );

  await createReport(
    {
      reportNo: 'SR202606001',
      brandId: brand2.id,
      reportMonth: '2026-06',
      salesAmount: 86500,
      rentDeduction: 17300,
      netSettlement: 69200,
      status: ReportStatus.SUBMITTED,
      submitterId: brandManager2.id,
      submittedAt: daysAgo(2),
      deadline: daysLater(5),
      remark: '6月上旬销售',
    },
    [
      { name: '销售小票汇总', type: MaterialType.SALES_SLIP, received: false },
      { name: '结算对账单', type: MaterialType.SETTLEMENT_STATEMENT, received: false },
    ],
    [
      { action: LogAction.SUBMIT, operatorId: brandManager2.id, operatorName: '赵店长', remark: '提交6月上旬销售上报', oldStatus: ReportStatus.DRAFT, newStatus: ReportStatus.SUBMITTED, createdAt: daysAgo(2) },
    ]
  );

  await createReport(
    {
      reportNo: 'SR202606002',
      brandId: brand3.id,
      reportMonth: '2026-06',
      salesAmount: 72000,
      rentDeduction: 14400,
      netSettlement: 57600,
      status: ReportStatus.MATERIALS_COMPLETE,
      submitterId: brandManager3.id,
      submittedAt: daysAgo(5),
      materialsCheckerId: supervisor.id,
      materialsCheckedAt: daysAgo(3),
      remark: '材料收齐待复核',
    },
    [
      { name: '销售小票汇总', type: MaterialType.SALES_SLIP, received: true, receivedAt: daysAgo(3) },
      { name: '结算对账单', type: MaterialType.SETTLEMENT_STATEMENT, received: true, receivedAt: daysAgo(3) },
      { name: '增值税发票', type: MaterialType.INVOICE, received: true, receivedAt: daysAgo(3) },
    ],
    [
      { action: LogAction.SUBMIT, operatorId: brandManager3.id, operatorName: '陈店长', remark: '提交6月销售上报', oldStatus: ReportStatus.DRAFT, newStatus: ReportStatus.SUBMITTED, createdAt: daysAgo(5) },
      { action: LogAction.RECEIVE_MATERIALS, operatorId: supervisor.id, operatorName: '李芳', remark: '材料收齐，提交复核', oldStatus: ReportStatus.SUBMITTED, newStatus: ReportStatus.MATERIALS_COMPLETE, createdAt: daysAgo(3) },
    ]
  );

  await createReport(
    {
      reportNo: 'SR202606003',
      brandId: brand1.id,
      reportMonth: '2026-06',
      salesAmount: 125000,
      rentDeduction: 25000,
      netSettlement: 100000,
      status: ReportStatus.REVIEW_PASSED,
      submitterId: brandManager1.id,
      submittedAt: daysAgo(8),
      materialsCheckerId: supervisor.id,
      materialsCheckedAt: daysAgo(6),
      reviewerId: leasingManager.id,
      reviewedAt: daysAgo(2),
      remark: '复核通过，待结算',
    },
    [
      { name: '销售小票汇总', type: MaterialType.SALES_SLIP, received: true, receivedAt: daysAgo(6) },
      { name: '结算对账单', type: MaterialType.SETTLEMENT_STATEMENT, received: true, receivedAt: daysAgo(6) },
      { name: '增值税发票', type: MaterialType.INVOICE, received: true, receivedAt: daysAgo(5) },
    ],
    [
      { action: LogAction.SUBMIT, operatorId: brandManager1.id, operatorName: '王店长', remark: '提交6月销售上报', oldStatus: ReportStatus.DRAFT, newStatus: ReportStatus.SUBMITTED, createdAt: daysAgo(8) },
      { action: LogAction.RECEIVE_MATERIALS, operatorId: supervisor.id, operatorName: '李芳', remark: '材料收齐', oldStatus: ReportStatus.SUBMITTED, newStatus: ReportStatus.MATERIALS_COMPLETE, createdAt: daysAgo(6) },
      { action: LogAction.REVIEW_PASS, operatorId: leasingManager.id, operatorName: '张伟', remark: '复核通过，待结算', oldStatus: ReportStatus.MATERIALS_COMPLETE, newStatus: ReportStatus.REVIEW_PASSED, createdAt: daysAgo(2) },
    ]
  );

  console.log('✅ Seed data created successfully!');
  console.log('');
  console.log('👤 Users:');
  console.log('  - 张伟 (招商经理)');
  console.log('  - 李芳 (营运督导)');
  console.log('  - 王店长 (耐克品牌店长)');
  console.log('  - 赵店长 (阿迪达斯品牌店长)');
  console.log('  - 陈店长 (李宁品牌店长)');
  console.log('');
  console.log('📋 Reports (7 total):');
  console.log('  - SR202605001: 已结算 (正常)');
  console.log('  - SR202605002: 材料缺失 ⚠️ 异常');
  console.log('  - SR202605003: 超时 ⚠️ 异常');
  console.log('  - SR202605004: 复核不通过 ⚠️ 异常');
  console.log('  - SR202606001: 已提交 (待收材料)');
  console.log('  - SR202606002: 材料收齐 (待复核)');
  console.log('  - SR202606003: 复核通过 (待结算)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
