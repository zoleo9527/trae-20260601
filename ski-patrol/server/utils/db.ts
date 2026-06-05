import Database from 'better-sqlite3'
import { join, resolve } from 'path'
import { mkdirSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

let _db: Database.Database | null = null

function getDataDir(): string {
  const devDir = join(__dirname, '..', '..', 'data')
  if (existsSync(devDir)) return devDir
  return join(process.cwd(), 'data')
}

function getDbPath(): string {
  return join(getDataDir(), 'ski-patrol.db')
}

export function getDb(): Database.Database {
  if (_db) return _db
  const dataDir = getDataDir()
  mkdirSync(dataDir, { recursive: true })
  const dbPath = join(dataDir, 'ski-patrol.db')
  _db = new Database(dbPath)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')
  return _db
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('rental', 'coach', 'patrol'))
);

CREATE TABLE IF NOT EXISTS trails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK(difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
    status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'closed', 'maintenance'))
);

CREATE TABLE IF NOT EXISTS patrols (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trail_id INTEGER NOT NULL REFERENCES trails(id),
    creator_id INTEGER NOT NULL REFERENCES users(id),
    type TEXT NOT NULL CHECK(type IN ('daily', 'special')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'archived')),
    result TEXT CHECK(result IN ('normal', 'issue', NULL)),
    conclusion TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    completed_at TEXT,
    archived_at TEXT
);

CREATE TABLE IF NOT EXISTS risks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patrol_id INTEGER NOT NULL REFERENCES patrols(id),
    creator_id INTEGER NOT NULL REFERENCES users(id),
    level TEXT NOT NULL CHECK(level IN ('low', 'medium', 'high', 'critical')),
    description TEXT NOT NULL,
    urgency TEXT NOT NULL DEFAULT 'normal' CHECK(urgency IN ('normal', 'urgent', 'immediate')),
    status TEXT NOT NULL DEFAULT 'reported' CHECK(status IN ('reported', 'approved', 'rejected', 'resubmitted', 'archived')),
    reject_reason TEXT,
    supplement_note TEXT,
    approve_action TEXT CHECK(approve_action IN ('reschedule', 'supplement', NULL)),
    approve_note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    resolved_at TEXT,
    archived_at TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL CHECK(entity_type IN ('patrol', 'risk')),
    entity_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    operator_id INTEGER NOT NULL REFERENCES users(id),
    detail TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
`

const SEED_SQL = `
INSERT OR IGNORE INTO users (id, name, role) VALUES (1, '张租赁', 'rental');
INSERT OR IGNORE INTO users (id, name, role) VALUES (2, '李教练', 'coach');
INSERT OR IGNORE INTO users (id, name, role) VALUES (3, '王巡逻', 'patrol');

INSERT OR IGNORE INTO trails (id, name, difficulty, status) VALUES (1, '初级道-雪花', 'beginner', 'open');
INSERT OR IGNORE INTO trails (id, name, difficulty, status) VALUES (2, '中级道-飞鹰', 'intermediate', 'open');
INSERT OR IGNORE INTO trails (id, name, difficulty, status) VALUES (3, '高级道-黑钻', 'advanced', 'open');
INSERT OR IGNORE INTO trails (id, name, difficulty, status) VALUES (4, '专家道-极地', 'expert', 'maintenance');
`

export function initDb(): void {
  const db = getDb()
  db.exec(SCHEMA_SQL)
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count
  if (userCount === 0) {
    db.exec(SEED_SQL)
  }
}

export function resetDb(): void {
  const db = getDb()
  db.exec('DELETE FROM audit_logs')
  db.exec('DELETE FROM risks')
  db.exec('DELETE FROM patrols')
  db.exec('DELETE FROM users')
  db.exec('DELETE FROM trails')
  db.exec('DELETE FROM sqlite_sequence')
  db.exec(SEED_SQL)
}

export function addAuditLog(
  db: Database.Database,
  entityType: 'patrol' | 'risk',
  entityId: number,
  action: string,
  operatorId: number,
  detail?: string
): void {
  db.prepare(
    'INSERT INTO audit_logs (entity_type, entity_id, action, operator_id, detail) VALUES (?, ?, ?, ?, ?)'
  ).run(entityType, entityId, action, operatorId, detail || null)
}
