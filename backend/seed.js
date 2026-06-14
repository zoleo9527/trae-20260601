import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import './models/database.js';
import db from './models/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🌱 开始初始化演示数据...\n');

const passwordHash = bcrypt.hashSync('demo123', 10);
const adminHash = bcrypt.hashSync('admin123', 10);

const users = [
  { username: 'acceptor01', password: passwordHash, role: 'acceptor', name: '张受理', organization: '司法鉴定所', email: 'acceptor01@judicial.gov' },
  { username: 'appraiser01', password: passwordHash, role: 'appraiser', name: '李鉴定', organization: '司法鉴定所', email: 'appraiser01@judicial.gov' },
  { username: 'qc01', password: passwordHash, role: 'qc_reviewer', name: '王质控', organization: '司法鉴定所', email: 'qc01@judicial.gov' },
  { username: 'admin', password: adminHash, role: 'admin', name: '系统管理员', organization: '司法鉴定所', email: 'admin@judicial.gov' }
];

const insertUser = db.prepare(`
  INSERT OR REPLACE INTO users (username, password, role, name, organization, email, status)
  VALUES (?, ?, ?, ?, ?, ?, 'active')
`);

users.forEach(user => {
  insertUser.run(user.username, user.password, user.role, user.name, user.organization, user.email);
  console.log(`✓ 创建用户: ${user.username} (${user.role})`);
});

console.log('\n👤 用户初始化完成\n');

