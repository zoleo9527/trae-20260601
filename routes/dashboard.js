const express = require('express')
const router = express.Router()
const prisma = require('../prisma/client')
const { success, error } = require('../utils/response')
const { formatRecordSummary } = require('../utils/recordFormatter')

router.get('/', async (req, res) => {
  try {
    const { licensePlate, lineId, status } = req.query
    const today = new Date(new Date().toDateString())

    const baseWhere = { createdAt: { gte: today } }
    if (lineId) baseWhere.lineId = parseInt(lineId)
    if (licensePlate) baseWhere.vehicle = { licensePlate: { contains: licensePlate } }

    const pendingStatuses = ['QUEUING', 'ASSIGNED']
    const shouldQueryPending = !status || pendingStatuses.includes(status)
    const pendingStatusFilter = status && pendingStatuses.includes(status) ? [status] : pendingStatuses
    const todayPendingRecords = shouldQueryPending ? await prisma.inspectionRecord.findMany({
      where: { ...baseWhere, status: { in: pendingStatusFilter } },
      include: { vehicle: true, line: true, items: true, anomalies: true },
      orderBy: { createdAt: 'asc' }
    }) : []

    const inspectingStatus = 'INSPECTING'
    const shouldQueryInspecting = !status || status === inspectingStatus
    const todayInspectingRecords = shouldQueryInspecting ? await prisma.inspectionRecord.findMany({
      where: { ...baseWhere, status: inspectingStatus },
      include: { vehicle: true, line: true, items: true, anomalies: true },
      orderBy: { startedAt: 'asc' }
    }) : []

    const todayTimeoutRecords = todayInspectingRecords.filter(record => {
      if (!record.startedAt) return false
      const diff = (new Date() - new Date(record.startedAt)) / (1000 * 60)
      return diff > 30
    })

    const rejectedStatus = 'REJECTED'
    const shouldQueryRejected = !status || status === rejectedStatus
    const todayRejectedRecords = shouldQueryRejected ? await prisma.inspectionRecord.findMany({
      where: {
        rejectedAt: { gte: today },
        status: rejectedStatus,
        ...(lineId ? { lineId: parseInt(lineId) } : {}),
        ...(licensePlate ? { vehicle: { licensePlate: { contains: licensePlate } } } : {})
      },
      include: { vehicle: true, line: true, items: true, anomalies: true },
      orderBy: { rejectedAt: 'desc' }
    }) : []

    const todayCompletedCount = await prisma.inspectionRecord.count({
      where: { completedAt: { gte: today }, status: 'COMPLETED' }
    })

    const lines = await prisma.inspectionLine.findMany({
      include: {
        records: {
          where: { status: { in: ['ASSIGNED', 'INSPECTING'] } },
          include: { vehicle: true, anomalies: true }
        }
      }
    })

    const lineStats = lines.map(line => ({
      id: line.id,
      name: line.name,
      status: line.status,
      currentRecord: line.records.length > 0 ? formatRecordSummary(line.records[0]) : null
    }))

    const result = {
      todayPendingCount: todayPendingRecords.length,
      todayTimeoutCount: todayTimeoutRecords.length,
      todayRejectedCount: todayRejectedRecords.length,
      todayCompletedCount,
      todayPendingRecords: todayPendingRecords.map(formatRecordSummary),
      todayTimeoutRecords: todayTimeoutRecords.map(formatRecordSummary),
      todayRejectedRecords: todayRejectedRecords.map(formatRecordSummary),
      lineStats
    }

    res.json(success(result))
  } catch (e) {
    res.json(error('INTERNAL_ERROR', e.message))
  }
})

module.exports = router