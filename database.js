const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'translation.db');

async function initDatabase() {
  const SQL = await initSqlJs();
  
  let db;
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS manuscripts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_name TEXT NOT NULL,
      client_name TEXT NOT NULL,
      source_language TEXT NOT NULL,
      target_language TEXT NOT NULL,
      word_count INTEGER NOT NULL,
      deadline TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      manuscript_id INTEGER NOT NULL,
      version_number TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT,
      translator_id INTEGER NOT NULL,
      translator_name TEXT NOT NULL,
      upload_time TEXT DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      is_final INTEGER DEFAULT 0,
      review_status TEXT DEFAULT 'pending',
      FOREIGN KEY (manuscript_id) REFERENCES manuscripts(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS review_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version_id INTEGER NOT NULL,
      reviewer_id INTEGER NOT NULL,
      reviewer_name TEXT NOT NULL,
      comment_type TEXT NOT NULL,
      position TEXT,
      original_text TEXT,
      suggested_text TEXT,
      comment_text TEXT NOT NULL,
      severity TEXT DEFAULT 'normal',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (version_id) REFERENCES versions(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS rework_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version_id INTEGER NOT NULL,
      rework_version_id INTEGER,
      reviewer_id INTEGER NOT NULL,
      reviewer_name TEXT NOT NULL,
      rework_reason TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT,
      FOREIGN KEY (version_id) REFERENCES versions(id),
      FOREIGN KEY (rework_version_id) REFERENCES versions(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS delivery_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      manuscript_id INTEGER NOT NULL,
      version_id INTEGER NOT NULL,
      client_name TEXT NOT NULL,
      delivery_time TEXT DEFAULT CURRENT_TIMESTAMP,
      delivery_method TEXT,
      recipient TEXT,
      notes TEXT,
      client_feedback TEXT,
      feedback_time TEXT,
      FOREIGN KEY (manuscript_id) REFERENCES manuscripts(id),
      FOREIGN KEY (version_id) REFERENCES versions(id)
    )
  `);

  saveDatabase(db);

  return db;
}

function saveDatabase(db) {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

function prepareResult(result) {
  if (!result || result.length === 0) return [];
  
  const { columns, values } = result[0];
  
  if (!values || values.length === 0) return [];
  
  return values.map(row => {
    const obj = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
}

function prepareOne(result) {
  const rows = prepareResult(result);
  return rows.length > 0 ? rows[0] : null;
}

function getLastInsertId(db) {
  const result = db.exec('SELECT last_insert_rowid() as id');
  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }
  return result[0].values[0][0];
}

module.exports = {
  initDatabase,
  saveDatabase,
  prepareResult,
  prepareOne,
  getLastInsertId
};