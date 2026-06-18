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
    // 今日待处理预约
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
    
    // 超时预约（已过开始时间但未完成的）
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
    
    // 刚退回的预约（最近2小时内退回的）
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
    
    // 活跃的展项问题
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
    
    // 待执行的排班
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
    
    // 紧急的材料问题
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

export default router;
