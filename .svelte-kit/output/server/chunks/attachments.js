import { d as db } from "./init.js";
function getAllAttachments() {
  return db.prepare(`
    SELECT * FROM attachments ORDER BY uploaded_at DESC
  `).all();
}
function getAttachmentsByRecord(tableName, recordId) {
  return db.prepare(`
    SELECT * FROM attachments WHERE table_name = ? AND record_id = ? ORDER BY uploaded_at DESC
  `).all(tableName, recordId);
}
function createAttachment(data) {
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
  return result.lastInsertRowid;
}
function deleteAttachment(id) {
  db.prepare("DELETE FROM attachments WHERE id = ?").run(id);
}
export {
  getAllAttachments as a,
  createAttachment as c,
  deleteAttachment as d,
  getAttachmentsByRecord as g
};
