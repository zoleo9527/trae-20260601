import { prisma } from '../server.js';

export async function createAuditLog({
  userId,
  action,
  entityType,
  entityId,
  description,
  oldValue = null,
  newValue = null,
  reservationId = null,
  ipAddress = null,
  userAgent = null
}) {
  return await prisma.auditLog.create({
    data: {
      userId,
      action,
      entityType,
      entityId,
      description,
      oldValue: oldValue ? JSON.stringify(oldValue) : null,
      newValue: newValue ? JSON.stringify(newValue) : null,
      reservationId,
      ipAddress,
      userAgent
    }
  });
}

export function extractAuditInfo(req) {
  return {
    ipAddress: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('user-agent')
  };
}
