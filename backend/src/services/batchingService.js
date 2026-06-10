const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const AppError = require('../errors/AppError');

const DEVIATION_THRESHOLD = 5.0;

function buildAnomalySummary(plan, complaints) {
  const deviationAlerts = (plan.records || []).filter(
    (r) => r.deviationRate !== null && Math.abs(r.deviationRate) >= DEVIATION_THRESHOLD
  );

  const labelAlerts = (plan.inspections || []).filter(
    (i) => i.batchLabelOk === false
  );

  const relatedComplaints = complaints.map((c) => ({
    id: c.id,
    code: c.code,
    category: c.category,
    status: c.status,
    farmerName: c.farmerName,
    description: c.description,
    createdAt: c.createdAt,
  }));

  return {
    deviationAlerts,
    labelAlerts,
    relatedComplaints,
  };
}

async function listPlans(filters = {}) {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.shift) where.shift = filters.shift;
  if (filters.formulaId) where.formulaId = filters.formulaId;
  if (filters.creatorId) where.creatorId = filters.creatorId;

  return prisma.batchingPlan.findMany({
    where,
    include: { formula: true },
    orderBy: { plannedAt: 'desc' },
  });
}

async function getPlanById(id) {
  const plan = await prisma.batchingPlan.findUnique({
    where: { id },
    include: {
      formula: true,
      records: true,
      inspections: { include: { inspector: true } },
    },
  });
  if (!plan) throw new AppError(404, 'NOT_FOUND', '资源不存在');

  const complaints = await prisma.complaint.findMany({
    where: { batchCode: plan.code },
    orderBy: { createdAt: 'desc' },
  });

  const anomalySummary = buildAnomalySummary(plan, complaints);

  return { ...plan, anomalySummary };
}

async function createPlan(data) {
  const formula = await prisma.formula.findUnique({ where: { id: data.formulaId } });
  if (!formula) throw new AppError(404, 'NOT_FOUND', '资源不存在');
  if (formula.status !== 'approved') throw new AppError(409, 'FORMULA_APPROVED_ONLY', '仅已审批配方可创建投料计划');

  const year = new Date().getFullYear();
  const prefix = `TL-${year}-`;
  const last = await prisma.batchingPlan.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: 'desc' },
    select: { code: true },
  });
  let nextNum = 1;
  if (last) {
    nextNum = parseInt(last.code.slice(prefix.length), 10) + 1;
  }
  const code = `${prefix}${String(nextNum).padStart(3, '0')}`;

  return prisma.batchingPlan.create({
    data: {
      code,
      formulaId: data.formulaId,
      plannedQty: data.plannedQty,
      shift: data.shift,
      plannedAt: data.plannedAt ? new Date(data.plannedAt) : undefined,
      creatorId: data.creatorId,
      status: 'pending',
    },
    include: { formula: true },
  });
}

async function startPlan(id) {
  const plan = await prisma.batchingPlan.findUnique({ where: { id } });
  if (!plan) throw new AppError(404, 'NOT_FOUND', '资源不存在');
  if (plan.status !== 'pending') throw new AppError(409, 'PLAN_STATUS_ERROR', '投料计划状态不允许此操作');

  return prisma.batchingPlan.update({
    where: { id },
    data: { status: 'in_progress', startedAt: new Date() },
    include: { formula: true },
  });
}

async function completePlan(id, actualQty) {
  const plan = await prisma.batchingPlan.findUnique({ where: { id } });
  if (!plan) throw new AppError(404, 'NOT_FOUND', '资源不存在');
  if (plan.status !== 'in_progress') throw new AppError(409, 'PLAN_STATUS_ERROR', '投料计划状态不允许此操作');

  return prisma.batchingPlan.update({
    where: { id },
    data: { status: 'completed', completedAt: new Date(), actualQty },
    include: { formula: true },
  });
}

async function addBatchingRecord(planId, data) {
  const plan = await prisma.batchingPlan.findUnique({ where: { id: planId } });
  if (!plan) throw new AppError(404, 'NOT_FOUND', '资源不存在');

  const actualWeight = data.actualWeight ?? null;
  const plannedWeight = data.plannedWeight;
  let deviation = null;
  let deviationRate = null;
  if (actualWeight !== null) {
    deviation = actualWeight - plannedWeight;
    deviationRate = plannedWeight !== 0 ? (deviation / plannedWeight) * 100 : 0;
  }

  return prisma.batchingRecord.create({
    data: {
      planId,
      materialName: data.materialName,
      plannedWeight,
      actualWeight,
      deviation,
      deviationRate,
      operator: data.operator,
    },
  });
}

async function listPlanRecords(planId) {
  const plan = await prisma.batchingPlan.findUnique({ where: { id: planId } });
  if (!plan) throw new AppError(404, 'NOT_FOUND', '资源不存在');

  return prisma.batchingRecord.findMany({
    where: { planId },
    orderBy: { recordedAt: 'desc' },
  });
}

async function getPlanHistory(formulaId, formulaCode, complaintCategory) {
  let where = { status: { in: ['completed', 'in_progress'] } };

  if (formulaCode) {
    const formulaIds = await prisma.formula.findMany({
      where: { code: formulaCode },
      select: { id: true },
    });
    where.formulaId = { in: formulaIds.map((f) => f.id) };
  } else if (formulaId) {
    const formula = await prisma.formula.findUnique({ where: { id: formulaId } });
    if (!formula) throw new AppError(404, 'NOT_FOUND', '资源不存在');
    where.formulaId = formulaId;
  }

  const plans = await prisma.batchingPlan.findMany({
    where,
    include: { formula: true, records: true, inspections: true },
    orderBy: { plannedAt: 'desc' },
  });

  const planCodes = plans.map((p) => p.code);
  const complaintWhere = { batchCode: { in: planCodes } };
  if (complaintCategory) {
    complaintWhere.category = complaintCategory;
  }
  const allComplaints = planCodes.length > 0
    ? await prisma.complaint.findMany({
        where: complaintWhere,
        orderBy: { createdAt: 'desc' },
      })
    : [];

  const complaintsByCode = new Map();
  for (const c of allComplaints) {
    if (!c.batchCode) continue;
    if (!complaintsByCode.has(c.batchCode)) {
      complaintsByCode.set(c.batchCode, []);
    }
    complaintsByCode.get(c.batchCode).push(c);
  }

  return plans.map((plan) => {
    const complaints = complaintsByCode.get(plan.code) || [];
    const anomalySummary = buildAnomalySummary(plan, complaints);
    return { ...plan, anomalySummary };
  });
}

module.exports = {
  listPlans,
  getPlanById,
  createPlan,
  startPlan,
  completePlan,
  addBatchingRecord,
  listPlanRecords,
  getPlanHistory,
};
