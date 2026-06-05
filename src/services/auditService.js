const prisma = require('../config/prisma');

const AuditAction = {
  CREATED: 'CREATED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  NOTE_ADDED: 'NOTE_ADDED',
  FEE_APPROVED: 'FEE_APPROVED',
  FEE_REJECTED: 'FEE_REJECTED',
  UPDATED: 'UPDATED',
  CANCELLED: 'CANCELLED',
};

class AuditService {
  static async log(bookingId, userId, action, oldStatus = null, newStatus = null, details = null) {
    return prisma.auditLog.create({
      data: {
        bookingId,
        userId,
        action,
        oldStatus,
        newStatus,
        details,
      },
    });
  }

  static async getByBookingId(bookingId) {
    return prisma.auditLog.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, role: true },
        },
      },
    });
  }

  static async getRecent(limit = 20) {
    return prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, role: true } },
        booking: { select: { id: true, customerName: true, status: true } },
      },
    });
  }
}

module.exports = AuditService;
