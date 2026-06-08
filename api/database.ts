import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, 'data.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS registrations (
      id TEXT PRIMARY KEY,
      event_name TEXT NOT NULL,
      team_name TEXT NOT NULL,
      player_count INTEGER NOT NULL,
      device_requirement TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      submitted_by TEXT NOT NULL,
      confirmed_by TEXT,
      submitted_at TEXT NOT NULL,
      confirmed_at TEXT,
      deadline_at TEXT NOT NULL,
      current_owner_role TEXT NOT NULL DEFAULT '赛事运营',
      owner_since TEXT NOT NULL,
      sla_minutes INTEGER NOT NULL DEFAULT 15
    );

    CREATE TABLE IF NOT EXISTS seats (
      id TEXT PRIMARY KEY,
      seat_number TEXT NOT NULL UNIQUE,
      zone TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'available',
      current_registration_id TEXT,
      FOREIGN KEY (current_registration_id) REFERENCES registrations(id)
    );

    CREATE TABLE IF NOT EXISTS seat_allocations (
      id TEXT PRIMARY KEY,
      registration_id TEXT NOT NULL,
      seat_ids TEXT NOT NULL,
      allocated_by TEXT NOT NULL,
      confirmed_by TEXT,
      allocated_at TEXT NOT NULL,
      confirmed_at TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      conflict_reason TEXT,
      FOREIGN KEY (registration_id) REFERENCES registrations(id)
    );

    CREATE TABLE IF NOT EXISTS handover_logs (
      id TEXT PRIMARY KEY,
      registration_id TEXT NOT NULL,
      operator_role TEXT NOT NULL,
      operator_name TEXT NOT NULL,
      action TEXT NOT NULL,
      note_type TEXT NOT NULL DEFAULT 'normal',
      note TEXT NOT NULL,
      created_at TEXT NOT NULL,
      from_role TEXT,
      to_role TEXT,
      FOREIGN KEY (registration_id) REFERENCES registrations(id)
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      registration_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_size TEXT NOT NULL DEFAULT '0',
      description TEXT,
      category TEXT,
      status TEXT NOT NULL DEFAULT 'placeholder',
      uploaded_at TEXT,
      uploaded_by TEXT,
      FOREIGN KEY (registration_id) REFERENCES registrations(id)
    );

    CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
    CREATE INDEX IF NOT EXISTS idx_registrations_deadline ON registrations(deadline_at);
    CREATE INDEX IF NOT EXISTS idx_registrations_owner ON registrations(current_owner_role);
    CREATE INDEX IF NOT EXISTS idx_seats_zone ON seats(zone);
    CREATE INDEX IF NOT EXISTS idx_seats_status ON seats(status);
    CREATE INDEX IF NOT EXISTS idx_handover_logs_reg ON handover_logs(registration_id);
    CREATE INDEX IF NOT EXISTS idx_seat_allocations_reg ON seat_allocations(registration_id);
    CREATE INDEX IF NOT EXISTS idx_attachments_reg ON attachments(registration_id);
  `)

  const attachCols = db.prepare("PRAGMA table_info(attachments)").all() as { name: string }[]
  const colNames = attachCols.map(c => c.name)
  if (!colNames.includes('description')) {
    db.exec('ALTER TABLE attachments ADD COLUMN description TEXT')
  }
  if (!colNames.includes('category')) {
    db.exec('ALTER TABLE attachments ADD COLUMN category TEXT')
  }
}

let idCounter = 0
function genId(prefix: string): string {
  idCounter++
  return `${prefix}-${Date.now().toString(36)}-${idCounter.toString(36)}`
}

export function seedData() {
  createTables()

  db.exec('DELETE FROM attachments')
  db.exec('DELETE FROM handover_logs')
  db.exec('DELETE FROM seat_allocations')
  db.exec('UPDATE seats SET current_registration_id = NULL')
  db.exec('DELETE FROM seats')
  db.exec('DELETE FROM registrations')

  const now = new Date()
  const baseTime = new Date(now.getTime() - 90 * 60 * 1000)

  const t = (offsetMin: number) => new Date(baseTime.getTime() + offsetMin * 60 * 1000).toISOString()
  const nowISO = now.toISOString()

  const deadline001 = new Date(now.getTime() + 5 * 60 * 1000).toISOString()
  const deadline002 = new Date(now.getTime() + 15 * 60 * 1000).toISOString()
  const deadline003 = new Date(now.getTime() + 8 * 60 * 1000).toISOString()
  const deadline006 = new Date(now.getTime() + 10 * 60 * 1000).toISOString()
  const deadline007 = new Date(now.getTime() + 22 * 60 * 1000).toISOString()

  const insertReg = db.prepare(`
    INSERT INTO registrations (id, event_name, team_name, player_count, device_requirement, status, submitted_by, confirmed_by, submitted_at, confirmed_at, deadline_at, current_owner_role, owner_since, sla_minutes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  insertReg.run('REG-001', '王者荣耀城市赛', '星辰战队', 10, '10台高配机·B区连坐', 'pending', '网管/小张', null, t(0), null, deadline001, '赛事运营', new Date(now.getTime() - 12 * 60 * 1000).toISOString(), 10)
  insertReg.run('REG-002', '英雄联盟周末联赛', '暴风战队', 8, '8台标准机·B区连坐', 'confirmed', '赛事运营/小李', '赛事运营/小李', t(0), t(15), deadline002, '网管', new Date(now.getTime() - 20 * 60 * 1000).toISOString(), 15)
  insertReg.run('REG-003', 'CS2邀请赛', '暗影战队', 10, '5台VIP+5台A区高配', 'seating', '网管/小王', '赛事运营/小李', t(5), t(18), deadline003, '店长', new Date(now.getTime() - 18 * 60 * 1000).toISOString(), 10)
  insertReg.run('REG-004', 'DOTA2校内赛', '龙腾战队', 6, '6台A区标准机', 'completed', '网管/小张', '赛事运营/小李', t(0), t(8), new Date(now.getTime() + 60 * 60 * 1000).toISOString(), '网管', t(8), 15)
  insertReg.run('REG-005', '永劫无间杯', '破军战队', 15, '15台高配机', 'rejected', '赛事运营/小李', null, t(10), null, new Date(now.getTime() + 60 * 60 * 1000).toISOString(), '赛事运营', t(10), 15)
  insertReg.run('REG-006', 'VALORANT挑战赛', '凤凰战队', 6, '6台VIP区机器', 'escalated', '赛事运营/小李', '赛事运营/小李', t(20), t(30), deadline006, '店长', new Date(now.getTime() - 8 * 60 * 1000).toISOString(), 10)
  insertReg.run('REG-007', '和平精英战队赛', '猎鹰战队', 5, '5台标准机', 'pending', '网管/小王', null, t(78), null, deadline007, '赛事运营', new Date(now.getTime() - 2 * 60 * 1000).toISOString(), 20)

  const insertSeat = db.prepare(`
    INSERT INTO seats (id, seat_number, zone, status, current_registration_id) VALUES (?, ?, ?, ?, ?)
  `)

  for (let i = 1; i <= 10; i++) {
    const status = i <= 6 ? 'occupied' : 'available'
    const regId = i <= 6 ? 'REG-004' : null
    insertSeat.run(`s-a${i}`, `A${i}`, 'A', status, regId)
  }

  for (let i = 1; i <= 10; i++) {
    const status = i <= 8 ? 'occupied' : 'available'
    const regId = i <= 8 ? 'REG-002' : null
    insertSeat.run(`s-b${i}`, `B${i}`, 'B', status, regId)
  }

  for (let i = 1; i <= 8; i++) {
    const status = i <= 2 ? 'reserved' : 'available'
    const regId = i <= 2 ? 'REG-003' : null
    insertSeat.run(`s-c${i}`, `C${i}`, 'C', status, regId)
  }

  for (let i = 1; i <= 6; i++) {
    const status = i <= 2 ? 'reserved' : i <= 4 ? 'maintenance' : 'available'
    const regId = i <= 2 ? 'REG-003' : null
    insertSeat.run(`s-v${i}`, `V${i}`, 'VIP', status, regId)
  }

  const insertAlloc = db.prepare(`
    INSERT INTO seat_allocations (id, registration_id, seat_ids, allocated_by, confirmed_by, allocated_at, confirmed_at, status, conflict_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  insertAlloc.run('alloc-003', 'REG-003', 's-v1,s-v2,s-c1,s-c2,s-a7,s-a8,s-a9,s-a10,s-c3,s-c4', '网管/小王', null, t(45), null, 'pending', 'VIP区仅2台可用，散客占A区部分座位，需跨区调配')
  insertAlloc.run('alloc-004', 'REG-004', 's-a1,s-a2,s-a3,s-a4,s-a5,s-a6', '网管/小张', '店长/赵总', t(25), t(35), 'confirmed', null)
  insertAlloc.run('alloc-006-rev', 'REG-006', 's-v1,s-v2,s-c1,s-c2,s-c3,s-c4', '网管/小王', null, t(42), null, 'released', 'VIP区维修中，C区不够6台连坐')

  const insertLog = db.prepare(`
    INSERT INTO handover_logs (id, registration_id, operator_role, operator_name, action, note_type, note, created_at, from_role, to_role)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  insertLog.run('log-001-1', 'REG-001', '网管', '小张', '提交报名', 'normal', '5v5赛事10人，客户要求B区连坐，已口头和客户确认时间', t(0), null, '赛事运营')
  insertLog.run('log-001-2', 'REG-001', '赛事运营', '小李', '添加备注', 'urgent', '客户催了3次了，说别的网咖也能办，再不确认就走了', t(12), null, null)
  insertLog.run('log-001-3', 'REG-001', '网管', '小张', '添加备注', 'dispute', '我报上去快1小时了运营还没确认，客户在前台闹', t(18), null, null)
  insertLog.run('log-001-4', 'REG-001', '店长', '赵总', '添加备注', 'urgent', '小李！这是大客户，立刻处理！', t(22), null, null)

  insertLog.run('log-002-1', 'REG-002', '赛事运营', '小李', '提交报名', 'normal', '8人参赛，需要8台机器B区连坐', t(0), null, '赛事运营')
  insertLog.run('log-002-2', 'REG-002', '赛事运营', '小李', '确认报名', 'normal', '已核实参赛队伍和设备需求', t(15), '赛事运营', '网管')
  insertLog.run('log-002-3', 'REG-002', '赛事运营', '小李', '添加备注', 'urgent', '客户强调B区8台连坐，中途不能换区', t(30), null, null)
  insertLog.run('log-002-4', 'REG-002', '网管', '小张', '添加备注', 'dispute', 'B区只有2台空机！8台连坐根本排不开，确认的时候怎么不先看座？这是运营的锅', t(38), null, null)
  insertLog.run('log-002-5', 'REG-002', '赛事运营', '小李', '添加备注', 'dispute', '报名时你网管也没提示座位不够啊，你负责分配座位你不知道吗', t(42), null, null)

  insertLog.run('log-003-1', 'REG-003', '网管', '小王', '提交报名', 'urgent', '10人比赛，客户指定VIP区，预算高，必须优先安排', t(5), null, '赛事运营')
  insertLog.run('log-003-2', 'REG-003', '赛事运营', '小李', '确认报名', 'normal', '确认参赛人数和设备需求', t(18), '赛事运营', '网管')
  insertLog.run('log-003-3', 'REG-003', '网管', '小王', '分配座位', 'dispute', 'VIP区只有2台可用，其余要从A区调配，但A区有散客在上机', t(45), '网管', '店长')
  insertLog.run('log-003-4', 'REG-003', '赛事运营', '小李', '添加备注', 'supplement', '散客到期时间是14:30，建议等散客下机后再分配', t(50), null, null)
  insertLog.run('log-003-5', 'REG-003', '网管', '小王', '添加备注', 'dispute', '等？客户说14:00就要入场调试设备，等不了', t(53), null, null)
  insertLog.run('log-003-6', 'REG-003', '店长', '赵总', '添加备注', 'urgent', '不要等了，我拍板：VIP2台+C区调配，A区留给散客', t(55), null, null)

  insertLog.run('log-004-1', 'REG-004', '网管', '小张', '提交报名', 'normal', '6人参赛，A区标准机即可', t(0), null, '赛事运营')
  insertLog.run('log-004-2', 'REG-004', '赛事运营', '小李', '确认报名', 'normal', '已确认，A区6台可用', t(8), '赛事运营', '网管')
  insertLog.run('log-004-3', 'REG-004', '网管', '小张', '分配座位', 'normal', 'A区1-6号，无冲突', t(25), '网管', '店长')
  insertLog.run('log-004-4', 'REG-004', '店长', '赵总', '终审通过', 'normal', '无冲突，流程完成', t(35), '店长', null)

  insertLog.run('log-005-1', 'REG-005', '赛事运营', '小李', '提交报名', 'normal', '15人大型赛事，客户要求全部高配', t(10), null, '赛事运营')
  insertLog.run('log-005-2', 'REG-005', '赛事运营', '小李', '添加备注', 'urgent', '人数超预期，15台高配机只有8台可用，严重不足', t(20), null, null)
  insertLog.run('log-005-3', 'REG-005', '网管', '小张', '添加备注', 'urgent', '高配机全被占了，VIP在修，B区已满，不可能凑出15台', t(25), null, null)
  insertLog.run('log-005-4', 'REG-005', '店长', '赵总', '驳回报名', 'dispute', '场地承载力不足，本次无法承接，已向客户道歉并建议改期或拆分', t(30), '店长', null)

  insertLog.run('log-006-1', 'REG-006', '赛事运营', '小李', '提交报名', 'normal', '6人VALORANT，客户要求VIP区', t(20), null, '赛事运营')
  insertLog.run('log-006-2', 'REG-006', '赛事运营', '小李', '确认报名', 'normal', '已确认，VIP区应该够用', t(30), '赛事运营', '网管')
  insertLog.run('log-006-3', 'REG-006', '网管', '小张', '添加备注', 'dispute', '6台VIP？只有2台可用，4台在维修，确认前不看可用量？', t(40), null, null)
  insertLog.run('log-006-4', 'REG-006', '赛事运营', '小李', '添加备注', 'dispute', '报名时你说VIP没问题，现在又说不够，谁误导谁？', t(45), null, null)
  insertLog.run('log-006-5', 'REG-006', '网管', '小张', '添加备注', 'dispute', '我说的是"VIP区可以安排"，不是"6台VIP随便用"，你确认的时候核实了吗', t(50), null, null)
  insertLog.run('log-006-6', 'REG-006', '赛事运营', '小李', '升级处理', 'urgent', '网管和运营对责任有争议，提交店长裁决', t(55), '赛事运营', '店长')
  insertLog.run('log-006-7', 'REG-006', '店长', '赵总', '添加备注', 'urgent', '双方都有疏忽。我决定：VIP2台+C区3台+A区1台，差的一台等C区散客下机后补上', t(62), null, null)

  insertLog.run('log-007-1', 'REG-007', '网管', '小王', '提交报名', 'normal', '5人参赛，标准机即可', t(78), null, '赛事运营')

  const insertAttach = db.prepare(`
    INSERT INTO attachments (id, registration_id, file_name, file_size, description, category, status, uploaded_at, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  insertAttach.run('att-001-1', 'REG-001', '报名表.pdf', '256KB', '队伍报名表扫描件', '聊天记录', 'placeholder', null, null)
  insertAttach.run('att-001-2', 'REG-001', '赛制说明.docx', '128KB', '官方赛制规则文档', '聊天记录', 'placeholder', null, null)
  insertAttach.run('att-002-1', 'REG-002', '队伍名单.xlsx', '64KB', '参赛队员信息', '聊天记录', 'uploaded', t(15), '赛事运营/小李')
  insertAttach.run('att-002-2', 'REG-002', '赛程安排.pdf', '320KB', '赛程安排表', '聊天记录', 'placeholder', null, null)
  insertAttach.run('att-003-1', 'REG-003', '赛事规则.pdf', '512KB', 'CS2赛事规则', '聊天记录', 'uploaded', t(18), '赛事运营/小李')
  insertAttach.run('att-003-2', 'REG-003', '参赛名单.docx', '96KB', '参赛名单确认', '聊天记录', 'placeholder', null, null)
  insertAttach.run('att-004-1', 'REG-004', '报名回执.pdf', '32KB', '报名回执单', '聊天记录', 'uploaded', t(8), '赛事运营/小李')
  insertAttach.run('att-005-1', 'REG-005', '赛事方案.pdf', '384KB', '赛事方案', '聊天记录', 'placeholder', null, null)
  insertAttach.run('att-006-1', 'REG-006', 'VIP区预定单.pdf', '180KB', 'VIP区预定确认', '聊天记录', 'uploaded', t(30), '赛事运营/小李')
  insertAttach.run('att-006-2', 'REG-006', '客户沟通记录.docx', '88KB', '与客户的微信聊天记录', '聊天记录', 'placeholder', null, null)
  insertAttach.run('att-007-1', 'REG-007', '参赛确认函.pdf', '45KB', '参赛确认函', '聊天记录', 'placeholder', null, null)
}

createTables()

const count = db.prepare('SELECT COUNT(*) as cnt FROM registrations').get() as { cnt: number }
if (count.cnt === 0) {
  seedData()
}

export { genId }
export default db
