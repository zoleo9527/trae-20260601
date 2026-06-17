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

const STORAGE_KEY = 'nongjiale_data'

interface DatabaseData {
  rooms: Room[]
  reservations: Reservation[]
  orders: Order[]
  inventory: InventoryItem[]
  room_status_log: RoomStatusLog[]
  users: User[]
}

function initSampleData(): DatabaseData {
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const dayAfter = new Date(Date.now() + 172800000).toISOString().split('T')[0]

  return {
    rooms: [
      { id: 1, name: '温馨大床房', type: '大床房', price: 280, status: 'available', capacity: 2 },
      { id: 2, name: '田园标间', type: '标间', price: 220, status: 'occupied', capacity: 2 },
      { id: 3, name: '家庭套房', type: '套房', price: 480, status: 'reserved', capacity: 4 },
      { id: 4, name: '山景大床房', type: '大床房', price: 320, status: 'available', capacity: 2 },
      { id: 5, name: '庭院标间', type: '标间', price: 260, status: 'cleaning', capacity: 2 },
      { id: 6, name: '豪华套房', type: '套房', price: 680, status: 'available', capacity: 6 },
      { id: 7, name: '竹林小屋', type: '大床房', price: 350, status: 'reserved', capacity: 2 },
      { id: 8, name: '湖畔别墅', type: '套房', price: 880, status: 'occupied', capacity: 8 }
    ],
    reservations: [
      { id: 1, room_id: 2, guest_name: '张三', phone: '13800138001', check_in: today, check_out: tomorrow, guests: 2, deposit: 200, status: 'checked_in', created_at: new Date().toISOString() },
      { id: 2, room_id: 3, guest_name: '李四', phone: '13800138002', check_in: today, check_out: tomorrow, guests: 3, deposit: 500, status: 'pending', created_at: new Date().toISOString() },
      { id: 3, room_id: 1, guest_name: '王五', phone: '13800138003', check_in: tomorrow, check_out: dayAfter, guests: 2, deposit: 0, status: 'pending', created_at: new Date().toISOString() },
      { id: 4, room_id: 7, guest_name: '赵六', phone: '13800138004', check_in: today, check_out: dayAfter, guests: 2, deposit: 300, status: 'pending', created_at: new Date().toISOString() },
      { id: 5, room_id: 8, guest_name: '孙七', phone: '13800138005', check_in: today, check_out: tomorrow, guests: 6, deposit: 800, status: 'checked_in', created_at: new Date().toISOString() }
    ],
    orders: [
      { id: 1, table_no: 'A1', dishes: '[{"name":"红烧肉","quantity":1},{"name":"炒青菜","quantity":2},{"name":"土鸡汤","quantity":1}]', status: 'pending', created_at: new Date().toISOString() },
      { id: 2, table_no: 'A2', dishes: '[{"name":"清蒸鱼","quantity":1},{"name":"豆腐煲","quantity":1}]', status: 'cooking', created_at: new Date().toISOString() },
      { id: 3, table_no: 'B1', dishes: '[{"name":"腊肉炒饭","quantity":2},{"name":"凉拌黄瓜","quantity":1}]', status: 'completed', created_at: new Date().toISOString() },
      { id: 4, table_no: 'B2', dishes: '[{"name":"农家小炒肉","quantity":2},{"name":"蒜蓉西兰花","quantity":1},{"name":"西红柿炒蛋","quantity":1}]', status: 'pending', created_at: new Date().toISOString() },
      { id: 5, table_no: 'C1', dishes: '[{"name":"土鸡汤","quantity":2},{"name":"红烧肉","quantity":2}]', status: 'pending', created_at: new Date().toISOString() }
    ],
    inventory: [
      { id: 1, name: '土鸡', quantity: 8, min_stock: 10, unit: '只' },
      { id: 2, name: '土鸡蛋', quantity: 50, min_stock: 30, unit: '个' },
      { id: 3, name: '青菜', quantity: 12, min_stock: 15, unit: '斤' },
      { id: 4, name: '豆腐', quantity: 30, min_stock: 20, unit: '块' },
      { id: 5, name: '腊肉', quantity: 8, min_stock: 10, unit: '斤' },
      { id: 6, name: '鲜鱼', quantity: 12, min_stock: 8, unit: '条' },
      { id: 7, name: '大米', quantity: 50, min_stock: 40, unit: '斤' },
      { id: 8, name: '花生油', quantity: 15, min_stock: 10, unit: '桶' },
      { id: 9, name: '五花肉', quantity: 15, min_stock: 12, unit: '斤' },
      { id: 10, name: '西兰花', quantity: 8, min_stock: 10, unit: '斤' }
    ],
    room_status_log: [],
    users: [
      { id: 1, username: 'boss', password: '123456', role: 'boss' },
      { id: 2, username: 'chef', password: '123456', role: 'chef' },
      { id: 3, username: 'housekeeper', password: '123456', role: 'housekeeper' },
      { id: 4, username: 'staff', password: '123456', role: 'staff' }
    ]
  }
}

function getData(): DatabaseData {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    return JSON.parse(stored)
  }
  const data = initSampleData()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  return data
}

function saveData(data: DatabaseData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getAllRooms(): Room[] {
  return getData().rooms
}

export function getAllReservations(): Reservation[] {
  return getData().reservations
}

export function getAllOrders(): Order[] {
  return getData().orders
}

export function getAllInventory(): InventoryItem[] {
  return getData().inventory
}

export function getAllLogs(): RoomStatusLog[] {
  return getData().room_status_log.sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at)).slice(0, 50)
}

export function getAllUsers(): User[] {
  return getData().users
}

export function getUserByUsername(username: string): User | undefined {
  return getData().users.find(u => u.username === username)
}

