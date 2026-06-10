import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.join(__dirname, '..', 'data')
const uploadsDir = path.join(__dirname, '..', 'uploads')

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'farm.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('feeder','sorter','manager')),
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS coops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 5000,
    status TEXT NOT NULL DEFAULT 'active'
  );

  CREATE TABLE IF NOT EXISTS inspections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coop_id INTEGER NOT NULL REFERENCES coops(id),
    inspector_id INTEGER REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','in_progress','pending_confirm','completed','anomaly')),
    temperature REAL,
    humidity REAL,
    ventilation TEXT,
    water_status TEXT,
    feed_status TEXT,
    flock_status TEXT,
    notes TEXT,
    claimed_at INTEGER,
    completed_at INTEGER,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS egg_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coop_id INTEGER NOT NULL REFERENCES coops(id),
    inspection_id INTEGER REFERENCES inspections(id),
    sorter_id INTEGER REFERENCES users(id),
    total_eggs INTEGER NOT NULL DEFAULT 0,
    broken_eggs INTEGER NOT NULL DEFAULT 0,
    dirty_eggs INTEGER NOT NULL DEFAULT 0,
    grade_a INTEGER NOT NULL DEFAULT 0,
    grade_b INTEGER NOT NULL DEFAULT 0,
    grade_c INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','completed','anomaly')),
    notes TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    confirmed_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS anomalies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('inspection','egg','equipment','environment')),
    source_type TEXT CHECK(source_type IN ('inspection','egg_record')),
    source_id INTEGER,
    coop_id INTEGER NOT NULL REFERENCES coops(id),
    description TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium' CHECK(severity IN ('low','medium','high','critical')),
    status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','assigned','processing','resolved','closed')),
    reporter_id INTEGER NOT NULL REFERENCES users(id),
    assignee_id INTEGER REFERENCES users(id),
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    resolved_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS anomaly_timeline (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    anomaly_id INTEGER NOT NULL REFERENCES anomalies(id),
    action TEXT NOT NULL,
    content TEXT,
    operator_id INTEGER NOT NULL REFERENCES users(id),
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('anomaly','reminder','escalation','system')),
    read INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL CHECK(entity_type IN ('inspection','anomaly')),
    entity_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    size INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
