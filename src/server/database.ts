import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const dbPath = join(__dirname, '../../data/nongjiale.db')

export interface Room {
  id: number
  name: string
  type: string
  price: number
  status: string
  capacity: number
}

export interface Reservation {
  id: number
  room_id: number
  guest_name: string
  phone: string
  check_in: string
  check_out: string
  guests: number
  deposit: number
  status: string
  created_at: string
}

export interface Order {
  id: number
  table_no: string
  dishes: string
  status: string
  created_at: string
}

export interface InventoryItem {
  id: number
  name: string
  quantity: number
  min_stock: number
  unit: string
}

export interface RoomStatusLog {
  id: number
  room_id: number
  status: string
  changed_by: string
  changed_at: string
  note: string
}

export interface User {
  id: number
  username: string
  password: string
  role: string
}

const db = new Database(dbPath)

function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      price INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'available',
      capacity INTEGER NOT NULL
    )
    
    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      guest_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      check_in TEXT NOT NULL,
      check_out TEXT NOT NULL,
      guests INTEGER NOT NULL,
      deposit INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    )
    
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_no TEXT NOT NULL,
      dishes TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL
    )
    
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      min_stock INTEGER NOT NULL,
      unit TEXT NOT NULL
    )
    
    CREATE TABLE IF NOT EXISTS room_status_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      changed_by TEXT NOT NULL,
      changed_at TEXT NOT NULL,
      note TEXT,
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    )
    
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL
    )
  `)
}

const dishIngredients: Record<string, { name: string; amount: number }[]> = {
  '红烧肉': [{ name: '五花肉', amount: 0.5 }, { name: '花生油', amount: 0.1 }],
  '炒青菜': [{ name: '青菜', amount: 0.5 }, { name: '花生油', amount: 0.05 }],
  '土鸡汤': [{ name: '土鸡', amount: 1 }, { name: '土鸡蛋', amount: 2 }],
  '清蒸鱼': [{ name: '鲜鱼', amount: 1 }, { name: '花生油', amount: 0.05 }],
  '豆腐煲': [{ name: '豆腐', amount: 4 }, { name: '花生油', amount: 0.05 }],
  '腊肉炒饭': [{ name: '腊肉', amount: 0.3 }, { name: '大米', amount: 0.4 }],
  '凉拌黄瓜': [{ name: '黄瓜', amount: 0.4 }, { name: '花生油', amount: 0.03 }],
  '农家小炒肉': [{ name: '五花肉', amount: 0.4 }, { name: '青菜', amount: 0.3 }],
  '蒜蓉西兰花': [{ name: '西兰花', amount: 0.5 }, { name: '花生油', amount: 0.05 }],
  '西红柿炒蛋': [{ name: '西红柿', amount: 0.4 }, { name: '土鸡蛋', amount: 3 }]
}

export function initSampleData() {
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const dayAfter = new Date(Date.now() + 172800000).toISOString().split('T')[0]

  const roomsCount = db.prepare('SELECT COUNT(*) as count FROM rooms').get().count
  if (roomsCount === 0) {
    db.exec(`
      INSERT INTO rooms (name, type, price, status, capacity) VALUES
      ('温馨大床房', '大床房', 280, 'available', 2),
      ('田园标间', '标间', 220, 'occupied', 2),
      ('家庭套房', '套房', 480, 'reserved', 4),
      ('山景大床房', '大床房', 320, 'available', 2),
      ('庭院标间', '标间', 260, 'cleaning', 2),
      ('豪华套房', '套房', 680, 'available', 6),
      ('竹林小屋', '大床房', 350, 'reserved', 2),
      ('湖畔别墅', '套房', 880, 'occupied', 8)
    `)
  }

  const reservationsCount = db.prepare('SELECT COUNT(*) as count FROM reservations').get().count
  if (reservationsCount === 0) {
    db.exec(`
      INSERT INTO reservations (room_id, guest_name, phone, check_in, check_out, guests, deposit, status, created_at) VALUES
      (2, '张三', '13800138001', '${today}', '${tomorrow}', 2, 200, 'checked_in', '${new Date().toISOString()}'),
      (3, '李四', '13800138002', '${today}', '${tomorrow}', 3, 500, 'pending', '${new Date().toISOString()}'),
      (1, '王五', '13800138003', '${tomorrow}', '${dayAfter}', 2, 0, 'pending', '${new Date().toISOString()}'),
      (7, '赵六', '13800138004', '${today}', '${dayAfter}', 2, 300, 'pending', '${new Date().toISOString()}'),
      (8, '孙七', '13800138005', '${today}', '${tomorrow}', 6, 800, 'checked_in', '${new Date().toISOString()}'),
      (3, '周八', '13800138006', '${today}', '${tomorrow}', 2, 0, 'pending', '${new Date().toISOString()}'),
      (4, '吴九', '13800138007', '${today}', '${tomorrow}', 2, 0, 'checked_in', '${new Date().toISOString()}'),
      (6, '郑十', '13800138008', '${today}', '${tomorrow}', 4, 100, 'checked_in', '${new Date().toISOString()}')
    `)
  }

  const ordersCount = db.prepare('SELECT COUNT(*) as count FROM orders').get().count
  if (ordersCount === 0) {
    db.exec(`
      INSERT INTO orders (table_no, dishes, status, created_at) VALUES
      ('A1', '[{"name":"红烧肉","quantity":1},{"name":"炒青菜","quantity":2},{"name":"土鸡汤","quantity":1}]', 'pending', '${new Date().toISOString()}'),
      ('A2', '[{"name":"清蒸鱼","quantity":1},{"name":"豆腐煲","quantity":1}]', 'cooking', '${new Date().toISOString()}'),
      ('B1', '[{"name":"腊肉炒饭","quantity":2},{"name":"凉拌黄瓜","quantity":1}]', 'completed', '${new Date().toISOString()}'),
      ('B2', '[{"name":"农家小炒肉","quantity":2},{"name":"蒜蓉西兰花","quantity":1},{"name":"西红柿炒蛋","quantity":1}]', 'pending', '${new Date().toISOString()}'),
      ('C1', '[{"name":"土鸡汤","quantity":2},{"name":"红烧肉","quantity":2}]', 'pending', '${new Date().toISOString()}')
    `)
  }

  const inventoryCount = db.prepare('SELECT COUNT(*) as count FROM inventory').get().count
  if (inventoryCount === 0) {
    db.exec(`
      INSERT INTO inventory (name, quantity, min_stock, unit) VALUES
      ('土鸡', 8, 10, '只'),
      ('土鸡蛋', 50, 30, '个'),
      ('青菜', 12, 15, '斤'),
      ('豆腐', 30, 20, '块'),
      ('腊肉', 8, 10, '斤'),
      ('鲜鱼', 12, 8, '条'),
      ('大米', 50, 40, '斤'),
      ('花生油', 15, 10, '桶'),
      ('五花肉', 15, 12, '斤'),
      ('西兰花', 8, 10, '斤'),
      ('黄瓜', 20, 15, '斤'),
      ('西红柿', 18, 15, '斤')
    `)
  }

  const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count
  if (usersCount === 0) {
    db.exec(`
      INSERT INTO users (username, password, role) VALUES
      ('boss', '123456', 'boss'),
      ('chef', '123456', 'chef'),
      ('housekeeper', '123456', 'housekeeper'),
      ('staff', '123456', 'staff')
    `)
  }

  const logsCount = db.prepare('SELECT COUNT(*) as count FROM room_status_log').get().count
  if (logsCount === 0) {
    const now = new Date()
    const hourAgo = new Date(now.getTime() - 3600000).toISOString()
    const twoHoursAgo = new Date(now.getTime() - 7200000).toISOString()
    const threeHoursAgo = new Date(now.getTime() - 10800000).toISOString()
    
    db.exec(`
      INSERT INTO room_status_log (room_id, status, changed_by, changed_at, note) VALUES
      (2, 'occupied', '老板', '${hourAgo}', '客人 张三 办理入住'),
      (8, 'occupied', '老板', '${hourAgo}', '客人 孙七 办理入住'),
      (5, 'cleaning', '客房阿姨', '${twoHoursAgo}', '房间打扫中'),
      (1, 'available', '客房阿姨', '${twoHoursAgo}', '房间打扫完成'),
      (4, 'available', '客房阿姨', '${threeHoursAgo}', '房间打扫完成'),
      (6, 'available', '老板', '${threeHoursAgo}', '房间状态初始化'),
      (3, 'reserved', '老板', '${threeHoursAgo}', '客人 李四 预订房间'),
      (7, 'reserved', '老板', '${threeHoursAgo}', '客人 赵六 预订房间')
    `)
  }
}

initTables()
initSampleData()

export function getAllRooms(): Room[] {
  return db.prepare('SELECT * FROM rooms').all() as Room[]
}

export function getAllReservations(): Reservation[] {
  return db.prepare('SELECT * FROM reservations').all() as Reservation[]
}

export function getAllOrders(): Order[] {
  return db.prepare('SELECT * FROM orders').all() as Order[]
}

export function getAllInventory(): InventoryItem[] {
  return db.prepare('SELECT * FROM inventory').all() as InventoryItem[]
}

export function getAllLogs(): RoomStatusLog[] {
  return db.prepare('SELECT * FROM room_status_log ORDER BY changed_at DESC LIMIT 50').all() as RoomStatusLog[]
}

export function getAllUsers(): User[] {
  return db.prepare('SELECT * FROM users').all() as User[]
}

export function getUserByUsername(username: string): User | undefined {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined
}

export function addRoom(name: string, type: string, price: number, capacity: number) {
  db.prepare('INSERT INTO rooms (name, type, price, capacity) VALUES (?, ?, ?, ?)')
    .run(name, type, price, capacity)
}

export function deleteRoom(id: number) {
  db.prepare('DELETE FROM rooms WHERE id = ?').run(id)
}

export function updateRoomStatus(roomId: number, status: string) {
  db.prepare('UPDATE rooms SET status = ? WHERE id = ?').run(status, roomId)
}

export function addReservation(roomId: number, guestName: string, phone: string, checkIn: string, checkOut: string, guests: number, deposit: number) {
  db.prepare(`
    INSERT INTO reservations (room_id, guest_name, phone, check_in, check_out, guests, deposit, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
  `).run(roomId, guestName, phone, checkIn, checkOut, guests, deposit, new Date().toISOString())
}

export function updateReservationStatus(reservationId: number, status: string) {
  db.prepare('UPDATE reservations SET status = ? WHERE id = ?').run(status, reservationId)
}

export function addOrder(tableNo: string, dishes: string) {
  db.prepare('INSERT INTO orders (table_no, dishes, status, created_at) VALUES (?, ?, "pending", ?)')
    .run(tableNo, dishes, new Date().toISOString())
}

export function updateOrderStatus(orderId: number, status: string) {
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, orderId)
}

export function addInventoryItem(name: string, quantity: number, minStock: number, unit: string) {
  db.prepare('INSERT INTO inventory (name, quantity, min_stock, unit) VALUES (?, ?, ?, ?)')
    .run(name, quantity, minStock, unit)
}

export function updateInventoryItem(id: number, name: string, quantity: number, minStock: number, unit: string) {
  db.prepare('UPDATE inventory SET name = ?, quantity = ?, min_stock = ?, unit = ? WHERE id = ?')
    .run(name, quantity, minStock, unit, id)
}

export function deleteInventoryItem(id: number) {
  db.prepare('DELETE FROM inventory WHERE id = ?').run(id)
}

export function updateInventoryStock(id: number, delta: number) {
  db.prepare('UPDATE inventory SET quantity = MAX(0, quantity + ?) WHERE id = ?').run(delta, id)
}

export function addStatusLog(roomId: number, status: string, changedBy: string, note: string) {
  db.prepare('INSERT INTO room_status_log (room_id, status, changed_by, changed_at, note) VALUES (?, ?, ?, ?, ?)')
    .run(roomId, status, changedBy, new Date().toISOString(), note)
}

export function getRoomById(id: number): Room | undefined {
  return db.prepare('SELECT * FROM rooms WHERE id = ?').get(id) as Room | undefined
}

export function getReservationById(id: number): Reservation | undefined {
  return db.prepare('SELECT * FROM reservations WHERE id = ?').get(id) as Reservation | undefined
}

export function batchCheckIn(roomIds: number[], operator: string) {
  for (const roomId of roomIds) {
    const reservation = db.prepare('SELECT * FROM reservations WHERE room_id = ? AND status = "pending"').get(roomId) as Reservation | undefined
    if (reservation) {
      db.prepare('UPDATE rooms SET status = "occupied" WHERE id = ?').run(roomId)
      db.prepare('UPDATE reservations SET status = "checked_in" WHERE id = ?').run(reservation.id)
      db.prepare('INSERT INTO room_status_log (room_id, status, changed_by, changed_at, note) VALUES (?, ?, ?, ?, ?)')
        .run(roomId, 'occupied', operator, new Date().toISOString(), `批量入住 - 客人 ${reservation.guest_name}`)
    }
  }
}

export function batchCheckOut(roomIds: number[], operator: string) {
  for (const roomId of roomIds) {
    const reservation = db.prepare('SELECT * FROM reservations WHERE room_id = ? AND status = "checked_in"').get(roomId) as Reservation | undefined
    if (reservation) {
      db.prepare('UPDATE rooms SET status = "cleaning" WHERE id = ?').run(roomId)
      db.prepare('UPDATE reservations SET status = "completed" WHERE id = ?').run(reservation.id)
      db.prepare('INSERT INTO room_status_log (room_id, status, changed_by, changed_at, note) VALUES (?, ?, ?, ?, ?)')
        .run(roomId, 'cleaning', operator, new Date().toISOString(), `批量退房 - 客人 ${reservation.guest_name}`)
    }
  }
}

export function batchCleanComplete(roomIds: number[], operator: string) {
  for (const roomId of roomIds) {
    db.prepare('UPDATE rooms SET status = "available" WHERE id = ?').run(roomId)
    db.prepare('INSERT INTO room_status_log (room_id, status, changed_by, changed_at, note) VALUES (?, ?, ?, ?, ?)')
      .run(roomId, 'available', operator, new Date().toISOString(), '批量打扫完成')
  }
}

export function createOrderWithInventory(tableNo: string, dishes: string): { success: boolean; message: string } {
  const dishesArray = JSON.parse(dishes)
  
  const requiredIngredients: Record<string, number> = {}
  
  for (const dish of dishesArray) {
    const ingredients = dishIngredients[dish.name]
    if (!ingredients) {
      return { success: false, message: `菜品 ${dish.name} 暂无原料配方` }
    }
    
    for (const ing of ingredients) {
      const key = ing.name
      requiredIngredients[key] = (requiredIngredients[key] || 0) + ing.amount * dish.quantity
    }
  }
  
  for (const [name, amount] of Object.entries(requiredIngredients)) {
    const item = db.prepare('SELECT * FROM inventory WHERE name = ?').get(name) as InventoryItem | undefined
    if (!item || item.quantity < amount) {
      return { success: false, message: `${name}库存不足，需要${amount}${item?.unit || ''}，现有${item?.quantity || 0}${item?.unit || ''}` }
    }
  }
  
  for (const [name, amount] of Object.entries(requiredIngredients)) {
    db.prepare('UPDATE inventory SET quantity = quantity - ? WHERE name = ?').run(amount, name)
  }
  
  db.prepare('INSERT INTO orders (table_no, dishes, status, created_at) VALUES (?, ?, "pending", ?)')
    .run(tableNo, dishes, new Date().toISOString())
  
  return { success: true, message: '下单成功' }
}