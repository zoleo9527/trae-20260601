import { db } from './init';
import type { Reservation } from './types';

export function getAllReservations(): Reservation[] {
  return db.prepare(`
    SELECT * FROM reservations ORDER BY date DESC, time_slot ASC
  `).all() as Reservation[];
}

export function getReservationById(id: number): Reservation | undefined {
  return db.prepare(`
    SELECT * FROM reservations WHERE id = ?
  `).get(id) as Reservation | undefined;
}

export function getReservationsByDate(date: string): Reservation[] {
  return db.prepare(`
    SELECT * FROM reservations WHERE date = ? ORDER BY time_slot ASC
  `).all(date) as Reservation[];
}

export function checkDuplicateReservation(date: string, tableNumber: number, timeSlot: string): boolean {
  const result = db.prepare(`
    SELECT COUNT(*) as count FROM reservations 
    WHERE date = ? AND table_number = ? AND time_slot = ? AND status != 'cancelled'
  `).get(date, tableNumber, timeSlot);
  return (result as { count: number }).count > 0;
}

export function createReservation(data: Omit<Reservation, 'id' | 'created_at' | 'updated_at'>): number {
  const stmt = db.prepare(`
    INSERT INTO reservations (customer_name, phone, date, time_slot, table_number, guests_count, status, notes, created_by, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.customer_name,
    data.phone,
    data.date,
    data.time_slot,
    data.table_number,
    data.guests_count || 2,
    data.status || 'confirmed',
    data.notes,
    data.created_by,
    data.updated_by
  );
  return result.lastInsertRowid as number;
}

export function updateReservation(id: number, data: Partial<Reservation>, updatedBy: number): void {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.customer_name !== undefined) { fields.push('customer_name = ?'); values.push(data.customer_name); }
  if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }
  if (data.date !== undefined) { fields.push('date = ?'); values.push(data.date); }
  if (data.time_slot !== undefined) { fields.push('time_slot = ?'); values.push(data.time_slot); }
  if (data.table_number !== undefined) { fields.push('table_number = ?'); values.push(data.table_number); }
  if (data.guests_count !== undefined) { fields.push('guests_count = ?'); values.push(data.guests_count); }
  if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
  if (data.notes !== undefined) { fields.push('notes = ?'); values.push(data.notes); }
  
  fields.push('updated_by = ?');
  values.push(updatedBy);
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  if (fields.length > 0) {
    const stmt = db.prepare(`UPDATE reservations SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }
}

export function deleteReservation(id: number): void {
  db.prepare('DELETE FROM reservations WHERE id = ?').run(id);
}
