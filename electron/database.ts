import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import { insertSampleData } from './sample-data'
import type { 
  Customer, Order, OrderItem, Proof, Machine, Schedule, User, 
  WorkspaceState, OrderStatus, ProofStatus, MachineStatus, ScheduleStatus,
  QuoteCalculationInput, QuoteResult, DatabaseResult
} from './types'

let db: Database.Database | null = null

const PAPER_PRICES: Record<string, number> = {
  '铜版纸': 8.5,
  '哑粉纸': 9.2,
  '双胶纸': 6.8,
  '白卡纸': 12.5,
  '牛皮纸': 7.2,
  '特种纸': 18.0,
  '灰板纸': 5.5,
}

const COLOR_PRICES: Record<string, number> = {
  '单色': 0.8,
  '双色': 1.2,
  '四色': 2.0,
  '五色+UV': 3.5,
}

const FINISH_PRICES: Record<string, number> = {
  '过光胶': 0.3,
  '过哑胶': 0.35,
  'UV': 0.8,
  '烫金': 1.5,
  '烫银': 1.4,
  '击凸': 1.2,
  '裱糊': 2.0,
  '骑马钉': 0.5,
  '胶装': 1.8,
  '精装': 3.5,
}

const URGENCY_MULTIPLIER: Record<string, number> = {
  'normal': 1.0,
  'urgent': 1.3,
  'emergency': 1.6,
}

export function initDatabase() {
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'print_factory.db')
  
  console.log('Database path:', dbPath)
  
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  
  createTables()
  seedInitialData()
  insertSampleData(db)
  
  return db
}

