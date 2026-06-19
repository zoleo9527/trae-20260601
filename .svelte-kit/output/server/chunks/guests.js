import { d as db } from "./init.js";
function getAllGuests() {
  return db.prepare(`
    SELECT * FROM guests ORDER BY created_at DESC
  `).all();
}
function getGuestById(id) {
  return db.prepare(`
    SELECT * FROM guests WHERE id = ?
  `).get(id);
}
function createGuest(data) {
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
    data.status || "active",
    data.created_by,
    data.updated_by
  );
  return result.lastInsertRowid;
}
function updateGuest(id, data, updatedBy) {
  const fields = [];
  const values = [];
  if (data.name !== void 0) {
    fields.push("name = ?");
    values.push(data.name);
  }
  if (data.stage_name !== void 0) {
    fields.push("stage_name = ?");
    values.push(data.stage_name);
  }
  if (data.phone !== void 0) {
    fields.push("phone = ?");
    values.push(data.phone);
  }
  if (data.email !== void 0) {
    fields.push("email = ?");
    values.push(data.email);
  }
  if (data.genre !== void 0) {
    fields.push("genre = ?");
    values.push(data.genre);
  }
  if (data.agent_name !== void 0) {
    fields.push("agent_name = ?");
    values.push(data.agent_name);
  }
  if (data.agent_phone !== void 0) {
    fields.push("agent_phone = ?");
    values.push(data.agent_phone);
  }
  if (data.description !== void 0) {
    fields.push("description = ?");
    values.push(data.description);
  }
  if (data.status !== void 0) {
    fields.push("status = ?");
    values.push(data.status);
  }
  fields.push("updated_by = ?");
  values.push(updatedBy);
  fields.push("updated_at = CURRENT_TIMESTAMP");
  values.push(id);
  if (fields.length > 0) {
    const stmt = db.prepare(`UPDATE guests SET ${fields.join(", ")} WHERE id = ?`);
    stmt.run(...values);
  }
}
function deleteGuest(id) {
  db.prepare("DELETE FROM guests WHERE id = ?").run(id);
}
export {
  getGuestById as a,
  createGuest as c,
  deleteGuest as d,
  getAllGuests as g,
  updateGuest as u
};
