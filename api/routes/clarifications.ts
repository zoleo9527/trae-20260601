import { Router, type Request, type Response } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, status, registrationId } = req.query;
    
    const where: any = {};
    if (status) where.status = status;
    if (registrationId) where.registrationId = registrationId;
    
    const total = await prisma.clarification.count({ where });
    const data = await prisma.clarification.findMany({
      where,
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
      orderBy: { createdAt: 'desc' },
      include: {
        registration: {
          select: { projectName: true }
        },
        createdBy: {
          select: { name: true, role: true }
        },
        reviewedBy: {
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
    res.status(500).json({ success: false, error: 'Failed to fetch clarifications' });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const clarification = await prisma.clarification.findUnique({
      where: { id },
      include: {
        registration: {
          select: { id: true, projectName: true, bidderName: true }
        },
        createdBy: {
          select: { name: true, role: true }
        },
        reviewedBy: {
          select: { name: true, role: true }
        },
        versions: {
          orderBy: { version: 'desc' },
          include: {
            changedBy: { select: { name: true, role: true } }
          }
        },
        operationLogs: {
          orderBy: { createdAt: 'desc' },
          include: { operator: { select: { name: true, role: true } } }
        }
      }
    });
    
    if (!clarification) {
      res.status(404).json({ success: false, error: 'Clarification not found' });
      return;
    }
    
    res.json({ success: true, data: clarification });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch clarification' });
  }
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { registrationId, question, answer, createdById, createdByName, createdByRole } = req.body;
    
    const clarification = await prisma.clarification.create({
      data: {
        registrationId,
        question,
        answer: answer || null,
        status: 'draft',
        createdById,
        version: 1
      }
    });
    
    await prisma.operationLog.create({
      data: {
        entityType: 'clarification',
        entityId: clarification.id,
        operationType: 'clarify',
        operatorId: createdById,
        operatorName: createdByName,
        operatorRole: createdByRole,
        newStatus: 'draft',
        note: '创建答疑澄清'
      }
    });
    
    res.json({ success: true, data: clarification, message: 'Clarification created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create clarification' });
  }
});

router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { question, answer, status, operatorId, operatorName, operatorRole, note } = req.body;
    
    const oldClarification = await prisma.clarification.findUnique({ where: { id } });
    if (!oldClarification) {
      res.status(404).json({ success: false, error: 'Clarification not found' });
      return;
    }
    
    const newVersion = oldClarification.version + 1;
    
    if (question || answer) {
      await prisma.clarificationVersion.create({
        data: {
          clarificationId: id,
          version: newVersion,
          question: question || oldClarification.question,
          answer: answer || oldClarification.answer,
          changedById: operatorId,
          changeNote: note || ''
        }
      });
    }
    
    const clarification = await prisma.clarification.update({
      where: { id },
      data: {
        question: question || oldClarification.question,
        answer: answer || oldClarification.answer,
        status: status || oldClarification.status,
        version: question || answer ? newVersion : oldClarification.version,
        updatedAt: new Date()
      }
    });
    
    await prisma.operationLog.create({
      data: {
        entityType: 'clarification',
        entityId: id,
        operationType: 'update_status',
        operatorId,
        operatorName,
        operatorRole,
        previousStatus: oldClarification.status,
        newStatus: status || oldClarification.status,
        note: note || ''
      }
    });
    
    res.json({ success: true, data: clarification, message: 'Clarification updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update clarification' });
  }
});

router.get('/:id/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const versions = await prisma.clarificationVersion.findMany({
      where: { clarificationId: id },
      orderBy: { version: 'desc' },
      include: {
        changedBy: { select: { name: true, role: true } }
      }
    });
    
    res.json({ success: true, data: versions });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch history' });
  }
});

export default router;