function createTables() {
  if (!db) return
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      real_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('sales','designer','production','admin')),
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_login TEXT
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL,
      customer_name TEXT NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      size TEXT NOT NULL,
      paper_type TEXT NOT NULL,
      paper_gsm INTEGER NOT NULL,
      color TEXT NOT NULL,
      finish TEXT,
      urgency TEXT NOT NULL DEFAULT 'normal',
      status TEXT NOT NULL DEFAULT 'pending_quote',
      quote_amount REAL,
      quote_note TEXT,
      quoted_at TEXT,
      quoted_by INTEGER,
      deadline TEXT NOT NULL,
      notes TEXT,
      created_by INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      subtotal REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS proofs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      file_path TEXT,
      file_name TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      uploaded_by INTEGER NOT NULL,
      uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
      reviewed_by INTEGER,
      reviewed_at TEXT,
      feedback TEXT,
      is_current INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS machines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      model TEXT,
      type TEXT NOT NULL,
      max_speed INTEGER,
      status TEXT NOT NULL DEFAULT 'idle',
      status_note TEXT,
      last_maintenance TEXT,
      next_maintenance TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      machine_id INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      actual_start TEXT,
      actual_end TEXT,
      status TEXT NOT NULL DEFAULT 'scheduled',
      priority INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_by INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (machine_id) REFERENCES machines(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS workspace_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      current_role TEXT NOT NULL DEFAULT 'sales',
      current_view TEXT NOT NULL DEFAULT 'sales-dashboard',
      selected_order_id INTEGER,
      selected_machine_id INTEGER,
      filter_date_from TEXT,
      filter_date_to TEXT,
      search_query TEXT DEFAULT '',
      sidebar_collapsed INTEGER NOT NULL DEFAULT 0,
      last_updated TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      old_status TEXT,
      new_status TEXT NOT NULL,
      changed_by INTEGER NOT NULL,
      note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_deadline ON orders(deadline);
    CREATE INDEX IF NOT EXISTS idx_proofs_order ON proofs(order_id);
    CREATE INDEX IF NOT EXISTS idx_schedules_machine ON schedules(machine_id);
    CREATE INDEX IF NOT EXISTS idx_schedules_time ON schedules(start_time, end_time);
  `)
}

function seedInitialData() {
  if (!db) return
  
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  if (userCount.count > 0) return
  
  const insertUser = db.prepare(`
    INSERT INTO users (username, real_name, role, password_hash)
    VALUES (?, ?, ?, ?)
  `)
  
  insertUser.run('sales01', '张经理', 'sales', 'hash_placeholder')
  insertUser.run('designer01', '李设计', 'designer', 'hash_placeholder')
  insertUser.run('production01', '王主管', 'production', 'hash_placeholder')
  insertUser.run('admin', '系统管理员', 'admin', 'hash_placeholder')
  
  const insertCustomer = db.prepare(`
    INSERT INTO customers (name, contact, phone, email, address)
    VALUES (?, ?, ?, ?, ?)
  `)
  
  insertCustomer.run(
    '华润万家超市', '陈采购', '13800138001', 
    'chen@crvanguard.com', '深圳市南山区科技园南路1号'
  )
  insertCustomer.run(
    '腾讯科技', '林经理', '13800138002',
    'lin@tencent.com', '深圳市南山区科技园腾讯大厦'
  )
  insertCustomer.run(
    '星巴克咖啡', '王总监', '13800138003',
    'wang@starbucks.com', '上海市静安区南京西路1266号'
  )
  insertCustomer.run(
    '华为技术', '赵主管', '13800138004',
    'zhao@huawei.com', '深圳市龙岗区坂田华为基地'
  )
  insertCustomer.run(
    '小米科技', '刘经理', '13800138005',
    'liu@xiaomi.com', '北京市海淀区清河中街68号'
  )
  
  const insertMachine = db.prepare(`
    INSERT INTO machines (name, model, type, max_speed, status, status_note, next_maintenance)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  
  insertMachine.run('海德堡CD102-1', 'Heidelberg CD102-4', '四色胶印机', 15000, 'idle', null, '2026-07-15')
  insertMachine.run('海德堡CD102-2', 'Heidelberg CD102-5', '五色胶印机', 13000, 'running', null, '2026-06-20')
  insertMachine.run('小森LS440', 'Komori LS440', '四色胶印机', 14000, 'idle', null, '2026-08-01')
  insertMachine.run('罗兰700', 'Man Roland 700', '对开五色机', 12000, 'maintenance', '6月3日-4日定期保养', '2026-06-05')
  insertMachine.run('马天尼胶装线', 'Muller Martini', '胶装联动线', 8000, 'idle', null, '2026-06-25')
  insertMachine.run('模切机1', 'BOBST SP102', '全自动模切机', 6000, 'idle', null, '2026-07-10')
  insertMachine.run('烫金机1', 'TYM1050', '全自动烫金机', 4500, 'idle', null, '2026-07-20')
  
  const ws = db.prepare('SELECT COUNT(*) as count FROM workspace_state').get() as { count: number }
  if (ws.count === 0) {
    db.prepare(`
      INSERT INTO workspace_state (id, current_role, current_view, search_query, sidebar_collapsed)
      VALUES (1, 'sales', 'sales-dashboard', '', 0)
    `).run()
  }
}

export function calculateQuote(input: QuoteCalculationInput): QuoteResult {
  const baseSetupCost = 300
  const paperPricePerKg = PAPER_PRICES[input.paper_type] || 8.0
  const colorMultiplier = COLOR_PRICES[input.color] || 2.0
  const finishPrice = FINISH_PRICES[input.finish] || 0
  const urgencyMultiplier = URGENCY_MULTIPLIER[input.urgency] || 1.0
  
  const sizeMatch = input.size.match(/(\d+)\s*[xX×]\s*(\d+)/)
  const width = sizeMatch ? parseInt(sizeMatch[1]) : 210
  const height = sizeMatch ? parseInt(sizeMatch[2]) : 285
  const areaM2 = (width / 1000) * (height / 1000)
  
  const paperWeightPerSheet = areaM2 * (input.paper_gsm / 1000)
  const totalPaperWeight = paperWeightPerSheet * input.quantity * 1.1
  const paperCost = totalPaperWeight * paperPricePerKg
  
  const printingCost = input.quantity * colorMultiplier * 0.15 + baseSetupCost
  const finishCost = finishPrice > 0 ? input.quantity * finishPrice : 0
  
  const subtotal = baseSetupCost + paperCost + printingCost + finishCost
  const urgencySurcharge = subtotal * (urgencyMultiplier - 1)
  const total = subtotal + urgencySurcharge
  const unitPrice = total / input.quantity
  
  return {
    base_cost: Math.round(baseSetupCost * 100) / 100,
    paper_cost: Math.round(paperCost * 100) / 100,
    printing_cost: Math.round(printingCost * 100) / 100,
    finish_cost: Math.round(finishCost * 100) / 100,
    urgency_surcharge: Math.round(urgencySurcharge * 100) / 100,
    total: Math.round(total * 100) / 100,
    unit_price: Math.round(unitPrice * 1000) / 1000
  }
}

