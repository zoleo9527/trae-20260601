import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Prescription, Medicine, AuditLog as PrescriptionAuditLog } from '../../modules/prescription/prescription.entity';
import { PrescriptionStatus, PrescriptionAction } from '../../modules/prescription/prescription.enum';
import { MedicineInventory } from '../../modules/inventory/entities/medicine-inventory.entity';
import { NearExpiryAlert, AlertLevel, AlertStatus } from '../../modules/inventory/entities/near-expiry-alert.entity';
import { OffShelfOrder, OffShelfItem } from '../../modules/off-shelf/entities/off-shelf-order.entity';
import { OffShelfStatus, OffShelfReason } from '../../modules/off-shelf/enums/index';
import { TransferOrder, TransferItem } from '../../modules/transfer/entities/transfer-order.entity';
import { TransferStatus, TransferType, TransferPriority, TransferAction } from '../../modules/transfer/enums/index';
import { AuditLog } from '../../modules/audit/audit-log.entity';

const STORES = [
  { id: 'store-001', name: '康宁大药房(中心店)' },
  { id: 'store-002', name: '康宁大药房(城东店)' },
  { id: 'store-003', name: '康宁大药房(城西店)' },
];

const USERS = [
  { id: 'user-staff-01', name: '李小燕', role: 'STAFF', storeId: 'store-001' },
  { id: 'user-staff-02', name: '王大伟', role: 'STAFF', storeId: 'store-002' },
  { id: 'user-pharma-01', name: '张药师', role: 'PHARMACIST', storeId: 'store-001' },
  { id: 'user-pharma-02', name: '刘药师', role: 'PHARMACIST', storeId: 'store-002' },
  { id: 'user-manager-01', name: '陈经理', role: 'MANAGER', storeId: 'store-001' },
];

const MEDICINES_MASTER = [
  { code: 'MED001', name: '阿莫西林胶囊', spec: '0.5g*24粒', manu: '华北制药' },
  { code: 'MED002', name: '布洛芬缓释胶囊', spec: '0.3g*20粒', manu: '中美史克' },
  { code: 'MED003', name: '复方甘草片', spec: '100片', manu: '云南白药' },
  { code: 'MED004', name: '氯雷他定片', spec: '10mg*6片', manu: '扬子江药业' },
  { code: 'MED005', name: '奥美拉唑肠溶胶囊', spec: '20mg*14粒', manu: '阿斯利康' },
  { code: 'MED006', name: '硝苯地平缓释片', spec: '10mg*30片', manu: '拜耳' },
  { code: 'MED007', name: '盐酸二甲双胍片', spec: '0.5g*48片', manu: '中美上海施贵宝' },
  { code: 'MED008', name: '连花清瘟胶囊', spec: '0.35g*24粒', manu: '以岭药业' },
  { code: 'MED009', name: '维生素C片', spec: '100mg*100片', manu: '东北制药' },
  { code: 'MED010', name: '蒙脱石散', spec: '3g*10袋', manu: '博福-益普生' },
];

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

