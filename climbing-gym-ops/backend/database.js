const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'climbing_gym.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(''
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      level TEXT DEFAULT '新手',
      join_date TEXT NOT NULL,
      current_level_date TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  '');
}

initDatabase();

module.exports = db;