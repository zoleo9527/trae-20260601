import { EggGradeRecord, PackingRecord, ActionLog, User, EggGradeFilter, PackingFilter, PageRequest, PageResponse } from '../types'
import { getConnection } from './connection'
import { snakeToCamel } from '../utils/helpers'

export async function createEggGradeRecord(record: Omit<EggGradeRecord, 'id' | 'sorterId' | 'sorterName' | 'status' | 'createdAt' | 'updatedAt'>): Promise<EggGradeRecord> {
  const conn = await getConnection()
  try {
    const id = crypto.randomUUID()
    const now = new Date()
    await conn.execute(
      'INSERT INTO egg_grade_records (id, batch_number, grade, quantity, weight, breeder_id, breeder_name, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, record.batchNumber, record.grade, record.quantity, record.weight, record.breederId, record.breederName, 'pending', now, now]
    )
    return { ...record, id, sorterId: null, sorterName: null, status: 'pending', createdAt: now, updatedAt: now }
  } finally {
    conn.release()
  }
}

export async function verifyEggGradeRecord(id: string, sorterId: string, sorterName: string): Promise<EggGradeRecord | null> {
  const conn = await getConnection()
  try {
    const [rows] = await conn.execute(
      'UPDATE egg_grade_records SET sorter_id = ?, sorter_name = ?, status = ?, updated_at = ? WHERE id = ? AND status = ?',
      [sorterId, sorterName, 'verified', new Date(), id, 'pending']
    )
    const result = rows as { affectedRows: number }
    if (result.affectedRows === 0) return null
    
    const [records] = await conn.execute('SELECT * FROM egg_grade_records WHERE id = ?', [id])
    const record = (records as any[])[0]
    return record ? snakeToCamel(record) as EggGradeRecord : null
  } finally {
    conn.release()
  }
}

export async function getEggGradeRecordById(id: string): Promise<EggGradeRecord | null> {
  const conn = await getConnection()
  try {
    const [rows] = await conn.execute('SELECT * FROM egg_grade_records WHERE id = ?', [id])
    const record = (rows as any[])[0]
    return record ? snakeToCamel(record) as EggGradeRecord : null
  } finally {
    conn.release()
  }
}

export async function getEggGradeRecords(filter: EggGradeFilter, pageRequest: PageRequest): Promise<PageResponse<EggGradeRecord>> {
  const conn = await getConnection()
  try {
    let query = 'SELECT * FROM egg_grade_records WHERE 1=1'
    const params: any[] = []

    if (filter.batchNumber) {
      query += ' AND batch_number LIKE ?'
      params.push(`%${filter.batchNumber}%`)
    }
    if (filter.grade) {
      query += ' AND grade = ?'
      params.push(filter.grade)
    }
    if (filter.status) {
      query += ' AND status = ?'
      params.push(filter.status)
    }
    if (filter.breederId) {
      query += ' AND breeder_id = ?'
      params.push(filter.breederId)
    }
    if (filter.sorterId) {
      query += ' AND sorter_id = ?'
      params.push(filter.sorterId)
    }
    if (filter.startDate) {
      query += ' AND created_at >= ?'
      params.push(filter.startDate)
    }
    if (filter.endDate) {
      query += ' AND created_at <= ?'
      params.push(filter.endDate)
    }

    query += ' ORDER BY created_at DESC'
    
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total')
    const [countRows] = await conn.execute(countQuery, params)
    const total = (countRows as { total: number }[])[0]?.total || 0

    const offset = (pageRequest.page - 1) * pageRequest.pageSize
    query += ' LIMIT ? OFFSET ?'
    params.push(pageRequest.pageSize, offset)

    const [rows] = await conn.execute(query, params)
    
    return {
      data: snakeToCamel(rows) as EggGradeRecord[],
      total,
      page: pageRequest.page,
      pageSize: pageRequest.pageSize
    }
  } finally {
    conn.release()
  }
}

export async function updateEggGradeRecordStatus(id: string, status: 'packed'): Promise<boolean> {
  const conn = await getConnection()
  try {
    const [result] = await conn.execute(
      'UPDATE egg_grade_records SET status = ?, updated_at = ? WHERE id = ?',
      [status, new Date(), id]
    )
    return (result as { affectedRows: number }).affectedRows > 0
  } finally {
    conn.release()
  }
}

