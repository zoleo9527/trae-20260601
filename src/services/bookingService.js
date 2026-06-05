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

const UserRole = {
  FRONT_DESK: 'FRONT_DESK',
  COACH: 'COACH',
  STORE_MANAGER: 'STORE_MANAGER',
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

const STATUS_TRANSITIONS = {
  [BookingStatus.DRAFT]: [BookingStatus.PENDING_REVIEW, BookingStatus.CANCELLED],
  [BookingStatus.PENDING_REVIEW]: [BookingStatus.FEE_PENDING, BookingStatus.CANCELLED, BookingStatus.DRAFT],
  [BookingStatus.FEE_PENDING]: [BookingStatus.FEE_APPROVED, BookingStatus.FEE_REJECTED],
  [BookingStatus.FEE_REJECTED]: [BookingStatus.FEE_PENDING, BookingStatus.CANCELLED],
  [BookingStatus.FEE_APPROVED]: [BookingStatus.COMPLETED],
  [BookingStatus.COMPLETED]: [],
  [BookingStatus.CANCELLED]: [],
};

const ROLE_PERMISSIONS = {
  [UserRole.FRONT_DESK]: {
    canCreate: true,
    canEditStatus: [BookingStatus.DRAFT, BookingStatus.PENDING_REVIEW],
    canTransition: {
      [BookingStatus.DRAFT]: [BookingStatus.PENDING_REVIEW],
    },
    canAddNote: true,
    canReviewFee: false,
  },
  [UserRole.COACH]: {
    canCreate: true,
    canEditStatus: [BookingStatus.DRAFT, BookingStatus.PENDING_REVIEW],
    canTransition: {
      [BookingStatus.DRAFT]: [BookingStatus.PENDING_REVIEW],
    },
    canAddNote: true,
    canReviewFee: false,
  },
  [UserRole.STORE_MANAGER]: {
    canCreate: true,
    canEditStatus: Object.values(BookingStatus),
    canTransition: {
      [BookingStatus.PENDING_REVIEW]: [BookingStatus.FEE_PENDING],
      [BookingStatus.FEE_PENDING]: [BookingStatus.FEE_APPROVED, BookingStatus.FEE_REJECTED],
      [BookingStatus.FEE_REJECTED]: [BookingStatus.FEE_PENDING],
      [BookingStatus.FEE_APPROVED]: [BookingStatus.COMPLETED],
      [BookingStatus.DRAFT]: [BookingStatus.PENDING_REVIEW, BookingStatus.CANCELLED],
      [BookingStatus.PENDING_REVIEW]: [BookingStatus.CANCELLED],
    },
    canAddNote: true,
    canReviewFee: true,
  },
};

class BookingService {
  static async canTransition(currentStatus, targetStatus, userRole) {
    const permissions = ROLE_PERMISSIONS[userRole];
    if (!permissions) return false;

    const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowedTransitions.includes(targetStatus)) return false;

    const roleTransitions = permissions.canTransition[currentStatus] || [];
    return roleTransitions.includes(targetStatus);
  }

  static async create(data, userId) {
    return prisma.$transaction(async (tx) => {
      const booking = await tx.bookingRequest.create({
        data: {
          ...data,
          submittedById: userId,
          status: BookingStatus.DRAFT,
        },
        include: {
          venue: true,
          submittedBy: { select: { id: true, name: true, role: true } },
          notes: {
            include: { createdBy: { select: { id: true, name: true, role: true } } },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          bookingId: booking.id,
          userId,
          action: AuditAction.CREATED,
          newStatus: BookingStatus.DRAFT,
          details: '创建包场申请',
        },
      });

      return booking;
    });
  }

  static async update(id, data, userId) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.bookingRequest.findUnique({ where: { id } });
      if (!existing) throw new Error('申请不存在');

      const booking = await tx.bookingRequest.update({
        where: { id },
        data,
        include: {
          venue: true,
          submittedBy: { select: { id: true, name: true, role: true } },
          notes: {
            include: { createdBy: { select: { id: true, name: true, role: true } } },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          bookingId: id,
          userId,
          action: AuditAction.UPDATED,
          details: '更新申请信息',
        },
      });

      return booking;
    });
  }

  static async changeStatus(id, targetStatus, userId, userRole, details = '') {
    return prisma.$transaction(async (tx) => {
      const booking = await tx.bookingRequest.findUnique({ where: { id } });
      if (!booking) throw new Error('申请不存在');

      const canTransition = await this.canTransition(booking.status, targetStatus, userRole);
      if (!canTransition) {
        throw new Error(`无权将状态从 ${booking.status} 变更为 ${targetStatus}`);
      }

      const updated = await tx.bookingRequest.update({
        where: { id },
        data: { status: targetStatus },
        include: {
          venue: true,
          submittedBy: { select: { id: true, name: true, role: true } },
          notes: {
            include: { createdBy: { select: { id: true, name: true, role: true } } },
            orderBy: { createdAt: 'desc' },
          },
          feeReview: {
            include: { reviewedBy: { select: { id: true, name: true, role: true } } },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          bookingId: id,
          userId,
          action: AuditAction.STATUS_CHANGED,
          oldStatus: booking.status,
          newStatus: targetStatus,
          details: details || `状态变更: ${booking.status} -> ${targetStatus}`,
        },
      });

      return updated;
    });
  }

  static async addNote(bookingId, userId, content, stage = 'GENERAL') {
    return prisma.$transaction(async (tx) => {
      const note = await tx.note.create({
        data: {
          bookingId,
          createdById: userId,
          content,
          stage,
        },
        include: {
          createdBy: { select: { id: true, name: true, role: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          bookingId,
          userId,
          action: AuditAction.NOTE_ADDED,
          details: `添加备注 (${stage})`,
        },
      });

      return note;
    });
  }

  static async getById(id) {
    return prisma.bookingRequest.findUnique({
      where: { id },
      include: {
        venue: true,
        submittedBy: { select: { id: true, name: true, role: true } },
        notes: {
          include: { createdBy: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        },
        feeReview: {
          include: { reviewedBy: { select: { id: true, name: true, role: true } } },
        },
        auditLogs: {
          include: { user: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  static async list(filters = {}) {
    const where = {};
    if (filters.status) where.status = filters.status;
    if (filters.venueId) where.venueId = Number(filters.venueId);
    if (filters.submittedById) where.submittedById = Number(filters.submittedById);

    return prisma.bookingRequest.findMany({
      where,
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'desc' },
      ],
      include: {
        venue: true,
        submittedBy: { select: { id: true, name: true, role: true } },
        feeReview: {
          include: { reviewedBy: { select: { id: true, name: true, role: true } } },
        },
        _count: {
          select: { notes: true, auditLogs: true },
        },
      },
    });
  }

  static async submitForReview(id, userId, userRole) {
    return this.changeStatus(id, BookingStatus.PENDING_REVIEW, userId, userRole, '提交审核');
  }

  static async cancel(id, userId, userRole, reason = '') {
    return prisma.$transaction(async (tx) => {
      const booking = await tx.bookingRequest.findUnique({ where: { id } });
      if (!booking) throw new Error('申请不存在');

      const canTransition = await this.canTransition(booking.status, BookingStatus.CANCELLED, userRole);
      if (!canTransition) throw new Error('无权取消此申请');

      const updated = await tx.bookingRequest.update({
        where: { id },
        data: { status: BookingStatus.CANCELLED },
        include: {
          venue: true,
          submittedBy: { select: { id: true, name: true, role: true } },
          notes: {
            include: { createdBy: { select: { id: true, name: true, role: true } } },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          bookingId: id,
          userId,
          action: AuditAction.CANCELLED,
          oldStatus: booking.status,
          newStatus: BookingStatus.CANCELLED,
          details: reason || '取消申请',
        },
      });

      return updated;
    });
  }
}

module.exports = { BookingService, STATUS_TRANSITIONS, ROLE_PERMISSIONS };
