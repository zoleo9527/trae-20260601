import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'central-kitchen.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      address TEXT,
      contact TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS dishes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      allergens TEXT,
      unit TEXT NOT NULL DEFAULT '份',
      specification TEXT,
      production_time INTEGER DEFAULT 30,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS daily_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_date DATE NOT NULL,
      store_id INTEGER NOT NULL,
      dish_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      is_urgent BOOLEAN DEFAULT 0,
      allergens_confirmation TEXT,
      special_instructions TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id),
      FOREIGN KEY (dish_id) REFERENCES dishes(id),
      UNIQUE(order_date, store_id, dish_id, is_urgent)
    );

    CREATE TABLE IF NOT EXISTS production_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_date DATE NOT NULL,
      dish_id INTEGER NOT NULL,
      total_quantity INTEGER NOT NULL,
      start_time DATETIME,
      end_time DATETIME,
      status TEXT NOT NULL DEFAULT 'scheduled',
      assigned_to TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dish_id) REFERENCES dishes(id),
      UNIQUE(schedule_date, dish_id)
    );

    CREATE TABLE IF NOT EXISTS production_batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_id INTEGER NOT NULL,
      batch_number TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      started_at DATETIME,
      completed_at DATETIME,
      operator TEXT,
      FOREIGN KEY (schedule_id) REFERENCES production_schedules(id)
    );

    CREATE TABLE IF NOT EXISTS deliveries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      delivery_date DATE NOT NULL,
      store_id INTEGER NOT NULL,
      order_id INTEGER NOT NULL,
      dish_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      dispatched_at DATETIME,
      received_at DATETIME,
      received_by TEXT,
      receiver_signature TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id),
      FOREIGN KEY (order_id) REFERENCES daily_orders(id),
      FOREIGN KEY (dish_id) REFERENCES dishes(id)
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation_type TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      old_value TEXT,
      new_value TEXT,
      operator TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_daily_orders_date ON daily_orders(order_date);
    CREATE INDEX IF NOT EXISTS idx_daily_orders_store ON daily_orders(store_id);
    CREATE INDEX IF NOT EXISTS idx_production_schedules_date ON production_schedules(schedule_date);
    CREATE INDEX IF NOT EXISTS idx_operation_logs_entity ON operation_logs(entity_type, entity_id);
  `);
}

export default db;
