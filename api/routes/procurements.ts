import { Router, type Request, type Response } from 'express'
import { normalizeProcurementGrading } from '../utils/grading.js'
import prisma from '../prisma.js'

const router = Router()

const urgencyOrder: Record<string, number> = {
  CRITICAL: 0,
  URGENT: 1,
  NORMAL: 2,
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search, page = '1', pageSize = '10', startDate, endDate } = req.query
    const pageNum = parseInt(page as string)
    const pageSizeNum = parseInt(pageSize as string)
    const skip = (pageNum - 1) * pageSizeNum

    const where: any = {}
    if (status) {
      where.status = status as string
    }
    if (search) {
      where.OR = [
        { flowerName: { contains: search as string, mode: 'insensitive' } },
        { supplier: { contains: search as string, mode: 'insensitive' } },
      ]
    }
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string)
      }
    }

    const [procurements, total] = await Promise.all([
      prisma.procurement.findMany({
        where,
        include: {
          createdBy: { select: { id: true, name: true, role: true } },
          grading: true,
        },
        orderBy: [
          { urgency: 'asc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: pageSizeNum,
      }),
      prisma.procurement.count({ where }),
    ])

    const normalizedProcurements = procurements.map(p => normalizeProcurementGrading(p));
    const sortedProcurements = normalizedProcurements.sort((a, b) => {
      const aOrder = urgencyOrder[a.urgency] ?? 99
      const bOrder = urgencyOrder[b.urgency] ?? 99
      if (aOrder !== bOrder) return aOrder - bOrder
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    res.status(200).json({
      success: true,
      data: {
        list: sortedProcurements,
        pagination: {
          page: pageNum,
          pageSize: pageSizeNum,
          total,
          totalPages: Math.ceil(total / pageSizeNum),
        },
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server internal error' })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { flowerName, quantity, unit, supplier, urgency, remarks, createdById } = req.body
    const procurement = await prisma.procurement.create({
      data: {
        flowerName,
        quantity,
        unit: unit || '扎',
        supplier,
        urgency: urgency || 'NORMAL',
        remarks,
        createdById,
      },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
        grading: true,
      },
    })
    res.status(201).json({ success: true, data: normalizeProcurementGrading(procurement) })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server internal error' })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const procurement = await prisma.procurement.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
        grading: {
          include: {
            gradedBy: { select: { id: true, name: true, role: true } },
          },
        },
        statusChanges: {
          include: {
            changedBy: { select: { id: true, name: true, role: true } },
          },
          orderBy: { changedAt: 'asc' },
        },
      },
    })
    if (!procurement) {
      res.status(404).json({ success: false, error: 'Procurement not found' })
      return
    }
    res.status(200).json({ success: true, data: normalizeProcurementGrading(procurement) })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server internal error' })
  }
})

router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { flowerName, quantity, unit, supplier, urgency, remarks } = req.body
    const procurement = await prisma.procurement.update({
      where: { id },
      data: {
        flowerName,
        quantity,
        unit,
        supplier,
        urgency,
        remarks,
      },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
        grading: true,
      },
    })
    res.status(200).json({ success: true, data: normalizeProcurementGrading(procurement) })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server internal error' })
  }
})

router.post('/:id/submit', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { changedById } = req.body
    const procurement = await prisma.procurement.findUnique({ where: { id } })
    if (!procurement) {
      res.status(404).json({ success: false, error: 'Procurement not found' })
      return
    }
    if (procurement.status !== 'PENDING') {
      res.status(400).json({ success: false, error: 'Only PENDING procurements can be submitted' })
      return
    }
    const updated = await prisma.$transaction(async (tx) => {
      const updatedProcurement = await tx.procurement.update({
        where: { id },
        data: { status: 'IN_PROGRESS' },
        include: {
          createdBy: { select: { id: true, name: true, role: true } },
          grading: true,
          statusChanges: true,
        },
      })
      await tx.statusChange.create({
        data: {
          procurementId: id,
          fromStatus: 'PENDING',
          toStatus: 'IN_PROGRESS',
          changedById,
        },
      })
      return updatedProcurement
    })
    res.status(200).json({ success: true, data: normalizeProcurementGrading(updated) })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server internal error' })
  }
})

