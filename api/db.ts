import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.join(__dirname, '..', 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'yard.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
CREATE TABLE IF NOT EXISTS containers (
  id TEXT PRIMARY KEY,
  container_no TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK(type IN ('20GP', '40GP', '40HC', '20RF')),
  status TEXT NOT NULL DEFAULT 'normal' CHECK(status IN ('normal', 'overstay', 'inspecting', 'departed', 'disputed', 'misplaced')),
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  gate_in_time TEXT NOT NULL,
  gate_out_time TEXT,
  yard_position TEXT,
  free_days INTEGER NOT NULL DEFAULT 7,
  overstay_days INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_containers_status ON containers(status);
CREATE INDEX IF NOT EXISTS idx_containers_customer ON containers(customer_id);

CREATE TABLE IF NOT EXISTS gate_records (
  id TEXT PRIMARY KEY,
  container_id TEXT NOT NULL REFERENCES containers(id),
  container_no TEXT NOT NULL,
  direction TEXT NOT NULL CHECK(direction IN ('in', 'out')),
  gate_time TEXT NOT NULL,
  operator_name TEXT NOT NULL,
  anomaly TEXT DEFAULT 'none' CHECK(anomaly IN ('none', 'doc_mismatch', 'container_damaged', 'overdue_pickup')),
  anomaly_note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_gate_records_container ON gate_records(container_id);
CREATE INDEX IF NOT EXISTS idx_gate_records_time ON gate_records(gate_time DESC);

CREATE TABLE IF NOT EXISTS yard_slots (
  id TEXT PRIMARY KEY,
  position TEXT NOT NULL UNIQUE,
  zone TEXT NOT NULL,
  row_num INTEGER NOT NULL,
  col_num INTEGER NOT NULL,
  tier INTEGER NOT NULL DEFAULT 1,
  container_id TEXT REFERENCES containers(id),
  status TEXT NOT NULL DEFAULT 'empty' CHECK(status IN ('empty', 'occupied', 'overstay', 'inspecting', 'misplaced'))
);
CREATE INDEX IF NOT EXISTS idx_yard_slots_zone ON yard_slots(zone);
CREATE INDEX IF NOT EXISTS idx_yard_slots_status ON yard_slots(status);

CREATE TABLE IF NOT EXISTS overstay_records (
  id TEXT PRIMARY KEY,
  container_id TEXT NOT NULL REFERENCES containers(id),
  container_no TEXT NOT NULL,
  overstay_days INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_notify' CHECK(status IN ('pending_notify', 'notified', 'processing', 'closed')),
  notified_at TEXT,
  closed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_overstay_container ON overstay_records(container_id);
CREATE INDEX IF NOT EXISTS idx_overstay_status ON overstay_records(status);

CREATE TABLE IF NOT EXISTS fee_records (
  id TEXT PRIMARY KEY,
  container_id TEXT NOT NULL REFERENCES containers(id),
  container_no TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  base_fee REAL NOT NULL DEFAULT 0,
  overstay_fee REAL NOT NULL DEFAULT 0,
  total_fee REAL NOT NULL DEFAULT 0,
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK(review_status IN ('pending', 'reviewing', 'approved', 'rejected', 'disputed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_fee_container ON fee_records(container_id);
CREATE INDEX IF NOT EXISTS idx_fee_status ON fee_records(review_status);

CREATE TABLE IF NOT EXISTS review_entries (
  id TEXT PRIMARY KEY,
  fee_record_id TEXT NOT NULL REFERENCES fee_records(id),
  action TEXT NOT NULL CHECK(action IN ('submit_review', 'approve', 'reject', 'dispute', 'adjust')),
  operator_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('gate_operator', 'dispatcher', 'customer_service')),
  comment TEXT,
  adjusted_amount REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_review_fee ON review_entries(fee_record_id);

CREATE TABLE IF NOT EXISTS inspection_plans (
  id TEXT PRIMARY KEY,
  container_id TEXT NOT NULL REFERENCES containers(id),
  container_no TEXT NOT NULL,
  planned_time TEXT NOT NULL,
  notified_status TEXT NOT NULL DEFAULT 'not_notified' CHECK(notified_status IN ('not_notified', 'notified')),
  notified_at TEXT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK(status IN ('planned', 'in_progress', 'completed')),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_inspection_container ON inspection_plans(container_id);
CREATE INDEX IF NOT EXISTS idx_inspection_time ON inspection_plans(planned_time);

CREATE TABLE IF NOT EXISTS timeline_events (
  id TEXT PRIMARY KEY,
  container_id TEXT NOT NULL REFERENCES containers(id),
  event_type TEXT NOT NULL,
  operator_name TEXT NOT NULL,
  role TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_timeline_container ON timeline_events(container_id);
CREATE INDEX IF NOT EXISTS idx_timeline_time ON timeline_events(created_at DESC);

CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY,
  container_id TEXT NOT NULL REFERENCES containers(id),
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  base64_data TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_attachment_container ON attachments(container_id);
`)

export function seedDatabase() {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM containers').get() as { cnt: number }
  if (count.cnt > 0) return

  const insertContainer = db.prepare(`
    INSERT INTO containers (id, container_no, type, status, customer_id, customer_name, gate_in_time, gate_out_time, yard_position, free_days, overstay_days)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertGateRecord = db.prepare(`
    INSERT INTO gate_records (id, container_id, container_no, direction, gate_time, operator_name, anomaly, anomaly_note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertYardSlot = db.prepare(`
    INSERT INTO yard_slots (id, position, zone, row_num, col_num, tier, container_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertOverstay = db.prepare(`
    INSERT INTO overstay_records (id, container_id, container_no, overstay_days, status, notified_at, closed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const insertFee = db.prepare(`
    INSERT INTO fee_records (id, container_id, container_no, customer_name, base_fee, overstay_fee, total_fee, review_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertReviewEntry = db.prepare(`
    INSERT INTO review_entries (id, fee_record_id, action, operator_name, role, comment, adjusted_amount)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const insertInspection = db.prepare(`
    INSERT INTO inspection_plans (id, container_id, container_no, planned_time, notified_status, notified_at, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertTimeline = db.prepare(`
    INSERT INTO timeline_events (id, container_id, event_type, operator_name, role, description, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const now = new Date()
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString()
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000).toISOString()
  const daysFromNow = (d: number) => new Date(now.getTime() + d * 86400000).toISOString()

  const containers = [
    { id: uuidv4(), no: 'COSCU1234567', type: '20GP', status: 'normal', custId: 'C001', custName: '远东航运', gateIn: daysAgo(3), gateOut: null, pos: 'A-1-1', freeDays: 7, overDays: 0 },
    { id: uuidv4(), no: 'MSKU7654321', type: '40GP', status: 'normal', custId: 'C002', custName: '中海集运', gateIn: daysAgo(5), gateOut: null, pos: 'A-1-2', freeDays: 7, overDays: 0 },
    { id: uuidv4(), no: 'TCLU9876543', type: '40HC', status: 'normal', custId: 'C003', custName: '马士基物流', gateIn: daysAgo(2), gateOut: null, pos: 'A-2-1', freeDays: 7, overDays: 0 },
    { id: uuidv4(), no: 'OOLU1112233', type: '20GP', status: 'normal', custId: 'C001', custName: '远东航运', gateIn: daysAgo(1), gateOut: null, pos: 'A-2-2', freeDays: 7, overDays: 0 },
    { id: uuidv4(), no: 'HLCU4455667', type: '20RF', status: 'normal', custId: 'C002', custName: '中海集运', gateIn: daysAgo(4), gateOut: null, pos: 'B-1-1', freeDays: 7, overDays: 0 },
    { id: uuidv4(), no: 'EISU3344556', type: '40HC', status: 'overstay', custId: 'C003', custName: '马士基物流', gateIn: daysAgo(20), gateOut: null, pos: 'B-1-2', freeDays: 7, overDays: 13 },
    { id: uuidv4(), no: 'YMLU8899001', type: '20GP', status: 'overstay', custId: 'C001', custName: '远东航运', gateIn: daysAgo(18), gateOut: null, pos: 'B-2-1', freeDays: 7, overDays: 11 },
    { id: uuidv4(), no: 'MSCU2233445', type: '40GP', status: 'overstay', custId: 'C002', custName: '中海集运', gateIn: daysAgo(25), gateOut: null, pos: 'B-2-2', freeDays: 7, overDays: 18 },
    { id: uuidv4(), no: 'CSLU6677889', type: '20RF', status: 'inspecting', custId: 'C003', custName: '马士基物流', gateIn: daysAgo(10), gateOut: null, pos: 'C-1-1', freeDays: 7, overDays: 0 },
    { id: uuidv4(), no: 'BMOU5566778', type: '40HC', status: 'inspecting', custId: 'C001', custName: '远东航运', gateIn: daysAgo(8), gateOut: null, pos: 'C-1-2', freeDays: 7, overDays: 0 },
    { id: uuidv4(), no: 'KKLU9900112', type: '20GP', status: 'disputed', custId: 'C002', custName: '中海集运', gateIn: daysAgo(15), gateOut: null, pos: 'C-2-1', freeDays: 7, overDays: 8 },
    { id: uuidv4(), no: 'TGHU3322110', type: '40GP', status: 'misplaced', custId: 'C003', custName: '马士基物流', gateIn: daysAgo(12), gateOut: null, pos: 'C-2-2', freeDays: 7, overDays: 5 },
    { id: uuidv4(), no: 'ZIMU4433221', type: '20GP', status: 'departed', custId: 'C001', custName: '远东航运', gateIn: daysAgo(30), gateOut: daysAgo(28), pos: null, freeDays: 7, overDays: 0 },
    { id: uuidv4(), no: 'ONEU6655443', type: '40HC', status: 'departed', custId: 'C002', custName: '中海集运', gateIn: daysAgo(25), gateOut: daysAgo(22), pos: null, freeDays: 7, overDays: 0 },
    { id: uuidv4(), no: 'HMMU7788990', type: '20RF', status: 'departed', custId: 'C003', custName: '马士基物流', gateIn: daysAgo(20), gateOut: daysAgo(17), pos: null, freeDays: 7, overDays: 0 },
  ]

  const transaction = db.transaction(() => {
    for (const c of containers) {
      insertContainer.run(c.id, c.no, c.type, c.status, c.custId, c.custName, c.gateIn, c.gateOut, c.pos, c.freeDays, c.overDays)

      insertGateRecord.run(uuidv4(), c.id, c.no, 'in', c.gateIn, '王明', 'none', null)

      if (c.status === 'departed') {
        insertGateRecord.run(uuidv4(), c.id, c.no, 'out', c.gateOut!, '李芳', 'none', null)
      }

      insertTimeline.run(uuidv4(), c.id, 'gate_in', '王明', 'gate_operator', `集装箱 ${c.no} 进场`, '{}')
      if (c.status === 'departed') {
        insertTimeline.run(uuidv4(), c.id, 'gate_out', '李芳', 'gate_operator', `集装箱 ${c.no} 出场`, '{}')
      }
    }

    const overstayContainers = containers.filter(c => c.overDays > 0)
    for (const c of overstayContainers) {
      const oStatus = c.status === 'departed' ? 'closed' : c.status === 'disputed' ? 'processing' : 'pending_notify'
      const notifiedAt = oStatus !== 'pending_notify' ? daysAgo(2) : null
      const closedAt = oStatus === 'closed' ? daysAgo(1) : null

      const overstayId = uuidv4()
      insertOverstay.run(overstayId, c.id, c.no, c.overDays, oStatus, notifiedAt, closedAt)

      insertTimeline.run(uuidv4(), c.id, 'overstay_detected', '张伟', 'dispatcher', `集装箱 ${c.no} 超期 ${c.overDays} 天`, JSON.stringify({ overstay_id: overstayId, days: c.overDays }))
    }

    const feeContainers = [
      { c: containers[5], base: 500, over: 1300, total: 1800, status: 'pending' },
      { c: containers[6], base: 300, over: 1100, total: 1400, status: 'reviewing' },
      { c: containers[7], base: 600, over: 1800, total: 2400, status: 'approved' },
      { c: containers[10], base: 300, over: 800, total: 1100, status: 'disputed' },
      { c: containers[11], base: 500, over: 500, total: 1000, status: 'pending' },
    ]

    for (const f of feeContainers) {
      const feeId = uuidv4()
      insertFee.run(feeId, f.c.id, f.c.no, f.c.custName, f.base, f.over, f.total, f.status)

      if (f.status === 'reviewing') {
        insertReviewEntry.run(uuidv4(), feeId, 'submit_review', '张伟', 'dispatcher', '提交费用审核', null)
      }
      if (f.status === 'approved') {
        insertReviewEntry.run(uuidv4(), feeId, 'submit_review', '张伟', 'dispatcher', '提交费用审核', null)
        insertReviewEntry.run(uuidv4(), feeId, 'approve', '陈静', 'customer_service', '审核通过', null)
      }
      if (f.status === 'disputed') {
        insertReviewEntry.run(uuidv4(), feeId, 'submit_review', '张伟', 'dispatcher', '提交费用审核', null)
        insertReviewEntry.run(uuidv4(), feeId, 'dispute', '刘洋', 'customer_service', '客户对超期费用有异议', null)
      }
    }

    const inspectionContainers = [
      { c: containers[8], planned: daysFromNow(1), notified: 'notified', nAt: hoursAgo(2), status: 'planned' },
      { c: containers[9], planned: daysAgo(1), notified: 'not_notified', nAt: null, status: 'planned' },
      { c: containers[3], planned: daysFromNow(2), notified: 'notified', nAt: hoursAgo(5), status: 'planned' },
    ]

    for (const insp of inspectionContainers) {
      const inspId = uuidv4()
      insertInspection.run(inspId, insp.c.id, insp.c.no, insp.planned, insp.notified, insp.nAt, insp.status, '张伟')

      insertTimeline.run(uuidv4(), insp.c.id, 'inspection_planned', '张伟', 'dispatcher', `集装箱 ${insp.c.no} 安排查验`, JSON.stringify({ plan_id: inspId, planned_time: insp.planned }))
    }

    const relocateHistory = [
      { c: containers[0], from: 'D-1-3', to: 'A-1-1', op: '张伟', role: 'dispatcher', note: '客户报错堆位，调度核实后复位', daysAgo: 2 },
      { c: containers[4], from: 'D-2-1', to: 'B-1-1', op: '李娜', role: 'customer_service', note: '冷冻箱误放普通区，紧急复位', daysAgo: 5 },
      { c: containers[3], from: 'C-3-2', to: 'A-2-2', op: '张伟', role: 'dispatcher', note: null, daysAgo: 8 },
      { c: containers[1], from: 'B-3-4', to: 'A-1-2', op: '陈静', role: 'customer_service', note: '批量卸货时错放，客户投诉后处理', daysAgo: 12 },
      { c: containers[2], from: 'D-1-1', to: 'A-2-1', op: '张伟', role: 'dispatcher', note: '40HC箱误入20GP区', daysAgo: 15 },
    ]

    for (const r of relocateHistory) {
      insertTimeline.run(
        uuidv4(),
        r.c.id,
        'misplace_relocate',
        r.op,
        r.role,
        `错放箱 ${r.c.no} 复位：${r.from} → ${r.to}${r.note ? '，备注：' + r.note : ''}`,
        JSON.stringify({ from: r.from, to: r.to, note: r.note }),
      )
      db.prepare("UPDATE timeline_events SET created_at = ? WHERE container_id = ? AND event_type = 'misplace_relocate' AND description = ?").run(
        daysAgo(r.daysAgo),
        r.c.id,
        `错放箱 ${r.c.no} 复位：${r.from} → ${r.to}${r.note ? '，备注：' + r.note : ''}`,
      )
    }

    const zones = ['A', 'B', 'C']
    const occupiedMap: Record<string, string> = {}
    for (const c of containers) {
      if (c.pos) occupiedMap[c.pos] = c.id
    }

    for (const zone of zones) {
      for (let row = 1; row <= 4; row++) {
        for (let col = 1; col <= 4; col++) {
          const position = `${zone}-${row}-${col}`
          const cid = occupiedMap[position] || null
          let slotStatus = 'empty'
          if (cid) {
            const container = containers.find(c => c.id === cid)
            if (container) {
              if (container.status === 'overstay') slotStatus = 'overstay'
              else if (container.status === 'inspecting') slotStatus = 'inspecting'
              else if (container.status === 'misplaced') slotStatus = 'misplaced'
              else slotStatus = 'occupied'
            }
          }
          insertYardSlot.run(uuidv4(), position, zone, row, col, 1, cid, slotStatus)
        }
      }
    }
  })

  transaction()
}

export default db
