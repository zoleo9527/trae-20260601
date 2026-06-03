import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const db = new Database(path.join(__dirname, 'data.db'))

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    client_name TEXT NOT NULL,
    event_date TEXT NOT NULL,
    venue TEXT NOT NULL,
    tables INTEGER NOT NULL,
    menu_price REAL NOT NULL,
    total_amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS reconciliations (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES events(id),
    all_confirmed INTEGER NOT NULL DEFAULT 0,
    feedback_activated INTEGER NOT NULL DEFAULT 0,
    feedback_activated_at TEXT,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS reconciliation_items (
    id TEXT PRIMARY KEY,
    reconciliation_id TEXT NOT NULL REFERENCES reconciliations(id),
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    expected_amount REAL NOT NULL,
    actual_amount REAL,
    difference REAL,
    difference_note TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending'
  );

  CREATE TABLE IF NOT EXISTS reconciliation_confirmations (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL REFERENCES reconciliation_items(id),
    role TEXT NOT NULL,
    confirmed INTEGER NOT NULL DEFAULT 0,
    name TEXT NOT NULL DEFAULT '',
    confirmed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS feedbacks (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES events(id),
    completed_at TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
  );

  CREATE TABLE IF NOT EXISTS feedback_sections (
    id TEXT PRIMARY KEY,
    feedback_id TEXT NOT NULL REFERENCES feedbacks(id),
    role TEXT NOT NULL,
    content TEXT DEFAULT '',
    rating INTEGER,
    filled_by TEXT DEFAULT '',
    filled_at TEXT,
    deadline TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS timeline_entries (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES events(id),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    performed_by TEXT NOT NULL,
    role TEXT NOT NULL,
    timestamp TEXT NOT NULL DEFAULT (datetime('now'))
  );
`)

const count = db.prepare('SELECT COUNT(*) as c FROM events').get() as { c: number }
if (count.c === 0) {
  const insertEvent = db.prepare(`
    INSERT INTO events (id, name, client_name, event_date, venue, tables, menu_price, total_amount, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const insertReconciliation = db.prepare(`
    INSERT INTO reconciliations (id, event_id, all_confirmed, feedback_activated, feedback_activated_at, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  const insertItem = db.prepare(`
    INSERT INTO reconciliation_items (id, reconciliation_id, category, description, expected_amount, actual_amount, difference, difference_note, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const insertConfirmation = db.prepare(`
    INSERT INTO reconciliation_confirmations (id, item_id, role, confirmed, name, confirmed_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  const insertFeedback = db.prepare(`
    INSERT INTO feedbacks (id, event_id, completed_at, status)
    VALUES (?, ?, ?, ?)
  `)
  const insertFeedbackSection = db.prepare(`
    INSERT INTO feedback_sections (id, feedback_id, role, content, rating, filled_by, filled_at, deadline)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const insertTimeline = db.prepare(`
    INSERT INTO timeline_entries (id, event_id, type, title, description, performed_by, role, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const seed = db.transaction(() => {
    const now = new Date().toISOString()

    const e1 = uuidv4()
    insertEvent.run(e1, '春季婚宴', '张先生', '2026-06-15', '大宴会厅', 20, 2888, 57760, 'pending', '李销售')
    insertTimeline.run(uuidv4(), e1, 'event_created', '活动创建', '创建春季婚宴活动', '李销售', 'sales', now)

    const e2 = uuidv4()
    insertEvent.run(e2, '企业年会', '王总', '2026-06-20', '多功能厅', 30, 1888, 56640, 'pending', '赵销售')
    insertTimeline.run(uuidv4(), e2, 'event_created', '活动创建', '创建企业年会活动', '赵销售', 'sales', now)

    const e3 = uuidv4()
    insertEvent.run(e3, '生日宴', '刘女士', '2026-05-28', '中厅A', 10, 1288, 12880, 'reconciling', '李销售')
    insertTimeline.run(uuidv4(), e3, 'event_created', '活动创建', '创建生日宴活动', '李销售', 'sales', new Date(Date.now() - 86400000 * 3).toISOString())
    const r3 = uuidv4()
    insertReconciliation.run(r3, e3, 0, 0, null, '李销售')
    insertTimeline.run(uuidv4(), e3, 'reconciliation_created', '发起对账', '生日宴对账已发起', '李销售', 'sales', new Date(Date.now() - 86400000 * 2).toISOString())

    const items3 = [
      { id: uuidv4(), cat: 'venue', desc: '场地费', expected: 3000 },
      { id: uuidv4(), cat: 'menu', desc: '餐饮费', expected: 9280 },
      { id: uuidv4(), cat: 'extra', desc: '额外服务费', expected: 600 },
      { id: uuidv4(), cat: 'discount', desc: '折扣优惠', expected: -1000 },
    ]
    for (const it of items3) {
      insertItem.run(it.id, r3, it.cat, it.desc, it.expected, null, null, '', 'pending')
      for (const role of ['sales', 'hall', 'kitchen']) {
        const confirmed = (it.cat === 'venue' && role === 'sales') || (it.cat === 'venue' && role === 'hall') || (it.cat === 'menu' && role === 'sales') ? 1 : 0
        const cName = confirmed ? (role === 'sales' ? '李销售' : role === 'hall' ? '周厅面' : '陈厨房') : ''
        const cAt = confirmed ? new Date(Date.now() - 86400000).toISOString() : null
        insertConfirmation.run(uuidv4(), it.id, role, confirmed, cName, cAt)
      }
    }

    const e4 = uuidv4()
    insertEvent.run(e4, '商务宴请', '陈先生', '2026-05-30', 'VIP包间', 5, 3888, 19440, 'reconciling', '赵销售')
    insertTimeline.run(uuidv4(), e4, 'event_created', '活动创建', '创建商务宴请活动', '赵销售', 'sales', new Date(Date.now() - 86400000).toISOString())
    const r4 = uuidv4()
    insertReconciliation.run(r4, e4, 0, 0, null, '赵销售')
    insertTimeline.run(uuidv4(), e4, 'reconciliation_created', '发起对账', '商务宴请对账已发起', '赵销售', 'sales', new Date(Date.now() - 43200000).toISOString())

    const items4 = [
      { id: uuidv4(), cat: 'venue', desc: '场地费', expected: 2000 },
      { id: uuidv4(), cat: 'menu', desc: '餐饮费', expected: 16940 },
      { id: uuidv4(), cat: 'extra', desc: '额外服务费', expected: 500 },
      { id: uuidv4(), cat: 'discount', desc: '折扣优惠', expected: -500 },
    ]
    for (const it of items4) {
      insertItem.run(it.id, r4, it.cat, it.desc, it.expected, null, null, '', 'pending')
      for (const role of ['sales', 'hall', 'kitchen']) {
        insertConfirmation.run(uuidv4(), it.id, role, 0, '', null)
      }
    }

    const e5 = uuidv4()
    insertEvent.run(e5, '谢师宴', '孙同学', '2026-05-20', '中厅B', 8, 1588, 12704, 'feedback', '李销售')
    insertTimeline.run(uuidv4(), e5, 'event_created', '活动创建', '创建谢师宴活动', '李销售', 'sales', new Date(Date.now() - 86400000 * 7).toISOString())
    const r5 = uuidv4()
    const feedbackTime = new Date(Date.now() - 86400000 * 2).toISOString()
    insertReconciliation.run(r5, e5, 1, 1, feedbackTime, '李销售')
    insertTimeline.run(uuidv4(), e5, 'reconciliation_created', '发起对账', '谢师宴对账已发起', '李销售', 'sales', new Date(Date.now() - 86400000 * 5).toISOString())
    insertTimeline.run(uuidv4(), e5, 'reconciliation_completed', '对账完成', '谢师宴对账全部确认，反馈已激活', '系统', 'system', feedbackTime)

    const items5 = [
      { id: uuidv4(), cat: 'venue', desc: '场地费', expected: 2400 },
      { id: uuidv4(), cat: 'menu', desc: '餐饮费', expected: 9804 },
      { id: uuidv4(), cat: 'extra', desc: '额外服务费', expected: 500 },
      { id: uuidv4(), cat: 'discount', desc: '折扣优惠', expected: -400 },
    ]
    for (const it of items5) {
      insertItem.run(it.id, r5, it.cat, it.desc, it.expected, it.expected, 0, '', 'confirmed')
      for (const role of ['sales', 'hall', 'kitchen']) {
        const cName = role === 'sales' ? '李销售' : role === 'hall' ? '周厅面' : '陈厨房'
        insertConfirmation.run(uuidv4(), it.id, role, 1, cName, new Date(Date.now() - 86400000 * 3).toISOString())
      }
    }

    const f5 = uuidv4()
    insertFeedback.run(f5, e5, null, 'pending')
    const deadline5 = new Date(Date.now() + 86400000 * 2).toISOString()
    insertFeedbackSection.run(uuidv4(), f5, 'sales', '客户对整体安排满意', 5, '李销售', new Date(Date.now() - 86400000).toISOString(), deadline5)
    insertFeedbackSection.run(uuidv4(), f5, 'hall', '', null, '', null, deadline5)
    insertFeedbackSection.run(uuidv4(), f5, 'kitchen', '', null, '', null, deadline5)

    const e6 = uuidv4()
    insertEvent.run(e6, '满月酒', '周先生', '2026-05-10', '小厅C', 6, 1088, 6528, 'completed', '赵销售')
    insertTimeline.run(uuidv4(), e6, 'event_created', '活动创建', '创建满月酒活动', '赵销售', 'sales', new Date(Date.now() - 86400000 * 14).toISOString())
    const r6 = uuidv4()
    const r6Time = new Date(Date.now() - 86400000 * 8).toISOString()
    insertReconciliation.run(r6, e6, 1, 1, r6Time, '赵销售')
    insertTimeline.run(uuidv4(), e6, 'reconciliation_created', '发起对账', '满月酒对账已发起', '赵销售', 'sales', new Date(Date.now() - 86400000 * 10).toISOString())
    insertTimeline.run(uuidv4(), e6, 'reconciliation_completed', '对账完成', '满月酒对账全部确认，反馈已激活', '系统', 'system', r6Time)

    const items6 = [
      { id: uuidv4(), cat: 'venue', desc: '场地费', expected: 1500 },
      { id: uuidv4(), cat: 'menu', desc: '餐饮费', expected: 5528 },
      { id: uuidv4(), cat: 'extra', desc: '额外服务费', expected: 300 },
      { id: uuidv4(), cat: 'discount', desc: '折扣优惠', expected: -800 },
    ]
    for (const it of items6) {
      insertItem.run(it.id, r6, it.cat, it.desc, it.expected, it.expected, 0, '', 'confirmed')
      for (const role of ['sales', 'hall', 'kitchen']) {
        const cName = role === 'sales' ? '赵销售' : role === 'hall' ? '周厅面' : '陈厨房'
        insertConfirmation.run(uuidv4(), it.id, role, 1, cName, new Date(Date.now() - 86400000 * 9).toISOString())
      }
    }

    const f6 = uuidv4()
    const completedAt6 = new Date(Date.now() - 86400000 * 4).toISOString()
    insertFeedback.run(f6, e6, completedAt6, 'completed')
    const deadline6 = new Date(Date.now() - 86400000 * 6).toISOString()
    insertFeedbackSection.run(uuidv4(), f6, 'sales', '客户非常满意', 5, '赵销售', new Date(Date.now() - 86400000 * 5).toISOString(), deadline6)
    insertFeedbackSection.run(uuidv4(), f6, 'hall', '服务顺利', 4, '周厅面', new Date(Date.now() - 86400000 * 5).toISOString(), deadline6)
    insertFeedbackSection.run(uuidv4(), f6, 'kitchen', '菜品反响好', 5, '陈厨房', new Date(Date.now() - 86400000 * 5).toISOString(), deadline6)
    insertTimeline.run(uuidv4(), e6, 'feedback_completed', '反馈完成', '满月酒客户反馈全部完成', '系统', 'system', completedAt6)
  })

  seed()
}

export default db
