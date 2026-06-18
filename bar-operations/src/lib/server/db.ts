import Database from 'better-sqlite3';
import { dev } from '$app/environment';

const dbPath = dev ? 'science-museum.db' : '.data/science-museum.db';
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('exhibitor', 'engineer', 'teacher', 'admin')),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS exhibits (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    status TEXT DEFAULT 'normal' CHECK(status IN ('normal', 'inspecting', 'fault_pending', 'repairing')),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS inspections (
    id TEXT PRIMARY KEY,
    exhibit_id TEXT NOT NULL,
    inspector_id TEXT NOT NULL,
    result TEXT NOT NULL CHECK(result IN ('normal', 'abnormal')),
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (exhibit_id) REFERENCES exhibits(id),
    FOREIGN KEY (inspector_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS fault_reports (
    id TEXT PRIMARY KEY,
    exhibit_id TEXT NOT NULL,
    reporter_id TEXT NOT NULL,
    assignee_id TEXT,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed')),
    repair_notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    received_at TEXT,
    completed_at TEXT,
    FOREIGN KEY (exhibit_id) REFERENCES exhibits(id),
    FOREIGN KEY (reporter_id) REFERENCES users(id),
    FOREIGN KEY (assignee_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS operation_logs (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    operator_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    target_type TEXT NOT NULL,
    details TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (operator_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_exhibits_status ON exhibits(status);
  CREATE INDEX IF NOT EXISTS idx_inspections_exhibit ON inspections(exhibit_id);
  CREATE INDEX IF NOT EXISTS idx_fault_reports_status ON fault_reports(status);
  CREATE INDEX IF NOT EXISTS idx_fault_reports_exhibit ON fault_reports(exhibit_id);
  CREATE INDEX IF NOT EXISTS idx_operation_logs_created ON operation_logs(created_at DESC);
`);

export default db;

export function seedDatabase() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) {
    return;
  }

  const users = [
    { id: 'user-exhibitor-1', name: '张展教', role: 'exhibitor' },
    { id: 'user-engineer-1', name: '李工程师', role: 'engineer' },
    { id: 'user-teacher-1', name: '王活动老师', role: 'teacher' },
    { id: 'user-admin-1', name: '系统管理员', role: 'admin' }
  ];

  const insertUser = db.prepare('INSERT INTO users (id, name, role) VALUES (?, ?, ?)');
  users.forEach(user => insertUser.run(user.id, user.name, user.role));

  const exhibits = [
    { id: 'exhibit-1', name: '电磁感应演示', location: '一楼科学探秘区A-01', status: 'normal' },
    { id: 'exhibit-2', name: '力学互动墙', location: '一楼科学探秘区A-02', status: 'normal' },
    { id: 'exhibit-3', name: '声波可视化', location: '二楼声光世界B-01', status: 'fault_pending' },
    { id: 'exhibit-4', name: '水循环演示', location: '二楼水世界B-02', status: 'normal' },
    { id: 'exhibit-5', name: '机器人舞蹈', location: '三楼智能科技区C-01', status: 'repairing' },
    { id: 'exhibit-6', name: 'VR体验舱', location: '三楼智能科技区C-02', status: 'normal' },
    { id: 'exhibit-7', name: '天文望远镜', location: '四楼宇宙探索区D-01', status: 'normal' },
    { id: 'exhibit-8', name: '生命科学展', location: '四楼生命奥秘区D-02', status: 'normal' }
  ];

  const insertExhibit = db.prepare('INSERT INTO exhibits (id, name, location, status) VALUES (?, ?, ?, ?)');
  exhibits.forEach(exhibit => insertExhibit.run(exhibit.id, exhibit.name, exhibit.location, exhibit.status));

  const inspections = [
    {
      id: 'insp-1',
      exhibit_id: 'exhibit-3',
      inspector_id: 'user-exhibitor-1',
      result: 'abnormal',
      notes: '声波传感器无响应，显示屏黑屏',
      created_at: "datetime('now', '-3 days')"
    },
    {
      id: 'insp-2',
      exhibit_id: 'exhibit-5',
      inspector_id: 'user-exhibitor-1',
      result: 'abnormal',
      notes: '机器人动作卡顿，电机异响',
      created_at: "datetime('now', '-2 days')"
    },
    {
      id: 'insp-3',
      exhibit_id: 'exhibit-1',
      inspector_id: 'user-exhibitor-1',
      result: 'normal',
      notes: '设备运行正常',
      created_at: "datetime('now', '-1 day')"
    }
  ];

  const insertInspection = db.prepare(
    'INSERT INTO inspections (id, exhibit_id, inspector_id, result, notes, created_at) VALUES (?, ?, ?, ?, ?, datetime("now", ?))'
  );
  inspections.forEach(insp => insertInspection.run(insp.id, insp.exhibit_id, insp.inspector_id, insp.result, insp.notes, insp.created_at));

  const faultReports = [
    {
      id: 'fault-1',
      exhibit_id: 'exhibit-3',
      reporter_id: 'user-exhibitor-1',
      assignee_id: 'user-engineer-1',
      description: '声波传感器无响应，显示屏黑屏',
      status: 'pending',
      repair_notes: null,
      created_at: "datetime('now', '-3 days')",
      received_at: null,
      completed_at: null
    },
    {
      id: 'fault-2',
      exhibit_id: 'exhibit-5',
      reporter_id: 'user-exhibitor-1',
      assignee_id: 'user-engineer-1',
      description: '机器人动作卡顿，电机异响',
      status: 'processing',
      repair_notes: '已更换主电机，正在测试',
      created_at: "datetime('now', '-2 days')",
      received_at: "datetime('now', '-2 days')",
      completed_at: null
    }
  ];

  const insertFault = db.prepare(`
    INSERT INTO fault_reports (id, exhibit_id, reporter_id, assignee_id, description, status, repair_notes, created_at, received_at, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', ?), ?, ?)
  `);
  faultReports.forEach(fault => insertFault.run(
    fault.id,
    fault.exhibit_id,
    fault.reporter_id,
    fault.assignee_id,
    fault.description,
    fault.status,
    fault.repair_notes,
    fault.created_at,
    fault.received_at,
    fault.completed_at
  ));

  const logs = [
    {
      id: 'log-1',
      type: 'fault_reported',
      operator_id: 'user-exhibitor-1',
      target_id: 'fault-1',
      target_type: 'fault_report',
      details: '提交故障报修：声波传感器无响应',
      created_at: "datetime('now', '-3 days')"
    },
    {
      id: 'log-2',
      type: 'fault_received',
      operator_id: 'user-engineer-1',
      target_id: 'fault-1',
      target_type: 'fault_report',
      details: '设备工程师李工程师接收故障工单',
      created_at: "datetime('now', '-3 days', '+1 hour')"
    },
    {
      id: 'log-3',
      type: 'fault_reported',
      operator_id: 'user-exhibitor-1',
      target_id: 'fault-2',
      target_type: 'fault_report',
      details: '提交故障报修：机器人动作卡顿',
      created_at: "datetime('now', '-2 days')"
    },
    {
      id: 'log-4',
      type: 'fault_received',
      operator_id: 'user-engineer-1',
      target_id: 'fault-2',
      target_type: 'fault_report',
      details: '设备工程师李工程师接收故障工单',
      created_at: "datetime('now', '-2 days', '+30 minutes')"
    },
    {
      id: 'log-5',
      type: 'fault_processed',
      operator_id: 'user-engineer-1',
      target_id: 'fault-2',
      target_type: 'fault_report',
      details: '正在维修：已更换主电机',
      created_at: "datetime('now', '-2 days', '+2 hours')"
    }
  ];

  const insertLog = db.prepare(`
    INSERT INTO operation_logs (id, type, operator_id, target_id, target_type, details, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);
  logs.forEach(log => insertLog.run(log.id, log.type, log.operator_id, log.target_id, log.target_type, log.details, log.created_at));
}

export function resetDatabase() {
  db.exec(`
    DELETE FROM operation_logs;
    DELETE FROM fault_reports;
    DELETE FROM inspections;
    DELETE FROM exhibits;
    DELETE FROM users;
  `);

  seedDatabase();
}