router.post('/:id/reject', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { changedById, reason } = req.body
    const procurement = await prisma.procurement.findUnique({ where: { id } })
    if (!procurement) {
      res.status(404).json({ success: false, error: 'Procurement not found' })
      return
    }
    const updated = await prisma.$transaction(async (tx) => {
      const updatedProcurement = await tx.procurement.update({
        where: { id },
        data: { status: 'REJECTED' },
        include: {
          createdBy: { select: { id: true, name: true, role: true } },
          grading: true,
          statusChanges: true,
        },
      })
      await tx.statusChange.create({
        data: {
          procurementId: id,
          fromStatus: procurement.status,
          toStatus: 'REJECTED',
          changedById,
          reason,
        },
      })
      return updatedProcurement
    })
    res.status(200).json({ success: true, data: normalizeProcurementGrading(updated) })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server internal error' })
  }
})

router.post('/:id/close', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { changedById } = req.body
    const procurement = await prisma.procurement.findUnique({ where: { id } })
    if (!procurement) {
      res.status(404).json({ success: false, error: 'Procurement not found' })
      return
    }
    const updated = await prisma.$transaction(async (tx) => {
      const updatedProcurement = await tx.procurement.update({
        where: { id },
        data: { status: 'CLOSED' },
        include: {
          createdBy: { select: { id: true, name: true, role: true } },
          grading: true,
          statusChanges: true,
        },
      })
      await tx.statusChange.create({
        data: {
          procurementId: id,
          fromStatus: procurement.status,
          toStatus: 'CLOSED',
          changedById,
        },
      })
      return updatedProcurement
    })
    res.status(200).json({ success: true, data: normalizeProcurementGrading(updated) })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server internal error' })
  }
})

router.post('/:id/resubmit', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { changedById } = req.body
    const procurement = await prisma.procurement.findUnique({ where: { id } })
    if (!procurement) {
      res.status(404).json({ success: false, error: 'Procurement not found' })
      return
    }
    if (procurement.status !== 'REJECTED') {
      res.status(400).json({ success: false, error: 'Only REJECTED procurements can be resubmitted' })
      return
    }
    const updated = await prisma.$transaction(async (tx) => {
      const updatedProcurement = await tx.procurement.update({
        where: { id },
        data: { status: 'IN_PROGRESS' },
        include: {
          createdBy: { select: { id: true, name: true, role: true } },
          grading: true,
          statusChanges: true,
        },
      })
      await tx.statusChange.create({
        data: {
          procurementId: id,
          fromStatus: 'REJECTED',
          toStatus: 'IN_PROGRESS',
          changedById,
        },
      })
      return updatedProcurement
    })
    res.status(200).json({ success: true, data: normalizeProcurementGrading(updated) })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server internal error' })
  }
})

router.post('/:id/flag-review', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { changedById } = req.body
    const procurement = await prisma.procurement.findUnique({ where: { id } })
    if (!procurement) {
      res.status(404).json({ success: false, error: 'Procurement not found' })
      return
    }
    const updated = await prisma.$transaction(async (tx) => {
      const updatedProcurement = await tx.procurement.update({
        where: { id },
        data: { status: 'NEEDS_REVIEW' },
        include: {
          createdBy: { select: { id: true, name: true, role: true } },
          grading: true,
          statusChanges: true,
        },
      })
      await tx.statusChange.create({
        data: {
          procurementId: id,
          fromStatus: procurement.status,
          toStatus: 'NEEDS_REVIEW',
          changedById,
        },
      })
      return updatedProcurement
    })
    res.status(200).json({ success: true, data: normalizeProcurementGrading(updated) })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server internal error' })
  }
})

export default router
