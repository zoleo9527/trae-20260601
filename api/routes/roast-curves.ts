import { Router, type Request, type Response } from 'express'
import db, { logOperation } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const { beanType, status, keyword } = req.query
    let sql = `
      SELECT rc.*, cv.version_number as latest_version, cv.status as latest_version_status,
             cv.charge_temp, cv.turn_point_temp, cv.turn_point_time,
             cv.first_crack_temp, cv.first_crack_time, cv.development_time, cv.drop_temp
      FROM roast_curves rc
      LEFT JOIN curve_versions cv ON cv.id = (
        SELECT id FROM curve_versions WHERE curve_id = rc.id ORDER BY version_number DESC LIMIT 1
      )
      WHERE 1=1
    `
    const params: unknown[] = []

    if (beanType) {
      sql += ' AND rc.bean_type LIKE ?'
      params.push(`%${beanType}%`)
    }
    if (status) {
      sql += ' AND rc.status = ?'
      params.push(status)
    }
    if (keyword) {
      sql += ' AND (rc.bean_type LIKE ? OR rc.roast_level LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }

    sql += ' ORDER BY rc.updated_at DESC'

    const rows = db.prepare(sql).all(...params)
    res.json({ success: true, data: rows })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const curve = db.prepare('SELECT * FROM roast_curves WHERE id = ?').get(id) as any
    if (!curve) {
      res.status(404).json({ success: false, error: '曲线不存在' })
      return
    }

    const versions = db.prepare(
      'SELECT * FROM curve_versions WHERE curve_id = ? ORDER BY version_number ASC'
    ).all(id)

    const cuppingScores = db.prepare(
      'SELECT * FROM cupping_scores WHERE curve_id = ? ORDER BY cupped_at DESC'
    ).all(id)

    const batches = db.prepare(
      'SELECT * FROM inventory_batches WHERE curve_id = ? ORDER BY roast_date DESC'
    ).all(id)

    res.json({
      success: true,
      data: { ...curve, versions, cuppingScores, batches },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const { bean_type, roast_level, created_by, version } = req.body
    if (!bean_type || !roast_level || !created_by) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }

    const tx = db.transaction(() => {
      const curveResult = db.prepare(
        `INSERT INTO roast_curves (bean_type, roast_level, status, current_version, created_by)
         VALUES (?, ?, 'draft', 1, ?)`
      ).run(bean_type, roast_level, created_by)

      const curveId = Number(curveResult.lastInsertRowid)

      if (version) {
        db.prepare(
          `INSERT INTO curve_versions (curve_id, version_number, status, charge_temp, turn_point_temp, turn_point_time, first_crack_temp, first_crack_time, development_time, drop_temp, notes, created_by)
           VALUES (?, 1, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          curveId,
          version.charge_temp ?? null,
          version.turn_point_temp ?? null,
          version.turn_point_time ?? null,
          version.first_crack_temp ?? null,
          version.first_crack_time ?? null,
          version.development_time ?? null,
          version.drop_temp ?? null,
          version.notes ?? null,
          created_by
        )
      } else {
        db.prepare(
          `INSERT INTO curve_versions (curve_id, version_number, status, created_by)
           VALUES (?, 1, 'draft', ?)`
        ).run(curveId, created_by)
      }

      logOperation('roast_curve', 'create', created_by, 'roast_curve', curveId, `创建曲线：${bean_type}`)

      return curveId
    })

    const curveId = tx()
    const curve = db.prepare('SELECT * FROM roast_curves WHERE id = ?').get(curveId)

    res.status(201).json({ success: true, data: curve })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { bean_type, roast_level, status, created_by, version } = req.body

    const curve = db.prepare('SELECT * FROM roast_curves WHERE id = ?').get(id) as any
    if (!curve) {
      res.status(404).json({ success: false, error: '曲线不存在' })
      return
    }

    const tx = db.transaction(() => {
      const newVersion = (curve.current_version as number) + 1

      db.prepare(
        `UPDATE roast_curves SET bean_type = ?, roast_level = ?, status = ?, current_version = ?, updated_at = datetime('now') WHERE id = ?`
      ).run(
        bean_type ?? curve.bean_type,
        roast_level ?? curve.roast_level,
        status ?? curve.status,
        newVersion,
        id
      )

      db.prepare(
        `INSERT INTO curve_versions (curve_id, version_number, status, charge_temp, turn_point_temp, turn_point_time, first_crack_temp, first_crack_time, development_time, drop_temp, notes, created_by)
         VALUES (?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        Number(id),
        newVersion,
        version?.charge_temp ?? null,
        version?.turn_point_temp ?? null,
        version?.turn_point_time ?? null,
        version?.first_crack_temp ?? null,
        version?.first_crack_time ?? null,
        version?.development_time ?? null,
        version?.drop_temp ?? null,
        version?.notes ?? null,
        created_by ?? 'system'
      )

      logOperation(
        'roast_curve', 'update', created_by ?? 'system', 'roast_curve', Number(id),
        `更新曲线：${bean_type ?? curve.bean_type} 新增版本 v${newVersion}`
      )
    })

    tx()

    const updated = db.prepare('SELECT * FROM roast_curves WHERE id = ?').get(id)
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

router.put('/:id/version/:ver/activate', (req: Request, res: Response): void => {
  try {
    const { id, ver } = req.params
    const { operator } = req.body

    const curve = db.prepare('SELECT * FROM roast_curves WHERE id = ?').get(id) as any
    if (!curve) {
      res.status(404).json({ success: false, error: '曲线不存在' })
      return
    }

    const version = db.prepare(
      'SELECT * FROM curve_versions WHERE curve_id = ? AND version_number = ?'
    ).get(id, Number(ver)) as any
    if (!version) {
      res.status(404).json({ success: false, error: '版本不存在' })
      return
    }

    const tx = db.transaction(() => {
      db.prepare(
        `UPDATE curve_versions SET status = 'draft' WHERE curve_id = ? AND status = 'active'`
      ).run(Number(id))

      db.prepare(
        `UPDATE curve_versions SET status = 'active' WHERE curve_id = ? AND version_number = ?`
      ).run(Number(id), Number(ver))

      db.prepare(
        `UPDATE roast_curves SET current_version = ?, status = 'active', updated_at = datetime('now') WHERE id = ?`
      ).run(Number(ver), Number(id))

      logOperation(
        'roast_curve', 'activate', operator ?? 'system', 'roast_curve', Number(id),
        `激活曲线版本：v${ver}`
      )
    })

    tx()

    const updated = db.prepare('SELECT * FROM roast_curves WHERE id = ?').get(id)
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

export default router
