const express = require('express')
const router = express.Router()
const prisma = require('../prisma/client')
const { success, error } = require('../utils/response')

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, licensePlate, lineId } = req.query
    const skip = (page - 1) * limit
    
    const where = {}
    if (status) where.status = status
    if (licensePlate) where.vehicle = { licensePlate: { contains: licensePlate } }
    if (lineId) where.lineId = parseInt(lineId)

    const records = await prisma.inspectionRecord.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        vehicle: true,
        line: true,
        items: true,
        anomalies: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const total = await prisma.inspectionRecord.count({ where })

    res.json(success({ records, total, page: parseInt(page), limit: parseInt(limit) }))
  } catch (e) {
    res.json(error('INTERNAL_ERROR', e.message))
  }
})

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const record = await prisma.inspectionRecord.findUnique({
      where: { id: parseInt(id) },
      include: {
        vehicle: true,
        line: true,
        items: true,
        anomalies: true
      }
    })

    if (!record) {
      return res.json(error('RECORD_NOT_FOUND'))
    }

    res.json(success(record))
  } catch (e) {
    res.json(error('INTERNAL_ERROR', e.message))
  }
})

router.post('/', async (req, res) => {
  try {
    const { licensePlate, vehicleType, ownerName, ownerPhone, vin } = req.body

    if (!licensePlate || !vehicleType || !ownerName || !ownerPhone) {
      return res.json(error('INVALID_PARAMS'))
    }

    let vehicle = await prisma.vehicle.findUnique({ where: { licensePlate } })
    if (!vehicle) {
      vehicle = await prisma.vehicle.create({
        data: { licensePlate, vehicleType, ownerName, ownerPhone, vin }
      })
    }

    const todayRecords = await prisma.inspectionRecord.count({
      where: {
        createdAt: { gte: new Date(new Date().toDateString()) }
      }
    })
    const queueNumber = `Q${String(todayRecords + 1).padStart(4, '0')}`

    const record = await prisma.inspectionRecord.create({
      data: {
        vehicleId: vehicle.id,
        status: 'QUEUING',
        queueNumber,
        items: {
          create: [
            { itemCode: 'L001', itemName: '外观检查' },
            { itemCode: 'L002', itemName: '制动系统' },
            { itemCode: 'L003', itemName: '灯光系统' },
            { itemCode: 'L004', itemName: '尾气排放' },
            { itemCode: 'L005', itemName: '底盘检查' },
            { itemCode: 'L006', itemName: '综合判定' }
          ]
        }
      },
      include: { vehicle: true }
    })

    res.json(success(record, '创建检测记录成功'))
  } catch (e) {
    res.json(error('INTERNAL_ERROR', e.message))
  }
})

router.put('/:id/assign', async (req, res) => {
  try {
    const { id } = req.params
    const { lineId } = req.body

    const record = await prisma.inspectionRecord.findUnique({ where: { id: parseInt(id) } })
    if (!record) return res.json(error('RECORD_NOT_FOUND'))
    if (record.status !== 'QUEUING') return res.json(error('RECORD_STATUS_ERROR'))

    const line = await prisma.inspectionLine.findUnique({ where: { id: parseInt(lineId) } })
    if (!line) return res.json(error('LINE_NOT_FOUND'))
    if (line.status === 'MAINTENANCE') return res.json(error('LINE_MAINTENANCE'))

    const busyRecords = await prisma.inspectionRecord.count({
      where: {
        lineId: parseInt(lineId),
        status: { in: ['ASSIGNED', 'INSPECTING'] }
      }
    })
    if (busyRecords > 0) return res.json(error('LINE_BUSY'))

    const updatedRecord = await prisma.inspectionRecord.update({
      where: { id: parseInt(id) },
      data: {
        lineId: parseInt(lineId),
        status: 'ASSIGNED',
        assignedAt: new Date()
      },
      include: { vehicle: true, line: true }
    })

    await prisma.inspectionLine.update({
      where: { id: parseInt(lineId) },
      data: { status: 'BUSY' }
    })

    res.json(success(updatedRecord, '分配检测线成功'))
  } catch (e) {
    res.json(error('INTERNAL_ERROR', e.message))
  }
})

