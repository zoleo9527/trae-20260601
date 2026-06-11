import db from '../db.js'
import { logOperation } from './logService.js'

interface ScheduleFilters {
  counterId?: number
  weekStart?: string
  status?: string
}

interface ScheduleItemInput {
  date: string
  shift: string
  guideId: number
}

interface CreateScheduleData {
  counterId: number
  weekStart: string
  createdBy: number
  items: ScheduleItemInput[]
}

export function getSchedules(filters: ScheduleFilters = {}) {
  let sql = `
    SELECT s.*, c.name AS counterName, st.name AS createdByName
    FROM schedules s
    LEFT JOIN counters c ON s.counterId = c.id
    LEFT JOIN staff st ON s.createdBy = st.id
    WHERE 1=1
  `
  const params: unknown[] = []

  if (filters.counterId) {
    sql += ' AND s.counterId = ?'
    params.push(filters.counterId)
  }
  if (filters.weekStart) {
    sql += ' AND s.weekStart = ?'
    params.push(filters.weekStart)
  }
  if (filters.status) {
    sql += ' AND s.status = ?'
    params.push(filters.status)
  }

  sql += ' ORDER BY s.weekStart DESC'

  const schedules = db.prepare(sql).all(...params) as any[]

  for (const schedule of schedules) {
    schedule.items = db.prepare(`
      SELECT si.*, st.name AS guideName, st.avatar AS guideAvatar
      FROM schedule_items si
      LEFT JOIN staff st ON si.guideId = st.id
      WHERE si.scheduleId = ?
      ORDER BY si.date ASC, si.shift ASC
    `).all(schedule.id)
  }

  return schedules
}

export function createSchedule(data: CreateScheduleData) {
  const now = new Date().toISOString()

  const result = db.prepare(`
    INSERT INTO schedules (counterId, weekStart, status, createdBy, createdAt, updatedAt)
    VALUES (?, ?, 'draft', ?, ?, ?)
  `).run(data.counterId, data.weekStart, data.createdBy, now, now)

  const scheduleId = Number(result.lastInsertRowid)

  const insertItem = db.prepare(
    'INSERT INTO schedule_items (scheduleId, date, shift, guideId) VALUES (?, ?, ?, ?)'
  )
  for (const item of data.items) {
    insertItem.run(scheduleId, item.date, item.shift, item.guideId)
  }

  const operator = db.prepare('SELECT name, role FROM staff WHERE id = ?').get(data.createdBy) as any
  logOperation({
    operatorId: data.createdBy,
    operatorName: operator?.name || '',
    operatorRole: operator?.role || '',
    action: 'create_schedule',
    entityType: 'schedule',
    entityId: scheduleId,
    fromStatus: '',
    toStatus: 'draft',
    detail: '创建排班表'
  })

  return db.prepare('SELECT * FROM schedules WHERE id = ?').get(scheduleId)
}

export function submitSchedule(id: number, operatorId: number) {
  const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(id) as any
  if (!schedule) throw new Error('排班表不存在')
  if (schedule.status !== 'draft') throw new Error('只有草稿状态的排班表才能提交')

  const now = new Date().toISOString()
  db.prepare(`
    UPDATE schedules SET status = 'submitted', updatedAt = ? WHERE id = ?
  `).run(now, id)

  const items = db.prepare('SELECT * FROM schedule_items WHERE scheduleId = ?').all(id) as any[]
  const insertAtt = db.prepare(`
    INSERT INTO attendance (scheduleItemId, staffId, counterId, date, shift, status, currentResponsible, deadline, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, 'submitted', ?, ?, ?, ?)
  `)

  const counterManager = db.prepare("SELECT id FROM staff WHERE role = 'counter_manager' AND counterId = ? LIMIT 1").get(schedule.counterId) as any
  const managerId = counterManager?.id || operatorId
  const operator = db.prepare('SELECT name, role FROM staff WHERE id = ?').get(operatorId) as any

  for (const item of items) {
    const deadline = item.date
    const result = insertAtt.run(
      item.id,
      item.guideId,
      schedule.counterId,
      item.date,
      item.shift,
      managerId,
      deadline,
      now,
      now
    )
    const attendanceId = Number(result.lastInsertRowid)
    const guide = db.prepare('SELECT name FROM staff WHERE id = ?').get(item.guideId) as any
    const counterName = db.prepare('SELECT name FROM counters WHERE id = ?').get(schedule.counterId) as any
    logOperation({
      operatorId,
      operatorName: operator?.name || '',
      operatorRole: operator?.role || '',
      action: 'submit_schedule_gen_attendance',
      entityType: 'attendance',
      entityId: attendanceId,
      fromStatus: '',
      toStatus: 'submitted',
      detail: `排班生成考勤-${counterName?.name || ''}${guide?.name || '导购'}${item.shift === 'morning' ? '早班' : '晚班'}-待柜长下发`
    })
  }
  logOperation({
    operatorId,
    operatorName: operator?.name || '',
    operatorRole: operator?.role || '',
    action: 'submit_schedule',
    entityType: 'schedule',
    entityId: id,
    fromStatus: 'draft',
    toStatus: 'submitted',
    detail: `提交排班表并生成${items.length}条考勤待柜长确认`
  })

  return db.prepare('SELECT * FROM schedules WHERE id = ?').get(id)
}

export function updateSchedule(id: number, data: { items: ScheduleItemInput[] }) {
  const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(id) as any
  if (!schedule) throw new Error('排班表不存在')
  if (schedule.status !== 'draft') throw new Error('只有草稿状态的排班表才能修改')

  const now = new Date().toISOString()
  db.prepare('DELETE FROM schedule_items WHERE scheduleId = ?').run(id)

  const insertItem = db.prepare(
    'INSERT INTO schedule_items (scheduleId, date, shift, guideId) VALUES (?, ?, ?, ?)'
  )
  for (const item of data.items) {
    insertItem.run(id, item.date, item.shift, item.guideId)
  }

  db.prepare('UPDATE schedules SET updatedAt = ? WHERE id = ?').run(now, id)

  logOperation({
    operatorId: schedule.createdBy,
    operatorName: '',
    operatorRole: 'counter_manager',
    action: 'update_schedule',
    entityType: 'schedule',
    entityId: id,
    fromStatus: 'draft',
    toStatus: 'draft',
    detail: '修改排班表(草稿)'
  })

  return db.prepare('SELECT * FROM schedules WHERE id = ?').get(id)
}
