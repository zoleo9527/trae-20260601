import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbDir = path.join(__dirname, '..', 'data')
const dbPath = path.join(dbDir, 'app.db')

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.')
  }
  return db
}

export function initDb(): void {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      grade TEXT NOT NULL,
      market_price REAL NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS customer (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS price_adjustment (
      id TEXT PRIMARY KEY,
      inventory_id TEXT NOT NULL,
      original_price REAL NOT NULL,
      new_price REAL NOT NULL,
      adjustment_type TEXT NOT NULL,
      reason TEXT,
      requested_lock_days INTEGER,
      customer_id TEXT NOT NULL,
      applicant_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      review_opinion TEXT,
      reviewer_name TEXT,
      reviewed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (inventory_id) REFERENCES inventory(id),
      FOREIGN KEY (customer_id) REFERENCES customer(id)
    );

    CREATE TABLE IF NOT EXISTS price_lock (
      id TEXT PRIMARY KEY,
      adjustment_id TEXT NOT NULL,
      inventory_id TEXT NOT NULL,
      locked_price REAL NOT NULL,
      original_market_price REAL NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      lock_start_date TEXT NOT NULL,
      lock_end_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      FOREIGN KEY (adjustment_id) REFERENCES price_adjustment(id),
      FOREIGN KEY (inventory_id) REFERENCES inventory(id),
      FOREIGN KEY (customer_id) REFERENCES customer(id)
    );

    CREATE TABLE IF NOT EXISTS customer_quote (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      inventory_id TEXT NOT NULL,
      adjustment_id TEXT,
      quoted_price REAL NOT NULL,
      market_price REAL NOT NULL,
      adjustment_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      expires_at TEXT,
      FOREIGN KEY (customer_id) REFERENCES customer(id),
      FOREIGN KEY (inventory_id) REFERENCES inventory(id),
      FOREIGN KEY (adjustment_id) REFERENCES price_adjustment(id)
    );
  `)

  try {
    db.exec('ALTER TABLE customer_quote ADD COLUMN adjustment_id TEXT REFERENCES price_adjustment(id)')
  } catch (e) {
    // Column already exists, ignore
  }

  // Migration: add adjustment_id to customer_quote and populate existing records
  try {
    const quotes = db.prepare('SELECT id, customer_id, inventory_id, quoted_price, market_price, adjustment_type FROM customer_quote WHERE adjustment_id IS NULL').all() as Array<{id: string, customer_id: string, inventory_id: string, quoted_price: number, market_price: number, adjustment_type: string}>
    const updateQuote = db.prepare('UPDATE customer_quote SET adjustment_id = ? WHERE id = ?')
    
    for (const quote of quotes) {
      const adj = db.prepare(`
        SELECT id FROM price_adjustment 
        WHERE customer_id = ? AND inventory_id = ? AND new_price = ? AND original_price = ? AND adjustment_type = ?
        LIMIT 1
      `).get(quote.customer_id, quote.inventory_id, quote.quoted_price, quote.market_price, quote.adjustment_type) as {id: string} | undefined
      
      if (adj) {
        updateQuote.run(adj.id, quote.id)
      }
    }
  } catch (e) {
    console.warn('Migration skipped:', e)
  }

  seedData()
}

function seedData(): void {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM inventory').get() as { cnt: number }
  if (count.cnt > 0) return

  const now = new Date().toISOString()

  const insertInventory = db.prepare(
    `INSERT INTO inventory (id, name, category, grade, market_price, quantity, unit) VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
  insertInventory.run('inv-001', '废铜线', '金属', 'A级', 48000, 5000, 'kg')
  insertInventory.run('inv-002', '废铝板', '金属', 'B级', 13500, 8000, 'kg')
  insertInventory.run('inv-003', '废钢板', '金属', 'A级', 3200, 12000, 'kg')
  insertInventory.run('inv-004', '废旧塑料', '塑料', 'C级', 2800, 15000, 'kg')

  const insertCustomer = db.prepare(
    `INSERT INTO customer (id, name, contact) VALUES (?, ?, ?)`
  )
  insertCustomer.run('cust-001', '华鑫金属回收', '张经理 138-0001-0001')
  insertCustomer.run('cust-002', '永达资源科技', '李总 139-0002-0002')
  insertCustomer.run('cust-003', '绿源环保材料', '王主管 137-0003-0003')

  const insertAdjustment = db.prepare(
    `INSERT INTO price_adjustment (id, inventory_id, original_price, new_price, adjustment_type, reason, requested_lock_days, customer_id, applicant_name, status, review_opinion, reviewer_name, reviewed_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )

  insertAdjustment.run(
    'adj-001', 'inv-002', 13500, 11000, 'customer_negotiation',
    '客户要求降价，降价幅度过大',
    30, 'cust-002', '刘专员',
    'rejected', '降价幅度过大，不符合公司定价策略', '赵总监',
    '2026-06-10T14:30:00.000Z', '2026-06-08T09:00:00.000Z', '2026-06-10T14:30:00.000Z'
  )

  insertAdjustment.run(
    'adj-002', 'inv-001', 48000, 46500, 'market_change',
    '市场行情变动，铜价下调',
    15, 'cust-001', '陈业务',
    'approved', '同意', '赵总监',
    '2026-06-15T10:00:00.000Z', '2026-06-14T08:30:00.000Z', '2026-06-15T10:00:00.000Z'
  )

  insertAdjustment.run(
    'adj-003', 'inv-004', 2800, 2600, 'grade_change',
    '塑料等级调整导致降价',
    10, 'cust-003', '周助理',
    'expired', null, null, null,
    '2026-06-01T11:00:00.000Z', '2026-06-01T11:00:00.000Z'
  )

  const insertLock = db.prepare(
    `INSERT INTO price_lock (id, adjustment_id, inventory_id, locked_price, original_market_price, quantity, unit, customer_id, lock_start_date, lock_end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )

  insertLock.run(
    'lock-001', 'adj-002', 'inv-001', 46500, 48000, 5000, 'kg', 'cust-001',
    '2026-06-15', '2026-07-05', 'active'
  )

  insertLock.run(
    'lock-002', 'adj-003', 'inv-004', 2600, 2800, 15000, 'kg', 'cust-003',
    '2026-06-01', '2026-06-17', 'expired'
  )

  const insertQuote = db.prepare(
    `INSERT INTO customer_quote (id, customer_id, inventory_id, adjustment_id, quoted_price, market_price, adjustment_type, status, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )

  insertQuote.run(
    'quote-001', 'cust-001', 'inv-001', 'adj-002', 46500, 48000, 'market_change', 'active',
    '2026-06-15T10:00:00.000Z', '2026-07-05T23:59:59.000Z'
  )

  insertQuote.run(
    'quote-002', 'cust-002', 'inv-002', 'adj-001', 11000, 13500, 'customer_negotiation', 'rejected',
    '2026-06-08T09:00:00.000Z', '2026-06-30T23:59:59.000Z'
  )

  insertQuote.run(
    'quote-003', 'cust-003', 'inv-004', 'adj-003', 2600, 2800, 'grade_change', 'expired',
    '2026-06-01T11:00:00.000Z', '2026-06-17T23:59:59.000Z'
  )
}
