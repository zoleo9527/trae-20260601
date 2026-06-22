import BetterSqlite3 from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { seedDatabase } from './seed.js'

const Database = BetterSqlite3 as any

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_DIR = path.join(__dirname, '..', 'data')
const DB_PATH = path.join(DB_DIR, 'app.db')

let db: any = null

function ensureDir() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true })
  }
}

function createTables(db: any) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT,
      status TEXT DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS joint_tests (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id),
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      executor TEXT,
      planned_at TEXT,
      completed_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS test_items (
      id TEXT PRIMARY KEY,
      test_id TEXT NOT NULL REFERENCES joint_tests(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      expected_result TEXT,
      actual_result TEXT,
      passed INTEGER DEFAULT NULL,
      remark TEXT,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS issues (
      id TEXT PRIMARY KEY,
      test_id TEXT REFERENCES joint_tests(id),
      test_item_id TEXT REFERENCES test_items(id),
      project_id TEXT NOT NULL REFERENCES projects(id),
      title TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'major',
      status TEXT NOT NULL DEFAULT 'pending_assign',
      assignee TEXT,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      closed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS issue_progresses (
      id TEXT PRIMARY KEY,
      issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      operator TEXT NOT NULL,
      action_type TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      operator_role TEXT NOT NULL,
      operator_name TEXT NOT NULL,
      detail TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_joint_tests_project ON joint_tests(project_id);
    CREATE INDEX IF NOT EXISTS idx_joint_tests_status ON joint_tests(status);
    CREATE INDEX IF NOT EXISTS idx_test_items_test ON test_items(test_id);
    CREATE INDEX IF NOT EXISTS idx_issues_test ON issues(test_id);
    CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
    CREATE INDEX IF NOT EXISTS idx_issues_assignee ON issues(assignee);
    CREATE INDEX IF NOT EXISTS idx_issue_progresses_issue ON issue_progresses(issue_id);
    CREATE INDEX IF NOT EXISTS idx_operation_logs_entity ON operation_logs(entity_type, entity_id);

    CREATE TABLE IF NOT EXISTS notarial_files (
      id TEXT PRIMARY KEY,
      case_number TEXT NOT NULL,
      applicant_name TEXT NOT NULL,
      application_date TEXT NOT NULL,
      document_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending_archive',
      current_handler_role TEXT,
      current_handler_name TEXT,
      archive_reason TEXT,
      archive_operator_role TEXT,
      archive_operator_name TEXT,
      archive_time TEXT,
      batch_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS file_pickups (
      id TEXT PRIMARY KEY,
      file_id TEXT NOT NULL REFERENCES notarial_files(id),
      pickup_code TEXT NOT NULL,
      picker_name TEXT,
      picker_id_number TEXT,
      picker_phone TEXT,
      pickup_time TEXT,
      pickup_confirmed_by_role TEXT,
      pickup_confirmed_by_name TEXT,
      signature_url TEXT,
      status TEXT NOT NULL DEFAULT 'pending_pickup',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_notarial_files_status ON notarial_files(status);
    CREATE INDEX IF NOT EXISTS idx_notarial_files_handler ON notarial_files(current_handler_role);
    CREATE INDEX IF NOT EXISTS idx_file_pickups_file ON file_pickups(file_id);
    CREATE INDEX IF NOT EXISTS idx_file_pickups_code ON file_pickups(pickup_code);
  `)
}

export function getDb() {
  if (!db) {
    ensureDir()
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    createTables(db)
  }
  return db
}

export function resetDatabase() {
  if (db) {
    db.close()
    db = null
  }
  ensureDir()
  db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    DROP TABLE IF EXISTS operation_logs;
    DROP TABLE IF EXISTS issue_progresses;
    DROP TABLE IF EXISTS issues;
    DROP TABLE IF EXISTS test_items;
    DROP TABLE IF EXISTS joint_tests;
    DROP TABLE IF EXISTS projects;
  `)

  createTables(db)
  seedDatabase(db)
  return db
}
