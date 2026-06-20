import db from '../config/database';
import { InventoryRecord, ReviewRecord } from '../types';
import { generateId, formatDate } from '../utils/helpers';
import { updateBatchStatus, getInboundBatchById } from './batch.service';
import { getSortedMaterialById, markMaterialAsStocked } from './sorting.service';
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

  const allMaterials = db.prepare(`
    SELECT sm.* FROM sorted_materials sm
    JOIN sorting_records sr ON sm.sorting_record_id = sr.id
    WHERE sr.batch_id = ?
  `).all(input.batch_id) as any[];

  const allStocked = allMaterials.every(m => m.is_stocked === 1);
  if (allStocked) {
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
