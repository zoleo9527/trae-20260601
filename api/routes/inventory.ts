import { Router, type Request, type Response } from 'express'
import db, { logOperation } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const rows = db.prepare(`
      SELECT ib.*, rc.bean_type as curve_bean_type, rc.roast_level, rc.status as curve_status
      FROM inventory_batches ib
      LEFT JOIN roast_curves rc ON ib.curve_id = rc.id
      ORDER BY
        CASE ib.status
          WHEN 'expired' THEN 1
          WHEN 'near_expiry' THEN 2
          ELSE 3
        END,
        ib.expiry_date ASC
    `).all()

    const data = rows.map((row: any) => {
      const now = new Date()
      const expiry = new Date(row.expiry_date + 'Z')
      const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      let fifoStatus: string
      if (row.status === 'expired') {
        fifoStatus = 'expired'
      } else if (daysUntilExpiry <= 7) {
        fifoStatus = 'near_expiry'
      } else {
        fifoStatus = 'normal'
      }

      return { ...row, daysUntilExpiry, fifoStatus }
    })

    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { status, operator } = req.body

    const batch = db.prepare('SELECT * FROM inventory_batches WHERE id = ?').get(id) as any
    if (!batch) {
      res.status(404).json({ success: false, error: '库存批次不存在' })
      return
    }

    db.prepare('UPDATE inventory_batches SET status = ? WHERE id = ?').run(status, id)

    logOperation('inventory', 'update', operator ?? 'system', 'inventory_batch', Number(id),
      `库存批次状态更新：${batch.batch_code} -> ${status}`
    )

    const updated = db.prepare('SELECT * FROM inventory_batches WHERE id = ?').get(id)
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

export default router
