import db from '../config/database';
import { InventoryRecord, ReviewRecord, MaterialType, GradeLevel } from '../types';
import { generateId, formatDate } from '../utils/helpers';
import { updateBatchStatus, getInboundBatchById } from './batch.service';
import { getSortedMaterialById, markMaterialAsStocked, markMaterialAsScrapped, getSortedMaterialsByBatchId } from './sorting.service';
import { getGradeJudgmentByMaterialId } from './grade.service';

interface CreateInventoryInput {
  batch_id: string;
  sorted_material_id: string;
  warehouse: string;
  location: string;
  stocker_id: string;
  stocker_name: string;
  remark?: string;
}

export const createInventoryRecord = (input: CreateInventoryInput): InventoryRecord => {
  const sortedMaterial = getSortedMaterialById(input.sorted_material_id);
  if (!sortedMaterial) {
    throw new Error('分选物料不存在');
  }

  if (sortedMaterial.is_stocked) {
    throw new Error('该物料已入库');
  }

  const gradeJudgment = getGradeJudgmentByMaterialId(input.sorted_material_id);
  if (!gradeJudgment) {
    throw new Error('该物料尚未完成品级判定');
  }

  const batch = getInboundBatchById(input.batch_id);
  if (!batch) {
    throw new Error('批次不存在');
  }

  const id = generateId();
  const now = formatDate();

  const stmt = db.prepare(`
    INSERT INTO inventory_records (
      id, batch_id, batch_no, sorted_material_id, material_type, grade_level,
      weight, unit_price, amount, warehouse, location, stocker_id, stocker_name,
      remark, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id, input.batch_id, batch.batch_no, input.sorted_material_id,
    sortedMaterial.material_type, gradeJudgment.judged_grade,
    sortedMaterial.weight, gradeJudgment.unit_price, gradeJudgment.amount,
    input.warehouse, input.location, input.stocker_id, input.stocker_name,
    input.remark || '', now
  );

  markMaterialAsStocked(input.sorted_material_id);

  const allMaterials = getSortedMaterialsByBatchId(input.batch_id);
  const allProcessed = allMaterials.every(m => m.is_stocked || m.is_scrapped);
  if (allProcessed) {
    updateBatchStatus(input.batch_id, 'stocked');
  }

  return getInventoryRecordById(id)!;
};

interface CreateScrapRecordInput {
  batch_id: string;
  sorted_material_id: string;
  handler_id: string;
  handler_name: string;
  reason: string;
}

export const createScrapRecord = (input: CreateScrapRecordInput) => {
  const sortedMaterial = getSortedMaterialById(input.sorted_material_id);
  if (!sortedMaterial) {
    throw new Error('分选物料不存在');
  }

  if (sortedMaterial.is_stocked) {
    throw new Error('该物料已入库，不能报废');
  }

  if (sortedMaterial.is_scrapped) {
    throw new Error('该物料已报废');
  }

  const batch = getInboundBatchById(input.batch_id);
  if (!batch) {
    throw new Error('批次不存在');
  }

  const id = generateId();
  const now = formatDate();
  const zeroPrice = 0;
  const zeroAmount = 0;

  const stmt = db.prepare(`
    INSERT INTO inventory_records (
      id, batch_id, batch_no, sorted_material_id, material_type, grade_level,
      weight, unit_price, amount, warehouse, location, stocker_id, stocker_name,
      remark, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id, input.batch_id, batch.batch_no, input.sorted_material_id,
    sortedMaterial.material_type, 'E',
    sortedMaterial.weight, zeroPrice, zeroAmount,
    '报废区', 'SC-001', input.handler_id, input.handler_name,
    `报废处理: ${input.reason}`, now
  );

  markMaterialAsScrapped(input.sorted_material_id);

  // 检查品级判定是否全部完成
  const allMaterialsForGrade = getSortedMaterialsByBatchId(input.batch_id);
  const allGraded = allMaterialsForGrade.every(m => {
    if (m.is_scrapped) return true;
    return m.grade_level !== null;
  });
  const currentBatch = getInboundBatchById(input.batch_id);
  if (allGraded && currentBatch && currentBatch.status === 'grading') {
    updateBatchStatus(input.batch_id, 'grading_completed');
  }

  // 检查入库/报废是否全部完成
  const allMaterials = getSortedMaterialsByBatchId(input.batch_id);
  const allProcessed = allMaterials.every(m => m.is_stocked || m.is_scrapped);
  if (allProcessed) {
    updateBatchStatus(input.batch_id, 'stocked');
  }

  return getInventoryRecordById(id)!;
};

export const getInventoryRecordById = (id: string): InventoryRecord | undefined => {
  const stmt = db.prepare('SELECT * FROM inventory_records WHERE id = ?');
  return stmt.get(id) as InventoryRecord | undefined;
};

export const getInventoryRecordsByBatchId = (batchId: string): InventoryRecord[] => {
  const stmt = db.prepare('SELECT * FROM inventory_records WHERE batch_id = ? ORDER BY created_at DESC');
  return stmt.all(batchId) as InventoryRecord[];
};

export const getAllInventoryRecords = (): InventoryRecord[] => {
  const stmt = db.prepare('SELECT * FROM inventory_records ORDER BY created_at DESC');
  return stmt.all() as InventoryRecord[];
};

export const getInventorySummary = () => {
  const summary = db.prepare(`
    SELECT 
      material_type,
      grade_level,
      warehouse,
      COUNT(*) as record_count,
      SUM(weight) as total_weight,
      SUM(amount) as total_amount
    FROM inventory_records
    GROUP BY material_type, grade_level, warehouse
    ORDER BY material_type, grade_level
  `).all();
  
  return summary;
};

export const getReviewRecordsByJudgmentId = (judgmentId: string): ReviewRecord[] => {
  const stmt = db.prepare('SELECT * FROM review_records WHERE grade_judgment_id = ? ORDER BY created_at DESC');
  return stmt.all(judgmentId) as ReviewRecord[];
};

export const getReviewRecordsByBatchId = (batchId: string): ReviewRecord[] => {
  const stmt = db.prepare('SELECT * FROM review_records WHERE batch_id = ? ORDER BY created_at DESC');
  return stmt.all(batchId) as ReviewRecord[];
};

export const getAllReviewRecords = (): ReviewRecord[] => {
  const stmt = db.prepare('SELECT * FROM review_records ORDER BY created_at DESC');
  return stmt.all() as ReviewRecord[];
};
