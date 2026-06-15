import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'data', 'app.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales_orders (
      id TEXT PRIMARY KEY,
      order_no TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT,
      address TEXT,
      total_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'delivered',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      delivered_at TEXT
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      product_code TEXT,
      quantity INTEGER NOT NULL,
      unit_price REAL,
      unit TEXT,
      warehouse_location TEXT,
      FOREIGN KEY (order_id) REFERENCES sales_orders(id)
    );

    CREATE TABLE IF NOT EXISTS warehouse_locations (
      id TEXT PRIMARY KEY,
      location_code TEXT UNIQUE NOT NULL,
      location_name TEXT NOT NULL,
      area TEXT,
      capacity INTEGER,
      status TEXT DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS delivery_receipts (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      receipt_no TEXT UNIQUE NOT NULL,
      driver_name TEXT,
      driver_phone TEXT,
      vehicle_no TEXT,
      delivery_date TEXT,
      status TEXT DEFAULT 'delivered',
      signer_name TEXT,
      sign_time TEXT,
      remarks TEXT,
      FOREIGN KEY (order_id) REFERENCES sales_orders(id)
    );

    CREATE TABLE IF NOT EXISTS return_exchange_requests (
      id TEXT PRIMARY KEY,
      request_no TEXT UNIQUE NOT NULL,
      order_id TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      reason TEXT,
      reason_category TEXT,
      applicant TEXT NOT NULL,
      applicant_role TEXT NOT NULL,
      warehouse_confirmer TEXT,
      warehouse_confirm_time TEXT,
      reissue_handler TEXT,
      reissue_handle_time TEXT,
      completer TEXT,
      complete_time TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      remarks TEXT,
      FOREIGN KEY (order_id) REFERENCES sales_orders(id)
    );

    CREATE TABLE IF NOT EXISTS return_items (
      id TEXT PRIMARY KEY,
      request_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      product_code TEXT,
      quantity INTEGER NOT NULL,
      unit TEXT,
      warehouse_location TEXT,
      actual_quantity INTEGER,
      inspection_result TEXT,
      inspection_remark TEXT,
      FOREIGN KEY (request_id) REFERENCES return_exchange_requests(id)
    );

    CREATE TABLE IF NOT EXISTS reissue_tracking (
      id TEXT PRIMARY KEY,
      request_id TEXT NOT NULL,
      tracking_no TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      handler TEXT,
      handler_role TEXT,
      warehouse_location TEXT,
      driver_name TEXT,
      vehicle_no TEXT,
      estimated_delivery_date TEXT,
      actual_delivery_date TEXT,
      signer_name TEXT,
      sign_time TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      remarks TEXT,
      FOREIGN KEY (request_id) REFERENCES return_exchange_requests(id)
    );

    CREATE TABLE IF NOT EXISTS reissue_items (
      id TEXT PRIMARY KEY,
      reissue_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      product_code TEXT,
      quantity INTEGER NOT NULL,
      unit TEXT,
      warehouse_location TEXT,
      FOREIGN KEY (reissue_id) REFERENCES reissue_tracking(id)
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id TEXT PRIMARY KEY,
      request_id TEXT,
      reissue_id TEXT,
      action TEXT NOT NULL,
      operator TEXT NOT NULL,
      operator_role TEXT NOT NULL,
      detail TEXT,
      old_status TEXT,
      new_status TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      request_id TEXT,
      reissue_id TEXT,
      file_name TEXT NOT NULL,
      file_type TEXT,
      file_size INTEGER,
      file_path TEXT,
      placeholder BOOLEAN DEFAULT 0,
      uploaded_by TEXT,
      uploaded_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `);

  console.log('Database initialized');
  return db;
}

export default db;
