const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'api', 'db.ts');
let content = fs.readFileSync(dbPath, 'utf8');

// 1. 在表结构中添加 anomaly_referenced_note_ids 字段
content = content.replace(
  `    anomaly_explanation TEXT,
    referenced_note_ids TEXT,
    created_at TEXT NOT NULL,`,
  `    anomaly_explanation TEXT,
    referenced_note_ids TEXT,
    anomaly_referenced_note_ids TEXT,
    created_at TEXT NOT NULL,`
);

// 2. 更新 insertInsurance 预编译语句
content = content.replace(
  `INSERT INTO insurance_materials (id, incident_id, material_type, status, notes, reviewer, anomaly_explanation, referenced_note_ids, created_at, updated_at)
      VALUES (@id, @incident_id, @material_type, @status, @notes, @reviewer, @anomaly_explanation, @referenced_note_ids, @created_at, @updated_at)`,
  `INSERT INTO insurance_materials (id, incident_id, material_type, status, notes, reviewer, anomaly_explanation, referenced_note_ids, anomaly_referenced_note_ids, created_at, updated_at)
      VALUES (@id, @incident_id, @material_type, @status, @notes, @reviewer, @anomaly_explanation, @referenced_note_ids, @anomaly_referenced_note_ids, @created_at, @updated_at)`
);

// 3. 为所有 insertInsurance.run 调用添加 anomaly_referenced_note_ids 字段
// 首先处理 ins1_1
content = content.replace(
  `    insertInsurance.run({
      id: ins1_1,
      incident_id: inc1Id,
      material_type: '救援处置报告',
      status: 'submitted',
      notes: '包含现场救援记录、伤者转运记录、雪道恢复通行时间',
      reviewer: '李保险',
      anomaly_explanation: null,
      referenced_note_ids: JSON.stringify([note1_1, note1_3]),
      created_at: '2026-06-03T10:35:00.000Z',
      updated_at: '2026-06-03T10:35:00.000Z',
    })`,
  `    insertInsurance.run({
      id: ins1_1,
      incident_id: inc1Id,
      material_type: '救援处置报告',
      status: 'submitted',
      notes: '包含现场救援记录、伤者转运记录、雪道恢复通行时间',
      reviewer: '李保险',
      anomaly_explanation: null,
      referenced_note_ids: JSON.stringify([note1_1, note1_3]),
      anomaly_referenced_note_ids: null,
      created_at: '2026-06-03T10:35:00.000Z',
      updated_at: '2026-06-03T10:35:00.000Z',
    })`
);

// 处理 ins1_2
content = content.replace(
  `    insertInsurance.run({
      id: ins1_2,
      incident_id: inc1Id,
      material_type: '现场照片',
      status: 'pending',
      notes: '共5张，包含事故位置、伤者伤情、雪道标识',
      reviewer: null,
      anomaly_explanation: null,
      referenced_note_ids: JSON.stringify([note1_1]),
      created_at: '2026-06-03T10:40:00.000Z',
      updated_at: '2026-06-03T10:40:00.000Z',
    })`,
  `    insertInsurance.run({
      id: ins1_2,
      incident_id: inc1Id,
      material_type: '现场照片',
      status: 'pending',
      notes: '共5张，包含事故位置、伤者伤情、雪道标识',
      reviewer: null,
      anomaly_explanation: null,
      referenced_note_ids: JSON.stringify([note1_1]),
      anomaly_referenced_note_ids: null,
      created_at: '2026-06-03T10:40:00.000Z',
      updated_at: '2026-06-03T10:40:00.000Z',
    })`
);

// 处理 ins2_1
content = content.replace(
  `    insertInsurance.run({
      id: ins2_1,
      incident_id: inc2Id,
      material_type: '医疗诊断证明',
      status: 'submitted',
      notes: '包含急诊病历、X光报告、医生诊断建议',
      reviewer: '李保险',
      anomaly_explanation: null,
      referenced_note_ids: JSON.stringify([note2_2]),
      created_at: '2026-06-02T17:00:00.000Z',
      updated_at: '2026-06-02T17:00:00.000Z',
    })`,
  `    insertInsurance.run({
      id: ins2_1,
      incident_id: inc2Id,
      material_type: '医疗诊断证明',
      status: 'submitted',
      notes: '包含急诊病历、X光报告、医生诊断建议',
      reviewer: '李保险',
      anomaly_explanation: null,
      referenced_note_ids: JSON.stringify([note2_2]),
      anomaly_referenced_note_ids: null,
      created_at: '2026-06-02T17:00:00.000Z',
      updated_at: '2026-06-02T17:00:00.000Z',
    })`
);

// 处理 ins2_2
content = content.replace(
  `    insertInsurance.run({
      id: ins2_2,
      incident_id: inc2Id,
      material_type: '现场勘查报告',
      status: 'reviewed',
      notes: '含雪道状况照片、跳台维护记录、安全检查日志',
      reviewer: '李保险',
      anomaly_explanation: null,
      referenced_note_ids: JSON.stringify([note2_1, note2_4]),
      created_at: '2026-06-02T16:45:00.000Z',
      updated_at: '2026-06-02T17:15:00.000Z',
    })`,
  `    insertInsurance.run({
      id: ins2_2,
      incident_id: inc2Id,
      material_type: '现场勘查报告',
      status: 'reviewed',
      notes: '含雪道状况照片、跳台维护记录、安全检查日志',
      reviewer: '李保险',
      anomaly_explanation: null,
      referenced_note_ids: JSON.stringify([note2_1, note2_4]),
      anomaly_referenced_note_ids: null,
      created_at: '2026-06-02T16:45:00.000Z',
      updated_at: '2026-06-02T17:15:00.000Z',
    })`
);

