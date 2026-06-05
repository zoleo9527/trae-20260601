import { Router, type Request, type Response } from 'express'
import { OrderStatus } from '../generated/prisma/enums.js'
import { authenticate, requireRole } from '../lib/auth.js'
import prisma from '../lib/prisma.js'

const router = Router()

const userSelect = { id: true, username: true, role: true, displayName: true } as const

router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId, page = '1', limit = '20' } = req.query
    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const skip = (pageNum - 1) * limitNum

    const where: Record<string, unknown> = {}
    if (orderId) where.orderId = orderId as string

    const [data, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        include: {
          order: true,
          createdBy: { select: userSelect },
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.shipment.count({ where }),
    ])

    res.json({ data, total, page: pageNum, totalPages: Math.ceil(total / limitNum) })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { id: req.params.id },
      include: { order: true },
    })
    if (!shipment) {
      res.status(404).json({ error: 'Shipment not found' })
      return
    }
    res.json(shipment)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.patch('/:id/confirm', authenticate, requireRole('PACKER'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { logisticsCompany, trackingNo } = req.body
    if (!logisticsCompany || !trackingNo) {
      res.status(400).json({ error: 'Missing logisticsCompany or trackingNo' })
      return
    }

    const shipment = await prisma.shipment.findUnique({ where: { id: req.params.id } })
    if (!shipment) {
      res.status(404).json({ error: 'Shipment not found' })
      return
    }

    const order = await prisma.order.findUnique({ where: { id: shipment.orderId } })
    if (!order) {
      res.status(404).json({ error: 'Order not found' })
      return
    }
    if (order.status !== OrderStatus.READY_TO_SHIP) {
      res.status(400).json({ error: 'Order must be in READY_TO_SHIP status' })
      return
    }

    const [updatedShipment] = await Promise.all([
      prisma.shipment.update({
        where: { id: req.params.id },
        data: {
          logisticsCompany,
          trackingNo,
          shippedAt: new Date(),
          shippedById: req.user!.id,
        },
      }),
      prisma.order.update({
        where: { id: shipment.orderId },
        data: {
          status: OrderStatus.SHIPPED,
          auditLogs: {
            create: {
              userId: req.user!.id,
              action: 'SHIP',
              fromStatus: OrderStatus.READY_TO_SHIP,
              toStatus: OrderStatus.SHIPPED,
              remark: `${logisticsCompany} - ${trackingNo}`,
            },
          },
        },
      }),
    ])

    res.json(updatedShipment)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.patch('/:id/receive', authenticate, requireRole('SALES'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { receiveRemark } = req.body

    const shipment = await prisma.shipment.findUnique({ where: { id: req.params.id } })
    if (!shipment) {
      res.status(404).json({ error: 'Shipment not found' })
      return
    }

    const order = await prisma.order.findUnique({ where: { id: shipment.orderId } })
    if (!order) {
      res.status(404).json({ error: 'Order not found' })
      return
    }
    if (order.status !== OrderStatus.SHIPPED) {
      res.status(400).json({ error: 'Order must be in SHIPPED status' })
      return
    }

    const [updatedShipment] = await Promise.all([
      prisma.shipment.update({
        where: { id: req.params.id },
        data: {
          receivedAt: new Date(),
          receivedById: req.user!.id,
          receiveRemark: receiveRemark || null,
        },
      }),
      prisma.order.update({
        where: { id: shipment.orderId },
        data: {
          status: OrderStatus.COMPLETED,
          auditLogs: {
            create: {
              userId: req.user!.id,
              action: 'RECEIVE',
              fromStatus: OrderStatus.SHIPPED,
              toStatus: OrderStatus.COMPLETED,
              remark: receiveRemark || null,
            },
          },
        },
      }),
    ])

    res.json(updatedShipment)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
