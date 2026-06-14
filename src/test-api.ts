import { db } from './database';
import { seedData } from './seed';
import { ApplicationService } from './services/application.service';
import { PaymentService } from './services/payment.service';
import { CertificateService } from './services/certificate.service';
import { OperationLogService } from './services/operationLog.service';
import { FeeItem } from './types';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => void | Promise<void>): Promise<void> {
  const start = Date.now();
  try {
    await testFn();
    results.push({ name, passed: true, duration: Date.now() - start });
    console.log(`✅ ${name}`);
  } catch (e: any) {
    results.push({ name, passed: false, error: e.message, duration: Date.now() - start });
    console.log(`❌ ${name}: ${e.message}`);
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('公证处窗口-缴费登记与出证安排系统 - 服务层集成测试');
  console.log('='.repeat(70) + '\n');

  const users = seedData();
  const { windowStaff, notary, archivist } = users;

  console.log('【测试用户】');
  console.log(`  窗口人员: ${windowStaff.name} (${windowStaff.id})`);
  console.log(`  公证员: ${notary.name} (${notary.id})`);
  console.log(`  档案员: ${archivist.name} (${archivist.id})\n`);

  console.log('【种子数据概览】');
  console.log(`  总申请数: ${db.getApplications().length}`);
  console.log(`  已完成: ${db.getApplications().filter(a => a.status === 'COMPLETED').length}`);
  console.log(`  卡住记录: ${ApplicationService.getStuckApplications().length}\n`);

  console.log('-' .repeat(70));
  console.log('测试用例 1: 完整业务流程 - 从申请到发证');
  console.log('-' .repeat(70));

  let testAppId: string;
  const feeItems: FeeItem[] = [
    { name: '委托公证费', amount: 200, quantity: 1 },
    { name: '公证书副本', amount: 20, quantity: 3 },
  ];
  const totalFee = feeItems.reduce((s, f) => s + f.amount * f.quantity, 0);

  await runTest('1.1 窗口人员创建公证申请', () => {
    const app = ApplicationService.createApplication({
      applicantName: '测试申请人',
      applicantIdNo: '110101199001018888',
      notaryType: '委托公证',
      appointmentNo: 'TEST-APPT-001',
    }, windowStaff);

    testAppId = app.id;
    assert(app.status === 'PENDING_MATERIALS', '初始状态应为 PENDING_MATERIALS');
    assert(app.applicantName === '测试申请人', '申请人姓名不正确');
    assert(app.applicationNo.length === 12, '申请号格式不正确');
  });

  await runTest('1.2 窗口人员提交申请材料', () => {
    const result = ApplicationService.submitMaterials({
      applicationId: testAppId,
      materials: [
        { name: '身份证原件', isOriginal: true },
        { name: '委托书原件', isOriginal: true },
        { name: '房产证复印件', isOriginal: false, remark: '与原件核对一致' },
      ],
    }, windowStaff);

    if ('error' in result) throw new Error(result.error.join(', '));
    assert(result.status === 'MATERIALS_SUBMITTED', '状态应变为 MATERIALS_SUBMITTED');
    assert(result.materials.length === 3, '材料数量应为3份');
  });

  await runTest('1.3 公证员审核材料并设置缴费金额', () => {
    const result = ApplicationService.reviewAndSetPayment({
      applicationId: testAppId,
      feeItems,
    }, notary);

    if ('error' in result) throw new Error(result.error.join(', '));
    assert(result.status === 'PENDING_PAYMENT', '状态应变为 PENDING_PAYMENT');
    assert(result.payment.amount === totalFee, `缴费金额应为 ¥${totalFee}`);
    assert(result.payment.status === 'PENDING_REGISTRATION', '缴费状态应为 PENDING_REGISTRATION');
  });

  await runTest('1.4 窗口人员提交缴费登记', () => {
    const result = PaymentService.registerPayment({
      applicationId: testAppId,
      amount: totalFee,
      feeItems,
      paymentMethod: '微信支付',
      transactionNo: 'WX-TEST-' + Date.now(),
      remark: '现场扫码支付',
    }, windowStaff);

    if ('error' in result) throw new Error(result.error.join(', '));
    assert(result.status === 'PAYMENT_REGISTERED', '状态应变为 PAYMENT_REGISTERED');
    assert(result.payment.status === 'REGISTERED', '缴费状态应为 REGISTERED');
    assert(result.payment.registeredBy === windowStaff.id, '登记人应为窗口人员');
    assert(result.payment.registeredAt !== undefined, '应有登记时间');
  });

  await runTest('1.5 公证员确认缴费', () => {
    const result = PaymentService.confirmPayment({
      applicationId: testAppId,
      remark: '缴费凭证核验无误',
    }, notary);

    if ('error' in result) throw new Error(result.error.join(', '));
    assert(result.status === 'PENDING_CERTIFICATE_ARRANGEMENT', '状态应变为 PENDING_CERTIFICATE_ARRANGEMENT');
    assert(result.payment.status === 'CONFIRMED', '缴费状态应为 CONFIRMED');
    assert(result.payment.confirmedBy === notary.id, '确认人应为公证员');
    assert(result.payment.confirmedAt !== undefined, '应有确认时间');
  });

  await runTest('1.6 档案员安排出证', () => {
    const pickupDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const result = CertificateService.arrangeCertificate({
      applicationId: testAppId,
      certificateNo: 'GZ-TEST-2024-000001',
      scheduledPickupDate: pickupDate,
      remark: '公证书已按标准格式制作',
    }, archivist);

    if ('error' in result) throw new Error(result.error.join(', '));
    assert(result.status === 'CERTIFICATE_ARRANGED', '状态应变为 CERTIFICATE_ARRANGED');
    assert(result.certificate.status === 'ARRANGED', '出证状态应为 ARRANGED');
    assert(result.certificate.certificateNo === 'GZ-TEST-2024-000001', '公证书编号不正确');
    assert(result.certificate.arrangedBy === archivist.id, '安排人应为档案员');
  });

  await runTest('1.7 档案员完成发证', () => {
    const result = CertificateService.issueCertificate({
      applicationId: testAppId,
      pickupBy: '测试申请人',
      pickupIdNo: '110101199001018888',
      remark: '本人领取，身份核验通过',
    }, archivist);

    if ('error' in result) throw new Error(result.error.join(', '));
    assert(result.status === 'COMPLETED', '状态应变为 COMPLETED');
    assert(result.certificate.status === 'ISSUED', '出证状态应为 ISSUED');
    assert(result.certificate.pickupBy === '测试申请人', '取件人信息不正确');
    assert(result.certificate.issuedBy === archivist.id, '发证人应为档案员');
  });

  await runTest('1.8 操作日志完整记录所有步骤', () => {
    const logs = OperationLogService.getApplicationLogs(testAppId);
    assert(logs.length >= 7, `至少应有7条操作日志，实际有${logs.length}条`);
    
    const operations = logs.map(l => l.operation);
    const expected = ['创建公证申请', '提交申请材料', '审核材料通过', '提交缴费登记', '确认缴费', '安排出证', '发证完成'];
    expected.forEach(op => {
      assert(operations.some(o => o.includes(op)), `缺少操作日志: ${op}`);
    });

    logs.forEach(log => {
      assert(log.operatorId !== undefined, '每条日志应有操作人ID');
      assert(log.operatorRole !== undefined, '每条日志应有操作人角色');
      assert(log.timestamp !== undefined, '每条日志应有时间戳');
    });
  });

  await runTest('1.9 流程回看与责任追溯', () => {
    const review = CertificateService.reviewCertificateProcess(testAppId);
    if ('error' in review) throw new Error(review.error.join(', '));

    assert(review.responsibilityChain.length === 5, '责任链应有5个环节');
    assert(review.responsibilityChain.every(step => step.isCompleted), '所有环节应标记为已完成');

    const stepHandlers = review.responsibilityChain.map(s => s.handler);
    assert(stepHandlers.includes(windowStaff.name), '窗口人员应出现在责任链中');
    assert(stepHandlers.includes(notary.name), '公证员应出现在责任链中');
    assert(stepHandlers.includes(archivist.name), '档案员应出现在责任链中');

    assert(review.payment.registeredBy === windowStaff.id, '缴费登记人不正确');
    assert(review.payment.confirmedBy === notary.id, '缴费确认人不正确');
    assert(review.certificate.arrangedBy === archivist.id, '出证安排人不正确');
    assert(review.certificate.issuedBy === archivist.id, '发证人不正确');
  });

  console.log('\n' + '-'.repeat(70));
  console.log('测试用例 2: 权限校验与边界情况');
  console.log('-'.repeat(70));

  await runTest('2.1 窗口人员不能确认缴费', () => {
    const result = PaymentService.confirmPayment({
      applicationId: testAppId,
    }, windowStaff);

    if (!('error' in result)) {
      throw new Error('窗口人员确认缴费应被拒绝');
    }
  });

  await runTest('2.2 档案员不能确认缴费', () => {
    const result = PaymentService.confirmPayment({
      applicationId: testAppId,
    }, archivist);

    if (!('error' in result)) {
      throw new Error('档案员确认缴费应被拒绝');
    }
  });

  await runTest('2.3 公证员不能安排出证', () => {
    const result = CertificateService.arrangeCertificate({
      applicationId: testAppId,
      scheduledPickupDate: new Date(),
    }, notary);

    if (!('error' in result)) {
      throw new Error('公证员安排出证应被拒绝');
    }
  });

  await runTest('2.4 已完成申请不能重复缴费登记', () => {
    const result = PaymentService.registerPayment({
      applicationId: testAppId,
      amount: 100,
      feeItems: [{ name: '测试', amount: 100, quantity: 1 }],
      paymentMethod: '现金',
    }, windowStaff);

    if (!('error' in result)) {
      throw new Error('已完成申请重复缴费登记应被拒绝');
    }
  });

  await runTest('2.5 窗口人员不能发出补正通知', () => {
    const testAppForSupplement = ApplicationService.createApplication({
      applicantName: '补正测试',
      applicantIdNo: '110101199001016666',
      notaryType: '继承权公证',
    }, windowStaff);

    ApplicationService.submitMaterials({
      applicationId: testAppForSupplement.id,
      materials: [{ name: '身份证', isOriginal: true }],
    }, windowStaff);

    const result = ApplicationService.issueSupplementNotice({
      applicationId: testAppForSupplement.id,
      reason: '缺少证明',
      requiredMaterials: ['证明原件'],
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }, windowStaff);

    if (!('error' in result)) {
      throw new Error('窗口人员发出补正通知应被拒绝');
    }
    assert(result.error.some(e => e.includes('只有公证员')), '应有角色限制错误');
  });

  await runTest('2.6 补正通知状态校验 - 不允许的状态下不能发出', () => {
    const testAppBadStatus = ApplicationService.createApplication({
      applicantName: '状态校验',
      applicantIdNo: '110101199001015555',
      notaryType: '委托公证',
    }, windowStaff);

    const result = ApplicationService.issueSupplementNotice({
      applicationId: testAppBadStatus.id,
      reason: '状态不对',
      requiredMaterials: ['材料'],
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }, notary);

    if (!('error' in result)) {
      throw new Error('不允许的状态下发补正通知应被拒绝');
    }
    assert(result.error.some(e => e.includes('不允许发出补正通知')), '应有状态校验错误');
  });

  await runTest('2.7 缴费金额校验 - 金额与明细不一致', () => {
    const testApp2 = ApplicationService.createApplication({
      applicantName: '测试校验',
      applicantIdNo: '110101199001017777',
      notaryType: '声明公证',
    }, windowStaff);

    ApplicationService.submitMaterials({
      applicationId: testApp2.id,
      materials: [{ name: '身份证', isOriginal: true }],
    }, windowStaff);

    ApplicationService.reviewAndSetPayment({
      applicationId: testApp2.id,
      feeItems: [{ name: '公证费', amount: 100, quantity: 1 }],
    }, notary);

    const result = PaymentService.registerPayment({
      applicationId: testApp2.id,
      amount: 999,
      feeItems: [{ name: '公证费', amount: 100, quantity: 1 }],
      paymentMethod: '现金',
    }, windowStaff);

    if (!('error' in result)) {
      throw new Error('金额不一致应被拒绝');
    }
    assert(result.error.some(e => e.includes('总金额与费用明细合计不一致')), '应有金额不一致的错误');
  });

  console.log('\n' + '-'.repeat(70));
  console.log('测试用例 3: 种子数据检查 - 正常关闭与卡住的记录');
  console.log('-'.repeat(70));

  await runTest('3.1 存在正常完成的记录', () => {
    const completed = db.getApplications().filter(a => a.status === 'COMPLETED');
    assert(completed.length >= 1, '至少应有1条已完成记录');
    completed.forEach(app => {
      assert(app.payment.status === 'CONFIRMED', '已完成记录缴费应为已确认');
      assert(app.certificate.status === 'ISSUED', '已完成记录出证应为已发证');
      assert(app.payment.registeredAt !== undefined, '应有缴费登记时间');
      assert(app.payment.confirmedAt !== undefined, '应有缴费确认时间');
      assert(app.certificate.arrangedAt !== undefined, '应有出证安排时间');
      assert(app.certificate.issuedAt !== undefined, '应有发证时间');
    });
  });

  await runTest('3.2 存在待缴费登记超过72小时的卡住记录', () => {
    const stuck = ApplicationService.getStuckApplications().filter(a => a.status === 'PENDING_PAYMENT');
    assert(stuck.length >= 1, '至少应有1条待缴费登记卡住记录');
  });

  await runTest('3.3 存在待缴费确认超过24小时的卡住记录', () => {
    const stuck = PaymentService.getStuckPaymentRecords();
    const stuckConfirm = stuck.filter(a => a.payment.status === 'REGISTERED');
    assert(stuckConfirm.length >= 1, '至少应有1条待缴费确认卡住记录');
  });

  await runTest('3.4 存在待出证安排超过24小时的卡住记录', () => {
    const stuck = CertificateService.getStuckCertificateRecords();
    const stuckArrange = stuck.filter(a => a.status === 'PENDING_CERTIFICATE_ARRANGEMENT');
    assert(stuckArrange.length >= 1, '至少应有1条待出证安排卡住记录');
  });

  await runTest('3.5 存在待发证超过72小时的卡住记录', () => {
    const stuck = CertificateService.getStuckCertificateRecords();
    const stuckIssue = stuck.filter(a => a.status === 'CERTIFICATE_ARRANGED');
    assert(stuckIssue.length >= 1, '至少应有1条待发证卡住记录');
  });

  await runTest('3.6 存在补正材料逾期的卡住记录', () => {
    const stuck = ApplicationService.getStuckApplications().filter(a => a.status === 'SUPPLEMENT_NEEDED');
    assert(stuck.length >= 1, '至少应有1条补正逾期卡住记录');
    stuck.forEach(app => {
      const latestNotice = app.supplementNotices[0];
      assert(latestNotice !== undefined, '应有补正通知');
      assert(latestNotice.deadline < new Date(), '补正期限应已过期');
      assert(latestNotice.isCompleted === false, '补正应未完成');
    });
  });

  await runTest('3.7 卡住记录查询接口', () => {
    const stuckApps = ApplicationService.getStuckApplications();
    const stuckPayments = PaymentService.getStuckPaymentRecords();
    const stuckCerts = CertificateService.getStuckCertificateRecords();

    assert(stuckApps.length >= 3, '应用层应能查询到卡住的申请');
    assert(stuckPayments.length >= 2, '缴费层应能查询到卡住的记录');
    assert(stuckCerts.length >= 2, '出证层应能查询到卡住的记录');
  });

  console.log('\n' + '-'.repeat(70));
  console.log('测试用例 4: 出证流程历史回看');
  console.log('-'.repeat(70));

  await runTest('4.1 已完成记录的完整历史可追溯', () => {
    const completedApp = db.getApplications().find(a => a.status === 'COMPLETED');
    assert(completedApp !== undefined, '应有已完成的申请');

    const history = CertificateService.getCertificateHistory(completedApp!.id);
    assert(history.length >= 5, '历史记录至少应有5条');

    const operations = history.map(h => h.operation);
    assert(operations.some(o => o.includes('缴费')), '历史应包含缴费相关操作');
    assert(operations.some(o => o.includes('出证')), '历史应包含出证相关操作');
    assert(operations.some(o => o.includes('发证')), '历史应包含发证操作');
  });

  await runTest('4.2 卡住记录的责任链可追溯', () => {
    const stuckApps = ApplicationService.getStuckApplications();
    assert(stuckApps.length > 0, '应有卡住的申请');

    const review = CertificateService.reviewCertificateProcess(stuckApps[0].id);
    if ('error' in review) throw new Error(review.error.join(', '));

    const incompleteSteps = review.responsibilityChain.filter(s => !s.isCompleted);
    assert(incompleteSteps.length > 0, '卡住的记录应有未完成的环节');
    
    console.log(`    卡住记录「${stuckApps[0].applicationNo}」卡在环节: ${incompleteSteps[0].step}`);
  });

  await runTest('4.3 每条操作日志都有操作人与角色留痕', () => {
    const apps = db.getApplications();
    for (const app of apps) {
      const logs = OperationLogService.getApplicationLogs(app.id);
      for (const log of logs) {
        assert(log.operatorId !== undefined && log.operatorId.length > 0, '日志缺少操作人ID');
        assert(log.operatorName !== undefined && log.operatorName.length > 0, '日志缺少操作人姓名');
        assert(['WINDOW_STAFF', 'NOTARY', 'ARCHIVIST'].includes(log.operatorRole), '日志角色不正确');
      }
    }
  });

  console.log('\n' + '='.repeat(70));
  console.log('测试结果汇总');
  console.log('='.repeat(70));

  const passed = results.filter(r => r.passed);
  const failed = results.filter(r => !r.passed);
  const totalDuration = results.reduce((s, r) => s + r.duration, 0);

  console.log(`\n总测试数: ${results.length}`);
  console.log(`通过: ${passed.length} ✅`);
  console.log(`失败: ${failed.length} ❌`);
  console.log(`总耗时: ${totalDuration}ms\n`);

  if (failed.length > 0) {
    console.log('失败的测试:');
    failed.forEach(f => {
      console.log(`  ❌ ${f.name}: ${f.error}`);
    });
  }

  console.log('\n' + '='.repeat(70));
  if (failed.length === 0) {
    console.log('🎉 所有测试通过！服务层功能完整，可通过请求示例正常运行。');
  } else {
    console.log(`⚠️  有 ${failed.length} 个测试失败，请检查。`);
  }
  console.log('='.repeat(70) + '\n');

  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch(e => {
  console.error('测试执行出错:', e);
  process.exit(1);
});