const delegations = [
  {
    delegation_number: 'DEL-2024-001',
    status: 'PENDING_ACCEPTANCE',
    applicant_name: '李明',
    applicant_organization: '北京市公安局交通管理局',
    applicant_contact: '13800138001',
    applicant_id_card: '110101199001011234',
    case_type: '交通事故',
    case_description: '2024年1月15日在朝阳区发生交通事故，需进行车辆技术鉴定和痕迹鉴定',
    incident_date: '2024-01-15',
    incident_location: '北京市朝阳区建国路',
    appraisal_items: JSON.stringify(['车辆技术鉴定', '痕迹鉴定']),
    expected_completion_date: '2024-02-15',
    current_assignee: 'acceptor01',
    created_by: 'acceptor01',
    is_abnormal: 0,
    materials: [
      { name: '委托书', type: '官方文书', required: 1, provided: 1 },
      { name: '身份证明', type: '证件', required: 1, provided: 1 },
      { name: '事故现场照片', type: '影像资料', required: 0, provided: 1 }
    ]
  },
  {
    delegation_number: 'DEL-2024-002',
    status: 'MATERIAL_INCOMPLETE',
    applicant_name: '王强',
    applicant_organization: '海淀区人民法院',
    applicant_contact: '13900139002',
    applicant_id_card: '110108199203031234',
    case_type: '民事纠纷',
    case_description: '房屋产权纠纷，需进行笔迹鉴定和文件形成时间鉴定',
    incident_date: '2024-01-10',
    incident_location: '北京市海淀区',
    appraisal_items: JSON.stringify(['笔迹鉴定', '文件形成时间鉴定']),
    expected_completion_date: '2024-02-10',
    current_assignee: 'appraiser01',
    created_by: 'acceptor01',
    is_abnormal: 1,
    abnormal_type: '缺材料',
    abnormal_reason: '缺少笔迹样本原件',
    materials: [
      { name: '委托书', type: '官方文书', required: 1, provided: 1 },
      { name: '身份证明', type: '证件', required: 1, provided: 1 },
      { name: '笔迹样本原件', type: '鉴定材料', required: 1, provided: 0 },
      { name: '争议文件', type: '鉴定材料', required: 1, provided: 1 }
    ]
  },
  {
    delegation_number: 'DEL-2024-003',
    status: 'ON_HOLD',
    applicant_name: '赵军',
    applicant_organization: '西城区人民检察院',
    applicant_contact: '13700137003',
    applicant_id_card: '110102198505051234',
    case_type: '刑事案件',
    case_description: '盗窃案物证鉴定，需进行指纹鉴定和DNA鉴定',
    incident_date: '2024-01-08',
    incident_location: '北京市西城区',
    appraisal_items: JSON.stringify(['指纹鉴定', 'DNA鉴定']),
    expected_completion_date: '2024-01-25',
    current_assignee: 'acceptor01',
    created_by: 'acceptor01',
    is_abnormal: 1,
    abnormal_type: '超时',
    abnormal_reason: '超过预计完成时间15天',
    materials: [
      { name: '委托书', type: '官方文书', required: 1, provided: 1, verification_status: 'passed', verification_notes: '委托书完整，印章清晰', verified_by: 'appraiser01', verified_at: '2024-01-09 10:30:00' },
      { name: '身份证明', type: '证件', required: 1, provided: 1, verification_status: 'passed', verification_notes: '身份证复印件清晰可辨', verified_by: 'appraiser01', verified_at: '2024-01-09 10:35:00' },
      { name: '物证样本', type: '鉴定材料', required: 1, provided: 1, verification_status: 'passed', verification_notes: '物证样本包装完好，符合鉴定要求', verified_by: 'appraiser01', verified_at: '2024-01-09 10:40:00' }
    ]
  },
  {
    delegation_number: 'DEL-2024-004',
    status: 'QC_REJECTED',
    applicant_name: '孙伟',
    applicant_organization: '东城区人民法院',
    applicant_contact: '13600136004',
    applicant_id_card: '110101199308081234',
    case_type: '合同纠纷',
    case_description: '合同签名真伪鉴定',
    incident_date: '2024-01-05',
    incident_location: '北京市东城区',
    appraisal_items: JSON.stringify(['笔迹鉴定', '印章鉴定']),
    expected_completion_date: '2024-02-05',
    current_assignee: 'appraiser01',
    created_by: 'acceptor01',
    is_abnormal: 1,
    abnormal_type: '复核不通过',
    abnormal_reason: '鉴定报告格式不规范，需重新出具',
    materials: [
      { name: '委托书', type: '官方文书', required: 1, provided: 1 },
      { name: '身份证明', type: '证件', required: 1, provided: 1 },
      { name: '合同原件', type: '鉴定材料', required: 1, provided: 1 },
      { name: '比对样本', type: '鉴定材料', required: 1, provided: 1 }
    ]
  },
  {
    delegation_number: 'DEL-2024-005',
    status: 'VERIFICATION_FAILED',
    applicant_name: '周杰',
    applicant_organization: '丰台区公安分局',
    applicant_contact: '13500135005',
    applicant_id_card: '110106199011111234',
    case_type: '交通事故',
    case_description: '车辆损坏程度鉴定',
    incident_date: '2024-01-12',
    incident_location: '北京市丰台区',
    appraisal_items: JSON.stringify(['车辆损失鉴定']),
    expected_completion_date: '2024-02-12',
    current_assignee: 'appraiser01',
    created_by: 'acceptor01',
    is_abnormal: 1,
    abnormal_type: '核验不通过',
    abnormal_reason: '事故现场照片不清晰，无法进行准确鉴定',
    materials: [
      { name: '委托书', type: '官方文书', required: 1, provided: 1 },
      { name: '身份证明', type: '证件', required: 1, provided: 1 },
      { name: '车辆照片', type: '影像资料', required: 1, provided: 1, blurry: true },
      { name: '维修清单', type: '证明材料', required: 0, provided: 1 }
    ]
  },
  {
    delegation_number: 'DEL-2024-006',
    status: 'QC_REVIEW_PENDING',
    applicant_name: '吴磊',
    applicant_organization: '石景山区人民法院',
    applicant_contact: '13400134006',
    applicant_id_card: '110107199405051234',
    case_type: '遗产纠纷',
    case_description: '遗嘱真伪鉴定',
    incident_date: '2024-01-03',
    incident_location: '北京市石景山区',
    appraisal_items: JSON.stringify(['笔迹鉴定', '纸张鉴定']),
    expected_completion_date: '2024-02-03',
    current_assignee: 'qc01',
    created_by: 'acceptor01',
    is_abnormal: 0,
    materials: [
      { name: '委托书', type: '官方文书', required: 1, provided: 1, verification_status: 'passed', verification_notes: '委托书格式规范，内容完整', verified_by: 'appraiser01', verified_at: '2024-01-04 09:00:00' },
      { name: '身份证明', type: '证件', required: 1, provided: 1, verification_status: 'passed', verification_notes: '身份证明材料齐全', verified_by: 'appraiser01', verified_at: '2024-01-04 09:05:00' },
      { name: '遗嘱原件', type: '鉴定材料', required: 1, provided: 1, verification_status: 'passed', verification_notes: '遗嘱原件保存完好，字迹清晰', verified_by: 'appraiser01', verified_at: '2024-01-04 09:10:00' },
      { name: '被继承人笔迹样本', type: '鉴定材料', required: 1, provided: 1, verification_status: 'passed', verification_notes: '笔迹样本数量充足，符合比对要求', verified_by: 'appraiser01', verified_at: '2024-01-04 09:15:00' }
    ]
  },
  {
    delegation_number: 'DEL-2024-007',
    status: 'COMPLETED',
    applicant_name: '郑涛',
    applicant_organization: '大兴区人民法院',
    applicant_contact: '13300133007',
    applicant_id_card: '110115199206061234',
    case_type: '医疗纠纷',
    case_description: '医疗事故技术鉴定',
    incident_date: '2023-12-20',
    incident_location: '北京市大兴区',
    appraisal_items: JSON.stringify(['医疗行为鉴定', '因果关系鉴定']),
    expected_completion_date: '2024-01-20',
    current_assignee: 'acceptor01',
    created_by: 'acceptor01',
    is_abnormal: 0,
    completion_date: '2024-01-18',
    materials: [
      { name: '委托书', type: '官方文书', required: 1, provided: 1, verification_status: 'passed', verification_notes: '委托书完整有效', verified_by: 'appraiser01', verified_at: '2023-12-21 14:00:00' },
      { name: '身份证明', type: '证件', required: 1, provided: 1, verification_status: 'passed', verification_notes: '身份证明材料真实有效', verified_by: 'appraiser01', verified_at: '2023-12-21 14:05:00' },
      { name: '病历资料', type: '医疗记录', required: 1, provided: 1, verification_status: 'passed', verification_notes: '病历资料完整，记录清晰', verified_by: 'appraiser01', verified_at: '2023-12-21 14:10:00' },
      { name: '检查报告', type: '医疗记录', required: 1, provided: 1, verification_status: 'passed', verification_notes: '检查报告齐全，数据准确', verified_by: 'appraiser01', verified_at: '2023-12-21 14:15:00' }
    ]
  }
];

