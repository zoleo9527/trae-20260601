const express = require('express')
const router = express.Router()
const prisma = require('../prisma/client')
const { success, error } = require('../utils/response')

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, recordId, resolved } = req.query
    const skip = (page - 1) * limit

    const where = {}
    if (recordId) where.recordId = parseInt(recordId)
    if (resolved !== undefined) where.resolved = resolved === 'true'

    const anomalies = await prisma.anomalyRecord.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        record: {
          include: { vehicle: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const total = await prisma.anomalyRecord.count({ where })

    res.json(success({ anomalies, total, page: parseInt(page), limit: parseInt(limit) }))
  } catch (e) {
    res.json(error('INTERNAL_ERROR', e.message))
  }
})

router.post('/', async (req, res) => {
  try {
    const { recordId, anomalyType, description, operator } = req.body

    if (!recordId || !anomalyType || !description || !operator) {
      return res.json(error('INVALID_PARAMS'))
    }

    const record = await prisma.inspectionRecord.findUnique({ where: { id: parseInt(recordId) } })
    if (!record) return res.json(error('RECORD_NOT_FOUND'))

    const anomaly = await prisma.anomalyRecord.create({
      data: {
        recordId: parseInt(recordId),
        anomalyType,
        description,
        operator
      },
      include: {
        record: {
          include: { vehicle: true }
        }
      }
    })

    res.json(success(anomaly, '创建异常记录成功'))
  } catch (e) {
    res.json(error('INTERNAL_ERROR', e.message))
  }
})

router.put('/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params
    const { resolvedBy } = req.body

    const anomaly = await prisma.anomalyRecord.findUnique({ where: { id: parseInt(id) } })
    if (!anomaly) return res.json(error('RECORD_NOT_FOUND'))

    const updatedAnomaly = await prisma.anomalyRecord.update({
      where: { id: parseInt(id) },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy
      },
      include: {
        record: {
          include: { vehicle: true }
        }
      }
    })

    res.json(success(updatedAnomaly, '异常已处理'))
  } catch (e) {
    res.json(error('INTERNAL_ERROR', e.message))
  }
})

module.exports = router