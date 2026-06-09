import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', '..', 'data', 'store.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('owner', 'technician', 'warehouse')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      credit_limit REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pesticides (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('常规', '限用', '禁用')),
      unit TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      pesticide_id TEXT NOT NULL REFERENCES pesticides(id),
      quantity REAL NOT NULL DEFAULT 0,
      warning_threshold REAL DEFAULT 10,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL REFERENCES customers(id),
      created_by TEXT NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_confirmation', 'confirmed', 'pending_warehouse', 'completed', 'rejected', 'cancelled', 'stock_insufficient')),
      total_amount REAL NOT NULL DEFAULT 0,
      is_credit INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sales_items (
      id TEXT PRIMARY KEY,
      sales_id TEXT NOT NULL REFERENCES sales(id),
      pesticide_id TEXT NOT NULL REFERENCES pesticides(id),
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      subtotal REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS confirmations (
      id TEXT PRIMARY KEY,
      sales_id TEXT NOT NULL REFERENCES sales(id),
      confirmed_by TEXT NOT NULL REFERENCES users(id),
      result TEXT NOT NULL CHECK (result IN ('available', 'caution', 'prohibited')),
      reminder TEXT,
      comments TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS warehouse_confirms (
      id TEXT PRIMARY KEY,
      sales_id TEXT NOT NULL REFERENCES sales(id),
      confirmed_by TEXT NOT NULL REFERENCES users(id),
      status TEXT NOT NULL CHECK (status IN ('confirmed', 'partial', 'insufficient')),
      actual_quantity REAL,
      comments TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS credits (
      id TEXT PRIMARY KEY,
      sales_id TEXT NOT NULL REFERENCES sales(id),
      customer_id TEXT NOT NULL REFERENCES customers(id),
      amount REAL NOT NULL,
      repaid_amount REAL DEFAULT 0,
      due_date DATE NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'repaid', 'overdue')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      operator_id TEXT NOT NULL REFERENCES users(id),
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 插入初始数据
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    const insertUser = db.prepare('INSERT INTO users (id, name, role) VALUES (?, ?, ?)');
    insertUser.run('user-1', '张三（老板）', 'owner');
    insertUser.run('user-2', '李四（农技员）', 'technician');
    insertUser.run('user-3', '王五（仓管）', 'warehouse');

    const insertPesticide = db.prepare('INSERT INTO pesticides (id, name, type, unit, description) VALUES (?, ?, ?, ?, ?)');
    insertPesticide.run('pest-1', '草甘膦', '常规', '升', '非选择性除草剂');
    insertPesticide.run('pest-2', '百菌清', '常规', '公斤', '保护性杀菌剂');
    insertPesticide.run('pest-3', '毒死蜱', '限用', '升', '有机磷类杀虫剂');
    insertPesticide.run('pest-4', 'DDT', '禁用', '公斤', '有机氯类杀虫剂（已禁用）');

    const insertInventory = db.prepare('INSERT INTO inventory (id, pesticide_id, quantity, warning_threshold) VALUES (?, ?, ?, ?)');
    insertInventory.run('inv-1', 'pest-1', 100, 20);
    insertInventory.run('inv-2', 'pest-2', 50, 15);
    insertInventory.run('inv-3', 'pest-3', 30, 10);
    insertInventory.run('inv-4', 'pest-4', 0, 5);

    const insertCustomer = db.prepare('INSERT INTO customers (id, name, phone, address) VALUES (?, ?, ?, ?)');
    insertCustomer.run('cust-1', '刘农户', '13800138001', '平安镇丰收村');
    insertCustomer.run('cust-2', '赵农场', '13800138002', '光明乡农业园区');
  }
}

export default db;
