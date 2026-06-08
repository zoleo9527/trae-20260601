import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.join(__dirname, '..', 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'hotel.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('supervisor','cleaner','engineer')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_number TEXT NOT NULL UNIQUE,
    floor INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'vacant' CHECK(status IN ('vacant','occupied','cleaning','repair','pending_inspect')),
    current_assignee_id INTEGER,
    last_changed_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (current_assignee_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS repair_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    fault_type TEXT NOT NULL,
    description TEXT,
    urgency TEXT NOT NULL DEFAULT 'normal' CHECK(urgency IN ('low','normal','high','urgent')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','in_progress','completed','cancelled')),
    created_by INTEGER NOT NULL,
    assigned_to INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    assigned_at TEXT,
    completed_at TEXT,
    FOREIGN KEY (room_id) REFERENCES rooms(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS repair_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    repair_order_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    operator_id INTEGER NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (repair_order_id) REFERENCES repair_orders(id),
    FOREIGN KEY (operator_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS recovery_flows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_clean' CHECK(status IN ('pending_clean','pending_inspect','recovered')),
    cleaner_id INTEGER,
    supervisor_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    clean_completed_at TEXT,
    inspected_at TEXT,
    completed_at TEXT,
    FOREIGN KEY (room_id) REFERENCES rooms(id),
    FOREIGN KEY (cleaner_id) REFERENCES users(id),
    FOREIGN KEY (supervisor_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS recovery_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recovery_flow_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    operator_id INTEGER NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (recovery_flow_id) REFERENCES recovery_flows(id),
    FOREIGN KEY (operator_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operator_id INTEGER NOT NULL,
    action_type TEXT NOT NULL,
    detail TEXT,
    ip TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (operator_id) REFERENCES users(id)
  );
`)

const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
if (userCount.count === 0) {
  const passwordHash = bcrypt.hashSync('123456', 10)

  const insertUser = db.prepare(
    'INSERT INTO users (username, password_hash, name, role) VALUES (?, ?, ?, ?)'
  )
  insertUser.run('zhangwg', passwordHash, '张主管', 'supervisor')
  insertUser.run('libaoj', passwordHash, '李保洁', 'cleaner')
  insertUser.run('wanggc', passwordHash, '王工程师', 'engineer')

  const insertRoom = db.prepare(
    'INSERT INTO rooms (room_number, floor, status, current_assignee_id) VALUES (?, ?, ?, ?)'
  )
  insertRoom.run('301', 3, 'vacant', null)
  insertRoom.run('302', 3, 'occupied', null)
  insertRoom.run('303', 3, 'cleaning', 2)
  insertRoom.run('304', 3, 'repair', null)
  insertRoom.run('305', 3, 'pending_inspect', 2)
  insertRoom.run('401', 4, 'vacant', null)
  insertRoom.run('402', 4, 'vacant', null)
  insertRoom.run('403', 4, 'occupied', null)
  insertRoom.run('404', 4, 'cleaning', 2)
  insertRoom.run('405', 4, 'vacant', null)
  insertRoom.run('501', 5, 'occupied', null)
  insertRoom.run('502', 5, 'repair', null)
  insertRoom.run('503', 5, 'occupied', null)
  insertRoom.run('504', 5, 'vacant', null)
  insertRoom.run('505', 5, 'cleaning', 2)

  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const dtStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  const hoursAgo = (h: number) => dtStr(new Date(now.getTime() - h * 3600000))

  const insertRepair = db.prepare(
    'INSERT INTO repair_orders (room_id, fault_type, description, urgency, status, created_by, assigned_to, created_at, assigned_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )
  insertRepair.run(4, 'plumbing', '浴室水龙头持续滴水，无法完全关闭', 'high', 'pending', 2, null, hoursAgo(2), null)
  insertRepair.run(12, 'electrical', '空调无法启动，遥控器无反应', 'urgent', 'in_progress', 2, 3, hoursAgo(5), hoursAgo(4))
  insertRepair.run(9, 'furniture', '衣柜门铰链松动，开关有异响', 'normal', 'pending', 2, null, hoursAgo(8), null)
  insertRepair.run(15, 'ac', '房间空调制冷效果差，温度无法降到24度以下', 'high', 'in_progress', 2, 3, hoursAgo(12), hoursAgo(10))
  insertRepair.run(6, 'door', '卫生间门锁卡住无法从内部打开', 'urgent', 'completed', 2, 3, hoursAgo(48), hoursAgo(47))

  const insertRepairLog = db.prepare(
    'INSERT INTO repair_logs (repair_order_id, action, operator_id, note, created_at) VALUES (?, ?, ?, ?, ?)'
  )
  insertRepairLog.run(2, 'created', 2, '提交维修工单，空调完全无响应', hoursAgo(5))
  insertRepairLog.run(2, 'accepted', 3, '已到达现场检查，疑似主板故障', hoursAgo(4))
  insertRepairLog.run(1, 'created', 2, '水龙头漏水影响客人使用', hoursAgo(2))
  insertRepairLog.run(3, 'created', 2, '客人反映衣柜门有异响', hoursAgo(8))
  insertRepairLog.run(4, 'created', 2, '空调制冷不足，客人投诉', hoursAgo(12))
  insertRepairLog.run(4, 'accepted', 3, '检查后发现冷媒不足', hoursAgo(10))
  insertRepairLog.run(5, 'created', 2, '紧急：门锁故障可能造成安全隐患', hoursAgo(48))
  insertRepairLog.run(5, 'accepted', 3, '门锁机械结构需更换', hoursAgo(47))
  insertRepairLog.run(5, 'completed', 3, '已更换门锁，测试正常', hoursAgo(44))

  const insertFlow = db.prepare(
    'INSERT INTO recovery_flows (room_id, status, cleaner_id, supervisor_id, created_at, clean_completed_at, inspected_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  )
  insertFlow.run(3, 'pending_clean', 2, null, hoursAgo(3), null, null, null)
  insertFlow.run(5, 'pending_inspect', 2, null, hoursAgo(6), hoursAgo(4), null, null)
  insertFlow.run(9, 'pending_clean', 2, null, hoursAgo(8), null, null, null)
  insertFlow.run(15, 'pending_clean', 2, 1, hoursAgo(44), hoursAgo(42), null, null)
  insertFlow.run(6, 'recovered', 2, 1, hoursAgo(44), hoursAgo(42), hoursAgo(40), hoursAgo(40))

  const insertRecoveryLog = db.prepare(
    'INSERT INTO recovery_logs (recovery_flow_id, action, operator_id, note, created_at) VALUES (?, ?, ?, ?, ?)'
  )
  insertRecoveryLog.run(1, 'created', 2, '维修完成，开始保洁', hoursAgo(3))
  insertRecoveryLog.run(2, 'created', 2, '创建恢复流程', hoursAgo(6))
  insertRecoveryLog.run(2, 'clean_completed', 2, '保洁完成，等待主管检查', hoursAgo(4))
  insertRecoveryLog.run(3, 'created', 2, '衣柜维修后需清洁', hoursAgo(8))
  insertRecoveryLog.run(4, 'created', 2, '门锁更换后需恢复房态', hoursAgo(44))
  insertRecoveryLog.run(4, 'clean_completed', 2, '深度保洁完成', hoursAgo(42))
  insertRecoveryLog.run(4, 'rejected', 1, '浴帘有污渍，马桶圈未擦干净，需重新保洁', hoursAgo(41))
  insertRecoveryLog.run(4, 'clean_completed', 2, '重新保洁完成，已重点处理卫生间', hoursAgo(38))
  insertRecoveryLog.run(5, 'created', 2, '创建恢复流程', hoursAgo(44))
  insertRecoveryLog.run(5, 'clean_completed', 2, '保洁完成', hoursAgo(42))
  insertRecoveryLog.run(5, 'approved', 1, '检查合格，房态恢复', hoursAgo(40))

  const insertAudit = db.prepare(
    'INSERT INTO audit_logs (operator_id, action_type, detail, ip, created_at) VALUES (?, ?, ?, ?, ?)'
  )
  insertAudit.run(2, 'repair_create', '创建维修工单 房间304', '192.168.1.100', hoursAgo(2))
  insertAudit.run(2, 'repair_create', '创建维修工单 房间404', '192.168.1.100', hoursAgo(5))
  insertAudit.run(3, 'repair_accept', '接单 维修工单#2', '192.168.1.101', hoursAgo(4))
  insertAudit.run(2, 'repair_create', '创建维修工单 房间404', '192.168.1.100', hoursAgo(8))
  insertAudit.run(2, 'repair_create', '创建维修工单 房间505', '192.168.1.100', hoursAgo(12))
  insertAudit.run(3, 'repair_accept', '接单 维修工单#4', '192.168.1.101', hoursAgo(10))
  insertAudit.run(2, 'recovery_create', '创建恢复流程 房间303', '192.168.1.100', hoursAgo(3))
  insertAudit.run(2, 'recovery_create', '创建恢复流程 房间305', '192.168.1.100', hoursAgo(6))
  insertAudit.run(2, 'recovery_clean_complete', '保洁完成 恢复流程#2', '192.168.1.100', hoursAgo(4))
  insertAudit.run(2, 'recovery_create', '创建恢复流程 房间404', '192.168.1.100', hoursAgo(8))
  insertAudit.run(2, 'recovery_create', '创建恢复流程 房间505', '192.168.1.100', hoursAgo(44))
  insertAudit.run(2, 'recovery_clean_complete', '保洁完成 恢复流程#4', '192.168.1.100', hoursAgo(42))
  insertAudit.run(1, 'recovery_reject', '审核驳回 恢复流程#4：浴帘有污渍', '192.168.1.99', hoursAgo(41))
  insertAudit.run(2, 'recovery_clean_complete', '重新保洁完成 恢复流程#4', '192.168.1.100', hoursAgo(38))
  insertAudit.run(2, 'recovery_clean_complete', '保洁完成 恢复流程#5', '192.168.1.100', hoursAgo(42))
  insertAudit.run(1, 'recovery_approve', '审核通过 恢复流程#5', '192.168.1.99', hoursAgo(40))
  insertAudit.run(2, 'repair_create', '创建维修工单 房间402', '192.168.1.100', hoursAgo(48))
  insertAudit.run(3, 'repair_accept', '接单 维修工单#5', '192.168.1.101', hoursAgo(47))
  insertAudit.run(3, 'repair_complete', '完成 维修工单#5', '192.168.1.101', hoursAgo(44))
}

export default db
