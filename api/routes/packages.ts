import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

function mapPackage(pkg: any) {
  return {
    id: pkg.id,
    trackingNo: pkg.tracking_no,
    status: pkg.status,
    type: pkg.type,
    arrivedAt: pkg.arrived_at,
    currentHandler: pkg.current_handler,
    currentRole: pkg.current_role,
    problemType: pkg.problem_type,
    problemDescription: pkg.problem_description,
  }
}

function mapEvent(evt: any) {
  return {
    id: evt.id,
    packageId: evt.package_id,
    status: evt.status,
    operator: evt.operator,
    role: evt.role,
    timestamp: evt.timestamp,
    note: evt.note,
    pickupPerson: evt.pickup_person,
  }
}

function mapPackageWithTimeline(pkg: any) {
  const timeline = getDb().prepare('SELECT * FROM timeline_events WHERE package_id = ? ORDER BY timestamp ASC').all(pkg.id) as any[]
  return { ...mapPackage(pkg), timeline: timeline.map(mapEvent) }
}

router.get('/', (req: Request, res: Response) => {
  const db = getDb()
  const { status, role } = req.query

  let sql = 'SELECT * FROM packages WHERE 1=1'
  const params: string[] = []

  if (status) {
    sql += ' AND status = ?'
    params.push(status as string)
  }

  sql += ' ORDER BY arrived_at DESC'
  const packages = db.prepare(sql).all(...params) as any[]

  const result = packages.map(mapPackageWithTimeline)

  res.json({ success: true, data: result })
})

router.get('/:id', (req: Request, res: Response) => {
  const db = getDb()
  const pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(req.params.id) as any

  if (!pkg) {
    res.status(404).json({ success: false, error: '快件不存在' })
    return
  }

  res.json({ success: true, data: mapPackageWithTimeline(pkg) })
})

router.post('/:id/checkin', (req: Request, res: Response) => {
  const db = getDb()
  const { operator, role, note } = req.body
  const pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(req.params.id) as any

  if (!pkg) {
    res.status(404).json({ success: false, error: '快件不存在' })
    return
  }

  if (pkg.status !== 'arrived') {
    res.status(400).json({ success: false, error: '只有到站待入库的快件才能执行入库操作' })
    return
  }

  const now = new Date().toISOString()

  db.prepare('UPDATE packages SET status = ?, current_handler = ?, current_role = ? WHERE id = ?').run(
    'checked_in', operator, role, req.params.id
  )

  db.prepare('INSERT INTO timeline_events (package_id, status, operator, role, timestamp, note) VALUES (?, ?, ?, ?, ?, ?)').run(
    req.params.id, 'checked_in', operator, role, now, note || ''
  )

  const updated = db.prepare('SELECT * FROM packages WHERE id = ?').get(req.params.id) as any
  res.json({ success: true, data: mapPackageWithTimeline(updated) })
})

router.post('/:id/verify', (req: Request, res: Response) => {
  const db = getDb()
  const { operator, role, pickupPerson, note } = req.body
  const pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(req.params.id) as any

  if (!pkg) {
    res.status(404).json({ success: false, error: '快件不存在' })
    return
  }

  if (pkg.status !== 'checked_in' && pkg.status !== 'notified') {
    res.status(400).json({ success: false, error: '只有已入库的快件才能执行核销操作' })
    return
  }

  const now = new Date().toISOString()

  db.prepare('UPDATE packages SET status = ?, current_handler = ?, current_role = ? WHERE id = ?').run(
    'verified', operator, role, req.params.id
  )

  const verifyNote = note || ''
  db.prepare('INSERT INTO timeline_events (package_id, status, operator, role, timestamp, note, pickup_person) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    req.params.id, 'verified', operator, role, now, verifyNote, pickupPerson || null
  )

  const updated = db.prepare('SELECT * FROM packages WHERE id = ?').get(req.params.id) as any
  res.json({ success: true, data: mapPackageWithTimeline(updated) })
})

router.post('/:id/problem', (req: Request, res: Response) => {
  const db = getDb()
  const { operator, role, problemType, description } = req.body
  const pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(req.params.id) as any

  if (!pkg) {
    res.status(404).json({ success: false, error: '快件不存在' })
    return
  }

  const now = new Date().toISOString()

  db.prepare('UPDATE packages SET status = ?, current_handler = ?, current_role = ?, problem_type = ?, problem_description = ? WHERE id = ?').run(
    'problem', operator, role, problemType, description, req.params.id
  )

  db.prepare('INSERT INTO timeline_events (package_id, status, operator, role, timestamp, note) VALUES (?, ?, ?, ?, ?, ?)').run(
    req.params.id, 'problem', operator, role, now, `${problemType}：${description}`
  )

  const updated = db.prepare('SELECT * FROM packages WHERE id = ?').get(req.params.id) as any
  res.json({ success: true, data: mapPackageWithTimeline(updated) })
})

router.post('/:id/resolve', (req: Request, res: Response) => {
  const db = getDb()
  const { operator, role, resolution, action } = req.body
  const pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(req.params.id) as any

  if (!pkg) {
    res.status(404).json({ success: false, error: '快件不存在' })
    return
  }

  if (pkg.status !== 'problem') {
    res.status(400).json({ success: false, error: '只有问题件才能执行处理操作' })
    return
  }

  const now = new Date().toISOString()

  if (action === 'recheckin') {
    db.prepare('UPDATE packages SET status = ?, current_handler = ?, current_role = ?, problem_type = NULL, problem_description = NULL WHERE id = ?').run(
      'checked_in', operator, role, req.params.id
    )
    db.prepare('INSERT INTO timeline_events (package_id, status, operator, role, timestamp, note) VALUES (?, ?, ?, ?, ?, ?)').run(
      req.params.id, 'checked_in', operator, role, now, `问题件重新入库：${resolution}`
    )
  } else {
    db.prepare('UPDATE packages SET status = ?, current_handler = ?, current_role = ?, problem_type = NULL, problem_description = NULL WHERE id = ?').run(
      'returned', operator, role, req.params.id
    )
    db.prepare('INSERT INTO timeline_events (package_id, status, operator, role, timestamp, note) VALUES (?, ?, ?, ?, ?, ?)').run(
      req.params.id, 'returned', operator, role, now, `问题件退回发件网点：${resolution}`
    )
  }

  const updated = db.prepare('SELECT * FROM packages WHERE id = ?').get(req.params.id) as any
  res.json({ success: true, data: mapPackageWithTimeline(updated) })
})

router.post('/:id/reset', (req: Request, res: Response) => {
  const db = getDb()
  const { operator, role, targetStatus, note } = req.body
  const pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(req.params.id) as any

  if (!pkg) {
    res.status(404).json({ success: false, error: '快件不存在' })
    return
  }

  const now = new Date().toISOString()

  db.prepare('UPDATE packages SET status = ?, current_handler = ?, current_role = ?, problem_type = NULL, problem_description = NULL WHERE id = ?').run(
    targetStatus, operator, role, req.params.id
  )

  db.prepare('INSERT INTO timeline_events (package_id, status, operator, role, timestamp, note) VALUES (?, ?, ?, ?, ?, ?)').run(
    req.params.id, targetStatus, operator, role, now, `状态重置：${note || '客服手动重置'}`
  )

  const updated = db.prepare('SELECT * FROM packages WHERE id = ?').get(req.params.id) as any
  res.json({ success: true, data: mapPackageWithTimeline(updated) })
})

export default router
