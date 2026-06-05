import { Router, type Request, type Response } from 'express'
import prisma from '../prisma.js'

const router = Router()

const urgencyOrder: Record<string, number> = {
  URGENT: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3,
}

router.get('/pending', async (req: Request, res: Response): Promise<void> => {
  try {
    const procurements = await prisma.procurement.findMany({
      where: { status: 'IN_PROGRESS' },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
        grading: true,
      },
      orderBy: [
        { urgency: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    const sorted = procurements.sort((a, b) => {
      const aOrder = urgencyOrder[a.urgency] ?? 99
      const bOrder = urgencyOrder[b.urgency] ?? 99
      if (aOrder !== bOrder) return aOrder - bOrder
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })

    res.status(200).json({ success: true, data: sorted })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server internal error' })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { procurementId, level, gradedById, anomalyNote, remarks } = req.body
    const procurement = await prisma.procurement.findUnique({ where: { id: procurementId } })
    if (!procurement) {
      res.status(404).json({ success: false, error: 'Procurement not found' })
      return
    }
    const result = await prisma.$transaction(async (tx) => {
      const grading = await tx.grading.create({
        data: {
          procurementId,
          level,
          gradedById,
          anomalyNote,
          remarks,
        },
        include: {
          procurement: {
            include: {
              createdBy: { select: { id: true, name: true, role: true } },
            },
          },
          gradedBy: { select: { id: true, name: true, role: true } },
        },
      })
      await tx.procurement.update({
        where: { id: procurementId },
        data: { status: 'CLOSED' },
      })
      await tx.statusChange.create({
        data: {
          procurementId,
          fromStatus: procurement.status,
          toStatus: 'CLOSED',
          changedById: gradedById,
        },
      })
      return grading
    })
    res.status(201).json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server internal error' })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const grading = await prisma.grading.findUnique({
      where: { id },
      include: {
        procurement: {
          include: {
            createdBy: { select: { id: true, name: true, role: true } },
          },
        },
        gradedBy: { select: { id: true, name: true, role: true } },
      },
    })
    if (!grading) {
      res.status(404).json({ success: false, error: 'Grading not found' })
      return
    }
    res.status(200).json({ success: true, data: grading })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server internal error' })
  }
})

export default router
