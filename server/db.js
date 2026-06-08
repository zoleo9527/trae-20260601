const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const dayjs = require('dayjs');

const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(__dirname, 'data.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT CHECK(role IN ('admin', 'manager', 'network', 'ops')),
    displayName TEXT
  );

  CREATE TABLE IF NOT EXISTS patrols (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patrolDate TEXT,
    area TEXT,
    submitter TEXT,
    submitTime TEXT,
    status TEXT CHECK(status IN ('pending', 'confirmed', 'has_exception')),
    confirmer TEXT,
    confirmTime TEXT,
    notes TEXT,
    createdAt TEXT,
    updatedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS exceptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patrolId INTEGER NULL,
    title TEXT,
    exceptionType TEXT CHECK(exceptionType IN ('equipment', 'customer', 'tournament', 'safety', 'other')),
    description TEXT,
    severity TEXT CHECK(severity IN ('low', 'medium', 'high')),
    submitter TEXT,
    submitTime TEXT,
    handler TEXT,
    handleTime TEXT,
    handleNote TEXT,
    confirmer TEXT,
    confirmTime TEXT,
    status TEXT CHECK(status IN ('pending', 'handling', 'resolved', 'confirmed')),
    attachments TEXT DEFAULT '[]',
    createdAt TEXT,
    updatedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS handovers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shiftDate TEXT,
    fromRole TEXT,
    fromUser TEXT,
    toRole TEXT,
    toUser TEXT,
    pendingPatrolCount INTEGER,
    pendingExceptionCount INTEGER,
    notes TEXT,
    status TEXT CHECK(status IN ('pending', 'accepted')),
    submitTime TEXT,
    acceptTime TEXT,
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS status_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recordType TEXT CHECK(recordType IN ('patrol', 'exception', 'handover')),
    recordId INTEGER,
    fromStatus TEXT,
    toStatus TEXT,
    operator TEXT,
    operateTime TEXT,
    note TEXT
  );
`);

const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

const insertUser = db.prepare('INSERT OR IGNORE INTO users (id, username, password, role, displayName) VALUES (?, ?, ?, ?, ?)');
insertUser.run(1, 'admin', 'admin123', 'admin', '店长-管理员');
insertUser.run(2, 'manager1', '123456', 'manager', '张店长');
insertUser.run(3, 'network1', '123456', 'network', '李网管');
insertUser.run(4, 'ops1', '123456', 'ops', '王运营');

module.exports = db;
