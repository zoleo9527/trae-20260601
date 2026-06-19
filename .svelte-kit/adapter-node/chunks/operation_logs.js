import { d as db } from "./init.js";
function getAllLogs() {
  return db.prepare(`
    SELECT * FROM operation_logs ORDER BY created_at DESC
  `).all();
}
function getLogsByTable(tableName) {
  return db.prepare(`
    SELECT * FROM operation_logs WHERE table_name = ? ORDER BY created_at DESC
  `).all(tableName);
}
function getLogsByRecord(tableName, recordId) {
  return db.prepare(`
    SELECT * FROM operation_logs WHERE table_name = ? AND record_id = ? ORDER BY created_at DESC
  `).all(tableName, recordId);
}
function createLog(data) {
  const stmt = db.prepare(`
    INSERT INTO operation_logs (table_name, record_id, operation, field_name, old_value, new_value, operator_id, operator_name, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    data.table_name,
    data.record_id,
    data.operation,
    data.field_name,
    data.old_value,
    data.new_value,
    data.operator_id,
    data.operator_name,
    data.notes
  );
}
export {
  getLogsByTable as a,
  getAllLogs as b,
  createLog as c,
  getLogsByRecord as g
};
