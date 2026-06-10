const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const AppError = require('../errors/AppError');

async function createInspection(data) {
  const { planId, inspectorId, batchLabelOk, deviationOk, remarks } = data;
  return prisma.inspectionRecord.create({
    data: {
      planId,
      inspectorId,
      batchLabelOk,
      deviationOk,
      remarks,
    },
  });
}

async function listInspections(planId) {
  return prisma.inspectionRecord.findMany({
    where: { planId },
    include: { inspector: true },
  });
}

async function getInspectionById(id) {
  const record = await prisma.inspectionRecord.findUnique({
    where: { id },
    include: { plan: true, inspector: true },
  });
  if (!record) {
    throw new AppError(404, 'NOT_FOUND', 'Inspection record not found');
  }
  return record;
}

async function listComplaints(filters = {}) {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.category) where.category = filters.category;
  if (filters.handlerId) where.handlerId = filters.handlerId;
  if (filters.batchCode) where.batchCode = filters.batchCode;
  return prisma.complaint.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { handler: true },
  });
}

async function getComplaintById(id) {
  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: { handler: true },
  });
  if (!complaint) {
    throw new AppError(404, 'NOT_FOUND', 'Complaint not found');
  }
  return complaint;
}

async function createComplaint(data) {
  const year = new Date().getFullYear();
  const count = await prisma.complaint.count({
    where: {
      code: { startsWith: `TS-${year}-` },
    },
  });
  const code = `TS-${year}-${String(count + 1).padStart(3, '0')}`;
  return prisma.complaint.create({
    data: {
      code,
      farmerName: data.farmerName,
      farmerPhone: data.farmerPhone,
      batchCode: data.batchCode,
      category: data.category,
      description: data.description,
      status: 'open',
    },
  });
}

async function handleComplaint(id, handlerId, result) {
  const complaint = await prisma.complaint.findUnique({ where: { id } });
  if (!complaint) {
    throw new AppError(404, 'NOT_FOUND', 'Complaint not found');
  }
  return prisma.complaint.update({
    where: { id },
    data: {
      status: 'handling',
      handlerId,
      handleResult: result,
      handledAt: new Date(),
    },
  });
}

async function resolveComplaint(id, result) {
  const complaint = await prisma.complaint.findUnique({ where: { id } });
  if (!complaint) {
    throw new AppError(404, 'NOT_FOUND', 'Complaint not found');
  }
  return prisma.complaint.update({
    where: { id },
    data: {
      status: 'resolved',
      handleResult: result,
    },
  });
}

async function getComplaintStats() {
  const byCategory = await prisma.complaint.groupBy({
    by: ['category'],
    _count: { id: true },
  });
  const byStatus = await prisma.complaint.groupBy({
    by: ['status'],
    _count: { id: true },
  });
  return {
    byCategory: byCategory.map((item) => ({
      category: item.category,
      count: item._count.id,
    })),
    byStatus: byStatus.map((item) => ({
      status: item.status,
      count: item._count.id,
    })),
  };
}

module.exports = {
  createInspection,
  listInspections,
  getInspectionById,
  listComplaints,
  getComplaintById,
  createComplaint,
  handleComplaint,
  resolveComplaint,
  getComplaintStats,
};
