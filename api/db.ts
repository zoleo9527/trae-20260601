import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = path.join(__dirname, '..', 'data', 'mall.db')

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
  }
  return db
}

export function initDb(): void {
  const database = getDb()

  database.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      shopNo TEXT NOT NULL,
      contact TEXT NOT NULL,
      phone TEXT NOT NULL,
      category TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenantId INTEGER NOT NULL,
      activityName TEXT NOT NULL,
      activityDate TEXT NOT NULL,
      venueName TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      createdAt TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      approvalId INTEGER,
      FOREIGN KEY (tenantId) REFERENCES tenants(id)
    );

    CREATE TABLE IF NOT EXISTS venue_approvals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      applicationId INTEGER NOT NULL,
      venueName TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      createdAt TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenantId INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      category TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'open',
      result TEXT DEFAULT '',
      createdAt TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (tenantId) REFERENCES tenants(id)
    );

    CREATE TABLE IF NOT EXISTS application_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      applicationId INTEGER NOT NULL,
      action TEXT NOT NULL,
      operator TEXT NOT NULL,
      remark TEXT DEFAULT '',
      handover TEXT DEFAULT '',
      createdAt TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (applicationId) REFERENCES activity_applications(id)
    );

    CREATE TABLE IF NOT EXISTS approval_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      approvalId INTEGER NOT NULL,
      action TEXT NOT NULL,
      operator TEXT NOT NULL,
      remark TEXT DEFAULT '',
      handover TEXT DEFAULT '',
      createdAt TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (approvalId) REFERENCES venue_approvals(id)
    );

    CREATE TABLE IF NOT EXISTS complaint_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaintId INTEGER NOT NULL,
      action TEXT NOT NULL,
      operator TEXT NOT NULL,
      remark TEXT DEFAULT '',
      createdAt TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (complaintId) REFERENCES complaints(id)
    );
  `)

  const handoverCols = ['application_logs', 'approval_logs']
  for (const table of handoverCols) {
    const cols = database.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]
    if (!cols.some(c => c.name === 'handover')) {
      database.exec(`ALTER TABLE ${table} ADD COLUMN handover TEXT DEFAULT ''`)
    }
  }

  const count = database.prepare('SELECT COUNT(*) as cnt FROM tenants').get() as { cnt: number }
  if (count.cnt === 0) {
    database.exec(`
      INSERT INTO tenants (name, shopNo, contact, phone, category) VALUES
        ('锦绣服饰', 'A-101', '张经理', '138-0001-1001', '服装'),
        ('味千拉面', 'B-205', '李店长', '139-0002-2002', '餐饮'),
        ('星光数码', 'C-302', '王主管', '137-0003-3003', '电子'),
        ('花漾美妆', 'A-215', '赵店长', '136-0004-4004', '美妆'),
        ('童趣乐园', 'D-101', '刘经理', '135-0005-5005', '亲子'),
        ('悦动健身', 'E-201', '陈主管', '134-0006-6006', '运动'),
        ('书香阁', 'F-103', '周店长', '133-0007-7007', '书店');
    `)
  }

  const complaintCount = database.prepare('SELECT COUNT(*) as cnt FROM complaints').get() as { cnt: number }
  if (complaintCount.cnt === 0) {
    database.exec(`
      INSERT INTO complaints (tenantId, title, content, category, status, result) VALUES
        (1, '空调温度过低', 'A-101区域空调温度常年过低，顾客反映不适，多次报修未解决', '设施', 'resolved', '已调高空调温度并安排定期巡检'),
        (1, '装修噪音扰民', '隔壁铺位装修期间噪音严重，影响正常营业', '环境', 'resolved', '协调装修时间，限定工作时段施工'),
        (2, '油烟排放问题', 'B-205厨房油烟排放不达标，影响周边商户', '环境', 'processing', '已要求加装油烟净化设备，限期整改'),
        (3, '消防通道堆物', 'C-302后方消防通道长期堆放货物', '安全', 'open', ''),
        (5, '顾客滑倒受伤', 'D-101门口地面湿滑，已有顾客滑倒', '安全', 'open', ''),
        (4, '灯光闪烁故障', 'A-215区域照明灯频繁闪烁，影响顾客体验', '设施', 'resolved', '已更换灯管和镇流器');
    `)

    const complaintRows = database.prepare('SELECT id, tenantId, status FROM complaints').all() as { id: number; tenantId: number; status: string }[]
    for (const c of complaintRows) {
      if (c.status === 'open') {
        database.prepare(`INSERT INTO complaint_logs (complaintId, action, operator, remark) VALUES (?, 'created', '客服台', '已登记投诉，待处理')`).run(c.id)
      } else if (c.status === 'processing') {
        database.prepare(`INSERT INTO complaint_logs (complaintId, action, operator, remark) VALUES (?, 'created', '客服台', '已登记投诉')`).run(c.id)
        database.prepare(`INSERT INTO complaint_logs (complaintId, action, operator, remark) VALUES (?, 'processed', '工程部', '已安排现场核查，制定整改方案')`).run(c.id)
      } else if (c.status === 'resolved') {
        database.prepare(`INSERT INTO complaint_logs (complaintId, action, operator, remark) VALUES (?, 'created', '客服台', '已登记投诉')`).run(c.id)
        database.prepare(`INSERT INTO complaint_logs (complaintId, action, operator, remark) VALUES (?, 'processed', '工程部', '已安排处理')`).run(c.id)
        database.prepare(`INSERT INTO complaint_logs (complaintId, action, operator, remark) VALUES (?, 'resolved', '客服台', '已确认处理结果，关闭投诉')`).run(c.id)
      }
    }
  }
}

export function clearApplicationData(): void {
  const database = getDb()
  database.pragma('foreign_keys = OFF')
  database.exec(`
    DELETE FROM approval_logs;
    DELETE FROM application_logs;
    DELETE FROM venue_approvals;
    DELETE FROM activity_applications;
  `)
  database.pragma('foreign_keys = ON')
}
