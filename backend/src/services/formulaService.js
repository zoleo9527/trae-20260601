const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const AppError = require('../errors/AppError');

function parseFormula(f) {
  return { ...f, ingredients: JSON.parse(f.ingredients) };
}

async function listFormulas(filters = {}) {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.species) where.species = filters.species;
  if (filters.stage) where.stage = filters.stage;
  if (filters.submitterId) where.submitterId = filters.submitterId;
  if (filters.code) where.code = filters.code;

  if (filters.latestOnly) {
    const all = await prisma.formula.findMany({
      where,
      orderBy: [{ code: 'asc' }, { version: 'desc' }],
    });

    const latestMap = new Map();
    for (const f of all) {
      if (!latestMap.has(f.code)) {
        latestMap.set(f.code, f);
      }
    }

    return Array.from(latestMap.values())
      .map(parseFormula)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  const formulas = await prisma.formula.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return formulas.map(parseFormula);
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

  return parseFormula(formula);
}

async function createFormula(data) {
  const now = new Date();
  const year = now.getFullYear();
  const prefix = `FP-${year}-`;

  const lastFormula = await prisma.formula.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: [{ code: 'desc' }, { version: 'desc' }],
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
      version: 1,
      species: data.species,
      stage: data.stage,
      ingredients,
      status: 'draft',
      submitterId: data.submitterId,
    },
  });

  return parseFormula(formula);
}

async function createNewVersion(fromId, data, submitterId) {
  const source = await prisma.formula.findUnique({ where: { id: fromId } });
  if (!source) {
    throw new AppError(404, 'NOT_FOUND', '源配方不存在');
  }

  const maxVersion = await prisma.formula.findFirst({
    where: { code: source.code },
    orderBy: { version: 'desc' },
    select: { version: true },
  });

  const nextVersion = maxVersion ? maxVersion.version + 1 : 1;

  const ingredients = data.ingredients
    ? (typeof data.ingredients === 'string'
      ? data.ingredients
      : JSON.stringify(data.ingredients))
    : source.ingredients;

  const formula = await prisma.formula.create({
    data: {
      code: source.code,
      name: data.name ?? source.name,
      version: nextVersion,
      species: data.species ?? source.species,
      stage: data.stage ?? source.stage,
      ingredients,
      status: 'draft',
      submitterId,
    },
  });

  return parseFormula(formula);
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

  return parseFormula(updated);
}

async function reviewFormula(id, reviewerId, action, comment) {
  const formula = await prisma.formula.findUnique({ where: { id } });

  if (!formula) {
    throw new AppError(404, 'NOT_FOUND', '配方不存在');
  }

  if (formula.status !== 'pending_review') {
    throw new AppError(409, 'FORMULA_PENDING_ONLY', '只有待审核状态的配方才能审核');
  }

  if (formula.submitterId === reviewerId) {
    throw new AppError(403, 'SELF_REVIEW_FORBIDDEN', '禁止提交人自审，需由其他配方师交叉审核');
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

  return parseFormula(updated);
}

async function getFormulaHistory(code) {
  const formulas = await prisma.formula.findMany({
    where: { code },
    orderBy: { version: 'desc' },
    include: {
      submitter: { select: { id: true, name: true, role: true } },
      reviewer: { select: { id: true, name: true, role: true } },
    },
  });

  return formulas.map(parseFormula);
}

module.exports = {
  listFormulas,
  getFormulaById,
  createFormula,
  createNewVersion,
  submitForReview,
  reviewFormula,
  getFormulaHistory,
};
