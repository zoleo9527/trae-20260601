import { Router, type Request, type Response } from 'express'
import { authenticate } from '../lib/auth.js'
import prisma from '../lib/prisma.js'

const router = Router()

const userSelect = { id: true, username: true, role: true, displayName: true } as const

router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId, userId, action, page = '1', limit = '20' } = req.query
    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const skip = (pageNum - 1) * limitNum

    const where: Record<string, unknown> = {}
    if (orderId) where.orderId = orderId as string
    if (userId) where.userId = userId as string
    if (action) where.action = action as string

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: userSelect },
          order: { select: { id: true, orderNo: true, distributorName: true } },
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ])

    res.json({ data, total, page: pageNum, totalPages: Math.ceil(total / limitNum) })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
