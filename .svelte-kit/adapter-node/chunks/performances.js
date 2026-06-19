import { d as db } from "./init.js";
function getAllPerformances() {
  return db.prepare(`
    SELECT * FROM performances ORDER BY date DESC, start_time ASC
  `).all();
}
function getPerformanceById(id) {
  return db.prepare(`
    SELECT * FROM performances WHERE id = ?
  `).get(id);
}
function getPerformancesByDate(date) {
  return db.prepare(`
    SELECT * FROM performances WHERE date = ? ORDER BY start_time ASC
  `).all(date);
}
function createPerformance(data) {
  const stmt = db.prepare(`
    INSERT INTO performances (guest_id, date, start_time, end_time, stage, status, notes, created_by, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.guest_id,
    data.date,
    data.start_time,
    data.end_time,
    data.stage || "main",
    data.status || "scheduled",
    data.notes,
    data.created_by,
    data.updated_by
  );
  return result.lastInsertRowid;
}
function updatePerformance(id, data, updatedBy) {
  const fields = [];
  const values = [];
  if (data.guest_id !== void 0) {
    fields.push("guest_id = ?");
    values.push(data.guest_id);
  }
  if (data.date !== void 0) {
    fields.push("date = ?");
    values.push(data.date);
  }
  if (data.start_time !== void 0) {
    fields.push("start_time = ?");
    values.push(data.start_time);
  }
  if (data.end_time !== void 0) {
    fields.push("end_time = ?");
    values.push(data.end_time);
  }
  if (data.stage !== void 0) {
    fields.push("stage = ?");
    values.push(data.stage);
  }
  if (data.status !== void 0) {
    fields.push("status = ?");
    values.push(data.status);
  }
  if (data.notes !== void 0) {
    fields.push("notes = ?");
    values.push(data.notes);
  }
  fields.push("updated_by = ?");
  values.push(updatedBy);
  fields.push("updated_at = CURRENT_TIMESTAMP");
  values.push(id);
  if (fields.length > 0) {
    const stmt = db.prepare(`UPDATE performances SET ${fields.join(", ")} WHERE id = ?`);
    stmt.run(...values);
  }
}
function deletePerformance(id) {
  db.prepare("DELETE FROM performances WHERE id = ?").run(id);
}
export {
  getAllPerformances as a,
  getPerformanceById as b,
  createPerformance as c,
  deletePerformance as d,
  getPerformancesByDate as g,
  updatePerformance as u
};
