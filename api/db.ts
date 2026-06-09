import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.resolve(__dirname, '..', 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'app.db')

const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS qualifications (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  license_type TEXT NOT NULL,
  license_no TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_by TEXT NOT NULL,
  reviewed_by TEXT,
  review_note TEXT,
  expire_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS qualification_review_logs (
  id TEXT PRIMARY KEY,
  qualification_id TEXT NOT NULL REFERENCES qualifications(id),
  action TEXT NOT NULL,
  operator TEXT NOT NULL,
  role TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY,
  request_no TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  qualification_id TEXT NOT NULL REFERENCES qualifications(id),
  qualification_status TEXT NOT NULL,
  total_amount REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by TEXT NOT NULL,
  reviewed_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS purchase_items (
  id TEXT PRIMARY KEY,
  purchase_id TEXT NOT NULL REFERENCES purchases(id),
  product_name TEXT NOT NULL,
  specification TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS purchase_flow_logs (
  id TEXT PRIMARY KEY,
  purchase_id TEXT NOT NULL REFERENCES purchases(id),
  action TEXT NOT NULL,
  operator TEXT NOT NULL,
  role TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_qualifications_status ON qualifications(status);
CREATE INDEX IF NOT EXISTS idx_qualifications_expire ON qualifications(expire_date);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_customer ON purchases(customer_name);
CREATE INDEX IF NOT EXISTS idx_purchases_qualification ON purchases(qualification_id);
`

export function initTables(): void {
  db.exec(CREATE_TABLES_SQL)
}

export function resetDatabase(): void {
  db.exec(`
    DROP TABLE IF EXISTS purchase_flow_logs;
    DROP TABLE IF EXISTS purchase_items;
    DROP TABLE IF EXISTS purchases;
    DROP TABLE IF EXISTS qualification_review_logs;
    DROP TABLE IF EXISTS qualifications;
  `)
  initTables()
}

initTables()

export default db
