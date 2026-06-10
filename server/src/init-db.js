const fs = require('fs');
const path = require('path');
const db = require('./db');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('service', 'guide', 'warehouse')),
    phone TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS fruits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    unit TEXT DEFAULT '斤',
    price REAL DEFAULT 0,
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS receptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reception_no TEXT UNIQUE NOT NULL,
    group_name TEXT NOT NULL,
    contact_person TEXT,
    contact_phone TEXT,
    people_count INTEGER DEFAULT 0,
    scheduled_date TEXT NOT NULL,
    scheduled_time TEXT,
    source TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'assigned', 'picking', 'completed', 'cancelled')),
    remark TEXT,
    created_by INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS guide_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_no TEXT UNIQUE NOT NULL,
    reception_id INTEGER NOT NULL,
    guide_id INTEGER NOT NULL,
    assigned_by INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'assigned' CHECK(status IN ('assigned', 'in_progress', 'completed', 'cancelled')),
    picking_area TEXT,
    fruit_details TEXT,
    total_weight REAL DEFAULT 0,
    start_time TEXT,
    end_time TEXT,
    remark TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (reception_id) REFERENCES receptions(id),
    FOREIGN KEY (guide_id) REFERENCES users(id),
    FOREIGN KEY (assigned_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS warehouse_transfers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transfer_no TEXT UNIQUE NOT NULL,
    guide_task_id INTEGER NOT NULL,
    received_by INTEGER,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'received', 'stored')),
    fruit_details TEXT,
    total_weight REAL DEFAULT 0,
    storage_location TEXT,
    received_time TEXT,
    stored_time TEXT,
    remark TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (guide_task_id) REFERENCES guide_tasks(id),
    FOREIGN KEY (received_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    biz_type TEXT NOT NULL,
    biz_id INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT,
    file_size INTEGER DEFAULT 0,
    file_type TEXT,
    uploaded_by INTEGER,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    biz_type TEXT NOT NULL,
    biz_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    operator_id INTEGER,
    operator_name TEXT,
    detail TEXT,
    ip TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT NOT NULL,
    content TEXT,
    biz_type TEXT,
    biz_id INTEGER,
    reception_id INTEGER,
    type TEXT DEFAULT 'system',
    is_read INTEGER DEFAULT 0,
    read_time TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (reception_id) REFERENCES receptions(id)
  );

  CREATE INDEX IF NOT EXISTS idx_receptions_status ON receptions(status);
  CREATE INDEX IF NOT EXISTS idx_receptions_date ON receptions(scheduled_date);
  CREATE INDEX IF NOT EXISTS idx_guide_tasks_guide ON guide_tasks(guide_id);
  CREATE INDEX IF NOT EXISTS idx_guide_tasks_status ON guide_tasks(status);
  CREATE INDEX IF NOT EXISTS idx_warehouse_transfers_status ON warehouse_transfers(status);
  CREATE INDEX IF NOT EXISTS idx_attachments_biz ON attachments(biz_type, biz_id);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_biz ON audit_logs(biz_type, biz_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
  CREATE INDEX IF NOT EXISTS idx_notifications_reception ON notifications(reception_id);
`);

const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
if (userCount === 0) {
  const insertUser = db.prepare(
    'INSERT INTO users (username, name, role, phone) VALUES (?, ?, ?, ?)'
  );
  insertUser.run('service01', '李客服', 'service', '13800138001');
  insertUser.run('guide01', '王向导', 'guide', '13800138002');
  insertUser.run('guide02', '张向导', 'guide', '13800138003');
  insertUser.run('warehouse01', '陈仓库', 'warehouse', '13800138004');
  console.log('已初始化用户数据');
}

const fruitCount = db.prepare('SELECT COUNT(*) as count FROM fruits').get().count;
if (fruitCount === 0) {
  const insertFruit = db.prepare(
    'INSERT INTO fruits (name, unit, price) VALUES (?, ?, ?)'
  );
  insertFruit.run('草莓', '斤', 30);
  insertFruit.run('樱桃', '斤', 50);
  insertFruit.run('蓝莓', '盒', 25);
  insertFruit.run('葡萄', '斤', 15);
  insertFruit.run('水蜜桃', '斤', 20);
  console.log('已初始化果品数据');
}

console.log('数据库初始化完成');
db.close();
