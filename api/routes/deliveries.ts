import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

router.get('/', (_req: Request, res: Response): void => {
  const db = getDb()
  const { status, keyword } = _req.query as { status?: string; keyword?: string }

  let sql = 'SELECT * FROM deliveries WHERE 1=1'
  const params: any[] = []

  if (status) {
    sql += ' AND status = ?'
    params.push(status)
  }
  if (keyword) {
    sql += ' AND (tracking_number LIKE ? OR recipient_name LIKE ? OR recipient_phone LIKE ?)'
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
  }

  sql += ' ORDER BY created_at DESC'

  const rows = db.prepare(sql).all(...params)
  res.json({ success: true, data: rows })
})

router.get('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const row = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(req.params.id)
  if (!row) {
    res.status(404).json({ success: false, error: 'Delivery not found' })
    return
  }
  res.json({ success: true, data: row })
})

router.post('/', (req: Request, res: Response): void => {
  const db = getDb()
  const id = uuidv4()
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
  const {
    trackingNumber, recipientName, recipientPhone, deliveryAddress,
    stationId = 'ST001', courierId, courierName, status = 'pending', stationSignImage = null,
  } = req.body

  try {
    db.prepare(`
      INSERT INTO deliveries (id, tracking_number, recipient_name, recipient_phone, delivery_address, station_id, courier_id, courier_name, status, station_sign_image, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, trackingNumber, recipientName, recipientPhone, deliveryAddress, stationId, courierId, courierName, status, stationSignImage, now, now)

    const row = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(id)
    res.json({ success: true, data: row })
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message })
  }
})

router.patch('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
  const existing = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(req.params.id) as any
  if (!existing) {
    res.status(404).json({ success: false, error: 'Delivery not found' })
    return
  }

  const fields: string[] = []
  const params: any[] = []

  const allowedFields = ['trackingNumber', 'recipientName', 'recipientPhone', 'deliveryAddress', 'courierId', 'courierName', 'status', 'stationSignImage']
  const columnMap: Record<string, string> = {
    trackingNumber: 'tracking_number', recipientName: 'recipient_name', recipientPhone: 'recipient_phone',
    deliveryAddress: 'delivery_address', courierId: 'courier_id', courierName: 'courier_name',
    stationSignImage: 'station_sign_image',
  }

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      const col = columnMap[field] || field
      fields.push(`${col} = ?`)
      params.push(req.body[field])
    }
  }

  if (fields.length === 0) {
    res.json({ success: true, data: existing })
    return
  }

  fields.push('updated_at = ?')
  params.push(now)
  params.push(req.params.id)

  db.prepare(`UPDATE deliveries SET ${fields.join(', ')} WHERE id = ?`).run(...params)
  const row = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: row })
})

export default router