async function runSeed() {
  console.log('🚀 开始初始化数据...');

  const dataSource = new DataSource({
    type: 'better-sqlite3',
    database: './data/pharmacy_ops.db',
    entities: [
      Prescription,
      MedicineInventory,
      NearExpiryAlert,
      OffShelfOrder,
      TransferOrder,
      AuditLog,
    ],
    synchronize: true,
    logging: false,
  });

  await dataSource.initialize();
  console.log('✅ 数据库连接成功');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const now = new Date();

    console.log('📦 插入库存数据...');
    const inventoryItems: MedicineInventory[] = [];
    const inventoryIdMap = new Map<string, string>();

    const inventoryData = [
      { medIndex: 0, batch: 'B20251201', days: 15, qty: 500, price: 25.8, location: 'A-01-01' },
      { medIndex: 1, batch: 'B20251215', days: 28, qty: 1200, price: 32.5, location: 'A-01-02' },
      { medIndex: 2, batch: 'B20260110', days: 45, qty: 800, price: 12.0, location: 'A-02-01' },
      { medIndex: 3, batch: 'B20260220', days: 75, qty: 600, price: 28.9, location: 'A-02-02' },
      { medIndex: 4, batch: 'B20260301', days: 85, qty: 400, price: 65.0, location: 'B-01-01' },
      { medIndex: 5, batch: 'B20260601', days: 180, qty: 300, price: 45.0, location: 'B-01-02' },
      { medIndex: 6, batch: 'B20260801', days: 240, qty: 200, price: 38.0, location: 'B-02-01' },
      { medIndex: 7, batch: 'B20261201', days: 365, qty: 1000, price: 18.8, location: 'C-01-01' },
      { medIndex: 8, batch: 'B20270101', days: 400, qty: 1500, price: 8.5, location: 'C-01-02' },
      { medIndex: 9, batch: 'B20270301', days: 450, qty: 350, price: 22.0, location: 'C-02-01' },
    ];

    for (const item of inventoryData) {
      const med = MEDICINES_MASTER[item.medIndex];
      const id = uuidv4();
      inventoryIdMap.set(`${med.code}-${item.batch}`, id);
      inventoryItems.push({
        id,
        medicineCode: med.code,
        medicineName: med.name,
        specification: med.spec,
        manufacturer: med.manu,
        batchNo: item.batch,
        expiryDate: daysFromNow(item.days),
        quantity: item.qty,
        unit: '盒',
        purchasePrice: +(item.price * 0.6).toFixed(2),
        sellingPrice: item.price,
        storeId: STORES[0].id,
        storeName: STORES[0].name,
        location: item.location,
        lastCountTime: now,
        createdAt: now,
        updatedAt: now,
        alerts: [],
      } as MedicineInventory);
    }
    await queryRunner.manager.save(MedicineInventory, inventoryItems);
    console.log(`✅ 插入 ${inventoryItems.length} 条库存记录`);

    console.log('⚠️  插入近效药预警数据...');
    const alerts: NearExpiryAlert[] = [];
    for (const item of inventoryData.filter(i => i.days <= 90)) {
      const med = MEDICINES_MASTER[item.medIndex];
      const inventoryId = inventoryIdMap.get(`${med.code}-${item.batch}`)!;
      let level: AlertLevel;
      if (item.days <= 30) level = AlertLevel.HIGH;
      else if (item.days <= 60) level = AlertLevel.MEDIUM;
      else level = AlertLevel.LOW;

      alerts.push({
        id: uuidv4(),
        inventoryId,
        medicineCode: med.code,
        medicineName: med.name,
        batchNo: item.batch,
        expiryDate: daysFromNow(item.days),
        currentQuantity: item.qty,
        daysToExpiry: item.days,
        alertLevel: level,
        status: AlertStatus.ACTIVE,
        storeId: STORES[0].id,
        storeName: STORES[0].name,
        createdAt: now,
        updatedAt: now,
      } as NearExpiryAlert);
    }
    await queryRunner.manager.save(NearExpiryAlert, alerts);
    console.log(`✅ 插入 ${alerts.length} 条近效药预警记录`);

    console.log('💊 插入处方数据...');
    const prescriptions: Prescription[] = [];

    const medList1: Medicine[] = [
      { name: '阿莫西林胶囊', specification: '0.5g*24粒', dosage: '0.5g', frequency: '每日3次', quantity: 2, unit: '盒' },
      { name: '布洛芬缓释胶囊', specification: '0.3g*20粒', dosage: '0.3g', frequency: '每日2次', quantity: 1, unit: '盒' },
    ];

    const medList2: Medicine[] = [
      { name: '奥美拉唑肠溶胶囊', specification: '20mg*14粒', dosage: '20mg', frequency: '每日1次', quantity: 3, unit: '盒', remark: '饭前半小时服用' },
    ];

    const medList3: Medicine[] = [
      { name: '连花清瘟胶囊', specification: '0.35g*24粒', dosage: '4粒', frequency: '每日3次', quantity: 2, unit: '盒' },
      { name: '维生素C片', specification: '100mg*100片', dosage: '100mg', frequency: '每日1次', quantity: 1, unit: '瓶' },
    ];

    const rejectAuditLog: PrescriptionAuditLog = {
      beforeState: PrescriptionStatus.REVIEWING,
      afterState: PrescriptionStatus.REJECTED,
      operatorId: USERS[2].id,
      operatorName: USERS[2].name,
      action: PrescriptionAction.REJECT,
      remark: '处方诊断与用药不符，阿莫西林对病毒性感冒无效，请重新确认诊断或调整用药',
      timestamp: new Date(now.getTime() - 3600000 * 2),
    };

    const reviewAuditLog: PrescriptionAuditLog = {
      beforeState: PrescriptionStatus.SUBMITTED,
      afterState: PrescriptionStatus.REVIEWING,
      operatorId: USERS[2].id,
      operatorName: USERS[2].name,
      action: PrescriptionAction.REVIEW,
      timestamp: new Date(now.getTime() - 3600000 * 3),
    };

    const submitAuditLog: PrescriptionAuditLog = {
      beforeState: PrescriptionStatus.DRAFT,
      afterState: PrescriptionStatus.SUBMITTED,
      operatorId: USERS[0].id,
      operatorName: USERS[0].name,
      action: PrescriptionAction.SUBMIT,
      timestamp: new Date(now.getTime() - 3600000 * 5),
    };

    const supplementAuditLog: PrescriptionAuditLog = {
      beforeState: PrescriptionStatus.REJECTED,
      afterState: PrescriptionStatus.SUPPLEMENTED,
      operatorId: USERS[0].id,
      operatorName: USERS[0].name,
      action: PrescriptionAction.SUPPLEMENT,
      remark: '已补充血常规检查报告，确认为细菌感染，C反应蛋白45mg/L',
      timestamp: new Date(now.getTime() - 3600000 * 1),
    };

    prescriptions.push({
      id: uuidv4(),
      prescriptionNo: 'RX20260601001',
      patientName: '张三',
      patientAge: 35,
      patientGender: '男',
      doctorName: '王医生',
      department: '内科',
      diagnosis: '病毒性感冒',
      medicines: medList1,
      remark: '患者有青霉素过敏史记录',
      currentStatus: PrescriptionStatus.REJECTED,
      submitterId: USERS[0].id,
      submitterName: USERS[0].name,
      submitTime: new Date(now.getTime() - 3600000 * 5),
      reviewerId: USERS[2].id,
      reviewerName: USERS[2].name,
      reviewTime: new Date(now.getTime() - 3600000 * 2),
      reviewRemark: '诊断与用药不符，请确认',
      rejectReason: '处方诊断为病毒性感冒，但开具了抗生素阿莫西林。病毒性感冒无需使用抗生素，建议修改诊断或调整用药方案。',
      storeId: STORES[0].id,
      storeName: STORES[0].name,
      auditLogs: [submitAuditLog, reviewAuditLog, rejectAuditLog],
      createdAt: new Date(now.getTime() - 3600000 * 6),
      updatedAt: new Date(now.getTime() - 3600000 * 2),
    } as Prescription);

    prescriptions.push({
      id: uuidv4(),
      prescriptionNo: 'RX20260601002',
      patientName: '李四',
      patientAge: 45,
      patientGender: '男',
      doctorName: '李医生',
      department: '消化内科',
      diagnosis: '慢性浅表性胃炎',
      medicines: medList2,
      currentStatus: PrescriptionStatus.SUBMITTED,
      submitterId: USERS[0].id,
      submitterName: USERS[0].name,
      submitTime: new Date(now.getTime() - 3600000 * 1),
      storeId: STORES[0].id,
      storeName: STORES[0].name,
      auditLogs: [{
        beforeState: PrescriptionStatus.DRAFT,
        afterState: PrescriptionStatus.SUBMITTED,
        operatorId: USERS[0].id,
        operatorName: USERS[0].name,
        action: PrescriptionAction.SUBMIT,
        timestamp: new Date(now.getTime() - 3600000 * 1),
      }],
      createdAt: new Date(now.getTime() - 3600000 * 2),
      updatedAt: new Date(now.getTime() - 3600000 * 1),
    } as Prescription);

    prescriptions.push({
      id: uuidv4(),
      prescriptionNo: 'RX20260601003',
      patientName: '王五',
      patientAge: 28,
      patientGender: '女',
      doctorName: '张医生',
      department: '呼吸内科',
      diagnosis: '上呼吸道感染（细菌感染）',
      medicines: medList1,
      currentStatus: PrescriptionStatus.SUPPLEMENTED,
      submitterId: USERS[0].id,
      submitterName: USERS[0].name,
      submitTime: new Date(now.getTime() - 3600000 * 10),
      reviewerId: USERS[2].id,
      reviewerName: USERS[2].name,
      reviewTime: new Date(now.getTime() - 3600000 * 6),
      rejectReason: '请补充细菌感染的相关检查报告，如血常规、C反应蛋白等',
      supplementRemark: '已补充血常规检查报告，白细胞计数12.5×10^9/L，中性粒细胞85%，C反应蛋白45mg/L，确认细菌感染',
      supplementTime: new Date(now.getTime() - 3600000 * 1),
      storeId: STORES[0].id,
      storeName: STORES[0].name,
      auditLogs: [
        {
          beforeState: PrescriptionStatus.DRAFT,
          afterState: PrescriptionStatus.SUBMITTED,
          operatorId: USERS[0].id,
          operatorName: USERS[0].name,
          action: PrescriptionAction.SUBMIT,
          timestamp: new Date(now.getTime() - 3600000 * 10),
        },
        {
          beforeState: PrescriptionStatus.SUBMITTED,
          afterState: PrescriptionStatus.REVIEWING,
          operatorId: USERS[2].id,
          operatorName: USERS[2].name,
          action: PrescriptionAction.REVIEW,
          timestamp: new Date(now.getTime() - 3600000 * 8),
        },
        {
          beforeState: PrescriptionStatus.REVIEWING,
          afterState: PrescriptionStatus.REJECTED,
          operatorId: USERS[2].id,
          operatorName: USERS[2].name,
          action: PrescriptionAction.REJECT,
          remark: '请补充细菌感染的相关检查报告',
          timestamp: new Date(now.getTime() - 3600000 * 6),
        },
        supplementAuditLog,
      ],
      createdAt: new Date(now.getTime() - 3600000 * 11),
      updatedAt: new Date(now.getTime() - 3600000 * 1),
    } as Prescription);

    prescriptions.push({
      id: uuidv4(),
      prescriptionNo: 'RX20260601004',
      patientName: '赵六',
      patientAge: 52,
      patientGender: '女',
      doctorName: '刘医生',
      department: '全科',
      diagnosis: '流行性感冒',
      medicines: medList3,
      currentStatus: PrescriptionStatus.APPROVED,
      submitterId: USERS[0].id,
      submitterName: USERS[0].name,
      submitTime: new Date(now.getTime() - 3600000 * 8),
      reviewerId: USERS[2].id,
      reviewerName: USERS[2].name,
      reviewTime: new Date(now.getTime() - 3600000 * 4),
      reviewRemark: '处方合理，用药对症',
      storeId: STORES[0].id,
      storeName: STORES[0].name,
      auditLogs: [
        {
          beforeState: PrescriptionStatus.DRAFT,
          afterState: PrescriptionStatus.SUBMITTED,
          operatorId: USERS[0].id,
          operatorName: USERS[0].name,
          action: PrescriptionAction.SUBMIT,
          timestamp: new Date(now.getTime() - 3600000 * 8),
        },
        {
          beforeState: PrescriptionStatus.SUBMITTED,
          afterState: PrescriptionStatus.REVIEWING,
          operatorId: USERS[2].id,
          operatorName: USERS[2].name,
          action: PrescriptionAction.REVIEW,
          timestamp: new Date(now.getTime() - 3600000 * 6),
        },
        {
          beforeState: PrescriptionStatus.REVIEWING,
          afterState: PrescriptionStatus.APPROVED,
          operatorId: USERS[2].id,
          operatorName: USERS[2].name,
          action: PrescriptionAction.APPROVE,
          remark: '处方合理，用药对症',
          timestamp: new Date(now.getTime() - 3600000 * 4),
        },
      ],
      createdAt: new Date(now.getTime() - 3600000 * 9),
      updatedAt: new Date(now.getTime() - 3600000 * 4),
    } as Prescription);

    await queryRunner.manager.save(Prescription, prescriptions);
    console.log(`✅ 插入 ${prescriptions.length} 条处方记录`);
    console.log('   - 1张 REJECTED（药师退回，需门店补充说明）');
    console.log('   - 1张 SUBMITTED（待药师审核）');
    console.log('   - 1张 SUPPLEMENTED（门店已补充，待重新审核）');
    console.log('   - 1张 APPROVED（已审核通过）');

    console.log('📦 插入下架单数据...');
    const offShelfItems: OffShelfItem[] = [
      {
        inventoryId: inventoryIdMap.get(`${MEDICINES_MASTER[0].code}-B20251201`)!,
        medicineName: '阿莫西林胶囊',
        batchNo: 'B20251201',
        expiryDate: formatDate(daysFromNow(15)),
        quantity: 100,
        unit: '盒',
      },
      {
        inventoryId: inventoryIdMap.get(`${MEDICINES_MASTER[1].code}-B20251215`)!,
        medicineName: '布洛芬缓释胶囊',
        batchNo: 'B20251215',
        expiryDate: formatDate(daysFromNow(28)),
        quantity: 200,
        unit: '盒',
      },
    ];

    const offShelfOrders: OffShelfOrder[] = [
      {
        id: uuidv4(),
        orderNo: 'OFF20260601001',
        reason: OffShelfReason.NEAR_EXPIRY,
        reasonDetail: '药品临近有效期，按照门店管理规定执行下架处理',
        items: offShelfItems,
        totalQuantity: 300,
        currentStatus: OffShelfStatus.SUBMITTED,
        submitterId: USERS[0].id,
        submitterName: USERS[0].name,
        submitTime: new Date(now.getTime() - 3600000 * 3),
        storeId: STORES[0].id,
        storeName: STORES[0].name,
        auditLogs: [
          {
            action: 'CREATE',
            operatorId: USERS[0].id,
            operatorName: USERS[0].name,
            fromStatus: '',
            toStatus: OffShelfStatus.CREATED,
            timestamp: new Date(now.getTime() - 3600000 * 4),
            remark: '创建下架单，包含2个近效期品规',
          },
          {
            action: 'SUBMIT',
            operatorId: USERS[0].id,
            operatorName: USERS[0].name,
            fromStatus: OffShelfStatus.CREATED,
            toStatus: OffShelfStatus.SUBMITTED,
            timestamp: new Date(now.getTime() - 3600000 * 3),
            remark: '提交下架单，待药师复核',
          },
        ],
        createdAt: new Date(now.getTime() - 3600000 * 4),
        updatedAt: new Date(now.getTime() - 3600000 * 3),
      } as OffShelfOrder,
    ];
    await queryRunner.manager.save(OffShelfOrder, offShelfOrders);
    console.log(`✅ 插入 ${offShelfOrders.length} 条下架单记录`);
    console.log('   - 1张 SUBMITTED（门店已下架，待药师复核）');
    console.log('   - 包含阿莫西林（15天到期）、布洛芬（28天到期）各100/200盒');

    console.log('🚚 插入调拨单数据...');
    const transferItems1: TransferItem[] = [
      {
        medicineCode: MEDICINES_MASTER[0].code,
        medicineName: '阿莫西林胶囊',
        batchNo: 'B20251201',
        expiryDate: formatDate(daysFromNow(15)),
        quantity: 100,
        unit: '盒',
        sellingPrice: 25.8,
        subtotal: 2580.0,
        inventoryId: inventoryIdMap.get(`${MEDICINES_MASTER[0].code}-B20251201`)!,
      },
    ];

    const transferItems2: TransferItem[] = [
      {
        medicineCode: MEDICINES_MASTER[2].code,
        medicineName: '复方甘草片',
        batchNo: 'B20260110',
        expiryDate: formatDate(daysFromNow(45)),
        quantity: 200,
        unit: '盒',
        sellingPrice: 12.0,
        subtotal: 2400.0,
        inventoryId: inventoryIdMap.get(`${MEDICINES_MASTER[2].code}-B20260110`)!,
      },
      {
        medicineCode: MEDICINES_MASTER[3].code,
        medicineName: '氯雷他定片',
        batchNo: 'B20260220',
        expiryDate: formatDate(daysFromNow(75)),
        quantity: 150,
        unit: '盒',
        sellingPrice: 28.9,
        subtotal: 4335.0,
        inventoryId: inventoryIdMap.get(`${MEDICINES_MASTER[3].code}-B20260220`)!,
      },
    ];

    const transferOrders: TransferOrder[] = [
      {
        id: uuidv4(),
        orderNo: 'TR20260601001',
        transferType: TransferType.ALLOCATION,
        fromStoreId: STORES[0].id,
        fromStoreName: STORES[0].name,
        toStoreId: STORES[1].id,
        toStoreName: STORES[1].name,
        items: transferItems1,
        totalQuantity: 100,
        totalAmount: 2580.0,
        currentStatus: TransferStatus.SUBMITTED,
        priority: TransferPriority.URGENT,
        expectedDate: formatDate(daysFromNow(3)),
        remark: '阿莫西林库存积压严重，有效期仅剩15天，紧急调拨至城东店销售',
        submitterId: USERS[0].id,
        submitterName: USERS[0].name,
        submitTime: new Date(now.getTime() - 3600000 * 5),
        storeId: STORES[0].id,
        storeName: STORES[0].name,
        auditLogs: [
          {
            action: TransferAction.SUBMIT,
            fromStatus: TransferStatus.DRAFT,
            toStatus: TransferStatus.SUBMITTED,
            operatorId: USERS[0].id,
            operatorName: USERS[0].name,
            operateTime: new Date(now.getTime() - 3600000 * 5),
            remark: '提交调拨申请，有效期仅剩15天，请尽快审批',
          },
        ],
        createdAt: new Date(now.getTime() - 3600000 * 6),
        updatedAt: new Date(now.getTime() - 3600000 * 5),
      } as TransferOrder,
      {
        id: uuidv4(),
        orderNo: 'TR20260601002',
        transferType: TransferType.ALLOCATION,
        fromStoreId: STORES[0].id,
        fromStoreName: STORES[0].name,
        toStoreId: STORES[2].id,
        toStoreName: STORES[2].name,
        items: transferItems2,
        totalQuantity: 350,
        totalAmount: 6735.0,
        currentStatus: TransferStatus.SUBMITTED,
        priority: TransferPriority.MEDIUM,
        expectedDate: formatDate(daysFromNow(7)),
        remark: '常规库存调拨，优化库存结构',
        submitterId: USERS[0].id,
        submitterName: USERS[0].name,
        submitTime: new Date(now.getTime() - 3600000 * 2),
        storeId: STORES[0].id,
        storeName: STORES[0].name,
        auditLogs: [
          {
            action: TransferAction.SUBMIT,
            fromStatus: TransferStatus.DRAFT,
            toStatus: TransferStatus.SUBMITTED,
            operatorId: USERS[0].id,
            operatorName: USERS[0].name,
            operateTime: new Date(now.getTime() - 3600000 * 2),
            remark: '提交常规调拨申请',
          },
        ],
        createdAt: new Date(now.getTime() - 3600000 * 3),
        updatedAt: new Date(now.getTime() - 3600000 * 2),
      } as TransferOrder,
      {
        id: uuidv4(),
        orderNo: 'TR20260601003',
        transferType: TransferType.ALLOCATION,
        fromStoreId: STORES[1].id,
        fromStoreName: STORES[1].name,
        toStoreId: STORES[0].id,
        toStoreName: STORES[0].name,
        items: [{
          medicineCode: MEDICINES_MASTER[7].code,
          medicineName: '连花清瘟胶囊',
          batchNo: 'B20260501',
          expiryDate: formatDate(daysFromNow(150)),
          quantity: 50,
          unit: '盒',
          sellingPrice: 18.8,
          subtotal: 940.0,
        }],
        totalQuantity: 50,
        totalAmount: 940.0,
        currentStatus: TransferStatus.APPROVED,
        priority: TransferPriority.HIGH,
        expectedDate: formatDate(daysFromNow(2)),
        remark: '中心店连花清瘟缺货，紧急从城东店调入',
        submitterId: USERS[1].id,
        submitterName: USERS[1].name,
        submitTime: new Date(now.getTime() - 3600000 * 12),
        approverId: USERS[4].id,
        approverName: USERS[4].name,
        approveTime: new Date(now.getTime() - 3600000 * 8),
        approveRemark: '情况属实，同意调拨',
        storeId: STORES[1].id,
        storeName: STORES[1].name,
        rejectReason: null as any,
        completedBy: null as any,
        completedAt: null as any,
        auditLogs: [
          {
            action: TransferAction.SUBMIT,
            fromStatus: TransferStatus.DRAFT,
            toStatus: TransferStatus.SUBMITTED,
            operatorId: USERS[1].id,
            operatorName: USERS[1].name,
            operateTime: new Date(now.getTime() - 3600000 * 12),
          },
          {
            action: TransferAction.APPROVE,
            fromStatus: TransferStatus.SUBMITTED,
            toStatus: TransferStatus.APPROVED,
            operatorId: USERS[4].id,
            operatorName: USERS[4].name,
            operateTime: new Date(now.getTime() - 3600000 * 8),
            remark: '情况属实，同意调拨',
          },
        ],
        createdAt: new Date(now.getTime() - 3600000 * 13),
        updatedAt: new Date(now.getTime() - 3600000 * 8),
      } as any,
    ];
    await queryRunner.manager.save(TransferOrder, transferOrders);
    console.log(`✅ 插入 ${transferOrders.length} 条调拨单记录`);
    console.log('   - 2张 SUBMITTED（待区域经理审批，可测试批量审批）');
    console.log('   - 1张 APPROVED（已审批通过，待执行）');

    await queryRunner.commitTransaction();
    console.log('\n🎉 数据初始化完成！');
    console.log('\n📋 样例场景说明：');
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│ 1. 处方 RX20260601001: REJECTED 状态                      │');
    console.log('│    药师退回（诊断病毒性感冒却开了抗生素）                   │');
    console.log('│    可测试: POST /prescriptions/:id/supplement 补充说明     │');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log('│ 2. 处方 RX20260601003: SUPPLEMENTED 状态                  │');
    console.log('│    门店已补充检查报告，待药师重新审核                       │');
    console.log('│    可测试: POST /prescriptions/:id/review → approve        │');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log('│ 3. 近效药预警: 5条预警                                      │');
    console.log('│    阿莫西林 500盒 剩15天 (HIGH)                             │');
    console.log('│    布洛芬 1200盒 剩28天 (HIGH)                             │');
    console.log('│    复方甘草片 800盒 剩45天 (MEDIUM)                        │');
    console.log('│    氯雷他定 600盒 剩75天 (LOW)                             │');
    console.log('│    奥美拉唑 400盒 剩85天 (LOW)                             │');
    console.log('│    可测试: POST /inventory/alerts/:id/acknowledge/resolve  │');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log('│ 4. 下架单 OFF20260601001: SUBMITTED 状态                  │');
    console.log('│    门店已下架阿莫西林100盒+布洛芬200盒，待药师复核           │');
    console.log('│    可测试: POST /off-shelf/:id/confirm 或 /reject          │');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log('│ 5. 调拨单 TR20260601001/002: SUBMITTED 状态               │');
    console.log('│    待区域经理审批，可测试批量审批                            │');
    console.log('│    可测试: POST /transfers/batch-approve                   │');
    console.log('└─────────────────────────────────────────────────────────┘');

    console.log('\n👤 测试账号：');
    console.log('   店员李小燕:  X-User-Id=user-staff-01,  X-User-Role=STAFF');
    console.log('   药师张药师:  X-User-Id=user-pharma-01, X-User-Role=PHARMACIST');
    console.log('   经理陈经理:  X-User-Id=user-manager-01,X-User-Role=MANAGER');
    console.log('   门店:        X-Store-Id=store-001');

    console.log('\n🔑 幂等请求: 任意非GET请求需传 X-Request-Id 请求头');

  } catch (error) {
    console.error('❌ 数据初始化失败:', error);
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

runSeed().catch(console.error);
