import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../database.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { roomId, status, category } = req.query
  let sql = `
    SELECT li.*, r.room_number, r.floor, u.name as finder_name
    FROM leftover_items li
    JOIN rooms r ON li.room_id = r.id
    JOIN users u ON li.found_by = u.id
    WHERE 1=1
  `
  const params: unknown[] = []

  if (roomId) {
    sql += ' AND li.room_id = ?'
    params.push(roomId)
  }
  if (status) {
    sql += ' AND li.status = ?'
    params.push(status)
  }
  if (category) {
    sql += ' AND li.category = ?'
    params.push(category)
  }

  sql += ' ORDER BY li.found_at DESC'
  const items = db.prepare(sql).all(...params as any[])
  res.json({ success: true, data: items })
})

router.post('/', (req: Request, res: Response): void => {
  const { roomId, foundBy, description, category, storageLocation } = req.body

  if (!roomId || !foundBy || !description || !category || !storageLocation) {
    res.status(400).json({ success: false, error: 'roomId, foundBy, description, category, and storageLocation are required' })
    return
  }

  const id = uuidv4()
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO leftover_items (id, room_id, found_by, description, category, storage_location, status, found_at, claimed_at, claimed_by_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, roomId, foundBy, description, category, storageLocation, 'found', now, null, null)

  db.prepare(`
    INSERT INTO timeline_events (id, room_id, event_type, description, operator_id, event_time, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    roomId,
    'leftover_found',
    `发现遗留物品：${description}`,
    foundBy,
    now,
    JSON.stringify({ leftoverId: id, category, storageLocation })
  )

  const item = db.prepare(`
    SELECT li.*, r.room_number, r.floor, u.name as finder_name
    FROM leftover_items li
    JOIN rooms r ON li.room_id = r.id
    JOIN users u ON li.found_by = u.id
    WHERE li.id = ?
  `).get(id)

  res.status(201).json({ success: true, data: item })
})

router.patch('/:id', (req: Request, res: Response): void => {
  const { status, claimedByName, storageLocation } = req.body
  const item = db.prepare('SELECT * FROM leftover_items WHERE id = ?').get(req.params.id) as any

  if (!item) {
    res.status(404).json({ success: false, error: 'Leftover item not found' })
    return
  }

  const now = new Date().toISOString()
  const updates: string[] = []
  const params: unknown[] = []

  if (status) {
    updates.push('status = ?')
    params.push(status)
    if (status === 'claimed') {
      updates.push('claimed_at = ?')
      params.push(now)
    }
  }

  if (claimedByName) {
    updates.push('claimed_by_name = ?')
    params.push(claimedByName)
    if (!status) {
      updates.push('status = ?')
      params.push('claimed')
      updates.push('claimed_at = ?')
      params.push(now)
    }
  }

  if (storageLocation) {
    updates.push('storage_location = ?')
    params.push(storageLocation)
  }

  if (updates.length === 0) {
    res.status(400).json({ success: false, error: 'No fields to update' })
    return
  }

  params.push(req.params.id)
  db.prepare(`UPDATE leftover_items SET ${updates.join(', ')} WHERE id = ?`).run(...params as any[])

  const newStatus = status || (claimedByName ? 'claimed' : item.status)
  let eventType = 'leftover_updated'
  let eventDesc = '遗留物品信息已更新'
  if (newStatus === 'stored') {
    eventType = 'leftover_stored'
    eventDesc = '遗留物品已入库'
  } else if (newStatus === 'claimed') {
    eventType = 'leftover_claimed'
    eventDesc = `遗留物品已被${claimedByName || item.claimed_by_name}认领`
  } else if (newStatus === 'disposed') {
    eventType = 'leftover_disposed'
    eventDesc = '遗留物品已处置'
  }

  db.prepare(`
    INSERT INTO timeline_events (id, room_id, event_type, description, operator_id, event_time, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    item.room_id,
    eventType,
    eventDesc,
    item.found_by,
    now,
    JSON.stringify({ leftoverId: req.params.id, oldStatus: item.status, newStatus })
  )

  const updated = db.prepare(`
    SELECT li.*, r.room_number, r.floor, u.name as finder_name
    FROM leftover_items li
    JOIN rooms r ON li.room_id = r.id
    JOIN users u ON li.found_by = u.id
    WHERE li.id = ?
  `).get(req.params.id)

  res.json({ success: true, data: updated })
})

export default router
