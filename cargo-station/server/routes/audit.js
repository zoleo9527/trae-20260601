import { Router } from 'express'
import { getDB } from '../db.js'

const router = Router()

router.get('/', (req, res) => {
  const { auditLogs } = getDB()
  let filtered = [...auditLogs]

  if (req.query.recordId) {
    filtered = filtered.filter(a => a.recordId === Number(req.query.recordId))
  }
  if (req.query.recordType) {
    filtered = filtered.filter(a => a.recordType === req.query.recordType)
  }
  if (req.query.operator) {
    filtered = filtered.filter(a => a.operator.includes(req.query.operator))
  }
  if (req.query.operatorRole) {
    filtered = filtered.filter(a => a.operatorRole === req.query.operatorRole)
  }

  filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

  res.json({ total: filtered.length, data: filtered })
})

router.get('/stats', (req, res) => {
  const { auditLogs, acceptanceRecords } = getDB()
  const byRole = {}
  auditLogs.forEach(a => {
    if (!byRole[a.operatorRole]) byRole[a.operatorRole] = 0
    byRole[a.operatorRole]++
  })
  const byStatus = {}
  acceptanceRecords.forEach(a => {
    if (!byStatus[a.status]) byStatus[a.status] = 0
    byStatus[a.status]++
  })
  res.json({ byRole, byStatus, totalAudits: auditLogs.length, totalRecords: acceptanceRecords.length })
})

export { router as auditRouter }
