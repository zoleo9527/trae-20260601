const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec("CREATE TABLE IF NOT EXISTS batches (id TEXT PRIMARY KEY, batch_number TEXT NOT NULL UNIQUE, supplier TEXT NOT NULL, product_type TEXT NOT NULL, quantity INTEGER NOT NULL, unit TEXT NOT NULL DEFAULT 'kg', temperature REAL, weight REAL, specification TEXT, status TEXT NOT NULL DEFAULT 'pending', remark TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')), updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')));");
  db.exec("CREATE TABLE IF NOT EXISTS inspections (id TEXT PRIMARY KEY, batch_id TEXT NOT NULL, inspector TEXT NOT NULL, temperature REAL, weight REAL, appearance TEXT, packaging TEXT, result TEXT NOT NULL, issues TEXT, remark TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')), FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE);");
  db.exec("CREATE TABLE IF NOT EXISTS cutting_tasks (id TEXT PRIMARY KEY, batch_id TEXT NOT NULL, task_number TEXT NOT NULL UNIQUE, target_specification TEXT NOT NULL, target_quantity INTEGER NOT NULL, assignee TEXT, status TEXT NOT NULL DEFAULT 'pending', remark TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')), updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')), FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE);");
  db.exec("CREATE TABLE IF NOT EXISTS releases (id TEXT PRIMARY KEY, batch_id TEXT NOT NULL, released_by TEXT NOT NULL, quantity INTEGER NOT NULL, destination TEXT, remark TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')), FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE);");
  db.exec("CREATE TABLE IF NOT EXISTS rejections (id TEXT PRIMARY KEY, batch_id TEXT NOT NULL, rejected_by TEXT NOT NULL, reason TEXT NOT NULL, quantity INTEGER NOT NULL, handling TEXT, remark TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')), FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE);");
}

module.exports = { db, initDatabase };
