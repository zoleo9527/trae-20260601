import { db } from './init';
import type { WineStorage } from './types';

export function getAllWineStorage(): WineStorage[] {
  return db.prepare(`
    SELECT * FROM wine_storage ORDER BY stored_at DESC
  `).all() as WineStorage[];
}

export function getWineStorageById(id: number): WineStorage | undefined {
  return db.prepare(`
    SELECT * FROM wine_storage WHERE id = ?
  `).get(id) as WineStorage | undefined;
}

export function getWineStorageByPhone(phone: string): WineStorage[] {
  return db.prepare(`
    SELECT * FROM wine_storage WHERE phone = ? ORDER BY stored_at DESC
  `).all(phone) as WineStorage[];
}

export function getStoredWines(): WineStorage[] {
  return db.prepare(`
    SELECT * FROM wine_storage WHERE status = 'stored' ORDER BY stored_at DESC
  `).all() as WineStorage[];
}

export function createWineStorage(data: Omit<WineStorage, 'id' | 'created_at' | 'updated_at' | 'stored_at'>): number {
  const stmt = db.prepare(`
    INSERT INTO wine_storage (customer_name, phone, wine_name, quantity, bottle_size, storage_location, status, stored_at, notes, created_by, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)
  `);
  const result = stmt.run(
    data.customer_name,
    data.phone,
    data.wine_name,
    data.quantity || 1,
    data.bottle_size || 'standard',
    data.storage_location || 'cellar',
    data.status || 'stored',
    data.notes,
    data.created_by,
    data.updated_by
  );
  return result.lastInsertRowid as number;
}

export function retrieveWine(id: number, updatedBy: number, notes?: string): void {
  const stmt = db.prepare(`
    UPDATE wine_storage 
    SET status = 'retrieved', retrieved_at = CURRENT_TIMESTAMP, updated_by = ?, updated_at = CURRENT_TIMESTAMP
    ${notes ? ', notes = ?' : ''}
    WHERE id = ?
  `);
  if (notes) {
    stmt.run(updatedBy, notes, id);
  } else {
    stmt.run(updatedBy, id);
  }
}

export function updateWineStorage(id: number, data: Partial<WineStorage>, updatedBy: number): void {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.customer_name !== undefined) { fields.push('customer_name = ?'); values.push(data.customer_name); }
  if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }
  if (data.wine_name !== undefined) { fields.push('wine_name = ?'); values.push(data.wine_name); }
  if (data.quantity !== undefined) { fields.push('quantity = ?'); values.push(data.quantity); }
  if (data.bottle_size !== undefined) { fields.push('bottle_size = ?'); values.push(data.bottle_size); }
  if (data.storage_location !== undefined) { fields.push('storage_location = ?'); values.push(data.storage_location); }
  if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
  if (data.notes !== undefined) { fields.push('notes = ?'); values.push(data.notes); }
  
  fields.push('updated_by = ?');
  values.push(updatedBy);
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  if (fields.length > 0) {
    const stmt = db.prepare(`UPDATE wine_storage SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }
}

export function deleteWineStorage(id: number): void {
  db.prepare('DELETE FROM wine_storage WHERE id = ?').run(id);
}
