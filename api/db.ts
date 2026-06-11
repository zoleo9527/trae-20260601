import Database from 'better-sqlite3'

function dateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

function offsetDate(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return dateStr(d)
}

function getWeekStart(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return dateStr(d)
}

const now = () => new Date().toISOString()

let db: Database.Database

function createTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS counters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      floor TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      counterId INTEGER,
      avatar TEXT DEFAULT '',
      phone TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      counterId INTEGER NOT NULL,
      weekStart TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      createdBy INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS schedule_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scheduleId INTEGER NOT NULL,
      date TEXT NOT NULL,
      shift TEXT NOT NULL,
      guideId INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scheduleItemId INTEGER,
      staffId INTEGER NOT NULL,
      counterId INTEGER NOT NULL,
      date TEXT NOT NULL,
      shift TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending_confirm',
      currentResponsible INTEGER,
      deadline TEXT,
      confirmedAt TEXT,
      exceptionType TEXT,
      exceptionNote TEXT,
      rejectedReason TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      attendanceId INTEGER NOT NULL,
      reviewerId INTEGER NOT NULL,
      reviewerRole TEXT NOT NULL,
      action TEXT NOT NULL,
      reason TEXT DEFAULT '',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operatorId INTEGER,
      operatorName TEXT DEFAULT '',
      action TEXT NOT NULL,
      entityType TEXT NOT NULL,
      entityId INTEGER,
      detail TEXT DEFAULT '',
      createdAt TEXT NOT NULL
    );
  `)
}

function seedData(db: Database.Database) {
  const ts = now()
  const weekStart = getWeekStart()

  const insertCounter = db.prepare(
    'INSERT INTO counters (name, brand, floor) VALUES (?, ?, ?)'
  )
  insertCounter.run('兰蔻专柜', '兰蔻', '1F')
  insertCounter.run('耐克专柜', '耐克', '2F')
  insertCounter.run('周大福专柜', '周大福', '1F')

  const insertStaff = db.prepare(
    'INSERT INTO staff (name, role, counterId, avatar, phone) VALUES (?, ?, ?, ?, ?)'
  )
  insertStaff.run('王芳', 'counter_manager', 1, '王', '13800000001')
  insertStaff.run('张明', 'floor_supervisor', null, '张', '13800000002')
  insertStaff.run('李红', 'brand_supervisor', 1, '李', '13800000003')
  insertStaff.run('陈丽', 'guide', 1, '陈', '13800000004')
  insertStaff.run('赵敏', 'guide', 2, '赵', '13800000005')
  insertStaff.run('刘洋', 'guide', 3, '刘', '13800000006')
  insertStaff.run('周强', 'counter_manager', 2, '周', '13800000007')
  insertStaff.run('孙悦', 'counter_manager', 3, '孙', '13800000008')
  insertStaff.run('吴雪', 'guide', 1, '吴', '13800000009')
  insertStaff.run('郑伟', 'brand_supervisor', 2, '郑', '13800000010')

  const insertSchedule = db.prepare(
    'INSERT INTO schedules (counterId, weekStart, status, createdBy, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)'
  )
  insertSchedule.run(1, weekStart, 'submitted', 1, ts, ts)
  insertSchedule.run(2, weekStart, 'submitted', 7, ts, ts)
  insertSchedule.run(3, weekStart, 'submitted', 8, ts, ts)

  const insertItem = db.prepare(
    'INSERT INTO schedule_items (scheduleId, date, shift, guideId) VALUES (?, ?, ?, ?)'
  )
  const mon = offsetDate(-3)
  const tue = offsetDate(-2)
  const wed = offsetDate(-1)
  const thu = offsetDate(0)
  const fri = offsetDate(1)
  const sat = offsetDate(2)
  const sun = offsetDate(3)

  // Schedule 1 (counter 1, 兰蔻) - 陈丽+吴雪
  insertItem.run(1, mon, 'morning', 4)
  insertItem.run(1, mon, 'afternoon', 9)
  insertItem.run(1, tue, 'morning', 4)
  insertItem.run(1, tue, 'afternoon', 9)
  insertItem.run(1, wed, 'morning', 4)
  insertItem.run(1, wed, 'afternoon', 9)
  insertItem.run(1, thu, 'morning', 4)
  insertItem.run(1, thu, 'afternoon', 9)
  insertItem.run(1, fri, 'morning', 4)
  insertItem.run(1, fri, 'afternoon', 9)
  insertItem.run(1, sat, 'morning', 4)
  insertItem.run(1, sat, 'afternoon', 9)
  insertItem.run(1, sun, 'morning', 4)
  insertItem.run(1, sun, 'afternoon', 9)

  // Schedule 2 (counter 2, 耐克) - 赵敏
  for (let i = 0; i < 7; i++) {
    const d = offsetDate(-3 + i)
    insertItem.run(2, d, 'morning', 5)
    insertItem.run(2, d, 'afternoon', 5)
  }

  // Schedule 3 (counter 3, 周大福) - 刘洋
  for (let i = 0; i < 7; i++) {
    const d = offsetDate(-3 + i)
    insertItem.run(3, d, 'morning', 6)
    insertItem.run(3, d, 'afternoon', 6)
  }

  const insertAtt = db.prepare(`
    INSERT INTO attendance (scheduleItemId, staffId, counterId, date, shift, status, currentResponsible, deadline, confirmedAt, exceptionType, exceptionNote, rejectedReason, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  // 正常闭环 (4) - 兰蔻周一全天、周二早
  insertAtt.run(1, 4, 1, mon, 'morning', 'closed', null, offsetDate(-3), offsetDate(-3), null, null, null, ts, ts)
  insertAtt.run(2, 9, 1, mon, 'afternoon', 'closed', null, offsetDate(-3), offsetDate(-3), null, null, null, ts, ts)
  insertAtt.run(3, 4, 1, tue, 'morning', 'closed', null, offsetDate(-2), offsetDate(-2), null, null, null, ts, ts)
  insertAtt.run(4, 9, 1, tue, 'afternoon', 'pending_brand_confirm', 3, offsetDate(1), offsetDate(-2), null, null, null, ts, ts)

  // 待复核 (3)
  insertAtt.run(5, 4, 1, wed, 'morning', 'pending_review', 2, offsetDate(0), offsetDate(-1), null, null, null, ts, ts)
  insertAtt.run(6, 9, 1, wed, 'afternoon', 'pending_review', 2, offsetDate(0), offsetDate(-1), null, null, null, ts, ts)
  insertAtt.run(19, 5, 2, tue, 'morning', 'pending_review', 2, offsetDate(0), offsetDate(-2), null, null, null, ts, ts)

  // 待确认 (3)
  insertAtt.run(7, 4, 1, thu, 'morning', 'pending_confirm', 4, offsetDate(0), null, null, null, null, ts, ts)
  insertAtt.run(21, 5, 2, wed, 'morning', 'pending_confirm', 5, offsetDate(-1), null, null, null, null, ts, ts)
  insertAtt.run(13, 4, 1, sun, 'morning', 'pending_confirm', 4, offsetDate(3), null, null, null, null, ts, ts)

  // 缺材料 (3) - 紧迫！截止今天/昨天
  insertAtt.run(8, 4, 1, thu, 'morning', 'pending_material', 4, offsetDate(0), null, 'material', '缺少上岗证原件(入职培训要求)', null, ts, ts)
  insertAtt.run(9, 9, 1, thu, 'afternoon', 'pending_material', 9, offsetDate(1), null, 'material', '健康证过期，需补交新证', null, ts, ts)
  insertAtt.run(20, 5, 2, tue, 'afternoon', 'pending_material', 5, offsetDate(-1), null, 'material', '缺少工牌打卡记录截图', null, ts, ts)

  // 超时升级 (3) - 最紧迫！已超时
  insertAtt.run(10, 5, 2, mon, 'morning', 'timeout_escalated', 2, offsetDate(-3), null, 'timeout', '柜长未在T+1 10:00前确认，自动升级', null, ts, ts)
  insertAtt.run(11, 6, 3, mon, 'morning', 'timeout_escalated', 2, offsetDate(-3), null, 'timeout', '柜长未在T+1 10:00前确认，自动升级', null, ts, ts)
  insertAtt.run(22, 5, 2, wed, 'afternoon', 'timeout_escalated', 2, offsetDate(-1), null, 'timeout', '柜长未在T+1 10:00前确认，自动升级', null, ts, ts)

  // 复核不通过 (4)
  insertAtt.run(12, 5, 2, mon, 'afternoon', 'review_rejected', 7, offsetDate(-2), offsetDate(-3), null, null, '排班表为早班，但考勤显示下午打卡，与排班不符', ts, ts)
  insertAtt.run(14, 6, 3, tue, 'morning', 'review_rejected', 8, offsetDate(-1), offsetDate(-2), null, null, '签到时间异常：凌晨3点打卡，疑似系统错误', ts, ts)
  insertAtt.run(15, 6, 3, tue, 'afternoon', 'review_rejected', 8, offsetDate(-1), offsetDate(-2), null, null, '专柜销售小票显示当班人非刘洋本人', ts, ts)
  insertAtt.run(16, 5, 2, thu, 'morning', 'review_rejected', 7, offsetDate(1), offsetDate(0), null, null, '考勤备注缺失，请补充当日实际到岗情况说明', ts, ts)

  // 周大福待品牌确认 (1)
  insertAtt.run(17, 6, 3, wed, 'morning', 'pending_brand_confirm', 10, offsetDate(2), offsetDate(-1), null, null, null, ts, ts)

  // 周大福待复核 (1)
  insertAtt.run(18, 6, 3, wed, 'afternoon', 'pending_review', 2, offsetDate(1), offsetDate(-1), null, null, null, ts, ts)

  const insertReview = db.prepare(
    'INSERT INTO reviews (attendanceId, reviewerId, reviewerRole, action, reason, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
  )

  // 闭环记录的复核链
  insertReview.run(1, 2, 'floor_supervisor', 'approve', '', ts)
  insertReview.run(1, 3, 'brand_supervisor', 'approve', '正常', ts)
  insertReview.run(2, 2, 'floor_supervisor', 'approve', '', ts)
  insertReview.run(2, 3, 'brand_supervisor', 'approve', '正常', ts)
  insertReview.run(3, 2, 'floor_supervisor', 'approve', '', ts)
  insertReview.run(3, 3, 'brand_supervisor', 'approve', '正常', ts)

  // pending_brand_confirm 的楼层通过记录
  insertReview.run(4, 2, 'floor_supervisor', 'approve', '', ts)
  insertReview.run(17, 2, 'floor_supervisor', 'approve', '', ts)

  // 复核不通过记录
  insertReview.run(12, 2, 'floor_supervisor', 'reject', '排班表为早班，但考勤显示下午打卡，与排班不符', ts)
  insertReview.run(14, 2, 'floor_supervisor', 'reject', '签到时间异常：凌晨3点打卡，疑似系统错误', ts)
  insertReview.run(15, 2, 'floor_supervisor', 'reject', '专柜销售小票显示当班人非刘洋本人', ts)
  insertReview.run(16, 2, 'floor_supervisor', 'reject', '考勤备注缺失，请补充当日实际到岗情况说明', ts)

  // 多次复核退回场景 - 给att12加个历史，表示已经是第二次退回
  insertReview.run(12, 7, 'counter_manager', 'approve', '柜长已核对，声称排班临时调整未及时更新', ts)

  const insertLog = db.prepare(
    'INSERT INTO operation_logs (operatorId, operatorName, action, entityType, entityId, detail, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  insertLog.run(1, '王芳', 'create_schedule', 'schedule', 1, '创建兰蔻专柜本周排班(14班次)', ts)
  insertLog.run(7, '周强', 'create_schedule', 'schedule', 2, '创建耐克专柜本周排班(14班次)', ts)
  insertLog.run(8, '孙悦', 'create_schedule', 'schedule', 3, '创建周大福专柜本周排班(14班次)', ts)
  insertLog.run(1, '王芳', 'submit_schedule', 'schedule', 1, '提交兰蔻排班，等待考勤确认', ts)
  insertLog.run(7, '周强', 'submit_schedule', 'schedule', 2, '提交耐克排班，等待考勤确认', ts)
  insertLog.run(8, '孙悦', 'submit_schedule', 'schedule', 3, '提交周大福排班，等待考勤确认', ts)
  insertLog.run(4, '陈丽', 'confirm_attendance', 'attendance', 1, '陈丽确认周一早班考勤', ts)
  insertLog.run(9, '吴雪', 'confirm_attendance', 'attendance', 2, '吴雪确认周一晚班考勤', ts)
  insertLog.run(4, '陈丽', 'confirm_attendance', 'attendance', 3, '陈丽确认周二早班考勤', ts)
  insertLog.run(9, '吴雪', 'confirm_attendance', 'attendance', 4, '吴雪确认周二晚班考勤', ts)
  insertLog.run(4, '陈丽', 'confirm_attendance', 'attendance', 5, '陈丽确认周三早班考勤', ts)
  insertLog.run(9, '吴雪', 'confirm_attendance', 'attendance', 6, '吴雪确认周三晚班考勤', ts)
  insertLog.run(4, '陈丽', 'mark_exception', 'attendance', 8, '标记异常：缺少上岗证原件', ts)
  insertLog.run(9, '吴雪', 'mark_exception', 'attendance', 9, '标记异常：健康证过期', ts)
  insertLog.run(5, '赵敏', 'mark_exception', 'attendance', 20, '标记异常：缺少工牌截图', ts)
  insertLog.run(2, '张明', 'approve_review', 'attendance', 1, '楼层主管通过-周一兰蔻早班', ts)
  insertLog.run(2, '张明', 'approve_review', 'attendance', 2, '楼层主管通过-周一兰蔻晚班', ts)
  insertLog.run(2, '张明', 'approve_review', 'attendance', 3, '楼层主管通过-周二兰蔻早班', ts)
  insertLog.run(2, '张明', 'approve_review', 'attendance', 4, '楼层主管通过-周二兰蔻晚班', ts)
  insertLog.run(3, '李红', 'approve_review', 'attendance', 1, '品牌督导通过-兰蔻周一早班', ts)
  insertLog.run(3, '李红', 'approve_review', 'attendance', 2, '品牌督导通过-兰蔻周一晚班', ts)
  insertLog.run(3, '李红', 'approve_review', 'attendance', 3, '品牌督导通过-兰蔻周二早班', ts)
  insertLog.run(2, '张明', 'reject_review', 'attendance', 12, '驳回：耐克周一晚班-排班与打卡不符', ts)
  insertLog.run(2, '张明', 'reject_review', 'attendance', 14, '驳回：周大福周二早班-凌晨打卡异常', ts)
  insertLog.run(2, '张明', 'reject_review', 'attendance', 15, '驳回：周大福周二晚班-销售小票人证不符', ts)
  insertLog.run(2, '张明', 'reject_review', 'attendance', 16, '驳回：耐克周四早班-缺少到岗备注', ts)
  insertLog.run(2, '张明', 'escalate_timeout', 'attendance', 10, '超时升级：耐克周一早班-T+1未确认', ts)
  insertLog.run(2, '张明', 'escalate_timeout', 'attendance', 11, '超时升级：周大福周一早班-T+1未确认', ts)
  insertLog.run(2, '张明', 'escalate_timeout', 'attendance', 22, '超时升级：耐克周三晚班-T+1未确认', ts)
  insertLog.run(7, '周强', 'resubmit_attendance', 'attendance', 12, '柜长重提：补充了临时调班说明', ts)
  insertLog.run(2, '张明', 'reject_review', 'attendance', 12, '二次驳回：调班无楼层主管签字记录', ts)
}

function initDb(): Database.Database {
  const database = new Database(':memory:')
  database.pragma('journal_mode = WAL')
  database.pragma('foreign_keys = ON')
  createTables(database)
  seedData(database)
  return database
}

db = initDb()

export function getDb(): Database.Database {
  return db
}

export function resetDb(): void {
  db.pragma('foreign_keys = OFF')
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as any[]
  tables.forEach((t) => db.exec(`DELETE FROM ${t.name}`))
  tables.forEach((t) => {
    try { db.exec(`DELETE FROM sqlite_sequence WHERE name='${t.name}'`) } catch {}
  })
  db.pragma('foreign_keys = ON')
  seedData(db)
}

export default db
