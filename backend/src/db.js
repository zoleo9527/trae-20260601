const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { AppError } = require('./errors');

const DB_PATH = path.join(__dirname, '..', 'data', 'driving-school.db');
let db;

function initDB() {
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  createTables();
  return db;
}

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admission_consultant', 'coach', 'exam_specialist', 'admin')),
      phone TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      id_card TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      gender TEXT CHECK(gender IN ('male', 'female')),
      license_type TEXT NOT NULL DEFAULT 'C1' CHECK(license_type IN ('C1', 'C2', 'C3', 'C4', 'D', 'E', 'F')),
      enroll_date TEXT NOT NULL,
      coach_id TEXT,
      current_subject INTEGER NOT NULL DEFAULT 1 CHECK(current_subject IN (1, 2, 3, 4)),
      status TEXT NOT NULL DEFAULT 'studying' CHECK(status IN ('studying', 'suspended', 'completed', 'dropped')),
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (coach_id) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS coaches (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      license_no TEXT NOT NULL,
      subjects TEXT NOT NULL,
      car_model TEXT,
      car_plate TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'on_leave')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS coach_schedules (
      id TEXT PRIMARY KEY,
      coach_id TEXT NOT NULL,
      schedule_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'practice' CHECK(type IN ('practice', 'exam_accompany')),
      student_id TEXT,
      status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'booked', 'completed', 'cancelled')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id),
      UNIQUE(coach_id, schedule_date, start_time, end_time)
    );

    CREATE TABLE IF NOT EXISTS exam_sessions (
      id TEXT PRIMARY KEY,
      subject INTEGER NOT NULL CHECK(subject IN (1, 2, 3, 4)),
      exam_date TEXT NOT NULL,
      exam_time TEXT NOT NULL,
      exam_location TEXT NOT NULL,
      total_quota INTEGER NOT NULL DEFAULT 50,
      booked_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'full', 'closed', 'completed', 'cancelled')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS exam_bookings (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      subject INTEGER NOT NULL CHECK(subject IN (1, 2, 3, 4)),
      exam_session_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN (
        'pending', 'approved', 'rejected', 'booked', 'cancelled',
        'attended', 'passed', 'failed', 'no_show'
      )),
      is_makeup INTEGER NOT NULL DEFAULT 0,
      original_booking_id TEXT,
      apply_time TEXT NOT NULL DEFAULT (datetime('now')),
      approve_time TEXT,
      approve_by TEXT,
      reject_reason TEXT,
      cancel_reason TEXT,
      cancel_time TEXT,
      exam_result TEXT,
      exam_score INTEGER,
      result_time TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (exam_session_id) REFERENCES exam_sessions(id),
      FOREIGN KEY (original_booking_id) REFERENCES exam_bookings(id),
      FOREIGN KEY (approve_by) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS makeup_exams (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      failed_booking_id TEXT NOT NULL,
      subject INTEGER NOT NULL CHECK(subject IN (1, 2, 3, 4)),
      failed_date TEXT NOT NULL,
      fail_reason TEXT,
      makeup_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
      fee_paid INTEGER NOT NULL DEFAULT 0,
      fee_paid_time TEXT,
      status TEXT NOT NULL DEFAULT 'pending_payment' CHECK(status IN (
        'pending_payment', 'pending_booking', 'booked', 'completed', 'cancelled'
      )),
      new_booking_id TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (failed_booking_id) REFERENCES exam_bookings(id) ON DELETE CASCADE,
      FOREIGN KEY (new_booking_id) REFERENCES exam_bookings(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS fee_records (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('tuition', 'makeup_fee', 'other')),
      amount DECIMAL(10,2) NOT NULL,
      paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'unpaid' CHECK(status IN ('unpaid', 'partial', 'paid')),
      related_id TEXT,
      remark TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id TEXT PRIMARY KEY,
      operator_id TEXT NOT NULL,
      operator_name TEXT NOT NULL,
      operator_role TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      from_status TEXT,
      to_status TEXT,
      detail TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_role TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
      related_id TEXT,
      related_type TEXT,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_student_status ON students(status);
    CREATE INDEX IF NOT EXISTS idx_student_coach ON students(coach_id);
    CREATE INDEX IF NOT EXISTS idx_student_subject ON students(current_subject);
    CREATE INDEX IF NOT EXISTS idx_schedule_coach_date ON coach_schedules(coach_id, schedule_date);
    CREATE INDEX IF NOT EXISTS idx_schedule_student ON coach_schedules(student_id);
    CREATE INDEX IF NOT EXISTS idx_exam_session_date ON exam_sessions(exam_date);
    CREATE INDEX IF NOT EXISTS idx_exam_session_status ON exam_sessions(status);
    CREATE INDEX IF NOT EXISTS idx_booking_student ON exam_bookings(student_id);
    CREATE INDEX IF NOT EXISTS idx_booking_status ON exam_bookings(status);
    CREATE INDEX IF NOT EXISTS idx_booking_session ON exam_bookings(exam_session_id);
    CREATE INDEX IF NOT EXISTS idx_makeup_student ON makeup_exams(student_id);
    CREATE INDEX IF NOT EXISTS idx_makeup_status ON makeup_exams(status);
    CREATE INDEX IF NOT EXISTS idx_fee_student ON fee_records(student_id);
    CREATE INDEX IF NOT EXISTS idx_fee_status ON fee_records(status);
    CREATE INDEX IF NOT EXISTS idx_log_target ON operation_logs(target_type, target_id);
    CREATE INDEX IF NOT EXISTS idx_log_operator ON operation_logs(operator_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
  `);
}

function getDB() {
  if (!db) initDB();
  return db;
}

function tx(fn) {
  if (!db) initDB();
  const run = db.transaction(fn);
  return run();
}

function newId() {
  return uuidv4().replace(/-/g, '').slice(0, 24);
}

function assertFound(entity, errorKey) {
  if (!entity) throw new AppError(errorKey);
  return entity;
}

function logOperation(opts) {
  const dbi = getDB();
  const { operatorId, operatorName, operatorRole, action, targetType, targetId, fromStatus, toStatus, detail } = opts;
  const stmt = dbi.prepare(`
    INSERT INTO operation_logs
    (id, operator_id, operator_name, operator_role, action, target_type, target_id, from_status, to_status, detail)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(newId(), operatorId, operatorName, operatorRole, action, targetType, targetId, fromStatus, toStatus, detail);
}

function createNotification(opts) {
  const dbi = getDB();
  const { userId, userRole, title, content, type, priority, relatedId, relatedType } = opts;
  const stmt = dbi.prepare(`
    INSERT INTO notifications
    (id, user_id, user_role, title, content, type, priority, related_id, related_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(newId(), userId, userRole, title, content, type, priority || 'normal', relatedId, relatedType);
}

module.exports = {
  initDB,
  getDB,
  tx,
  newId,
  assertFound,
  logOperation,
  createNotification,
};
