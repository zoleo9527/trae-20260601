import db from '../config/database';
import { SortingRecord, SortedMaterial, MaterialType } from '../types';
import { generateId, formatDate, parseJsonSafely } from '../utils/helpers';
import { updateBatchStatus, getInboundBatchById } from './batch.service';

interface SortedMaterialInput {
  material_type: MaterialType;
  weight: number;
  photo_urls?: string[];
}

interface CreateSortingRecordInput {
  batch_id: string;
  team_id: string;
  team_name: string;
  foreman_id: string;
  foreman_name: string;
  sorted_materials: SortedMaterialInput[];
  remark?: string;
}

export const createSortingRecord = (input: CreateSortingRecordInput): SortingRecord => {
  const batch = getInboundBatchById(input.batch_id);
  if (!batch) {
    throw new Error('批次不存在');
  }

  const id = generateId();
  const total_sorted_weight = input.sorted_materials.reduce((sum, m) => sum + m.weight, 0);
  const loss_weight = batch.net_weight - total_sorted_weight;
  const now = formatDate();

  const stmt = db.prepare(`
    INSERT INTO sorting_records (
      id, batch_id, batch_no, team_id, team_name, foreman_id, foreman_name,
      total_sorted_weight, loss_weight, remark, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id, input.batch_id, batch.batch_no, input.team_id, input.team_name,
    input.foreman_id, input.foreman_name, total_sorted_weight, loss_weight,
    input.remark || '', now
  );

  input.sorted_materials.forEach(material => {
    createSortedMaterial(id, material);
  });

  updateBatchStatus(input.batch_id, 'sorting_completed');

  return getSortingRecordById(id)!;
};

const createSortedMaterial = (sortingRecordId: string, material: SortedMaterialInput): SortedMaterial => {
  const id = generateId();
  const stmt = db.prepare(`
    INSERT INTO sorted_materials (
      id, sorting_record_id, material_type, weight, photo_urls
    ) VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(
    id, sortingRecordId, material.material_type, material.weight,
    JSON.stringify(material.photo_urls || [])
  );
  return getSortedMaterialById(id)!;
};

export const getSortingRecordById = (id: string): SortingRecord | undefined => {
  const record = db.prepare('SELECT * FROM sorting_records WHERE id = ?').get(id) as any;
  if (!record) return undefined;

  const sorted_materials = getSortedMaterialsByRecordId(id);
  return { ...record, sorted_materials };
};

export const getSortingRecordByBatchId = (batchId: string): SortingRecord | undefined => {
  const record = db.prepare('SELECT * FROM sorting_records WHERE batch_id = ? ORDER BY created_at DESC LIMIT 1').get(batchId) as any;
  if (!record) return undefined;

  const sorted_materials = getSortedMaterialsByRecordId(record.id);
  return { ...record, sorted_materials };
};

export const getSortedMaterialById = (id: string): SortedMaterial | undefined => {
  const material = db.prepare('SELECT * FROM sorted_materials WHERE id = ?').get(id) as any;
  if (!material) return undefined;

  return {
    ...material,
    photo_urls: parseJsonSafely<string[]>(material.photo_urls, []),
    is_stocked: material.is_stocked === 1
  };
};

export const getSortedMaterialsByRecordId = (recordId: string): SortedMaterial[] => {
  const materials = db.prepare('SELECT * FROM sorted_materials WHERE sorting_record_id = ?').all(recordId) as any[];
  return materials.map(m => ({
    ...m,
    photo_urls: parseJsonSafely<string[]>(m.photo_urls, []),
    is_stocked: m.is_stocked === 1
  }));
};

export const getSortedMaterialsByBatchId = (batchId: string): SortedMaterial[] => {
  const materials = db.prepare(`
    SELECT sm.* FROM sorted_materials sm
    JOIN sorting_records sr ON sm.sorting_record_id = sr.id
    WHERE sr.batch_id = ?
  `).all(batchId) as any[];

  return materials.map(m => ({
    ...m,
    photo_urls: parseJsonSafely<string[]>(m.photo_urls, []),
    is_stocked: m.is_stocked === 1
  }));
};

export const updateSortedMaterialGrade = (
  id: string,
  gradeLevel: string,
  unitPrice: number,
  amount: number
): boolean => {
  const stmt = db.prepare(`
    UPDATE sorted_materials
    SET grade_level = ?, unit_price = ?, amount = ?
    WHERE id = ?
  `);
  const result = stmt.run(gradeLevel, unitPrice, amount, id);
  return result.changes > 0;
};

export const markMaterialAsStocked = (id: string): boolean => {
  const stmt = db.prepare('UPDATE sorted_materials SET is_stocked = 1 WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
};

export const getAllSortingRecords = (): SortingRecord[] => {
  const records = db.prepare('SELECT * FROM sorting_records ORDER BY created_at DESC').all() as any[];
  return records.map(r => {
    const sorted_materials = getSortedMaterialsByRecordId(r.id);
    return { ...r, sorted_materials };
  });
};
