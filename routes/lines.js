const express = require('express')
const router = express.Router()
const prisma = require('../prisma/client')
const { success, error } = require('../utils/response')

router.get('/', async (req, res) => {
  try {
    const lines = await prisma.inspectionLine.findMany({
      include: {
        records: {
          where: { status: { in: ['ASSIGNED', 'INSPECTING'] } },
          include: { vehicle: true }
        }
      },
      orderBy: { id: 'asc' }
    })

    const result = lines.map(line => ({
      ...line,
      currentRecord: line.records.length > 0 ? line.records[0] : null
    }))

    res.json(success(result))
  } catch (e) {
    res.json(error('INTERNAL_ERROR', e.message))
  }
})

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const line = await prisma.inspectionLine.findUnique({
      where: { id: parseInt(id) },
      include: {
        records: {
          include: { vehicle: true, items: true }
        }
      }
    })

    if (!line) {
      return res.json(error('LINE_NOT_FOUND'))
    }

    res.json(success(line))
  } catch (e) {
    res.json(error('INTERNAL_ERROR', e.message))
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, status = 'IDLE' } = req.body

    if (!name) {
      return res.json(error('INVALID_PARAMS'))
    }

    const existing = await prisma.inspectionLine.findUnique({ where: { name } })
    if (existing) {
      return res.json(error('DUPLICATE_LINE'))
    }

    const line = await prisma.inspectionLine.create({
      data: { name, status }
    })

    res.json(success(line, '创建检测线成功'))
  } catch (e) {
    res.json(error('INTERNAL_ERROR', e.message))
  }
})

router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const line = await prisma.inspectionLine.findUnique({ where: { id: parseInt(id) } })
    if (!line) return res.json(error('LINE_NOT_FOUND'))

    const updatedLine = await prisma.inspectionLine.update({
      where: { id: parseInt(id) },
      data: { status }
    })

    res.json(success(updatedLine, '更新检测线状态成功'))
  } catch (e) {
    res.json(error('INTERNAL_ERROR', e.message))
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const line = await prisma.inspectionLine.findUnique({ where: { id: parseInt(id) } })
    if (!line) return res.json(error('LINE_NOT_FOUND'))

    await prisma.inspectionLine.delete({ where: { id: parseInt(id) } })
    res.json(success(null, '删除成功'))
  } catch (e) {
    res.json(error('INTERNAL_ERROR', e.message))
  }
})

module.exports = router