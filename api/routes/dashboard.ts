import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const draftCurves = db.prepare(
      "SELECT COUNT(*) as count FROM roast_curves WHERE status = 'draft'"
    ).get() as { count: number }

    const anomalyScores = db.prepare(
      'SELECT COUNT(*) as count FROM cupping_scores WHERE flavor_anomaly = 1'
    ).get() as { count: number }

    const pendingComplaints = db.prepare(
      "SELECT COUNT(*) as count FROM complaints WHERE status = 'pending'"
    ).get() as { count: number }

    const processingComplaints = db.prepare(
      "SELECT COUNT(*) as count FROM complaints WHERE status = 'processing'"
    ).get() as { count: number }

    const expiredBatches = db.prepare(
      "SELECT COUNT(*) as count FROM inventory_batches WHERE status = 'expired'"
    ).get() as { count: number }

    const nearExpiryBatches = db.prepare(
      "SELECT COUNT(*) as count FROM inventory_batches WHERE status = 'near_expiry'"
    ).get() as { count: number }

    const versionConflicts = db.prepare(`
      SELECT rc.id, rc.bean_type, rc.current_version
      FROM roast_curves rc
      WHERE rc.status = 'active'
      AND rc.current_version > 1
      AND EXISTS (
        SELECT 1 FROM curve_versions cv
        WHERE cv.curve_id = rc.id AND cv.status = 'draft'
      )
    `).all()

    const anomalyScoreDetails = db.prepare(`
      SELECT cs.id, cs.batch_code, cs.total_score, cs.anomaly_description, rc.bean_type
      FROM cupping_scores cs
      LEFT JOIN roast_curves rc ON cs.curve_id = rc.id
      WHERE cs.flavor_anomaly = 1
      ORDER BY cs.cupped_at DESC
    `).all()

    const recentLogs = db.prepare(
      "SELECT * FROM operation_logs WHERE created_at >= datetime('now', '-24 hours') ORDER BY created_at DESC LIMIT 20"
    ).all()

    res.json({
      success: true,
      data: {
        pending: {
          draftCurves: draftCurves.count,
          anomalyScores: anomalyScores.count,
          pendingComplaints: pendingComplaints.count,
          processingComplaints: processingComplaints.count,
        },
        risks: {
          expiredBatches: expiredBatches.count,
          nearExpiryBatches: nearExpiryBatches.count,
          anomalyScores: anomalyScoreDetails,
          versionConflicts,
        },
        recentChanges: recentLogs,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

export default router