const insertDelegation = db.prepare(`
  INSERT OR REPLACE INTO delegations (
    delegation_number, status, applicant_name, applicant_organization,
    applicant_contact, applicant_id_card, case_type, case_description,
    incident_date, incident_location, appraisal_items, expected_completion_date,
    current_assignee, created_by, is_abnormal, abnormal_type, abnormal_reason, completion_date
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertMaterial = db.prepare(`
  INSERT INTO materials (delegation_id, material_name, material_type, is_required, is_provided, verification_status, verification_notes, verified_by, verified_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertAuditLog = db.prepare(`
  INSERT INTO audit_logs (
    delegation_id, action_type, previous_status, new_status,
    operator_username, operator_role, operator_name, remarks, details
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

delegations.forEach((delegation, index) => {
  const result = insertDelegation.run(
    delegation.delegation_number,
    delegation.status,
    delegation.applicant_name,
    delegation.applicant_organization,
    delegation.applicant_contact,
    delegation.applicant_id_card,
    delegation.case_type,
    delegation.case_description,
    delegation.incident_date,
    delegation.incident_location,
    delegation.appraisal_items,
    delegation.expected_completion_date,
    delegation.current_assignee,
    delegation.created_by,
    delegation.is_abnormal,
    delegation.abnormal_type || null,
    delegation.abnormal_reason || null,
    delegation.completion_date || null
  );

  const delegationId = result.lastInsertRowid;
  console.log(`✓ 创建委托单: ${delegation.delegation_number} (${delegation.status})`);

  const materialIdMap = {};
  delegation.materials.forEach((material, index) => {
    const materialResult = db.prepare('SELECT last_insert_rowid() as id').get();
    insertMaterial.run(
      delegationId, 
      material.name, 
      material.type, 
      material.required, 
      material.provided,
      material.verification_status || 'pending',
      material.verification_notes || null,
      material.verified_by || null,
      material.verified_at || null
    );
    materialIdMap[material.name] = materialResult.id;
  });

  const logs = [
    {
      action: 'CREATE',
      from: null,
      to: 'PENDING_ACCEPTANCE',
      user: 'acceptor01',
      role: 'acceptor',
      name: '张受理',
      remark: '创建委托单'
    }
  ];

  if (['MATERIAL_VERIFICATION', 'VERIFICATION_PASSED', 'VERIFICATION_FAILED', 'MATERIAL_INCOMPLETE', 'QC_REVIEW_PENDING', 'QC_APPROVED', 'QC_REJECTED', 'COMPLETED'].includes(delegation.status)) {
    logs.push({
      action: 'STATUS_CHANGE',
      from: 'PENDING_ACCEPTANCE',
      to: 'ACCEPTANCE_IN_PROGRESS',
      user: 'acceptor01',
      role: 'acceptor',
      name: '张受理',
      remark: '受理员接收委托'
    });

    logs.push({
      action: 'STATUS_CHANGE',
      from: 'ACCEPTANCE_IN_PROGRESS',
      to: 'MATERIAL_VERIFICATION',
      user: 'acceptor01',
      role: 'acceptor',
      name: '张受理',
      remark: '提交材料核验'
    });

    if (['VERIFICATION_PASSED', 'QC_REVIEW_PENDING', 'QC_APPROVED', 'QC_REJECTED', 'COMPLETED'].includes(delegation.status)) {
      logs.push({
        action: 'VERIFY',
        from: 'MATERIAL_VERIFICATION',
        to: 'MATERIAL_VERIFICATION',
        user: 'appraiser01',
        role: 'appraiser',
        name: '李鉴定',
        remark: '核验材料：委托书 - 通过',
        details: JSON.stringify({ materialId: materialIdMap['委托书'], materialName: '委托书', status: 'passed', notes: '材料完整，印章清晰', verifiedBy: 'appraiser01', verifiedAt: '2024-01-02 10:00:00' })
      });

      logs.push({
        action: 'VERIFY',
        from: 'MATERIAL_VERIFICATION',
        to: 'MATERIAL_VERIFICATION',
        user: 'appraiser01',
        role: 'appraiser',
        name: '李鉴定',
        remark: '核验材料：身份证明 - 通过',
        details: JSON.stringify({ materialId: materialIdMap['身份证明'], materialName: '身份证明', status: 'passed', notes: '身份证明真实有效', verifiedBy: 'appraiser01', verifiedAt: '2024-01-02 10:05:00' })
      });

      delegation.materials.slice(2).forEach((material) => {
        if (material.verification_status === 'passed') {
          logs.push({
            action: 'VERIFY',
            from: 'MATERIAL_VERIFICATION',
            to: 'MATERIAL_VERIFICATION',
            user: 'appraiser01',
            role: 'appraiser',
            name: '李鉴定',
            remark: `核验材料：${material.name} - 通过`,
            details: JSON.stringify({ 
              materialId: materialIdMap[material.name], 
              materialName: material.name, 
              status: 'passed', 
              notes: material.verification_notes, 
              verifiedBy: 'appraiser01', 
              verifiedAt: material.verified_at 
            })
          });
        }
      });
    }

    if (delegation.status === 'MATERIAL_INCOMPLETE') {
      logs.push({
        action: 'ABNORMAL_FLAG',
        from: 'MATERIAL_VERIFICATION',
        to: 'MATERIAL_INCOMPLETE',
        user: 'appraiser01',
        role: 'appraiser',
        name: '李鉴定',
        remark: delegation.abnormal_reason
      });
    }

    if (delegation.status === 'VERIFICATION_FAILED') {
      logs.push({
        action: 'ABNORMAL_FLAG',
        from: 'MATERIAL_VERIFICATION',
        to: 'VERIFICATION_FAILED',
        user: 'appraiser01',
        role: 'appraiser',
        name: '李鉴定',
        remark: delegation.abnormal_reason
      });
    }

    if (delegation.status === 'ON_HOLD') {
      logs.push({
        action: 'STATUS_CHANGE',
        from: 'PENDING_ACCEPTANCE',
        to: 'ACCEPTANCE_IN_PROGRESS',
        user: 'acceptor01',
        role: 'acceptor',
        name: '张受理',
        remark: '受理员接收委托'
      });

      logs.push({
        action: 'STATUS_CHANGE',
        from: 'ACCEPTANCE_IN_PROGRESS',
        to: 'MATERIAL_VERIFICATION',
        user: 'acceptor01',
        role: 'acceptor',
        name: '张受理',
        remark: '提交材料核验'
      });

      logs.push({
        action: 'VERIFY',
        from: 'MATERIAL_VERIFICATION',
        to: 'MATERIAL_VERIFICATION',
        user: 'appraiser01',
        role: 'appraiser',
        name: '李鉴定',
        remark: '核验材料：委托书 - 通过',
        details: JSON.stringify({ materialId: materialIdMap['委托书'], materialName: '委托书', status: 'passed', notes: '委托书完整，印章清晰', verifiedBy: 'appraiser01', verifiedAt: '2024-01-09 10:30:00' })
      });

      logs.push({
        action: 'VERIFY',
        from: 'MATERIAL_VERIFICATION',
        to: 'MATERIAL_VERIFICATION',
        user: 'appraiser01',
        role: 'appraiser',
        name: '李鉴定',
        remark: '核验材料：身份证明 - 通过',
        details: JSON.stringify({ materialId: materialIdMap['身份证明'], materialName: '身份证明', status: 'passed', notes: '身份证复印件清晰可辨', verifiedBy: 'appraiser01', verifiedAt: '2024-01-09 10:35:00' })
      });

      logs.push({
        action: 'VERIFY',
        from: 'MATERIAL_VERIFICATION',
        to: 'MATERIAL_VERIFICATION',
        user: 'appraiser01',
        role: 'appraiser',
        name: '李鉴定',
        remark: '核验材料：物证样本 - 通过',
        details: JSON.stringify({ materialId: materialIdMap['物证样本'], materialName: '物证样本', status: 'passed', notes: '物证样本包装完好，符合鉴定要求', verifiedBy: 'appraiser01', verifiedAt: '2024-01-09 10:40:00' })
      });

      logs.push({
        action: 'ABNORMAL_FLAG',
        from: 'MATERIAL_VERIFICATION',
        to: 'ON_HOLD',
        user: 'appraiser01',
        role: 'appraiser',
        name: '李鉴定',
        remark: delegation.abnormal_reason,
        details: JSON.stringify({ abnormalType: '超时', timeoutDays: 15 })
      });
    }

    if (['QC_REVIEW_PENDING', 'QC_APPROVED', 'QC_REJECTED', 'COMPLETED'].includes(delegation.status)) {
      logs.push({
        action: 'STATUS_CHANGE',
        from: 'VERIFICATION_PASSED',
        to: 'QC_REVIEW_PENDING',
        user: 'appraiser01',
        role: 'appraiser',
        name: '李鉴定',
        remark: '提交质控审核'
      });
    }

    if (delegation.status === 'QC_REJECTED') {
      logs.push({
        action: 'ABNORMAL_FLAG',
        from: 'QC_REVIEW_PENDING',
        to: 'QC_REJECTED',
        user: 'qc01',
        role: 'qc_reviewer',
        name: '王质控',
        remark: delegation.abnormal_reason
      });
    }

    if (delegation.status === 'COMPLETED') {
      logs.push({
        action: 'STATUS_CHANGE',
        from: 'QC_REVIEW_PENDING',
        to: 'QC_APPROVED',
        user: 'qc01',
        role: 'qc_reviewer',
        name: '王质控',
        remark: '审核通过'
      });

      logs.push({
        action: 'STATUS_CHANGE',
        from: 'QC_APPROVED',
        to: 'COMPLETED',
        user: 'qc01',
        role: 'qc_reviewer',
        name: '王质控',
        remark: '鉴定完成'
      });
    }
  }

  logs.forEach(log => {
    insertAuditLog.run(
      delegationId,
      log.action,
      log.from,
      log.to,
      log.user,
      log.role,
      log.name,
      log.remark,
      log.details || '{}'
    );
  });
});

console.log('\n📋 委托单初始化完成\n');

console.log('🎉 演示数据初始化完成！\n');
console.log('=' .repeat(50));
console.log('演示账号：');
console.log('  受理员：acceptor01 / demo123');
console.log('  鉴定人：appraiser01 / demo123');
console.log('  质控审核：qc01 / demo123');
console.log('  管理员：admin / admin123');
console.log('=' .repeat(50));
console.log('\n演示数据：');
delegations.forEach(d => {
  const statusName = {
    'PENDING_ACCEPTANCE': '待受理',
    'ACCEPTANCE_IN_PROGRESS': '受理中',
    'MATERIAL_VERIFICATION': '材料核验中',
    'VERIFICATION_PASSED': '核验通过',
    'VERIFICATION_FAILED': '核验不通过',
    'MATERIAL_INCOMPLETE': '材料不全',
    'QC_REVIEW_PENDING': '待质控审核',
    'QC_APPROVED': '审核通过',
    'QC_REJECTED': '复核不通过',
    'COMPLETED': '已完成',
    'ON_HOLD': '暂停/超时'
  };
  const isAbnormal = d.is_abnormal ? ' [异常]' : '';
  console.log(`  ${d.delegation_number} - ${statusName[d.status]}${isAbnormal}`);
});
console.log('=' .repeat(50));
