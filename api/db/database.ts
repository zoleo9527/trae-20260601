import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', '..', 'data', 'fire_maintenance.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initDatabase(): void {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('engineer', 'supervisor', 'property')),
      phone TEXT,
      department TEXT
    );

    CREATE TABLE IF NOT EXISTS inspections (
      id TEXT PRIMARY KEY,
      facility_type TEXT NOT NULL,
      facility_name TEXT NOT NULL,
      location TEXT NOT NULL,
      risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending_review',
      discoverer_id TEXT NOT NULL,
      discovery_time TEXT NOT NULL,
      review_result TEXT CHECK (review_result IN ('pass', 'fail')),
      review_remark TEXT,
      review_time TEXT,
      reviewer_id TEXT,
      FOREIGN KEY (discoverer_id) REFERENCES users(id),
      FOREIGN KEY (reviewer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY,
      inspection_id TEXT NOT NULL,
      url TEXT NOT NULL,
      thumbnail_url TEXT NOT NULL,
      description TEXT,
      upload_time TEXT NOT NULL,
      uploader_id TEXT NOT NULL,
      FOREIGN KEY (inspection_id) REFERENCES inspections(id),
      FOREIGN KEY (uploader_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS status_logs (
      id TEXT PRIMARY KEY,
      inspection_id TEXT NOT NULL,
      from_status TEXT,
      to_status TEXT NOT NULL,
      operator_id TEXT NOT NULL,
      remark TEXT,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (inspection_id) REFERENCES inspections(id),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS dispatches (
      id TEXT PRIMARY KEY,
      inspection_id TEXT NOT NULL,
      dispatcher_id TEXT NOT NULL,
      receiver_id TEXT NOT NULL,
      dispatch_time TEXT NOT NULL,
      expected_completion_time TEXT,
      actual_completion_time TEXT,
      dispatch_remark TEXT,
      rectification_remark TEXT,
      FOREIGN KEY (inspection_id) REFERENCES inspections(id),
      FOREIGN KEY (dispatcher_id) REFERENCES users(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);
    CREATE INDEX IF NOT EXISTS idx_inspections_risk_level ON inspections(risk_level);
    CREATE INDEX IF NOT EXISTS idx_dispatches_inspection_id ON dispatches(inspection_id);
    CREATE INDEX IF NOT EXISTS idx_photos_inspection_id ON photos(inspection_id);
    CREATE INDEX IF NOT EXISTS idx_status_logs_inspection_id ON status_logs(inspection_id);
  `);

  const userCount = database.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    seedDatabase();
  }
}

function seedDatabase(): void {
  const database = getDb();

  const insertUser = database.prepare(`
    INSERT INTO users (id, name, role, phone, department)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertUser.run('u001', '张工', 'engineer', '13800138001', '巡检部');
  insertUser.run('u002', '李主管', 'supervisor', '13800138002', '维保部');
  insertUser.run('u003', '王经理', 'property', '13800138003', '物业部');

  const insertInspection = database.prepare(`
    INSERT INTO inspections (id, facility_type, facility_name, location, risk_level, description, status, discoverer_id, discovery_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertInspection.run(
    'i001',
    '灭火器',
    '干粉灭火器 MFZ/ABC4',
    'A栋1层走廊西侧',
    'high',
    '灭火器压力表显示压力不足，瓶身锈蚀，有效期至2025年12月，已过期6个月',
    'dispatched',
    'u001',
    '2026-06-01 09:30:00'
  );

  insertInspection.run(
    'i002',
    '消防通道',
    '疏散通道',
    'B栋地下车库2区',
    'critical',
    '消防通道被杂物和废弃家具堵塞，通道宽度不足1米，严重影响疏散',
    'in_progress',
    'u001',
    '2026-06-02 14:20:00'
  );

  insertInspection.run(
    'i003',
    '消防栓',
    '室内消火栓 SN65',
    'C栋15层东侧',
    'medium',
    '消防栓出水压力不足，测试时水压仅0.15MPa，低于规范要求的0.35MPa',
    'pending_review_after',
    'u001',
    '2026-06-03 10:45:00'
  );

  const insertPhoto = database.prepare(`
    INSERT INTO photos (id, inspection_id, url, thumbnail_url, description, upload_time, uploader_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertPhoto.run(
    'p001', 'i001',
    'https://picsum.photos/seed/fire-extinguisher/800/600',
    'https://picsum.photos/seed/fire-extinguisher/200/150',
    '灭火器过期压力表照片',
    '2026-06-01 09:31:00',
    'u001'
  );
  insertPhoto.run(
    'p002', 'i001',
    'https://picsum.photos/seed/fire-extinguisher2/800/600',
    'https://picsum.photos/seed/fire-extinguisher2/200/150',
    '瓶身锈蚀情况',
    '2026-06-01 09:32:00',
    'u001'
  );
  insertPhoto.run(
    'p003', 'i002',
    'https://picsum.photos/seed/blocked-passage/800/600',
    'https://picsum.photos/seed/blocked-passage/200/150',
    '通道堵塞全景',
    '2026-06-02 14:21:00',
    'u001'
  );
  insertPhoto.run(
    'p004', 'i002',
    'https://picsum.photos/seed/blocked-passage2/800/600',
    'https://picsum.photos/seed/blocked-passage2/200/150',
    '堵塞物细节',
    '2026-06-02 14:22:00',
    'u001'
  );
  insertPhoto.run(
    'p005', 'i003',
    'https://picsum.photos/seed/fire-hydrant/800/600',
    'https://picsum.photos/seed/fire-hydrant/200/150',
    '消防栓外观',
    '2026-06-03 10:46:00',
    'u001'
  );
  insertPhoto.run(
    'p006', 'i003',
    'https://picsum.photos/seed/fire-hydrant2/800/600',
    'https://picsum.photos/seed/fire-hydrant2/200/150',
    '水压测试表读数',
    '2026-06-03 10:47:00',
    'u001'
  );

  const insertStatusLog = database.prepare(`
    INSERT INTO status_logs (id, inspection_id, from_status, to_status, operator_id, remark, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertStatusLog.run('s001', 'i001', null, 'pending_review', 'u001', '提交抽检记录', '2026-06-01 09:30:00');
  insertStatusLog.run('s002', 'i001', 'pending_review', 'dispatched', 'u002', '高风险隐患，需立即整改', '2026-06-01 10:00:00');
  insertStatusLog.run('s003', 'i002', null, 'pending_review', 'u001', '提交抽检记录', '2026-06-02 14:20:00');
  insertStatusLog.run('s004', 'i002', 'pending_review', 'dispatched', 'u002', '紧急隐患，24小时内必须清理', '2026-06-02 14:30:00');
  insertStatusLog.run('s005', 'i002', 'dispatched', 'in_progress', 'u003', '已安排人员清理', '2026-06-02 15:00:00');
  insertStatusLog.run('s006', 'i003', null, 'pending_review', 'u001', '提交抽检记录', '2026-06-03 10:45:00');
  insertStatusLog.run('s007', 'i003', 'pending_review', 'dispatched', 'u002', '请检查水泵压力', '2026-06-03 11:00:00');
  insertStatusLog.run('s008', 'i003', 'dispatched', 'in_progress', 'u003', '已联系维保公司检修', '2026-06-03 14:00:00');
  insertStatusLog.run('s009', 'i003', 'in_progress', 'completed', 'u003', '水泵已检修，水压恢复正常', '2026-06-04 16:30:00');
  insertStatusLog.run('s010', 'i003', 'completed', 'pending_review_after', 'u003', '申请复查', '2026-06-04 16:31:00');

  database.prepare(`
    UPDATE inspections
    SET review_result = 'pass', review_remark = '水压已恢复至0.38MPa，符合规范要求', review_time = '2026-06-05 09:20:00', reviewer_id = 'u001'
    WHERE id = 'i003'
  `).run();

  const insertDispatch = database.prepare(`
    INSERT INTO dispatches (id, inspection_id, dispatcher_id, receiver_id, dispatch_time, expected_completion_time, dispatch_remark, rectification_remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertDispatch.run(
    'd001', 'i001', 'u002', 'u003',
    '2026-06-01 10:00:00',
    '2026-06-05 17:00:00',
    '高风险隐患，请立即更换过期灭火器',
    null
  );
  insertDispatch.run(
    'd002', 'i002', 'u002', 'u003',
    '2026-06-02 14:30:00',
    '2026-06-03 14:30:00',
    '紧急隐患，24小时内必须清理完毕，确保通道畅通',
    '已安排人员清理通道'
  );
  insertDispatch.run(
    'd003', 'i003', 'u002', 'u003',
    '2026-06-03 11:00:00',
    '2026-06-05 17:00:00',
    '请检查消防水泵压力，必要时联系维保公司检修',
    '水泵已检修，水压恢复正常'
  );
}
