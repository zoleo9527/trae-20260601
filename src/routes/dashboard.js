import { Router } from 'express';
import { prisma } from '../server.js';
import { startOfDay, endOfDay, subHours } from 'date-fns';

const router = Router();

router.get('/', async (req, res) => {
  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);
  const twoHoursAgo = subHours(today, 2);

  const [
    todayPendingReservations,
    overdueReservations,
    recentlyReturned,
    activeExhibitIssues,
    pendingSchedules,
    urgentMaterials
  ] = await Promise.all([
    prisma.reservation.findMany({
      where: {
        status: 'PENDING_CONFIRM',
        startTime: {
          gte: todayStart,
          lte: todayEnd
        }
      },
      include: {
        createdBy: { select: { name: true, role: true } },
        exhibitIssue: { select: { id: true, status: true, exhibitName: true } }
      },
      orderBy: { startTime: 'asc' }
    }),
    
    prisma.reservation.findMany({
      where: {
        status: { in: ['PENDING_CONFIRM', 'CONFIRMED', 'IN_PROGRESS'] },
        startTime: { lt: today }
      },
      include: {
        createdBy: { select: { name: true, role: true } }
      },
      orderBy: { startTime: 'asc' }
    }),
    
    prisma.reservation.findMany({
      where: {
        status: 'REJECTED',
        rejectedAt: { gte: twoHoursAgo }
      },
      include: {
        createdBy: { select: { name: true, role: true } }
      },
      orderBy: { rejectedAt: 'desc' }
    }),
    
    prisma.exhibitIssue.findMany({
      where: {
        status: { in: ['SHUTDOWN_PLANNED', 'SHUTDOWN_EMERGENCY', 'MAINTENANCE', 'REPAIRING'] }
      },
      include: {
        reporter: { select: { name: true, role: true } },
        handler: { select: { name: true } }
      },
      orderBy: { reportedAt: 'desc' }
    }),
    
    prisma.schedule.findMany({
      where: {
        status: 'PENDING',
        scheduledStart: {
          gte: todayStart,
          lte: endOfDay(today)
        }
      },
      include: {
        reservation: {
          select: {
            visitorGroup: true,
            startTime: true,
            endTime: true,
            status: true
          }
        },
        educator: { select: { name: true } }
      },
      orderBy: { scheduledStart: 'asc' }
    }),
    
    prisma.materialIssue.findMany({
      where: {
        status: 'OPEN',
        deadline: { lte: endOfDay(today) }
      },
      include: {
        reporter: { select: { name: true } },
        handler: { select: { name: true } }
      },
      orderBy: { deadline: 'asc' }
    })
  ]);

  const stats = {
    todayPending: todayPendingReservations.length,
    overdue: overdueReservations.length,
    recentlyReturned: recentlyReturned.length,
    activeExhibitIssues: activeExhibitIssues.length,
    pendingSchedules: pendingSchedules.length,
    urgentMaterials: urgentMaterials.length
  };

  res.json({
    timestamp: today.toISOString(),
    stats,
    todayPendingReservations,
    overdueReservations,
    recentlyReturned,
    activeExhibitIssues,
    pendingSchedules,
    urgentMaterials
  });
});

