import { Router, type Request, type Response } from 'express'
import db, { logOperation } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const { beanType, anomaly, dateFrom, dateTo } = req.query
    let sql = `
      SELECT cs.*, rc.bean_type, rc.roast_level
      FROM cupping_scores cs
      LEFT JOIN roast_curves rc ON cs.curve_id = rc.id
      WHERE 1=1
    `
    const params: unknown[] = []

    if (beanType) {
      sql += ' AND rc.bean_type LIKE ?'
      params.push(`%${beanType}%`)
    }
    if (anomaly !== undefined) {
      sql += ' AND cs.flavor_anomaly = ?'
      params.push(anomaly === 'true' || anomaly === '1' ? 1 : 0)
    }
    if (dateFrom) {
      sql += ' AND cs.cupped_at >= ?'
      params.push(dateFrom)
    }
    if (dateTo) {
      sql += ' AND cs.cupped_at <= ?'
      params.push(dateTo)
    }

    sql += ' ORDER BY cs.cupped_at DESC'

    const rows = db.prepare(sql).all(...params)
    res.json({ success: true, data: rows })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const score = db.prepare(`
      SELECT cs.*, rc.bean_type, rc.roast_level, rc.status as curve_status,
             cv.version_number as curve_version_number
      FROM cupping_scores cs
      LEFT JOIN roast_curves rc ON cs.curve_id = rc.id
      LEFT JOIN curve_versions cv ON cs.curve_version_id = cv.id
      WHERE cs.id = ?
    `).get(id) as any

    if (!score) {
      res.status(404).json({ success: false, error: '杯测评分不存在' })
      return
    }

    const version = score.curve_version_id
      ? db.prepare('SELECT * FROM curve_versions WHERE id = ?').get(score.curve_version_id)
      : null

    const batch = db.prepare(
      `SELECT ib.*, rc.bean_type as curve_bean_type
       FROM inventory_batches ib
       LEFT JOIN roast_curves rc ON ib.curve_id = rc.id
       WHERE ib.batch_code = ?`
    ).get(score.batch_code)

    res.json({
      success: true,
      data: { ...score, curveVersion: version, batch },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const {
      curve_id, batch_code,
      dry_aroma, wet_aroma, acidity, body, aftertaste, balance, overall,
      flavor_anomaly, anomaly_description, cupper_name, cupped_at,
    } = req.body

    if (!curve_id || !batch_code || !cupper_name || !cupped_at) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }

    const curve = db.prepare('SELECT * FROM roast_curves WHERE id = ?').get(curve_id) as any
    if (!curve) {
      res.status(400).json({ success: false, error: '所选曲线不存在' })
      return
    }

    const activeVersion = db.prepare(
      'SELECT * FROM curve_versions WHERE curve_id = ? AND status = ?'
    ).get(curve_id, 'active') as any
    if (!activeVersion) {
      res.status(400).json({ success: false, error: '该曲线尚未启用任何版本，请先启用一个版本' })
      return
    }

    const batch = db.prepare('SELECT * FROM inventory_batches WHERE batch_code = ?').get(batch_code) as any
    if (!batch) {
      res.status(400).json({ success: false, error: '库存批次不存在' })
      return
    }
    if (batch.curve_id !== curve_id) {
      res.status(400).json({ success: false, error: '该库存批次不属于所选曲线' })
      return
    }

    const total_score = [dry_aroma, wet_aroma, acidity, body, aftertaste, balance, overall]
      .reduce((sum: number, v) => sum + (Number(v) || 0), 0)

    const tx = db.transaction(() => {
      const result = db.prepare(
        `INSERT INTO cupping_scores (curve_id, curve_version_id, batch_code, dry_aroma, wet_aroma, acidity, body, aftertaste, balance, overall, total_score, flavor_anomaly, anomaly_description, cupper_name, cupped_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        curve_id, activeVersion.id, batch_code,
        dry_aroma ?? null, wet_aroma ?? null, acidity ?? null,
        body ?? null, aftertaste ?? null, balance ?? null, overall ?? null,
        total_score, flavor_anomaly ? 1 : 0, anomaly_description ?? null,
        cupper_name, cupped_at
      )

      const scoreId = Number(result.lastInsertRowid)
      logOperation('cupping_score', 'create', cupper_name, 'cupping_score', scoreId,
        `录入杯测评分：${batch_code}${flavor_anomaly ? ' 异常' : ''} 绑定版本 v${activeVersion.version_number}`
      )

      return scoreId
    })

    const scoreId = tx()
    const score = db.prepare('SELECT * FROM cupping_scores WHERE id = ?').get(scoreId)

    res.status(201).json({ success: true, data: score })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const existing = db.prepare('SELECT * FROM cupping_scores WHERE id = ?').get(id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '杯测评分不存在' })
      return
    }

    const {
      dry_aroma, wet_aroma, acidity, body, aftertaste, balance, overall,
      flavor_anomaly, anomaly_description, cupper_name, cupped_at, operator,
    } = req.body

    const d = dry_aroma ?? existing.dry_aroma
    const w = wet_aroma ?? existing.wet_aroma
    const a = acidity ?? existing.acidity
    const b = body ?? existing.body
    const af = aftertaste ?? existing.aftertaste
    const ba = balance ?? existing.balance
    const ov = overall ?? existing.overall
    const total_score = [d, w, a, b, af, ba, ov].reduce((sum, v) => sum + (Number(v) || 0), 0)

    db.prepare(
      `UPDATE cupping_scores SET dry_aroma=?, wet_aroma=?, acidity=?, body=?, aftertaste=?, balance=?, overall=?, total_score=?, flavor_anomaly=?, anomaly_description=?, cupper_name=?, cupped_at=? WHERE id=?`
    ).run(
      d, w, a, b, af, ba, ov, total_score,
      flavor_anomaly !== undefined ? (flavor_anomaly ? 1 : 0) : existing.flavor_anomaly,
      anomaly_description ?? existing.anomaly_description,
      cupper_name ?? existing.cupper_name,
      cupped_at ?? existing.cupped_at,
      id
    )

    logOperation('cupping_score', 'update', operator ?? 'system', 'cupping_score', Number(id),
      `更新杯测评分：${existing.batch_code}`
    )

    const updated = db.prepare('SELECT * FROM cupping_scores WHERE id = ?').get(id)
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

export default router
