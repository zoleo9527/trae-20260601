const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { AppError } = require('./errors');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'exam-center.db');
let db;

function initDB() {
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
      role TEXT NOT NULL CHECK(role IN ('admin_staff', 'invigilator', 'tech_support')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS exam_rooms (
      id TEXT PRIMARY KEY,
      room_code TEXT UNIQUE NOT NULL,
      building TEXT NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 30,
      exam_time TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS invigilator_assignments (
      id TEXT PRIMARY KEY,
      exam_room_id TEXT NOT NULL,
      invigilator_id TEXT NOT NULL,
      assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (exam_room_id) REFERENCES exam_rooms(id),
      FOREIGN KEY (invigilator_id) REFERENCES users(id),
      UNIQUE(exam_room_id, invigilator_id)
    );

    CREATE TABLE IF NOT EXISTS registrations (
      id TEXT PRIMARY KEY,
      candidate_name TEXT NOT NULL,
      id_card TEXT NOT NULL,
      exam_type TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'pending_review')),
      auditor_id TEXT,
      audit_time TEXT,
      reject_reason TEXT,
      supplement_remark TEXT,
      supplement_time TEXT,
      supplement_by TEXT,
      handler_id TEXT,
      assigned_invigilator_id TEXT,
      reopen_by TEXT,
      reopen_time TEXT,
      submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (auditor_id) REFERENCES users(id),
      FOREIGN KEY (supplement_by) REFERENCES users(id),
      FOREIGN KEY (handler_id) REFERENCES users(id),
      FOREIGN KEY (assigned_invigilator_id) REFERENCES users(id),
      FOREIGN KEY (reopen_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS registration_timeline (
      id TEXT PRIMARY KEY,
      registration_id TEXT NOT NULL,
      action_type TEXT NOT NULL,
      operator_id TEXT,
      operator_role TEXT,
      detail TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE,
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS admission_tickets (
      id TEXT PRIMARY KEY,
      registration_id TEXT UNIQUE NOT NULL,
      ticket_no TEXT UNIQUE NOT NULL,
      exam_room_id TEXT,
      seat_no INTEGER,
      generated_by TEXT NOT NULL,
      generated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (registration_id) REFERENCES registrations(id),
      FOREIGN KEY (exam_room_id) REFERENCES exam_rooms(id),
      FOREIGN KEY (generated_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_role TEXT NOT NULL,
      registration_id TEXT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
  migrateRegistrationsColumns();
  createIndexes();
}

const REG_COLUMNS = [
  { name: 'reject_reason', def: 'TEXT' },
  { name: 'supplement_remark', def: 'TEXT' },
  { name: 'supplement_time', def: 'TEXT' },
  { name: 'supplement_by', def: 'TEXT REFERENCES users(id)' },
  { name: 'handler_id', def: 'TEXT REFERENCES users(id)' },
  { name: 'assigned_invigilator_id', def: 'TEXT REFERENCES users(id)' },
  { name: 'reopen_by', def: 'TEXT REFERENCES users(id)' },
  { name: 'reopen_time', def: 'TEXT' },
];

function migrateRegistrationsColumns() {
  const existing = db.prepare("PRAGMA table_info(registrations)").all().map(c => c.name);
  for (const col of REG_COLUMNS) {
    if (!existing.includes(col.name)) {
      try {
        db.prepare(`ALTER TABLE registrations ADD COLUMN ${col.name} ${col.def}`).run();
      } catch (e) {
        console.warn(`[db] 跳过列 ${col.name}：${e.message}`);
      }
    }
  }
}

function createIndexes() {
  const idxStmts = [
    'CREATE INDEX IF NOT EXISTS idx_reg_status ON registrations(status)',
    'CREATE INDEX IF NOT EXISTS idx_reg_handler ON registrations(handler_id)',
    'CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read)',
    'CREATE INDEX IF NOT EXISTS idx_timeline_reg ON registration_timeline(registration_id)',
    'CREATE INDEX IF NOT EXISTS idx_invig_assign ON invigilator_assignments(invigilator_id, exam_room_id)',
  ];
  for (const sql of idxStmts) {
    try {
      db.prepare(sql).run();
    } catch (e) {
      console.warn(`[db] 跳过索引：${e.message}`);
    }
  }
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

function getRoomInvigilators(examRoomId) {
  if (!examRoomId) return [];
  const dbi = getDB();
  return dbi.prepare(`
    SELECT u.id, u.name, u.username, ia.assigned_at
    FROM invigilator_assignments ia
    JOIN users u ON ia.invigilator_id = u.id
    WHERE ia.exam_room_id = ?
    ORDER BY ia.assigned_at
  `).all(examRoomId);
}

function getInvigilatorRoomIds(userId) {
  if (!userId) return [];
  const dbi = getDB();
  return dbi.prepare('SELECT exam_room_id FROM invigilator_assignments WHERE invigilator_id = ?')
    .all(userId).map(r => r.exam_room_id);
}

module.exports = { initDB, getDB, tx, newId, assertFound, getRoomInvigilators, getInvigilatorRoomIds };
