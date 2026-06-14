import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '..', 'forensic_lab.db');

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    real_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('acceptor', 'appraiser', 'quality_controller', 'admin')),
    department TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_demo INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS samples (
    id TEXT PRIMARY KEY,
    case_number TEXT NOT NULL,
    case_name TEXT NOT NULL,
    client_name TEXT,
    client_phone TEXT,
    sample_type TEXT NOT NULL,
    sample_count INTEGER DEFAULT 1,
    sample_description TEXT,
    reception_status TEXT DEFAULT 'pending' CHECK(reception_status IN ('pending', 'received', 'processing', 'completed', 'returned', 'supplementary')),
    acceptance_status TEXT DEFAULT 'pending' CHECK(acceptance_status IN ('pending', 'accepted', 'rejected', 'supplementary')),
    priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
    assigned_appraiser_id TEXT,
    accepted_by TEXT,
    accepted_at DATETIME,
    due_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_appraiser_id) REFERENCES users(id),
    FOREIGN KEY (accepted_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS sample_flows (
    id TEXT PRIMARY KEY,
    sample_id TEXT NOT NULL,
    from_status TEXT NOT NULL,
    to_status TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK(action_type IN ('receive', 'process', 'return', 'supplementary', 'complete', 'assign', 'quality_check', 'reject')),
    operator_id TEXT NOT NULL,
    operator_name TEXT NOT NULL,
    operator_role TEXT NOT NULL,
    remarks TEXT,
    attachments TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sample_id) REFERENCES samples(id),
    FOREIGN KEY (operator_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK(type IN ('info', 'warning', 'urgent', 'deadline')),
    related_sample_id TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (related_sample_id) REFERENCES samples(id)
  );

  CREATE TABLE IF NOT EXISTS supplementary_requests (
    id TEXT PRIMARY KEY,
    sample_id TEXT NOT NULL,
    requested_by TEXT NOT NULL,
    requested_by_name TEXT NOT NULL,
    reason TEXT NOT NULL,
    required_items TEXT NOT NULL,
    due_date DATETIME,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'submitted', 'received', 'completed', 'cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sample_id) REFERENCES samples(id),
    FOREIGN KEY (requested_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS sample_reception_checks (
    id TEXT PRIMARY KEY,
    sample_id TEXT NOT NULL,
    check_item TEXT NOT NULL,
    check_result TEXT NOT NULL CHECK(check_result IN ('pass', 'fail', 'pending')),
    remarks TEXT,
    checked_by TEXT NOT NULL,
    checked_by_name TEXT NOT NULL,
    checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sample_id) REFERENCES samples(id),
    FOREIGN KEY (checked_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS sample_photos (
    id TEXT PRIMARY KEY,
    sample_id TEXT NOT NULL,
    photo_type TEXT NOT NULL CHECK(photo_type IN ('overview', 'detail', 'label', 'damage', 'other')),
    photo_path TEXT NOT NULL,
    description TEXT,
    uploaded_by TEXT NOT NULL,
    uploaded_by_name TEXT NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sample_id) REFERENCES samples(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS opinion_documents (
    id TEXT PRIMARY KEY,
    sample_id TEXT NOT NULL,
    version_number INTEGER NOT NULL DEFAULT 1,
    document_title TEXT NOT NULL,
    document_content TEXT,
    file_path TEXT,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'reviewing', 'approved', 'rejected', 'final')),
    created_by TEXT NOT NULL,
    created_by_name TEXT NOT NULL,
    reviewed_by TEXT,
    reviewed_by_name TEXT,
    review_comments TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sample_id) REFERENCES samples(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS urgency_reminders (
    id TEXT PRIMARY KEY,
    sample_id TEXT NOT NULL,
    reminder_type TEXT NOT NULL CHECK(reminder_type IN ('deadline', 'supplementary', 'quality_check', 'custom')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    target_user_id TEXT NOT NULL,
    is_acknowledged INTEGER DEFAULT 0,
    acknowledged_at DATETIME,
    created_by TEXT NOT NULL,
    created_by_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sample_id) REFERENCES samples(id),
    FOREIGN KEY (target_user_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS sample_abnormalities (
    id TEXT PRIMARY KEY,
    sample_id TEXT NOT NULL,
    abnormality_type TEXT NOT NULL CHECK(abnormality_type IN ('damage', 'insufficient', 'wrong_label', 'contamination', 'other')),
    description TEXT NOT NULL,
    severity TEXT DEFAULT 'medium' CHECK(severity IN ('low', 'medium', 'high', 'critical')),
    reported_by TEXT NOT NULL,
    reported_by_name TEXT NOT NULL,
    handled_by TEXT,
    handled_by_name TEXT,
    handling_result TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'handling', 'resolved', 'closed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sample_id) REFERENCES samples(id),
    FOREIGN KEY (reported_by) REFERENCES users(id),
    FOREIGN KEY (handled_by) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_samples_case_number ON samples(case_number);
  CREATE INDEX IF NOT EXISTS idx_samples_status ON samples(reception_status);
  CREATE INDEX IF NOT EXISTS idx_samples_acceptance ON samples(acceptance_status);
  CREATE INDEX IF NOT EXISTS idx_flows_sample ON sample_flows(sample_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
  CREATE INDEX IF NOT EXISTS idx_reception_checks ON sample_reception_checks(sample_id);
  CREATE INDEX IF NOT EXISTS idx_sample_photos ON sample_photos(sample_id);
  CREATE INDEX IF NOT EXISTS idx_opinion_docs ON opinion_documents(sample_id);
  CREATE INDEX IF NOT EXISTS idx_urgency_reminders ON urgency_reminders(sample_id, target_user_id);
  CREATE INDEX IF NOT EXISTS idx_abnormalities ON sample_abnormalities(sample_id);
`);

function migrateExistingData() {
  const users = db.prepare('SELECT id, username, real_name, role FROM users WHERE is_demo = 1').all();
  const acceptor = users.find(u => u.role === 'acceptor');
  const appraisers = users.filter(u => u.role === 'appraiser');
  const qualityController = users.find(u => u.role === 'quality_controller');

  if (appraisers.length === 0 || !acceptor) {
    console.log('No demo users found, skipping migration');
    return;
  }

  const samples = db.prepare('SELECT * FROM samples').all();

  db.prepare('DELETE FROM sample_flows').run();

  const insertFlow = db.prepare(`
    INSERT INTO sample_flows (id, sample_id, from_status, to_status, action_type, operator_id, operator_name, operator_role, remarks, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  const updateSample = db.prepare(`
    UPDATE samples SET assigned_appraiser_id = ?, accepted_by = ?, accepted_at = datetime('now', '-1 day'), updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `);

  const insertDoc = db.prepare(`
    INSERT INTO opinion_documents (id, sample_id, version_number, document_title, document_content, status, created_by, created_by_name, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  const insertReminder = db.prepare(`
    INSERT INTO urgency_reminders (id, sample_id, reminder_type, title, message, target_user_id, created_by, created_by_name, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  const insertAbnormality = db.prepare(`
    INSERT INTO sample_abnormalities (id, sample_id, abnormality_type, description, severity, reported_by, reported_by_name, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  const sampleConfigs = {
    '2024FJ001': {
      assignedAppraiserIndex: 0,
      needsFlows: true,
      flows: [
        { from: 'pending', to: 'pending', action: 'receive', role: 'acceptor', name: acceptor.real_name, remark: '创建样本登记', operatorId: acceptor.id },
        { from: 'pending', to: 'pending', action: 'assign', role: 'acceptor', name: acceptor.real_name, remark: `分配给 ${appraisers[0].real_name}`, operatorId: acceptor.id },
        { from: 'pending', to: 'received', action: 'receive', role: 'acceptor', name: acceptor.real_name, remark: '样本已接收', operatorId: acceptor.id },
        { from: 'received', to: 'processing', action: 'process', role: 'appraiser', name: appraisers[0].real_name, remark: '开始检测分析', operatorId: appraisers[0].id }
      ],
      needsDoc: true,
      doc: { title: '张某交通事故伤残鉴定意见书', content: '根据委托方提供的材料及本所检验结果，被鉴定人张某因交通事故导致左下肢骨折，构成九级伤残。建议给予相应的赔偿。', status: 'reviewing' },
      needsAbnormality: false
    },
    '2024FJ002': {
      assignedAppraiserIndex: 0,
      needsFlows: true,
      flows: [
        { from: 'pending', to: 'pending', action: 'receive', role: 'acceptor', name: acceptor.real_name, remark: '创建样本登记', operatorId: acceptor.id },
        { from: 'pending', to: 'pending', action: 'assign', role: 'acceptor', name: acceptor.real_name, remark: `分配给 ${appraisers[0].real_name}`, operatorId: acceptor.id }
      ],
      needsDoc: false,
      needsReminder: false
    },
    '2024FJ003': {
      assignedAppraiserIndex: 0,
      needsFlows: true,
      flows: [
        { from: 'pending', to: 'pending', action: 'receive', role: 'acceptor', name: acceptor.real_name, remark: '创建样本登记', operatorId: acceptor.id },
        { from: 'pending', to: 'pending', action: 'assign', role: 'acceptor', name: acceptor.real_name, remark: `分配给 ${appraisers[0].real_name}`, operatorId: acceptor.id },
        { from: 'pending', to: 'received', action: 'receive', role: 'acceptor', name: acceptor.real_name, remark: '样本已接收', operatorId: acceptor.id }
      ],
      needsDoc: false,
      needsReminder: true,
      reminder: { type: 'deadline', title: '紧急样本截止日期提醒', message: '王某医疗纠纷鉴定样本已接收，需在1天内完成处理' }
    },
    '2024FJ004': {
      assignedAppraiserIndex: 1,
      needsFlows: true,
      flows: [
        { from: 'pending', to: 'pending', action: 'receive', role: 'acceptor', name: acceptor.real_name, remark: '创建样本登记', operatorId: acceptor.id },
        { from: 'pending', to: 'pending', action: 'assign', role: 'acceptor', name: acceptor.real_name, remark: `分配给 ${appraisers[1].real_name}`, operatorId: acceptor.id },
        { from: 'pending', to: 'received', action: 'receive', role: 'acceptor', name: acceptor.real_name, remark: '样本已接收', operatorId: acceptor.id },
        { from: 'received', to: 'processing', action: 'process', role: 'appraiser', name: appraisers[1].real_name, remark: '开始文件分析', operatorId: appraisers[1].id }
      ],
      needsDoc: true,
      doc: { title: '合同纠纷文件鉴定意见书', content: '经对委托方提供的合同文件进行专业鉴定分析，合同原件与复印件一致，签名系本人书写，不存在伪造痕迹。', status: 'reviewing' }
    },
    '2024FJ005': {
      assignedAppraiserIndex: 0,
      needsFlows: true,
      flows: [
        { from: 'pending', to: 'pending', action: 'receive', role: 'acceptor', name: acceptor.real_name, remark: '创建样本登记', operatorId: acceptor.id },
        { from: 'pending', to: 'pending', action: 'assign', role: 'acceptor', name: acceptor.real_name, remark: `分配给 ${appraisers[0].real_name}`, operatorId: acceptor.id },
        { from: 'pending', to: 'received', action: 'receive', role: 'acceptor', name: acceptor.real_name, remark: '样本已接收', operatorId: acceptor.id },
        { from: 'received', to: 'processing', action: 'process', role: 'appraiser', name: appraisers[0].real_name, remark: '开始DNA检测', operatorId: appraisers[0].id },
        { from: 'processing', to: 'completed', action: 'complete', role: 'appraiser', name: appraisers[0].real_name, remark: '鉴定完成，出具意见书', operatorId: appraisers[0].id }
      ],
      needsDoc: false
    },
    '2024FJ006': {
      assignedAppraiserIndex: 0,
      needsFlows: true,
      flows: [
        { from: 'pending', to: 'pending', action: 'receive', role: 'acceptor', name: acceptor.real_name, remark: '创建样本登记', operatorId: acceptor.id },
        { from: 'pending', to: 'pending', action: 'assign', role: 'acceptor', name: acceptor.real_name, remark: `分配给 ${appraisers[0].real_name}`, operatorId: acceptor.id },
        { from: 'pending', to: 'received', action: 'receive', role: 'acceptor', name: acceptor.real_name, remark: '样本已接收', operatorId: acceptor.id },
        { from: 'received', to: 'processing', action: 'process', role: 'appraiser', name: appraisers[0].real_name, remark: '开始数据恢复', operatorId: appraisers[0].id },
        { from: 'processing', to: 'supplementary', action: 'supplementary', role: 'appraiser', name: appraisers[0].real_name, remark: '需要补充原始存储介质', operatorId: appraisers[0].id }
      ],
      needsDoc: false,
      needsReminder: true,
      reminder: { type: 'supplementary', title: '补充材料催促', message: '请委托人周某尽快提供原始硬盘以完成数据恢复鉴定' }
    },
    '2024FJ007': {
      assignedAppraiserIndex: 1,
      needsFlows: true,
      flows: [
        { from: 'pending', to: 'pending', action: 'receive', role: 'acceptor', name: acceptor.real_name, remark: '创建样本登记', operatorId: acceptor.id },
        { from: 'pending', to: 'pending', action: 'assign', role: 'acceptor', name: acceptor.real_name, remark: `分配给 ${appraisers[1].real_name}`, operatorId: acceptor.id }
      ],
      needsDoc: false
    },
    '2024FJ008': {
      assignedAppraiserIndex: 0,
      needsFlows: true,
      flows: [
        { from: 'pending', to: 'pending', action: 'receive', role: 'acceptor', name: acceptor.real_name, remark: '创建样本登记', operatorId: acceptor.id },
        { from: 'pending', to: 'pending', action: 'assign', role: 'acceptor', name: acceptor.real_name, remark: `分配给 ${appraisers[0].real_name}`, operatorId: acceptor.id },
        { from: 'pending', to: 'received', action: 'receive', role: 'acceptor', name: acceptor.real_name, remark: '样本已接收', operatorId: acceptor.id },
        { from: 'received', to: 'processing', action: 'process', role: 'appraiser', name: appraisers[0].real_name, remark: '开始临床检查', operatorId: appraisers[0].id }
      ],
      needsDoc: true,
      doc: { title: '马某法医临床鉴定意见书', content: '根据对被鉴定人马某的临床检验结果，被鉴定人右眼视力下降与外伤存在因果关系，建议继续康复治疗。', status: 'reviewing' },
      needsAbnormality: true,
      abnormality: { type: 'damage', desc: '样本包装轻微破损', severity: 'low' }
    }
  };

  for (const sample of samples) {
    const config = sampleConfigs[sample.case_number];
    if (!config) continue;

    const appraiserId = appraisers[config.assignedAppraiserIndex]?.id || appraisers[0].id;
    const existingFlows = db.prepare('SELECT COUNT(*) as count FROM sample_flows WHERE sample_id = ?').get(sample.id);

    if (config.needsFlows) {
      const flowCount = config.flows.length;
      for (let i = 0; i < flowCount; i++) {
        const flow = config.flows[i];
        const dayOffset = -(flowCount - i);
        insertFlow.run(
          uuidv4(),
          sample.id,
          flow.from,
          flow.to,
          flow.action,
          flow.operatorId,
          flow.name,
          flow.role,
          flow.remark,
          `${dayOffset} days`
        );
      }
    }

    if (sample.reception_status !== 'pending' && !sample.accepted_by) {
      updateSample.run(appraiserId, acceptor.id, sample.id);
    } else if (!sample.assigned_appraiser_id) {
      db.prepare('UPDATE samples SET assigned_appraiser_id = ? WHERE id = ?').run(appraiserId, sample.id);
    }

    const existingDocs = db.prepare('SELECT COUNT(*) as count FROM opinion_documents WHERE sample_id = ?').get(sample.id);
    if (existingDocs.count === 0 && config.needsDoc && sample.reception_status === 'processing') {
      insertDoc.run(
        uuidv4(),
        sample.id,
        1,
        config.doc.title,
        config.doc.content,
        config.doc.status,
        appraiserId,
        appraisers[config.assignedAppraiserIndex].real_name,
        '-1 days'
      );
    }

    const existingReminders = db.prepare('SELECT COUNT(*) as count FROM urgency_reminders WHERE sample_id = ?').get(sample.id);
    if (existingReminders.count === 0 && config.needsReminder) {
      insertReminder.run(
        uuidv4(),
        sample.id,
        config.reminder.type,
        config.reminder.title,
        config.reminder.message,
        appraiserId,
        acceptor.id,
        acceptor.real_name,
        '-1 days'
      );
    }

    const existingAbnormalities = db.prepare('SELECT COUNT(*) as count FROM sample_abnormalities WHERE sample_id = ?').get(sample.id);
    if (existingAbnormalities.count === 0 && config.needsAbnormality) {
      insertAbnormality.run(
        uuidv4(),
        sample.id,
        config.abnormality.type,
        config.abnormality.desc,
        config.abnormality.severity,
        acceptor.id,
        acceptor.real_name,
        'pending',
        '-1 days'
      );
    }
  }
}

function initializeDemoData() {
  const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  
  if (existingUsers === 0) {
    const demoUsers = [
      {
        id: uuidv4(),
        username: 'acceptor01',
        password_hash: bcrypt.hashSync('demo123', 10),
        real_name: '张受理',
        role: 'acceptor',
        department: '接待中心',
        phone: '13800001001',
        is_demo: 1
      },
      {
        id: uuidv4(),
        username: 'appraiser01',
        password_hash: bcrypt.hashSync('demo123', 10),
        real_name: '李鉴定',
        role: 'appraiser',
        department: '法医室',
        phone: '13800001002',
        is_demo: 1
      },
      {
        id: uuidv4(),
        username: 'appraiser02',
        password_hash: bcrypt.hashSync('demo123', 10),
        real_name: '王鉴定',
        role: 'appraiser',
        department: '文书室',
        phone: '13800001003',
        is_demo: 1
      },
      {
        id: uuidv4(),
        username: 'quality01',
        password_hash: bcrypt.hashSync('demo123', 10),
        real_name: '赵质控',
        role: 'quality_controller',
        department: '质量控制部',
        phone: '13800001004',
        is_demo: 1
      },
      {
        id: uuidv4(),
        username: 'admin',
        password_hash: bcrypt.hashSync('admin123', 10),
        real_name: '系统管理员',
        role: 'admin',
        department: '系统管理',
        phone: '13800000000',
        is_demo: 0
      }
    ];

    const insertUser = db.prepare(`
      INSERT INTO users (id, username, password_hash, real_name, role, department, phone, is_demo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const user of demoUsers) {
      insertUser.run(user.id, user.username, user.password_hash, user.real_name, user.role, user.department, user.phone, user.is_demo);
    }
  }

  const users = db.prepare('SELECT id, username, real_name, role FROM users WHERE is_demo = 1').all();
  const acceptor = users.find(u => u.role === 'acceptor');
  const appraisers = users.filter(u => u.role === 'appraiser');
  const qualityController = users.find(u => u.role === 'quality_controller');

  const checkSampleExists = db.prepare('SELECT id FROM samples WHERE case_number = ?').get('2024FJ001');
  
  if (!checkSampleExists && appraisers.length > 0) {
    const sampleData = [
      { 
        case_num: '2024FJ001', 
        name: '张某交通事故伤残鉴定', 
        client: '张某', 
        phone: '13911110001', 
        type: '血液', 
        count: 2, 
        status: 'processing', 
        priority: 'high', 
        days: '-2 days',
        flows: [
          { from: 'pending', to: 'pending', action: 'receive', role: 'acceptor', name: acceptor?.real_name || '张受理', remark: '创建样本登记' },
          { from: 'pending', to: 'pending', action: 'assign', role: 'acceptor', name: acceptor?.real_name || '张受理', remark: `分配给 ${appraisers[0]?.real_name || '李鉴定'}` },
          { from: 'pending', to: 'received', action: 'receive', role: 'acceptor', name: acceptor?.real_name || '张受理', remark: '样本已接收' },
          { from: 'received', to: 'processing', action: 'process', role: 'appraiser', name: appraisers[0]?.real_name || '李鉴定', remark: '开始检测分析' }
        ],
        doc: { title: '张某交通事故伤残鉴定意见书', content: '根据委托方提供的材料及本所检验结果，被鉴定人张某因交通事故导致...', status: 'reviewing' }
      },
      { 
        case_num: '2024FJ002', 
        name: '李某遗产继承笔迹鉴定', 
        client: '李某', 
        phone: '13911110002', 
        type: '笔迹', 
        count: 5, 
        status: 'pending', 
        priority: 'normal', 
        days: '+14 days',
        flows: [
          { from: 'pending', to: 'pending', action: 'receive', role: 'acceptor', name: acceptor?.real_name || '张受理', remark: '创建样本登记' }
        ]
      },
      { 
        case_num: '2024FJ003', 
        name: '王某医疗纠纷鉴定', 
        client: '王某', 
        phone: '13911110003', 
        type: '组织', 
        count: 1, 
        status: 'received', 
        priority: 'urgent', 
        days: '-1 day',
        flows: [
          { from: 'pending', to: 'pending', action: 'receive', role: 'acceptor', name: acceptor?.real_name || '张受理', remark: '创建样本登记' },
          { from: 'pending', to: 'pending', action: 'assign', role: 'acceptor', name: acceptor?.real_name || '张受理', remark: `分配给 ${appraisers[0]?.real_name || '李鉴定'}` },
          { from: 'pending', to: 'received', action: 'receive', role: 'acceptor', name: acceptor?.real_name || '张受理', remark: '样本已接收' }
        ],
        reminder: { type: 'deadline', title: '紧急样本截止日期提醒', message: '王某医疗纠纷鉴定样本已接收，需在1天内完成处理' }
      },
      { 
        case_num: '2024FJ004', 
        name: '某公司合同纠纷文件鉴定', 
        client: '某公司', 
        phone: '13911110004', 
        type: '文件', 
        count: 10, 
        status: 'processing', 
        priority: 'normal', 
        days: '+10 days',
        flows: [
          { from: 'pending', to: 'pending', action: 'receive', role: 'acceptor', name: acceptor?.real_name || '张受理', remark: '创建样本登记' },
          { from: 'pending', to: 'pending', action: 'assign', role: 'acceptor', name: acceptor?.real_name || '张受理', remark: `分配给 ${appraisers[1]?.real_name || '王鉴定'}` },
          { from: 'pending', to: 'received', action: 'receive', role: 'acceptor', name: acceptor?.real_name || '张受理', remark: '样本已接收' },
          { from: 'received', to: 'processing', action: 'process', role: 'appraiser', name: appraisers[1]?.real_name || '王鉴定', remark: '开始文件分析' }
        ],
        doc: { title: '合同纠纷文件鉴定意见书', content: '经对委托方提供的合同文件进行专业鉴定分析，结论如下...', status: 'reviewing' }
      },
      { 
        case_num: '2024FJ005', 
        name: '陈某亲子鉴定', 
        client: '陈某', 
        phone: '13911110005', 
        type: '血液', 
        count: 3, 
        status: 'completed', 
        priority: 'normal', 
        days: '+5 days',
        flows: [
          { from: 'pending', to: 'pending', action: 'receive', role: 'acceptor', name: acceptor?.real_name || '张受理', remark: '创建样本登记' },
          { from: 'pending', to: 'pending', action: 'assign', role: 'acceptor', name: acceptor?.real_name || '张受理', remark: `分配给 ${appraisers[0]?.real_name || '李鉴定'}` },
          { from: 'pending', to: 'received', action: 'receive', role: 'acceptor', name: acceptor?.real_name || '张受理', remark: '样本已接收' },
          { from: 'received', to: 'processing', action: 'process', role: 'appraiser', name: appraisers[0]?.real_name || '李鉴定', remark: '开始DNA检测' },
          { from: 'processing', to: 'completed', action: 'complete', role: 'appraiser', name: appraisers[0]?.real_name || '李鉴定', remark: '鉴定完成，出具意见书' }
        ]
      },
      { 
        case_num: '2024FJ006', 
        name: '周某电子数据恢复鉴定', 
        client: '周某', 
        phone: '13911110006', 
        type: '电子数据', 
        count: 1, 
        status: 'supplementary', 
        priority: 'high', 
        days: '+21 days',
        flows: [
          { from: 'pending', to: 'pending', action: 'receive', role: 'acceptor', name: acceptor?.real_name || '张受理', remark: '创建样本登记' },
          { from: 'pending', to: 'pending', action: 'assign', role: 'acceptor', name: acceptor?.real_name || '张受理', remark: `分配给 ${appraisers[0]?.real_name || '李鉴定'}` },
          { from: 'pending', to: 'received', action: 'receive', role: 'acceptor', name: acceptor?.real_name || '张受理', remark: '样本已接收' },
          { from: 'received', to: 'processing', action: 'process', role: 'appraiser', name: appraisers[0]?.real_name || '李鉴定', remark: '开始数据恢复' },
          { from: 'processing', to: 'supplementary', action: 'supplementary', role: 'appraiser', name: appraisers[0]?.real_name || '李鉴定', remark: '需要补充原始存储介质' }
        ],
        reminder: { type: 'supplementary', title: '补充材料催促', message: '请委托人周某尽快提供原始硬盘以完成数据恢复鉴定' }
      },
      { 
        case_num: '2024FJ007', 
        name: '刘某指纹比对鉴定', 
        client: '刘某', 
        phone: '13911110007', 
        type: '指纹', 
        count: 2, 
        status: 'pending', 
        priority: 'low', 
        days: '+30 days',
        flows: [
          { from: 'pending', to: 'pending', action: 'receive', role: 'acceptor', name: acceptor?.real_name || '张受理', remark: '创建样本登记' }
        ]
      },
      { 
        case_num: '2024FJ008', 
        name: '马某法医临床鉴定', 
        client: '马某', 
        phone: '13911110008', 
        type: '其他', 
        count: 1, 
        status: 'processing', 
        priority: 'urgent', 
        days: '-3 days',
        flows: [
          { from: 'pending', to: 'pending', action: 'receive', role: 'acceptor', name: acceptor?.real_name || '张受理', remark: '创建样本登记' },
          { from: 'pending', to: 'pending', action: 'assign', role: 'acceptor', name: acceptor?.real_name || '张受理', remark: `分配给 ${appraisers[0]?.real_name || '李鉴定'}` },
          { from: 'pending', to: 'received', action: 'receive', role: 'acceptor', name: acceptor?.real_name || '张受理', remark: '样本已接收' },
          { from: 'received', to: 'processing', action: 'process', role: 'appraiser', name: appraisers[0]?.real_name || '李鉴定', remark: '开始临床检查' }
        ],
        doc: { title: '马某法医临床鉴定意见书', content: '根据对被鉴定人马某的临床检验结果，鉴定意见如下...', status: 'reviewing' },
        abnormality: { type: 'damage', desc: '样本包装轻微破损', severity: 'low' }
      }
    ];

    const insertSample = db.prepare(`
      INSERT INTO samples (id, case_number, case_name, client_name, client_phone, sample_type, sample_count, sample_description, reception_status, priority, assigned_appraiser_id, accepted_by, due_date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?), datetime('now', ?))
    `);

    const insertFlow = db.prepare(`
      INSERT INTO sample_flows (id, sample_id, from_status, to_status, action_type, operator_id, operator_name, operator_role, remarks, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
    `);

    const insertDoc = db.prepare(`
      INSERT INTO opinion_documents (id, sample_id, version_number, document_title, document_content, status, created_by, created_by_name, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
    `);

    const insertReminder = db.prepare(`
      INSERT INTO urgency_reminders (id, sample_id, reminder_type, title, message, target_user_id, created_by, created_by_name, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
    `);

    const insertAbnormality = db.prepare(`
      INSERT INTO sample_abnormalities (id, sample_id, abnormality_type, description, severity, reported_by, reported_by_name, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
    `);

    for (const sample of sampleData) {
      const sampleId = uuidv4();
      const appraiserId = appraisers[Math.floor(Math.random() * appraisers.length)].id;

      insertSample.run(
        sampleId,
        sample.case_num,
        sample.name,
        sample.client,
        sample.phone,
        sample.type,
        sample.count,
        `样本状态：${sample.status === 'processing' ? '检测中' : sample.status === 'pending' ? '待接收' : sample.status === 'supplementary' ? '需补充' : sample.status}`,
        sample.status,
        sample.priority,
        appraiserId,
        sample.status !== 'pending' ? acceptor?.id : null,
        sample.days,
        sample.days
      );

      if (sample.flows && sample.flows.length > 0) {
        sample.flows.forEach((flow, index) => {
          insertFlow.run(
            uuidv4(),
            sampleId,
            flow.from,
            flow.to,
            flow.action,
            acceptor?.id || uuidv4(),
            flow.name,
            flow.role,
            flow.remark,
            `-${index + 1} days`
          );
        });
      }

      if (sample.doc) {
        insertDoc.run(
          uuidv4(),
          sampleId,
          1,
          sample.doc.title,
          sample.doc.content,
          sample.doc.status,
          appraiserId,
          appraisers[0]?.real_name || '李鉴定',
          '-1 days'
        );
      }

      if (sample.reminder) {
        insertReminder.run(
          uuidv4(),
          sampleId,
          sample.reminder.type,
          sample.reminder.title,
          sample.reminder.message,
          appraiserId,
          acceptor?.id || uuidv4(),
          acceptor?.real_name || '张受理',
          '-1 days'
        );
      }

      if (sample.abnormality) {
        insertAbnormality.run(
          uuidv4(),
          sampleId,
          sample.abnormality.type,
          sample.abnormality.desc,
          sample.abnormality.severity,
          acceptor?.id || uuidv4(),
          acceptor?.real_name || '张受理',
          'pending',
          '-1 days'
        );
      }
    }
  }
  
  migrateExistingData();
}

initializeDemoData();

export default db;
