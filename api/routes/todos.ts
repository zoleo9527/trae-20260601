import { Router, type Request, type Response } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const role = req.query.role as string | undefined;
    const userId = req.query.userId as string | undefined;
    
    let registrationCount = 0;
    let registrationStatus = '';
    let registrationLabel = '';
    
    let clarificationCount = 0;
    let clarificationStatus = '';
    let clarificationLabel = '';
    
    if (role === 'project_specialist') {
      registrationCount = await prisma.bidRegistration.count({
        where: {
          status: 'pending',
          currentHandlerId: userId || undefined
        }
      });
      registrationStatus = 'pending';
      registrationLabel = '待处理报名';
      
      clarificationCount = await prisma.clarification.count({
        where: {
          status: 'draft',
          createdById: userId || undefined
        }
      });
      clarificationStatus = 'draft';
      clarificationLabel = '草稿澄清';
    } else if (role === 'review_secretary') {
      registrationCount = await prisma.bidRegistration.count({
        where: {
          status: 'reviewing',
          currentHandlerId: userId || undefined
        }
      });
      registrationStatus = 'reviewing';
      registrationLabel = '审核中报名';
      
      clarificationCount = await prisma.clarification.count({
        where: {
          status: 'pending_review'
        }
      });
      clarificationStatus = 'pending_review';
      clarificationLabel = '待审核澄清';
    } else if (role === 'finance') {
      registrationCount = await prisma.bidRegistration.count({
        where: {
          status: 'approved',
          currentHandlerId: userId || undefined
        }
      });
      registrationStatus = 'approved';
      registrationLabel = '已通过报名';
      
      clarificationCount = await prisma.clarification.count({
        where: {
          status: 'approved'
        }
      });
      clarificationStatus = 'approved';
      clarificationLabel = '已通过澄清';
    } else {
      registrationCount = await prisma.bidRegistration.count({
        where: {
          status: 'pending',
          currentHandlerId: userId || undefined
        }
      });
      registrationStatus = 'pending';
      registrationLabel = '待处理报名';
      
      clarificationCount = await prisma.clarification.count({
        where: {
          status: 'draft',
          createdById: userId || undefined
        }
      });
      clarificationStatus = 'draft';
      clarificationLabel = '草稿澄清';
    }
    
    res.json({
      success: true,
      data: {
        registrations: {
          count: registrationCount,
          status: registrationStatus,
          label: registrationLabel
        },
        clarifications: {
          count: clarificationCount,
          status: clarificationStatus,
          label: clarificationLabel
        }
      }
    });
  } catch (error) {
    console.error('Failed to fetch todos:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch todos' });
  }
});

router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const totalRegistrations = await prisma.bidRegistration.count();
    const completedRegistrations = await prisma.bidRegistration.count({ where: { status: 'completed' } });
    const rejectedRegistrations = await prisma.bidRegistration.count({ where: { status: 'rejected' } });
    
    const totalClarifications = await prisma.clarification.count();
    const publishedClarifications = await prisma.clarification.count({ where: { status: 'published' } });
    
    const recentRegistrations = await prisma.bidRegistration.findMany({
      take: 7,
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true, status: true }
    });
    
    res.json({
      success: true,
      data: {
        registrations: {
          total: totalRegistrations,
          completed: completedRegistrations,
          rejected: rejectedRegistrations,
          completionRate: totalRegistrations > 0 ? (completedRegistrations / totalRegistrations * 100).toFixed(1) : '0'
        },
        clarifications: {
          total: totalClarifications,
          published: publishedClarifications,
          publishRate: totalClarifications > 0 ? (publishedClarifications / totalClarifications * 100).toFixed(1) : '0'
        },
        recent: recentRegistrations
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

export default router;