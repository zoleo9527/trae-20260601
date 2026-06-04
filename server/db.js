import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { mkdirSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const DATA_DIR = join(__dirname, '..', 'data')
mkdirSync(DATA_DIR, { recursive: true })

const DB_PATH = join(DATA_DIR, 'pharmacy.db')

let db

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
  }
  return db
}

export function initDb() {
  const db = getDb()

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('pharmacist', 'worker', 'delivery')),
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS prescriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      patient_name TEXT NOT NULL,
      herbs TEXT NOT NULL,
      dosage INTEGER NOT NULL DEFAULT 1,
      notes TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending_review' CHECK(status IN ('pending_review', 'approved', 'rejected')),
      reviewer_id INTEGER,
      reviewed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (reviewer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS decoction_batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_code TEXT UNIQUE NOT NULL,
      prescription_id INTEGER NOT NULL,
      worker_id INTEGER,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed')),
      decoction_method TEXT DEFAULT '常规煎煮',
      water_ratio TEXT DEFAULT '1:10',
      duration_minutes INTEGER DEFAULT 60,
      started_at TEXT,
      completed_at TEXT,
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (prescription_id) REFERENCES prescriptions(id),
      FOREIGN KEY (worker_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS packaging_labels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label_code TEXT UNIQUE NOT NULL,
      batch_id INTEGER NOT NULL,
      prescription_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'labeled', 'ready_ship', 'shipping', 'delivered', 'returned')),
      package_count INTEGER DEFAULT 1,
      labeled_at TEXT,
      shipped_at TEXT,
      delivered_at TEXT,
      tracking_no TEXT DEFAULT '',
      courier TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (batch_id) REFERENCES decoction_batches(id),
      FOREIGN KEY (prescription_id) REFERENCES prescriptions(id)
    );

    CREATE TABLE IF NOT EXISTS status_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL CHECK(entity_type IN ('prescription', 'batch', 'label')),
      entity_id INTEGER NOT NULL,
      entity_code TEXT NOT NULL,
      from_status TEXT NOT NULL,
      to_status TEXT NOT NULL,
      operator_id INTEGER NOT NULL,
      operator_name TEXT NOT NULL,
      operator_role TEXT NOT NULL,
      note TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );
  `)

  return db
}

export function closeDb() {
  if (db) {
    db.close()
    db = null
  }
}
