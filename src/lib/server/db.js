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

function initializeDemoData() {
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
    INSERT OR IGNORE INTO users (id, username, password_hash, real_name, role, department, phone, is_demo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const user of demoUsers) {
    insertUser.run(user.id, user.username, user.password_hash, user.real_name, user.role, user.department, user.phone, user.is_demo);
  }

  const sampleTypes = ['血液', '尿液', '毛发', '组织', '指纹', '笔迹', '文件', '电子数据', '其他'];
  const statuses = ['pending', 'received', 'processing', 'completed'];
  const priorities = ['low', 'normal', 'high', 'urgent'];
  const appraisers = db.prepare('SELECT id FROM users WHERE role = ?').all('appraiser');
  
  const insertSample = db.prepare(`
    INSERT OR IGNORE INTO samples (id, case_number, case_name, client_name, client_phone, sample_type, sample_count, sample_description, reception_status, priority, assigned_appraiser_id, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  if (appraisers.length > 0) {
    const sampleData = [
      { case_num: '2024FJ001', name: '张某交通事故伤残鉴定', client: '张某', phone: '13911110001', type: '血液', count: 2, status: 'processing', priority: 'high', days: '+7 days' },
      { case_num: '2024FJ002', name: '李某遗产继承笔迹鉴定', client: '李某', phone: '13911110002', type: '笔迹', count: 5, status: 'pending', priority: 'normal', days: '+14 days' },
      { case_num: '2024FJ003', name: '王某医疗纠纷鉴定', client: '王某', phone: '13911110003', type: '组织', count: 1, status: 'received', priority: 'urgent', days: '+3 days' },
      { case_num: '2024FJ004', name: '某公司合同纠纷文件鉴定', client: '某公司', phone: '13911110004', type: '文件', count: 10, status: 'processing', priority: 'normal', days: '+10 days' },
      { case_num: '2024FJ005', name: '陈某亲子鉴定', client: '陈某', phone: '13911110005', type: '血液', count: 3, status: 'completed', priority: 'normal', days: '+5 days' },
      { case_num: '2024FJ006', name: '周某电子数据恢复鉴定', client: '周某', phone: '13911110006', type: '电子数据', count: 1, status: 'supplementary', priority: 'high', days: '+21 days' },
      { case_num: '2024FJ007', name: '刘某指纹比对鉴定', client: '刘某', phone: '13911110007', type: '指纹', count: 2, status: 'pending', priority: 'low', days: '+30 days' },
      { case_num: '2024FJ008', name: '马某法医临床鉴定', client: '马某', phone: '13911110008', type: '其他', count: 1, status: 'processing', priority: 'urgent', days: '+2 days' }
    ];

    for (const sample of sampleData) {
      const appraiserId = appraisers[Math.floor(Math.random() * appraisers.length)].id;
      insertSample.run(
        uuidv4(),
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
        sample.days
      );
    }
  }
}

initializeDemoData();

export default db;