`)

const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }

if (userCount.count === 0) {
  const now = Math.floor(Date.now() / 1000)
  const hoursAgo = (h: number) => now - Math.floor(h * 3600)

  const insertUser = db.prepare(
    'INSERT INTO users (username, password, name, role, created_at) VALUES (?, ?, ?, ?, ?)'
  )
  insertUser.run('feeder1', '123456', '张饲养', 'feeder', hoursAgo(24))
  insertUser.run('sorter1', '123456', '李分拣', 'sorter', hoursAgo(24))
  insertUser.run('manager1', '123456', '王场长', 'manager', hoursAgo(24))

  const insertCoop = db.prepare(
    'INSERT INTO coops (code, name, capacity, status) VALUES (?, ?, ?, ?)'
  )
  insertCoop.run('A1', 'A1号鸡舍', 5000, 'active')
  insertCoop.run('A2', 'A2号鸡舍', 4800, 'active')
  insertCoop.run('A3', 'A3号鸡舍', 5200, 'active')
  insertCoop.run('B1', 'B1号鸡舍', 4500, 'active')
  insertCoop.run('B2', 'B2号鸡舍', 5000, 'active')
  insertCoop.run('B3', 'B3号鸡舍', 4600, 'active')

  const insertInspection = db.prepare(`
    INSERT INTO inspections (coop_id, inspector_id, status, temperature, humidity, ventilation, water_status, feed_status, flock_status, notes, claimed_at, completed_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  insertInspection.run(1, 1, 'completed', 25.5, 65.0, 'normal', 'normal', 'normal', 'normal', '一切正常', hoursAgo(6), hoursAgo(5), hoursAgo(7))
  insertInspection.run(2, 1, 'completed', 26.0, 63.0, 'normal', 'normal', 'normal', 'normal', '', hoursAgo(5), hoursAgo(4), hoursAgo(6))
  insertInspection.run(3, 1, 'pending_confirm', 24.5, 67.0, 'normal', 'normal', 'normal', 'normal', '鸡群状态良好', hoursAgo(3), null, hoursAgo(4))
  insertInspection.run(4, null, 'pending', null, null, null, null, null, null, null, null, null, hoursAgo(6))
  insertInspection.run(5, 1, 'in_progress', 27.0, 70.0, 'weak', null, null, null, '通风不足', hoursAgo(6), null, hoursAgo(7))
  insertInspection.run(6, null, 'pending', null, null, null, null, null, null, null, null, null, hoursAgo(1))
  insertInspection.run(1, 1, 'in_progress', null, null, null, null, null, null, null, hoursAgo(0.5), null, hoursAgo(1))
  insertInspection.run(2, null, 'pending', null, null, null, null, null, null, null, null, null, hoursAgo(8))
  insertInspection.run(4, 1, 'anomaly', 29.0, 75.0, 'poor', 'abnormal', 'normal', 'abnormal', '温度过高，饮水异常', hoursAgo(4), null, hoursAgo(5))

  const insertEggRecord = db.prepare(`
    INSERT INTO egg_records (coop_id, inspection_id, sorter_id, total_eggs, broken_eggs, dirty_eggs, grade_a, grade_b, grade_c, status, notes, created_at, confirmed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  insertEggRecord.run(1, 1, 2, 4500, 50, 30, 3800, 500, 120, 'completed', '', hoursAgo(5), hoursAgo(4))
  insertEggRecord.run(2, 2, 2, 4200, 45, 25, 3500, 480, 150, 'completed', '', hoursAgo(4), hoursAgo(3))
  insertEggRecord.run(3, 3, null, 0, 0, 0, 0, 0, 0, 'pending', '', hoursAgo(3), null)
  insertEggRecord.run(4, null, 2, 3800, 200, 150, 2800, 500, 300, 'anomaly', '破蛋率异常偏高', hoursAgo(4), null)

  const insertAnomaly = db.prepare(`
    INSERT INTO anomalies (type, source_type, source_id, coop_id, description, severity, status, reporter_id, assignee_id, created_at, resolved_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  insertAnomaly.run('inspection', 'inspection', 9, 4, 'B1号鸡舍温度过高（29°C），饮水系统异常', 'high', 'open', 1, null, hoursAgo(4), null)
  insertAnomaly.run('environment', 'inspection', 5, 5, 'B2号鸡舍通风不足，湿度过高', 'medium', 'assigned', 1, 1, hoursAgo(6), null)
  insertAnomaly.run('egg', 'egg_record', 4, 4, 'B1号鸡舍破蛋率异常偏高（5.3%），需检查设备', 'critical', 'processing', 2, 1, hoursAgo(3), null)

  const insertTimeline = db.prepare(`
    INSERT INTO anomaly_timeline (anomaly_id, action, content, operator_id, created_at)
    VALUES (?, ?, ?, ?, ?)
  `)
  insertTimeline.run(2, 'created', '异常已上报', 1, hoursAgo(6))
  insertTimeline.run(2, 'assigned', '已指派给张饲养处理', 3, hoursAgo(5))
  insertTimeline.run(3, 'created', '异常已上报', 2, hoursAgo(3))
  insertTimeline.run(3, 'assigned', '已指派给张饲养处理', 3, hoursAgo(2.5))
  insertTimeline.run(3, 'update', '正在检查集蛋设备', 1, hoursAgo(1))

  const insertNotification = db.prepare(`
    INSERT INTO notifications (user_id, title, content, type, read, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  insertNotification.run(3, '新异常上报', 'B1号鸡舍温度过高，请及时处理', 'anomaly', 0, hoursAgo(4))
  insertNotification.run(3, '新异常上报', 'B2号鸡舍通风不足，请及时处理', 'anomaly', 0, hoursAgo(6))
  insertNotification.run(3, '异常升级', 'B1号鸡舍破蛋率异常，已升级为严重', 'escalation', 0, hoursAgo(3))
  insertNotification.run(1, '任务催办', 'B2号鸡舍巡检已超时，请尽快完成', 'reminder', 0, hoursAgo(1))
  insertNotification.run(2, '新任务', 'A3号鸡舍产蛋记录待确认', 'system', 1, hoursAgo(3))
}

export default db
