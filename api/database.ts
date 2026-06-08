import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, '..', 'data.db')

const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('supervisor','floor_leader','attendant','linen_staff','engineer')),
    floor INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    room_number TEXT UNIQUE NOT NULL,
    floor INTEGER NOT NULL,
    room_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'vacant' CHECK(status IN ('vacant','occupied','cleaning','inspecting','maintenance')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS timeline_events (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES rooms(id),
    event_type TEXT NOT NULL,
    description TEXT,
    operator_id TEXT NOT NULL REFERENCES users(id),
    event_time TEXT DEFAULT (datetime('now')),
    metadata TEXT
  );

  CREATE TABLE IF NOT EXISTS inspections (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES rooms(id),
    inspector_id TEXT NOT NULL REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','in_progress','completed','reviewed')),
    scheduled_at TEXT,
    completed_at TEXT,
    reviewed_by TEXT REFERENCES users(id),
    reviewed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS inspection_items (
    id TEXT PRIMARY KEY,
    inspection_id TEXT NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    checked INTEGER DEFAULT 0,
    is_missed INTEGER DEFAULT 0,
    note TEXT
  );

  CREATE TABLE IF NOT EXISTS linen_requisitions (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES rooms(id),
    operator_id TEXT NOT NULL REFERENCES users(id),
    requisition_time TEXT DEFAULT (datetime('now')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','fulfilled','returned')),
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS linen_requisition_items (
    id TEXT PRIMARY KEY,
    requisition_id TEXT NOT NULL REFERENCES linen_requisitions(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    quantity INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS linen_returns (
    id TEXT PRIMARY KEY,
    requisition_id TEXT NOT NULL REFERENCES linen_requisitions(id),
    operator_id TEXT NOT NULL REFERENCES users(id),
    return_time TEXT DEFAULT (datetime('now')),
    verified_by TEXT REFERENCES users(id),
    verified_at TEXT,
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS linen_return_items (
    id TEXT PRIMARY KEY,
    return_id TEXT NOT NULL REFERENCES linen_returns(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    quantity INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS linen_losses (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES rooms(id),
    requisition_id TEXT REFERENCES linen_requisitions(id),
    operator_id TEXT NOT NULL REFERENCES users(id),
    category TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    loss_type TEXT NOT NULL CHECK(loss_type IN ('wear','stain','missing')),
    description TEXT,
    status TEXT NOT NULL DEFAULT 'registered' CHECK(status IN ('registered','confirmed','dispatched','replaced')),
    confirmed_by TEXT REFERENCES users(id),
    confirmed_at TEXT,
    maintenance_order_id TEXT REFERENCES maintenance_orders(id),
    loss_date TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS linen_status_logs (
    id TEXT PRIMARY KEY,
    target_type TEXT NOT NULL CHECK(target_type IN ('requisition','return','loss')),
    target_id TEXT NOT NULL,
    old_status TEXT,
    new_status TEXT NOT NULL,
    operator_id TEXT NOT NULL REFERENCES users(id),
    note TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS maintenance_orders (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES rooms(id),
    reported_by TEXT NOT NULL REFERENCES users(id),
    assigned_to TEXT REFERENCES users(id),
    fault_type TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('low','normal','high','urgent')),
    status TEXT NOT NULL DEFAULT 'reported' CHECK(status IN ('reported','assigned','in_progress','completed','verified')),
    reported_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS leftover_items (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES rooms(id),
    found_by TEXT NOT NULL REFERENCES users(id),
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    storage_location TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'found' CHECK(status IN ('found','stored','claimed','disposed')),
    found_at TEXT DEFAULT (datetime('now')),
    claimed_at TEXT,
    claimed_by_name TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_rooms_floor ON rooms(floor);
  CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
  CREATE INDEX IF NOT EXISTS idx_timeline_room ON timeline_events(room_id);
  CREATE INDEX IF NOT EXISTS idx_timeline_operator ON timeline_events(operator_id);
  CREATE INDEX IF NOT EXISTS idx_inspections_room ON inspections(room_id);
  CREATE INDEX IF NOT EXISTS idx_inspections_inspector ON inspections(inspector_id);
  CREATE INDEX IF NOT EXISTS idx_linen_requisitions_room ON linen_requisitions(room_id);
  CREATE INDEX IF NOT EXISTS idx_linen_requisitions_operator ON linen_requisitions(operator_id);
  CREATE INDEX IF NOT EXISTS idx_linen_losses_date ON linen_losses(loss_date);
  CREATE INDEX IF NOT EXISTS idx_linen_losses_status ON linen_losses(status);
  CREATE INDEX IF NOT EXISTS idx_linen_losses_requisition ON linen_losses(requisition_id);
  CREATE INDEX IF NOT EXISTS idx_linen_status_logs_target ON linen_status_logs(target_type, target_id);
  CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_orders(status);
  CREATE INDEX IF NOT EXISTS idx_leftovers_status ON leftover_items(status);
`)

const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
if (userCount.count === 0) {
  const insertUser = db.prepare(`
    INSERT INTO users (id, username, password_hash, name, role, floor, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const users = [
    { id: uuidv4(), username: 'supervisor', password_hash: 'password123', name: '王主管', role: 'supervisor', floor: null },
    { id: uuidv4(), username: 'leader3', password_hash: 'password123', name: '李领班', role: 'floor_leader', floor: 3 },
    { id: uuidv4(), username: 'leader5', password_hash: 'password123', name: '张领班', role: 'floor_leader', floor: 5 },
    { id: uuidv4(), username: 'attendant1', password_hash: 'password123', name: '赵清洁', role: 'attendant', floor: 3 },
    { id: uuidv4(), username: 'attendant2', password_hash: 'password123', name: '陈清洁', role: 'attendant', floor: 3 },
    { id: uuidv4(), username: 'attendant3', password_hash: 'password123', name: '刘清洁', role: 'attendant', floor: 5 },
    { id: uuidv4(), username: 'linen1', password_hash: 'password123', name: '周布草', role: 'linen_staff', floor: null },
    { id: uuidv4(), username: 'engineer1', password_hash: 'password123', name: '吴工程师', role: 'engineer', floor: null },
  ]

  const insertedUsers: { id: string; username: string; name: string; role: string; floor: number | null }[] = []
  for (const u of users) {
    insertUser.run(u.id, u.username, u.password_hash, u.name, u.role, u.floor, new Date().toISOString())
    insertedUsers.push(u)
  }

  const supervisor = insertedUsers[0]
  const leader3 = insertedUsers[1]
  const leader5 = insertedUsers[2]
  const attendant1 = insertedUsers[3]
  const attendant2 = insertedUsers[4]
  const attendant3 = insertedUsers[5]
  const linenStaff = insertedUsers[6]
  const engineer = insertedUsers[7]

  const insertRoom = db.prepare(`
    INSERT INTO rooms (id, room_number, floor, room_type, status, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const roomConfigs: { room_number: string; floor: number; room_type: string; status: string }[] = []
  const statuses3 = ['vacant','occupied','cleaning','inspecting','maintenance','vacant','occupied','vacant','occupied','cleaning']
  const statuses4 = ['occupied','vacant','cleaning','vacant','inspecting','occupied','maintenance','vacant','occupied','vacant']
  const statuses5 = ['vacant','occupied','vacant','cleaning','vacant','occupied','occupied','vacant','inspecting','maintenance']

  for (let i = 0; i < 10; i++) {
    roomConfigs.push({ room_number: `${3}${String(i + 1).padStart(2, '0')}`, floor: 3, room_type: i % 3 === 0 ? 'suite' : i % 3 === 1 ? 'standard' : 'deluxe', status: statuses3[i] })
    roomConfigs.push({ room_number: `${4}${String(i + 1).padStart(2, '0')}`, floor: 4, room_type: i % 3 === 0 ? 'suite' : i % 3 === 1 ? 'standard' : 'deluxe', status: statuses4[i] })
    roomConfigs.push({ room_number: `${5}${String(i + 1).padStart(2, '0')}`, floor: 5, room_type: i % 3 === 0 ? 'suite' : i % 3 === 1 ? 'standard' : 'deluxe', status: statuses5[i] })
  }

  const insertedRooms: { id: string; room_number: string; floor: number }[] = []
  for (const r of roomConfigs) {
    const id = uuidv4()
    insertRoom.run(id, r.room_number, r.floor, r.room_type, r.status, new Date().toISOString())
    insertedRooms.push({ id, room_number: r.room_number, floor: r.floor })
  }

  const insertTimeline = db.prepare(`
    INSERT INTO timeline_events (id, room_id, event_type, description, operator_id, event_time, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const now = new Date()
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000).toISOString()

  insertTimeline.run(uuidv4(), insertedRooms[0].id, 'status_change', '房间状态变更为空闲', supervisor.id, hoursAgo(24), JSON.stringify({ oldStatus: 'cleaning', newStatus: 'vacant' }))
  insertTimeline.run(uuidv4(), insertedRooms[1].id, 'status_change', '房间状态变更为住客', leader3.id, hoursAgo(20), JSON.stringify({ oldStatus: 'vacant', newStatus: 'occupied' }))
  insertTimeline.run(uuidv4(), insertedRooms[2].id, 'status_change', '房间状态变更为打扫中', attendant1.id, hoursAgo(18), JSON.stringify({ oldStatus: 'occupied', newStatus: 'cleaning' }))
  insertTimeline.run(uuidv4(), insertedRooms[3].id, 'status_change', '房间状态变更为查房中', leader3.id, hoursAgo(12), JSON.stringify({ oldStatus: 'cleaning', newStatus: 'inspecting' }))
  insertTimeline.run(uuidv4(), insertedRooms[0].id, 'linen_requisition', '领用布草3套', attendant1.id, hoursAgo(10), JSON.stringify({ requisitionId: 'pending' }))
  insertTimeline.run(uuidv4(), insertedRooms[10].id, 'status_change', '房间状态变更为住客', leader5.id, hoursAgo(8), JSON.stringify({ oldStatus: 'vacant', newStatus: 'occupied' }))
  insertTimeline.run(uuidv4(), insertedRooms[4].id, 'maintenance_reported', '报修：空调故障', attendant2.id, hoursAgo(6), JSON.stringify({ orderId: 'pending' }))
  insertTimeline.run(uuidv4(), insertedRooms[29].id, 'leftover_found', '发现遗留物品：手表', attendant3.id, hoursAgo(4), JSON.stringify({ leftoverId: 'pending' }))

  const insertInspection = db.prepare(`
    INSERT INTO inspections (id, room_id, inspector_id, status, scheduled_at, completed_at, reviewed_by, reviewed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertInspectionItem = db.prepare(`
    INSERT INTO inspection_items (id, inspection_id, item_name, checked, is_missed, note)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const insp1Id = uuidv4()
  insertInspection.run(insp1Id, insertedRooms[0].id, leader3.id, 'reviewed', hoursAgo(22), hoursAgo(21), supervisor.id, hoursAgo(20))
  const inspItems1 = [
    { name: '床铺整理', checked: 1, is_missed: 0, note: '' },
    { name: '卫生间清洁', checked: 1, is_missed: 0, note: '' },
    { name: '毛巾补充', checked: 1, is_missed: 1, note: '缺少一条浴巾' },
    { name: '迷你吧检查', checked: 1, is_missed: 0, note: '' },
    { name: '电器设备', checked: 1, is_missed: 0, note: '' },
  ]
  for (const item of inspItems1) {
    insertInspectionItem.run(uuidv4(), insp1Id, item.name, item.checked, item.is_missed, item.note)
  }

  const insp2Id = uuidv4()
  insertInspection.run(insp2Id, insertedRooms[3].id, leader3.id, 'in_progress', hoursAgo(12), null, null, null)
  const inspItems2 = [
    { name: '床铺整理', checked: 1, is_missed: 0, note: '' },
    { name: '卫生间清洁', checked: 0, is_missed: 0, note: '' },
    { name: '毛巾补充', checked: 0, is_missed: 0, note: '' },
    { name: '迷你吧检查', checked: 1, is_missed: 0, note: '' },
    { name: '电器设备', checked: 0, is_missed: 0, note: '' },
  ]
  for (const item of inspItems2) {
    insertInspectionItem.run(uuidv4(), insp2Id, item.name, item.checked, item.is_missed, item.note)
  }

  const insp3Id = uuidv4()
  insertInspection.run(insp3Id, insertedRooms[10].id, leader5.id, 'completed', hoursAgo(6), hoursAgo(5), null, null)
  const inspItems3 = [
    { name: '床铺整理', checked: 1, is_missed: 0, note: '' },
    { name: '卫生间清洁', checked: 1, is_missed: 0, note: '' },
    { name: '毛巾补充', checked: 1, is_missed: 1, note: '缺少面巾' },
    { name: '迷你吧检查', checked: 1, is_missed: 0, note: '' },
    { name: '电器设备', checked: 1, is_missed: 1, note: '电视遥控器电池需更换' },
  ]
  for (const item of inspItems3) {
    insertInspectionItem.run(uuidv4(), insp3Id, item.name, item.checked, item.is_missed, item.note)
  }

  const insertRequisition = db.prepare(`
    INSERT INTO linen_requisitions (id, room_id, operator_id, requisition_time, status, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const insertRequisitionItem = db.prepare(`
    INSERT INTO linen_requisition_items (id, requisition_id, category, quantity)
    VALUES (?, ?, ?, ?)
  `)

  const req1Id = uuidv4()
  insertRequisition.run(req1Id, insertedRooms[0].id, attendant1.id, hoursAgo(10), 'fulfilled', '退房后补充布草')
  const req1Items = [
    { category: 'bedsheet', quantity: 2 },
    { category: 'pillowcase', quantity: 4 },
    { category: 'bath_towel', quantity: 2 },
    { category: 'face_towel', quantity: 2 },
  ]
  for (const item of req1Items) {
    insertRequisitionItem.run(uuidv4(), req1Id, item.category, item.quantity)
  }

  const req2Id = uuidv4()
  insertRequisition.run(req2Id, insertedRooms[1].id, attendant2.id, hoursAgo(8), 'pending', null)
  const req2Items = [
    { category: 'bedsheet', quantity: 1 },
    { category: 'pillowcase', quantity: 2 },
    { category: 'bath_towel', quantity: 1 },
  ]
  for (const item of req2Items) {
    insertRequisitionItem.run(uuidv4(), req2Id, item.category, item.quantity)
  }

  const req3Id = uuidv4()
  insertRequisition.run(req3Id, insertedRooms[10].id, attendant3.id, hoursAgo(4), 'returned', '住客退房归还')
  const req3Items = [
    { category: 'bedsheet', quantity: 2 },
    { category: 'pillowcase', quantity: 4 },
    { category: 'bath_towel', quantity: 2 },
    { category: 'face_towel', quantity: 2 },
  ]
  for (const item of req3Items) {
    insertRequisitionItem.run(uuidv4(), req3Id, item.category, item.quantity)
  }

  const insertReturn = db.prepare(`
    INSERT INTO linen_returns (id, requisition_id, operator_id, return_time, verified_by, verified_at, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const insertReturnItem = db.prepare(`
    INSERT INTO linen_return_items (id, return_id, category, quantity)
    VALUES (?, ?, ?, ?)
  `)

  const ret1Id = uuidv4()
  insertReturn.run(ret1Id, req3Id, linenStaff.id, hoursAgo(2), supervisor.id, hoursAgo(1), '枕套少1条，已登记损耗')
  const ret1Items = [
    { category: 'bedsheet', quantity: 2 },
    { category: 'pillowcase', quantity: 3 },
    { category: 'bath_towel', quantity: 1 },
    { category: 'face_towel', quantity: 2 },
  ]
  for (const item of ret1Items) {
    insertReturnItem.run(uuidv4(), ret1Id, item.category, item.quantity)
  }

  const insertLoss = db.prepare(`
    INSERT INTO linen_losses (id, room_id, requisition_id, operator_id, category, quantity, loss_type, description, status, confirmed_by, confirmed_at, maintenance_order_id, loss_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const dispatchedLossId = uuidv4()
  insertLoss.run(uuidv4(), insertedRooms[10].id, req3Id, linenStaff.id, 'pillowcase', 1, 'missing', '归还时少一条枕套', 'confirmed', supervisor.id, hoursAgo(1), null, hoursAgo(2))
  insertLoss.run(dispatchedLossId, insertedRooms[10].id, req3Id, linenStaff.id, 'bath_towel', 1, 'stain', '浴巾有顽固污渍无法清洗', 'dispatched', supervisor.id, hoursAgo(1), null, hoursAgo(2))

  const insertMaintenance = db.prepare(`
    INSERT INTO maintenance_orders (id, room_id, reported_by, assigned_to, fault_type, description, priority, status, reported_at, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const mntFromLinenId = uuidv4()
  insertMaintenance.run(mntFromLinenId, insertedRooms[10].id, supervisor.id, engineer.id, 'linen_damage', '布草损耗派单：浴巾污渍处理', 'normal', 'assigned', hoursAgo(1), null)
  insertMaintenance.run(uuidv4(), insertedRooms[4].id, attendant2.id, engineer.id, 'air_conditioning', '空调制冷效果差，房间温度降不下来', 'high', 'assigned', hoursAgo(6), null)
  insertMaintenance.run(uuidv4(), insertedRooms[7].id, leader3.id, null, 'plumbing', '卫生间水龙头漏水', 'normal', 'reported', hoursAgo(3), null)
  insertMaintenance.run(uuidv4(), insertedRooms[29].id, attendant3.id, engineer.id, 'electrical', '房间灯泡损坏', 'low', 'completed', hoursAgo(48), hoursAgo(24))

  db.prepare('UPDATE linen_losses SET maintenance_order_id = ? WHERE id = ?').run(mntFromLinenId, dispatchedLossId)

  const insertLeftover = db.prepare(`
    INSERT INTO leftover_items (id, room_id, found_by, description, category, storage_location, status, found_at, claimed_at, claimed_by_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  insertLeftover.run(uuidv4(), insertedRooms[29].id, attendant3.id, '一块银色手表', 'jewelry', '前台保险箱', 'stored', hoursAgo(4), null, null)
  insertLeftover.run(uuidv4(), insertedRooms[1].id, attendant1.id, '黑色钱包一个', 'valuable', '前台保险箱', 'claimed', hoursAgo(48), hoursAgo(24), '张先生')
  insertLeftover.run(uuidv4(), insertedRooms[10].id, attendant3.id, '充电器一根', 'electronics', '失物柜A-03', 'found', hoursAgo(1), null, null)

  const insertStatusLog = db.prepare(`
    INSERT INTO linen_status_logs (id, target_type, target_id, old_status, new_status, operator_id, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  insertStatusLog.run(uuidv4(), 'requisition', req1Id, null, 'pending', attendant1.id, '提交领用申请', hoursAgo(10))
  insertStatusLog.run(uuidv4(), 'requisition', req1Id, 'pending', 'fulfilled', linenStaff.id, '确认发放', hoursAgo(9))
  insertStatusLog.run(uuidv4(), 'requisition', req2Id, null, 'pending', attendant2.id, '提交领用申请', hoursAgo(8))
  insertStatusLog.run(uuidv4(), 'requisition', req3Id, null, 'pending', attendant3.id, '提交领用申请', hoursAgo(4))
  insertStatusLog.run(uuidv4(), 'requisition', req3Id, 'pending', 'fulfilled', linenStaff.id, '确认发放', hoursAgo(3))
  insertStatusLog.run(uuidv4(), 'requisition', req3Id, 'fulfilled', 'returned', linenStaff.id, '归还完成', hoursAgo(2))
  const pillowLossId = db.prepare('SELECT id FROM linen_losses WHERE category = ? AND requisition_id = ?').pluck().get('pillowcase', req3Id) as string
  insertStatusLog.run(uuidv4(), 'loss', pillowLossId, null, 'registered', linenStaff.id, '登记枕套缺失', hoursAgo(2))
  insertStatusLog.run(uuidv4(), 'loss', pillowLossId, 'registered', 'confirmed', supervisor.id, '主管确认损耗', hoursAgo(1))
  insertStatusLog.run(uuidv4(), 'loss', dispatchedLossId, null, 'registered', linenStaff.id, '登记浴巾污渍', hoursAgo(2))
  insertStatusLog.run(uuidv4(), 'loss', dispatchedLossId, 'registered', 'confirmed', supervisor.id, '主管确认损耗', hoursAgo(1))
  insertStatusLog.run(uuidv4(), 'loss', dispatchedLossId, 'confirmed', 'dispatched', supervisor.id, '派单工程师：吴工程师', hoursAgo(1))

  console.log('Database seeded successfully')
}

export default db
