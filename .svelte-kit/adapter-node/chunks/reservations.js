import { d as db } from "./init.js";
function getAllReservations() {
  return db.prepare(`
    SELECT * FROM reservations ORDER BY date DESC, time_slot ASC
  `).all();
}
function getReservationById(id) {
  return db.prepare(`
    SELECT * FROM reservations WHERE id = ?
  `).get(id);
}
function getReservationsByDate(date) {
  return db.prepare(`
    SELECT * FROM reservations WHERE date = ? ORDER BY time_slot ASC
  `).all(date);
}
function checkDuplicateReservation(date, tableNumber, timeSlot, excludeId) {
  let sql = `
    SELECT COUNT(*) as count FROM reservations 
    WHERE date = ? AND table_number = ? AND time_slot = ? AND status != 'cancelled'
  `;
  const params = [date, tableNumber, timeSlot];
  if (excludeId !== void 0) {
    sql += " AND id != ?";
    params.push(excludeId);
  }
  const result = db.prepare(sql).get(...params);
  return result.count > 0;
}
function createReservation(data) {
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
    data.status || "confirmed",
    data.notes,
    data.created_by,
    data.updated_by
  );
  return result.lastInsertRowid;
}
function updateReservation(id, data, updatedBy) {
  const fields = [];
  const values = [];
  if (data.customer_name !== void 0) {
    fields.push("customer_name = ?");
    values.push(data.customer_name);
  }
  if (data.phone !== void 0) {
    fields.push("phone = ?");
    values.push(data.phone);
  }
  if (data.date !== void 0) {
    fields.push("date = ?");
    values.push(data.date);
  }
  if (data.time_slot !== void 0) {
    fields.push("time_slot = ?");
    values.push(data.time_slot);
  }
  if (data.table_number !== void 0) {
    fields.push("table_number = ?");
    values.push(data.table_number);
  }
  if (data.guests_count !== void 0) {
    fields.push("guests_count = ?");
    values.push(data.guests_count);
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
    const stmt = db.prepare(`UPDATE reservations SET ${fields.join(", ")} WHERE id = ?`);
    stmt.run(...values);
  }
}
function deleteReservation(id) {
  db.prepare("DELETE FROM reservations WHERE id = ?").run(id);
}
export {
  getAllReservations as a,
  createReservation as b,
  checkDuplicateReservation as c,
  getReservationById as d,
  deleteReservation as e,
  getReservationsByDate as g,
  updateReservation as u
};
