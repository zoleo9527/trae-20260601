const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createAuditLog(entityType, entityId, action, fromStatus, toStatus, operatorName, notes, extras = {}) {
  await prisma.auditLog.create({
    data: {
      entityType,
      entityId,
      action,
      fromStatus,
      toStatus,
      operatorName,
      notes,
      ...extras
    }
  });
}

function paginate(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize) || 20));
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip, take: pageSize };
}

function filterRentals(query) {
  const where = {};
  if (query.status) where.status = query.status;
  if (query.depositStatus) where.depositStatus = query.depositStatus;
  if (query.equipmentType) where.equipmentType = query.equipmentType;
  if (query.guestName) where.guestName = { contains: query.guestName };
  if (query.guestPhone) where.guestPhone = { contains: query.guestPhone };
  if (query.orderNo) where.orderNo = { contains: query.orderNo };
  return where;
}

function filterCoachSchedules(query) {
  const where = {};
  if (query.status) where.status = query.status;
  if (query.coachName) where.coachName = { contains: query.coachName };
  if (query.guestName) where.guestName = { contains: query.guestName };
  if (query.scheduleDate) where.scheduleDate = query.scheduleDate;
  if (query.courseType) where.courseType = query.courseType;
  return where;
}

function filterRescueRecords(query) {
  const where = {};
  if (query.status) where.status = query.status;
  if (query.severity) where.severity = query.severity;
  if (query.incidentType) where.incidentType = query.incidentType;
  if (query.guestName) where.guestName = { contains: query.guestName };
  return where;
}

function filterDepositVerifications(query) {
  const where = {};
  if (query.status) where.status = query.status;
  if (query.verificationType) where.verificationType = query.verificationType;
  if (query.verifierName) where.verifierName = { contains: query.verifierName };
  return where;
}

function filterAuditLogs(query) {
  const where = {};
  if (query.entityType) where.entityType = query.entityType;
  if (query.entityId) where.entityId = query.entityId;
  if (query.action) where.action = query.action;
  if (query.operatorName) where.operatorName = { contains: query.operatorName };
  return where;
}

module.exports = {
  prisma,
  createAuditLog,
  paginate,
  filterRentals,
  filterCoachSchedules,
  filterRescueRecords,
  filterDepositVerifications,
  filterAuditLogs
};
