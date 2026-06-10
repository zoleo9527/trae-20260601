import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'farm.db');

let db;

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initDb() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('feeder','sorter','manager')),
      phone TEXT
    );

    CREATE TABLE IF NOT EXISTS houses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      current_count INTEGER NOT NULL,
      breed TEXT,
      age_weeks INTEGER,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive','maintenance'))
    );

    CREATE TABLE IF NOT EXISTS inspection_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      house_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      shift TEXT NOT NULL CHECK(shift IN ('morning','afternoon','night')),
      feeder_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','in_progress','pending_confirm','completed','abnormal')),
      temperature REAL,
      humidity REAL,
      ventilation TEXT CHECK(ventilation IN ('normal','poor','off')),
      water_system TEXT CHECK(water_system IN ('normal','leak','blocked','off')),
      feed_system TEXT CHECK(feed_system IN ('normal','jam','low','off')),
      manure_system TEXT CHECK(manure_system IN ('normal','clogged','overflow')),
      dead_count INTEGER DEFAULT 0,
      sick_count INTEGER DEFAULT 0,
      notes TEXT,
      started_at TEXT,
      completed_at TEXT,
      confirmed_at TEXT,
      confirmer_id INTEGER,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (house_id) REFERENCES houses(id),
      FOREIGN KEY (feeder_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS egg_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      house_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      shift TEXT NOT NULL CHECK(shift IN ('morning','afternoon','night')),
      inspection_card_id INTEGER,
      sorter_id INTEGER NOT NULL,
      total_count INTEGER DEFAULT 0,
      grade_a INTEGER DEFAULT 0,
      grade_b INTEGER DEFAULT 0,
      grade_c INTEGER DEFAULT 0,
      cracked INTEGER DEFAULT 0,
      dirty INTEGER DEFAULT 0,
      soft_shell INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','recorded','confirmed','abnormal')),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (house_id) REFERENCES houses(id),
      FOREIGN KEY (inspection_card_id) REFERENCES inspection_cards(id),
      FOREIGN KEY (sorter_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS exceptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_type TEXT NOT NULL CHECK(source_type IN ('inspection','egg_record','system')),
      source_id INTEGER,
      house_id INTEGER NOT NULL,
      severity TEXT NOT NULL DEFAULT 'warning' CHECK(severity IN ('info','warning','urgent','critical')),
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      handler_id INTEGER,
      handler_role TEXT CHECK(handler_role IN ('feeder','sorter','manager')),
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','assigned','handling','resolved','closed')),
      resolution TEXT,
      resolved_at TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (house_id) REFERENCES houses(id),
      FOREIGN KEY (handler_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS exception_timeline (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exception_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      content TEXT,
      operator_id INTEGER,
      operator_name TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (exception_id) REFERENCES exceptions(id),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_type TEXT NOT NULL CHECK(target_type IN ('inspection','egg_record','exception')),
      target_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      size INTEGER,
      mime_type TEXT,
      uploaded_by INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      link TEXT,
      read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  return db;
}

export function backfillExceptionSourceIds() {
  const db = getDb();

  const exceptions = db.prepare(`
    SELECT * FROM exceptions
    WHERE source_type = 'egg_record'
  `).all();

  if (exceptions.length === 0) {
    return { fixedNull: 0, corrected: 0, total: 0 };
  }

  let fixedNull = 0;
  let corrected = 0;

  const updateStmt = db.prepare('UPDATE exceptions SET source_id = ?, updated_at = datetime(\'now\',\'localtime\') WHERE id = ?');

  const priority = { abnormal: 0, pending: 1, recorded: 2, confirmed: 3 };

  for (const exc of exceptions) {
    let shift = null;
    if (/下午|afternoon/i.test(exc.description)) shift = 'afternoon';
    else if (/上午|早上|morning/i.test(exc.description)) shift = 'morning';
    else if (/晚上|夜间|夜班|night/i.test(exc.description)) shift = 'night';

    const createdDate = exc.created_at ? exc.created_at.slice(0, 10) : null;
    if (!createdDate || !shift) continue;

    const candidates = db.prepare(`
      SELECT * FROM egg_records
      WHERE house_id = ? AND date = date(?, '-1 day') AND shift = ?
      ORDER BY status
      LIMIT 5
    `).all(exc.house_id, createdDate, shift);

    let match = null;
    if (candidates.length > 0) {
      candidates.sort((a, b) => (priority[a.status] ?? 9) - (priority[b.status] ?? 9));
      match = candidates[0];
    }

    if (!match) continue;

    if (exc.source_id === null) {
      const info = updateStmt.run(match.id, exc.id);
      if (info.changes > 0) fixedNull++;
    } else if (exc.source_id !== match.id) {
      const info = updateStmt.run(match.id, exc.id);
      if (info.changes > 0) corrected++;
    }
  }

  return { fixedNull, corrected, total: exceptions.length };
}