export function addRoom(name: string, type: string, price: number, capacity: number) {
  const data = getData()
  const newId = Math.max(...data.rooms.map(r => r.id), 0) + 1
  data.rooms.push({ id: newId, name, type, price, status: 'available', capacity })
  saveData(data)
}

export function deleteRoom(id: number) {
  const data = getData()
  data.rooms = data.rooms.filter(r => r.id !== id)
  saveData(data)
}

export function updateRoomStatus(roomId: number, status: string) {
  const data = getData()
  const room = data.rooms.find(r => r.id === roomId)
  if (room) {
    room.status = status
    saveData(data)
  }
}

export function addReservation(roomId: number, guestName: string, phone: string, checkIn: string, checkOut: string, guests: number, deposit: number) {
  const data = getData()
  const newId = Math.max(...data.reservations.map(r => r.id), 0) + 1
  data.reservations.push({
    id: newId,
    room_id: roomId,
    guest_name: guestName,
    phone,
    check_in: checkIn,
    check_out: checkOut,
    guests,
    deposit,
    status: 'pending',
    created_at: new Date().toISOString()
  })
  saveData(data)
}

export function updateReservationStatus(reservationId: number, status: string) {
  const data = getData()
  const reservation = data.reservations.find(r => r.id === reservationId)
  if (reservation) {
    reservation.status = status
    saveData(data)
  }
}

export function addOrder(tableNo: string, dishes: string) {
  const data = getData()
  const newId = Math.max(...data.orders.map(o => o.id), 0) + 1
  data.orders.push({
    id: newId,
    table_no: tableNo,
    dishes,
    status: 'pending',
    created_at: new Date().toISOString()
  })
  saveData(data)
}

export function updateOrderStatus(orderId: number, status: string) {
  const data = getData()
  const order = data.orders.find(o => o.id === orderId)
  if (order) {
    order.status = status
    saveData(data)
  }
}

export function addInventoryItem(name: string, quantity: number, minStock: number, unit: string) {
  const data = getData()
  const newId = Math.max(...data.inventory.map(i => i.id), 0) + 1
  data.inventory.push({ id: newId, name, quantity, min_stock: minStock, unit })
  saveData(data)
}

export function updateInventoryItem(id: number, name: string, quantity: number, minStock: number, unit: string) {
  const data = getData()
  const item = data.inventory.find(i => i.id === id)
  if (item) {
    item.name = name
    item.quantity = quantity
    item.min_stock = minStock
    item.unit = unit
    saveData(data)
  }
}

export function deleteInventoryItem(id: number) {
  const data = getData()
  data.inventory = data.inventory.filter(i => i.id !== id)
  saveData(data)
}

export function updateInventoryStock(id: number, delta: number) {
  const data = getData()
  const item = data.inventory.find(i => i.id === id)
  if (item) {
    item.quantity = Math.max(0, item.quantity + delta)
    saveData(data)
  }
}

export function addStatusLog(roomId: number, status: string, changedBy: string, note: string) {
  const data = getData()
  const newId = Math.max(...data.room_status_log.map(l => l.id), 0) + 1
  data.room_status_log.push({
    id: newId,
    room_id: roomId,
    status,
    changed_by: changedBy,
    changed_at: new Date().toISOString(),
    note
  })
  saveData(data)
}

export function getRoomById(id: number): Room | undefined {
  return getData().rooms.find(r => r.id === id)
}

export function getReservationById(id: number): Reservation | undefined {
  return getData().reservations.find(r => r.id === id)
}

export function batchCheckIn(roomIds: number[], operator: string) {
  const data = getData()
  for (const roomId of roomIds) {
    const room = data.rooms.find(r => r.id === roomId)
    const reservation = data.reservations.find(r => r.room_id === roomId && r.status === 'pending')
    if (room && reservation) {
      room.status = 'occupied'
      reservation.status = 'checked_in'
      const newLogId = Math.max(...data.room_status_log.map(l => l.id), 0) + 1
      data.room_status_log.push({
        id: newLogId,
        room_id: roomId,
        status: 'occupied',
        changed_by: operator,
        changed_at: new Date().toISOString(),
        note: `批量入住 - 客人 ${reservation.guest_name}`
      })
    }
  }
  saveData(data)
}

export function batchCheckOut(roomIds: number[], operator: string) {
  const data = getData()
  for (const roomId of roomIds) {
    const room = data.rooms.find(r => r.id === roomId)
    const reservation = data.reservations.find(r => r.room_id === roomId && r.status === 'checked_in')
    if (room && reservation) {
      room.status = 'cleaning'
      reservation.status = 'completed'
      const newLogId = Math.max(...data.room_status_log.map(l => l.id), 0) + 1
      data.room_status_log.push({
        id: newLogId,
        room_id: roomId,
        status: 'cleaning',
        changed_by: operator,
        changed_at: new Date().toISOString(),
        note: `批量退房 - 客人 ${reservation.guest_name}`
      })
    }
  }
  saveData(data)
}

export function batchCleanComplete(roomIds: number[], operator: string) {
  const data = getData()
  for (const roomId of roomIds) {
    const room = data.rooms.find(r => r.id === roomId)
    if (room && room.status === 'cleaning') {
      room.status = 'available'
      const newLogId = Math.max(...data.room_status_log.map(l => l.id), 0) + 1
      data.room_status_log.push({
        id: newLogId,
        room_id: roomId,
        status: 'available',
        changed_by: operator,
        changed_at: new Date().toISOString(),
        note: '批量打扫完成'
      })
    }
  }
  saveData(data)
}

export function resetData() {
  localStorage.removeItem(STORAGE_KEY)
  return initSampleData()
}