export function generateOrderNo(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const prefix = `PF${year}${month}${day}`
  
  if (!db) return prefix + '001'
  
  const result = db.prepare(`
    SELECT COUNT(*) as count FROM orders 
    WHERE order_no LIKE ?
  `).get(prefix + '%') as { count: number }
  
  const seq = String(result.count + 1).padStart(3, '0')
  return prefix + seq
}

export function createOrder(order: Omit<Order, 'id' | 'order_no' | 'created_at' | 'updated_at'>): DatabaseResult<Order> {
  if (!db) return { success: false, error: 'Database not initialized' }
  
  const orderNo = generateOrderNo()
  
  try {
    const result = db.prepare(`
      INSERT INTO orders (
        order_no, customer_id, customer_name, product_name, quantity, size,
        paper_type, paper_gsm, color, finish, urgency, status, deadline,
        notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      orderNo, order.customer_id, order.customer_name, order.product_name,
      order.quantity, order.size, order.paper_type, order.paper_gsm,
      order.color, order.finish || '', order.urgency, 'pending_quote',
      order.deadline, order.notes || '', order.created_by
    )
    
    const newOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid) as Order
    return { success: true, data: newOrder }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export function updateOrder(id: number, updates: Partial<Order>): DatabaseResult<Order> {
  if (!db) return { success: false, error: 'Database not initialized' }
  
  try {
    const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'order_no')
    if (fields.length === 0) {
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Order
      return { success: true, data: order }
    }
    
    const setClause = fields.map(f => `${f} = ?`).join(', ')
    const values = fields.map(f => (updates as any)[f])
    values.push(id)
    
    db.prepare(`UPDATE orders SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values)
    
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Order
    return { success: true, data: order }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export function updateOrderStatus(orderId: number, newStatus: OrderStatus, userId: number, note?: string): DatabaseResult<Order> {
  if (!db) return { success: false, error: 'Database not initialized' }
  
  const tx = db!.transaction(() => {
    const oldOrder = db!.prepare('SELECT status FROM orders WHERE id = ?').get(orderId) as { status: OrderStatus }
    
    db!.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, orderId)
    
    db!.prepare(`
      INSERT INTO order_history (order_id, old_status, new_status, changed_by, note)
      VALUES (?, ?, ?, ?, ?)
    `).run(orderId, oldOrder?.status || null, newStatus, userId, note || null)
    
    return db!.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as Order
  })
  
  try {
    const order = tx()
    return { success: true, data: order }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export function getOrders(status?: OrderStatus, fromDate?: string, toDate?: string, search?: string): DatabaseResult<Order[]> {
  if (!db) return { success: false, error: 'Database not initialized' }
  
  try {
    let query = 'SELECT * FROM orders WHERE 1=1'
    const params: any[] = []
    
    if (status) {
      query += ' AND status = ?'
      params.push(status)
    }
    if (fromDate) {
      query += ' AND deadline >= ?'
      params.push(fromDate)
    }
    if (toDate) {
      query += ' AND deadline <= ?'
      params.push(toDate)
    }
    if (search) {
      query += ' AND (order_no LIKE ? OR customer_name LIKE ? OR product_name LIKE ?)'
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm, searchTerm)
    }
    
    query += ' ORDER BY created_at DESC'
    
    const orders = db.prepare(query).all(...params) as Order[]
    return { success: true, data: orders }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export function getOrderById(id: number): DatabaseResult<Order> {
  if (!db) return { success: false, error: 'Database not initialized' }
  
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Order
    return { success: true, data: order }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export function getCustomers(search?: string): DatabaseResult<Customer[]> {
  if (!db) return { success: false, error: 'Database not initialized' }
  
  try {
    let query = 'SELECT * FROM customers'
    const params: any[] = []
    
    if (search) {
      query += ' WHERE name LIKE ? OR contact LIKE ?'
      params.push(`%${search}%`, `%${search}%`)
    }
    query += ' ORDER BY name'
    
    const customers = db.prepare(query).all(...params) as Customer[]
    return { success: true, data: customers }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export function createCustomer(customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): DatabaseResult<Customer> {
  if (!db) return { success: false, error: 'Database not initialized' }
  
  try {
    const result = db.prepare(`
      INSERT INTO customers (name, contact, phone, email, address)
      VALUES (?, ?, ?, ?, ?)
    `).run(customer.name, customer.contact || '', customer.phone || '', customer.email || '', customer.address || '')
    
    const newCustomer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid) as Customer
    return { success: true, data: newCustomer }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export function getProofsByOrder(orderId: number): DatabaseResult<Proof[]> {
  if (!db) return { success: false, error: 'Database not initialized' }
  
  try {
    const proofs = db.prepare(`
      SELECT * FROM proofs 
      WHERE order_id = ? 
      ORDER BY version DESC
    `).all(orderId) as Proof[]
    return { success: true, data: proofs }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export function createProof(proof: Omit<Proof, 'id' | 'uploaded_at' | 'is_current'>): DatabaseResult<Proof> {
  if (!db) return { success: false, error: 'Database not initialized' }
  
  const tx = db!.transaction(() => {
    db!.prepare('UPDATE proofs SET is_current = 0 WHERE order_id = ?').run(proof.order_id)
    
    const maxVersion = db!.prepare('SELECT COALESCE(MAX(version), 0) as v FROM proofs WHERE order_id = ?')
      .get(proof.order_id) as { v: number }
    const newVersion = maxVersion.v + 1
    
    const result = db!.prepare(`
      INSERT INTO proofs (order_id, version, file_path, file_name, status, uploaded_by, is_current)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(proof.order_id, newVersion, proof.file_path || null, proof.file_name || null, 'uploaded', proof.uploaded_by)
    
    db!.prepare('UPDATE orders SET status = ? WHERE id = ?').run('proof_uploaded', proof.order_id)
    
    return db!.prepare('SELECT * FROM proofs WHERE id = ?').get(result.lastInsertRowid) as Proof
  })
  
  try {
    const proof = tx()
    return { success: true, data: proof }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export function reviewProof(proofId: number, status: 'approved' | 'rejected', userId: number, feedback?: string): DatabaseResult<Proof> {
  if (!db) return { success: false, error: 'Database not initialized' }
  
  const tx = db!.transaction(() => {
    const proof = db!.prepare('SELECT * FROM proofs WHERE id = ?').get(proofId) as Proof
    
    db!.prepare(`
      UPDATE proofs 
      SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, feedback = ?
      WHERE id = ?
    `).run(status, userId, feedback || null, proofId)
    
    const orderStatus = status === 'approved' ? 'proof_approved' : 'proof_rejected'
    db!.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(orderStatus, proof.order_id)
    
    db!.prepare(`
      INSERT INTO order_history (order_id, old_status, new_status, changed_by, note)
      VALUES (?, ?, ?, ?, ?)
    `).run(proof.order_id, 'proof_uploaded', orderStatus, userId, feedback || null)
    
    return db!.prepare('SELECT * FROM proofs WHERE id = ?').get(proofId) as Proof
  })
  
  try {
    const proof = tx()
    return { success: true, data: proof }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export function getMachines(): DatabaseResult<Machine[]> {
  if (!db) return { success: false, error: 'Database not initialized' }
  
  try {
    const machines = db.prepare('SELECT * FROM machines ORDER BY id').all() as Machine[]
    return { success: true, data: machines }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export function updateMachineStatus(id: number, status: MachineStatus, note?: string): DatabaseResult<Machine> {
  if (!db) return { success: false, error: 'Database not initialized' }
  
  try {
    db.prepare(`
      UPDATE machines 
      SET status = ?, status_note = ?
      WHERE id = ?
    `).run(status, note || null, id)
    
    const machine = db.prepare('SELECT * FROM machines WHERE id = ?').get(id) as Machine
    return { success: true, data: machine }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export function getSchedules(date?: string, machineId?: number): DatabaseResult<(Schedule & { order: Order; machine: Machine })[]> {
  if (!db) return { success: false, error: 'Database not initialized' }
  
  try {
    let query = `
      SELECT s.*, 
        o.id as order_id, o.order_no, o.customer_name, o.product_name, o.quantity, o.deadline, o.urgency, o.status as order_status,
        m.name as machine_name, m.status as machine_status
      FROM schedules s
      JOIN orders o ON s.order_id = o.id
      JOIN machines m ON s.machine_id = m.id
      WHERE 1=1
    `
    const params: any[] = []
    
    if (date) {
      query += ' AND DATE(s.start_time) = ?'
      params.push(date)
    }
    if (machineId) {
      query += ' AND s.machine_id = ?'
      params.push(machineId)
    }
    
    query += ' ORDER BY s.start_time ASC'
    
    const schedules = db.prepare(query).all(...params) as any[]
    return { success: true, data: schedules }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export function createSchedule(schedule: Omit<Schedule, 'id' | 'created_at' | 'updated_at'>): DatabaseResult<Schedule> {
  if (!db) return { success: false, error: 'Database not initialized' }
  
  const tx = db!.transaction(() => {
    const result = db!.prepare(`
      INSERT INTO schedules (order_id, machine_id, start_time, end_time, priority, notes, created_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      schedule.order_id, schedule.machine_id, schedule.start_time, schedule.end_time,
      schedule.priority || 0, schedule.notes || '', schedule.created_by, schedule.status || 'scheduled'
    )
    
    db!.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('scheduled', schedule.order_id)
    
    return db!.prepare('SELECT * FROM schedules WHERE id = ?').get(result.lastInsertRowid) as Schedule
  })
  
  try {
    const s = tx()
    return { success: true, data: s }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export function updateSchedule(id: number, updates: Partial<Schedule>): DatabaseResult<Schedule> {
  if (!db) return { success: false, error: 'Database not initialized' }
  
  try {
    const fields = Object.keys(updates).filter(k => k !== 'id')
    const setClause = fields.map(f => `${f} = ?`).join(', ')
    const values = fields.map(f => (updates as any)[f])
    values.push(id)
    
    db.prepare(`UPDATE schedules SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values)
    
    const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(id) as Schedule
    return { success: true, data: schedule }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export function getWorkspaceState(): DatabaseResult<WorkspaceState> {
  if (!db) return { success: false, error: 'Database not initialized' }
  
  try {
    const state = db.prepare('SELECT * FROM workspace_state WHERE id = 1').get() as WorkspaceState
    return { success: true, data: state }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export function saveWorkspaceState(state: Partial<WorkspaceState>): DatabaseResult<WorkspaceState> {
  if (!db) return { success: false, error: 'Database not initialized' }
  
  try {
    const fields = Object.keys(state)
    const setClause = fields.map(f => `${f} = ?`).join(', ')
    const values = fields.map(f => (state as any)[f])
    
    db.prepare(`UPDATE workspace_state SET ${setClause}, last_updated = CURRENT_TIMESTAMP WHERE id = 1`).run(...values)
    
    const newState = db.prepare('SELECT * FROM workspace_state WHERE id = 1').get() as WorkspaceState
    return { success: true, data: newState }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export function getUsers(): DatabaseResult<User[]> {
  if (!db) return { success: false, error: 'Database not initialized' }
  
  try {
    const users = db.prepare('SELECT id, username, real_name, role, created_at, last_login FROM users ORDER BY id').all() as User[]
    return { success: true, data: users }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export function exportAllData(): DatabaseResult<any> {
  if (!db) return { success: false, error: 'Database not initialized' }
  
  try {
    const data = {
      export_time: new Date().toISOString(),
      version: '1.0',
      users: db.prepare('SELECT id, username, real_name, role, password_hash, created_at, last_login FROM users').all(),
      customers: db.prepare('SELECT * FROM customers').all(),
      orders: db.prepare('SELECT * FROM orders').all(),
      order_items: db.prepare('SELECT * FROM order_items').all(),
      proofs: db.prepare('SELECT * FROM proofs').all(),
      machines: db.prepare('SELECT * FROM machines').all(),
      schedules: db.prepare('SELECT * FROM schedules').all(),
      order_history: db.prepare('SELECT * FROM order_history').all(),
      workspace_state: db.prepare('SELECT * FROM workspace_state').all()
    }
    return { success: true, data }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export function importData(data: any): DatabaseResult<{ count: number }> {
  if (!db) return { success: false, error: 'Database not initialized' }
  
  const tx = db!.transaction(() => {
    let count = 0
    
    if (data.users?.length) {
      const stmt = db!.prepare(`
        INSERT OR REPLACE INTO users (id, username, real_name, role, password_hash, created_at, last_login)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      for (const u of data.users) {
        stmt.run(u.id, u.username, u.real_name, u.role, u.password_hash, u.created_at, u.last_login)
        count++
      }
    }
    
    if (data.customers?.length) {
      const stmt = db!.prepare(`
        INSERT OR REPLACE INTO customers (id, name, contact, phone, email, address, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      for (const c of data.customers) {
        stmt.run(c.id, c.name, c.contact, c.phone, c.email, c.address, c.created_at, c.updated_at)
        count++
      }
    }
    
    if (data.orders?.length) {
      const stmt = db!.prepare(`
        INSERT OR REPLACE INTO orders 
        (id, order_no, customer_id, customer_name, product_name, quantity, size, paper_type, 
         paper_gsm, color, finish, urgency, status, quote_amount, quote_note, quoted_at, 
         quoted_by, deadline, notes, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      for (const o of data.orders) {
        stmt.run(o.id, o.order_no, o.customer_id, o.customer_name, o.product_name, o.quantity,
          o.size, o.paper_type, o.paper_gsm, o.color, o.finish, o.urgency, o.status,
          o.quote_amount, o.quote_note, o.quoted_at, o.quoted_by, o.deadline, o.notes,
          o.created_by, o.created_at, o.updated_at)
        count++
      }
    }
    
    if (data.proofs?.length) {
      const stmt = db!.prepare(`
        INSERT OR REPLACE INTO proofs 
        (id, order_id, version, file_path, file_name, status, uploaded_by, 
         uploaded_at, reviewed_by, reviewed_at, feedback, is_current)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      for (const p of data.proofs) {
        stmt.run(p.id, p.order_id, p.version, p.file_path, p.file_name, p.status,
          p.uploaded_by, p.uploaded_at, p.reviewed_by, p.reviewed_at, p.feedback, p.is_current)
        count++
      }
    }
    
    if (data.machines?.length) {
      const stmt = db!.prepare(`
        INSERT OR REPLACE INTO machines 
        (id, name, model, type, max_speed, status, status_note, last_maintenance, next_maintenance, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      for (const m of data.machines) {
        stmt.run(m.id, m.name, m.model, m.type, m.max_speed, m.status, m.status_note,
          m.last_maintenance, m.next_maintenance, m.created_at)
        count++
      }
    }
    
    if (data.schedules?.length) {
      const stmt = db!.prepare(`
        INSERT OR REPLACE INTO schedules 
        (id, order_id, machine_id, start_time, end_time, actual_start, actual_end, 
         status, priority, notes, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      for (const s of data.schedules) {
        stmt.run(s.id, s.order_id, s.machine_id, s.start_time, s.end_time, s.actual_start,
          s.actual_end, s.status, s.priority, s.notes, s.created_by, s.created_at, s.updated_at)
        count++
      }
    }
    
    if (data.order_history?.length) {
      const stmt = db!.prepare(`
        INSERT OR REPLACE INTO order_history 
        (id, order_id, old_status, new_status, changed_by, note, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      for (const h of data.order_history) {
        stmt.run(h.id, h.order_id, h.old_status, h.new_status, h.changed_by, h.note, h.created_at)
        count++
      }
    }
    
    if (data.workspace_state?.length) {
      const stmt = db!.prepare(`
        INSERT OR REPLACE INTO workspace_state 
        (id, current_role, current_view, selected_order_id, selected_machine_id, 
         filter_date_from, filter_date_to, search_query, sidebar_collapsed, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      for (const w of data.workspace_state) {
        stmt.run(w.id, w.current_role, w.current_view, w.selected_order_id, w.selected_machine_id,
          w.filter_date_from, w.filter_date_to, w.search_query, w.sidebar_collapsed, w.last_updated)
        count++
      }
    }
    
    return { count }
  })
  
  try {
    const result = tx()
    return { success: true, data: result }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export { DatabaseResult }
