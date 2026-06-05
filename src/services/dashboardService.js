const prisma = require('../config/prisma');

const BookingStatus = {
  DRAFT: 'DRAFT',
  PENDING_REVIEW: 'PENDING_REVIEW',
  FEE_PENDING: 'FEE_PENDING',
  FEE_APPROVED: 'FEE_APPROVED',
  FEE_REJECTED: 'FEE_REJECTED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

class DashboardService {
  static async getOverview() {
    const [statusCounts, recentActivity, pendingItems] = await Promise.all([
      prisma.bookingRequest.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, role: true } },
          booking: { select: { id: true, customerName: true } },
        },
      }),
      this.getPendingItems(),
    ]);

    const counts = {};
    Object.values(BookingStatus).forEach(status => {
      counts[status] = 0;
    });
    statusCounts.forEach(item => {
      counts[item.status] = item._count.id;
    });

    return {
      counts,
      total: Object.values(counts).reduce((a, b) => a + b, 0),
      recentActivity,
      pendingItems,
    };
  }

  static async getPendingItems() {
    const awaitingReview = await prisma.bookingRequest.findMany({
      where: { status: BookingStatus.PENDING_REVIEW },
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
      take: 5,
      include: {
        venue: true,
        submittedBy: { select: { id: true, name: true, role: true } },
      },
    });

    const awaitingFee = await prisma.bookingRequest.findMany({
      where: { status: BookingStatus.FEE_PENDING },
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
      take: 5,
      include: {
        venue: true,
        submittedBy: { select: { id: true, name: true, role: true } },
        feeReview: true,
      },
    });

    const feeRejected = await prisma.bookingRequest.findMany({
      where: { status: BookingStatus.FEE_REJECTED },
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
      take: 5,
      include: {
        venue: true,
        submittedBy: { select: { id: true, name: true, role: true } },
        feeReview: { include: { reviewedBy: { select: { id: true, name: true, role: true } } } },
      },
    });

    return {
      awaitingReview: {
        count: awaitingReview.length,
        items: awaitingReview,
      },
      awaitingFee: {
        count: awaitingFee.length,
        items: awaitingFee,
      },
      feeRejected: {
        count: feeRejected.length,
        items: feeRejected,
      },
    };
  }

  static async getKanban() {
    const columns = [
      { key: BookingStatus.DRAFT, title: '草稿', status: BookingStatus.DRAFT },
      { key: BookingStatus.PENDING_REVIEW, title: '待审核', status: BookingStatus.PENDING_REVIEW },
      { key: BookingStatus.FEE_PENDING, title: '待费用确认', status: BookingStatus.FEE_PENDING },
      { key: BookingStatus.FEE_REJECTED, title: '费用驳回', status: BookingStatus.FEE_REJECTED },
      { key: BookingStatus.FEE_APPROVED, title: '费用已通过', status: BookingStatus.FEE_APPROVED },
      { key: BookingStatus.COMPLETED, title: '已完成', status: BookingStatus.COMPLETED },
      { key: BookingStatus.CANCELLED, title: '已取消', status: BookingStatus.CANCELLED },
    ];

    const result = await Promise.all(
      columns.map(async (col) => {
        const items = await prisma.bookingRequest.findMany({
          where: { status: col.status },
          orderBy: [{ priority: 'asc' }, { updatedAt: 'desc' }],
          include: {
            venue: true,
            submittedBy: { select: { id: true, name: true, role: true } },
            feeReview: {
              include: { reviewedBy: { select: { id: true, name: true, role: true } } },
            },
            _count: { select: { notes: true } },
          },
        });
        return {
          ...col,
          count: items.length,
          items,
        };
      })
    );

    return result;
  }

  static async getBlockedItems() {
    return prisma.bookingRequest.findMany({
      where: {
        OR: [
          { status: BookingStatus.FEE_REJECTED },
          {
            status: BookingStatus.PENDING_REVIEW,
            createdAt: {
              lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
          {
            status: BookingStatus.FEE_PENDING,
            createdAt: {
              lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        ],
      },
      orderBy: { updatedAt: 'asc' },
      include: {
        venue: true,
        submittedBy: { select: { id: true, name: true, role: true } },
        feeReview: { include: { reviewedBy: { select: { id: true, name: true, role: true } } } },
        auditLogs: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true, role: true } } },
        },
      },
    });
  }
}

module.exports = DashboardService;