router.put('/:id/start', async (req, res) => {
  try {
    const { id } = req.params

    const record = await prisma.inspectionRecord.findUnique({ where: { id: parseInt(id) } })
    if (!record) return res.json(error('RECORD_NOT_FOUND'))
    if (record.status !== 'ASSIGNED') return res.json(error('RECORD_STATUS_ERROR'))

    const updatedRecord = await prisma.inspectionRecord.update({
      where: { id: parseInt(id) },
      data: {
        status: 'INSPECTING',
        startedAt: new Date()
      },
      include: { vehicle: true, line: true }
    })

    res.json(success(updatedRecord, '开始检测成功'))
  } catch (e) {
    res.json(error('INTERNAL_ERROR', e.message))
  }
})

router.put('/:id/complete-item', async (req, res) => {
  try {
    const { id } = req.params
    const { itemId, result, measuredValue, referenceValue, inspector } = req.body

    const record = await prisma.inspectionRecord.findUnique({ where: { id: parseInt(id) } })
    if (!record) return res.json(error('RECORD_NOT_FOUND'))
    if (record.status !== 'INSPECTING') return res.json(error('RECORD_STATUS_ERROR'))

    const item = await prisma.inspectionItem.findUnique({ where: { id: parseInt(itemId) } })
    if (!item || item.recordId !== parseInt(id)) return res.json(error('INVALID_PARAMS'))

    await prisma.inspectionItem.update({
      where: { id: parseInt(itemId) },
      data: { result, measuredValue, referenceValue, inspector, inspectedAt: new Date() }
    })

    const items = await prisma.inspectionItem.findMany({ where: { recordId: parseInt(id) } })
    const completedItems = items.filter(i => i.result !== 'PENDING')
    const currentStep = completedItems.length

    let status = record.status
    let completedAt = null

    if (currentStep >= record.totalSteps) {
      const failedItems = items.filter(i => i.result === 'FAIL')
      status = failedItems.length > 0 ? 'COMPLETED' : 'COMPLETED'
      completedAt = new Date()
    }

    const updatedRecord = await prisma.inspectionRecord.update({
      where: { id: parseInt(id) },
      data: { currentStep, status, completedAt },
      include: { vehicle: true, line: true, items: true }
    })

    if (status === 'COMPLETED' && record.lineId) {
      await prisma.inspectionLine.update({
        where: { id: record.lineId },
        data: { status: 'IDLE' }
      })
    }

    res.json(success(updatedRecord, '项目记录更新成功'))
  } catch (e) {
    res.json(error('INTERNAL_ERROR', e.message))
  }
})

router.put('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params
    const { rejectReason } = req.body

    const record = await prisma.inspectionRecord.findUnique({ where: { id: parseInt(id) } })
    if (!record) return res.json(error('RECORD_NOT_FOUND'))

    const lineId = record.lineId

    const updatedRecord = await prisma.inspectionRecord.update({
      where: { id: parseInt(id) },
      data: {
        status: 'REJECTED',
        rejectReason,
        rejectedAt: new Date()
      },
      include: { vehicle: true, line: true }
    })

    if (lineId) {
      await prisma.inspectionLine.update({
        where: { id: lineId },
        data: { status: 'IDLE' }
      })
    }

    res.json(success(updatedRecord, '退回记录成功'))
  } catch (e) {
    res.json(error('INTERNAL_ERROR', e.message))
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const record = await prisma.inspectionRecord.findUnique({ where: { id: parseInt(id) } })
    if (!record) return res.json(error('RECORD_NOT_FOUND'))

    await prisma.inspectionRecord.delete({ where: { id: parseInt(id) } })
    res.json(success(null, '删除成功'))
  } catch (e) {
    res.json(error('INTERNAL_ERROR', e.message))
  }
})

module.exports = router