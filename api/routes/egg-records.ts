import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { coop, date, status } = req.query

  let sql = `
    SELECT e.*, c.code as coop_code, c.name as coop_name, u.name as sorter_name
    FROM egg_records e
    LEFT JOIN coops c ON e.coop_id = c.id
    LEFT JOIN users u ON e.sorter_id = u.id
    WHERE 1=1
  `
  const params: unknown[] = []

  if (coop) {
    sql += ' AND c.code = ?'
    params.push(coop)
  }

  if (date) {
    const dayStart = Math.floor(new Date(String(date)).getTime() / 1000)
    const dayEnd = dayStart + 86400
    sql += ' AND e.created_at >= ? AND e.created_at < ?'
    params.push(dayStart, dayEnd)
  }

  if (status) {
    sql += ' AND e.status = ?'
    params.push(status)
  }

  sql += ' ORDER BY e.created_at DESC'

  const records = db.prepare(sql).all(...params)
  res.json({ success: true, data: records })
})

router.get('/export', (req: Request, res: Response): void => {
  const { coop, date, status } = req.query

  let sql = `
    SELECT e.id, c.code as coop_code, c.name as coop_name, u.name as sorter_name,
      e.total_eggs, e.broken_eggs, e.dirty_eggs, e.grade_a, e.grade_b, e.grade_c,
      e.status, e.notes, e.created_at, e.confirmed_at
    FROM egg_records e
    LEFT JOIN coops c ON e.coop_id = c.id
    LEFT JOIN users u ON e.sorter_id = u.id
    WHERE 1=1
  `
  const params: unknown[] = []

  if (coop) {
    sql += ' AND c.code = ?'
    params.push(coop)
  }

  if (date) {
    const dayStart = Math.floor(new Date(String(date)).getTime() / 1000)
    const dayEnd = dayStart + 86400
    sql += ' AND e.created_at >= ? AND e.created_at < ?'
    params.push(dayStart, dayEnd)
  }

  if (status) {
    sql += ' AND e.status = ?'
    params.push(status)
  }

  sql += ' ORDER BY e.created_at DESC'

  const records = db.prepare(sql).all(...params) as Record<string, unknown>[]

  const headers = [
    'ID', '鸡舍编号', '鸡舍名称', '分拣员', '总产蛋数', '破蛋数', '脏蛋数',
    'A级', 'B级', 'C级', '状态', '备注', '创建时间', '确认时间',
  ]
  const rows = records.map((r) =>
    [
      r.id, r.coop_code ?? '', r.coop_name ?? '', r.sorter_name ?? '',
      r.total_eggs, r.broken_eggs, r.dirty_eggs,
      r.grade_a, r.grade_b, r.grade_c, r.status,
      r.notes ?? '', r.created_at, r.confirmed_at ?? '',
    ].map((v) => `"${String(v ?? '')}"`).join(','),
  )

  const csv = [headers.join(','), ...rows].join('\n')
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename=egg_records.csv')
  res.send('\uFEFF' + csv)
})

router.get('/:id', (req: Request, res: Response): void => {
  const record = db.prepare(`
    SELECT e.*, c.code as coop_code, c.name as coop_name, u.name as sorter_name
    FROM egg_records e
    LEFT JOIN coops c ON e.coop_id = c.id
    LEFT JOIN users u ON e.sorter_id = u.id
    WHERE e.id = ?
  `).get(req.params.id) as Record<string, unknown> | undefined

  if (!record) {
    res.status(404).json({ success: false, error: '产蛋记录不存在' })
    return
  }

  let inspection = null
  if (record.inspection_id) {
    inspection = db.prepare(`
      SELECT i.*, u.name as inspector_name
      FROM inspections i
      LEFT JOIN users u ON i.inspector_id = u.id
      WHERE i.id = ?
    `).get(record.inspection_id)
  }

  res.json({ success: true, data: { ...record, inspection } })
})

router.post('/', (req: Request, res: Response): void => {
  const { coop_id, inspection_id, total_eggs, broken_eggs, dirty_eggs, grade_a, grade_b, grade_c, notes } = req.body

  if (!coop_id) {
    res.status(400).json({ success: false, error: '请选择鸡舍' })
    return
  }

  const sorterId = req.user?.id
  const now = Math.floor(Date.now() / 1000)

  const result = db.prepare(`
    INSERT INTO egg_records (coop_id, inspection_id, sorter_id, total_eggs, broken_eggs, dirty_eggs, grade_a, grade_b, grade_c, status, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    coop_id,
    inspection_id ?? null,
    sorterId ?? null,
    total_eggs ?? 0,
    broken_eggs ?? 0,
    dirty_eggs ?? 0,
    grade_a ?? 0,
    grade_b ?? 0,
    grade_c ?? 0,
    'pending',
    notes ?? null,
    now,
  )

  res.json({ success: true, data: { id: result.lastInsertRowid } })
})

router.patch('/:id', (req: Request, res: Response): void => {
  const { total_eggs, broken_eggs, dirty_eggs, grade_a, grade_b, grade_c, status, notes } = req.body

  const record = db.prepare('SELECT * FROM egg_records WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!record) {
    res.status(404).json({ success: false, error: '产蛋记录不存在' })
    return
  }

  const updates: string[] = []
  const params: unknown[] = []

  if (total_eggs !== undefined) { updates.push('total_eggs = ?'); params.push(total_eggs) }
  if (broken_eggs !== undefined) { updates.push('broken_eggs = ?'); params.push(broken_eggs) }
  if (dirty_eggs !== undefined) { updates.push('dirty_eggs = ?'); params.push(dirty_eggs) }
  if (grade_a !== undefined) { updates.push('grade_a = ?'); params.push(grade_a) }
  if (grade_b !== undefined) { updates.push('grade_b = ?'); params.push(grade_b) }
  if (grade_c !== undefined) { updates.push('grade_c = ?'); params.push(grade_c) }
  if (status !== undefined) { updates.push('status = ?'); params.push(status) }
  if (notes !== undefined) { updates.push('notes = ?'); params.push(notes) }

  if (updates.length === 0) {
    res.status(400).json({ success: false, error: '没有更新内容' })
    return
  }

  if (status === 'completed') {
    updates.push('confirmed_at = ?')
    params.push(Math.floor(Date.now() / 1000))
  }

  params.push(req.params.id)
  db.prepare(`UPDATE egg_records SET ${updates.join(', ')} WHERE id = ?`).run(...params)

  res.json({ success: true, data: { id: Number(req.params.id) } })
})

export default router
