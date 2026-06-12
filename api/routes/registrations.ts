import { Router, type Request, type Response } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, status, projectName, bidderName } = req.query;
    
    const where: any = {};
    if (status) where.status = status;
    if (projectName) where.projectName = { contains: projectName as string };
    if (bidderName) where.bidderName = { contains: bidderName as string };
    
    const total = await prisma.bidRegistration.count({ where });
    const data = await prisma.bidRegistration.findMany({
      where,
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
      orderBy: { createdAt: 'desc' },
      include: {
        currentHandler: {
          select: { id: true, name: true, role: true }
        },
        clarifications: {
          select: { id: true, question: true, status: true }
        },
        operationLogs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            operationType: true,
            operatorName: true,
            operatorRole: true,
            previousStatus: true,
            newStatus: true,
            note: true,
            createdAt: true
          }
        },
        rejectionReasons: {
          select: { reason: true, supplementaryNote: true, rejectedBy: { select: { name: true } } }
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
    res.status(500).json({ success: false, error: 'Failed to fetch registrations' });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const registration = await prisma.bidRegistration.findUnique({
      where: { id },
      include: {
        currentHandler: {
          select: { id: true, name: true, role: true }
        },
        clarifications: {
          include: {
            createdBy: { select: { name: true } },
            reviewedBy: { select: { name: true } },
            versions: {
              orderBy: { version: 'desc' },
              include: { changedBy: { select: { name: true } } }
            }
          }
        },
        operationLogs: {
          orderBy: { createdAt: 'desc' },
          include: { operator: { select: { name: true, role: true } } }
        },
        rejectionReasons: {
          include: { rejectedBy: { select: { name: true } } }
        }
      }
    });
    
    if (!registration) {
      res.status(404).json({ success: false, error: 'Registration not found' });
      return;
    }
    
    res.json({ success: true, data: registration });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch registration' });
  }
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, projectName, bidderId, bidderName, handlerId, handlerRole } = req.body;
    
    const registration = await prisma.bidRegistration.create({
      data: {
        projectId,
        projectName,
        bidderId,
        bidderName,
        status: 'pending',
        currentHandlerId: handlerId,
        currentHandlerRole: handlerRole
      }
    });
    
    await prisma.operationLog.create({
      data: {
        entityType: 'registration',
        entityId: registration.id,
        operationType: 'create',
        operatorId: handlerId,
        operatorName: '系统',
        operatorRole: handlerRole,
        newStatus: 'pending',
        note: '创建投标报名记录'
      }
    });
    
    res.json({ success: true, data: registration, message: 'Registration created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create registration' });
  }
});

router.patch('/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, handlerId, handlerName, handlerRole, note, rejectionReason, supplementaryNote } = req.body;
    
    const oldRegistration = await prisma.bidRegistration.findUnique({ where: { id } });
    if (!oldRegistration) {
      res.status(404).json({ success: false, error: 'Registration not found' });
      return;
    }
    
    let newStatus = status;
    let newHandlerId = handlerId;
    let newHandlerRole = handlerRole;
    
    if (oldRegistration.status === 'pending' && handlerRole === 'project_specialist' && status === 'approved') {
      newStatus = 'reviewing';
      newHandlerId = 'user-002';
      newHandlerRole = 'review_secretary';
    } else if (oldRegistration.status === 'reviewing' && handlerRole === 'review_secretary' && status === 'approved') {
      newStatus = 'approved';
      newHandlerId = 'user-003';
      newHandlerRole = 'finance';
    } else if (oldRegistration.status === 'approved' && handlerRole === 'finance' && status === 'approved') {
      newStatus = 'completed';
    }
    
    const registration = await prisma.bidRegistration.update({
      where: { id },
      data: {
        status: newStatus,
        currentHandlerId: newHandlerId,
        currentHandlerRole: newHandlerRole,
        updatedAt: new Date()
      }
    });
    
    await prisma.operationLog.create({
      data: {
        entityType: 'registration',
        entityId: id,
        operationType: newStatus === 'rejected' ? 'reject' : 'update_status',
        operatorId: handlerId,
        operatorName: handlerName,
        operatorRole: handlerRole,
        previousStatus: oldRegistration.status,
        newStatus: newStatus,
        note: note || ''
      }
    });
    
    if (newStatus === 'rejected' && rejectionReason) {
      await prisma.rejectionReason.create({
        data: {
          registrationId: id,
          reason: rejectionReason,
          supplementaryNote: supplementaryNote || '',
          rejectedById: handlerId
        }
      });
    }
    
    res.json({ success: true, data: registration, message: 'Status updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update status' });
  }
});

router.post('/batch', async (req: Request, res: Response): Promise<void> => {
  try {
    const { registrationIds, operation, handlerId, handlerName, handlerRole, note, rejectionReason, supplementaryNote } = req.body;
    
    const results = [];
    const errors = [];
    
    for (const id of registrationIds) {
      try {
        const oldRegistration = await prisma.bidRegistration.findUnique({ where: { id } });
        if (!oldRegistration) {
          errors.push({ id, error: 'Registration not found' });
          continue;
        }
        
        let newStatus = oldRegistration.status;
        let newHandlerId = handlerId;
        let newHandlerRole = handlerRole;
        
        if (operation === 'approve') {
          if (oldRegistration.status === 'pending' && handlerRole === 'project_specialist') {
            newStatus = 'reviewing';
            newHandlerId = 'user-002';
            newHandlerRole = 'review_secretary';
          } else if (oldRegistration.status === 'reviewing' && handlerRole === 'review_secretary') {
            newStatus = 'approved';
            newHandlerId = 'user-003';
            newHandlerRole = 'finance';
          } else if (oldRegistration.status === 'approved' && handlerRole === 'finance') {
            newStatus = 'completed';
          } else {
            newStatus = 'approved';
          }
        }
        if (operation === 'reject') {
          newStatus = 'rejected';
        }
        
        const registration = await prisma.bidRegistration.update({
          where: { id },
          data: {
            status: newStatus,
            currentHandlerId: newHandlerId,
            currentHandlerRole: newHandlerRole,
            updatedAt: new Date()
          }
        });
        
        await prisma.operationLog.create({
          data: {
            entityType: 'registration',
            entityId: id,
            operationType: operation === 'approve' ? 'batch_approve' : 'batch_reject',
            operatorId: handlerId,
            operatorName: handlerName,
            operatorRole: handlerRole,
            previousStatus: oldRegistration.status,
            newStatus: newStatus,
            note: note || ''
          }
        });
        
        if (operation === 'reject' && rejectionReason) {
          await prisma.rejectionReason.create({
            data: {
              registrationId: id,
              reason: rejectionReason,
              supplementaryNote: supplementaryNote || '',
              rejectedById: handlerId
            }
          });
        }
        
        results.push(registration);
      } catch (error) {
        errors.push({ id, error: 'Failed to process' });
      }
    }
    
    res.json({
      success: true,
      processedCount: results.length,
      failedCount: errors.length,
      message: `Processed ${results.length} registrations, ${errors.length} failed`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to batch process' });
  }
});

export default router;