export async function createPackingRecord(record: Omit<PackingRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<PackingRecord> {
  const conn = await getConnection()
  try {
    const id = crypto.randomUUID()
    const now = new Date()
    await conn.execute(
      'INSERT INTO packing_records (id, egg_grade_record_id, batch_number, box_count, eggs_per_box, total_eggs, destination, transporter, manager_id, manager_name, sorted_by_id, sorted_by_name, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, record.eggGradeRecordId, record.batchNumber, record.boxCount, record.eggsPerBox, record.totalEggs, record.destination, record.transporter, record.managerId, record.managerName, record.sortedById, record.sortedByName, 'confirmed', now, now]
    )
    return { ...record, id, createdAt: now, updatedAt: now }
  } finally {
    conn.release()
  }
}

export async function shipPackingRecord(id: string): Promise<PackingRecord | null> {
  const conn = await getConnection()
  try {
    const [result] = await conn.execute(
      'UPDATE packing_records SET status = ?, updated_at = ? WHERE id = ? AND status = ?',
      ['shipped', new Date(), id, 'confirmed']
    )
    const affected = (result as { affectedRows: number }).affectedRows
    if (affected === 0) return null
    
    const [records] = await conn.execute('SELECT * FROM packing_records WHERE id = ?', [id])
    const record = (records as any[])[0]
    return record ? snakeToCamel(record) as PackingRecord : null
  } finally {
    conn.release()
  }
}

export async function getPackingRecordById(id: string): Promise<PackingRecord | null> {
  const conn = await getConnection()
  try {
    const [rows] = await conn.execute('SELECT * FROM packing_records WHERE id = ?', [id])
    const record = (rows as any[])[0]
    return record ? snakeToCamel(record) as PackingRecord : null
  } finally {
    conn.release()
  }
}

export async function getPackingRecords(filter: PackingFilter, pageRequest: PageRequest): Promise<PageResponse<PackingRecord>> {
  const conn = await getConnection()
  try {
    let query = 'SELECT * FROM packing_records WHERE 1=1'
    const params: any[] = []

    if (filter.batchNumber) {
      query += ' AND batch_number LIKE ?'
      params.push(`%${filter.batchNumber}%`)
    }
    if (filter.destination) {
      query += ' AND destination LIKE ?'
      params.push(`%${filter.destination}%`)
    }
    if (filter.status) {
      query += ' AND status = ?'
      params.push(filter.status)
    }
    if (filter.managerId) {
      query += ' AND manager_id = ?'
      params.push(filter.managerId)
    }
    if (filter.startDate) {
      query += ' AND created_at >= ?'
      params.push(filter.startDate)
    }
    if (filter.endDate) {
      query += ' AND created_at <= ?'
      params.push(filter.endDate)
    }

    query += ' ORDER BY created_at DESC'
    
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total')
    const [countRows] = await conn.execute(countQuery, params)
    const total = (countRows as { total: number }[])[0]?.total || 0

    const offset = (pageRequest.page - 1) * pageRequest.pageSize
    query += ' LIMIT ? OFFSET ?'
    params.push(pageRequest.pageSize, offset)

    const [rows] = await conn.execute(query, params)
    
    return {
      data: snakeToCamel(rows) as PackingRecord[],
      total,
      page: pageRequest.page,
      pageSize: pageRequest.pageSize
    }
  } finally {
    conn.release()
  }
}

export async function createActionLog(log: Omit<ActionLog, 'id' | 'timestamp'>): Promise<ActionLog> {
  const conn = await getConnection()
  try {
    const id = crypto.randomUUID()
    const now = new Date()
    await conn.execute(
      'INSERT INTO action_logs (id, target_type, target_id, action, operator_id, operator_name, operator_role, timestamp, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, log.targetType, log.targetId, log.action, log.operatorId, log.operatorName, log.operatorRole, now, log.details]
    )
    return { ...log, id, timestamp: now }
  } finally {
    conn.release()
  }
}

export async function getActionLogs(targetType: 'grade' | 'packing', targetId: string): Promise<ActionLog[]> {
  const conn = await getConnection()
  try {
    const [rows] = await conn.execute(
      'SELECT * FROM action_logs WHERE target_type = ? AND target_id = ? ORDER BY timestamp DESC',
      [targetType, targetId]
    )
    return snakeToCamel(rows) as ActionLog[]
  } finally {
    conn.release()
  }
}

export async function getUserById(id: string): Promise<User | null> {
  const conn = await getConnection()
  try {
    const [rows] = await conn.execute('SELECT * FROM users WHERE id = ?', [id])
    const record = (rows as any[])[0]
    return record ? snakeToCamel(record) as User : null
  } finally {
    conn.release()
  }
}

export async function getUsersByRole(role?: string): Promise<User[]> {
  const conn = await getConnection()
  try {
    let query = 'SELECT * FROM users'
    const params: any[] = []
    
    if (role) {
      query += ' WHERE role = ?'
      params.push(role)
    }
    
    const [rows] = await conn.execute(query, params)
    return snakeToCamel(rows) as User[]
  } finally {
    conn.release()
  }
}