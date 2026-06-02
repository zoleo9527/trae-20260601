const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'ad_system.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDb() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      client_name TEXT NOT NULL,
      brand TEXT NOT NULL,
      product TEXT,
      sales_person TEXT NOT NULL,
      total_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'draft',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      duration INTEGER DEFAULT 15,
      version INTEGER DEFAULT 1,
      status TEXT DEFAULT 'pending_review',
      upload_time TEXT DEFAULT (datetime('now', 'localtime')),
      review_notes TEXT,
      reviewer TEXT,
      review_time TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      material_id INTEGER NOT NULL,
      channel TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      schedule_date TEXT NOT NULL,
      duration INTEGER DEFAULT 15,
      position TEXT DEFAULT 'normal',
      status TEXT DEFAULT 'scheduled',
      conflict_note TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (material_id) REFERENCES materials(id)
    );

    CREATE TABLE IF NOT EXISTS broadcast_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_id INTEGER NOT NULL,
      actual_air_time TEXT,
      air_status TEXT DEFAULT 'pending',
      confirmed INTEGER DEFAULT 0,
      confirmed_by TEXT,
      confirmed_time TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (schedule_id) REFERENCES schedules(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      material_id INTEGER,
      action TEXT NOT NULL,
      from_status TEXT,
      to_status TEXT,
      operator TEXT NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (material_id) REFERENCES materials(id)
    );
  `);

  return db;
}

module.exports = { getDb, initDb };
