import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbDir = path.join(__dirname, '..', 'data')
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const dbPath = path.join(dbDir, 'shop.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      level TEXT DEFAULT 'normal',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      plate TEXT NOT NULL,
      brand TEXT,
      model TEXT,
      color TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS package_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      validity_days INTEGER NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS package_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      package_template_id INTEGER NOT NULL,
      service_type TEXT NOT NULL,
      count INTEGER NOT NULL,
      FOREIGN KEY (package_template_id) REFERENCES package_templates(id)
    );

    CREATE TABLE IF NOT EXISTS customer_packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      package_template_id INTEGER NOT NULL,
      total_count INTEGER NOT NULL,
      remaining_count INTEGER NOT NULL,
      purchased_at TEXT DEFAULT (datetime('now', 'localtime')),
      expires_at TEXT NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (package_template_id) REFERENCES package_templates(id)
    );

    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      vehicle_id INTEGER NOT NULL,
      employee_id INTEGER,
      status TEXT DEFAULT 'pending',
      total_amount REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      completed_at TEXT,
      is_rework INTEGER DEFAULT 0,
      original_order_id INTEGER,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      customer_package_id INTEGER,
      service_type TEXT NOT NULL,
      price REAL DEFAULT 0,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (customer_package_id) REFERENCES customer_packages(id)
    );

    CREATE TABLE IF NOT EXISTS inspections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      inspector_id INTEGER NOT NULL,
      result TEXT NOT NULL,
      reason TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (inspector_id) REFERENCES employees(id)
    );

    CREATE TABLE IF NOT EXISTS deduction_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_package_id INTEGER NOT NULL,
      order_item_id INTEGER,
      type TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 1,
      service_type TEXT,
      reason TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (customer_package_id) REFERENCES customer_packages(id),
      FOREIGN KEY (order_item_id) REFERENCES order_items(id)
    );
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_vehicles_customer ON vehicles(customer_id);
    CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate);
    CREATE INDEX IF NOT EXISTS idx_package_items_template ON package_items(package_template_id);
    CREATE INDEX IF NOT EXISTS idx_customer_packages_customer ON customer_packages(customer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_vehicle ON orders(vehicle_id);
    CREATE INDEX IF NOT EXISTS idx_orders_employee ON orders(employee_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_inspections_order ON inspections(order_id);
    CREATE INDEX IF NOT EXISTS idx_deduction_records_package ON deduction_records(customer_package_id);
    CREATE INDEX IF NOT EXISTS idx_deduction_records_type ON deduction_records(type);
  `)
}

function seed() {
  const count = db.prepare('SELECT COUNT(*) as c FROM employees').get() as { c: number }
  if (count.c > 0) return

  const today = new Date()
  const daysAgo = (n: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() - n)
    return d.toISOString().replace('T', ' ').slice(0, 19)
  }
  const todayStr = today.toISOString().replace('T', ' ').slice(0, 19)

  const insertEmployee = db.prepare(
    'INSERT INTO employees (id, name, role) VALUES (?, ?, ?)'
  )
  const insertCustomer = db.prepare(
    'INSERT INTO customers (id, name, phone, level, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  )
  const insertVehicle = db.prepare(
    'INSERT INTO vehicles (id, customer_id, plate, brand, model, color) VALUES (?, ?, ?, ?, ?, ?)'
  )
  const insertTemplate = db.prepare(
    'INSERT INTO package_templates (id, name, price, validity_days, description) VALUES (?, ?, ?, ?, ?)'
  )
  const insertPackageItem = db.prepare(
    'INSERT INTO package_items (id, package_template_id, service_type, count) VALUES (?, ?, ?, ?)'
  )
  const insertCustPkg = db.prepare(
    'INSERT INTO customer_packages (id, customer_id, package_template_id, total_count, remaining_count, purchased_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  const insertOrder = db.prepare(
    'INSERT INTO orders (id, customer_id, vehicle_id, employee_id, status, total_amount, created_at, completed_at, is_rework, original_order_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )
  const insertOrderItem = db.prepare(
    'INSERT INTO order_items (id, order_id, customer_package_id, service_type, price) VALUES (?, ?, ?, ?, ?)'
  )
  const insertInspection = db.prepare(
    'INSERT INTO inspections (id, order_id, inspector_id, result, reason, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  )
  const insertDeduction = db.prepare(
    'INSERT INTO deduction_records (id, customer_package_id, order_item_id, type, count, service_type, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  )

  const tx = db.transaction(() => {
    insertEmployee.run(1, '李师傅', 'technician')
    insertEmployee.run(2, '赵师傅', 'technician')
    insertEmployee.run(3, '孙质检', 'inspector')
    insertEmployee.run(4, '周经理', 'manager')

    insertCustomer.run(1, '张伟', '13800001111', 'normal', '老客户，多辆车', daysAgo(365))
    insertCustomer.run(2, '李娜', '13900002222', 'normal', '新客户', daysAgo(30))
    insertCustomer.run(3, '王强', '13700003333', 'vip', 'VIP客户', daysAgo(200))
    insertCustomer.run(4, '陈敏', '13600004444', 'normal', '有过投诉', daysAgo(90))

    insertVehicle.run(1, 1, '京A88888', 'BMW', 'X5', '黑')
    insertVehicle.run(2, 1, '京B66666', '奔驰', 'E300', '白')
    insertVehicle.run(3, 1, '京C12345', '大众', '帕萨特', '灰')
    insertVehicle.run(4, 2, '沪D99999', '丰田', '凯美瑞', '红')
    insertVehicle.run(5, 3, '粤E55555', '奥迪', 'A6', '蓝')
    insertVehicle.run(6, 3, '粤F77777', '保时捷', '卡宴', '黑')
    insertVehicle.run(7, 4, '京G33333', '本田', '雅阁', '白')

    insertTemplate.run(1, '至尊镀膜套餐', 2980, 180, '5次镀膜+3次精洗，全方位漆面保护')
    insertTemplate.run(2, '年度精洗套餐', 960, 365, '12次精洗，一年无忧')
    insertTemplate.run(3, '漆面养护套餐', 1680, 180, '3次打蜡+2次抛光，深层养护')

    insertPackageItem.run(1, 1, '镀膜', 5)
    insertPackageItem.run(2, 1, '精洗', 3)
    insertPackageItem.run(3, 2, '精洗', 12)
    insertPackageItem.run(4, 3, '打蜡', 3)
    insertPackageItem.run(5, 3, '抛光', 2)

    insertCustPkg.run(1, 1, 1, 8, 3, daysAgo(60), daysAgo(-120))
    insertCustPkg.run(2, 1, 2, 12, 7, daysAgo(100), daysAgo(265))
    insertCustPkg.run(3, 3, 1, 8, 1, daysAgo(150), daysAgo(30))
    insertCustPkg.run(4, 3, 3, 5, 3, daysAgo(30), daysAgo(150))
    insertCustPkg.run(5, 4, 2, 12, 9, daysAgo(60), daysAgo(305))

    // Order 1: 张伟/京A88888, 镀膜, 李师傅, completed
    insertOrder.run(1, 1, 1, 1, 'completed', 0, daysAgo(3), daysAgo(3), 0, null)
    insertOrderItem.run(1, 1, 1, '镀膜', 0)
    insertInspection.run(1, 1, 3, 'pass', null, daysAgo(3))
    insertDeduction.run(1, 1, 1, 'usage', 1, '镀膜', '套餐扣次', daysAgo(3))

    // Order 2: 王强/粤E55555, 镀膜, 赵师傅, completed (质检返工)
    insertOrder.run(2, 3, 5, 2, 'completed', 0, daysAgo(2), daysAgo(2), 0, null)
    insertOrderItem.run(2, 2, 3, '镀膜', 0)
    insertInspection.run(2, 2, 3, 'rework', '细微划痕未处理', daysAgo(2))
    insertDeduction.run(2, 3, 2, 'usage', 1, '镀膜', '套餐扣次', daysAgo(2))
    insertDeduction.run(3, 3, 2, 'rework_refund', 1, '镀膜', '返工退还', daysAgo(2))

    // Order 3: 王强/粤E55555 rework, 赵师傅, completed
    insertOrder.run(3, 3, 5, 2, 'completed', 0, daysAgo(2), daysAgo(2), 1, 2)
    insertOrderItem.run(3, 3, 3, '镀膜', 0)
    insertInspection.run(3, 3, 3, 'pass', null, daysAgo(2))
    insertDeduction.run(4, 3, 3, 'usage', 1, '镀膜', '返工重做扣次', daysAgo(2))

    // Order 4: 陈敏/京G33333, 精洗+打蜡, 李师傅, rework (二次返工)
    insertOrder.run(4, 4, 7, 1, 'rework', 380, daysAgo(1), null, 0, null)
    insertOrderItem.run(4, 4, 5, '精洗', 0)
    insertOrderItem.run(5, 4, null, '打蜡', 380)
    insertInspection.run(4, 4, 3, 'rework', '打蜡不均匀', daysAgo(1))
    insertInspection.run(5, 4, 3, 'rework', '漆面仍有水印', daysAgo(1))
    insertDeduction.run(5, 5, 4, 'usage', 1, '精洗', '套餐扣次', daysAgo(1))
    insertDeduction.run(6, 5, null, 'compensation', 1, '精洗', '二次返工赠送1次精洗', daysAgo(1))

    // Order 5: 李娜/沪D99999, 精洗, 待分配, pending
    insertOrder.run(5, 2, 4, null, 'pending', 80, todayStr, null, 0, null)
    insertOrderItem.run(6, 5, null, '精洗', 80)

    // Order 6: 张伟/京B66666, 精洗, 李师傅, in_progress
    insertOrder.run(6, 1, 2, 1, 'in_progress', 0, todayStr, null, 0, null)
    insertOrderItem.run(7, 6, 2, '精洗', 0)
    insertDeduction.run(7, 2, 7, 'usage', 1, '精洗', '套餐扣次', todayStr)
  })

  tx()
}

createTables()
seed()

export default db
