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
        data: { status: BookingStatus.FEE_APPROVED },
      });

      await tx.auditLog.create({
        data: {
          bookingId,
          userId,
          action: AuditAction.FEE_APPROVED,
          oldStatus: booking.status,
          newStatus: BookingStatus.FEE_APPROVED,
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

      return {
        feeReview,
        booking: await tx.bookingRequest.findUnique({
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
        }),
      };
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
        data: { status: BookingStatus.FEE_REJECTED },
      });

      await tx.auditLog.create({
        data: {
          bookingId,
          userId,
          action: AuditAction.FEE_REJECTED,
          oldStatus: booking.status,
          newStatus: BookingStatus.FEE_REJECTED,
          details: reason || '费用审核驳回',
        },
      });

      const noteContent = note || reason;
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

      return {
        feeReview,
        booking: await tx.bookingRequest.findUnique({
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
        }),
      };
    });
  }

  static async getByBookingId(bookingId) {
    return prisma.feeReview.findUnique({
      where: { bookingId },
      include: {
        reviewedBy: { select: { id: true, name: true, role: true } },
        booking: {
          include: {
            venue: true,
            submittedBy: { select: { id: true, name: true, role: true } },
            notes: {
              include: { createdBy: { select: { id: true, name: true, role: true } } },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });
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
