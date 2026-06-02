import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '..', 'bus_system.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS routes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      direction TEXT NOT NULL DEFAULT 'morning',
      estimated_duration INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      address TEXT,
      sequence INTEGER NOT NULL,
      estimated_arrival_time TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plate_number TEXT NOT NULL UNIQUE,
      model TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      last_maintenance_date DATE
    );

    CREATE TABLE IF NOT EXISTS drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      employee_id TEXT NOT NULL UNIQUE,
      license_number TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      avatar_url TEXT
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      student_id TEXT NOT NULL UNIQUE,
      grade TEXT NOT NULL,
      class TEXT NOT NULL,
      parent_name TEXT NOT NULL,
      parent_phone TEXT NOT NULL,
      default_route_id INTEGER,
      default_stop_id INTEGER,
      avatar_url TEXT,
      FOREIGN KEY (default_route_id) REFERENCES routes(id),
      FOREIGN KEY (default_stop_id) REFERENCES stops(id)
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id INTEGER NOT NULL,
      vehicle_id INTEGER NOT NULL,
      driver_id INTEGER NOT NULL,
      schedule_date DATE NOT NULL,
      shift_type TEXT NOT NULL DEFAULT 'morning',
      status TEXT NOT NULL DEFAULT 'scheduled',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (route_id) REFERENCES routes(id),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
      FOREIGN KEY (driver_id) REFERENCES drivers(id),
      UNIQUE(route_id, vehicle_id, schedule_date, shift_type)
    );

    CREATE TABLE IF NOT EXISTS check_ins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_id INTEGER NOT NULL,
      stop_id INTEGER NOT NULL,
      driver_id INTEGER NOT NULL,
      actual_arrival_time DATETIME NOT NULL,
      estimated_arrival_time DATETIME NOT NULL,
      status TEXT NOT NULL DEFAULT 'on_time',
      delay_minutes INTEGER DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
      FOREIGN KEY (stop_id) REFERENCES stops(id),
      FOREIGN KEY (driver_id) REFERENCES drivers(id)
    );

    CREATE TABLE IF NOT EXISTS ride_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      stop_id INTEGER NOT NULL,
      check_in_id INTEGER,
      status TEXT NOT NULL DEFAULT 'pending',
      board_time DATETIME,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (stop_id) REFERENCES stops(id),
      FOREIGN KEY (check_in_id) REFERENCES check_ins(id),
      UNIQUE(schedule_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS late_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_id INTEGER NOT NULL,
      stop_id INTEGER,
      check_in_id INTEGER,
      delay_minutes INTEGER NOT NULL,
      detected_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      reason TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      reported_by TEXT,
      FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
      FOREIGN KEY (stop_id) REFERENCES stops(id),
      FOREIGN KEY (check_in_id) REFERENCES check_ins(id)
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      schedule_id INTEGER,
      complaint_type TEXT NOT NULL,
      description TEXT NOT NULL,
      parent_name TEXT NOT NULL,
      parent_phone TEXT NOT NULL,
      complaint_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL DEFAULT 'pending',
      handler_id INTEGER,
      handler_notes TEXT,
      review_result TEXT,
      reviewed_by INTEGER,
      reviewed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (schedule_id) REFERENCES schedules(id)
    );
  `);

  console.log('Database initialized successfully');
}

export default db;
