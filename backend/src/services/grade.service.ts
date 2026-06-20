import db from '../config/database';
import { GradeJudgment, GradeLevel } from '../types';
import { generateId, formatDate, parseJsonSafely, calculateGradeDifference } from '../utils/helpers';
import { updateBatchStatus, getInboundBatchById } from './batch.service';
import { getSortedMaterialById, updateSortedMaterialGrade, getSortedMaterialsByBatchId } from './sorting.service';

interface CreateGradeJudgmentInput {
  batch_id: string;
  sorted_material_id: string;
  original_grade: GradeLevel;
  judged_grade: GradeLevel;
  unit_price: number;
  judge_id: string;
  judge_name: string;
  photo_urls?: string[];
  remark?: string;
}

export const createGradeJudgment = (input: CreateGradeJudgmentInput): GradeJudgment => {
  const sortedMaterial = getSortedMaterialById(input.sorted_material_id);
  if (!sortedMaterial) {
    throw new Error('分选物料不存在');
  }

  const id = generateId();
  const weight = sortedMaterial.weight;
  const amount = weight * input.unit_price;
  const now = formatDate();

  const stmt = db.prepare(`
    INSERT INTO grade_judgments (
      id, batch_id, sorted_material_id, material_type, original_grade,
      judged_grade, unit_price, weight, amount, judge_id, judge_name,
      photo_urls, remark, is_reviewed, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id, input.batch_id, input.sorted_material_id, sortedMaterial.material_type,
    input.original_grade, input.judged_grade, input.unit_price, weight, amount,
    input.judge_id, input.judge_name, JSON.stringify(input.photo_urls || []),
    input.remark || '', 0, now, now
  );

  updateSortedMaterialGrade(input.sorted_material_id, input.judged_grade, input.unit_price, amount);

  const allMaterials = getSortedMaterialsByBatchId(input.batch_id);
  const allMaterialsProcessed = allMaterials.every(m => {
    if (m.is_scrapped) return true;
    return m.grade_level !== null;
  });

  if (allMaterialsProcessed) {
    updateBatchStatus(input.batch_id, 'grading_completed');
  } else {
    const batch = getInboundBatchById(input.batch_id);
    if (batch && batch.status === 'created') {
      updateBatchStatus(input.batch_id, 'grading');
    }
  }

  return getGradeJudgmentById(id)!;
};

export const getGradeJudgmentById = (id: string): GradeJudgment | undefined => {
  const judgment = db.prepare('SELECT * FROM grade_judgments WHERE id = ?').get(id) as any;
  if (!judgment) return undefined;

  return {
    ...judgment,
    photo_urls: parseJsonSafely<string[]>(judgment.photo_urls, []),
    is_reviewed: judgment.is_reviewed === 1
  };
};

export const getGradeJudgmentsByBatchId = (batchId: string): GradeJudgment[] => {
  const judgments = db.prepare('SELECT * FROM grade_judgments WHERE batch_id = ? ORDER BY created_at DESC').all(batchId) as any[];
  return judgments.map(j => ({
    ...j,
    photo_urls: parseJsonSafely<string[]>(j.photo_urls, []),
    is_reviewed: j.is_reviewed === 1
  }));
};

export const getGradeJudgmentByMaterialId = (materialId: string): GradeJudgment | undefined => {
  const judgment = db.prepare('SELECT * FROM grade_judgments WHERE sorted_material_id = ? ORDER BY created_at DESC LIMIT 1').get(materialId) as any;
  if (!judgment) return undefined;

  return {
    ...judgment,
    photo_urls: parseJsonSafely<string[]>(judgment.photo_urls, []),
    is_reviewed: judgment.is_reviewed === 1
  };
};

export const updateGradeJudgment = (
  id: string,
  newGrade: GradeLevel,
  newUnitPrice: number,
  reviewerId: string,
  reviewerName: string,
  reason: string
): { judgment: GradeJudgment; reviewId: string } => {
  const judgment = getGradeJudgmentById(id);
  if (!judgment) {
    throw new Error('品级判定不存在');
  }

  const now = formatDate();
  const newAmount = judgment.weight * newUnitPrice;
  const priceDiff = newUnitPrice - judgment.unit_price;
  const amountDiff = newAmount - judgment.amount;
  const gradeDiff = calculateGradeDifference(judgment.judged_grade, newGrade);

  const reviewId = generateId();
  const reviewStmt = db.prepare(`
    INSERT INTO review_records (
      id, grade_judgment_id, batch_id, sorted_material_id, material_type,
      original_grade, original_unit_price, original_amount,
      new_grade, new_unit_price, new_amount,
      grade_difference, price_difference, amount_difference,
      reviewer_id, reviewer_name, reason, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  reviewStmt.run(
    reviewId, id, judgment.batch_id, judgment.sorted_material_id, judgment.material_type,
    judgment.judged_grade, judgment.unit_price, judgment.amount,
    newGrade, newUnitPrice, newAmount,
    gradeDiff, priceDiff, amountDiff,
    reviewerId, reviewerName, reason, now
  );

  const updateStmt = db.prepare(`
    UPDATE grade_judgments
    SET judged_grade = ?, unit_price = ?, amount = ?, is_reviewed = 1, updated_at = ?
    WHERE id = ?
  `);

  updateStmt.run(newGrade, newUnitPrice, newAmount, now, id);

  updateSortedMaterialGrade(judgment.sorted_material_id, newGrade, newUnitPrice, newAmount);
  updateBatchStatus(judgment.batch_id, 'completed');

  return {
    judgment: getGradeJudgmentById(id)!,
    reviewId
  };
};

export const getAllGradeJudgments = (): GradeJudgment[] => {
  const judgments = db.prepare('SELECT * FROM grade_judgments ORDER BY created_at DESC').all() as any[];
  return judgments.map(j => ({
    ...j,
    photo_urls: parseJsonSafely<string[]>(j.photo_urls, []),
    is_reviewed: j.is_reviewed === 1
  }));
};
