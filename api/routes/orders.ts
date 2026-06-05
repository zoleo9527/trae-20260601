import { Router, type Request, type Response } from 'express'

import { OrderStatus } from '../generated/prisma/enums.js'
import { authenticate, requireRole } from '../lib/auth.js'
import prisma from '../lib/prisma.js'

const router = Router()

const userSelect = { id: true, username: true, role: true, displayName: true } as const

router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search, page = '1', limit = '20' } = req.query
    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const skip = (pageNum - 1) * limitNum

    const where: Record<string, unknown> = {}
    if (status === 'ABNORMAL') {
      where.status = { in: [OrderStatus.RETURNED, OrderStatus.EXCEPTION] }
    } else if (status) {
      where.status = status as string
    }
    if (search) where.distributorName = { contains: search as string }

    const [data, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: true,
          createdBy: { select: userSelect },
          auditLogs: {
            where: {
              action: { in: ['RETURN', 'MARK_EXCEPTION'] },
            },
            include: { user: { select: userSelect } },
            orderBy: { createdAt: 'desc' },
          },
        },
        skip,
        take: limitNum,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ])

    const dataWithAbnormalSummary = data.map((order) => {
      const latestAbnormalLog = (order.auditLogs?.[0] as any) || null
      return {
        ...order,
        latestAbnormalLog,
      }
    })

    res.json({ data: dataWithAbnormalSummary, total, page: pageNum, totalPages: Math.ceil(total / limitNum) })
  } catch (error) {
    console.error('Error fetching orders:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: true,
        createdBy: { select: userSelect },
        shipments: true,
        auditLogs: {
          include: { user: { select: userSelect } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    if (!order) {
      res.status(404).json({ error: 'Order not found' })
      return
    }
    res.json(order)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', authenticate, requireRole('SALES'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { distributorName, deliveryDate, remark, items } = req.body
    if (!distributorName || !deliveryDate || !items?.length) {
      res.status(400).json({ error: 'Missing required fields' })
      return
    }

    const order = await prisma.order.create({
      data: {
        orderNo: 'PO' + Date.now(),
        distributorName,
        deliveryDate,
        remark: remark || null,
        status: OrderStatus.PENDING_CONFIRM,
        createdById: req.user!.id,
        items: {
          create: items.map((item: { productName: string; specification: string; quantity: number; unit: string }) => ({
            productName: item.productName,
            specification: item.specification,
            quantity: item.quantity,
            unit: item.unit,
          })),
        },
        auditLogs: {
          create: {
            userId: req.user!.id,
            action: 'CREATE',
            toStatus: OrderStatus.PENDING_CONFIRM,
          },
        },
      },
      include: {
        items: true,
        createdBy: { select: userSelect },
      },
    })

    res.status(201).json(order)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.patch('/:id/status', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { action, reason } = req.body
    const userRole = req.user!.role
    const userId = req.user!.id

    if (!action) {
      res.status(400).json({ error: 'Missing action' })
      return
    }

    const order = await prisma.order.findUnique({ where: { id } })
    if (!order) {
      res.status(404).json({ error: 'Order not found' })
      return
    }

    const fromStatus = order.status
    let toStatus: OrderStatus | null = null

    switch (action) {
      case 'CONFIRM':
        if (userRole !== 'BREWER') {
          res.status(403).json({ error: 'Only BREWER can confirm orders' })
          return
        }
        if (fromStatus !== 'PENDING_CONFIRM') {
          res.status(400).json({ error: 'Order must be in PENDING_CONFIRM status' })
          return
        }
        toStatus = OrderStatus.IN_PRODUCTION
        break

      case 'COMPLETE_PRODUCTION':
        if (userRole !== 'BREWER') {
          res.status(403).json({ error: 'Only BREWER can complete production' })
          return
        }
        if (fromStatus !== 'IN_PRODUCTION') {
          res.status(400).json({ error: 'Order must be in IN_PRODUCTION status' })
          return
        }
        toStatus = OrderStatus.READY_TO_SHIP
        break

      case 'RETURN':
        if (!reason) {
          res.status(400).json({ error: 'Reason is required for return' })
          return
        }
        if (!['SALES', 'BREWER', 'PACKER', 'ADMIN'].includes(userRole)) {
          res.status(403).json({ error: 'Permission denied' })
          return
        }
        if (['COMPLETED', 'DRAFT'].includes(fromStatus)) {
          res.status(400).json({ error: 'Cannot return completed or draft orders' })
          return
        }
        toStatus = OrderStatus.RETURNED
        break

      case 'MARK_EXCEPTION':
        if (userRole !== 'ADMIN') {
          res.status(403).json({ error: 'Only ADMIN can mark exception' })
          return
        }
        toStatus = OrderStatus.EXCEPTION
        break

      case 'RESUBMIT':
        if (userRole !== 'ADMIN') {
          res.status(403).json({ error: 'Only ADMIN can resubmit' })
          return
        }
        if (fromStatus !== 'RETURNED' && fromStatus !== 'EXCEPTION') {
          res.status(400).json({ error: 'Order must be in RETURNED or EXCEPTION status' })
          return
        }
        toStatus = OrderStatus.PENDING_CONFIRM
        break

      default:
        res.status(400).json({ error: 'Invalid action' })
        return
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: toStatus,
        auditLogs: {
          create: {
            userId,
            action,
            fromStatus,
            toStatus,
            remark: reason || null,
          },
        },
        ...(action === 'COMPLETE_PRODUCTION'
          ? {
              shipments: {
                create: { createdById: userId },
              },
            }
          : {}),
      },
      include: {
        items: true,
        createdBy: { select: userSelect },
        shipments: true,
        auditLogs: {
          include: { user: { select: userSelect } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
