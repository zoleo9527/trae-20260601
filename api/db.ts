import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.join(__dirname, '..', 'data')
const DB_PATH = path.join(DATA_DIR, 'referral.db')

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (_db) return _db
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  _db = new Database(DB_PATH)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')
  return _db
}

export function initDb(): void {
  const db = getDb()

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('gp', 'nurse', 'pho')),
      role_label TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS referrals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_name TEXT NOT NULL,
      patient_age INTEGER NOT NULL,
      patient_gender TEXT NOT NULL CHECK(patient_gender IN ('male', 'female')),
      reason TEXT NOT NULL,
      target_dept TEXT NOT NULL,
      urgency TEXT NOT NULL CHECK(urgency IN ('routine', 'urgent', 'emergency')) DEFAULT 'routine',
      expected_return_days INTEGER NOT NULL DEFAULT 7,
      status TEXT NOT NULL DEFAULT 'draft',
      created_by INTEGER NOT NULL REFERENCES users(id),
      version INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS referral_status_changes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      referral_id INTEGER NOT NULL REFERENCES referrals(id),
      from_status TEXT,
      to_status TEXT NOT NULL,
      operator_id INTEGER NOT NULL REFERENCES users(id),
      operator_role TEXT NOT NULL,
      operator_name TEXT NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS referral_change_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      referral_id INTEGER NOT NULL REFERENCES referrals(id),
      field TEXT NOT NULL,
      old_value TEXT NOT NULL,
      new_value TEXT NOT NULL,
      operator_id INTEGER NOT NULL REFERENCES users(id),
      operator_name TEXT NOT NULL,
      note TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS result_returns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      referral_id INTEGER NOT NULL REFERENCES referrals(id),
      result_content TEXT NOT NULL,
      result_dept TEXT NOT NULL,
      result_doctor TEXT NOT NULL,
      referral_modified_after_sent INTEGER NOT NULL DEFAULT 0,
      change_acknowledged INTEGER NOT NULL DEFAULT 0,
      confirmed_by INTEGER REFERENCES users(id),
      confirmed_by_name TEXT,
      confirmed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
    CREATE INDEX IF NOT EXISTS idx_referrals_created_by ON referrals(created_by);
    CREATE INDEX IF NOT EXISTS idx_referral_status_changes_referral_id ON referral_status_changes(referral_id);
    CREATE INDEX IF NOT EXISTS idx_referral_change_snapshots_referral_id ON referral_change_snapshots(referral_id);
    CREATE INDEX IF NOT EXISTS idx_result_returns_referral_id ON result_returns(referral_id);
  `)

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  if (userCount.count === 0) {
    const insertUser = db.prepare(
      'INSERT INTO users (username, password_hash, display_name, role, role_label) VALUES (?, ?, ?, ?, ?)'
    )
    insertUser.run('dr_wang', 'demo', '王建国', 'gp', '全科医生')
    insertUser.run('nurse_li', 'demo', '李芳', 'nurse', '护士')
    insertUser.run('pho_zhang', 'demo', '张卫民', 'pho', '公共卫生专员')
  }
}
