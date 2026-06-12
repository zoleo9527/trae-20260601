import { Router, type Request, type Response } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const role = req.query.role as string | undefined;
    const userId = req.query.userId as string | undefined;
    
    let pendingRegistrations = 0;
    let reviewingRegistrations = 0;
    let approvedRegistrations = 0;
    let draftClarifications = 0;
    let pendingReviewClarifications = 0;
    let approvedClarifications = 0;
    
    if (role === 'project_specialist') {
      pendingRegistrations = await prisma.bidRegistration.count({
        where: {
          status: 'pending',
          currentHandlerId: userId || undefined
        }
      });
      draftClarifications = await prisma.clarification.count({
        where: {
          status: 'draft',
          createdById: userId || undefined
        }
      });
      reviewingRegistrations = await prisma.bidRegistration.count({
        where: { status: 'reviewing' }
      });
      approvedRegistrations = await prisma.bidRegistration.count({
        where: { status: 'approved' }
      });
      pendingReviewClarifications = await prisma.clarification.count({
        where: { status: 'pending_review' }
      });
      approvedClarifications = await prisma.clarification.count({
        where: { status: 'approved' }
      });
    } else if (role === 'review_secretary') {
      reviewingRegistrations = await prisma.bidRegistration.count({
        where: {
          status: 'reviewing',
          currentHandlerId: userId || undefined
        }
      });
      pendingReviewClarifications = await prisma.clarification.count({
        where: { status: 'pending_review' }
      });
      pendingRegistrations = await prisma.bidRegistration.count({
        where: { status: 'pending' }
      });
      approvedRegistrations = await prisma.bidRegistration.count({
        where: { status: 'approved' }
      });
      draftClarifications = await prisma.clarification.count({
        where: { status: 'draft' }
      });
      approvedClarifications = await prisma.clarification.count({
        where: { status: 'approved' }
      });
    } else if (role === 'finance') {
      approvedRegistrations = await prisma.bidRegistration.count({
        where: {
          status: 'approved',
          currentHandlerId: userId || undefined
        }
      });
      pendingRegistrations = await prisma.bidRegistration.count({
        where: { status: 'pending' }
      });
      reviewingRegistrations = await prisma.bidRegistration.count({
        where: { status: 'reviewing' }
      });
      draftClarifications = await prisma.clarification.count({
        where: { status: 'draft' }
      });
      pendingReviewClarifications = await prisma.clarification.count({
        where: { status: 'pending_review' }
      });
      approvedClarifications = await prisma.clarification.count({
        where: { status: 'approved' }
      });
    } else {
      pendingRegistrations = await prisma.bidRegistration.count({
        where: { status: 'pending' }
      });
      reviewingRegistrations = await prisma.bidRegistration.count({
        where: { status: 'reviewing' }
      });
      approvedRegistrations = await prisma.bidRegistration.count({
        where: { status: 'approved' }
      });
      draftClarifications = await prisma.clarification.count({
        where: { status: 'draft' }
      });
      pendingReviewClarifications = await prisma.clarification.count({
        where: { status: 'pending_review' }
      });
      approvedClarifications = await prisma.clarification.count({
        where: { status: 'approved' }
      });
    }
    
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