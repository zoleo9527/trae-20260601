import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, 'vetclinic.db')

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
  }
  return db
}

export function initDb() {
  const db = getDb()

  db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      species TEXT NOT NULL,
      breed TEXT NOT NULL,
      age TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      owner_phone TEXT NOT NULL,
      admit_date TEXT NOT NULL,
      diagnosis TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'hospitalized',
      cage_number TEXT NOT NULL,
      condition_trend TEXT
    );

    CREATE TABLE IF NOT EXISTS care_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      scheduled_at TEXT NOT NULL,
      executed_at TEXT,
      executed_by TEXT,
      is_abnormal INTEGER NOT NULL DEFAULT 0,
      abnormal_note TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      FOREIGN KEY (patient_id) REFERENCES patients(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      frequency TEXT NOT NULL,
      prescribed_by TEXT NOT NULL,
      prescribed_at TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (patient_id) REFERENCES patients(id)
    );

    CREATE TABLE IF NOT EXISTS followups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      scheduled_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      reason TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY (patient_id) REFERENCES patients(id)
    );

    CREATE TABLE IF NOT EXISTS communications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      contact_at TEXT NOT NULL,
      method TEXT NOT NULL,
      content TEXT NOT NULL,
      contacted_by TEXT NOT NULL,
      result TEXT NOT NULL,
      FOREIGN KEY (patient_id) REFERENCES patients(id)
    );
  `)

  seedData(db)
}

function seedData(db: Database.Database) {
  const count = db.prepare('SELECT COUNT(*) as c FROM patients').get() as { c: number }
  if (count.c > 0) return

  const today = new Date()
  const fmt = (d: Date) => d.toISOString().slice(0, 16).replace('T', ' ')
  const fmtDate = (d: Date) => d.toISOString().slice(0, 10)
  const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r }

  const insertPatient = db.prepare(`
    INSERT INTO patients (name, species, breed, age, owner_name, owner_phone, admit_date, diagnosis, status, cage_number, condition_trend)
    VALUES (@name, @species, @breed, @age, @ownerName, @ownerPhone, @admitDate, @diagnosis, @status, @cageNumber, @conditionTrend)
  `)

  const insertCare = db.prepare(`
    INSERT INTO care_records (patient_id, type, content, scheduled_at, executed_at, executed_by, is_abnormal, abnormal_note, status)
    VALUES (@patientId, @type, @content, @scheduledAt, @executedAt, @executedBy, @isAbnormal, @abnormalNote, @status)
  `)

  const insertOrder = db.prepare(`
    INSERT INTO orders (patient_id, type, content, frequency, prescribed_by, prescribed_at, is_active)
    VALUES (@patientId, @type, @content, @frequency, @prescribedBy, @prescribedAt, @isActive)
  `)

  const insertFollowup = db.prepare(`
    INSERT INTO followups (patient_id, scheduled_date, status, reason, notes)
    VALUES (@patientId, @scheduledDate, @status, @reason, @notes)
  `)

  const insertComm = db.prepare(`
    INSERT INTO communications (patient_id, contact_at, method, content, contacted_by, result)
    VALUES (@patientId, @contactAt, @method, @content, @contactedBy, @result)
  `)

  const transaction = db.transaction(() => {
    const p1 = insertPatient.run({
      name: '团团', species: '猫', breed: '英国短毛猫', age: '3岁',
      ownerName: '王女士', ownerPhone: '138-0001-1234',
      admitDate: fmtDate(addDays(today, -4)), diagnosis: '下泌尿道综合征',
      status: 'hospitalized', cageNumber: 'A-03', conditionTrend: 'improving'
    })
    const p2 = insertPatient.run({
      name: '旺财', species: '狗', breed: '金毛寻回犬', age: '7岁',
      ownerName: '李先生', ownerPhone: '139-0002-5678',
      admitDate: fmtDate(addDays(today, -2)), diagnosis: '胰腺炎',
      status: 'hospitalized', cageNumber: 'B-07', conditionTrend: 'stable'
    })
    const p3 = insertPatient.run({
      name: '小橘', species: '猫', breed: '中华田园猫', age: '1岁',
      ownerName: '张同学', ownerPhone: '137-0003-9012',
      admitDate: fmtDate(addDays(today, -1)), diagnosis: '猫传染性鼻气管炎',
      status: 'hospitalized', cageNumber: 'A-09', conditionTrend: 'worsening'
    })
    const p4 = insertPatient.run({
      name: '贝贝', species: '狗', breed: '柯基犬', age: '5岁',
      ownerName: '赵先生', ownerPhone: '136-0004-3456',
      admitDate: fmtDate(addDays(today, -6)), diagnosis: '椎间盘突出',
      status: 'hospitalized', cageNumber: 'C-02', conditionTrend: 'stable'
    })
    const p5 = insertPatient.run({
      name: '雪球', species: '兔', breed: '荷兰垂耳兔', age: '2岁',
      ownerName: '陈女士', ownerPhone: '135-0005-7890',
      admitDate: fmtDate(addDays(today, -10)), diagnosis: '胃肠淤滞',
      status: 'discharged', cageNumber: 'D-01', conditionTrend: 'improving'
    })

    insertCare.run({
      patientId: p1.lastInsertRowid, type: 'medication',
      content: '口服加巴喷丁 50mg',
      scheduledAt: fmt(addDays(today, -2)), executedAt: fmt(addDays(today, -2)),
      executedBy: '护士小刘', isAbnormal: 0, abnormalNote: null, status: 'completed'
    })
    insertCare.run({
      patientId: p1.lastInsertRowid, type: 'medication',
      content: '口服加巴喷丁 50mg',
      scheduledAt: fmt(addDays(today, -1)), executedAt: null,
      executedBy: null, isAbnormal: 1, abnormalNote: '夜班交接遗漏，未按时给药',
      status: 'missed'
    })
    insertCare.run({
      patientId: p1.lastInsertRowid, type: 'vitals',
      content: '体温 39.1°C，心率 180bpm，呼吸 36次/分',
      scheduledAt: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 0)),
      executedAt: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 15)),
      executedBy: '护士小刘', isAbnormal: 0, abnormalNote: null, status: 'completed'
    })
    insertCare.run({
      patientId: p1.lastInsertRowid, type: 'iv_fluid',
      content: '乳酸林格液 250ml 静滴',
      scheduledAt: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0)),
      executedAt: null, executedBy: null, isAbnormal: 0, abnormalNote: null, status: 'pending'
    })

    insertCare.run({
      patientId: p2.lastInsertRowid, type: 'medication',
      content: '皮下注射马罗匹坦 1mg/kg',
      scheduledAt: fmt(addDays(today, -1)),
      executedAt: fmt(addDays(today, -1)), executedBy: '护士小刘',
      isAbnormal: 0, abnormalNote: null, status: 'completed'
    })
    insertCare.run({
      patientId: p2.lastInsertRowid, type: 'feeding',
      content: '低脂处方粮 100g',
      scheduledAt: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 7, 30)),
      executedAt: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 0)),
      executedBy: '护士小张', isAbnormal: 1, abnormalNote: '延迟30分钟，等待医生确认后喂食',
      status: 'delayed'
    })
    insertCare.run({
      patientId: p2.lastInsertRowid, type: 'vitals',
      content: '体温 39.5°C，心率 120bpm',
      scheduledAt: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 0)),
      executedAt: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 10)),
      executedBy: '护士小张', isAbnormal: 1, abnormalNote: '体温偏高，已通知主治医生',
      status: 'completed'
    })
    insertCare.run({
      patientId: p2.lastInsertRowid, type: 'medication',
      content: '口服熊去氧胆酸 15mg/kg',
      scheduledAt: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0)),
      executedAt: null, executedBy: null, isAbnormal: 0, abnormalNote: null, status: 'pending'
    })

    insertCare.run({
      patientId: p3.lastInsertRowid, type: 'medication',
      content: '雾化治疗：生理盐水+氨溴索',
      scheduledAt: fmt(addDays(today, -1)),
      executedAt: fmt(addDays(today, -1)), executedBy: '护士小张',
      isAbnormal: 0, abnormalNote: null, status: 'completed'
    })
    insertCare.run({
      patientId: p3.lastInsertRowid, type: 'observation',
      content: '打喷嚏频繁，鼻分泌物增多，精神萎靡',
      scheduledAt: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 6, 0)),
      executedAt: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 6, 30)),
      executedBy: '护士小刘', isAbnormal: 1, abnormalNote: '症状加重，需医生评估调整方案',
      status: 'completed'
    })
    insertCare.run({
      patientId: p3.lastInsertRowid, type: 'medication',
      content: '皮下注射干扰素 50万IU',
      scheduledAt: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0)),
      executedAt: null, executedBy: null, isAbnormal: 0, abnormalNote: null, status: 'pending'
    })

    insertCare.run({
      patientId: p4.lastInsertRowid, type: 'dressing',
      content: '针灸理疗，热敷腰部',
      scheduledAt: fmt(addDays(today, -1)),
      executedAt: fmt(addDays(today, -1)), executedBy: '护士小刘',
      isAbnormal: 0, abnormalNote: null, status: 'completed'
    })
    insertCare.run({
      patientId: p4.lastInsertRowid, type: 'medication',
      content: '口服美洛昔康 0.1mg/kg',
      scheduledAt: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0)),
      executedAt: null, executedBy: null, isAbnormal: 0, abnormalNote: null, status: 'pending'
    })

    insertOrder.run({
      patientId: p1.lastInsertRowid, type: 'medication',
      content: '加巴喷丁 50mg 口服', frequency: '每日2次',
      prescribedBy: '陈医生', prescribedAt: fmt(addDays(today, -4)), isActive: 1
    })
    insertOrder.run({
      patientId: p1.lastInsertRowid, type: 'nursing',
      content: '乳酸林格液 250ml 静滴', frequency: '每日1次',
      prescribedBy: '陈医生', prescribedAt: fmt(addDays(today, -4)), isActive: 1
    })
    insertOrder.run({
      patientId: p2.lastInsertRowid, type: 'medication',
      content: '马罗匹坦 1mg/kg 皮下注射', frequency: '每日1次',
      prescribedBy: '王医生', prescribedAt: fmt(addDays(today, -2)), isActive: 1
    })
    insertOrder.run({
      patientId: p2.lastInsertRowid, type: 'nursing',
      content: '低脂处方粮少食多餐', frequency: '每日3次',
      prescribedBy: '王医生', prescribedAt: fmt(addDays(today, -2)), isActive: 1
    })
    insertOrder.run({
      patientId: p3.lastInsertRowid, type: 'medication',
      content: '雾化治疗', frequency: '每日2次',
      prescribedBy: '陈医生', prescribedAt: fmt(addDays(today, -1)), isActive: 1
    })
    insertOrder.run({
      patientId: p3.lastInsertRowid, type: 'examination',
      content: '血常规复查', frequency: '隔日1次',
      prescribedBy: '陈医生', prescribedAt: fmt(addDays(today, -1)), isActive: 1
    })
    insertOrder.run({
      patientId: p4.lastInsertRowid, type: 'nursing',
      content: '针灸理疗+热敷', frequency: '每日1次',
      prescribedBy: '王医生', prescribedAt: fmt(addDays(today, -6)), isActive: 1
    })
    insertOrder.run({
      patientId: p4.lastInsertRowid, type: 'medication',
      content: '美洛昔康 0.1mg/kg 口服', frequency: '每日1次',
      prescribedBy: '王医生', prescribedAt: fmt(addDays(today, -6)), isActive: 1
    })

    insertFollowup.run({
      patientId: p5.lastInsertRowid, scheduledDate: fmtDate(addDays(today, -3)),
      status: 'overdue', reason: '胃肠淤滞出院后复查', notes: '主人一直未回复微信消息'
    })
    insertFollowup.run({
      patientId: p1.lastInsertRowid, scheduledDate: fmtDate(addDays(today, 3)),
      status: 'pending', reason: '下泌尿道综合征出院后复查', notes: null
    })
    insertFollowup.run({
      patientId: p4.lastInsertRowid, scheduledDate: fmtDate(addDays(today, 1)),
      status: 'pending', reason: '椎间盘突出复查', notes: null
    })
    insertFollowup.run({
      patientId: p2.lastInsertRowid, scheduledDate: fmtDate(addDays(today, 7)),
      status: 'pending', reason: '胰腺炎出院后复查', notes: null
    })

    insertComm.run({
      patientId: p1.lastInsertRowid, contactAt: fmt(addDays(today, -1)),
      method: 'wechat', content: '通知主人团团病情好转，尿量恢复正常',
      contactedBy: '前台小周', result: '主人表示欣慰，询问何时可出院'
    })
    insertComm.run({
      patientId: p1.lastInsertRowid, contactAt: fmt(addDays(today, 0)),
      method: 'phone', content: '告知昨夜漏喂药情况及补服安排',
      contactedBy: '前台小周', result: '主人理解，要求加强交接班提醒'
    })
    insertComm.run({
      patientId: p5.lastInsertRowid, contactAt: fmt(addDays(today, -2)),
      method: 'wechat', content: '提醒复查，发送预约链接',
      contactedBy: '前台小周', result: '已读未回'
    })
    insertComm.run({
      patientId: p5.lastInsertRowid, contactAt: fmt(addDays(today, -1)),
      method: 'phone', content: '电话提醒复查，确认雪球饮食排便情况',
      contactedBy: '前台小周', result: '无人接听，稍后再试'
    })
    insertComm.run({
      patientId: p3.lastInsertRowid, contactAt: fmt(addDays(today, 0)),
      method: 'phone', content: '通知主人小橘症状加重，建议调整治疗方案',
      contactedBy: '陈医生', result: '主人同意调整方案，要求每天通报情况'
    })
    insertComm.run({
      patientId: p2.lastInsertRowid, contactAt: fmt(addDays(today, -1)),
      method: 'wechat', content: '旺财今日体温偏高，已通知医生',
      contactedBy: '前台小周', result: '主人表示担忧，希望视频探视'
    })
  })

  transaction()
}
