const express = require('express')
const router = express.Router()
const prisma = require('../prisma/client')
const { success, error } = require('../utils/response')

router.get('/', async (req, res) => {
  try {
    const today = new Date(new Date().toDateString())

    const todayPendingRecords = await prisma.inspectionRecord.findMany({
      where: {
        createdAt: { gte: today },
        status: { in: ['QUEUING', 'ASSIGNED'] }
      },
      include: { vehicle: true, line: true },
      orderBy: { createdAt: 'asc' }
    })

    const todayInspectingRecords = await prisma.inspectionRecord.findMany({
      where: {
        createdAt: { gte: today },
        status: 'INSPECTING'
      },
      include: { vehicle: true, line: true, items: true },
      orderBy: { startedAt: 'asc' }
    })

    const todayTimeoutRecords = todayInspectingRecords.filter(record => {
      if (!record.startedAt) return false
      const diff = (new Date() - new Date(record.startedAt)) / (1000 * 60)
      return diff > 30
    })

    const todayRejectedRecords = await prisma.inspectionRecord.findMany({
      where: {
        rejectedAt: { gte: today },
        status: 'REJECTED'
      },
      include: { vehicle: true, line: true },
      orderBy: { rejectedAt: 'desc' }
    })

    const todayCompletedCount = await prisma.inspectionRecord.count({
      where: {
        completedAt: { gte: today },
        status: 'COMPLETED'
      }
    })

    const lines = await prisma.inspectionLine.findMany({
      include: {
        records: {
          where: { status: { in: ['ASSIGNED', 'INSPECTING'] } },
          include: { vehicle: true }
        }
      }
    })

    const lineStats = lines.map(line => ({
      id: line.id,
      name: line.name,
      status: line.status,
      currentRecord: line.records.length > 0 ? line.records[0] : null
    }))

    const result = {
      todayPendingCount: todayPendingRecords.length,
      todayTimeoutCount: todayTimeoutRecords.length,
      todayRejectedCount: todayRejectedRecords.length,
      todayCompletedCount,
      todayPendingRecords,
      todayTimeoutRecords,
      todayRejectedRecords,
      lineStats
    }

    res.json(success(result))
  } catch (e) {
    res.json(error('INTERNAL_ERROR', e.message))
  }
})

module.exports = router