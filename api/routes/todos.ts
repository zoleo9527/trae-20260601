import { Router, type Request, type Response } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.query;
    
    let registrationWhere: any = {};
    let clarificationWhere: any = {};
    
    if (role === 'project_specialist') {
      registrationWhere = { status: 'pending', currentHandlerRole: 'project_specialist' };
      clarificationWhere = { status: 'draft' };
    } else if (role === 'review_secretary') {
      registrationWhere = { status: 'reviewing', currentHandlerRole: 'review_secretary' };
      clarificationWhere = { status: 'pending_review' };
    } else if (role === 'finance') {
      registrationWhere = { status: 'approved', currentHandlerRole: 'finance' };
      clarificationWhere = { status: 'approved' };
    }
    
    const pendingRegistrations = await prisma.bidRegistration.count({ where: { status: 'pending' } });
    const reviewingRegistrations = await prisma.bidRegistration.count({ where: { status: 'reviewing' } });
    const approvedRegistrations = await prisma.bidRegistration.count({ where: { status: 'approved' } });
    
    const draftClarifications = await prisma.clarification.count({ where: { status: 'draft' } });
    const pendingReviewClarifications = await prisma.clarification.count({ where: { status: 'pending_review' } });
    const approvedClarifications = await prisma.clarification.count({ where: { status: 'approved' } });
    
    res.json({
      success: true,
      data: {
        registrations: {
          pending: pendingRegistrations,
          reviewing: reviewingRegistrations,
          approved: approvedRegistrations
        },
        clarifications: {
          draft: draftClarifications,
          pending_review: pendingReviewClarifications,
          approved: approvedClarifications
        }
      }
    });
  } catch (error) {
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