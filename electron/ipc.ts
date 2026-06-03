import { ipcMain } from 'electron'
import { getDb, logOperation } from './database'
import dayjs from 'dayjs'
import fs from 'fs'
import { parse } from 'csv-parse/sync'
import { stringify } from 'csv-stringify/sync'

function parseJsonFields(row: any, fields: string[]) {
  const result = { ...row }
  for (const field of fields) {
    if (result[field]) {
      try {
        result[field] = JSON.parse(result[field])
      } catch {
        result[field] = []
      }
    }
  }
  return result
}

function parseBoolFields(row: any, fields: string[]) {
  const result = { ...row }
  for (const field of fields) {
    result[field] = result[field] === 1 || result[field] === true
  }
  return result
}

export function registerHandlers() {
  const db = getDb()
  const currentUser = '前台小李'

  // ==================== Houses ====================
  ipcMain.handle('house:list', () => {
    return db.prepare('SELECT * FROM houses ORDER BY building, unit, room').all()
  })

  ipcMain.handle('house:search', (_, keyword: string) => {
    const kw = `%${keyword}%`
    return db.prepare(`
      SELECT h.*, r.name as ownerName, r.phone as ownerPhone
      FROM houses h
      LEFT JOIN residents r ON h.ownerId = r.id
      WHERE h.building LIKE ? OR h.unit LIKE ? OR h.room LIKE ?
         OR r.name LIKE ? OR r.phone LIKE ?
      ORDER BY h.building, h.unit, h.room
    `).all(kw, kw, kw, kw, kw)
  })

  ipcMain.handle('house:getById', (_, id: number) => {
    return db.prepare('SELECT * FROM houses WHERE id = ?').get(id)
  })

  ipcMain.handle('house:create', (_, data: any) => {
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const stmt = db.prepare(`
      INSERT INTO houses (building, unit, room, floor, area, ownerId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(data.building, data.unit, data.room, data.floor, data.area || 0,
      data.ownerId || null, now, now)
    logOperation(currentUser, '创建房屋', 'house', result.lastInsertRowid as number,
      `创建 ${data.building}${data.unit}单元${data.room}`)
    return result.lastInsertRowid
  })

  ipcMain.handle('house:update', (_, id: number, data: any) => {
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const stmt = db.prepare(`
      UPDATE houses SET building = ?, unit = ?, room = ?, floor = ?, area = ?, ownerId = ?, updatedAt = ?
      WHERE id = ?
    `)
    stmt.run(data.building, data.unit, data.room, data.floor, data.area || 0,
      data.ownerId || null, now, id)
    logOperation(currentUser, '更新房屋', 'house', id, `更新房屋信息`)
    return true
  })

  ipcMain.handle('house:delete', (_, id: number) => {
    db.prepare('DELETE FROM houses WHERE id = ?').run(id)
    logOperation(currentUser, '删除房屋', 'house', id, '删除房屋记录')
    return true
  })

  // ==================== Residents ====================
  ipcMain.handle('resident:list', () => {
    return db.prepare(`
      SELECT r.*, h.building, h.unit, h.room
      FROM residents r
      JOIN houses h ON r.houseId = h.id
      ORDER BY r.createdAt DESC
    `).all()
  })

  ipcMain.handle('resident:search', (_, keyword: string) => {
    const kw = `%${keyword}%`
    return db.prepare(`
      SELECT r.*, h.building, h.unit, h.room
      FROM residents r
      JOIN houses h ON r.houseId = h.id
      WHERE r.name LIKE ? OR r.phone LIKE ? OR r.idCard LIKE ?
         OR h.building LIKE ? OR h.unit LIKE ? OR h.room LIKE ?
      ORDER BY r.name
    `).all(kw, kw, kw, kw, kw, kw)
  })

  ipcMain.handle('resident:getById', (_, id: number) => {
    return db.prepare(`
      SELECT r.*, h.building, h.unit, h.room
      FROM residents r
      JOIN houses h ON r.houseId = h.id
      WHERE r.id = ?
    `).get(id)
  })

  ipcMain.handle('resident:getFullInfo', (_, id: number) => {
    const resident = db.prepare(`
      SELECT r.*, h.building, h.unit, h.room
      FROM residents r
      JOIN houses h ON r.houseId = h.id
      WHERE r.id = ?
    `).get(id)

    if (!resident) return null

    const house = db.prepare('SELECT * FROM houses WHERE id = ?').get(resident.houseId)
    const cards = db.prepare(`
      SELECT c.*, pg.name as permissionGroupName
      FROM access_cards c
      LEFT JOIN permission_groups pg ON c.permissionGroupId = pg.id
      WHERE c.residentId = ?
      ORDER BY c.createdAt DESC
    `).all(id)

    const applications = db.prepare(`
      SELECT a.*, pg.name as permissionGroupName
      FROM card_applications a
      LEFT JOIN permission_groups pg ON a.permissionGroupId = pg.id
      WHERE a.residentId = ?
      ORDER BY a.createdAt DESC
    `).all(id)

    return { resident, house, cards, applications }
  })

  ipcMain.handle('resident:create', (_, data: any) => {
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const stmt = db.prepare(`
      INSERT INTO residents (name, phone, idCard, type, houseId, leaseStart, leaseEnd, remark, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(data.name, data.phone, data.idCard, data.type, data.houseId,
      data.leaseStart || null, data.leaseEnd || null, data.remark || null, now, now)
    logOperation(currentUser, '新增住户', 'resident', result.lastInsertRowid as number,
      `新增${data.type === 'owner' ? '业主' : data.type === 'tenant' ? '租客' : '家属'} ${data.name}`)
    return result.lastInsertRowid
  })

  ipcMain.handle('resident:update', (_, id: number, data: any) => {
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const stmt = db.prepare(`
      UPDATE residents SET name = ?, phone = ?, idCard = ?, type = ?, houseId = ?,
        leaseStart = ?, leaseEnd = ?, remark = ?, updatedAt = ?
      WHERE id = ?
    `)
    stmt.run(data.name, data.phone, data.idCard, data.type, data.houseId,
      data.leaseStart || null, data.leaseEnd || null, data.remark || null, now, id)
    logOperation(currentUser, '更新住户', 'resident', id, `更新住户 ${data.name} 信息`)
    return true
  })

  ipcMain.handle('resident:delete', (_, id: number) => {
    const resident = db.prepare('SELECT name FROM residents WHERE id = ?').get(id) as any
    db.prepare('DELETE FROM residents WHERE id = ?').run(id)
    logOperation(currentUser, '删除住户', 'resident', id, `删除住户 ${resident?.name || '未知'}`)
    return true
  })

  ipcMain.handle('resident:importCsv', (_, filePath: string) => {
    const content = fs.readFileSync(filePath, 'utf-8')
    const records = parse(content, { columns: true, skip_empty_lines: true })
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    let imported = 0, failed = 0

    const stmt = db.prepare(`
      INSERT INTO residents (name, phone, idCard, type, houseId, leaseStart, leaseEnd, remark, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    for (const record of records) {
      try {
        const houseKey = `${record['楼栋']}-${record['单元']}-${record['房号']}`
        const house = db.prepare(`
          SELECT id FROM houses
          WHERE building = ? AND unit = ? AND room = ?
        `).get(`${record['楼栋']}号楼`, `${record['单元']}单元`, `${record['房号']}室`) as any

        if (!house) {
          failed++
          continue
        }

        const typeMap: Record<string, string> = { '业主': 'owner', '租客': 'tenant', '家属': 'family' }

        stmt.run(
          record['姓名'], record['电话'], record['身份证号'],
          typeMap[record['类型']] || 'tenant', house.id,
          record['起租日期'] || null, record['到期日期'] || null,
          record['备注'] || null, now, now
        )
        imported++
      } catch {
        failed++
      }
    }

    logOperation(currentUser, '批量导入住户', 'resident', 0,
      `CSV导入完成：成功 ${imported} 条，失败 ${failed} 条`)
    return { imported, failed }
  })

  // ==================== Permission Groups ====================
  ipcMain.handle('permissionGroup:list', () => {
    const rows = db.prepare('SELECT * FROM permission_groups ORDER BY id').all()
    return rows.map(r => parseJsonFields(parseBoolFields(r, ['hasGarage']), ['doors', 'elevators', 'garageZones']))
  })

  ipcMain.handle('permissionGroup:getById', (_, id: number) => {
    const row = db.prepare('SELECT * FROM permission_groups WHERE id = ?').get(id)
    return row ? parseJsonFields(parseBoolFields(row, ['hasGarage']), ['doors', 'elevators', 'garageZones']) : null
  })

  ipcMain.handle('permissionGroup:create', (_, data: any) => {
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const stmt = db.prepare(`
      INSERT INTO permission_groups (name, description, doors, elevators, hasGarage, garageZones, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      data.name, data.description || '',
      JSON.stringify(data.doors || []), JSON.stringify(data.elevators || []),
      data.hasGarage ? 1 : 0, JSON.stringify(data.garageZones || []),
      now, now
    )
    logOperation(currentUser, '创建权限组', 'permission_group', result.lastInsertRowid as number,
      `创建权限组 ${data.name}`)
    return result.lastInsertRowid
  })

  ipcMain.handle('permissionGroup:update', (_, id: number, data: any) => {
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const stmt = db.prepare(`
      UPDATE permission_groups SET name = ?, description = ?, doors = ?, elevators = ?,
        hasGarage = ?, garageZones = ?, updatedAt = ?
      WHERE id = ?
    `)
    stmt.run(
      data.name, data.description || '',
      JSON.stringify(data.doors || []), JSON.stringify(data.elevators || []),
      data.hasGarage ? 1 : 0, JSON.stringify(data.garageZones || []),
      now, id
    )
    logOperation(currentUser, '更新权限组', 'permission_group', id, `更新权限组 ${data.name}`)
    return true
  })

  ipcMain.handle('permissionGroup:delete', (_, id: number) => {
    const group = db.prepare('SELECT name FROM permission_groups WHERE id = ?').get(id) as any
    db.prepare('DELETE FROM permission_groups WHERE id = ?').run(id)
    logOperation(currentUser, '删除权限组', 'permission_group', id, `删除权限组 ${group?.name || '未知'}`)
    return true
  })

  // ==================== Access Cards ====================
  ipcMain.handle('accessCard:list', () => {
    return db.prepare(`
      SELECT c.*, r.name as residentName, r.phone, pg.name as permissionGroupName
      FROM access_cards c
      JOIN residents r ON c.residentId = r.id
      JOIN permission_groups pg ON c.permissionGroupId = pg.id
      ORDER BY c.createdAt DESC
    `).all()
  })

  ipcMain.handle('accessCard:search', (_, keyword: string) => {
    const kw = `%${keyword}%`
    return db.prepare(`
      SELECT c.*, r.name as residentName, r.phone, pg.name as permissionGroupName
      FROM access_cards c
      JOIN residents r ON c.residentId = r.id
      JOIN permission_groups pg ON c.permissionGroupId = pg.id
      WHERE c.cardNo LIKE ? OR r.name LIKE ? OR r.phone LIKE ?
      ORDER BY c.createdAt DESC
    `).all(kw, kw, kw)
  })

  ipcMain.handle('accessCard:getByResident', (_, residentId: number) => {
    return db.prepare(`
      SELECT c.*, pg.name as permissionGroupName
      FROM access_cards c
      JOIN permission_groups pg ON c.permissionGroupId = pg.id
      WHERE c.residentId = ?
      ORDER BY c.createdAt DESC
    `).all(residentId)
  })

  ipcMain.handle('accessCard:create', (_, data: any) => {
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const stmt = db.prepare(`
      INSERT INTO access_cards (cardNo, residentId, permissionGroupId, status, issueDate, expireDate, remark, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      data.cardNo, data.residentId, data.permissionGroupId,
      data.status || 'pending', data.issueDate || dayjs().format('YYYY-MM-DD'),
      data.expireDate || null, data.remark || null, now, now
    )
    logOperation(currentUser, '制卡', 'access_card', result.lastInsertRowid as number,
      `制作门禁卡 ${data.cardNo}`)
    return result.lastInsertRowid
  })

  ipcMain.handle('accessCard:updateStatus', (_, id: number, status: string, remark?: string) => {
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const card = db.prepare('SELECT cardNo FROM access_cards WHERE id = ?').get(id) as any

    if (remark) {
      db.prepare('UPDATE access_cards SET status = ?, remark = ?, updatedAt = ? WHERE id = ?')
        .run(status, remark, now, id)
    } else {
      db.prepare('UPDATE access_cards SET status = ?, updatedAt = ? WHERE id = ?')
        .run(status, now, id)
    }

    const statusMap: Record<string, string> = {
      active: '启用', inactive: '停用', lost: '挂失', expired: '过期', pending: '待激活'
    }
    logOperation(currentUser, `${statusMap[status] || status}卡片`, 'access_card', id,
      `${card?.cardNo || '未知卡号'} ${statusMap[status] || status}`)
    return true
  })

  ipcMain.handle('accessCard:simulateWrite', (_, cardId: number) => {
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const card = db.prepare('SELECT * FROM access_cards WHERE id = ?').get(cardId) as any
    if (!card) return { success: false, message: '卡片不存在' }

    const success = Math.random() > 0.05
    if (success) {
      db.prepare('UPDATE access_cards SET status = ?, updatedAt = ? WHERE id = ?')
        .run('active', now, cardId)
      logOperation(currentUser, '模拟写卡成功', 'access_card', cardId,
        `${card.cardNo} 写卡成功，已激活`)
    } else {
      logOperation(currentUser, '模拟写卡失败', 'access_card', cardId,
        `${card.cardNo} 写卡失败，请重试`)
    }
    return { success, message: success ? '写卡成功，卡片已激活' : '写卡失败，请重试或更换卡' }
  })

  ipcMain.handle('accessCard:simulateAccess', (_, cardNo: string, doorName: string) => {
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const card = db.prepare(`
      SELECT c.*, pg.*
      FROM access_cards c
      JOIN permission_groups pg ON c.permissionGroupId = pg.id
      WHERE c.cardNo = ?
    `).get(cardNo) as any

    let success = false
    let reason = ''

    if (!card) {
      reason = '卡号不存在'
    } else if (card.status === 'lost') {
      reason = '卡片已挂失'
    } else if (card.status === 'expired') {
      reason = '卡片已过期'
    } else if (card.status !== 'active') {
      reason = '卡片未激活'
    } else if (card.expireDate && dayjs(card.expireDate).isBefore(dayjs(), 'day')) {
      reason = '卡片已过期'
      db.prepare('UPDATE access_cards SET status = ?, updatedAt = ? WHERE cardNo = ?')
        .run('expired', now, cardNo)
    } else {
      const doors: string[] = JSON.parse(card.doors || '[]')
      if (doors.includes(doorName)) {
        success = true
        db.prepare('UPDATE access_cards SET lastUsed = ? WHERE cardNo = ?').run(now, cardNo)
      } else {
        reason = '无此门权限'
      }
    }

    db.prepare(`
      INSERT INTO access_events (cardNo, doorName, eventTime, success, reason)
      VALUES (?, ?, ?, ?, ?)
    `).run(cardNo, doorName, now, success ? 1 : 0, reason || null)

    return { success, reason, card }
  })

  // ==================== Card Applications ====================
  ipcMain.handle('cardApplication:list', (_, status?: string) => {
    let sql = `
      SELECT a.*, r.name as residentName, r.phone, 
             pg.name as permissionGroupName, pg.doors as permissionGroupDoors, pg.hasElevator as permissionGroupHasElevator, pg.garageAreas as permissionGroupGarageAreas
      FROM card_applications a
      JOIN residents r ON a.residentId = r.id
      JOIN permission_groups pg ON a.permissionGroupId = pg.id
    `
    const params: any[] = []
    if (status) {
      sql += ' WHERE a.status = ?'
      params.push(status)
    }
    sql += ' ORDER BY a.createdAt DESC'
    const apps = db.prepare(sql).all(...params) as any[]
    
    for (const app of apps) {
      app.permissionGroupDoors = JSON.parse(app.permissionGroupDoors || '[]')
      app.permissionGroupGarageAreas = JSON.parse(app.permissionGroupGarageAreas || '[]')
      
      if (app.type === 'permission' || app.type === 'reissue') {
        const currentCard = db.prepare(`
          SELECT c.*, pg.name as groupName, pg.doors, pg.hasElevator, pg.garageAreas
          FROM access_cards c
          JOIN permission_groups pg ON c.permissionGroupId = pg.id
          WHERE c.residentId = ? AND c.status = 'active'
          LIMIT 1
        `).get(app.residentId) as any
        
        if (currentCard) {
          app.currentPermissionGroup = {
            id: currentCard.permissionGroupId,
            name: currentCard.groupName,
            doors: JSON.parse(currentCard.doors || '[]'),
            hasElevator: currentCard.hasElevator,
            garageAreas: JSON.parse(currentCard.garageAreas || '[]')
          }
        }
      }
    }
    
    return apps
  })

  ipcMain.handle('cardApplication:getById', (_, id: number) => {
    const app = db.prepare(`
      SELECT a.*, r.name as residentName, r.phone, 
             pg.name as permissionGroupName, pg.doors as permissionGroupDoors, pg.hasElevator as permissionGroupHasElevator, pg.garageAreas as permissionGroupGarageAreas
      FROM card_applications a
      JOIN residents r ON a.residentId = r.id
      JOIN permission_groups pg ON a.permissionGroupId = pg.id
      WHERE a.id = ?
    `).get(id) as any
    
    if (app) {
      app.permissionGroupDoors = JSON.parse(app.permissionGroupDoors || '[]')
      app.permissionGroupGarageAreas = JSON.parse(app.permissionGroupGarageAreas || '[]')
      
      if (app.type === 'permission' || app.type === 'reissue') {
        const currentCard = db.prepare(`
          SELECT c.*, pg.name as groupName, pg.doors, pg.hasElevator, pg.garageAreas
          FROM access_cards c
          JOIN permission_groups pg ON c.permissionGroupId = pg.id
          WHERE c.residentId = ? AND c.status = 'active'
          LIMIT 1
        `).get(app.residentId) as any
        
        if (currentCard) {
          app.currentPermissionGroup = {
            id: currentCard.permissionGroupId,
            name: currentCard.groupName,
            doors: JSON.parse(currentCard.doors || '[]'),
            hasElevator: currentCard.hasElevator,
            garageAreas: JSON.parse(currentCard.garageAreas || '[]')
          }
        }
      }
    }
    
    return app
  })

  ipcMain.handle('cardApplication:create', (_, data: any) => {
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const stmt = db.prepare(`
      INSERT INTO card_applications (type, residentId, cardId, permissionGroupId, status, reason, applicant, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      data.type, data.residentId, data.cardId || null, data.permissionGroupId,
      'pending', data.reason, data.applicant, now, now
    )

    const typeMap: Record<string, string> = { new: '新办卡', reissue: '补办', permission: '权限变更' }
    logOperation(currentUser, '提交申请', 'card_application', result.lastInsertRowid as number,
      `${data.applicant} 提交${typeMap[data.type]}申请`)
    return result.lastInsertRowid
  })

  ipcMain.handle('cardApplication:review', (_, id: number, approved: boolean, comment: string, reviewer: string) => {
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    db.prepare(`
      UPDATE card_applications SET status = ?, reviewer = ?, reviewComment = ?, reviewedAt = ?, updatedAt = ?
      WHERE id = ?
    `).run(approved ? 'approved' : 'rejected', reviewer, comment, now, now, id)

    logOperation(reviewer, approved ? '审核通过' : '审核拒绝', 'card_application', id,
      `申请 ${id} ${approved ? '通过' : '拒绝'}：${comment}`)
    return true
  })

  ipcMain.handle('cardApplication:process', (_, id: number) => {
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const app = db.prepare('SELECT * FROM card_applications WHERE id = ?').get(id) as any
    if (!app || app.status !== 'approved') {
      return { success: false, message: '申请状态不正确' }
    }

    if (app.type === 'new') {
      const cardNo = 'CARD' + String(Date.now()).slice(-6)
      db.prepare(`
        INSERT INTO access_cards (cardNo, residentId, permissionGroupId, status, issueDate, remark, createdAt, updatedAt)
        VALUES (?, ?, ?, 'pending', ?, '新办卡', ?, ?)
      `).run(cardNo, app.residentId, app.permissionGroupId, dayjs().format('YYYY-MM-DD'), now, now)
    } else if (app.type === 'reissue') {
      let oldCards: any[] = []
      let oldCardNos: string[] = []
      
      if (app.cardId) {
        const oldCard = db.prepare('SELECT * FROM access_cards WHERE id = ?').get(app.cardId) as any
        if (oldCard) {
          oldCards = [oldCard]
          oldCardNos = [oldCard.cardNo]
        }
      } else {
        oldCards = db.prepare(`
          SELECT * FROM access_cards 
          WHERE residentId = ? AND status IN ('active', 'inactive', 'pending')
          ORDER BY createdAt DESC
        `).all(app.residentId) as any[]
        oldCardNos = oldCards.map(c => c.cardNo)
      }
      
      const newCardNo = 'CARD' + String(Date.now()).slice(-6)
      
      if (oldCards.length > 0) {
        const updateStmt = db.prepare(`
          UPDATE access_cards 
          SET status = 'inactive', 
              remark = COALESCE(remark || '；', '') || '被补办，新卡 ' || ?,
              updatedAt = ? 
          WHERE id = ?
        `)
        oldCards.forEach(oldCard => {
          updateStmt.run(newCardNo, now, oldCard.id)
        })
      }
      
      const remark = oldCardNos.length > 0 
        ? `补办，替代旧卡 ${oldCardNos.join('、')}` 
        : '补办（无旧卡记录）'
      
      db.prepare(`
        INSERT INTO access_cards (cardNo, residentId, permissionGroupId, status, issueDate, remark, createdAt, updatedAt)
        VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)
      `).run(newCardNo, app.residentId, app.permissionGroupId, dayjs().format('YYYY-MM-DD'), remark, now, now)
    } else if (app.type === 'permission') {
      db.prepare(`
        UPDATE access_cards SET permissionGroupId = ?, updatedAt = ?
        WHERE residentId = ? AND status = 'active'
      `).run(app.permissionGroupId, now, app.residentId)
    }

    db.prepare('UPDATE card_applications SET status = ?, updatedAt = ? WHERE id = ?')
      .run('completed', now, id)

    logOperation(currentUser, '处理申请', 'card_application', id, '申请已完成处理')
    return { success: true, message: '申请处理完成' }
  })

  // ==================== Operation Logs ====================
  ipcMain.handle('operationLog:list', (_, page: number, pageSize: number, filters?: any) => {
    const whereClauses: string[] = []
    const params: any[] = []

    if (filters) {
      if (filters.operator) {
        whereClauses.push('operator LIKE ?')
        params.push(`%${filters.operator}%`)
      }
      if (filters.action) {
        whereClauses.push('action LIKE ?')
        params.push(`%${filters.action}%`)
      }
      if (filters.startDate) {
        whereClauses.push('createdAt >= ?')
        params.push(filters.startDate)
      }
      if (filters.endDate) {
        whereClauses.push('createdAt <= ?')
        params.push(filters.endDate + ' 23:59:59')
      }
    }

    const whereSql = whereClauses.length > 0 ? ' WHERE ' + whereClauses.join(' AND ') : ''
    const countSql = `SELECT COUNT(*) as cnt FROM operation_logs${whereSql}`
    const dataSql = `SELECT * FROM operation_logs${whereSql} ORDER BY createdAt DESC LIMIT ? OFFSET ?`

    const count = db.prepare(countSql).get(...params) as { cnt: number }
    const data = db.prepare(dataSql).all(...params, pageSize, (page - 1) * pageSize)

    return { data, total: count.cnt, page, pageSize }
  })

  ipcMain.handle('operationLog:exportCsv', (_, filePath: string, filters?: any) => {
    const whereClauses: string[] = []
    const params: any[] = []

    if (filters) {
      if (filters.operator) {
        whereClauses.push('operator LIKE ?')
        params.push(`%${filters.operator}%`)
      }
      if (filters.action) {
        whereClauses.push('action LIKE ?')
        params.push(`%${filters.action}%`)
      }
      if (filters.startDate) {
        whereClauses.push('createdAt >= ?')
        params.push(filters.startDate)
      }
      if (filters.endDate) {
        whereClauses.push('createdAt <= ?')
        params.push(filters.endDate + ' 23:59:59')
      }
    }

    const whereSql = whereClauses.length > 0 ? ' WHERE ' + whereClauses.join(' AND ') : ''
    const sql = `SELECT * FROM operation_logs${whereSql} ORDER BY createdAt DESC`

    const data = db.prepare(sql).all(...params) as any[]
    const csvData = data.map(row => ({
      '操作时间': row.createdAt,
      '操作人': row.operator,
      '操作类型': row.action,
      '目标类型': row.targetType,
      '目标ID': row.targetId,
      '详情': row.detail
    }))

    const csv = stringify(csvData, { header: true })
    fs.writeFileSync(filePath, csv, 'utf-8')
    logOperation(currentUser, '导出操作记录', 'operation_log', 0, `导出 ${data.length} 条记录到 ${filePath}`)
    return data.length
  })

  // ==================== Access Events ====================
  ipcMain.handle('accessEvent:list', (_, page: number, pageSize: number) => {
    const count = db.prepare('SELECT COUNT(*) as cnt FROM access_events').get() as { cnt: number }
    const data = db.prepare(`
      SELECT e.*, c.status as cardStatus, r.name as residentName
      FROM access_events e
      LEFT JOIN access_cards c ON e.cardNo = c.cardNo
      LEFT JOIN residents r ON c.residentId = r.id
      ORDER BY e.eventTime DESC
      LIMIT ? OFFSET ?
    `).all(pageSize, (page - 1) * pageSize)
    return { data, total: count.cnt, page, pageSize }
  })

  ipcMain.handle('accessEvent:getRecentFailed', () => {
    return db.prepare(`
      SELECT e.*, c.status as cardStatus, r.name as residentName
      FROM access_events e
      LEFT JOIN access_cards c ON e.cardNo = c.cardNo
      LEFT JOIN residents r ON c.residentId = r.id
      WHERE e.success = 0
      ORDER BY e.eventTime DESC
      LIMIT 20
    `).all()
  })

  ipcMain.handle('accessEvent:getStats', () => {
    const today = dayjs().format('YYYY-MM-DD')
    const totalCards = db.prepare('SELECT COUNT(*) as cnt FROM access_cards').get() as { cnt: number }
    const activeCards = db.prepare("SELECT COUNT(*) as cnt FROM access_cards WHERE status = 'active'").get() as { cnt: number }
    const lostCards = db.prepare("SELECT COUNT(*) as cnt FROM access_cards WHERE status = 'lost'").get() as { cnt: number }
    const expiredCards = db.prepare("SELECT COUNT(*) as cnt FROM access_cards WHERE status = 'expired'").get() as { cnt: number }
    const totalResidents = db.prepare('SELECT COUNT(*) as cnt FROM residents').get() as { cnt: number }
    const pendingApps = db.prepare("SELECT COUNT(*) as cnt FROM card_applications WHERE status = 'pending'").get() as { cnt: number }
    const todayEvents = db.prepare('SELECT COUNT(*) as cnt FROM access_events WHERE eventTime >= ?').get(today) as { cnt: number }
    const todayFailed = db.prepare('SELECT COUNT(*) as cnt FROM access_events WHERE eventTime >= ? AND success = 0').get(today) as { cnt: number }

    return {
      totalCards: totalCards.cnt,
      activeCards: activeCards.cnt,
      lostCards: lostCards.cnt,
      expiredCards: expiredCards.cnt,
      totalResidents: totalResidents.cnt,
      pendingApps: pendingApps.cnt,
      todayEvents: todayEvents.cnt,
      todayFailed: todayFailed.cnt
    }
  })
}
