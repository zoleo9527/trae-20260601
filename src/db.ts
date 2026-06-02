import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = path.join(__dirname, '..', 'property.db')

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH)
    _db.pragma('journal_mode = WAL')
    _db.pragma('foreign_keys = ON')
  }
  return _db
}

export function initDb(): void {
  const db = getDb()

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('gate','cs','engineer','supervisor')),
      enterprise_id INTEGER,
      password TEXT NOT NULL DEFAULT '123456'
    );

    CREATE TABLE IF NOT EXISTS enterprises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      floor TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enterprise_id INTEGER NOT NULL REFERENCES enterprises(id),
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      position TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS visitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enterprise_id INTEGER NOT NULL REFERENCES enterprises(id),
      host_employee_id INTEGER NOT NULL REFERENCES employees(id),
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      purpose TEXT NOT NULL,
      visit_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','arrived','cancelled'))
    );

    CREATE TABLE IF NOT EXISTS access_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visitor_id INTEGER REFERENCES visitors(id),
      gate_no TEXT NOT NULL,
      pass_type TEXT NOT NULL DEFAULT 'normal' CHECK(pass_type IN ('normal','temporary')),
      direction TEXT NOT NULL CHECK(direction IN ('in','out')),
      verified_by INTEGER NOT NULL REFERENCES users(id),
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS repair_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enterprise_id INTEGER NOT NULL REFERENCES enterprises(id),
      reporter_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      location TEXT NOT NULL,
      urgency TEXT NOT NULL DEFAULT 'medium' CHECK(urgency IN ('low','medium','high')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','assigned','in_progress','completed','closed')),
      deadline TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS work_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repair_order_id INTEGER NOT NULL REFERENCES repair_orders(id),
      engineer_id INTEGER REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'assigned' CHECK(status IN ('assigned','accepted','in_progress','reassigned','completed')),
      assigned_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      accepted_at TEXT,
      completed_at TEXT,
      note TEXT
    );

    CREATE TABLE IF NOT EXISTS evaluations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repair_order_id INTEGER NOT NULL REFERENCES repair_orders(id),
      rater_id INTEGER NOT NULL REFERENCES users(id),
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      comment TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
  `)
}
