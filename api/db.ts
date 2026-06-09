import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = path.join(__dirname, '..', 'data', 'courier.db')

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (db) return db

  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  initSchema(db)
  seedData(db)

  return db
}

function initSchema(db: Database.Database) {
  const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='packages'").get()
  if (!tableExists) {
    db.exec(`
      CREATE TABLE packages (
        id TEXT PRIMARY KEY,
        tracking_no TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'arrived',
        type TEXT NOT NULL DEFAULT 'normal',
        arrived_at TEXT NOT NULL,
        current_handler TEXT NOT NULL,
        current_role TEXT NOT NULL,
        problem_type TEXT,
        problem_description TEXT
      );

      CREATE TABLE timeline_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        package_id TEXT NOT NULL,
        status TEXT NOT NULL,
        operator TEXT NOT NULL,
        role TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        note TEXT NOT NULL DEFAULT '',
        pickup_person TEXT DEFAULT NULL,
        FOREIGN KEY (package_id) REFERENCES packages(id)
      );

      CREATE INDEX idx_packages_status ON packages(status);
      CREATE INDEX idx_timeline_package ON timeline_events(package_id);
      CREATE INDEX idx_timeline_timestamp ON timeline_events(timestamp);
    `)
  }

  const colCheck = db.prepare("PRAGMA table_info(timeline_events)").all() as { name: string }[]
  if (!colCheck.some(c => c.name === 'pickup_person')) {
    db.exec("ALTER TABLE timeline_events ADD COLUMN pickup_person TEXT DEFAULT NULL")
  }
}

