import Database from 'better-sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'dental.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('frontdesk', 'doctor', 'warehouse')),
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    gender TEXT,
    age INTEGER,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS treatment_nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    node_type TEXT NOT NULL CHECK(node_type IN ('film', 'consultation', 'surgery1', 'suture_removal', 'surgery2', 'crown')),
    planned_date TEXT NOT NULL,
    actual_date TEXT,
    status TEXT NOT NULL DEFAULT 'planned' CHECK(status IN ('planned', 'completed', 'cancelled', 'rescheduled')),
    notes TEXT,
    doctor_id INTEGER,
    consumable_id INTEGER,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES users(id),
    FOREIGN KEY (consumable_id) REFERENCES consumables(id)
  );

  CREATE TABLE IF NOT EXISTS consumables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    model TEXT,
    batch_no TEXT,
    category TEXT NOT NULL CHECK(category IN ('implant', 'abutment', 'crown', 'tool')),
    stock_qty INTEGER NOT NULL DEFAULT 0,
    locked_qty INTEGER NOT NULL DEFAULT 0,
    used_qty INTEGER NOT NULL DEFAULT 0,
    unit TEXT DEFAULT '个',
    status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'locked', 'used', 'expired')),
    location TEXT,
    patient_id INTEGER,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (patient_id) REFERENCES patients(id)
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER,
    type TEXT NOT NULL CHECK(type IN ('reschedule', 'consumable_change', 'missed_followup')),
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (patient_id) REFERENCES patients(id)
  );

  CREATE TABLE IF NOT EXISTS operation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    user_name TEXT,
    user_role TEXT,
    action TEXT NOT NULL,
    detail TEXT,
    patient_id INTEGER,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id)
  );
`);

export function logOperation(user, action, detail, patientId) {
  const stmt = db.prepare(`
    INSERT INTO operation_logs (user_id, user_name, user_role, action, detail, patient_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(user.id, user.name, user.role, action, detail, patientId || null);
}

export default db;
