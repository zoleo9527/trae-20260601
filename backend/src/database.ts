import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '../../data.db')

export const db = new Database(dbPath)

db.pragma('journal_mode = WAL')

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('clerk', 'manager', 'buyer')),
      store_id INTEGER,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id)
    );

    CREATE TABLE IF NOT EXISTS policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      discount_amount REAL,
      start_date DATE,
      end_date DATE,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      baby_name TEXT,
      baby_birthday DATE,
      tier TEXT DEFAULT 'normal',
      points INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_number TEXT UNIQUE NOT NULL,
      supplier TEXT,
      production_date DATE,
      expiry_date DATE,
      quantity INTEGER DEFAULT 0,
      status TEXT DEFAULT 'normal',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coupon_code TEXT UNIQUE NOT NULL,
      policy_id INTEGER,
      member_id INTEGER NOT NULL,
      store_id INTEGER,
      operator_id INTEGER NOT NULL,
      current_handler_id INTEGER,
      status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'issued', 'verified', 'archived', 'rejected')),
      issue_date DATE,
      expiry_date DATE,
      batch_id INTEGER,
      issue_remarks TEXT,
      review_remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (policy_id) REFERENCES policies(id),
      FOREIGN KEY (member_id) REFERENCES members(id),
      FOREIGN KEY (store_id) REFERENCES stores(id),
      FOREIGN KEY (operator_id) REFERENCES users(id),
      FOREIGN KEY (current_handler_id) REFERENCES users(id),
      FOREIGN KEY (batch_id) REFERENCES batches(id)
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coupon_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT,
      file_size INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coupon_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_coupons_status ON coupons(status);
    CREATE INDEX IF NOT EXISTS idx_coupons_member ON coupons(member_id);
    CREATE INDEX IF NOT EXISTS idx_coupons_operator ON coupons(operator_id);
    CREATE INDEX IF NOT EXISTS idx_coupons_expiry ON coupons(expiry_date);
    CREATE INDEX IF NOT EXISTS idx_operation_logs_coupon ON operation_logs(coupon_id);
    CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);
    CREATE INDEX IF NOT EXISTS idx_batches_batch_number ON batches(batch_number);
  `)

  seedInitialData()
}

function seedInitialData() {
  const storeCount = db.prepare('SELECT COUNT(*) as count FROM stores').get() as { count: number }

  if (storeCount.count === 0) {
    db.prepare('INSERT INTO stores (name, address) VALUES (?, ?)').run('旗舰店', '市中心商业街123号')
    db.prepare('INSERT INTO stores (name, address) VALUES (?, ?)').run('二店', '东区购物中心B1层')

    const passwordHash = bcrypt.hashSync('123456', 10)
    db.prepare('INSERT INTO users (username, password_hash, role, store_id, name) VALUES (?, ?, ?, ?, ?)').run('clerk001', passwordHash, 'clerk', 1, '张三')
    db.prepare('INSERT INTO users (username, password_hash, role, store_id, name) VALUES (?, ?, ?, ?, ?)').run('clerk002', passwordHash, 'clerk', 1, '李四')
    db.prepare('INSERT INTO users (username, password_hash, role, store_id, name) VALUES (?, ?, ?, ?, ?)').run('manager001', passwordHash, 'manager', 1, '王店长')
    db.prepare('INSERT INTO users (username, password_hash, role, store_id, name) VALUES (?, ?, ?, ?, ?)').run('buyer001', passwordHash, 'buyer', null, '赵采购')

    db.prepare('INSERT INTO policies (name, description, discount_amount, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?)').run(
      '爱他美满减券',
      '购买爱他美奶粉满300元减50元',
      50,
      '2024-01-01',
      '2024-12-31',
      'active'
    )
    db.prepare('INSERT INTO policies (name, description, discount_amount, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?)').run(
      '惠氏新客券',
      '首单购买惠氏奶粉享受8折优惠',
      80,
      '2024-01-01',
      '2024-12-31',
      'active'
    )
    db.prepare('INSERT INTO policies (name, description, discount_amount, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?)').run(
      '通用优惠券',
      '全场通用，满200元减20元',
      20,
      '2024-01-01',
      '2024-12-31',
      'active'
    )

    db.prepare('INSERT INTO members (name, phone, baby_name, baby_birthday, tier, points) VALUES (?, ?, ?, ?, ?, ?)').run(
      '李女士',
      '13800001111',
      '小明',
      '2022-05-15',
      'gold',
      1500
    )
    db.prepare('INSERT INTO members (name, phone, baby_name, baby_birthday, tier, points) VALUES (?, ?, ?, ?, ?, ?)').run(
      '王先生',
      '13800002222',
      '小红',
      '2023-03-20',
      'silver',
      800
    )
    db.prepare('INSERT INTO members (name, phone, baby_name, baby_birthday, tier, points) VALUES (?, ?, ?, ?, ?, ?)').run(
      '张宝宝妈妈',
      '13800003333',
      '张小明',
      '2021-11-10',
      'platinum',
      3000
    )

    db.prepare('INSERT INTO batches (batch_number, supplier, production_date, expiry_date, quantity, status) VALUES (?, ?, ?, ?, ?, ?)').run(
      'Aptamil20240501',
      '爱他美官方供应商',
      '2024-05-01',
      '2026-05-01',
      100,
      'normal'
    )
    db.prepare('INSERT INTO batches (batch_number, supplier, production_date, expiry_date, quantity, status) VALUES (?, ?, ?, ?, ?, ?)').run(
      'Wyeth20240415',
      '惠氏官方供应商',
      '2024-04-15',
      '2026-04-15',
      80,
      'normal'
    )
    db.prepare('INSERT INTO batches (batch_number, supplier, production_date, expiry_date, quantity, status) VALUES (?, ?, ?, ?, ?, ?)').run(
      'MeadJohnson20240601',
      '美赞臣官方供应商',
      '2024-06-01',
      '2025-06-01',
      60,
      'expiring'
    )

    const couponCode = `COUP${new Date().toISOString().slice(0, 10).replace(/-/g, '')}001`
    db.prepare('INSERT INTO coupons (coupon_code, policy_id, member_id, store_id, operator_id, status, issue_date, expiry_date, issue_remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      couponCode,
      1,
      1,
      1,
      1,
      'pending_review',
      new Date().toISOString().slice(0, 10),
      '2024-12-31',
      '顾客购买爱他美奶粉3罐，符合满减条件'
    )
    db.prepare('INSERT INTO operation_logs (coupon_id, user_id, action, new_value) VALUES (?, ?, ?, ?)').run(1, 1, 'created', '顾客购买爱他美奶粉3罐，符合满减条件')
    db.prepare('INSERT INTO operation_logs (coupon_id, user_id, action) VALUES (?, ?, ?)').run(1, 1, 'submitted_for_review')
  }
}

export default db