function seedData(db: Database.Database) {
  const pkgCount = db.prepare('SELECT COUNT(*) as cnt FROM packages').get() as { cnt: number }
  if (pkgCount.cnt > 0) return

  const now = new Date()
  const h = (offset: number) => {
    const d = new Date(now.getTime() + offset * 3600000)
    return d.toISOString()
  }

  const packages = [
    { id: 'pkg-001', trackingNo: 'SF2024060901001', status: 'arrived', type: 'normal', arrivedAt: h(-2), currentHandler: '王建国', currentRole: 'dispatcher' },
    { id: 'pkg-002', trackingNo: 'SF2024060901002', status: 'arrived', type: 'fragile', arrivedAt: h(-3), currentHandler: '王建国', currentRole: 'dispatcher' },
    { id: 'pkg-003', trackingNo: 'YT2024060901003', status: 'arrived', type: 'normal', arrivedAt: h(-4), currentHandler: '李明辉', currentRole: 'dispatcher' },
    { id: 'pkg-004', trackingNo: 'YT2024060901004', status: 'arrived', type: 'oversized', arrivedAt: h(-5), currentHandler: '李明辉', currentRole: 'dispatcher' },
    { id: 'pkg-005', trackingNo: 'ZT2024060901005', status: 'checked_in', type: 'normal', arrivedAt: h(-8), currentHandler: '赵美丽', currentRole: 'station_manager' },
    { id: 'pkg-006', trackingNo: 'ZT2024060901006', status: 'checked_in', type: 'fragile', arrivedAt: h(-10), currentHandler: '赵美丽', currentRole: 'station_manager' },
    { id: 'pkg-007', trackingNo: 'JD2024060901007', status: 'checked_in', type: 'normal', arrivedAt: h(-28), currentHandler: '赵美丽', currentRole: 'station_manager' },
    { id: 'pkg-008', trackingNo: 'JD2024060901008', status: 'verified', type: 'normal', arrivedAt: h(-24), currentHandler: '赵美丽', currentRole: 'station_manager' },
    { id: 'pkg-009', trackingNo: 'SF2024060901009', status: 'verified', type: 'normal', arrivedAt: h(-20), currentHandler: '赵美丽', currentRole: 'station_manager' },
    { id: 'pkg-010', trackingNo: 'YT2024060901010', status: 'verified', type: 'fragile', arrivedAt: h(-18), currentHandler: '赵美丽', currentRole: 'station_manager' },
    { id: 'pkg-011', trackingNo: 'ZT2024060901011', status: 'problem', type: 'normal', arrivedAt: h(-12), currentHandler: '张秀英', currentRole: 'customer_service', problemType: '破损', problemDescription: '外包装明显破损，内部商品可能受损' },
    { id: 'pkg-012', trackingNo: 'JD2024060901012', status: 'problem', type: 'normal', arrivedAt: h(-15), currentHandler: '张秀英', currentRole: 'customer_service', problemType: '地址错误', problemDescription: '收件地址不在本网点配送范围内' },
    { id: 'pkg-013', trackingNo: 'SF2024060901013', status: 'problem', type: 'oversized', arrivedAt: h(-10), currentHandler: '张秀英', currentRole: 'customer_service', problemType: '拒收', problemDescription: '收件人拒绝签收，要求退回发件网点' },
    { id: 'pkg-014', trackingNo: 'YT2024060901014', status: 'returned', type: 'normal', arrivedAt: h(-48), currentHandler: '张秀英', currentRole: 'customer_service' },
    { id: 'pkg-015', trackingNo: 'ZT2024060901015', status: 'completed', type: 'normal', arrivedAt: h(-36), currentHandler: '赵美丽', currentRole: 'station_manager' },
  ]

  const timelineMap: Record<string, Array<{ status: string; operator: string; role: string; offset: number; note: string }>> = {
    'pkg-001': [{ status: 'arrived', operator: '系统', role: 'dispatcher', offset: -2, note: '快件到达网点，等待入库' }],
    'pkg-002': [{ status: 'arrived', operator: '系统', role: 'dispatcher', offset: -3, note: '易碎品到达网点，需小心处理' }],
    'pkg-003': [{ status: 'arrived', operator: '系统', role: 'dispatcher', offset: -4, note: '快件到达网点' }],
    'pkg-004': [{ status: 'arrived', operator: '系统', role: 'dispatcher', offset: -5, note: '大件快件到达网点，需安排大件入库' }],
    'pkg-005': [
      { status: 'arrived', operator: '系统', role: 'dispatcher', offset: -8, note: '快件到达网点' },
      { status: 'checked_in', operator: '王建国', role: 'dispatcher', offset: -7, note: '已送至阳光驿站，入库完成' },
    ],
    'pkg-006': [
      { status: 'arrived', operator: '系统', role: 'dispatcher', offset: -10, note: '易碎品到达网点' },
      { status: 'checked_in', operator: '王建国', role: 'dispatcher', offset: -9, note: '易碎品已送至阳光驿站，单独放置' },
    ],
    'pkg-007': [
      { status: 'arrived', operator: '系统', role: 'dispatcher', offset: -28, note: '快件到达网点' },
      { status: 'checked_in', operator: '李明辉', role: 'dispatcher', offset: -26, note: '已送至阳光驿站入库' },
    ],
    'pkg-008': [
      { status: 'arrived', operator: '系统', role: 'dispatcher', offset: -24, note: '快件到达网点' },
      { status: 'checked_in', operator: '王建国', role: 'dispatcher', offset: -23, note: '已送至阳光驿站入库' },
      { status: 'notified', operator: '赵美丽', role: 'station_manager', offset: -22, note: '已发送取件短信通知' },
      { status: 'verified', operator: '赵美丽', role: 'station_manager', offset: -6, note: '收件人张伟凭取件码取件，已核销' },
    ],
    'pkg-009': [
      { status: 'arrived', operator: '系统', role: 'dispatcher', offset: -20, note: '快件到达网点' },
      { status: 'checked_in', operator: '李明辉', role: 'dispatcher', offset: -19, note: '已送至阳光驿站入库' },
      { status: 'notified', operator: '赵美丽', role: 'station_manager', offset: -18, note: '已发送取件短信通知' },
      { status: 'verified', operator: '赵美丽', role: 'station_manager', offset: -8, note: '收件人李娜取件，已核销' },
    ],
    'pkg-010': [
      { status: 'arrived', operator: '系统', role: 'dispatcher', offset: -18, note: '易碎品到达网点' },
      { status: 'checked_in', operator: '王建国', role: 'dispatcher', offset: -17, note: '易碎品已送至阳光驿站，加防震垫入库' },
      { status: 'notified', operator: '赵美丽', role: 'station_manager', offset: -16, note: '已发送取件短信通知' },
      { status: 'verified', operator: '赵美丽', role: 'station_manager', offset: -4, note: '收件人陈刚当面验货后取件，已核销' },
    ],
    'pkg-011': [
      { status: 'arrived', operator: '系统', role: 'dispatcher', offset: -12, note: '快件到达网点' },
      { status: 'checked_in', operator: '王建国', role: 'dispatcher', offset: -11, note: '已送至阳光驿站入库' },
      { status: 'problem', operator: '赵美丽', role: 'station_manager', offset: -10, note: '入库时发现外包装破损，标记为问题件' },
    ],
    'pkg-012': [
      { status: 'arrived', operator: '系统', role: 'dispatcher', offset: -15, note: '快件到达网点' },
      { status: 'problem', operator: '李明辉', role: 'dispatcher', offset: -14, note: '配送时发现地址超出本网点范围，标记问题件' },
    ],
    'pkg-013': [
      { status: 'arrived', operator: '系统', role: 'dispatcher', offset: -10, note: '大件快件到达网点' },
      { status: 'checked_in', operator: '王建国', role: 'dispatcher', offset: -9, note: '已送至阳光驿站入库' },
      { status: 'notified', operator: '赵美丽', role: 'station_manager', offset: -8, note: '已发送取件短信通知' },
      { status: 'problem', operator: '赵美丽', role: 'station_manager', offset: -5, note: '收件人拒收，要求退回发件网点' },
    ],
    'pkg-014': [
      { status: 'arrived', operator: '系统', role: 'dispatcher', offset: -48, note: '快件到达网点' },
      { status: 'checked_in', operator: '李明辉', role: 'dispatcher', offset: -46, note: '已送至阳光驿站入库' },
      { status: 'problem', operator: '赵美丽', role: 'station_manager', offset: -44, note: '收件人多次未取件，标记问题件' },
      { status: 'returned', operator: '张秀英', role: 'customer_service', offset: -30, note: '已退回发件网点，快递单号SF2024060901001' },
    ],
    'pkg-015': [
      { status: 'arrived', operator: '系统', role: 'dispatcher', offset: -36, note: '快件到达网点' },
      { status: 'checked_in', operator: '王建国', role: 'dispatcher', offset: -35, note: '已送至阳光驿站入库' },
      { status: 'notified', operator: '赵美丽', role: 'station_manager', offset: -34, note: '已发送取件短信通知' },
      { status: 'verified', operator: '赵美丽', role: 'station_manager', offset: -20, note: '收件人刘芳取件，已核销' },
      { status: 'completed', operator: '系统', role: 'customer_service', offset: -18, note: '快件流程结束，自动标记完成' },
    ],
  }

  const insertPkg = db.prepare(`
    INSERT INTO packages (id, tracking_no, status, type, arrived_at, current_handler, current_role, problem_type, problem_description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertEvent = db.prepare(`
    INSERT INTO timeline_events (package_id, status, operator, role, timestamp, note)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const transaction = db.transaction(() => {
    for (const pkg of packages) {
      insertPkg.run(
        pkg.id, pkg.trackingNo, pkg.status, pkg.type, pkg.arrivedAt,
        pkg.currentHandler, pkg.currentRole,
        pkg.problemType || null, pkg.problemDescription || null
      )

      const events = timelineMap[pkg.id] || []
      for (const evt of events) {
        const ts = new Date(now.getTime() + evt.offset * 3600000).toISOString()
        insertEvent.run(pkg.id, evt.status, evt.operator, evt.role, ts, evt.note)
      }
    }
  })

  transaction()
}

export function resetDatabase(): Database.Database {
  if (db) {
    db.close()
    db = null
  }
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH)
  }
  return getDb()
}
