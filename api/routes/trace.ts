import { Router, type Request, type Response } from 'express'
import { normalizeProcurementGrading, normalizeGradingLevel } from '../utils/grading.js'
import prisma from '../prisma.js'

const router = Router()

router.get('/:procurementId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { procurementId } = req.params
    const procurement = await prisma.procurement.findUnique({
      where: { id: procurementId },
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

    const timeline: any[] = []

    timeline.push({
      type: 'created',
      timestamp: procurement.createdAt,
      user: procurement.createdBy,
      data: {
        flowerName: procurement.flowerName,
        quantity: procurement.quantity,
        unit: procurement.unit,
        supplier: procurement.supplier,
        urgency: procurement.urgency,
        remarks: procurement.remarks,
      },
    })

    procurement.statusChanges.forEach((change) => {
      timeline.push({
        type: 'status_change',
        timestamp: change.changedAt,
        user: change.changedBy,
        data: {
          fromStatus: change.fromStatus,
          toStatus: change.toStatus,
          reason: change.reason,
        },
      })
    })

    if (procurement.grading) {
      timeline.push({
        type: 'grading',
        timestamp: procurement.grading.gradedAt,
        user: procurement.grading.gradedBy,
        data: {
          level: normalizeGradingLevel(procurement.grading.level),
          anomalyNote: procurement.grading.anomalyNote,
          remarks: procurement.grading.remarks,
        },
      })
    }

    timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    res.status(200).json({
      success: true,
      data: {
        procurement: normalizeProcurementGrading(procurement),
        timeline,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server internal error' })
  }
})

export default router
