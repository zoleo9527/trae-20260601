import { db } from '../db';

export function getUsers() {
  return db.prepare('SELECT * FROM users ORDER BY created_at').all();
}

export function getUsersByRole(role: string) {
  return db.prepare('SELECT * FROM users WHERE role = ? ORDER BY created_at').all(role);
}

export function getPonds() {
  return db.prepare('SELECT * FROM ponds ORDER BY name').all();
}

export function getPondById(id: string) {
  return db.prepare('SELECT * FROM ponds WHERE id = ?').get(id);
}

export function getMedicines() {
  return db.prepare('SELECT * FROM medicines ORDER BY name').all();
}

export function getMedicineById(id: string) {
  return db.prepare('SELECT * FROM medicines WHERE id = ?').get(id);
}

export function getInspections(pondId?: string) {
  let sql = `
    SELECT i.*, p.name as pond_name, u.name as inspector_name
    FROM inspections i
    JOIN ponds p ON i.pond_id = p.id
    JOIN users u ON i.inspector_id = u.id
  `;
  const params: any[] = [];
  
  if (pondId) {
    sql += ' WHERE i.pond_id = ?';
    params.push(pondId);
  }
  
  sql += ' ORDER BY i.inspect_date DESC';
  return db.prepare(sql).all(...params);
}

export function getFeedRecords(pondId?: string) {
  let sql = `
    SELECT fr.*, p.name as pond_name, u.name as feeder_name
    FROM feed_records fr
    JOIN ponds p ON fr.pond_id = p.id
    JOIN users u ON fr.feeder_id = u.id
  `;
  const params: any[] = [];
  
  if (pondId) {
    sql += ' WHERE fr.pond_id = ?';
    params.push(pondId);
  }
  
  sql += ' ORDER BY fr.feed_date DESC';
  return db.prepare(sql).all(...params);
}
