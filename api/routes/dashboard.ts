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
      SELECT rc.id, rc.bean_type, 
             cv_active.version_number as active_version,
             cv_draft.version_number as latest_draft_version,
             cv_draft.notes as draft_notes
      FROM roast_curves rc
      INNER JOIN curve_versions cv_active 
        ON cv_active.curve_id = rc.id AND cv_active.status = 'active'
      INNER JOIN curve_versions cv_draft 
        ON cv_draft.curve_id = rc.id AND cv_draft.status = 'draft'
      WHERE cv_draft.version_number > cv_active.version_number
      AND cv_draft.version_number = (
        SELECT MAX(version_number) FROM curve_versions WHERE curve_id = rc.id AND status = 'draft'
      )
      GROUP BY rc.id
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
