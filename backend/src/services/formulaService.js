const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const AppError = require('../errors/AppError');

async function listFormulas(filters = {}) {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.species) where.species = filters.species;
  if (filters.stage) where.stage = filters.stage;
  if (filters.submitterId) where.submitterId = filters.submitterId;

  const formulas = await prisma.formula.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return formulas.map((f) => ({
    ...f,
    ingredients: JSON.parse(f.ingredients),
  }));
}

async function getFormulaById(id) {
  const formula = await prisma.formula.findUnique({
    where: { id },
    include: {
      submitter: true,
      reviewer: true,
    },
  });

  if (!formula) {
    throw new AppError(404, 'NOT_FOUND', '配方不存在');
  }

  return {
    ...formula,
    ingredients: JSON.parse(formula.ingredients),
  };
}

async function createFormula(data) {
  const now = new Date();
  const year = now.getFullYear();
  const prefix = `FP-${year}-`;

  const lastFormula = await prisma.formula.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: 'desc' },
  });

  let nextNum = 1;
  if (lastFormula) {
    const lastNum = parseInt(lastFormula.code.slice(prefix.length), 10);
    nextNum = lastNum + 1;
  }

  const code = `${prefix}${String(nextNum).padStart(3, '0')}`;

  const ingredients = typeof data.ingredients === 'string'
    ? data.ingredients
    : JSON.stringify(data.ingredients);

  const formula = await prisma.formula.create({
    data: {
      code,
      name: data.name,
      version: data.version ?? 1,
      species: data.species,
      stage: data.stage,
      ingredients,
      status: data.status ?? 'draft',
      submitterId: data.submitterId,
    },
  });

  return {
    ...formula,
    ingredients: JSON.parse(formula.ingredients),
  };
}

async function submitForReview(id) {
  const formula = await prisma.formula.findUnique({ where: { id } });

  if (!formula) {
    throw new AppError(404, 'NOT_FOUND', '配方不存在');
  }

  if (formula.status !== 'draft') {
    throw new AppError(409, 'FORMULA_DRAFT_ONLY', '只有草稿状态的配方才能提交审核');
  }

  const updated = await prisma.formula.update({
    where: { id },
    data: { status: 'pending_review' },
  });

  return {
    ...updated,
    ingredients: JSON.parse(updated.ingredients),
  };
}

async function reviewFormula(id, reviewerId, action, comment) {
  const formula = await prisma.formula.findUnique({ where: { id } });

  if (!formula) {
    throw new AppError(404, 'NOT_FOUND', '配方不存在');
  }

  if (formula.status !== 'pending_review') {
    throw new AppError(409, 'FORMULA_PENDING_ONLY', '只有待审核状态的配方才能审核');
  }

  const newStatus = action === 'approve' ? 'approved' : 'rejected';

  const updated = await prisma.formula.update({
    where: { id },
    data: {
      status: newStatus,
      reviewerId,
      reviewComment: comment ?? null,
      reviewedAt: new Date(),
    },
  });

  return {
    ...updated,
    ingredients: JSON.parse(updated.ingredients),
  };
}

async function getFormulaHistory(code) {
  const formulas = await prisma.formula.findMany({
    where: { code },
    orderBy: { version: 'desc' },
  });

  return formulas.map((f) => ({
    ...f,
    ingredients: JSON.parse(f.ingredients),
  }));
}

module.exports = {
  listFormulas,
  getFormulaById,
  createFormula,
  submitForReview,
  reviewFormula,
  getFormulaHistory,
};
