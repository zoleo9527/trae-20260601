import { db } from './init';
import type { Attachment } from './types';

export function getAllAttachments(): Attachment[] {
  return db.prepare(`
    SELECT * FROM attachments ORDER BY uploaded_at DESC
  `).all() as Attachment[];
}

export function getAttachmentsByRecord(tableName: string, recordId: number): Attachment[] {
  return db.prepare(`
    SELECT * FROM attachments WHERE table_name = ? AND record_id = ? ORDER BY uploaded_at DESC
  `).all(tableName, recordId) as Attachment[];
}

export function getAttachmentById(id: number): Attachment | undefined {
  return db.prepare(`
    SELECT * FROM attachments WHERE id = ?
  `).get(id) as Attachment | undefined;
}

export function createAttachment(data: Omit<Attachment, 'id' | 'uploaded_at'>): number {
  const stmt = db.prepare(`
    INSERT INTO attachments (table_name, record_id, file_name, file_path, file_type, description, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.table_name,
    data.record_id,
    data.file_name,
    data.file_path,
    data.file_type,
    data.description,
    data.uploaded_by
  );
  return result.lastInsertRowid as number;
}

export function deleteAttachment(id: number): void {
  db.prepare('DELETE FROM attachments WHERE id = ?').run(id);
}
