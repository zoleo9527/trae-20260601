import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = path.join(__dirname, '..', 'data.db')

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
  }
  return db
}

export function initDb() {
  const database = getDb()

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('consultant', 'assistant', 'service')),
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      patient_name TEXT NOT NULL,
      patient_phone TEXT NOT NULL,
      patient_age INTEGER,
      visit_count INTEGER DEFAULT 1,
      tags TEXT DEFAULT '[]',
      appointment_time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_consultation', 'plan_submitted', 'plan_confirmed', 'in_service', 'completed')),
      consultant_id TEXT NOT NULL,
      assistant_id TEXT,
      service_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (consultant_id) REFERENCES users(id),
      FOREIGN KEY (assistant_id) REFERENCES users(id),
      FOREIGN KEY (service_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY,
      appointment_id TEXT NOT NULL,
      items TEXT NOT NULL DEFAULT '[]',
      total_price REAL NOT NULL,
      discount REAL DEFAULT 0,
      final_price REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'confirmed', 'archived')),
      submitted_by TEXT,
      confirmed_by TEXT,
      confirmed_at TEXT,
      change_log TEXT DEFAULT '[]',
      created_at TEXT NOT NULL,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id),
      FOREIGN KEY (submitted_by) REFERENCES users(id),
      FOREIGN KEY (confirmed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS exceptions (
      id TEXT PRIMARY KEY,
      appointment_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('wording_mismatch', 'post_surgery_complaint', 'installment_mismatch')),
      severity TEXT NOT NULL CHECK(severity IN ('high', 'medium', 'low')),
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'processing', 'resolved')),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      details TEXT NOT NULL DEFAULT '{}',
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      resolved_by TEXT,
      resolved_at TEXT,
      resolve_note TEXT,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id),
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (resolved_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS consultation_notes (
      id TEXT PRIMARY KEY,
      appointment_id TEXT NOT NULL,
      content TEXT NOT NULL,
      author_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      author_role TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id),
      FOREIGN KEY (author_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS visit_records (
      id TEXT PRIMARY KEY,
      appointment_id TEXT NOT NULL,
      visit_date TEXT NOT NULL,
      content TEXT NOT NULL,
      satisfaction INTEGER,
      has_complaint INTEGER DEFAULT 0,
      visitor_id TEXT NOT NULL,
      visitor_name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id),
      FOREIGN KEY (visitor_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS plan_confirmation_steps (
      id TEXT PRIMARY KEY,
      appointment_id TEXT NOT NULL,
      step INTEGER NOT NULL,
      label TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('consultant', 'assistant', 'service')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'current', 'completed')),
      completed_by TEXT,
      completed_at TEXT,
      note TEXT,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id),
      FOREIGN KEY (completed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS installment_plans (
      id TEXT PRIMARY KEY,
      appointment_id TEXT NOT NULL,
      total_periods INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      FOREIGN KEY (appointment_id) REFERENCES appointments(id)
    );

    CREATE TABLE IF NOT EXISTS installment_items (
      id TEXT PRIMARY KEY,
      plan_id TEXT NOT NULL,
      period INTEGER NOT NULL,
      planned_amount REAL NOT NULL,
      planned_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      actual_amount REAL,
      actual_date TEXT,
      FOREIGN KEY (plan_id) REFERENCES installment_plans(id)
    );
  `)

  seedData(database)
}

function seedData(db: Database.Database) {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  if (userCount.count > 0) return

  const today = new Date().toISOString().split('T')[0]

  const insertUser = db.prepare('INSERT INTO users (id, name, role, username, password) VALUES (?, ?, ?, ?, ?)')
  insertUser.run('u1', '张咨询师', 'consultant', 'consultant', 'demo123')
  insertUser.run('u2', '李医生助理', 'assistant', 'assistant', 'demo123')
  insertUser.run('u3', '王客服', 'service', 'service', 'demo123')

  const insertAppointment = db.prepare(`INSERT INTO appointments (id, patient_name, patient_phone, patient_age, visit_count, tags, appointment_time, status, consultant_id, assistant_id, service_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)

  insertAppointment.run('apt1', '陈思雨', '138****6721', 28, 2, '["复诊客户"]', `${today}T09:00:00`, 'plan_submitted', 'u1', 'u2', 'u3', `${today}T08:30:00`, `${today}T09:15:00`)
  insertAppointment.run('apt2', '刘雅婷', '139****3458', 32, 3, '["敏感客户","分期中"]', `${today}T10:30:00`, 'in_consultation', 'u1', 'u2', 'u3', `${today}T09:00:00`, `${today}T10:00:00`)
  insertAppointment.run('apt3', '赵美琪', '136****2210', 25, 1, '[]', `${today}T14:00:00`, 'in_service', 'u1', 'u2', 'u3', `${today}T10:00:00`, `${today}T14:30:00`)
  insertAppointment.run('apt4', '孙晓燕', '137****8899', 35, 4, '["VIP","分期中"]', `${today}T15:30:00`, 'pending', 'u1', 'u2', 'u3', `${today}T11:00:00`, `${today}T11:00:00`)
  insertAppointment.run('apt5', '周静文', '135****5567', 29, 2, '["复诊客户","敏感客户","分期中"]', `${today}T16:00:00`, 'in_consultation', 'u1', 'u2', 'u3', `${today}T13:00:00`, `${today}T14:00:00`)

  const insertNote = db.prepare('INSERT INTO consultation_notes (id, appointment_id, content, author_id, author_name, author_role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')

  insertNote.run('n1_1', 'apt1', '客户上次做了玻尿酸隆鼻，效果满意，本次想加做下巴填充', 'u1', '张咨询师', 'consultant', `${today}T08:35:00`)
  insertNote.run('n1_2', 'apt1', '已向客户说明下巴填充使用乔雅登极致，含术后3次免费修复', 'u1', '张咨询师', 'consultant', `${today}T08:50:00`)

  insertNote.run('n2_1', 'apt2', '客户咨询热玛吉+超声刀联合方案，承诺包含2次术后修复', 'u1', '张咨询师', 'consultant', `${today}T09:10:00`)
  insertNote.run('n2_2', 'apt2', '方案中只包含1次术后修复，与咨询承诺不一致，需确认', 'u2', '李医生助理', 'assistant', `${today}T09:45:00`)
  insertNote.run('n2_3', 'apt2', '已联系客户确认，按咨询师承诺2次修复执行', 'u1', '张咨询师', 'consultant', `${today}T10:00:00`)

  insertNote.run('n3_1', 'apt3', '客户5月15日完成双眼皮手术，术后恢复良好', 'u2', '李医生助理', 'assistant', `${today}T10:15:00`)
  insertNote.run('n3_2', 'apt3', '电话回访客户表示左侧双眼皮略宽，不太满意', 'u3', '王客服', 'service', `${today}T11:00:00`)
  insertNote.run('n3_3', 'apt3', '已安排医生复诊，预计下周三处理', 'u3', '王客服', 'service', `${today}T11:30:00`)
  insertNote.run('n3_4', 'apt3', '客户情绪较为激动，建议优先处理', 'u3', '王客服', 'service', `${today}T13:00:00`)

  insertNote.run('n4_1', 'apt4', 'VIP客户，咨询全身吸脂+自体脂肪填充面部', 'u1', '张咨询师', 'consultant', `${today}T11:15:00`)
  insertNote.run('n4_2', 'apt4', '分期方案3期，每期28,000元，客户已同意', 'u1', '张咨询师', 'consultant', `${today}T11:30:00`)
  insertNote.run('n4_3', 'apt4', '首期已收28,000，二期实际到账27,500（手续费扣减），需确认', 'u3', '王客服', 'service', `${today}T12:00:00`)

  insertNote.run('n5_1', 'apt5', '客户上次做了线雕提升，本次咨询追加热玛吉', 'u1', '张咨询师', 'consultant', `${today}T13:10:00`)
  insertNote.run('n5_2', 'apt5', '向客户承诺热玛吉全脸含颈部长效维持2年', 'u1', '张咨询师', 'consultant', `${today}T13:30:00`)
  insertNote.run('n5_3', 'apt5', '医生说明热玛吉全脸不含颈部，颈部需单独计费', 'u2', '李医生助理', 'assistant', `${today}T13:45:00`)
  insertNote.run('n5_4', 'apt5', '分期3期，第1期12,000，第2期12,000，第3期11,000，合计35,000', 'u1', '张咨询师', 'consultant', `${today}T14:00:00`)
  insertNote.run('n5_5', 'apt5', '第3期实际支付10,000，与计划11,000不符', 'u3', '王客服', 'service', `${today}T14:15:00`)

  const insertPlan = db.prepare(`INSERT INTO plans (id, appointment_id, items, total_price, discount, final_price, status, submitted_by, confirmed_by, confirmed_at, change_log, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)

  insertPlan.run('p1', 'apt1', JSON.stringify([
    { name: '乔雅登极致下巴填充', area: '下巴', unitPrice: 12800, quantity: 1, subtotal: 12800, note: '含3次术后修复' },
    { name: '玻尿酸隆鼻补打', area: '鼻部', unitPrice: 6800, quantity: 1, subtotal: 6800, note: '补打维持' }
  ]), 19600, 1600, 18000, 'submitted', 'u1', null, null, '[]', `${today}T09:00:00`)

  insertPlan.run('p2', 'apt2', JSON.stringify([
    { name: '热玛吉全脸', area: '面部', unitPrice: 29800, quantity: 1, subtotal: 29800, note: '含术后修复' },
    { name: '超声刀下颌线', area: '下颌线', unitPrice: 15800, quantity: 1, subtotal: 15800, note: '' }
  ]), 45600, 3600, 42000, 'draft', 'u1', null, null, '[]', `${today}T09:30:00`)

  insertPlan.run('p3', 'apt3', JSON.stringify([
    { name: '韩式双眼皮手术', area: '眼部', unitPrice: 12800, quantity: 1, subtotal: 12800, note: '含1次术后修复' }
  ]), 12800, 800, 12000, 'confirmed', 'u1', 'u2', `${today}T10:30:00`, '[]', `${today}T09:00:00`)

  insertPlan.run('p4', 'apt4', JSON.stringify([
    { name: '全身吸脂', area: '腰腹+大腿', unitPrice: 56000, quantity: 1, subtotal: 56000, note: '' },
    { name: '自体脂肪填充面部', area: '面部', unitPrice: 28000, quantity: 1, subtotal: 28000, note: '含2次补脂' }
  ]), 84000, 8000, 76000, 'draft', 'u1', null, null, '[]', `${today}T11:30:00`)

  insertPlan.run('p5', 'apt5', JSON.stringify([
    { name: '热玛吉全脸+颈部', area: '面部+颈部', unitPrice: 35000, quantity: 1, subtotal: 35000, note: '' }
  ]), 35000, 0, 35000, 'draft', 'u1', null, null, '[]', `${today}T13:20:00`)

  const insertException = db.prepare(`INSERT INTO exceptions (id, appointment_id, type, severity, status, title, description, details, created_by, created_at, resolved_by, resolved_at, resolve_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)

  insertException.run('e2', 'apt2', 'wording_mismatch', 'high', 'open', '术后修复次数口径不一致', '咨询师向客户承诺2次术后修复，但方案中仅包含1次', JSON.stringify({
    consultantWording: '热玛吉+超声刀联合方案，含2次术后修复',
    doctorWording: '方案仅含1次术后修复，第2次修复需另行付费',
    conflictItems: ['术后修复次数']
  }), 'u2', `${today}T09:50:00`, null, null, null)

  insertException.run('e3', 'apt3', 'post_surgery_complaint', 'high', 'open', '客户术后投诉双眼皮不对称', '客户反映左侧双眼皮偏宽，对术后效果不满意，情绪激动', JSON.stringify({
    complaintContent: '左侧双眼皮比右侧宽，看起来不自然，要求修复',
    relatedProject: '韩式双眼皮手术',
    surgeryDate: '2026-05-15',
    complaintDate: today
  }), 'u3', `${today}T11:05:00`, null, null, null)

  insertException.run('e4', 'apt4', 'installment_mismatch', 'medium', 'open', '分期第2期到账金额与计划不符', '第2期计划28,000元，实际到账27,500元，差异500元', JSON.stringify({
    plannedInstallments: [
      { period: 1, plannedAmount: 28000, plannedDate: '2026-05-20', status: 'paid' },
      { period: 2, plannedAmount: 28000, plannedDate: '2026-06-04', status: 'partial' },
      { period: 3, plannedAmount: 28000, plannedDate: '2026-07-04', status: 'pending' }
    ],
    actualPayments: [
      { period: 1, paidAmount: 28000, paidDate: '2026-05-20' },
      { period: 2, paidAmount: 27500, paidDate: '2026-06-04' }
    ],
    differenceItems: [
      { period: 2, plannedAmount: 28000, actualAmount: 27500, difference: -500 }
    ]
  }), 'u3', `${today}T12:05:00`, null, null, null)

  insertException.run('e5a', 'apt5', 'wording_mismatch', 'high', 'open', '热玛吉是否含颈部口径不一致', '咨询师承诺含颈部，医生说明不含需单独计费', JSON.stringify({
    consultantWording: '热玛吉全脸含颈部长效维持2年',
    doctorWording: '热玛吉全脸不含颈部，颈部需单独加收8,000元',
    conflictItems: ['是否包含颈部', '颈部是否额外收费']
  }), 'u2', `${today}T13:50:00`, null, null, null)

  insertException.run('e5b', 'apt5', 'installment_mismatch', 'medium', 'open', '分期第3期实付金额与计划不符', '第3期计划11,000元，实际到账10,000元，差异1,000元', JSON.stringify({
    plannedInstallments: [
      { period: 1, plannedAmount: 12000, plannedDate: '2026-05-25', status: 'paid' },
      { period: 2, plannedAmount: 12000, plannedDate: '2026-06-04', status: 'paid' },
      { period: 3, plannedAmount: 11000, plannedDate: '2026-07-04', status: 'partial' }
    ],
    actualPayments: [
      { period: 1, paidAmount: 12000, paidDate: '2026-05-25' },
      { period: 2, paidAmount: 12000, paidDate: '2026-06-04' },
      { period: 3, paidAmount: 10000, paidDate: '2026-06-03' }
    ],
    differenceItems: [
      { period: 3, plannedAmount: 11000, actualAmount: 10000, difference: -1000 }
    ]
  }), 'u3', `${today}T14:20:00`, null, null, null)

  const insertVisitRecord = db.prepare('INSERT INTO visit_records (id, appointment_id, visit_date, content, satisfaction, has_complaint, visitor_id, visitor_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')

  insertVisitRecord.run('v3_1', 'apt3', '2026-05-22', '术后7天回访，伤口愈合良好，客户表示基本满意', 4, 0, 'u3', '王客服', '2026-05-22T10:00:00')
  insertVisitRecord.run('v3_2', 'apt3', today, '客户来电反映左侧双眼皮偏宽不满意，已记录投诉', 2, 1, 'u3', '王客服', `${today}T11:00:00`)

  const insertStep = db.prepare('INSERT INTO plan_confirmation_steps (id, appointment_id, step, label, role, status, completed_by, completed_at, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')

  function addSteps(appointmentId: string, status: string) {
    const steps: any[] = [
      { id: `${appointmentId}_1`, appointmentId, step: 1, label: '咨询师接待', role: 'consultant', status: 'pending' },
      { id: `${appointmentId}_2`, appointmentId, step: 2, label: '提交方案', role: 'consultant', status: 'pending' },
      { id: `${appointmentId}_3`, appointmentId, step: 3, label: '医生助理确认', role: 'assistant', status: 'pending' },
      { id: `${appointmentId}_4`, appointmentId, step: 4, label: '客服归档', role: 'service', status: 'pending' },
    ]

    let currentStep = 1
    if (status === 'pending') currentStep = 1
    else if (status === 'in_consultation') currentStep = 2
    else if (status === 'plan_submitted') currentStep = 3
    else if (status === 'plan_confirmed') currentStep = 4
    else if (status === 'in_service') currentStep = 4
    else currentStep = 5

    steps.forEach((s, idx) => {
      if (idx + 1 < currentStep) s.status = 'completed'
      else if (idx + 1 === currentStep) s.status = 'current'
      else s.status = 'pending'
    })

    steps.forEach((s) => {
      insertStep.run(s.id, s.appointmentId, s.step, s.label, s.role, s.status, null, null, null)
    })
  }

  addSteps('apt1', 'plan_submitted')
  addSteps('apt2', 'in_consultation')
  addSteps('apt3', 'in_service')
  addSteps('apt4', 'pending')
  addSteps('apt5', 'in_consultation')

  const insertInstallmentPlan = db.prepare('INSERT INTO installment_plans (id, appointment_id, total_periods, status) VALUES (?, ?, ?, ?)')
  const insertInstallmentItem = db.prepare('INSERT INTO installment_items (id, plan_id, period, planned_amount, planned_date, status, actual_amount, actual_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')

  insertInstallmentPlan.run('ip4', 'apt4', 3, 'active')
  insertInstallmentItem.run('ii4_1', 'ip4', 1, 28000, '2026-05-20', 'paid', 28000, '2026-05-20')
  insertInstallmentItem.run('ii4_2', 'ip4', 2, 28000, '2026-06-04', 'partial', 27500, '2026-06-04')
  insertInstallmentItem.run('ii4_3', 'ip4', 3, 28000, '2026-07-04', 'pending', null, null)

  insertInstallmentPlan.run('ip5', 'apt5', 3, 'active')
  insertInstallmentItem.run('ii5_1', 'ip5', 1, 12000, '2026-05-25', 'paid', 12000, '2026-05-25')
  insertInstallmentItem.run('ii5_2', 'ip5', 2, 12000, '2026-06-04', 'paid', 12000, '2026-06-04')
  insertInstallmentItem.run('ii5_3', 'ip5', 3, 11000, '2026-07-04', 'partial', 10000, '2026-06-03')

  console.log('Database initialized with seed data')
}
