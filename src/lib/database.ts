import Database from 'better-sqlite3';

let db: Database | null = null;

export function getDatabase(): Database {
  if (db) return db;
  
  db = new Database(process.env.DATABASE_PATH || './database.sqlite');
  db.pragma('journal_mode = WAL');
  
  return db;
}

export function initDatabase(): void {
  const database = getDatabase();
  
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('social_worker', 'volunteer_leader', 'community_officer')),
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS volunteers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      id_card TEXT UNIQUE NOT NULL,
      registered_at TEXT DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive'))
    );

    CREATE TABLE IF NOT EXISTS service_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      volunteer_id INTEGER NOT NULL,
      service_type TEXT NOT NULL,
      service_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT,
      duration INTEGER,
      status TEXT NOT NULL DEFAULT 'pending_checkin' 
        CHECK(status IN ('pending_checkin', 'checked_in', 'pending_confirm', 'confirmed', 'rejected', 'cancelled')),
      location TEXT NOT NULL,
      description TEXT,
      created_by INTEGER NOT NULL,
      confirmed_by INTEGER,
      rejected_by INTEGER,
      reject_reason TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (volunteer_id) REFERENCES volunteers(id),
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (confirmed_by) REFERENCES users(id),
      FOREIGN KEY (rejected_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS checkin_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_record_id INTEGER NOT NULL,
      checkin_time TEXT NOT NULL,
      checkin_location TEXT NOT NULL,
      checkin_by INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (service_record_id) REFERENCES service_records(id),
      FOREIGN KEY (checkin_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS confirm_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_record_id INTEGER NOT NULL,
      confirm_time TEXT NOT NULL,
      confirmed_duration INTEGER NOT NULL,
      confirmed_by INTEGER NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (service_record_id) REFERENCES service_records(id),
      FOREIGN KEY (confirmed_by) REFERENCES users(id)
    );
  `);

  const adminExists = database.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!adminExists) {
    database.prepare(
      'INSERT INTO users (username, password, role, name, phone) VALUES (?, ?, ?, ?, ?)'
    ).run('admin', '$2b$10$N9qo8uLOickgx2ZMRZoMye.IjzqAKL9xL5jvMFVdNJHvGCgTq/VEq', 'social_worker', '管理员', '13800138000');
  }

  const volunteerLeaderExists = database.prepare('SELECT id FROM users WHERE username = ?').get('leader');
  if (!volunteerLeaderExists) {
    database.prepare(
      'INSERT INTO users (username, password, role, name, phone) VALUES (?, ?, ?, ?, ?)'
    ).run('leader', '$2b$10$N9qo8uLOickgx2ZMRZoMye.IjzqAKL9xL5jvMFVdNJHvGCgTq/VEq', 'volunteer_leader', '志愿队长', '13800138001');
  }

  const officerExists = database.prepare('SELECT id FROM users WHERE username = ?').get('officer');
  if (!officerExists) {
    database.prepare(
      'INSERT INTO users (username, password, role, name, phone) VALUES (?, ?, ?, ?, ?)'
    ).run('officer', '$2b$10$N9qo8uLOickgx2ZMRZoMye.IjzqAKL9xL5jvMFVdNJHvGCgTq/VEq', 'community_officer', '社区干部', '13800138002');
  }

  const volunteerExists = database.prepare('SELECT id FROM volunteers WHERE id_card = ?').get('110101199001011234');
  if (!volunteerExists) {
    database.prepare('INSERT INTO volunteers (name, phone, id_card) VALUES (?, ?, ?)').run('张三', '13900139001', '110101199001011234');
    database.prepare('INSERT INTO volunteers (name, phone, id_card) VALUES (?, ?, ?)').run('李四', '13900139002', '110101199001011235');
    database.prepare('INSERT INTO volunteers (name, phone, id_card) VALUES (?, ?, ?)').run('王五', '13900139003', '110101199001011236');
  }
}