router.get('/educator/:userId', async (req, res) => {
  const { userId } = req.params;
  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);
  const twoHoursAgo = subHours(today, 2);

  const [
    pendingReservations,
    myScheduledToday,
    myInProgressSchedules,
    myReportedIssues,
    recentlyReturned,
    overdueReservations
  ] = await Promise.all([
    prisma.reservation.findMany({
      where: {
        status: 'PENDING_CONFIRM',
        startTime: { gte: todayStart, lte: todayEnd }
      },
      include: {
        createdBy: { select: { name: true, role: true } },
        exhibitIssue: { select: { id: true, exhibitName: true, status: true } }
      },
      orderBy: { startTime: 'asc' }
    }),
    
    prisma.schedule.findMany({
      where: {
        educatorId: userId,
        scheduledStart: { gte: todayStart, lte: todayEnd },
        status: { notIn: ['COMPLETED', 'CANCELLED'] }
      },
      include: {
        reservation: {
          select: {
            visitorGroup: true,
            visitorCount: true,
            startTime: true,
            endTime: true,
            contactName: true,
            contactPhone: true
          }
        },
        createdBy: { select: { name: true, role: true } }
      },
      orderBy: { scheduledStart: 'asc' }
    }),
    
    prisma.schedule.findMany({
      where: {
        educatorId: userId,
        status: 'IN_PROGRESS'
      },
      include: {
        reservation: {
          select: {
            visitorGroup: true,
            startTime: true,
            endTime: true
          }
        }
      },
      orderBy: { scheduledStart: 'asc' }
    }),
    
    prisma.exhibitIssue.findMany({
      where: {
        reporterId: userId,
        status: { in: ['SHUTDOWN_PLANNED', 'SHUTDOWN_EMERGENCY', 'MAINTENANCE', 'REPAIRING'] }
      },
      include: {
        handler: { select: { name: true, phone: true } },
        affectedReservations: {
          select: { visitorGroup: true, startTime: true, status: true }
        }
      },
      orderBy: { reportedAt: 'desc' }
    }),
    
    prisma.reservation.findMany({
      where: {
        status: 'REJECTED',
        rejectedAt: { gte: twoHoursAgo },
        needsReview: true
      },
      include: {
        createdBy: { select: { name: true, role: true } },
        exhibitIssue: { select: { exhibitName: true, status: true } }
      },
      orderBy: { rejectedAt: 'desc' }
    }),
    
    prisma.reservation.findMany({
      where: {
        status: { in: ['PENDING_CONFIRM', 'CONFIRMED'] },
        startTime: { lt: today }
      },
      include: {
        createdBy: { select: { name: true, role: true } },
        schedule: { select: { educator: { select: { name: true } } } }
      },
      orderBy: { startTime: 'asc' }
    })
  ]);

  const stats = {
    pendingReservations: pendingReservations.length,
    scheduledToday: myScheduledToday.length,
    inProgress: myInProgressSchedules.length,
    reportedIssues: myReportedIssues.length,
    recentlyReturned: recentlyReturned.length,
    overdue: overdueReservations.length
  };

  res.json({
    timestamp: today.toISOString(),
    stats,
    role: 'EXHIBIT_EDUCATOR',
    pendingReservations,
    scheduledToday: myScheduledToday,
    inProgress: myInProgressSchedules,
    reportedIssues: myReportedIssues,
    recentlyReturned,
    overdue: overdueReservations
  });
});

router.get('/engineer/:userId', async (req, res) => {
  const { userId } = req.params;
  const today = new Date();
  const todayStart = startOfDay(today);
  const twoHoursAgo = subHours(today, 2);

  const [
    myAssignedIssues,
    myReportedIssues,
    affectedReservations,
    pendingReviewItems,
    urgentIssues
  ] = await Promise.all([
    prisma.exhibitIssue.findMany({
      where: {
        handlerId: userId,
        status: { in: ['SHUTDOWN_PLANNED', 'SHUTDOWN_EMERGENCY', 'MAINTENANCE', 'REPAIRING'] }
      },
      include: {
        reporter: { select: { name: true, phone: true, role: true } },
        affectedReservations: {
          select: {
            visitorGroup: true,
            startTime: true,
            status: true,
            contactName: true,
            contactPhone: true
          }
        }
      },
      orderBy: { deadline: 'asc' }
    }),
    
    prisma.exhibitIssue.findMany({
      where: {
        reporterId: userId,
        status: { in: ['SHUTDOWN_PLANNED', 'SHUTDOWN_EMERGENCY', 'MAINTENANCE', 'REPAIRING'] }
      },
      include: {
        handler: { select: { name: true, phone: true } }
      },
      orderBy: { reportedAt: 'desc' }
    }),
    
    prisma.reservation.findMany({
      where: {
        exhibitIssue: {
          handlerId: userId,
          status: { in: ['SHUTDOWN_PLANNED', 'SHUTDOWN_EMERGENCY'] }
        },
        status: { notIn: ['CANCELLED', 'COMPLETED'] }
      },
      include: {
        createdBy: { select: { name: true, phone: true } },
        exhibitIssue: { select: { exhibitName: true, status: true, cause: true } }
      },
      orderBy: { startTime: 'asc' }
    }),
    
    prisma.reservation.findMany({
      where: {
        needsReview: true,
        status: 'REJECTED',
        rejectedAt: { gte: twoHoursAgo },
        exhibitIssue: {
          handlerId: userId
        }
      },
      include: {
        createdBy: { select: { name: true, role: true } },
        exhibitIssue: { select: { exhibitName: true, status: true, cause: true } }
      },
      orderBy: { rejectedAt: 'desc' }
    }),
    
    prisma.exhibitIssue.findMany({
      where: {
        handlerId: userId,
        status: 'SHUTDOWN_EMERGENCY',
        deadline: { lte: todayStart }
      },
      include: {
        reporter: { select: { name: true, phone: true } },
        affectedReservations: {
          select: { visitorGroup: true, startTime: true, status: true }
        }
      },
      orderBy: { deadline: 'asc' }
    })
  ]);

  const stats = {
    assignedIssues: myAssignedIssues.length,
    reportedIssues: myReportedIssues.length,
    affectedReservations: affectedReservations.length,
    pendingReview: pendingReviewItems.length,
    urgentIssues: urgentIssues.length
  };

  res.json({
    timestamp: today.toISOString(),
    stats,
    role: 'EQUIPMENT_ENGINEER',
    assignedIssues: myAssignedIssues,
    reportedIssues: myReportedIssues,
    affectedReservations: affectedReservations,
    pendingReview: pendingReviewItems,
    urgentIssues: urgentIssues
  });
});

