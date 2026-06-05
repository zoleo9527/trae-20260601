import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const dbDir = path.join(process.cwd(), 'data')
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const dbPath = path.join(dbDir, 'climbing.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    level TEXT NOT NULL,
    duration_min INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS belayers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'on_duty'
);

CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_name TEXT NOT NULL,
    member_phone TEXT NOT NULL,
    course_id INTEGER NOT NULL REFERENCES courses(id),
    belayer_id INTEGER REFERENCES belayers(id),
    booking_date TEXT NOT NULL,
    time_slot TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','in_progress','completed','cancelled')),
    idempotency_key TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS equipment_issuances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER REFERENCES bookings(id),
    member_name TEXT NOT NULL,
    equipment_type TEXT NOT NULL,
    equipment_id TEXT NOT NULL,
    condition_out TEXT NOT NULL DEFAULT '良好',
    condition_in TEXT,
    issued_by TEXT NOT NULL,
    issued_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    returned_at TEXT,
    returned_by TEXT,
    idempotency_key TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS anomalies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER REFERENCES bookings(id),
    issuance_id INTEGER REFERENCES equipment_issuances(id),
    description TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium' CHECK(severity IN ('low','medium','high')),
    status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','resolved')),
    reported_by TEXT NOT NULL,
    resolved_by TEXT,
    resolution TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS handover_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pending_bookings INTEGER NOT NULL DEFAULT 0,
    unreturned_equipment INTEGER NOT NULL DEFAULT 0,
    open_anomalies INTEGER NOT NULL DEFAULT 0,
    operator_out TEXT NOT NULL,
    operator_in TEXT NOT NULL,
    notes TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS shift_todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('high','medium','low')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','done')),
    created_by TEXT NOT NULL,
    completed_by TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_issuances_returned ON equipment_issuances(returned_at);
CREATE INDEX IF NOT EXISTS idx_anomalies_status ON anomalies(status);
CREATE INDEX IF NOT EXISTS idx_todos_status ON shift_todos(status);
`)

const countCourses = db.prepare('SELECT COUNT(*) as cnt FROM courses').get() as { cnt: number }
if (countCourses.cnt === 0) {
  const insertCourse = db.prepare('INSERT INTO courses (name, level, duration_min) VALUES (?, ?, ?)')
  insertCourse.run('基础攀岩体验', '初级', 90)
  insertCourse.run('进阶攀岩技术', '中级', 120)
  insertCourse.run('顶绳保护训练', '高级', 60)
  insertCourse.run('抱石入门', '初级', 75)

  const insertBelayer = db.prepare('INSERT INTO belayers (name, phone, status) VALUES (?, ?, ?)')
  insertBelayer.run('张磊', '13800001111', 'on_duty')
  insertBelayer.run('王静', '13800002222', 'on_duty')
  insertBelayer.run('李明', '13800003333', 'off_duty')

  const insertBooking = db.prepare(`INSERT INTO bookings (member_name, member_phone, course_id, belayer_id, booking_date, time_slot, status, idempotency_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
  insertBooking.run('赵强', '13900001111', 1, 1, '2026-06-05', '10:00-11:30', 'pending', 'seed-booking-1')
  insertBooking.run('孙丽', '13900002222', 2, 2, '2026-06-05', '13:00-15:00', 'confirmed', 'seed-booking-2')
  insertBooking.run('周伟', '13900003333', 3, 1, '2026-06-05', '14:00-15:00', 'in_progress', 'seed-booking-3')
  insertBooking.run('吴芳', '13900004444', 4, 2, '2026-06-05', '09:00-10:15', 'completed', 'seed-booking-4')
  insertBooking.run('郑鹏', '13900005555', 1, null, '2026-06-05', '16:00-17:30', 'cancelled', 'seed-booking-5')

  const insertIssuance = db.prepare(`INSERT INTO equipment_issuances (booking_id, member_name, equipment_type, equipment_id, condition_out, condition_in, issued_by, issued_at, returned_by, returned_at, idempotency_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  insertIssuance.run(4, '吴芳', '安全带', 'HB-001', '良好', '良好', '值班员A', '2026-06-05 09:00:00', '值班员A', '2026-06-05 11:00:00', 'seed-issuance-1')
  insertIssuance.run(4, '吴芳', '攀岩鞋', 'SH-012', '良好', '轻微磨损', '值班员A', '2026-06-05 09:00:00', '值班员B', '2026-06-05 11:00:00', 'seed-issuance-2')
  insertIssuance.run(3, '周伟', '安全带', 'HB-003', '良好', null, '值班员A', '2026-06-05 14:00:00', null, null, 'seed-issuance-3')

  const insertAnomaly = db.prepare(`INSERT INTO anomalies (booking_id, issuance_id, description, severity, status, reported_by, resolved_by, resolution, resolved_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  insertAnomaly.run(3, null, '保护点螺丝松动需检修', 'high', 'open', '张磊', null, null, null)
  insertAnomaly.run(null, 2, '攀岩鞋右脚底部磨损偏重', 'medium', 'open', '值班员B', null, null, null)
  insertAnomaly.run(4, null, '会员反馈课程时间偏短', 'low', 'resolved', '吴芳', '运营主管', '已记录反馈，下期调整课程时长', '2026-06-05 10:00:00')

  const insertTodo = db.prepare(`INSERT INTO shift_todos (content, priority, status, created_by, completed_by, completed_at) VALUES (?, ?, ?, ?, ?, ?)`)
  insertTodo.run('检查3号保护点螺丝', 'high', 'pending', '张磊', null, null)
  insertTodo.run('补充前台宣传单', 'medium', 'pending', '值班员A', null, null)
  insertTodo.run('更新会员 waivers 文件', 'low', 'done', '值班员A', '值班员B', '2026-06-05 11:30:00')
  insertTodo.run('采购新攀岩鞋(42码)', 'medium', 'done', '值班员A', '运营主管', '2026-06-05 14:00:00')

  const insertSnapshot = db.prepare(`INSERT INTO handover_snapshots (pending_bookings, unreturned_equipment, open_anomalies, operator_out, operator_in, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
  insertSnapshot.run(3, 1, 2, '值班员A', '值班员B', '3号保护点异常待检修，攀岩鞋磨损需关注', '2026-06-05 14:00:00')
}

export default db
