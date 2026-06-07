import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '../aquaculture.db');

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('TECHNICIAN', 'WAREHOUSE_KEEPER', 'FIELD_MANAGER')),
      phone TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ponds (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      area REAL,
      breed_type TEXT,
      stock_quantity INTEGER,
      status TEXT DEFAULT 'NORMAL',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS medicines (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      specification TEXT,
      manufacturer TEXT,
      unit TEXT NOT NULL,
      stock_quantity REAL NOT NULL DEFAULT 0,
      safety_interval_days INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inspections (
      id TEXT PRIMARY KEY,
      pond_id TEXT NOT NULL,
      inspector_id TEXT NOT NULL,
      inspect_date TEXT NOT NULL,
      water_temperature REAL,
      ph_value REAL,
      dissolved_oxygen REAL,
      abnormal_found INTEGER DEFAULT 0,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pond_id) REFERENCES ponds(id),
      FOREIGN KEY (inspector_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS feed_records (
      id TEXT PRIMARY KEY,
      pond_id TEXT NOT NULL,
      feeder_id TEXT NOT NULL,
      feed_date TEXT NOT NULL,
      feed_type TEXT,
      feed_quantity REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pond_id) REFERENCES ponds(id),
      FOREIGN KEY (feeder_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS disease_cases (
      id TEXT PRIMARY KEY,
      case_no TEXT UNIQUE NOT NULL,
      pond_id TEXT NOT NULL,
      reporter_id TEXT NOT NULL,
      report_date TEXT NOT NULL,
      disease_name TEXT NOT NULL,
      disease_description TEXT NOT NULL,
      severity TEXT NOT NULL CHECK (severity IN ('MILD', 'MODERATE', 'SEVERE')),
      suggested_medication TEXT,
      status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT',
        'SUBMITTED',
        'REJECTED',
        'MEDICINE_ALLOCATED',
        'APPROVED',
        'MEDICATED',
        'CLOSED'
      )),
      current_handler_role TEXT NOT NULL DEFAULT 'TECHNICIAN',
      reject_reason TEXT,
      rejected_by TEXT,
      rejected_at TEXT,
      medicine_allocated_by TEXT,
      medicine_allocated_at TEXT,
      approved_by TEXT,
      approved_at TEXT,
      medicated_by TEXT,
      medicated_at TEXT,
      closed_by TEXT,
      closed_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pond_id) REFERENCES ponds(id),
      FOREIGN KEY (reporter_id) REFERENCES users(id),
      FOREIGN KEY (rejected_by) REFERENCES users(id),
      FOREIGN KEY (medicine_allocated_by) REFERENCES users(id),
      FOREIGN KEY (approved_by) REFERENCES users(id),
      FOREIGN KEY (medicated_by) REFERENCES users(id),
      FOREIGN KEY (closed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS disease_case_medicines (
      id TEXT PRIMARY KEY,
      disease_case_id TEXT NOT NULL,
      medicine_id TEXT NOT NULL,
      suggested_quantity REAL NOT NULL,
      actual_quantity REAL,
      dosage TEXT,
      usage_method TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (disease_case_id) REFERENCES disease_cases(id) ON DELETE CASCADE,
      FOREIGN KEY (medicine_id) REFERENCES medicines(id)
    );

    CREATE TABLE IF NOT EXISTS disease_case_audits (
      id TEXT PRIMARY KEY,
      disease_case_id TEXT NOT NULL,
      operator_id TEXT NOT NULL,
      operator_role TEXT NOT NULL,
      action TEXT NOT NULL,
      remark TEXT,
      old_status TEXT,
      new_status TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (disease_case_id) REFERENCES disease_cases(id) ON DELETE CASCADE,
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS medication_records (
      id TEXT PRIMARY KEY,
      disease_case_id TEXT NOT NULL,
      pond_id TEXT NOT NULL,
      medicine_id TEXT NOT NULL,
      quantity REAL NOT NULL,
      operator_id TEXT NOT NULL,
      medication_date TEXT NOT NULL,
      usage_method TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (disease_case_id) REFERENCES disease_cases(id),
      FOREIGN KEY (pond_id) REFERENCES ponds(id),
      FOREIGN KEY (medicine_id) REFERENCES medicines(id),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS idempotency_keys (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      request_path TEXT NOT NULL,
      response_body TEXT,
      response_status INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_disease_cases_pond ON disease_cases(pond_id);
    CREATE INDEX IF NOT EXISTS idx_disease_cases_status ON disease_cases(status);
    CREATE INDEX IF NOT EXISTS idx_disease_cases_handler ON disease_cases(current_handler_role);
    CREATE INDEX IF NOT EXISTS idx_medication_records_pond ON medication_records(pond_id);
    CREATE INDEX IF NOT EXISTS idx_medication_records_medicine ON medication_records(medicine_id);
    CREATE INDEX IF NOT EXISTS idx_disease_case_audits_case ON disease_case_audits(disease_case_id);
  `);
}
