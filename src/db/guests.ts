import { db } from './init';
import type { Guest } from './types';

export function getAllGuests(): Guest[] {
  return db.prepare(`
    SELECT * FROM guests ORDER BY created_at DESC
  `).all() as Guest[];
}

export function getGuestById(id: number): Guest | undefined {
  return db.prepare(`
    SELECT * FROM guests WHERE id = ?
  `).get(id) as Guest | undefined;
}

export function createGuest(data: Omit<Guest, 'id' | 'created_at' | 'updated_at'>): number {
  const stmt = db.prepare(`
    INSERT INTO guests (name, stage_name, phone, email, genre, agent_name, agent_phone, description, status, created_by, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.name,
    data.stage_name,
    data.phone,
    data.email,
    data.genre,
    data.agent_name,
    data.agent_phone,
    data.description,
    data.status || 'active',
    data.created_by,
    data.updated_by
  );
  return result.lastInsertRowid as number;
}

export function updateGuest(id: number, data: Partial<Guest>, updatedBy: number): void {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.stage_name !== undefined) { fields.push('stage_name = ?'); values.push(data.stage_name); }
  if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }
  if (data.email !== undefined) { fields.push('email = ?'); values.push(data.email); }
  if (data.genre !== undefined) { fields.push('genre = ?'); values.push(data.genre); }
  if (data.agent_name !== undefined) { fields.push('agent_name = ?'); values.push(data.agent_name); }
  if (data.agent_phone !== undefined) { fields.push('agent_phone = ?'); values.push(data.agent_phone); }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
  if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
  
  fields.push('updated_by = ?');
  values.push(updatedBy);
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  if (fields.length > 0) {
    const stmt = db.prepare(`UPDATE guests SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }
}

export function deleteGuest(id: number): void {
  db.prepare('DELETE FROM guests WHERE id = ?').run(id);
}
