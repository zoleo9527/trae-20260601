import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = path.join(__dirname, '..', 'data', 'express.db')

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

  initTables(db)
  seedIfEmpty(db)

  return db
}

function initTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS deliveries (
      id TEXT PRIMARY KEY,
      tracking_number TEXT NOT NULL UNIQUE,
      recipient_name TEXT NOT NULL,
      recipient_phone TEXT NOT NULL,
      delivery_address TEXT NOT NULL,
      station_id TEXT NOT NULL DEFAULT 'ST001',
      courier_id TEXT NOT NULL,
      courier_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      station_sign_image TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS problem_records (
      id TEXT PRIMARY KEY,
      delivery_id TEXT NOT NULL,
      tracking_number TEXT NOT NULL,
      problem_type TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      reporter_id TEXT NOT NULL,
      reporter_name TEXT NOT NULL,
      reporter_role TEXT NOT NULL,
      responsible_person_id TEXT NOT NULL,
      responsible_person_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      resolution TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (delivery_id) REFERENCES deliveries(id)
    );

    CREATE TABLE IF NOT EXISTS customer_contacts (
      id TEXT PRIMARY KEY,
      problem_record_id TEXT NOT NULL,
      tracking_number TEXT NOT NULL,
      contact_type TEXT NOT NULL,
      contact_person_id TEXT NOT NULL,
      contact_person_name TEXT NOT NULL,
      contact_person_role TEXT NOT NULL,
      customer_response TEXT NOT NULL DEFAULT '',
      follow_up_required INTEGER NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (problem_record_id) REFERENCES problem_records(id)
    );

    CREATE TABLE IF NOT EXISTS problem_history (
      id TEXT PRIMARY KEY,
      problem_record_id TEXT NOT NULL,
      action TEXT NOT NULL,
      operator_id TEXT NOT NULL,
      operator_name TEXT NOT NULL,
      operator_role TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (problem_record_id) REFERENCES problem_records(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      source_type TEXT NOT NULL,
      source_id TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
  `)
}

function seedIfEmpty(db: Database.Database) {
  const count = (db.prepare('SELECT COUNT(*) as c FROM deliveries').get() as any).c
  if (count > 0) return

  const now = new Date()
  const fmt = (d: Date) => d.toISOString().replace('T', ' ').substring(0, 19)

  const couriers = [
    { id: 'C001', name: '张建国' },
    { id: 'C002', name: '李明辉' },
    { id: 'C003', name: '王大勇' },
  ]

  const seedDeliveries = [
    { track: 'SF20240601001', name: '陈小芳', phone: '13800001001', addr: '幸福小区3栋502', status: 'problem' },
    { track: 'SF20240601002', name: '刘志强', phone: '13800001002', addr: '阳光花园12栋301', status: 'delivered' },
    { track: 'SF20240601003', name: '赵美玲', phone: '13800001003', addr: '翠湖苑A区8栋102', status: 'problem' },
    { track: 'SF20240601004', name: '孙伟明', phone: '13800001004', addr: '金穗路88号6层', status: 'pending' },
    { track: 'SF20240601005', name: '周丽华', phone: '13800001005', addr: '锦绣大道200号3单元', status: 'delivering' },
    { track: 'SF20240601006', name: '吴晓峰', phone: '13800001006', addr: '长虹路56号4栋603', status: 'returned' },
    { track: 'SF20240601007', name: '郑秀兰', phone: '13800001007', addr: '和平街18号2单元201', status: 'delivered' },
    { track: 'SF20240601008', name: '何志远', phone: '13800001008', addr: '龙泉路99号7栋401', status: 'problem' },
  ]

  const insertDelivery = db.prepare(`
    INSERT INTO deliveries (id, tracking_number, recipient_name, recipient_phone, delivery_address, station_id, courier_id, courier_name, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertProblem = db.prepare(`
    INSERT INTO problem_records (id, delivery_id, tracking_number, problem_type, description, reporter_id, reporter_name, reporter_role, responsible_person_id, responsible_person_name, status, resolution, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertContact = db.prepare(`
    INSERT INTO customer_contacts (id, problem_record_id, tracking_number, contact_type, contact_person_id, contact_person_name, contact_person_role, customer_response, follow_up_required, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertHistory = db.prepare(`
    INSERT INTO problem_history (id, problem_record_id, action, operator_id, operator_name, operator_role, description, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertNotification = db.prepare(`
    INSERT INTO notifications (id, type, title, content, source_type, source_id, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const csId = 'CS001'
  const csName = '王丽娟'

  const deliveryIds: string[] = []

  const transaction = db.transaction(() => {
    for (const d of seedDeliveries) {
      const id = uuidv4()
      const c = couriers[Math.floor(Math.random() * couriers.length)]
      const createdAt = fmt(new Date(now.getTime() - Math.random() * 3 * 86400000))
      insertDelivery.run(id, d.track, d.name, d.phone, d.addr, 'ST001', c.id, c.name, d.status, createdAt, createdAt)
      deliveryIds.push(id)
    }

    const problemSeeds = [
      { dIdx: 0, type: 'damaged', desc: '外包装严重破损，内部商品可能受损', status: 'contacting', reporter: { id: 'C001', name: '张建国', role: 'courier' }, responsible: { id: csId, name: csName } },
      { dIdx: 2, type: 'wrong_address', desc: '收件地址不存在，电话无法接通', status: 'pending', reporter: { id: 'C002', name: '李明辉', role: 'courier' }, responsible: { id: csId, name: csName } },
      { dIdx: 5, type: 'refused', desc: '客户明确拒收，要求退回发件方', status: 'returned', reporter: { id: 'C003', name: '王大勇', role: 'courier' }, responsible: { id: csId, name: csName } },
      { dIdx: 7, type: 'expired', desc: '快件滞留超过7天，无人领取', status: 'reviewing', reporter: { id: 'C001', name: '张建国', role: 'courier' }, responsible: { id: 'M001', name: '陈国强' } },
    ]

    const problemIds: string[] = []

    for (const p of problemSeeds) {
      const pId = uuidv4()
      const dId = deliveryIds[p.dIdx]
      const track = seedDeliveries[p.dIdx].track
      const createdAt = fmt(new Date(now.getTime() - Math.random() * 2 * 86400000))

      insertProblem.run(
        pId, dId, track, p.type, p.desc,
        p.reporter.id, p.reporter.name, p.reporter.role,
        p.responsible.id, p.responsible.name,
        p.status, null, createdAt, createdAt
      )
      problemIds.push(pId)

      insertHistory.run(uuidv4(), pId, 'created', p.reporter.id, p.reporter.name, p.reporter.role, `登记问题件：${p.desc}`, createdAt)

      if (p.status === 'contacting' || p.status === 'returned' || p.status === 'reviewing') {
        insertHistory.run(uuidv4(), pId, 'status_change', csId, csName, 'station_cs', `状态变更为：${p.status}`, fmt(new Date(now.getTime() - Math.random() * 86400000)))
      }

      if (p.status === 'contacting') {
        const ctId = uuidv4()
        const ctTime = fmt(new Date(now.getTime() - Math.random() * 86400000))
        insertContact.run(
          ctId, pId, track, 'phone', csId, csName, 'station_cs',
          '客户表示知道破损情况，需要确认退换', 1, '客户要求回电确认处理方案',
          ctTime, ctTime
        )
        insertNotification.run(uuidv4(), 'contact_required', '待联系客户', `问题件 ${track} 客户需回电确认`, 'problem', pId, 0, ctTime)
      }

      if (p.status === 'returned') {
        insertHistory.run(uuidv4(), pId, 'returned', csId, csName, 'station_cs', '确认退回发件方', fmt(new Date(now.getTime() - 3600000)))
        insertNotification.run(uuidv4(), 'return_confirmed', '退回确认', `问题件 ${track} 已确认退回`, 'problem', pId, 1, fmt(new Date(now.getTime() - 3600000)))
      }

      if (p.status === 'reviewing') {
        insertHistory.run(uuidv4(), pId, 'submitted_review', csId, csName, 'station_cs', '提交驿站负责人复核', fmt(new Date(now.getTime() - 7200000)))
        insertNotification.run(uuidv4(), 'review_required', '待复核', `问题件 ${track} 等待负责人复核`, 'problem', pId, 0, fmt(new Date(now.getTime() - 7200000)))
      }

      insertNotification.run(uuidv4(), 'problem_created', '问题件登记', `${track} 登记为${p.type}`, 'problem', pId, p.status === 'pending' ? 0 : 1, createdAt)
    }
  })

  transaction()
}