// 处理 ins2_3 - 这是被驳回的材料，需要设置 anomaly_referenced_note_ids
// 关联 note2_5（李保险的保险备注，提到了理赔材料提交）
content = content.replace(
  `    insertInsurance.run({
      id: ins2_3,
      incident_id: inc2Id,
      material_type: '伤者身份证及滑雪票',
      status: 'rejected',
      notes: '身份证复印件清晰度不达标，滑雪票存根缺失',
      reviewer: '李保险',
      anomaly_explanation: '当天雪场前台打印机出现故障，身份证复印件是用备用便携打印机打印的，清晰度不佳。已联系伤者家属重新提供高清扫描件，预计明日上午收到。滑雪票存根因前台交接班时遗失，正在查找。',
      referenced_note_ids: JSON.stringify([]),
      created_at: '2026-06-02T17:10:00.000Z',
      updated_at: '2026-06-02T17:45:00.000Z',
    })`,
  `    insertInsurance.run({
      id: ins2_3,
      incident_id: inc2Id,
      material_type: '伤者身份证及滑雪票',
      status: 'rejected',
      notes: '身份证复印件清晰度不达标，滑雪票存根缺失',
      reviewer: '李保险',
      anomaly_explanation: '当天雪场前台打印机出现故障，身份证复印件是用备用便携打印机打印的，清晰度不佳。已联系伤者家属重新提供高清扫描件，预计明日上午收到。滑雪票存根因前台交接班时遗失，正在查找。',
      referenced_note_ids: JSON.stringify([]),
      anomaly_referenced_note_ids: JSON.stringify([note2_5]),
      created_at: '2026-06-02T17:10:00.000Z',
      updated_at: '2026-06-02T17:45:00.000Z',
    })`
);

// 处理 ins3_1
content = content.replace(
  `    insertInsurance.run({
      id: ins3_1,
      incident_id: inc3Id,
      material_type: '设备故障应急处置报告',
      status: 'reviewed',
      notes: '含故障原因分析、处置过程、整改措施、安全评估结论',
      reviewer: '刘经理',
      anomaly_explanation: null,
      referenced_note_ids: JSON.stringify([note3_1, note3_2, note3_4]),
      created_at: '2026-05-28T16:10:00.000Z',
      updated_at: '2026-05-29T14:00:00.000Z',
    })`,
  `    insertInsurance.run({
      id: ins3_1,
      incident_id: inc3Id,
      material_type: '设备故障应急处置报告',
      status: 'reviewed',
      notes: '含故障原因分析、处置过程、整改措施、安全评估结论',
      reviewer: '刘经理',
      anomaly_explanation: null,
      referenced_note_ids: JSON.stringify([note3_1, note3_2, note3_4]),
      anomaly_referenced_note_ids: null,
      created_at: '2026-05-28T16:10:00.000Z',
      updated_at: '2026-05-29T14:00:00.000Z',
    })`
);

// 处理 ins3_2
content = content.replace(
  `    insertInsurance.run({
      id: ins3_2,
      incident_id: inc3Id,
      material_type: '乘客身体检查证明',
      status: 'reviewed',
      notes: '医务室检查记录，确认无身体伤害，建议心理疏导',
      reviewer: '刘经理',
      anomaly_explanation: null,
      referenced_note_ids: JSON.stringify([note3_3]),
      created_at: '2026-05-28T16:15:00.000Z',
      updated_at: '2026-05-29T14:30:00.000Z',
    })`,
  `    insertInsurance.run({
      id: ins3_2,
      incident_id: inc3Id,
      material_type: '乘客身体检查证明',
      status: 'reviewed',
      notes: '医务室检查记录，确认无身体伤害，建议心理疏导',
      reviewer: '刘经理',
      anomaly_explanation: null,
      referenced_note_ids: JSON.stringify([note3_3]),
      anomaly_referenced_note_ids: null,
      created_at: '2026-05-28T16:15:00.000Z',
      updated_at: '2026-05-29T14:30:00.000Z',
    })`
);

// 处理 ins3_3
content = content.replace(
  `    insertInsurance.run({
      id: ins3_3,
      incident_id: inc3Id,
      material_type: '和解协议书',
      status: 'reviewed',
      notes: '雪场与乘客签署的和解协议，包含补偿方案',
      reviewer: '刘经理',
      anomaly_explanation: null,
      referenced_note_ids: JSON.stringify([]),
      created_at: '2026-05-29T14:50:00.000Z',
      updated_at: '2026-05-29T15:30:00.000Z',
    })`,
  `    insertInsurance.run({
      id: ins3_3,
      incident_id: inc3Id,
      material_type: '和解协议书',
      status: 'reviewed',
      notes: '雪场与乘客签署的和解协议，包含补偿方案',
      reviewer: '刘经理',
      anomaly_explanation: null,
      referenced_note_ids: JSON.stringify([]),
      anomaly_referenced_note_ids: null,
      created_at: '2026-05-29T14:50:00.000Z',
      updated_at: '2026-05-29T15:30:00.000Z',
    })`
);

fs.writeFileSync(dbPath, content, 'utf8');
console.log('File modified successfully!');
