import db from '../config/database';
import { generateId, formatDate } from '../utils/helpers';
import { MaterialType, GradeLevel } from '../types';

interface PriceEntry {
  id: string;
  material_type: MaterialType;
  grade_level: GradeLevel;
  unit_price: number;
  effective_date: string;
  is_active: boolean;
  created_at: string;
}

export const addPrice = (
  materialType: MaterialType,
  gradeLevel: GradeLevel,
  unitPrice: number
): PriceEntry => {
  const id = generateId();
  const now = formatDate();

  db.prepare(`
    UPDATE price_list 
    SET is_active = 0 
    WHERE material_type = ? AND grade_level = ? AND is_active = 1
  `).run(materialType, gradeLevel);

  const stmt = db.prepare(`
    INSERT INTO price_list (id, material_type, grade_level, unit_price, effective_date, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, 1, ?)
  `);
  stmt.run(id, materialType, gradeLevel, unitPrice, now, now);

  return getPriceById(id)!;
};

export const getPriceById = (id: string): PriceEntry | undefined => {
  const entry = db.prepare('SELECT * FROM price_list WHERE id = ?').get(id) as any;
  if (!entry) return undefined;
  return { ...entry, is_active: entry.is_active === 1 };
};

export const getCurrentPrice = (materialType: MaterialType, gradeLevel: GradeLevel): number | undefined => {
  const entry = db.prepare(`
    SELECT unit_price FROM price_list 
    WHERE material_type = ? AND grade_level = ? AND is_active = 1
    ORDER BY effective_date DESC LIMIT 1
  `).get(materialType, gradeLevel) as any;
  
  return entry?.unit_price;
};

export const getAllPrices = (): PriceEntry[] => {
  const entries = db.prepare('SELECT * FROM price_list ORDER BY material_type, grade_level, effective_date DESC').all() as any[];
  return entries.map(e => ({ ...e, is_active: e.is_active === 1 }));
};

export const getActivePrices = (): PriceEntry[] => {
  const entries = db.prepare(`
    SELECT * FROM price_list 
    WHERE is_active = 1 
    ORDER BY material_type, grade_level
  `).all() as any[];
  return entries.map(e => ({ ...e, is_active: e.is_active === 1 }));
};

export const getPriceMatrix = (): Record<string, Record<string, number>> => {
  const activePrices = getActivePrices();
  const matrix: Record<string, Record<string, number>> = {};
  
  activePrices.forEach(p => {
    if (!matrix[p.material_type]) {
      matrix[p.material_type] = {};
    }
    matrix[p.material_type][p.grade_level] = p.unit_price;
  });
  
  return matrix;
};
