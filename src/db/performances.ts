import { db } from './init';
import type { Performance } from './types';

export function getAllPerformances(): Performance[] {
  return db.prepare(`
    SELECT * FROM performances ORDER BY date DESC, start_time ASC
  `).all() as Performance[];
}

export function getPerformanceById(id: number): Performance | undefined {
  return db.prepare(`
    SELECT * FROM performances WHERE id = ?
  `).get(id) as Performance | undefined;
}

export function getPerformancesByDate(date: string): Performance[] {
  return db.prepare(`
    SELECT * FROM performances WHERE date = ? ORDER BY start_time ASC
  `).all(date) as Performance[];
}

export function createPerformance(data: Omit<Performance, 'id' | 'created_at' | 'updated_at'>): number {
  const stmt = db.prepare(`
    INSERT INTO performances (guest_id, date, start_time, end_time, stage, status, notes, created_by, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.guest_id,
    data.date,
    data.start_time,
    data.end_time,
    data.stage || 'main',
    data.status || 'scheduled',
    data.notes,
    data.created_by,
    data.updated_by
  );
  return result.lastInsertRowid as number;
}

export function updatePerformance(id: number, data: Partial<Performance>, updatedBy: number): void {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.guest_id !== undefined) { fields.push('guest_id = ?'); values.push(data.guest_id); }
  if (data.date !== undefined) { fields.push('date = ?'); values.push(data.date); }
  if (data.start_time !== undefined) { fields.push('start_time = ?'); values.push(data.start_time); }
  if (data.end_time !== undefined) { fields.push('end_time = ?'); values.push(data.end_time); }
  if (data.stage !== undefined) { fields.push('stage = ?'); values.push(data.stage); }
  if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
  if (data.notes !== undefined) { fields.push('notes = ?'); values.push(data.notes); }
  
  fields.push('updated_by = ?');
  values.push(updatedBy);
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  if (fields.length > 0) {
    const stmt = db.prepare(`UPDATE performances SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }
}

export function deletePerformance(id: number): void {
  db.prepare('DELETE FROM performances WHERE id = ?').run(id);
}
