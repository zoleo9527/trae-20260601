import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.join(__dirname, '..', 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'rescue.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS rescue_incidents (
    id TEXT PRIMARY KEY,
    incident_no TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    location TEXT,
    injured_name TEXT,
    injured_phone TEXT,
    responsible_person TEXT,
    description TEXT,
    occurred_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS incident_notes (
    id TEXT PRIMARY KEY,
    incident_id TEXT NOT NULL,
    author TEXT NOT NULL,
    category TEXT NOT NULL,
    content TEXT NOT NULL,
    referenced_note_id TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (incident_id) REFERENCES rescue_incidents(id)
  );

  CREATE TABLE IF NOT EXISTS status_transitions (
    id TEXT PRIMARY KEY,
    incident_id TEXT NOT NULL,
    from_status TEXT NOT NULL,
    to_status TEXT NOT NULL,
    operator TEXT NOT NULL,
    remark TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (incident_id) REFERENCES rescue_incidents(id)
  );

  CREATE TABLE IF NOT EXISTS insurance_materials (
    id TEXT PRIMARY KEY,
    incident_id TEXT NOT NULL,
    material_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    reviewer TEXT,
    anomaly_explanation TEXT,
    referenced_note_ids TEXT,
    anomaly_referenced_note_ids TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (incident_id) REFERENCES rescue_incidents(id)
  );

  CREATE TABLE IF NOT EXISTS operation_logs (
    id TEXT PRIMARY KEY,
    incident_id TEXT NOT NULL,
    action TEXT NOT NULL,
    operator TEXT NOT NULL,
    detail TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (incident_id) REFERENCES rescue_incidents(id)
  );
`)

const count = db.prepare('SELECT COUNT(*) as c FROM rescue_incidents').get() as { c: number }
if (count.c === 0) {
  const now = new Date().toISOString()
  const seed = db.transaction(() => {
    const insertIncident = db.prepare(`
      INSERT INTO rescue_incidents (id, incident_no, type, status, location, injured_name, injured_phone, responsible_person, description, occurred_at, created_at, updated_at)
      VALUES (@id, @incident_no, @type, @status, @location, @injured_name, @injured_phone, @responsible_person, @description, @occurred_at, @created_at, @updated_at)
    `)
    const insertNote = db.prepare(`
      INSERT INTO incident_notes (id, incident_id, author, category, content, referenced_note_id, created_at)
      VALUES (@id, @incident_id, @author, @category, @content, @referenced_note_id, @created_at)
    `)
    const insertTransition = db.prepare(`
      INSERT INTO status_transitions (id, incident_id, from_status, to_status, operator, remark, created_at)
      VALUES (@id, @incident_id, @from_status, @to_status, @operator, @remark, @created_at)
    `)
    const insertInsurance = db.prepare(`
      INSERT INTO insurance_materials (id, incident_id, material_type, status, notes, reviewer, anomaly_explanation, referenced_note_ids, anomaly_referenced_note_ids, created_at, updated_at)
      VALUES (@id, @incident_id, @material_type, @status, @notes, @reviewer, @anomaly_explanation, @referenced_note_ids, @anomaly_referenced_note_ids, @created_at, @updated_at)
    `)
    const insertLog = db.prepare(`
      INSERT INTO operation_logs (id, incident_id, action, operator, detail, created_at)
      VALUES (@id, @incident_id, @action, @operator, @detail, @created_at)
    `)

    const inc1Id = crypto.randomUUID()
    const inc1Time = '2026-06-03T09:15:00.000Z'
    insertIncident.run({
      id: inc1Id,
      incident_no: 'RSC-2026-001',
      type: 'rescue',
      status: 'processing',
      location: '雪道A3区中级道',
      injured_name: '陈建国',
      injured_phone: '138****5678',
      responsible_person: '张伟',
      description: '两名滑雪者在A3区中级道弯道处发生碰撞，其中一人左臂疑似骨折',
      occurred_at: inc1Time,
      created_at: inc1Time,
      updated_at: '2026-06-03T10:30:00.000Z',
    })

    const note1_1 = crypto.randomUUID()
    const note1_2 = crypto.randomUUID()
    const note1_3 = crypto.randomUUID()
    const note1_4 = crypto.randomUUID()

    insertNote.run({
      id: note1_1,
      incident_id: inc1Id,
      author: '张伟',
      category: 'rescue',
      content: '接到救援通知后5分钟内到达现场，发现伤者左臂畸形肿胀，活动受限。已使用夹板进行初步固定处理，伤者意识清醒，生命体征稳定。',
      referenced_note_id: null,
      created_at: '2026-06-03T09:22:00.000Z',
    })
    insertNote.run({
      id: note1_2,
      incident_id: inc1Id,
      author: '陈明医生',
      category: 'medical',
      content: '伤者送达医务室后进行初步检查：血压125/80mmHg，心率88次/分，意识清醒。初步诊断为左桡骨远端Colles骨折，已进行石膏固定处理。建议转院至县人民医院骨科进一步治疗。现场陪同人员为伤者妻子。',
      referenced_note_id: note1_1,
      created_at: '2026-06-03T09:45:00.000Z',
    })
    insertNote.run({
      id: note1_3,
      incident_id: inc1Id,
      author: '张伟',
      category: 'rescue',
      content: '已安排救护车转运伤者至县人民医院，随车医护人员为王护士。已联系伤者家属告知情况。现场已清理完毕，雪道A3区已于10:15恢复正常通行。',
      referenced_note_id: null,
      created_at: '2026-06-03T10:10:00.000Z',
    })
    insertNote.run({
      id: note1_4,
      incident_id: inc1Id,
      author: '李保险',
      category: 'insurance',
      content: '已向平安保险报案，报案号：PA20260603001。需准备材料：1. 救援记录 2. 医疗诊断证明 3. 伤者身份证复印件 4. 现场照片。请救援组配合提供相关材料。',
      referenced_note_id: note1_2,
      created_at: '2026-06-03T10:30:00.000Z',
    })

    insertTransition.run({
      id: crypto.randomUUID(),
      incident_id: inc1Id,
      from_status: 'pending',
      to_status: 'processing',
      operator: '张伟',
      remark: '救援队已到达现场开始处置',
      created_at: '2026-06-03T09:18:00.000Z',
    })

    const ins1_1 = crypto.randomUUID()
    const ins1_2 = crypto.randomUUID()
    insertInsurance.run({
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
    })
    insertInsurance.run({
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
    })

    insertLog.run({ id: crypto.randomUUID(), incident_id: inc1Id, action: 'create_incident', operator: '系统', detail: '创建救援事故 RSC-2026-001', created_at: inc1Time })
    insertLog.run({ id: crypto.randomUUID(), incident_id: inc1Id, action: 'status_change', operator: '张伟', detail: '状态从 pending 变更为 processing', created_at: '2026-06-03T09:18:00.000Z' })
    insertLog.run({ id: crypto.randomUUID(), incident_id: inc1Id, action: 'add_note', operator: '张伟', detail: '添加救援分类备注', created_at: '2026-06-03T09:22:00.000Z' })
    insertLog.run({ id: crypto.randomUUID(), incident_id: inc1Id, action: 'add_note', operator: '陈明医生', detail: '添加医疗分类备注', created_at: '2026-06-03T09:45:00.000Z' })
    insertLog.run({ id: crypto.randomUUID(), incident_id: inc1Id, action: 'add_note', operator: '张伟', detail: '添加救援分类备注', created_at: '2026-06-03T10:10:00.000Z' })
    insertLog.run({ id: crypto.randomUUID(), incident_id: inc1Id, action: 'add_note', operator: '李保险', detail: '添加保险分类备注', created_at: '2026-06-03T10:30:00.000Z' })
    insertLog.run({ id: crypto.randomUUID(), incident_id: inc1Id, action: 'add_insurance_material', operator: '李保险', detail: '添加保险材料: 救援处置报告', created_at: '2026-06-03T10:35:00.000Z' })

    const inc2Id = crypto.randomUUID()
    const inc2Time = '2026-06-02T14:30:00.000Z'
    insertIncident.run({
      id: inc2Id,
      incident_no: 'RSC-2026-002',
      type: 'rescue',
      status: 'review',
      location: '雪道B1区高级道',
      injured_name: '王小虎',
      injured_phone: '139****1234',
      responsible_person: '李明',
      description: '单板滑雪者在B1区高级道跳台落地时摔倒，右膝受伤无法站起',
      occurred_at: inc2Time,
      created_at: inc2Time,
      updated_at: '2026-06-02T18:00:00.000Z',
    })

    const note2_1 = crypto.randomUUID()
    const note2_2 = crypto.randomUUID()
    const note2_3 = crypto.randomUUID()
    const note2_4 = crypto.randomUUID()
    const note2_5 = crypto.randomUUID()

    insertNote.run({
      id: note2_1,
      incident_id: inc2Id,
      author: '李明',
      category: 'rescue',
      content: '到达现场，伤者为28岁男性单板滑雪者，在完成360度转体动作落地时失去平衡摔倒，右膝着地。目前无法站立，右膝肿胀明显，压痛剧烈。已使用雪地担架转移至巡逻艇。',
      referenced_note_id: null,
      created_at: '2026-06-02T14:38:00.000Z',
    })
    insertNote.run({
      id: note2_2,
      incident_id: inc2Id,
      author: '王芳护士',
      category: 'medical',
      content: '医务室检查：右膝关节肿胀，活动受限，前抽屉试验阳性，麦氏征阳性。怀疑前交叉韧带损伤伴半月板损伤。已佩戴膝关节支具固定，冰袋冷敷。建议立即转至市骨科医院做MRI检查。',
      referenced_note_id: note2_1,
      created_at: '2026-06-02T14:55:00.000Z',
    })
    insertNote.run({
      id: note2_3,
      incident_id: inc2Id,
      author: '李明',
      category: 'rescue',
      content: '已联系120急救中心，救护车将于15:20到达。已通过滑雪场广播找到伤者同行朋友赵某陪同前往医院。雪场已购买公众责任险，已通知保险公司。',
      referenced_note_id: null,
      created_at: '2026-06-02T15:05:00.000Z',
    })
    insertNote.run({
      id: note2_4,
      incident_id: inc2Id,
      author: '赵安全',
      category: 'anomaly',
      content: '【异常说明】经现场勘查，该跳台近期刚完成维护，但发现落地坡积雪硬度分布不均，可能增加了落地风险。已通知造雪班组重新处理该区域雪质，今日内完成整改。此次事件雪场可能需承担部分责任。',
      referenced_note_id: note2_1,
      created_at: '2026-06-02T16:20:00.000Z',
    })
    insertNote.run({
      id: note2_5,
      incident_id: inc2Id,
      author: '李保险',
      category: 'insurance',
      content: '已收到医院初步诊断：右膝前交叉韧带完全断裂，需手术治疗。预估医疗费用约5-6万元。已将救援备注#1、医疗备注#2、异常说明备注#4作为理赔参考材料提交保险公司。理赔专员将于明日上午来雪场核实情况。',
      referenced_note_id: note2_4,
      created_at: '2026-06-02T17:30:00.000Z',
    })

    insertTransition.run({
      id: crypto.randomUUID(),
      incident_id: inc2Id,
      from_status: 'pending',
      to_status: 'processing',
      operator: '李明',
      remark: '救援队已到达现场开始处理',
      created_at: '2026-06-02T14:35:00.000Z',
    })
    insertTransition.run({
      id: crypto.randomUUID(),
      incident_id: inc2Id,
      from_status: 'processing',
      to_status: 'review',
      operator: '李明',
      remark: '救援处置完成，伤者已转院，进入事故复核与保险理赔阶段',
      created_at: '2026-06-02T18:00:00.000Z',
    })

    const ins2_1 = crypto.randomUUID()
    const ins2_2 = crypto.randomUUID()
    const ins2_3 = crypto.randomUUID()
    insertInsurance.run({
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
    })
    insertInsurance.run({
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
    })
    insertInsurance.run({
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
    })

    insertLog.run({ id: crypto.randomUUID(), incident_id: inc2Id, action: 'create_incident', operator: '系统', detail: '创建救援事故 RSC-2026-002', created_at: inc2Time })
    insertLog.run({ id: crypto.randomUUID(), incident_id: inc2Id, action: 'status_change', operator: '李明', detail: '状态从 pending 变更为 processing', created_at: '2026-06-02T14:35:00.000Z' })
    insertLog.run({ id: crypto.randomUUID(), incident_id: inc2Id, action: 'add_note', operator: '李明', detail: '添加救援分类备注', created_at: '2026-06-02T14:38:00.000Z' })
    insertLog.run({ id: crypto.randomUUID(), incident_id: inc2Id, action: 'add_note', operator: '王芳护士', detail: '添加医疗分类备注', created_at: '2026-06-02T14:55:00.000Z' })
    insertLog.run({ id: crypto.randomUUID(), incident_id: inc2Id, action: 'add_note', operator: '赵安全', detail: '添加异常分类备注', created_at: '2026-06-02T16:20:00.000Z' })
    insertLog.run({ id: crypto.randomUUID(), incident_id: inc2Id, action: 'add_note', operator: '李保险', detail: '添加保险分类备注', created_at: '2026-06-02T17:30:00.000Z' })
    insertLog.run({ id: crypto.randomUUID(), incident_id: inc2Id, action: 'status_change', operator: '李明', detail: '状态从 processing 变更为 review', created_at: '2026-06-02T18:00:00.000Z' })
    insertLog.run({ id: crypto.randomUUID(), incident_id: inc2Id, action: 'insurance_anomaly', operator: '李保险', detail: '保险材料异常: 身份证复印件清晰度不达标，滑雪票存根缺失', created_at: '2026-06-02T17:45:00.000Z' })

    const inc3Id = crypto.randomUUID()
    const inc3Time = '2026-05-28T10:00:00.000Z'
    insertIncident.run({
      id: inc3Id,
      incident_no: 'RSC-2026-003',
      type: 'equipment',
      status: 'completed',
      location: '缆车C2线',
      injured_name: '刘美玲',
      injured_phone: '137****9876',
      responsible_person: '王芳',
      description: '缆车C2线吊椅安全护栏卡扣失灵，导致一名乘客在离地约2米处险些滑落',
      occurred_at: inc3Time,
      created_at: inc3Time,
      updated_at: '2026-05-29T16:00:00.000Z',
    })

    const note3_1 = crypto.randomUUID()
    const note3_2 = crypto.randomUUID()
    const note3_3 = crypto.randomUUID()
    const note3_4 = crypto.randomUUID()
    const note3_5 = crypto.randomUUID()
    const note3_6 = crypto.randomUUID()

    insertNote.run({
      id: note3_1,
      incident_id: inc3Id,
      author: '王芳',
      category: 'rescue',
      content: '接到缆车操作员紧急报告后，立即按下C2线紧急停止按钮。3号吊椅在离地约2米处停止，乘客刘女士（35岁）因安全护栏突然弹开险些滑落，所幸抓住护栏未坠落。已安排救援梯前往救援。',
      referenced_note_id: null,
      created_at: '2026-05-28T10:05:00.000Z',
    })
    insertNote.run({
      id: note3_2,
      incident_id: inc3Id,
      author: '赵工程师',
      category: 'rescue',
      content: '【设备排查】已将3号吊椅收回检修站检查。发现安全护栏卡扣弹簧老化，弹性不足，导致卡扣未能完全锁止。同批次共安装了12个弹簧，已使用18个月。建议立即停用C2线，对全部24个吊椅的安全卡扣进行逐一排查并更换弹簧。',
      referenced_note_id: note3_1,
      created_at: '2026-05-28T12:30:00.000Z',
    })
    insertNote.run({
      id: note3_3,
      incident_id: inc3Id,
      author: '孙医生',
      category: 'medical',
      content: '乘客刘女士已接受全面身体检查，无外伤，但受惊吓过度，血压偏高（145/95mmHg），心率偏快。已给予心理疏导，建议休息观察24小时。已安排心理咨询师后续跟进。乘客已由家属接回家中。',
      referenced_note_id: null,
      created_at: '2026-05-28T10:45:00.000Z',
    })
    insertNote.run({
      id: note3_4,
      incident_id: inc3Id,
      author: '王芳',
      category: 'rescue',
      content: '【处置进展】已完成全部24个吊椅的安全卡扣检查，共发现5个存在弹簧老化问题，已全部更换为新批次弹簧。C2线已于14:00通过安全检测，恢复正常运营。已向主管领导提交设备故障报告。',
      referenced_note_id: note3_2,
      created_at: '2026-05-28T14:10:00.000Z',
    })
    insertNote.run({
      id: note3_5,
      incident_id: inc3Id,
      author: '李保险',
      category: 'insurance',
      content: '已向保险公司报备设备故障事件。需提交材料：1. 设备维护记录 2. 安全检查报告 3. 乘客医疗检查证明 4. 事件处置报告。目前乘客方暂未提出赔偿要求，但建议做好协商准备。',
      referenced_note_id: note3_4,
      created_at: '2026-05-28T15:00:00.000Z',
    })
    insertNote.run({
      id: note3_6,
      incident_id: inc3Id,
      author: '刘经理',
      category: 'insurance',
      content: '保险理赔已完成。经与乘客友好协商，雪场承担全部医疗检查费用，并赠送价值2000元的雪季卡作为精神补偿。乘客表示满意，不再追究其他责任。设备供应商已同意承担部分弹簧更换费用。此案可结案。',
      referenced_note_id: note3_5,
      created_at: '2026-05-29T15:00:00.000Z',
    })

    insertTransition.run({
      id: crypto.randomUUID(),
      incident_id: inc3Id,
      from_status: 'pending',
      to_status: 'processing',
      operator: '王芳',
      remark: '已停止故障缆车线路，启动应急处置流程',
      created_at: '2026-05-28T10:03:00.000Z',
    })
    insertTransition.run({
      id: crypto.randomUUID(),
      incident_id: inc3Id,
      from_status: 'processing',
      to_status: 'review',
      operator: '王芳',
      remark: '设备维修完毕，安全检查通过，进入复核阶段',
      created_at: '2026-05-28T16:00:00.000Z',
    })
    insertTransition.run({
      id: crypto.randomUUID(),
      incident_id: inc3Id,
      from_status: 'review',
      to_status: 'completed',
      operator: '刘经理',
      remark: '事故处理完毕，保险理赔完成，双方达成和解，结案',
      created_at: '2026-05-29T16:00:00.000Z',
    })

    const ins3_1 = crypto.randomUUID()
    const ins3_2 = crypto.randomUUID()
    const ins3_3 = crypto.randomUUID()
    insertInsurance.run({
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
    })
    insertInsurance.run({
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
    })
    insertInsurance.run({
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
    })

    insertLog.run({ id: crypto.randomUUID(), incident_id: inc3Id, action: 'create_incident', operator: '系统', detail: '创建救援事故 RSC-2026-003', created_at: inc3Time })
    insertLog.run({ id: crypto.randomUUID(), incident_id: inc3Id, action: 'status_change', operator: '王芳', detail: '状态从 pending 变更为 processing', created_at: '2026-05-28T10:03:00.000Z' })
    insertLog.run({ id: crypto.randomUUID(), incident_id: inc3Id, action: 'add_note', operator: '王芳', detail: '添加救援分类备注', created_at: '2026-05-28T10:05:00.000Z' })
    insertLog.run({ id: crypto.randomUUID(), incident_id: inc3Id, action: 'add_note', operator: '赵工程师', detail: '添加救援分类备注', created_at: '2026-05-28T12:30:00.000Z' })
    insertLog.run({ id: crypto.randomUUID(), incident_id: inc3Id, action: 'add_note', operator: '孙医生', detail: '添加医疗分类备注', created_at: '2026-05-28T10:45:00.000Z' })
    insertLog.run({ id: crypto.randomUUID(), incident_id: inc3Id, action: 'add_note', operator: '王芳', detail: '添加救援分类备注', created_at: '2026-05-28T14:10:00.000Z' })
    insertLog.run({ id: crypto.randomUUID(), incident_id: inc3Id, action: 'add_note', operator: '李保险', detail: '添加保险分类备注', created_at: '2026-05-28T15:00:00.000Z' })
    insertLog.run({ id: crypto.randomUUID(), incident_id: inc3Id, action: 'add_note', operator: '刘经理', detail: '添加保险分类备注', created_at: '2026-05-29T15:00:00.000Z' })
    insertLog.run({ id: crypto.randomUUID(), incident_id: inc3Id, action: 'status_change', operator: '王芳', detail: '状态从 processing 变更为 review', created_at: '2026-05-28T16:00:00.000Z' })
    insertLog.run({ id: crypto.randomUUID(), incident_id: inc3Id, action: 'status_change', operator: '刘经理', detail: '状态从 review 变更为 completed', created_at: '2026-05-29T16:00:00.000Z' })

    const inc4Id = crypto.randomUUID()
    const inc4Time = '2026-06-04T08:45:00.000Z'
    insertIncident.run({
      id: inc4Id,
      incident_no: 'RSC-2026-004',
      type: 'medical',
      status: 'pending',
      location: '雪具大厅二楼休息区',
      injured_name: '张大伯',
      injured_phone: '136****5555',
      responsible_person: '王医生',
      description: '65岁男性游客在休息区休息时突发胸痛、呼吸困难，疑似心绞痛',
      occurred_at: inc4Time,
      created_at: inc4Time,
      updated_at: inc4Time,
    })

    const note4_1 = crypto.randomUUID()
    insertNote.run({
      id: note4_1,
      incident_id: inc4Id,
      author: '王医生',
      category: 'medical',
      content: '接到急救呼叫后2分钟到达现场。患者张XX，男，65岁，有冠心病史，今日未按时服药。查体：意识清醒，表情痛苦，大汗淋漓，心率110次/分，血压95/60mmHg。已给予硝酸甘油舌下含服，吸氧，建立静脉通道。疑似急性冠脉综合征，需立即转院。',
      referenced_note_id: null,
      created_at: '2026-06-04T08:50:00.000Z',
    })

    insertTransition.run({
      id: crypto.randomUUID(),
      incident_id: inc4Id,
      from_status: 'pending',
      to_status: 'pending',
      operator: '系统',
      remark: '事件创建，等待急救处理',
      created_at: '2026-06-04T08:46:00.000Z',
    })

    insertLog.run({ id: crypto.randomUUID(), incident_id: inc4Id, action: 'create_incident', operator: '系统', detail: '创建救援事故 RSC-2026-004', created_at: inc4Time })
    insertLog.run({ id: crypto.randomUUID(), incident_id: inc4Id, action: 'add_note', operator: '王医生', detail: '添加医疗分类备注', created_at: '2026-06-04T08:50:00.000Z' })

    const inc5Id = crypto.randomUUID()
    const inc5Time = '2026-05-25T11:20:00.000Z'
    insertIncident.run({
      id: inc5Id,
      incident_no: 'RSC-2026-005',
      type: 'weather',
      status: 'archived',
      location: '山顶观景平台',
      injured_name: '摄影爱好者团队',
      injured_phone: '135****1111',
      responsible_person: '孙队长',
      description: '突发大雾天气，3名摄影爱好者在山顶观景台附近迷路被困',
      occurred_at: inc5Time,
      created_at: inc5Time,
      updated_at: '2026-05-26T12:00:00.000Z',
    })

    const note5_1 = crypto.randomUUID()
    const note5_2 = crypto.randomUUID()
    const note5_3 = crypto.randomUUID()
    const note5_4 = crypto.randomUUID()

    insertNote.run({
      id: note5_1,
      incident_id: inc5Id,
      author: '孙队长',
      category: 'rescue',
      content: '接到游客求助电话，3名摄影爱好者为拍摄云海日出登上未开放区域，遭遇突发大雾，能见度不足5米，迷失方向。已通过手机定位确定大致位置在观景台北侧约500米处。已组织2支搜救队携带对讲设备和热成像仪出发搜救。',
      referenced_note_id: null,
      created_at: '2026-05-25T11:25:00.000Z',
    })
    insertNote.run({
      id: note5_2,
      incident_id: inc5Id,
      author: '孙队长',
      category: 'rescue',
      content: '搜救一队在观景台北侧300米处发现被困人员。3人状态良好，无冻伤或受伤，只是情绪有些紧张。已提供热水和保暖毯，正在引导下山。预计40分钟后可到达安全区域。',
      referenced_note_id: note5_1,
      created_at: '2026-05-25T12:10:00.000Z',
    })
    insertNote.run({
      id: note5_3,
      incident_id: inc5Id,
      author: '王医生',
      category: 'medical',
      content: '3名被困人员已在医务室接受检查。生命体征平稳，无明显外伤，其中一人有轻微受凉症状，已给予姜茶保暖。观察30分钟后无异常，可自行离开。已进行安全教育，提醒不要进入未开放区域。',
      referenced_note_id: null,
      created_at: '2026-05-25T13:00:00.000Z',
    })
    insertNote.run({
      id: note5_4,
      incident_id: inc5Id,
      author: '李保险',
      category: 'insurance',
      content: '此事件无人员受伤，不涉及保险理赔。已将救援记录归档，作为案例用于安全宣传教育。建议在观景台周边增设更多警示标识和临时护栏。',
      referenced_note_id: null,
      created_at: '2026-05-25T15:00:00.000Z',
    })

    insertTransition.run({
      id: crypto.randomUUID(),
      incident_id: inc5Id,
      from_status: 'pending',
      to_status: 'processing',
      operator: '孙队长',
      remark: '搜救队已出发，正在定位被困人员',
      created_at: '2026-05-25T11:26:00.000Z',
    })
    insertTransition.run({
      id: crypto.randomUUID(),
      incident_id: inc5Id,
      from_status: 'processing',
      to_status: 'review',
      operator: '孙队长',
      remark: '被困人员已安全找到并护送下山，进入复核阶段',
      created_at: '2026-05-25T14:00:00.000Z',
    })
    insertTransition.run({
      id: crypto.randomUUID(),
      incident_id: inc5Id,
      from_status: 'review',
      to_status: 'completed',
      operator: '孙队长',
      remark: '事件处理完毕，无人员伤亡，结案',
      created_at: '2026-05-25T18:00:00.000Z',
    })
    insertTransition.run({
      id: crypto.randomUUID(),
      incident_id: inc5Id,
      from_status: 'completed',
      to_status: 'archived',
      operator: '刘经理',
      remark: '事件已归档，作为安全教育案例',
      created_at: '2026-05-26T12:00:00.000Z',
    })

    insertLog.run({ id: crypto.randomUUID(), incident_id: inc5Id, action: 'create_incident', operator: '系统', detail: '创建救援事故 RSC-2026-005', created_at: inc5Time })
    insertLog.run({ id: crypto.randomUUID(), incident_id: inc5Id, action: 'status_change', operator: '孙队长', detail: '状态从 pending 变更为 processing', created_at: '2026-05-25T11:26:00.000Z' })
    insertLog.run({ id: crypto.randomUUID(), incident_id: inc5Id, action: 'add_note', operator: '孙队长', detail: '添加救援分类备注', created_at: '2026-05-25T11:25:00.000Z' })
    insertLog.run({ id: crypto.randomUUID(), incident_id: inc5Id, action: 'add_note', operator: '孙队长', detail: '添加救援分类备注', created_at: '2026-05-25T12:10:00.000Z' })
    insertLog.run({ id: crypto.randomUUID(), incident_id: inc5Id, action: 'add_note', operator: '王医生', detail: '添加医疗分类备注', created_at: '2026-05-25T13:00:00.000Z' })
    insertLog.run({ id: crypto.randomUUID(), incident_id: inc5Id, action: 'add_note', operator: '李保险', detail: '添加保险分类备注', created_at: '2026-05-25T15:00:00.000Z' })
    insertLog.run({ id: crypto.randomUUID(), incident_id: inc5Id, action: 'status_change', operator: '孙队长', detail: '状态从 processing 变更为 review', created_at: '2026-05-25T14:00:00.000Z' })
    insertLog.run({ id: crypto.randomUUID(), incident_id: inc5Id, action: 'status_change', operator: '孙队长', detail: '状态从 review 变更为 completed', created_at: '2026-05-25T18:00:00.000Z' })
    insertLog.run({ id: crypto.randomUUID(), incident_id: inc5Id, action: 'status_change', operator: '刘经理', detail: '状态从 completed 变更为 archived', created_at: '2026-05-26T12:00:00.000Z' })
  })

  seed()
  console.log('Database seeded with sample data')
}

export default db
