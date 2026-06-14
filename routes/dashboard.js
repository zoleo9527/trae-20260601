const express = require('express')
const router = express.Router()
const prisma = require('../prisma/client')
const { success, error } = require('../utils/response')

router.get('/', async (req, res) => {
  try {
    const today = new Date(new Date().toDateString())

    const todayRecords = await prisma.inspectionRecord.count({
      where: { createdAt: { gte: today } }
    })

    const queuingRecords = await prisma.inspectionRecord.findMany({
      where: { status: 'QUEUING' },
      include: { vehicle: true },
      orderBy: { createdAt: 'asc' },
      take: 20
    })

    const inspectingRecords = await prisma.inspectionRecord.findMany({
      where: { status: 'INSPECTING' },
      include: { vehicle: true, line: true, items: true },
      orderBy: { startedAt: 'asc' }
    })

    const timeoutRecords = inspectingRecords.filter(record => {
      if (!record.startedAt) return false
      const diff = (new Date() - new Date(record.startedAt)) / (1000 * 60)
      return diff > 30
    })

    const recentlyRejected = await prisma.inspectionRecord.findMany({
      where: {
        status: 'REJECTED',
        rejectedAt: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) }
      },
      include: { vehicle: true },
      orderBy: { rejectedAt: 'desc' }
    })

    const completedToday = await prisma.inspectionRecord.count({
      where: {
        status: 'COMPLETED',
        completedAt: { gte: today }
      }
    })

    const rejectedToday = await prisma.inspectionRecord.count({
      where: {
        status: 'REJECTED',
        rejectedAt: { gte: today }
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
      todayRecords,
      completedToday,
      rejectedToday,
      queuingCount: queuingRecords.length,
      inspectingCount: inspectingRecords.length,
      timeoutCount: timeoutRecords.length,
      recentlyRejectedCount: recentlyRejected.length,
      queuingRecords,
      inspectingRecords,
      timeoutRecords,
      recentlyRejected,
      lineStats
    }

    res.json(success(result))
  } catch (e) {
    res.json(error('INTERNAL_ERROR', e.message))
  }
})

module.exports = router