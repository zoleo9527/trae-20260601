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

const STATUS_BLOCK_POINT = {
  [BookingStatus.DRAFT]: { text: '草稿未提交', level: 'info' },
  [BookingStatus.PENDING_REVIEW]: { text: '等待店长审核', level: 'warning' },
  [BookingStatus.FEE_PENDING]: { text: '等待费用确认', level: 'warning' },
  [BookingStatus.FEE_REJECTED]: { text: '费用审核被驳回', level: 'error' },
  [BookingStatus.FEE_APPROVED]: { text: '费用已通过', level: 'success' },
  [BookingStatus.COMPLETED]: { text: '已完成', level: 'success' },
  [BookingStatus.CANCELLED]: { text: '已取消', level: 'info' },
};

const PRIORITY_LABEL = {
  0: '普通',
  1: '优先',
  2: '紧急',
  3: '特急',
};

class DashboardService {
  static _buildCardSummary(booking, latestAudit = null, latestNote = null, feeReview = null) {
    const blockPoint = STATUS_BLOCK_POINT[booking.status] || { text: booking.status, level: 'info' };

    const noteSummary = latestNote ? {
      content: latestNote.content.length > 50 ? latestNote.content.substring(0, 50) + '...' : latestNote.content,
      createdBy: latestNote.createdBy,
      stage: latestNote.stage,
      createdAt: latestNote.createdAt,
      fullContent: latestNote.content,
    } : null;

    const feeConclusion = feeReview ? {
      isApproved: feeReview.isApproved,
      actualAmount: feeReview.actualAmount,
      paymentMethod: feeReview.paymentMethod,
      reviewedBy: feeReview.reviewedBy || null,
      reviewedAt: feeReview.reviewedAt,
    } : null;

    const latestOperator = latestAudit?.user || booking.submittedBy;
    const latestOperatedAt = latestAudit?.createdAt || booking.updatedAt;

    const waitHours = Math.floor((Date.now() - new Date(booking.updatedAt).getTime()) / (1000 * 60 * 60));

    return {
      id: booking.id,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      bookingDate: booking.bookingDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      hours: booking.hours,
      totalAmount: booking.totalAmount,
      status: booking.status,
      venue: booking.venue,
      submittedBy: booking.submittedBy,
      priority: booking.priority,
      priorityLabel: PRIORITY_LABEL[booking.priority] || '普通',
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,

      summary: {
        blockPoint: blockPoint.text,
        blockLevel: blockPoint.level,
        latestOperator,
        latestOperatedAt,
        latestAction: latestAudit?.details || (latestAudit?.action ? this._formatAction(latestAudit.action) : null),
        noteSummary,
        feeConclusion,
        waitHours: waitHours > 0 ? waitHours : 0,
        priorityExplanation: this._getPriorityExplanation(booking.priority, booking.status),
      },
    };
  }

  static _formatAction(action) {
    const map = {
      CREATED: '创建申请',
      STATUS_CHANGED: '变更状态',
      NOTE_ADDED: '添加备注',
      FEE_APPROVED: '费用审核通过',
      FEE_REJECTED: '费用审核驳回',
      UPDATED: '修改信息',
      CANCELLED: '取消申请',
    };
    return map[action] || action;
  }

  static _getPriorityExplanation(priority, status) {
    const priorityText = PRIORITY_LABEL[priority] || '普通';
    const statusHint = {
      [BookingStatus.PENDING_REVIEW]: '店长请优先审核',
      [BookingStatus.FEE_PENDING]: '请尽快确认费用',
      [BookingStatus.FEE_REJECTED]: '驳回后需尽快处理',
      [BookingStatus.DRAFT]: '请及时提交审核',
    };
    const hint = statusHint[status] || '';
    return hint ? `${priorityText} - ${hint}` : priorityText;
  }

  static async _enrichBookingsWithSummary(bookings) {
    const ids = bookings.map(b => b.id);
    if (ids.length === 0) return [];

    const [auditData, noteData] = await Promise.all([
      prisma.auditLog.findMany({
        where: { bookingId: { in: ids } },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, role: true } } },
      }),
      prisma.note.findMany({
        where: { bookingId: { in: ids } },
        orderBy: { createdAt: 'desc' },
        include: { createdBy: { select: { id: true, name: true, role: true } } },
      }),
    ]);

    const latestAuditMap = {};
    for (const audit of auditData) {
      if (!latestAuditMap[audit.bookingId]) {
        latestAuditMap[audit.bookingId] = audit;
      }
    }

    const latestNoteMap = {};
    for (const note of noteData) {
      if (!latestNoteMap[note.bookingId]) {
        latestNoteMap[note.bookingId] = note;
      }
    }

    return bookings.map(booking =>
      this._buildCardSummary(
        booking,
        latestAuditMap[booking.id],
        latestNoteMap[booking.id],
        booking.feeReview
      )
    );
  }

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
    const [awaitingReview, awaitingFee, feeRejected] = await Promise.all([
      prisma.bookingRequest.findMany({
        where: { status: BookingStatus.PENDING_REVIEW },
        orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
        take: 5,
        include: {
          venue: true,
          submittedBy: { select: { id: true, name: true, role: true } },
        },
      }),
      prisma.bookingRequest.findMany({
        where: { status: BookingStatus.FEE_PENDING },
        orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
        take: 5,
        include: {
          venue: true,
          submittedBy: { select: { id: true, name: true, role: true } },
          feeReview: {
            include: { reviewedBy: { select: { id: true, name: true, role: true } } },
          },
        },
      }),
      prisma.bookingRequest.findMany({
        where: { status: BookingStatus.FEE_REJECTED },
        orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
        take: 5,
        include: {
          venue: true,
          submittedBy: { select: { id: true, name: true, role: true } },
          feeReview: {
            include: { reviewedBy: { select: { id: true, name: true, role: true } } },
          },
        },
      }),
    ]);

    const [enrichedReview, enrichedFee, enrichedRejected] = await Promise.all([
      this._enrichBookingsWithSummary(awaitingReview),
      this._enrichBookingsWithSummary(awaitingFee),
      this._enrichBookingsWithSummary(feeRejected),
    ]);

    return {
      awaitingReview: {
        count: enrichedReview.length,
        items: enrichedReview,
      },
      awaitingFee: {
        count: enrichedFee.length,
        items: enrichedFee,
      },
      feeRejected: {
        count: enrichedRejected.length,
        items: enrichedRejected,
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
        const enriched = await this._enrichBookingsWithSummary(items);
        return {
          ...col,
          count: enriched.length,
          items: enriched,
        };
      })
    );

    return result;
  }

  static async getBlockedItems() {
    const blocked = await prisma.bookingRequest.findMany({
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
        feeReview: {
          include: { reviewedBy: { select: { id: true, name: true, role: true } } },
        },
      },
    });

    return this._enrichBookingsWithSummary(blocked);
  }
}

module.exports = DashboardService;
