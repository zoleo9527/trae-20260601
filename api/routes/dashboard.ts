import { Router, type Request, type Response } from 'express'
import { getDiversions, getMissedItems } from '../db.js'

const router = Router()

function getPriorityScore(d: ReturnType<typeof getDiversions>[0]): number {
  let score = 0
  if (d.urgency === 'timeout') score += 100
  if (d.urgency === 'urgent') score += 50
  if (d.anomalyType.includes('review_failed')) score += 30
  if (d.anomalyType.includes('missing_material')) score += 20
  if (d.anomalyType.includes('timeout')) score += 40
  if (d.status === 'pending') score += 10
  if (d.status === 'rejected') score += 15
  return score
}

router.get('/', (req: Request, res: Response): void => {
  const today = new Date('2026-06-04')
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()

  const allDiversions = getDiversions()
  const todayDiversions = allDiversions.filter((d) => d.createdAt >= todayStart && d.createdAt < todayEnd)

  const urgentDiversions = todayDiversions
    .filter((d) => d.urgency === 'urgent' || d.urgency === 'timeout' || d.anomalyType.length > 0)
    .sort((a, b) => getPriorityScore(b) - getPriorityScore(a))

  const pendingDiversions = todayDiversions
    .filter((d) => d.status === 'pending' || d.status === 'rejected')
    .sort((a, b) => getPriorityScore(b) - getPriorityScore(a))

  const allMissed = getMissedItems()
  const todayMissed = allMissed.filter((m) => m.createdAt >= todayStart && m.createdAt < todayEnd)

  const missedStats = {
    pending: todayMissed.filter((m) => m.status === 'pending').length,
    reminded: todayMissed.filter((m) => m.status === 'reminded').length,
    completed: todayMissed.filter((m) => m.status === 'completed').length,
    closed: todayMissed.filter((m) => m.status === 'closed').length,
    total: todayMissed.length,
  }

  const anomalyBreakdown = {
    missing_material: todayDiversions.filter((d) => d.anomalyType.includes('missing_material')).length,
    timeout: todayDiversions.filter((d) => d.anomalyType.includes('timeout') || d.urgency === 'timeout').length,
    review_failed: todayDiversions.filter((d) => d.anomalyType.includes('review_failed')).length,
  }

  const recentMissed = todayMissed
    .filter((m) => m.status === 'pending' || m.status === 'reminded')
    .slice(0, 5)

  res.json({
    urgentDiversions,
    pendingDiversions,
    missedStats,
    anomalyBreakdown,
    recentMissed,
    todayDate: '2026-06-04',
  })
})

export default router
