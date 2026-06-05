import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../data/complaints.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS complaints (
      id TEXT PRIMARY KEY,
      complaint_no TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      type TEXT NOT NULL,
      source TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'medium',
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      related_coach TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      current_handler_role TEXT NOT NULL,
      current_handler_name TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS action_logs (
      id TEXT PRIMARY KEY,
      complaint_id TEXT NOT NULL,
      action_type TEXT NOT NULL,
      operator_role TEXT NOT NULL,
      operator_name TEXT NOT NULL,
      timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      remark TEXT,
      reject_reason TEXT,
      supplementary_note TEXT,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS compensations (
      id TEXT PRIMARY KEY,
      complaint_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      proposed_by TEXT NOT NULL,
      proposed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      approved_by TEXT,
      approved_at DATETIME,
      reject_reason TEXT,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
    CREATE INDEX IF NOT EXISTS idx_complaints_handler ON complaints(current_handler_role, current_handler_name);
    CREATE INDEX IF NOT EXISTS idx_action_logs_complaint ON action_logs(complaint_id);
    CREATE INDEX IF NOT EXISTS idx_compensations_complaint ON compensations(complaint_id);
  `);
}

initDatabase();

export default db;
