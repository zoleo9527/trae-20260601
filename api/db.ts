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

    CREATE TABLE IF NOT EXISTS application_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      applicationId INTEGER NOT NULL,
      action TEXT NOT NULL,
      operator TEXT NOT NULL,
      remark TEXT DEFAULT '',
      createdAt TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (applicationId) REFERENCES activity_applications(id)
    );

    CREATE TABLE IF NOT EXISTS approval_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      approvalId INTEGER NOT NULL,
      action TEXT NOT NULL,
      operator TEXT NOT NULL,
      remark TEXT DEFAULT '',
      createdAt TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (approvalId) REFERENCES venue_approvals(id)
    );
  `)

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
