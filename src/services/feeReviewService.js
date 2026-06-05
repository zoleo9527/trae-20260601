const prisma = require('../config/prisma');
const { ROLE_PERMISSIONS } = require('./bookingService');

const BookingStatus = {
  DRAFT: 'DRAFT',
  PENDING_REVIEW: 'PENDING_REVIEW',
  FEE_PENDING: 'FEE_PENDING',
  FEE_APPROVED: 'FEE_APPROVED',
  FEE_REJECTED: 'FEE_REJECTED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

const AuditAction = {
  CREATED: 'CREATED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  NOTE_ADDED: 'NOTE_ADDED',
  FEE_APPROVED: 'FEE_APPROVED',
  FEE_REJECTED: 'FEE_REJECTED',
  UPDATED: 'UPDATED',
  CANCELLED: 'CANCELLED',
};

class FeeReviewService {
  static _buildReviewResponse(booking, feeReview, oldStatus, newStatus, reviewer, extraNote = null) {
    const notes = booking.notes || [];
    const auditLogs = booking.auditLogs || [];
    const latestAudit = auditLogs.length > 0 ? auditLogs[0] : null;

    const reviewNote = notes.find(n => n.stage === 'FEE_APPROVE' || n.stage === 'FEE_REJECT');
    const rejectAudit = auditLogs.find(l => l.action === 'FEE_REJECTED');

    return {
      feeReview,
      booking: {
        id: booking.id,
        venueId: booking.venueId,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        bookingDate: booking.bookingDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        hours: booking.hours,
        totalAmount: booking.totalAmount,
        status: booking.status,
        priority: booking.priority,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        venue: booking.venue,
        submittedBy: booking.submittedBy,
      },
      reviewSummary: {
        reviewedBy: reviewer,
        reviewedAt: feeReview?.reviewedAt || null,
        actualAmount: feeReview?.actualAmount || null,
        paymentMethod: feeReview?.paymentMethod || null,
        isApproved: feeReview?.isApproved,
        rejectReason: rejectAudit?.details || null,
        reviewNote: reviewNote?.content || extraNote || null,
        oldStatus,
        newStatus,
        latestOperator: latestAudit?.user || reviewer,
        latestOperatedAt: latestAudit?.createdAt || feeReview?.reviewedAt || new Date(),
      },
      notes,
      auditLogs,
    };
  }

  static async canReview(userId, userRole) {
    const permissions = ROLE_PERMISSIONS[userRole];
    return permissions && permissions.canReviewFee;
  }

  static async createOrUpdate(bookingId, data, userId) {
    return prisma.$transaction(async (tx) => {
      const booking = await tx.bookingRequest.findUnique({
        where: { id: bookingId },
        include: { feeReview: true },
      });

      if (!booking) throw new Error('申请不存在');

      let feeReview;
      if (booking.feeReview) {
        feeReview = await tx.feeReview.update({
          where: { id: booking.feeReview.id },
          data: {
            ...data,
            reviewedById: userId,
            reviewedAt: new Date(),
          },
          include: {
            reviewedBy: { select: { id: true, name: true, role: true } },
            booking: true,
          },
        });
      } else {
        feeReview = await tx.feeReview.create({
          data: {
            bookingId,
            ...data,
            reviewedById: userId,
            reviewedAt: new Date(),
          },
          include: {
            reviewedBy: { select: { id: true, name: true, role: true } },
            booking: true,
          },
        });
      }

      return feeReview;
    });
  }

  static async approve(bookingId, data, userId, userRole) {
    if (!await this.canReview(userId, userRole)) {
      throw new Error('无权进行费用审核');
    }

    return prisma.$transaction(async (tx) => {
      const booking = await tx.bookingRequest.findUnique({
        where: { id: bookingId },
      });

      if (!booking) throw new Error('申请不存在');
      if (booking.status !== BookingStatus.FEE_PENDING && booking.status !== BookingStatus.FEE_REJECTED) {
        throw new Error('当前状态不可进行费用审核');
      }

      const oldStatus = booking.status;
      const newStatus = BookingStatus.FEE_APPROVED;

      const feeReview = await tx.feeReview.upsert({
        where: { bookingId },
        update: {
          actualAmount: data.actualAmount,
          paymentMethod: data.paymentMethod,
          isApproved: true,
          reviewedById: userId,
          reviewedAt: new Date(),
        },
        create: {
          bookingId,
          actualAmount: data.actualAmount,
          paymentMethod: data.paymentMethod,
          isApproved: true,
          reviewedById: userId,
          reviewedAt: new Date(),
        },
        include: {
          reviewedBy: { select: { id: true, name: true, role: true } },
        },
      });

      await tx.bookingRequest.update({
        where: { id: bookingId },
        data: { status: newStatus },
      });

      await tx.auditLog.create({
        data: {
          bookingId,
          userId,
          action: AuditAction.FEE_APPROVED,
          oldStatus,
          newStatus,
          details: `费用审核通过，金额: ${data.actualAmount}，支付方式: ${data.paymentMethod}`,
        },
      });

      if (data.note && data.note.trim()) {
        await tx.note.create({
          data: {
            bookingId,
            createdById: userId,
            content: data.note,
            stage: 'FEE_APPROVE',
          },
        });
      }

      const fullBooking = await tx.bookingRequest.findUnique({
        where: { id: bookingId },
        include: {
          venue: true,
          submittedBy: { select: { id: true, name: true, role: true } },
          feeReview: { include: { reviewedBy: { select: { id: true, name: true, role: true } } } },
          notes: {
            include: { createdBy: { select: { id: true, name: true, role: true } } },
            orderBy: { createdAt: 'desc' },
          },
          auditLogs: {
            include: { user: { select: { id: true, name: true, role: true } } },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      return this._buildReviewResponse(
        fullBooking,
        feeReview,
        oldStatus,
        newStatus,
        feeReview.reviewedBy,
        data.note
      );
    });
  }

  static async reject(bookingId, reason, userId, userRole, note = null) {
    if (!await this.canReview(userId, userRole)) {
      throw new Error('无权进行费用审核');
    }

    return prisma.$transaction(async (tx) => {
      const booking = await tx.bookingRequest.findUnique({
        where: { id: bookingId },
      });

      if (!booking) throw new Error('申请不存在');
      if (booking.status !== BookingStatus.FEE_PENDING) {
        throw new Error('当前状态不可驳回');
      }

      const oldStatus = booking.status;
      const newStatus = BookingStatus.FEE_REJECTED;
      const finalReason = reason || '费用审核驳回';

      const feeReview = await tx.feeReview.upsert({
        where: { bookingId },
        update: {
          isApproved: false,
          reviewedById: userId,
          reviewedAt: new Date(),
        },
        create: {
          bookingId,
          isApproved: false,
          reviewedById: userId,
          reviewedAt: new Date(),
        },
        include: {
          reviewedBy: { select: { id: true, name: true, role: true } },
        },
      });

      await tx.bookingRequest.update({
        where: { id: bookingId },
        data: { status: newStatus },
      });

      await tx.auditLog.create({
        data: {
          bookingId,
          userId,
          action: AuditAction.FEE_REJECTED,
          oldStatus,
          newStatus,
          details: finalReason,
        },
      });

      const noteContent = note || finalReason;
      if (noteContent && noteContent.trim()) {
        await tx.note.create({
          data: {
            bookingId,
            createdById: userId,
            content: noteContent,
            stage: 'FEE_REJECT',
          },
        });
      }

      const fullBooking = await tx.bookingRequest.findUnique({
        where: { id: bookingId },
        include: {
          venue: true,
          submittedBy: { select: { id: true, name: true, role: true } },
          feeReview: { include: { reviewedBy: { select: { id: true, name: true, role: true } } } },
          notes: {
            include: { createdBy: { select: { id: true, name: true, role: true } } },
            orderBy: { createdAt: 'desc' },
          },
          auditLogs: {
            include: { user: { select: { id: true, name: true, role: true } } },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      return this._buildReviewResponse(
        fullBooking,
        feeReview,
        oldStatus,
        newStatus,
        feeReview.reviewedBy,
        noteContent
      );
    });
  }

  static async getByBookingId(bookingId) {
    const feeReview = await prisma.feeReview.findUnique({
      where: { bookingId },
      include: {
        reviewedBy: { select: { id: true, name: true, role: true } },
      },
    });

    const booking = await prisma.bookingRequest.findUnique({
      where: { id: bookingId },
      include: {
        venue: true,
        submittedBy: { select: { id: true, name: true, role: true } },
        feeReview: {
          include: { reviewedBy: { select: { id: true, name: true, role: true } } },
        },
        notes: {
          include: { createdBy: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        },
        auditLogs: {
          include: { user: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!booking) return null;

    const latestAudit = booking.auditLogs && booking.auditLogs.length > 0 ? booking.auditLogs[0] : null;

    return {
      feeReview,
      booking: {
        id: booking.id,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        bookingDate: booking.bookingDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        hours: booking.hours,
        totalAmount: booking.totalAmount,
        status: booking.status,
        priority: booking.priority,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        venue: booking.venue,
        submittedBy: booking.submittedBy,
      },
      reviewSummary: {
        reviewedBy: feeReview?.reviewedBy || null,
        reviewedAt: feeReview?.reviewedAt || null,
        actualAmount: feeReview?.actualAmount || null,
        paymentMethod: feeReview?.paymentMethod || null,
        isApproved: feeReview?.isApproved,
        rejectReason: booking.auditLogs?.find(l => l.action === 'FEE_REJECTED')?.details || null,
        oldStatus: latestAudit?.oldStatus || null,
        newStatus: latestAudit?.newStatus || null,
        latestOperator: latestAudit?.user || null,
        latestOperatedAt: latestAudit?.createdAt || null,
      },
      notes: booking.notes,
      auditLogs: booking.auditLogs,
    };
  }

  static async listPending() {
    return prisma.bookingRequest.findMany({
      where: {
        status: { in: [BookingStatus.FEE_PENDING, BookingStatus.FEE_REJECTED] },
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
      include: {
        venue: true,
        submittedBy: { select: { id: true, name: true, role: true } },
        feeReview: { include: { reviewedBy: { select: { id: true, name: true, role: true } } } },
        notes: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: { createdBy: { select: { id: true, name: true, role: true } } },
        },
      },
    });
  }
}

module.exports = FeeReviewService;
