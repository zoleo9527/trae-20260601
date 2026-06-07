import { v4 as uuidv4 } from 'uuid';
import { db, initDatabase } from './db';

export function resetDemoData() {
  initDatabase();

  const tables = [
    'medication_records',
    'disease_case_audits',
    'disease_case_medicines',
    'disease_cases',
    'feed_records',
    'inspections',
    'medicines',
    'ponds',
    'users',
    'idempotency_keys',
  ];

  for (const table of tables) {
    db.prepare(`DELETE FROM "${table}"`).run();
  }

  console.log('已清空所有演示数据');

  const tx = db.transaction(() => {
    const users = [
      { id: uuidv4(), name: '李技术', role: 'TECHNICIAN', phone: '13800138001' },
      { id: uuidv4(), name: '王技术', role: 'TECHNICIAN', phone: '13800138002' },
      { id: uuidv4(), name: '张仓管', role: 'WAREHOUSE_KEEPER', phone: '13800138003' },
      { id: uuidv4(), name: '刘场长', role: 'FIELD_MANAGER', phone: '13800138004' },
    ];
    
    for (const u of users) {
      db.prepare('INSERT INTO users (id, name, role, phone) VALUES (?, ?, ?, ?)').run(u.id, u.name, u.role, u.phone);
    }

    const ponds = [
      { id: uuidv4(), name: '1号塘', area: 5.2, breed_type: '南美白对虾', stock_quantity: 80000, status: 'NORMAL' },
      { id: uuidv4(), name: '2号塘', area: 4.8, breed_type: '南美白对虾', stock_quantity: 75000, status: 'NORMAL' },
      { id: uuidv4(), name: '3号塘', area: 6.0, breed_type: '草鱼', stock_quantity: 12000, status: 'NORMAL' },
      { id: uuidv4(), name: '4号塘', area: 5.5, breed_type: '鲫鱼', stock_quantity: 15000, status: 'NORMAL' },
      { id: uuidv4(), name: '5号塘', area: 4.5, breed_type: '南美白对虾', stock_quantity: 70000, status: 'DISEASED' },
    ];
    
    for (const p of ponds) {
      db.prepare('INSERT INTO ponds (id, name, area, breed_type, stock_quantity, status) VALUES (?, ?, ?, ?, ?, ?)')
        .run(p.id, p.name, p.area, p.breed_type, p.stock_quantity, p.status);
    }

    const medicines = [
      { id: uuidv4(), name: '聚维酮碘溶液', specification: '10% 500ml/瓶', manufacturer: '某水产药业', unit: '瓶', stock_quantity: 50, safety_interval_days: 7 },
      { id: uuidv4(), name: '二氧化氯泡腾片', specification: '12% 1kg/袋', manufacturer: '某环保科技', unit: '袋', stock_quantity: 80, safety_interval_days: 5 },
      { id: uuidv4(), name: '恩诺沙星粉', specification: '10% 500g/袋', manufacturer: '某动物药业', unit: '袋', stock_quantity: 30, safety_interval_days: 14 },
      { id: uuidv4(), name: '肝胆利康散', specification: '500g/袋', manufacturer: '某中药厂', unit: '袋', stock_quantity: 45, safety_interval_days: 3 },
      { id: uuidv4(), name: 'EM益生菌', specification: '1L/瓶', manufacturer: '某生物科技', unit: '瓶', stock_quantity: 100, safety_interval_days: 0 },
    ];
    
    for (const m of medicines) {
      db.prepare('INSERT INTO medicines (id, name, specification, manufacturer, unit, stock_quantity, safety_interval_days) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(m.id, m.name, m.specification, m.manufacturer, m.unit, m.stock_quantity, m.safety_interval_days);
    }

    const techUsers = users.filter(u => u.role === 'TECHNICIAN');
    const baseDate = new Date();
    for (let i = 0; i < 15; i++) {
      const inspectDate = new Date(baseDate.getTime() - i * 24 * 60 * 60 * 1000);
      for (const pond of ponds.slice(0, 3)) {
        const inspector = techUsers[Math.floor(Math.random() * techUsers.length)];
        db.prepare(`
          INSERT INTO inspections (id, pond_id, inspector_id, inspect_date, water_temperature, ph_value, dissolved_oxygen, abnormal_found, description)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          uuidv4(),
          pond.id,
          inspector.id,
          inspectDate.toISOString().split('T')[0],
          26 + Math.random() * 3,
          7.5 + Math.random() * 0.8,
          5.5 + Math.random() * 2,
          0,
          '水质正常，虾群摄食良好'
        );
      }
    }

    for (let i = 0; i < 10; i++) {
      const feedDate = new Date(baseDate.getTime() - i * 24 * 60 * 60 * 1000);
      for (const pond of ponds.slice(0, 4)) {
        const feeder = techUsers[Math.floor(Math.random() * techUsers.length)];
        db.prepare(`
          INSERT INTO feed_records (id, pond_id, feeder_id, feed_date, feed_type, feed_quantity)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          uuidv4(),
          pond.id,
          feeder.id,
          feedDate.toISOString().split('T')[0],
          '配合饲料',
          pond.breed_type === '南美白对虾' ? 15 + Math.random() * 5 : 40 + Math.random() * 10
        );
      }
    }

    const sampleCaseId = uuidv4();
    const sampleCaseNo = `DH${baseDate.getFullYear()}${String(baseDate.getMonth() + 1).padStart(2, '0')}${String(baseDate.getDate() - 2).padStart(2, '0')}0001`;
    
    db.prepare(`
      INSERT INTO disease_cases (
        id, case_no, pond_id, reporter_id, report_date, disease_name, disease_description,
        severity, suggested_medication, status, current_handler_role,
        medicine_allocated_by, medicine_allocated_at, approved_by, approved_at,
        medicated_by, medicated_at, closed_by, closed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      sampleCaseId,
      sampleCaseNo,
      ponds[4].id,
      techUsers[0].id,
      new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      '虾弧菌病',
      '5号塘虾出现摄食下降，部分虾体发红，鳃丝发黄，死虾数量约50尾/天',
      'MODERATE',
      '建议先消毒，再拌饵投喂抗生素',
      'CLOSED',
      'TECHNICIAN',
      users[2].id,
      new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      users[3].id,
      new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      techUsers[0].id,
      new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      users[3].id,
      new Date().toISOString()
    );

    const pvId = medicines[0].id;
    const enroId = medicines[2].id;
    
    db.prepare(`
      INSERT INTO disease_case_medicines (id, disease_case_id, medicine_id, suggested_quantity, actual_quantity, dosage, usage_method)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), sampleCaseId, pvId, 3, 3, '1瓶/亩·米', '全池泼洒');
    
    db.prepare(`
      INSERT INTO disease_case_medicines (id, disease_case_id, medicine_id, suggested_quantity, actual_quantity, dosage, usage_method)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), sampleCaseId, enroId, 2, 2, '20mg/kg体重', '拌饵投喂，连用3-5天');

    const auditActions = [
      { action: 'CREATE_DRAFT', remark: '创建病害处理单草稿', oldStatus: null, newStatus: 'DRAFT' },
      { action: 'SUBMIT', remark: '提交审核', oldStatus: 'DRAFT', newStatus: 'SUBMITTED' },
      { action: 'ALLOCATE_MEDICINE', remark: '完成药品配货出库', oldStatus: 'SUBMITTED', newStatus: 'MEDICINE_ALLOCATED' },
      { action: 'APPROVE', remark: '审批通过，注意休药期', oldStatus: 'MEDICINE_ALLOCATED', newStatus: 'APPROVED' },
      { action: 'RECORD_MEDICATION', remark: '已按方案用药，观察效果', oldStatus: 'APPROVED', newStatus: 'MEDICATED' },
      { action: 'CLOSE', remark: '用药3天后死虾减少，病情控制，结案', oldStatus: 'MEDICATED', newStatus: 'CLOSED' },
    ];
    
    for (let i = 0; i < auditActions.length; i++) {
      const a = auditActions[i];
      const operator = i === 0 || i === 1 || i === 4 ? techUsers[0] : (i === 2 ? users[2] : users[3]);
      const role = i === 0 || i === 1 || i === 4 ? 'TECHNICIAN' : (i === 2 ? 'WAREHOUSE_KEEPER' : 'FIELD_MANAGER');
      db.prepare(`
        INSERT INTO disease_case_audits (id, disease_case_id, operator_id, operator_role, action, remark, old_status, new_status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(),
        sampleCaseId,
        operator.id,
        role,
        a.action,
        a.remark,
        a.oldStatus,
        a.newStatus,
        new Date(baseDate.getTime() - (5 - i) * 3600 * 1000).toISOString()
      );
    }

    db.prepare(`
      INSERT INTO medication_records (id, disease_case_id, pond_id, medicine_id, quantity, operator_id, medication_date, usage_method, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(), sampleCaseId, ponds[4].id, pvId, 3, techUsers[0].id,
      new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      '全池泼洒', '上午9点泼洒，开启增氧机'
    );
    
    db.prepare(`
      INSERT INTO medication_records (id, disease_case_id, pond_id, medicine_id, quantity, operator_id, medication_date, usage_method, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(), sampleCaseId, ponds[4].id, enroId, 2, techUsers[0].id,
      new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      '拌饵投喂', '按20mg/kg体重拌料，连喂5天'
    );

    const rejectedCaseId = uuidv4();
    const rejectedCaseNo = `DH${baseDate.getFullYear()}${String(baseDate.getMonth() + 1).padStart(2, '0')}${String(baseDate.getDate()).padStart(2, '0')}0002`;
    
    db.prepare(`
      INSERT INTO disease_cases (
        id, case_no, pond_id, reporter_id, report_date, disease_name, disease_description,
        severity, suggested_medication, status, current_handler_role,
        reject_reason, rejected_by, rejected_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      rejectedCaseId,
      rejectedCaseNo,
      ponds[1].id,
      techUsers[1].id,
      new Date().toISOString().split('T')[0],
      '细菌性烂鳃',
      '2号塘草鱼出现离群独游，鳃丝肿胀发黑，水质检测氨氮偏高',
      'SEVERE',
      '建议外用消毒+内服抗菌',
      'REJECTED',
      'TECHNICIAN',
      '1. 缺少具体的水质指标（氨氮、亚盐具体数值）；2. 用药方案未标明休药期；3. 建议先调水再用药，请补充完整后重新提交',
      users[3].id,
      new Date().toISOString()
    );

    db.prepare(`
      INSERT INTO disease_case_medicines (id, disease_case_id, medicine_id, suggested_quantity, dosage, usage_method)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), rejectedCaseId, medicines[1].id, 4, '250g/亩·米', '全池泼洒');

    const rejectAudits = [
      { action: 'CREATE_DRAFT', remark: '创建病害处理单草稿', oldStatus: null, newStatus: 'DRAFT', op: techUsers[1], role: 'TECHNICIAN' },
      { action: 'SUBMIT', remark: '提交审核', oldStatus: 'DRAFT', newStatus: 'SUBMITTED', op: techUsers[1], role: 'TECHNICIAN' },
      { action: 'REJECT', remark: '1. 缺少具体的水质指标（氨氮、亚盐具体数值）；2. 用药方案未标明休药期；3. 建议先调水再用药，请补充完整后重新提交', oldStatus: 'SUBMITTED', newStatus: 'REJECTED', op: users[3], role: 'FIELD_MANAGER' },
    ];
    
    for (const a of rejectAudits) {
      db.prepare(`
        INSERT INTO disease_case_audits (id, disease_case_id, operator_id, operator_role, action, remark, old_status, new_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), rejectedCaseId, a.op.id, a.role, a.action, a.remark, a.oldStatus, a.newStatus);
    }

    const submittedCaseId = uuidv4();
    const submittedCaseNo = `DH${baseDate.getFullYear()}${String(baseDate.getMonth() + 1).padStart(2, '0')}${String(baseDate.getDate()).padStart(2, '0')}0003`;
    
    db.prepare(`
      INSERT INTO disease_cases (
        id, case_no, pond_id, reporter_id, report_date, disease_name, disease_description,
        severity, suggested_medication, status, current_handler_role
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      submittedCaseId,
      submittedCaseNo,
      ponds[2].id,
      techUsers[0].id,
      new Date().toISOString().split('T')[0],
      '肠炎病',
      '3号塘草鱼出现肛门红肿，肠道充血，粪便漂浮',
      'MILD',
      '建议内服益生菌+抗菌药',
      'SUBMITTED',
      'WAREHOUSE_KEEPER'
    );

    db.prepare(`
      INSERT INTO disease_case_medicines (id, disease_case_id, medicine_id, suggested_quantity, dosage, usage_method)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), submittedCaseId, medicines[3].id, 3, '0.5%饲料添加', '拌饵投喂，连喂7天');

    db.prepare(`
      INSERT INTO disease_case_audits (id, disease_case_id, operator_id, operator_role, action, remark, old_status, new_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), submittedCaseId, techUsers[0].id, 'TECHNICIAN', 'CREATE_DRAFT', '创建病害处理单草稿', null, 'DRAFT');
    
    db.prepare(`
      INSERT INTO disease_case_audits (id, disease_case_id, operator_id, operator_role, action, remark, old_status, new_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), submittedCaseId, techUsers[0].id, 'TECHNICIAN', 'SUBMIT', '提交审核', 'DRAFT', 'SUBMITTED');
  });

  tx();
  console.log('演示数据重置完成');

  return {
    message: '演示数据已重置',
    resetAt: new Date().toISOString(),
  };
}

export function seed() {
  initDatabase();
  const existingUsers = db.prepare('SELECT COUNT(*) as cnt FROM users').get() as any;
  if (existingUsers.cnt > 0) {
    console.log('种子数据已存在，跳过');
    return;
  }
  resetDemoData();
}

if (require.main === module) {
  seed();
}
