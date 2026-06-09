import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.resolve(__dirname, '..', 'data')

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'port-yard.db')

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    initTables()
    seedData()
  }
  return db
}

function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS containers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      container_no TEXT NOT NULL UNIQUE,
      vessel TEXT NOT NULL,
      voyage TEXT NOT NULL,
      target_port TEXT NOT NULL,
      yard_slot TEXT,
      expected_slot TEXT,
      status TEXT NOT NULL DEFAULT 'inspecting',
      entered_at TEXT NOT NULL,
      free_storage_until TEXT,
      exited_at TEXT
    );

    CREATE TABLE IF NOT EXISTS inspections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      container_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'planned',
      planned_at TEXT NOT NULL,
      notified_at TEXT,
      notify_method TEXT,
      step TEXT NOT NULL DEFAULT 'open_box',
      result TEXT,
      completed_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (container_id) REFERENCES containers(id)
    );

    CREATE TABLE IF NOT EXISTS move_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      container_id INTEGER NOT NULL,
      source_inspection_id INTEGER,
      from_slot TEXT NOT NULL,
      to_slot TEXT NOT NULL,
      reason TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      started_at TEXT,
      completed_at TEXT,
      FOREIGN KEY (container_id) REFERENCES containers(id),
      FOREIGN KEY (source_inspection_id) REFERENCES inspections(id)
    );

    CREATE TABLE IF NOT EXISTS problem_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      container_id INTEGER NOT NULL,
      inspection_id INTEGER,
      move_task_id INTEGER,
      type TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'critical',
      status TEXT NOT NULL DEFAULT 'open',
      description TEXT NOT NULL,
      cause TEXT,
      cause_chain TEXT DEFAULT '[]',
      action_data TEXT DEFAULT '{}',
      detected_at TEXT NOT NULL,
      resolved_at TEXT,
      updated_at TEXT,
      FOREIGN KEY (container_id) REFERENCES containers(id),
      FOREIGN KEY (inspection_id) REFERENCES inspections(id),
      FOREIGN KEY (move_task_id) REFERENCES move_tasks(id)
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username TEXT,
      role TEXT,
      action TEXT NOT NULL,
      container_no TEXT,
      detail TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `)

  const cols = db.prepare("PRAGMA table_info(containers)").all() as any[]
  if (!cols.some(c => c.name === 'expected_slot')) {
    db.exec('ALTER TABLE containers ADD COLUMN expected_slot TEXT')
  }
}

function seedData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  if (userCount.count > 0) return

  const insertUser = db.prepare('INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)')
  insertUser.run('gate01', 'gate01', 'gate', '闸口员-王明')
  insertUser.run('dispatch01', 'dispatch01', 'dispatch', '调度员-李强')
  insertUser.run('service01', 'service01', 'service', '客服-张丽')

  const insertContainer = db.prepare(
    `INSERT INTO containers (container_no, vessel, voyage, target_port, yard_slot, expected_slot, status, entered_at, free_storage_until) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )

  insertContainer.run('MSKU1234567', 'COSCO SHIPPING', 'V023E', 'SHANGHAI', 'C-01-01', 'C-01-01', 'inspecting', '2026-06-07 08:30:00', '2026-06-17 08:30:00')
  insertContainer.run('CSLU2345678', 'MAERSK ELBA', 'V118W', 'NINGBO', 'A-02-01', 'A-02-01', 'yarded', '2026-06-06 14:20:00', '2026-06-16 14:20:00')
  insertContainer.run('TCLU3456789', 'EVERGREEN', 'V045E', 'SHANGHAI', 'B-01-02', 'B-01-02', 'inspection_done', '2026-06-05 09:00:00', '2026-06-15 09:00:00')
  insertContainer.run('MSKU9999001', 'COSCO SHIPPING', 'V023E', 'SHANGHAI', 'C-03-01', 'C-03-01', 'yarded', '2026-05-20 10:00:00', '2026-05-30 10:00:00')
  insertContainer.run('CSLU9999002', 'MAERSK ELBA', 'V118W', 'NINGBO', 'B-02-04', 'A-03-02', 'yarded', '2026-06-08 11:00:00', '2026-06-18 11:00:00')
  insertContainer.run('TCLU9999003', 'EVERGREEN', 'V045E', 'SHANGHAI', 'C-01-02', 'C-01-02', 'inspecting', '2026-06-07 16:00:00', '2026-06-17 16:00:00')
  insertContainer.run('OOLU8888001', 'YANG MING', 'V072E', 'NINGBO', 'C-02-01', 'C-02-01', 'inspecting', '2026-06-04 08:00:00', '2026-06-14 08:00:00')

  insertContainer.run('MSKU1100001', 'COSCO SHIPPING', 'V024E', 'SHANGHAI', 'A-01-01', 'A-01-01', 'yarded', '2026-06-08 07:00:00', '2026-06-18 07:00:00')
  insertContainer.run('CSLU2200002', 'MAERSK ELBA', 'V119W', 'NINGBO', 'A-01-02', 'A-01-02', 'inspecting', '2026-06-08 09:15:00', '2026-06-18 09:15:00')
  insertContainer.run('TCLU3300003', 'EVERGREEN', 'V046E', 'SHANGHAI', 'C-01-03', 'C-01-03', 'yarded', '2026-06-02 06:00:00', '2026-06-12 06:00:00')
  insertContainer.run('OOLU4400004', 'YANG MING', 'V073E', 'NINGBO', 'C-02-02', 'C-02-02', 'inspection_done', '2026-06-07 10:30:00', '2026-06-17 10:30:00')
  insertContainer.run('MSKU5500005', 'COSCO SHIPPING', 'V025E', 'SHANGHAI', 'B-01-03', 'B-01-03', 'yarded', '2026-06-09 06:00:00', '2026-06-19 06:00:00')

  const insertInspection = db.prepare(
    `INSERT INTO inspections (container_id, type, status, planned_at, notified_at, notify_method, step, result, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  insertInspection.run(1, 'full', 'executing', '2026-06-09 09:00:00', '2026-06-08 15:00:00', 'sms', 'unpack', null, null)
  insertInspection.run(3, 'random', 'completed', '2026-06-08 10:00:00', '2026-06-07 16:00:00', 'email', 'result', 'released', '2026-06-08 11:30:00')
  insertInspection.run(6, 'full', 'planned', '2026-06-10 09:00:00', null, null, 'open_box', null, null)
  insertInspection.run(7, 'full', 'completed', '2026-06-06 09:00:00', '2026-06-05 14:00:00', 'sms', 'result', 'detained', '2026-06-06 11:00:00')
  insertInspection.run(9, 'open', 'notified', '2026-06-09 14:00:00', '2026-06-09 10:00:00', 'email', 'open_box', null, null)
  insertInspection.run(11, 'full', 'completed', '2026-06-08 08:00:00', '2026-06-07 10:00:00', 'sms', 'result', 'released', '2026-06-08 10:00:00')

  const insertMoveTask = db.prepare(
    `INSERT INTO move_tasks (container_id, source_inspection_id, from_slot, to_slot, reason, status, created_at, started_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  insertMoveTask.run(3, 2, 'B-01-02', 'D-01-01', '查验放行后移至出场区', 'pending', '2026-06-08 11:30:00', null, null)
  insertMoveTask.run(11, 6, 'C-02-02', 'D-01-02', '查验放行后移至出场区', 'completed', '2026-06-08 10:00:00', '2026-06-08 10:30:00', '2026-06-08 11:00:00')

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  const insertProblem = db.prepare(
    `INSERT INTO problem_orders (container_id, inspection_id, move_task_id, type, severity, status, description, cause, cause_chain, action_data, detected_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  insertProblem.run(4, null, null, 'overdue', 'critical', 'open', '免堆期已过10天未提箱', '免堆期至2026-05-30已过期，超期10天未提箱',
    JSON.stringify([
      { event: 'container_entered', time: '2026-05-20 10:00:00', detail: '闸口进场登记，堆位C-03-01' },
      { event: 'free_storage_set', time: '2026-05-20 10:00:00', detail: '免堆期至2026-05-30' },
      { event: 'no_inspection', time: '2026-06-09', detail: '进场20天无查验计划，无出场记录' },
      { event: 'free_storage_expired', time: '2026-06-09', detail: '免堆期已过期10天，超期堆存费争议风险' },
    ]),
    '{}', '2026-05-30 10:00:00', now)
  insertProblem.run(5, null, null, 'misplaced', 'critical', 'open', '系统分配A-03-02，实际在B-02-04', '闸口登记堆位A-03-02，实际堆放B-02-04，疑似吊装错位',
    JSON.stringify([
      { event: 'gate_register', time: '2026-06-08 11:00:00', detail: '闸口登记堆位A-03-02' },
      { event: 'no_move_task', time: '2026-06-08 12:00:00', detail: '无A-03-02→B-02-04移箱任务记录' },
      { event: 'position_mismatch', time: '2026-06-08 12:00:00', detail: '实际堆位B-02-04与登记堆位不一致，吊装错位' },
    ]),
    '{"expected":"A-03-02","actual":"B-02-04"}', '2026-06-08 12:00:00', now)
  insertProblem.run(6, 3, null, 'missed_notify', 'critical', 'open', '查验计划已生成但未通知客户', '查验计划6月10日执行，但截至6月9日仍未通知客户',
    JSON.stringify([
      { event: 'inspection_planned', time: '2026-06-07 16:00:00', detail: '创建全掏查验计划，计划时间2026-06-10 09:00' },
      { event: 'no_notify', time: '2026-06-09', detail: '距计划执行不足24小时，仍未通知客户到场' },
      { event: 'risk', time: '2026-06-09', detail: '客户不知情将导致查验无法按时执行' },
    ]),
    '{}', '2026-06-09 08:00:00', now)
  insertProblem.run(7, 4, null, 'detained', 'critical', 'open', '海关扣留，需等待补证材料', '查验结果为扣留，客户未提供完整报关材料',
    JSON.stringify([
      { event: 'inspection_planned', time: '2026-06-06 09:00:00', detail: '创建全掏查验计划' },
      { event: 'inspection_executed', time: '2026-06-06 09:30:00', detail: '开始执行查验，开箱→掏箱→结果' },
      { event: 'inspection_result', time: '2026-06-06 11:00:00', detail: '查验结果：扣留，报关材料不完整' },
      { event: 'no_supplement', time: '2026-06-06 11:00:00', detail: '客户3天未补证，箱体持续占用堆位' },
    ]),
    '{}', '2026-06-06 11:00:00', now)
  insertProblem.run(3, null, 1, 'stuck_move', 'warning', 'open', '移箱任务创建后超12小时未执行', '移箱任务待执行超12小时，查验放行箱仍占原堆位',
    JSON.stringify([
      { event: 'inspection_released', time: '2026-06-08 11:30:00', detail: '查验放行，生成移箱任务B-01-02→D-01-01' },
      { event: 'move_pending', time: '2026-06-08 11:30:00', detail: '移箱任务创建，状态pending' },
      { event: 'timeout', time: '2026-06-09', detail: '任务pending超12小时，放行箱仍占查验区堆位' },
    ]),
    '{}', '2026-06-09 08:00:00', now)
}