router.get('/teacher/:userId', async (req, res) => {
  const { userId } = req.params;
  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);
  const twoHoursAgo = subHours(today, 2);

  const [
    myPendingReservations,
    myScheduledToday,
    myMaterialIssues,
    recentlyReturnedMine,
    urgentMaterials,
    myCreatedReservations
  ] = await Promise.all([
    prisma.reservation.findMany({
      where: {
        status: 'PENDING_CONFIRM',
        startTime: { gte: todayStart, lte: todayEnd },
        createdById: userId
      },
      include: {
        exhibitIssue: { select: { exhibitName: true, status: true } },
        schedule: { select: { status: true, educator: { select: { name: true } } } }
      },
      orderBy: { startTime: 'asc' }
    }),
    
    prisma.schedule.findMany({
      where: {
        createdById: userId,
        scheduledStart: { gte: todayStart, lte: todayEnd },
        status: { notIn: ['COMPLETED', 'CANCELLED'] }
      },
      include: {
        reservation: {
          select: {
            visitorGroup: true,
            visitorCount: true,
            startTime: true,
            endTime: true,
            contactName: true,
            contactPhone: true
          }
        },
        educator: { select: { name: true, phone: true } }
      },
      orderBy: { scheduledStart: 'asc' }
    }),
    
    prisma.materialIssue.findMany({
      where: {
        reporterId: userId,
        status: { notIn: ['RESOLVED', 'CLOSED'] }
      },
      include: {
        handler: { select: { name: true, phone: true } }
      },
      orderBy: { deadline: 'asc' }
    }),
    
    prisma.reservation.findMany({
      where: {
        status: 'REJECTED',
        rejectedAt: { gte: twoHoursAgo },
        createdById: userId
      },
      include: {
        exhibitIssue: { select: { exhibitName: true } }
      },
      orderBy: { rejectedAt: 'desc' }
    }),
    
    prisma.materialIssue.findMany({
      where: {
        reporterId: userId,
        status: 'OPEN',
        deadline: { lte: todayEnd }
      },
      orderBy: { deadline: 'asc' }
    }),
    
    prisma.reservation.findMany({
      where: {
        createdById: userId,
        status: { notIn: ['CANCELLED', 'COMPLETED'] },
        startTime: { lt: today }
      },
      include: {
        schedule: { select: { status: true } }
      },
      orderBy: { startTime: 'asc' }
    })
  ]);

  const stats = {
    pendingReservations: myPendingReservations.length,
    scheduledToday: myScheduledToday.length,
    materialIssues: myMaterialIssues.length,
    recentlyReturned: recentlyReturnedMine.length,
    urgentMaterials: urgentMaterials.length,
    overdueReservations: myCreatedReservations.length
  };

  res.json({
    timestamp: today.toISOString(),
    stats,
    role: 'ACTIVITY_TEACHER',
    pendingReservations: myPendingReservations,
    scheduledToday: myScheduledToday,
    materialIssues: myMaterialIssues,
    recentlyReturned: recentlyReturnedMine,
    urgentMaterials: urgentMaterials,
    overdueReservations: myCreatedReservations
  });
});

export default router;
