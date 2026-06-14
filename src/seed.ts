import { db } from './database';
import { UserRole, ApplicationStatus, FeeItem } from './types';

function createUser(name: string, role: UserRole, employeeId: string) {
  return db.addUser({ name, role, employeeId });
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function hoursAgo(hours: number): Date {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date;
}

export function seedData() {
  db.clear();

  console.log('开始生成种子数据...');

  const windowStaff = createUser('张晓明', 'WINDOW_STAFF', 'WIN001');
  const windowStaff2 = createUser('李雪梅', 'WINDOW_STAFF', 'WIN002');
  const notary = createUser('王公正', 'NOTARY', 'NOT001');
  const notary2 = createUser('陈公证', 'NOTARY', 'NOT002');
  const archivist = createUser('刘档案', 'ARCHIVIST', 'ARC001');
  const archivist2 = createUser('赵档案', 'ARCHIVIST', 'ARC002');

  console.log('创建用户完成:', [windowStaff.name, windowStaff2.name, notary.name, notary2.name, archivist.name, archivist2.name]);

  const feeItems1: FeeItem[] = [
    { name: '委托公证费', amount: 200, quantity: 1 },
    { name: '公证书副本', amount: 20, quantity: 2 },
  ];

  const feeItems2: FeeItem[] = [
    { name: '继承权公证费', amount: 500, quantity: 1 },
    { name: '公证书副本', amount: 20, quantity: 1 },
  ];

  const feeItems3: FeeItem[] = [
    { name: '遗嘱公证费', amount: 300, quantity: 1 },
  ];

  const total1 = feeItems1.reduce((s, f) => s + f.amount * f.quantity, 0);
  const total2 = feeItems2.reduce((s, f) => s + f.amount * f.quantity, 0);
  const total3 = feeItems3.reduce((s, f) => s + f.amount * f.quantity, 0);

  seedCompletedCase();
  seedStuckAtPaymentRegistration();
  seedStuckAtPaymentConfirmation();
  seedStuckAtCertificateArrangement();
  seedStuckAtCertificateIssuance();
  seedStuckAtSupplement();
  seedStuckAtMaterials();

  console.log('\n种子数据生成完成！');
  console.log('正常完成案例: 1条');
  console.log('卡住案例: 6条');
  console.log('总申请数:', db.getApplications().length);

  function seedCompletedCase() {
    const appNo = '2024' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    const payment = db.addPaymentRecord({
      applicationId: '',
      amount: total1,
      feeItems: feeItems1,
      status: 'CONFIRMED',
      paymentMethod: '微信支付',
      transactionNo: 'WX' + Date.now(),
      registeredBy: windowStaff.id,
      registeredAt: hoursAgo(50),
      confirmedBy: notary.id,
      confirmedAt: hoursAgo(48),
    });

    const certificate = db.addCertificateRecord({
      applicationId: '',
      status: 'ISSUED',
      certificateNo: 'GZ-2024-123456',
      arrangedBy: archivist.id,
      arrangedAt: hoursAgo(40),
      scheduledPickupDate: daysAgo(1),
      issuedBy: archivist2.id,
      issuedAt: hoursAgo(10),
      pickupBy: '张三',
      pickupIdNo: '110101199001011234',
    });

    const material1 = db.addMaterialRecord({
      name: '身份证原件',
      submittedBy: windowStaff.id,
      submittedAt: hoursAgo(72),
      isOriginal: true,
    });

    const material2 = db.addMaterialRecord({
      name: '委托书原件',
      submittedBy: windowStaff.id,
      submittedAt: hoursAgo(72),
      isOriginal: true,
    });

    const app = db.addApplicationWithTimestamps({
      applicationNo: appNo,
      applicantName: '张三',
      applicantIdNo: '110101199001011234',
      notaryType: '委托公证',
      appointmentNo: 'APPT202401001',
      status: 'COMPLETED',
      materials: [material1, material2],
      supplementNotices: [],
      payment,
      certificate,
      createdAt: hoursAgo(73),
      updatedAt: hoursAgo(10),
    });

    db.updatePaymentRecord(payment.id, { applicationId: app.id });
    db.updateCertificateRecord(certificate.id, { applicationId: app.id });

    db.addOperationLogWithTimestamp({
      applicationId: app.id,
      operatorId: windowStaff.id,
      operatorName: windowStaff.name,
      operatorRole: windowStaff.role,
      operation: '创建公证申请',
      previousStatus: undefined,
      newStatus: 'PENDING_MATERIALS',
      remark: `申请号: ${appNo}, 公证类型: 委托公证, 预约号: APPT202401001`,
      timestamp: hoursAgo(73),
    });

    db.addOperationLogWithTimestamp({
      applicationId: app.id,
      operatorId: windowStaff.id,
      operatorName: windowStaff.name,
      operatorRole: windowStaff.role,
      operation: '提交申请材料',
      previousStatus: 'PENDING_MATERIALS',
      newStatus: 'MATERIALS_SUBMITTED',
      remark: '提交材料2份: 身份证原件, 委托书原件',
      timestamp: hoursAgo(72),
    });

    db.addOperationLogWithTimestamp({
      applicationId: app.id,
      operatorId: notary.id,
      operatorName: notary.name,
      operatorRole: notary.role,
      operation: '审核材料通过，待缴费',
      previousStatus: 'MATERIALS_SUBMITTED',
      newStatus: 'PENDING_PAYMENT',
      remark: '应缴费用: ¥240.00',
      timestamp: hoursAgo(60),
    });

    db.addOperationLogWithTimestamp({
      applicationId: app.id,
      operatorId: windowStaff.id,
      operatorName: windowStaff.name,
      operatorRole: windowStaff.role,
      operation: '提交缴费登记',
      previousStatus: 'PENDING_PAYMENT',
      newStatus: 'PAYMENT_REGISTERED',
      remark: `缴费金额: ¥240.00, 支付方式: 微信支付, 交易号: WX${Date.now()}`,
      timestamp: hoursAgo(50),
    });

    db.addOperationLogWithTimestamp({
      applicationId: app.id,
      operatorId: notary.id,
      operatorName: notary.name,
      operatorRole: notary.role,
      operation: '确认缴费',
      previousStatus: 'PAYMENT_REGISTERED',
      newStatus: 'PENDING_CERTIFICATE_ARRANGEMENT',
      remark: '公证员确认缴费有效',
      timestamp: hoursAgo(48),
    });

    db.addOperationLogWithTimestamp({
      applicationId: app.id,
      operatorId: archivist.id,
      operatorName: archivist.name,
      operatorRole: archivist.role,
      operation: '安排出证',
      previousStatus: 'PENDING_CERTIFICATE_ARRANGEMENT',
      newStatus: 'CERTIFICATE_ARRANGED',
      remark: `公证书编号: GZ-2024-123456, 预计取件日期: ${daysAgo(1).toLocaleDateString('zh-CN')}`,
      timestamp: hoursAgo(40),
    });

    db.addOperationLogWithTimestamp({
      applicationId: app.id,
      operatorId: archivist2.id,
      operatorName: archivist2.name,
      operatorRole: archivist2.role,
      operation: '发证完成',
      previousStatus: 'CERTIFICATE_ARRANGED',
      newStatus: 'COMPLETED',
      remark: '取件人: 张三, 证件号: 110101199001011234',
      timestamp: hoursAgo(10),
    });

    console.log('✅ 正常完成案例:', appNo, '状态: 已完成');
  }

  function seedStuckAtPaymentRegistration() {
    const appNo = '2024' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    const payment = db.addPaymentRecord({
      applicationId: '',
      amount: total2,
      feeItems: feeItems2,
      status: 'PENDING_REGISTRATION',
    });

    const certificate = db.addCertificateRecord({
      applicationId: '',
      status: 'NOT_ARRANGED',
    });

    const material1 = db.addMaterialRecord({
      name: '死亡证明原件',
      submittedBy: windowStaff2.id,
      submittedAt: daysAgo(5),
      isOriginal: true,
    });

    const material2 = db.addMaterialRecord({
      name: '亲属关系证明',
      submittedBy: windowStaff2.id,
      submittedAt: daysAgo(5),
      isOriginal: true,
    });

    const app = db.addApplicationWithTimestamps({
      applicationNo: appNo,
      applicantName: '李四',
      applicantIdNo: '310101198001015678',
      notaryType: '继承权公证',
      appointmentNo: 'APPT202401002',
      status: 'PENDING_PAYMENT',
      materials: [material1, material2],
      supplementNotices: [],
      payment,
      certificate,
      createdAt: daysAgo(6),
      updatedAt: daysAgo(4),
    });

    db.updatePaymentRecord(payment.id, { applicationId: app.id });
    db.updateCertificateRecord(certificate.id, { applicationId: app.id });

    db.addOperationLogWithTimestamp({
      applicationId: app.id,
      operatorId: windowStaff2.id,
      operatorName: windowStaff2.name,
      operatorRole: windowStaff2.role,
      operation: '创建公证申请',
      newStatus: 'PENDING_MATERIALS',
      remark: `申请号: ${appNo}, 公证类型: 继承权公证`,
      timestamp: daysAgo(6),
    });

    db.addOperationLogWithTimestamp({
      applicationId: app.id,
      operatorId: windowStaff2.id,
      operatorName: windowStaff2.name,
      operatorRole: windowStaff2.role,
      operation: '提交申请材料',
      previousStatus: 'PENDING_MATERIALS',
      newStatus: 'MATERIALS_SUBMITTED',
      remark: '提交材料2份',
      timestamp: daysAgo(5),
    });

    db.addOperationLogWithTimestamp({
      applicationId: app.id,
      operatorId: notary2.id,
      operatorName: notary2.name,
      operatorRole: notary2.role,
      operation: '审核材料通过，待缴费',
      previousStatus: 'MATERIALS_SUBMITTED',
      newStatus: 'PENDING_PAYMENT',
      remark: '应缴费用: ¥520.00',
      timestamp: daysAgo(4),
    });

    console.log('⚠️  卡住案例 - 待缴费登记(超过72小时):', appNo, '状态: PENDING_PAYMENT');
  }

  function seedStuckAtPaymentConfirmation() {
    const appNo = '2024' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    const payment = db.addPaymentRecord({
      applicationId: '',
      amount: total3,
      feeItems: feeItems3,
      status: 'REGISTERED',
      paymentMethod: '现金',
      registeredBy: windowStaff.id,
      registeredAt: hoursAgo(30),
    });

    const certificate = db.addCertificateRecord({
      applicationId: '',
      status: 'NOT_ARRANGED',
    });

    const material1 = db.addMaterialRecord({
      name: '身份证原件',
      submittedBy: windowStaff.id,
      submittedAt: hoursAgo(80),
      isOriginal: true,
    });

    const app = db.addApplicationWithTimestamps({
      applicationNo: appNo,
      applicantName: '王五',
      applicantIdNo: '440101197001019012',
      notaryType: '遗嘱公证',
      status: 'PAYMENT_REGISTERED',
      materials: [material1],
      supplementNotices: [],
      payment,
      certificate,
      createdAt: hoursAgo(82),
      updatedAt: hoursAgo(30),
    });

    db.updatePaymentRecord(payment.id, { applicationId: app.id });
    db.updateCertificateRecord(certificate.id, { applicationId: app.id });

    db.addOperationLogWithTimestamp({
      applicationId: app.id,
      operatorId: windowStaff.id,
      operatorName: windowStaff.name,
      operatorRole: windowStaff.role,
      operation: '创建公证申请',
      newStatus: 'PENDING_MATERIALS',
      remark: `申请号: ${appNo}, 公证类型: 遗嘱公证`,
      timestamp: hoursAgo(82),
    });

    db.addOperationLogWithTimestamp({
      applicationId: app.id,
      operatorId: windowStaff.id,
      operatorName: windowStaff.name,
      operatorRole: windowStaff.role,
      operation: '提交申请材料',
      previousStatus: 'PENDING_MATERIALS',
      newStatus: 'MATERIALS_SUBMITTED',
      timestamp: hoursAgo(80),
    });

    db.addOperationLogWithTimestamp({
      applicationId: app.id,
      operatorId: notary.id,
      operatorName: notary.name,
      operatorRole: notary.role,
      operation: '审核材料通过，待缴费',
      previousStatus: 'MATERIALS_SUBMITTED',
      newStatus: 'PENDING_PAYMENT',
      remark: '应缴费用: ¥300.00',
      timestamp: hoursAgo(36),
    });

    db.addOperationLogWithTimestamp({
      applicationId: app.id,
      operatorId: windowStaff.id,
      operatorName: windowStaff.name,
      operatorRole: windowStaff.role,
      operation: '提交缴费登记',
      previousStatus: 'PENDING_PAYMENT',
      newStatus: 'PAYMENT_REGISTERED',
      remark: '缴费金额: ¥300.00, 支付方式: 现金',
      timestamp: hoursAgo(30),
    });

    console.log('⚠️  卡住案例 - 待缴费确认(超过24小时):', appNo, '状态: PAYMENT_REGISTERED');
  }

  function seedStuckAtCertificateArrangement() {
    const appNo = '2024' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    const payment = db.addPaymentRecord({
      applicationId: '',
      amount: total1,
      feeItems: feeItems1,
      status: 'CONFIRMED',
      paymentMethod: '支付宝',
      transactionNo: 'ALI' + Date.now(),
      registeredBy: windowStaff2.id,
      registeredAt: hoursAgo(60),
      confirmedBy: notary2.id,
      confirmedAt: hoursAgo(30),
    });

    const certificate = db.addCertificateRecord({
      applicationId: '',
      status: 'NOT_ARRANGED',
    });

    const material1 = db.addMaterialRecord({
      name: '身份证原件',
      submittedBy: windowStaff2.id,
      submittedAt: hoursAgo(100),
      isOriginal: true,
    });

    const app = db.addApplicationWithTimestamps({
      applicationNo: appNo,
      applicantName: '赵六',
      applicantIdNo: '510101198505053456',
      notaryType: '委托公证',
      status: 'PENDING_CERTIFICATE_ARRANGEMENT',
      materials: [material1],
      supplementNotices: [],
      payment,
      certificate,
      createdAt: hoursAgo(105),
      updatedAt: hoursAgo(30),
    });

    db.updatePaymentRecord(payment.id, { applicationId: app.id });
    db.updateCertificateRecord(certificate.id, { applicationId: app.id });

    db.addOperationLogWithTimestamp({
      applicationId: app.id,
      operatorId: windowStaff2.id,
      operatorName: windowStaff2.name,
      operatorRole: windowStaff2.role,
      operation: '创建公证申请',
      newStatus: 'PENDING_MATERIALS',
      timestamp: hoursAgo(105),
    });

    db.addOperationLogWithTimestamp({
      applicationId: app.id,
      operatorId: windowStaff2.id,
      operatorName: windowStaff2.name,
      operatorRole: windowStaff2.role,
      operation: '提交申请材料',
      previousStatus: 'PENDING_MATERIALS',
      newStatus: 'MATERIALS_SUBMITTED',
      timestamp: hoursAgo(100),
    });

    db.addOperationLogWithTimestamp({
      applicationId: app.id,
      operatorId: notary2.id,
      operatorName: notary2.name,
      operatorRole: notary2.role,
      operation: '审核材料通过，待缴费',
      previousStatus: 'MATERIALS_SUBMITTED',
      newStatus: 'PENDING_PAYMENT',
      remark: '应缴费用: ¥240.00',
      timestamp: hoursAgo(70),
    });

    db.addOperationLogWithTimestamp({
      applicationId: app.id,
      operatorId: windowStaff2.id,
      operatorName: windowStaff2.name,
      operatorRole: windowStaff2.role,
      operation: '提交缴费登记',
      previousStatus: 'PENDING_PAYMENT',
      newStatus: 'PAYMENT_REGISTERED',
      timestamp: hoursAgo(60),
    });

    db.addOperationLogWithTimestamp({
      applicationId: app.id,
      operatorId: notary2.id,
      operatorName: notary2.name,
      operatorRole: notary2.role,
      operation: '确认缴费',
      previousStatus: 'PAYMENT_REGISTERED',
      newStatus: 'PENDING_CERTIFICATE_ARRANGEMENT',
      timestamp: hoursAgo(30),
    });

    console.log('⚠️  卡住案例 - 待出证安排(超过24小时):', appNo, '状态: PENDING_CERTIFICATE_ARRANGEMENT');
  }

  function seedStuckAtCertificateIssuance() {
    const appNo = '2024' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    const payment = db.addPaymentRecord({
      applicationId: '',
      amount: total2,
      feeItems: feeItems2,
      status: 'CONFIRMED',
      paymentMethod: '银行卡',
      registeredBy: windowStaff.id,
      registeredAt: daysAgo(10),
      confirmedBy: notary.id,
      confirmedAt: daysAgo(9),
    });

    const certificate = db.addCertificateRecord({
      applicationId: '',
      status: 'ARRANGED',
      certificateNo: 'GZ-2024-654321',
      arrangedBy: archivist.id,
      arrangedAt: hoursAgo(80),
      scheduledPickupDate: daysAgo(2),
    });

    const material1 = db.addMaterialRecord({
      name: '身份证原件',
      submittedBy: windowStaff.id,
      submittedAt: daysAgo(12),
      isOriginal: true,
    });

    const app = db.addApplicationWithTimestamps({
      applicationNo: appNo,
      applicantName: '孙七',
      applicantIdNo: '320101199008087890',
      notaryType: '继承权公证',
      status: 'CERTIFICATE_ARRANGED',
      materials: [material1],
      supplementNotices: [],
      payment,
      certificate,
      createdAt: daysAgo(13),
      updatedAt: hoursAgo(80),
    });

    db.updatePaymentRecord(payment.id, { applicationId: app.id });
    db.updateCertificateRecord(certificate.id, { applicationId: app.id });

    db.addOperationLogWithTimestamp({
      applicationId: app.id,
      operatorId: windowStaff.id,
      operatorName: windowStaff.name,
      operatorRole: windowStaff.role,
      operation: '创建公证申请',
      newStatus: 'PENDING_MATERIALS',
      timestamp: daysAgo(13),
    });

    db.addOperationLogWithTimestamp({
      applicationId: app.id,
      operatorId: windowStaff.id,
      operatorName: windowStaff.name,
      operatorRole: windowStaff.role,
      operation: '提交申请材料',
      previousStatus: 'PENDING_MATERIALS',
      newStatus: 'MATERIALS_SUBMITTED',
      timestamp: daysAgo(12),
    });

    db.addOperationLogWithTimestamp({
      applicationId: app.id,
      operatorId: notary.id,
      operatorName: notary.name,
      operatorRole: notary.role,
      operation: '审核材料通过，待缴费',
      previousStatus: 'MATERIALS_SUBMITTED',
      newStatus: 'PENDING_PAYMENT',
      remark: '应缴费用: ¥520.00',
      timestamp: daysAgo(11),
    });

    db.addOperationLogWithTimestamp({
      applicationId: app.id,
      operatorId: windowStaff.id,
      operatorName: windowStaff.name,
      operatorRole: windowStaff.role,
      operation: '提交缴费登记',
      previousStatus: 'PENDING_PAYMENT',
      newStatus: 'PAYMENT_REGISTERED',
      timestamp: daysAgo(10),
    });

    db.addOperationLogWithTimestamp({
      applicationId: app.id,
      operatorId: notary.id,
      operatorName: notary.name,
      operatorRole: notary.role,
      operation: '确认缴费',
      previousStatus: 'PAYMENT_REGISTERED',
      newStatus: 'PENDING_CERTIFICATE_ARRANGEMENT',
      timestamp: daysAgo(9),
    });

    db.addOperationLogWithTimestamp({
      applicationId: app.id,
      operatorId: archivist.id,
      operatorName: archivist.name,
      operatorRole: archivist.role,
      operation: '安排出证',
      previousStatus: 'PENDING_CERTIFICATE_ARRANGEMENT',
      newStatus: 'CERTIFICATE_ARRANGED',
      timestamp: hoursAgo(80),
    });

    console.log('⚠️  卡住案例 - 待发证(超过72小时):', appNo, '状态: CERTIFICATE_ARRANGED');
  }

  function seedStuckAtSupplement() {
    const appNo = '2024' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    const payment = db.addPaymentRecord({
      applicationId: '',
      amount: 0,
      feeItems: [],
      status: 'UNPAID',
    });

    const certificate = db.addCertificateRecord({
      applicationId: '',
      status: 'NOT_ARRANGED',
    });

    const material1 = db.addMaterialRecord({
      name: '身份证原件',
      submittedBy: windowStaff2.id,
      submittedAt: daysAgo(15),
      isOriginal: true,
    });

    const notice = db.addSupplementNotice({
      applicationId: '',
      issuedBy: notary.id,
      issuedAt: daysAgo(10),
      reason: '缺少被继承人死亡证明缺失',
      requiredMaterials: ['被继承人死亡证明原件', '亲属关系证明原件'],
      deadline: daysAgo(3),
      isCompleted: false,
    });

    const app = db.addApplicationWithTimestamps({
      applicationNo: appNo,
      applicantName: '周八',
      applicantIdNo: '110101197503032345',
      notaryType: '继承权公证',
      appointmentNo: 'APPT202401003',
      status: 'SUPPLEMENT_NEEDED',
      materials: [material1],
      supplementNotices: [notice],
      payment,
      certificate,
      createdAt: daysAgo(16),
      updatedAt: daysAgo(10),
    });

    db.updatePaymentRecord(payment.id, { applicationId: app.id });
    db.updateCertificateRecord(certificate.id, { applicationId: app.id });
    db.updateSupplementNotice(notice.id, { applicationId: app.id });

    db.addOperationLogWithTimestamp({
      applicationId: app.id,
      operatorId: windowStaff2.id,
      operatorName: windowStaff2.name,
      operatorRole: windowStaff2.role,
      operation: '创建公证申请',
      newStatus: 'PENDING_MATERIALS',
      timestamp: daysAgo(16),
    });

    db.addOperationLogWithTimestamp({
      applicationId: app.id,
      operatorId: windowStaff2.id,
      operatorName: windowStaff2.name,
      operatorRole: windowStaff2.role,
      operation: '提交申请材料',
      previousStatus: 'PENDING_MATERIALS',
      newStatus: 'MATERIALS_SUBMITTED',
      timestamp: daysAgo(15),
    });

    db.addOperationLogWithTimestamp({
      applicationId: app.id,
      operatorId: notary.id,
      operatorName: notary.name,
      operatorRole: notary.role,
      operation: '发出补正通知',
      previousStatus: 'MATERIALS_SUBMITTED',
      newStatus: 'SUPPLEMENT_NEEDED',
      remark: '补正原因: 缺少被继承人死亡证明缺失',
      timestamp: daysAgo(10),
    });

    console.log('⚠️  卡住案例 - 补正材料逾期:', appNo, '状态: SUPPLEMENT_NEEDED (补正期限已过3天)');
  }

  function seedStuckAtMaterials() {
    const appNo = '2024' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    const payment = db.addPaymentRecord({
      applicationId: '',
      amount: 0,
      feeItems: [],
      status: 'UNPAID',
    });

    const certificate = db.addCertificateRecord({
      applicationId: '',
      status: 'NOT_ARRANGED',
    });

    const app = db.addApplicationWithTimestamps({
      applicationNo: appNo,
      applicantName: '吴九',
      applicantIdNo: '330101198808084567',
      notaryType: '赠与公证',
      status: 'PENDING_MATERIALS',
      materials: [],
      supplementNotices: [],
      payment,
      certificate,
      createdAt: daysAgo(8),
      updatedAt: daysAgo(8),
    });

    db.updatePaymentRecord(payment.id, { applicationId: app.id });
    db.updateCertificateRecord(certificate.id, { applicationId: app.id });

    db.addOperationLogWithTimestamp({
      applicationId: app.id,
      operatorId: windowStaff.id,
      operatorName: windowStaff.name,
      operatorRole: windowStaff.role,
      operation: '创建公证申请',
      newStatus: 'PENDING_MATERIALS',
      remark: `申请号: ${appNo}, 公证类型: 赠与公证`,
      timestamp: daysAgo(8),
    });

    console.log('⚠️  卡住案例 - 待提交材料(超过120小时):', appNo, '状态: PENDING_MATERIALS');
  }

  return {
    windowStaff, windowStaff2, notary, notary2, archivist, archivist2,
  };
}

if (require.main === module) {
  seedData();
}
