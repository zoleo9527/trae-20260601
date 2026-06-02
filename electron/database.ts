import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import dayjs from 'dayjs'

let db: Database.Database

export function initDatabase() {
  const userData = app.getPath('userData')
  const dbDir = path.join(userData, 'access-card-data')
  
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }
  
  const dbPath = path.join(dbDir, 'access-card.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  
  createTables()
  initSeedData()
  
  return db
}

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS houses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      building TEXT NOT NULL,
      unit TEXT NOT NULL,
      room TEXT NOT NULL,
      floor INTEGER NOT NULL,
      area REAL DEFAULT 0,
      ownerId INTEGER,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      UNIQUE(building, unit, room)
    );

    CREATE TABLE IF NOT EXISTS residents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      idCard TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('owner', 'tenant', 'family')),
      houseId INTEGER NOT NULL,
      leaseStart TEXT,
      leaseEnd TEXT,
      remark TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (houseId) REFERENCES houses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS permission_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      doors TEXT NOT NULL,
      elevators TEXT NOT NULL,
      hasGarage INTEGER NOT NULL DEFAULT 0,
      garageZones TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS access_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cardNo TEXT NOT NULL UNIQUE,
      residentId INTEGER NOT NULL,
      permissionGroupId INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('active', 'inactive', 'lost', 'expired', 'pending')),
      issueDate TEXT NOT NULL,
      expireDate TEXT,
      lastUsed TEXT,
      remark TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (residentId) REFERENCES residents(id) ON DELETE CASCADE,
      FOREIGN KEY (permissionGroupId) REFERENCES permission_groups(id)
    );

    CREATE TABLE IF NOT EXISTS card_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('new', 'reissue', 'permission')),
      residentId INTEGER NOT NULL,
      cardId INTEGER,
      permissionGroupId INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected', 'completed')),
      reason TEXT NOT NULL,
      applicant TEXT NOT NULL,
      reviewer TEXT,
      reviewComment TEXT,
      reviewedAt TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (residentId) REFERENCES residents(id),
      FOREIGN KEY (cardId) REFERENCES access_cards(id),
      FOREIGN KEY (permissionGroupId) REFERENCES permission_groups(id)
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operator TEXT NOT NULL,
      action TEXT NOT NULL,
      targetType TEXT NOT NULL,
      targetId INTEGER NOT NULL,
      detail TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS access_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cardNo TEXT NOT NULL,
      doorName TEXT NOT NULL,
      eventTime TEXT NOT NULL,
      success INTEGER NOT NULL,
      reason TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_residents_house ON residents(houseId);
    CREATE INDEX IF NOT EXISTS idx_residents_phone ON residents(phone);
    CREATE INDEX IF NOT EXISTS idx_cards_resident ON access_cards(residentId);
    CREATE INDEX IF NOT EXISTS idx_cards_status ON access_cards(status);
    CREATE INDEX IF NOT EXISTS idx_cards_cardNo ON access_cards(cardNo);
    CREATE INDEX IF NOT EXISTS idx_applications_status ON card_applications(status);
    CREATE INDEX IF NOT EXISTS idx_logs_created ON operation_logs(createdAt);
    CREATE INDEX IF NOT EXISTS idx_events_time ON access_events(eventTime);
  `)
}

function initSeedData() {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM houses').get() as { cnt: number }
  if (count.cnt > 0) return

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

  const insertHouse = db.prepare(`
    INSERT INTO houses (building, unit, room, floor, area, ownerId, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertResident = db.prepare(`
    INSERT INTO residents (name, phone, idCard, type, houseId, leaseStart, leaseEnd, remark, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertPermGroup = db.prepare(`
    INSERT INTO permission_groups (name, description, doors, elevators, hasGarage, garageZones, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertCard = db.prepare(`
    INSERT INTO access_cards (cardNo, residentId, permissionGroupId, status, issueDate, expireDate, remark, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertLog = db.prepare(`
    INSERT INTO operation_logs (operator, action, targetType, targetId, detail, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const insertEvent = db.prepare(`
    INSERT INTO access_events (cardNo, doorName, eventTime, success, reason)
    VALUES (?, ?, ?, ?, ?)
  `)

  const insertApp = db.prepare(`
    INSERT INTO card_applications (type, residentId, permissionGroupId, status, reason, applicant, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const tx = db.transaction(() => {
    const groups: Record<string, number> = {}
    
    groups['standard'] = insertPermGroup.run(
      '标准住户权限',
      '普通业主/租客基础权限',
      JSON.stringify(['单元门', '小区大门']),
      JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]),
      0,
      JSON.stringify([]),
      now, now
    ).lastInsertRowid as number

    groups['withGarage'] = insertPermGroup.run(
      '含车库权限',
      '包含地下车库的住户权限',
      JSON.stringify(['单元门', '小区大门', '车库入口']),
      JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]),
      1,
      JSON.stringify(['A区', 'B区']),
      now, now
    ).lastInsertRowid as number

    groups['garageOnly'] = insertPermGroup.run(
      '仅车库权限',
      '仅车库使用权限',
      JSON.stringify(['车库入口']),
      JSON.stringify([]),
      1,
      JSON.stringify(['C区']),
      now, now
    ).lastInsertRowid as number

    groups['vip'] = insertPermGroup.run(
      'VIP全权限',
      '所有区域通行权限',
      JSON.stringify(['单元门', '小区大门', '车库入口', '天台门', '设备层']),
      JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]),
      1,
      JSON.stringify(['A区', 'B区', 'C区', 'VIP区']),
      now, now
    ).lastInsertRowid as number

    const houses: Record<string, number> = {}
    
    for (let b = 1; b <= 3; b++) {
      for (let u = 1; u <= 2; u++) {
        for (let r = 1; r <= 30; r++) {
          const floor = Math.ceil(r / 2)
          const roomNo = floor * 100 + ((r % 2 === 1) ? 1 : 2)
          const key = `${b}-${u}-${roomNo}`
          houses[key] = insertHouse.run(
            `${b}号楼`, `${u}单元`, `${roomNo}室`, floor, 89.5 + Math.random() * 50,
            null, now, now
          ).lastInsertRowid as number
        }
      }
    }

    const owner1Id = insertResident.run(
      '张伟', '13800138001', '110101198001011234', 'owner',
      houses['1-1-1501'], null, null, '业主委员会主任', now, now
    ).lastInsertRowid as number
    
    db.prepare('UPDATE houses SET ownerId = ? WHERE id = ?').run(owner1Id, houses['1-1-1501'])

    insertCard.run('CARD000001', owner1Id, groups['withGarage'], 'active',
      dayjs('2023-01-15').format('YYYY-MM-DD'), null, '主卡', now, now)
    insertCard.run('CARD000002', owner1Id, groups['withGarage'], 'active',
      dayjs('2023-06-20').format('YYYY-MM-DD'), null, '家人副卡', now, now)
    insertCard.run('CARD000003', owner1Id, groups['garageOnly'], 'lost',
      dayjs('2022-03-10').format('YYYY-MM-DD'), dayjs('2025-12-31').format('YYYY-MM-DD'),
      '已挂失的车库卡', now, now)

    const tenant1Id = insertResident.run(
      '李小明', '13900139002', '110101199505055678', 'tenant',
      houses['2-2-802'],
      dayjs('2025-03-01').format('YYYY-MM-DD'),
      dayjs('2026-02-28').format('YYYY-MM-DD'),
      '租客，合同到期需提醒', now, now
    ).lastInsertRowid as number
    
    insertCard.run('CARD000004', tenant1Id, groups['standard'], 'active',
      dayjs('2025-03-05').format('YYYY-MM-DD'),
      dayjs('2026-02-28').format('YYYY-MM-DD'),
      '租客卡，与合同同步到期', now, now)

    const expiredTenantId = insertResident.run(
      '王芳', '13700137003', '110101199003039012', 'tenant',
      houses['1-2-501'],
      dayjs('2024-06-01').format('YYYY-MM-DD'),
      dayjs('2025-05-31').format('YYYY-MM-DD'),
      '租约已到期未续约', now, now
    ).lastInsertRowid as number
    
    insertCard.run('CARD000005', expiredTenantId, groups['standard'], 'expired',
      dayjs('2024-06-05').format('YYYY-MM-DD'),
      dayjs('2025-05-31').format('YYYY-MM-DD'),
      '租约到期自动失效', now, now)

    const owner2Id = insertResident.run(
      '陈刚', '13600136004', '110101197808083456', 'owner',
      houses['3-1-2201'], null, null, null, now, now
    ).lastInsertRowid as number
    
    db.prepare('UPDATE houses SET ownerId = ? WHERE id = ?').run(owner2Id, houses['3-1-2201'])
    insertCard.run('CARD000006', owner2Id, groups['vip'], 'active',
      dayjs('2023-09-01').format('YYYY-MM-DD'), null, 'VIP业主卡', now, now)

    insertApp.run('permission', owner1Id, groups['vip'], 'pending',
      '因工作原因需经常使用设备层和天台，申请开通全权限',
      '张伟', now, now)

    insertApp.run('reissue', expiredTenantId, groups['standard'], 'rejected',
      '声称卡丢失要求补办，但实际租约已到期',
      '王芳', now, now)
    db.prepare(`UPDATE card_applications SET reviewer = ?, reviewComment = ?, reviewedAt = ?, status = 'rejected'
                WHERE id = 2`).run('物业管理员', '租约已到期，无权补办，请先续约', now)

    insertEvent.run('CARD000003', '车库入口', dayjs('2026-06-01 08:30:25').format('YYYY-MM-DD HH:mm:ss'),
      0, '卡片已挂失')
    insertEvent.run('CARD000003', '车库入口', dayjs('2026-06-01 08:30:32').format('YYYY-MM-DD HH:mm:ss'),
      0, '卡片已挂失')
    insertEvent.run('CARD000005', '2号楼2单元门', dayjs('2026-06-01 19:25:10').format('YYYY-MM-DD HH:mm:ss'),
      0, '卡片已过期')
    insertEvent.run('CARD000001', '1号楼1单元门', dayjs('2026-06-02 07:45:00').format('YYYY-MM-DD HH:mm:ss'),
      1, null)
    insertEvent.run('CARD000004', '2号楼2单元门', dayjs('2026-06-02 08:10:15').format('YYYY-MM-DD HH:mm:ss'),
      1, null)

    insertLog.run('系统初始化', '创建权限组', 'permission_group', groups['standard'],
      '创建标准住户权限组', now)
    insertLog.run('系统初始化', '创建房屋', 'house', houses['1-1-1501'],
      '创建1号楼1单元1501室', now)
    insertLog.run('前台小李', '新增住户', 'resident', owner1Id,
      '业主张伟入住1-1-1501', now)
    insertLog.run('前台小李', '制卡', 'access_card', 1,
      '为张伟制作门禁卡 CARD000001，含车库权限', now)
    insertLog.run('前台小李', '挂失', 'access_card', 3,
      'CARD000003 挂失，原因：卡片丢失', now)
  })

  tx()
}

export function getDb(): Database.Database {
  return db
}

export function logOperation(operator: string, action: string, targetType: string, targetId: number, detail: string) {
  const stmt = db.prepare(`
    INSERT INTO operation_logs (operator, action, targetType, targetId, detail, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  stmt.run(operator, action, targetType, targetId, detail, dayjs().format('YYYY-MM-DD HH:mm:ss'))
}
