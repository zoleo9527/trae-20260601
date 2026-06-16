import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../../data/bar_operations.db');
export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('reservation_staff', 'bar_staff', 'manager')),
      phone TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      table_number TEXT NOT NULL,
      reservation_date TEXT NOT NULL,
      reservation_time TEXT NOT NULL,
      party_size INTEGER NOT NULL CHECK(party_size > 0),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'returned')),
      minimum_consumption_amount REAL,
      minimum_consumption_status TEXT,
      reservation_staff_id TEXT NOT NULL,
      manager_id TEXT,
      notes TEXT,
      internal_notes TEXT,
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (reservation_staff_id) REFERENCES staff(id),
      FOREIGN KEY (manager_id) REFERENCES staff(id)
    );

    CREATE TABLE IF NOT EXISTS beverage_storage (
      id TEXT PRIMARY KEY,
      reservation_id TEXT NOT NULL,
      beverage_name TEXT NOT NULL,
      quantity REAL NOT NULL CHECK(quantity > 0),
      storage_date TEXT NOT NULL,
      retrieve_date TEXT,
      status TEXT NOT NULL DEFAULT 'stored' CHECK(status IN ('stored', 'retrieved', 'expired', 'unclear')),
      notes TEXT,
      bar_staff_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (reservation_id) REFERENCES reservations(id),
      FOREIGN KEY (bar_staff_id) REFERENCES staff(id)
    );

    CREATE TABLE IF NOT EXISTS singer_schedules (
      id TEXT PRIMARY KEY,
      singer_name TEXT NOT NULL,
      performance_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'confirmed', 'rescheduled', 'cancelled')),
      original_date TEXT,
      notes TEXT,
      manager_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (manager_id) REFERENCES staff(id)
    );

    CREATE TABLE IF NOT EXISTS status_history (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL CHECK(entity_type IN ('reservation', 'minimum_consumption', 'beverage_storage', 'singer_schedule')),
      entity_id TEXT NOT NULL,
      previous_status TEXT,
      new_status TEXT NOT NULL,
      changed_by TEXT NOT NULL,
      changed_by_role TEXT NOT NULL,
      change_reason TEXT,
      notes TEXT,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS todo_items (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL CHECK(entity_type IN ('reservation', 'minimum_consumption', 'beverage_storage', 'singer_schedule')),
      entity_id TEXT NOT NULL,
      assignee_role TEXT NOT NULL,
      assignee_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')),
      due_date TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS issue_detections (
      id TEXT PRIMARY KEY,
      reservation_id TEXT NOT NULL,
      issue_type TEXT NOT NULL CHECK(issue_type IN ('duplicate_reservation', 'beverage_unclear', 'schedule_conflict', 'minimum_consumption_pending', 'notes_incomplete')),
      severity TEXT DEFAULT 'warning' CHECK(severity IN ('warning', 'error', 'critical')),
      description TEXT NOT NULL,
      related_entity_id TEXT,
      resolved INTEGER DEFAULT 0,
      resolved_at TEXT,
      resolved_by TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (reservation_id) REFERENCES reservations(id)
    );

    CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date);
    CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
    CREATE INDEX IF NOT EXISTS idx_reservations_table ON reservations(table_number);
    CREATE INDEX IF NOT EXISTS idx_beverage_reservation ON beverage_storage(reservation_id);
    CREATE INDEX IF NOT EXISTS idx_status_history_entity ON status_history(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_todo_assignee ON todo_items(assignee_role, status);
    CREATE INDEX IF NOT EXISTS idx_issues_reservation ON issue_detections(reservation_id, resolved);
  `);

  console.log('Database initialized successfully');
}
