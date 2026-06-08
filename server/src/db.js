import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, '..', 'data', 'hotel.db')

let _db = null

export function getDb() {
  if (_db) return _db
  _db = new Database(DB_PATH)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')
  return _db
}

export function initDb() {
  const db = getDb()

  db.exec(`
    CREATE TABLE IF NOT EXISTS lost_items (
      id              TEXT PRIMARY KEY,
      room_number     TEXT NOT NULL,
      item_name       TEXT NOT NULL,
      item_description TEXT DEFAULT '',
      category        TEXT NOT NULL DEFAULT '普通物品',
      found_by        TEXT NOT NULL,
      found_by_role   TEXT NOT NULL DEFAULT 'cleaner',
      found_at        TEXT NOT NULL,
      location_detail TEXT DEFAULT '',
      storage_location TEXT DEFAULT '客房中心',
      status          TEXT NOT NULL DEFAULT 'registered',

      claimant_name    TEXT,
      claimant_id_type TEXT,
      claimant_id_number TEXT,
      contact_phone    TEXT,
      claim_at         TEXT,
      verified_by      TEXT,

      return_reason    TEXT,
      supplementary_notes TEXT,
      handled_by       TEXT,
      handled_at       TEXT,

      exception_type   TEXT,
      exception_note   TEXT,

      created_at       TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS staff (
      id       TEXT PRIMARY KEY,
      name     TEXT NOT NULL,
      role     TEXT NOT NULL,
      password TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_items_status ON lost_items(status);
    CREATE INDEX IF NOT EXISTS idx_items_found_by_role ON lost_items(found_by_role);
    CREATE INDEX IF NOT EXISTS idx_items_room ON lost_items(room_number);
  `)

  return db
}
