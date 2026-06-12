import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PropertyService } from '../modules/property/property.service';
import { ViewingService } from '../modules/viewing/viewing.service';
import { HandoverService } from '../modules/handover/handover.service';
import { KeyTransferService } from '../modules/key-transfer/key-transfer.service';
import { DepositService } from '../modules/deposit/deposit.service';
import { AuditService } from '../modules/audit/audit.service';

const CONSULTANT = { id: '1', name: '张磊', role: 'consultant' };
const OPERATIONS = { id: '2', name: '李敏', role: 'operations' };
const FINANCE = { id: '3', name: '王芳', role: 'finance' };

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const propertyService = app.get(PropertyService);
  const viewingService = app.get(ViewingService);
  const handoverService = app.get(HandoverService);
  const keyTransferService = app.get(KeyTransferService);
  const depositService = app.get(DepositService);
  const auditService = app.get(AuditService);

  console.log('🌱 开始填充模拟数据...');

  const prop1 = propertyService.create(
    {
      building: '国贸大厦A座',
      floor: 12,
      unit: '1203',
      area: 180,
      rentPrice: 28000,
      deposit: 56000,
      currentTenant: '科技未来有限公司',
      description: '东南朝向，精装修，带家具',
    },
    CONSULTANT.id,
    CONSULTANT.name,
    CONSULTANT.role,
  );
  console.log(`  🏢 房源1: ${prop1.building} ${prop1.floor}层${prop1.unit} (状态: ${prop1.status})`);

  propertyService.updateStatus(prop1.id, 'viewing', CONSULTANT.id, CONSULTANT.name, CONSULTANT.role);

  const viewing1 = viewingService.create(
    {
      propertyId: prop1.id,
      consultantId: CONSULTANT.id,
      consultantName: CONSULTANT.name,
      viewerName: '陈总',
      viewerCompany: '创新科技有限公司',
      viewerContact: '13800138001',
      viewDate: new Date(Date.now() - 7 * 24 * 3600 * 1000),
    },
    CONSULTANT.id,
    CONSULTANT.name,
    CONSULTANT.role,
  );
  console.log(`  👀 看房记录1: ${viewing1.viewerName} - ${viewing1.viewerCompany}`);

  viewingService.addFeedback(
    viewing1.id,
    {
      satisfaction: 'satisfied',
      notes: '客户对面积和朝向都很满意，就是觉得租金稍贵',
      followUpAction: '跟进议价，预计可以降5%',
    },
    CONSULTANT.id,
    CONSULTANT.name,
    CONSULTANT.role,
  );

  const viewing2 = viewingService.create(
    {
      propertyId: prop1.id,
      consultantId: CONSULTANT.id,
      consultantName: CONSULTANT.name,
      viewerName: '刘经理',
      viewerCompany: '云端数据服务有限公司',
      viewerContact: '13900139002',
      viewDate: new Date(Date.now() - 3 * 24 * 3600 * 1000),
    },
    CONSULTANT.id,
    CONSULTANT.name,
    CONSULTANT.role,
  );
  console.log(`  👀 看房记录2: ${viewing2.viewerName} - ${viewing2.viewerCompany} (无反馈，容易漏掉)`);

  propertyService.updateStatus(prop1.id, 'leased', CONSULTANT.id, CONSULTANT.name, CONSULTANT.role);
  console.log(`  📋 房源1已签约，状态更新为: leased`);

  const prop2 = propertyService.create(
    {
      building: '金融中心B座',
      floor: 8,
      unit: '805',
      area: 120,
      rentPrice: 18000,
      deposit: 36000,
      currentTenant: '智慧商务咨询',
      description: '北向，简装，可注册公司',
    },
    CONSULTANT.id,
    CONSULTANT.name,
    CONSULTANT.role,
  );
  propertyService.updateStatus(prop2.id, 'viewing', CONSULTANT.id, CONSULTANT.name, CONSULTANT.role);
  propertyService.updateStatus(prop2.id, 'leased', CONSULTANT.id, CONSULTANT.name, CONSULTANT.role);
  console.log(`  🏢 房源2: ${prop2.building} ${prop2.floor}层${prop2.unit} (状态: leased)`);

  const handover1 = handoverService.submit(
    {
      propertyId: prop1.id,
      checklist: [
        { item: '门窗完好', status: 'pass' as const },
        { item: '水电正常', status: 'pass' as const },
        { item: '空调设备正常', status: 'fail' as const, notes: '中央空调3号风口有异响' },
        { item: '墙面地面无破损', status: 'pass' as const },
        { item: '消防设施完好', status: 'pass' as const },
        { item: '网络线路正常', status: 'na' as const },
        { item: '卫生清洁完成', status: 'fail' as const, notes: '会议室地毯有污渍' },
      ],
      issues: ['空调异响', '地毯污渍'],
    },
    CONSULTANT.id,
    CONSULTANT.name,
    CONSULTANT.role,
  );
  console.log(`  📝 交房验收1已提交 (顾问提交，待运营确认): ${handover1.id.slice(0, 8)}...`);

  const handover2 = handoverService.submit(
    {
      propertyId: prop2.id,
      checklist: [
        { item: '门窗完好', status: 'pass' as const },
        { item: '水电正常', status: 'pass' as const },
        { item: '空调设备正常', status: 'pass' as const },
        { item: '墙面地面无破损', status: 'pass' as const },
        { item: '消防设施完好', status: 'pass' as const },
        { item: '网络线路正常', status: 'pass' as const },
        { item: '卫生清洁完成', status: 'pass' as const },
      ],
      issues: [],
    },
    CONSULTANT.id,
    CONSULTANT.name,
    CONSULTANT.role,
  );

  handoverService.confirm(handover2.id, OPERATIONS.id, OPERATIONS.name, OPERATIONS.role);
  console.log(`  ✅ 交房验收2已确认 (运营确认): ${handover2.id.slice(0, 8)}...`);

  handoverService.dispute(
    handover1.id,
    {
      reason: '空调问题未在签约前说明，且清洁不达标影响入住',
      disputedItems: ['空调设备正常', '卫生清洁完成'],
    },
    OPERATIONS.id,
    OPERATIONS.name,
    OPERATIONS.role,
  );
  console.log(`  ⚠️  交房验收1有争议 (运营提出异议): ${handover1.id.slice(0, 8)}...`);

  const keyTransfer1 = keyTransferService.initiateTransfer(
    {
      propertyId: prop2.id,
      handoverId: handover2.id,
      keyCount: 5,
      keyTypes: ['大门钥匙', '门禁卡', '空调控制面板'],
    },
    CONSULTANT.id,
    CONSULTANT.name,
    CONSULTANT.role,
  );
  console.log(`  🔑 钥匙移交1待接收 (顾问发起，运营待接收): ${keyTransfer1.id.slice(0, 8)}...`);

  const deposit1 = depositService.initiate(
    {
      propertyId: prop1.id,
      handoverId: handover1.id,
      tenantName: '创新科技有限公司',
      originalDeposit: 56000,
      deductions: [
        { item: '空调维修', amount: 2000 },
        { item: '地毯清洁', amount: 800 },
      ],
    },
    CONSULTANT.id,
    CONSULTANT.name,
    CONSULTANT.role,
  );
  console.log(`  💰 押金结算1待确认 (顾问发起，有扣除项): ¥${deposit1.refundAmount}`);

  const deposit2 = depositService.initiate(
    {
      propertyId: prop2.id,
      handoverId: handover2.id,
      tenantName: '智慧商务咨询',
      originalDeposit: 36000,
      deductions: [],
    },
    CONSULTANT.id,
    CONSULTANT.name,
    CONSULTANT.role,
  );
  console.log(`  💰 押金结算2待确认 (无扣除): ¥${deposit2.refundAmount}`);

  depositService.confirm(deposit2.id, FINANCE.id, FINANCE.name, FINANCE.role);
  depositService.markSettled(deposit2.id, FINANCE.id, FINANCE.name, FINANCE.role);
  console.log(`  ✅ 押金结算2已结算 (财务确认并结算)`);

  depositService.dispute(
    deposit1.id,
    {
      disputeReason: '空调维修费用过高，且地毯污渍属于正常磨损范围',
      disputedAmount: 2800,
      deductionItems: [
        { item: '空调维修', amount: 2000 },
        { item: '地毯清洁', amount: 800 },
      ],
    },
    FINANCE.id,
    FINANCE.name,
    FINANCE.role,
  );
  console.log(`  ⚠️  押金结算1有争议 (财务提出异议，争议金额: ¥2800)`);

  const prop3 = propertyService.create(
    {
      building: '世纪广场C座',
      floor: 15,
      unit: '1501',
      area: 250,
      rentPrice: 42000,
      deposit: 84000,
      currentTenant: undefined,
      description: '整层东南北三面采光，豪华装修',
    },
    CONSULTANT.id,
    CONSULTANT.name,
    CONSULTANT.role,
  );
  console.log(`  🏢 房源3: ${prop3.building} ${prop3.floor}层${prop3.unit} (状态: available，待出租)`);

  const prop4 = propertyService.create(
    {
      building: '国贸大厦A座',
      floor: 5,
      unit: '502',
      area: 80,
      rentPrice: 12000,
      deposit: 24000,
      currentTenant: '老租户贸易公司',
      description: '小面积，适合初创团队',
    },
    CONSULTANT.id,
    CONSULTANT.name,
    CONSULTANT.role,
  );
  propertyService.updateStatus(prop4.id, 'viewing', CONSULTANT.id, CONSULTANT.name, CONSULTANT.role);
  propertyService.updateStatus(prop4.id, 'leased', CONSULTANT.id, CONSULTANT.name, CONSULTANT.role);

  const handover4 = handoverService.submit(
    { propertyId: prop4.id },
    CONSULTANT.id,
    CONSULTANT.name,
    CONSULTANT.role,
  );
  handoverService.confirm(handover4.id, OPERATIONS.id, OPERATIONS.name, OPERATIONS.role);

  const keyTransfer4 = keyTransferService.initiateTransfer(
    {
      propertyId: prop4.id,
      handoverId: handover4.id,
      keyCount: 3,
      keyTypes: ['大门钥匙', '门禁卡'],
    },
    CONSULTANT.id,
    CONSULTANT.name,
    CONSULTANT.role,
  );
  keyTransferService.confirmReception(keyTransfer4.id, OPERATIONS.id, OPERATIONS.name, OPERATIONS.role);
  console.log(`  🏢 房源4: ${prop4.building} ${prop4.floor}层${prop4.unit} (状态: ${propertyService.findOne(prop4.id).status}，已入驻)`);
  console.log(`  🔑 钥匙移交4已完成移交`);

  console.log('');
  console.log('📊 数据统计:');
  console.log(`  房源总数: ${propertyService.findAll().length}`);
  console.log(`  看房记录: ${viewingService.findAll().length} (其中有反馈: ${viewingService.findAll({ feedback: 'true' as any }).length})`);
  console.log(`  交房验收: ${handoverService.findAll().length} (争议中: ${handoverService.getDisputes().length})`);
  console.log(`  钥匙移交: ${keyTransferService.findAll().length}`);
  console.log(`  押金结算: ${depositService.findAll().length} (争议中: ${depositService.getDisputes().length})`);
  console.log(`  审计日志: ${auditService.query().length} 条`);
  console.log('');
  console.log('🎭 模拟账号:');
  console.log(`  租赁顾问: consultant1 / pass123 (张磊)`);
  console.log(`  运营经理: operations1 / pass123 (李敏)`);
  console.log(`  财务:     finance1 / pass123 (王芳)`);
  console.log('');
  console.log('⚠️  容易扯皮的场景已预置:');
  console.log('  1. 房源状态更新慢 — 看房记录2无反馈，房源状态停留在leased但没跟进');
  console.log('  2. 看房反馈散 — 看房反馈分散在各条记录中，缺少汇总视图');
  console.log('  3. 押金结算争议 — 押金结算1有争议，扣除项和金额有分歧');
  console.log('  4. 交房验收异议 — 交房验收1有争议，空调和清洁问题待解决');
  console.log('  5. 钥匙移交待确认 — 钥匙移交1待运营接收，责任未转移');

  await app.close();
  console.log('');
  console.log('✅ 模拟数据填充完成！');
}

bootstrap();
