import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.join(__dirname, '..', 'data')

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'roastery.db')

const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export function initTables(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS roast_curves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bean_type TEXT NOT NULL,
      roast_level TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      current_version INTEGER NOT NULL DEFAULT 1,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS curve_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      curve_id INTEGER NOT NULL REFERENCES roast_curves(id),
      version_number INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      charge_temp REAL,
      turn_point_temp REAL,
      turn_point_time REAL,
      first_crack_temp REAL,
      first_crack_time REAL,
      development_time REAL,
      drop_temp REAL,
      notes TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cupping_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      curve_id INTEGER NOT NULL REFERENCES roast_curves(id),
      curve_version_id INTEGER REFERENCES curve_versions(id),
      batch_code TEXT NOT NULL,
      dry_aroma REAL,
      wet_aroma REAL,
      acidity REAL,
      body REAL,
      aftertaste REAL,
      balance REAL,
      overall REAL,
      total_score REAL,
      flavor_anomaly INTEGER NOT NULL DEFAULT 0,
      anomaly_description TEXT,
      cupper_name TEXT NOT NULL,
      cupped_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      channel TEXT NOT NULL,
      content TEXT NOT NULL,
      curve_id INTEGER REFERENCES roast_curves(id),
      cupping_score_id INTEGER REFERENCES cupping_scores(id),
      batch_code TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      handler TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS inventory_batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bean_type TEXT NOT NULL,
      batch_code TEXT NOT NULL,
      quantity_kg REAL NOT NULL,
      remaining_kg REAL NOT NULL,
      roast_date TEXT NOT NULL,
      expiry_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'normal',
      curve_id INTEGER REFERENCES roast_curves(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      module TEXT NOT NULL,
      action TEXT NOT NULL,
      operator TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      detail TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
}

export function logOperation(
  module: string,
  action: string,
  operator: string,
  targetType: string,
  targetId: number,
  detail?: string
): void {
  db.prepare(
    `INSERT INTO operation_logs (module, action, operator, target_type, target_id, detail)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(module, action, operator, targetType, targetId, detail || null)
}

initTables()

export default db
