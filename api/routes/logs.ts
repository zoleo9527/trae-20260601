import { Router, type Request, type Response } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, pageSize = 20, entityType, entityId, operatorId, operationType, startDate, endDate } = req.query;
    
    const where: any = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (operatorId) where.operatorId = operatorId;
    if (operationType) where.operationType = operationType;
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }
    
    const total = await prisma.operationLog.count({ where });
    const data = await prisma.operationLog.findMany({
      where,
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
      orderBy: { createdAt: 'desc' },
      include: {
        operator: {
          select: { name: true, role: true }
        }
      }
    });
    
    res.json({
      success: true,
      data,
      total,
      page: Number(page),
      pageSize: Number(pageSize)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch logs' });
  }
});

export default router;