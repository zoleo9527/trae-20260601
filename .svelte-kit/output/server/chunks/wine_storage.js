import { d as db } from "./init.js";
function getAllWineStorage() {
  return db.prepare(`
    SELECT * FROM wine_storage ORDER BY stored_at DESC
  `).all();
}
function getWineStorageById(id) {
  return db.prepare(`
    SELECT * FROM wine_storage WHERE id = ?
  `).get(id);
}
function getWineStorageByPhone(phone) {
  return db.prepare(`
    SELECT * FROM wine_storage WHERE phone = ? ORDER BY stored_at DESC
  `).all(phone);
}
function getStoredWines() {
  return db.prepare(`
    SELECT * FROM wine_storage WHERE status = 'stored' ORDER BY stored_at DESC
  `).all();
}
function createWineStorage(data) {
  const stmt = db.prepare(`
    INSERT INTO wine_storage (customer_name, phone, wine_name, quantity, bottle_size, storage_location, status, stored_at, notes, created_by, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)
  `);
  const result = stmt.run(
    data.customer_name,
    data.phone,
    data.wine_name,
    data.quantity || 1,
    data.bottle_size || "standard",
    data.storage_location || "cellar",
    data.status || "stored",
    data.notes,
    data.created_by,
    data.updated_by
  );
  return result.lastInsertRowid;
}
function retrieveWine(id, updatedBy, notes) {
  const stmt = db.prepare(`
    UPDATE wine_storage 
    SET status = 'retrieved', retrieved_at = CURRENT_TIMESTAMP, updated_by = ?, updated_at = CURRENT_TIMESTAMP
    ${notes ? ", notes = ?" : ""}
    WHERE id = ?
  `);
  if (notes) {
    stmt.run(updatedBy, notes, id);
  } else {
    stmt.run(updatedBy, id);
  }
}
function updateWineStorage(id, data, updatedBy) {
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
  if (data.wine_name !== void 0) {
    fields.push("wine_name = ?");
    values.push(data.wine_name);
  }
  if (data.quantity !== void 0) {
    fields.push("quantity = ?");
    values.push(data.quantity);
  }
  if (data.bottle_size !== void 0) {
    fields.push("bottle_size = ?");
    values.push(data.bottle_size);
  }
  if (data.storage_location !== void 0) {
    fields.push("storage_location = ?");
    values.push(data.storage_location);
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
    const stmt = db.prepare(`UPDATE wine_storage SET ${fields.join(", ")} WHERE id = ?`);
    stmt.run(...values);
  }
}
function deleteWineStorage(id) {
  db.prepare("DELETE FROM wine_storage WHERE id = ?").run(id);
}
export {
  getWineStorageByPhone as a,
  getAllWineStorage as b,
  createWineStorage as c,
  getWineStorageById as d,
  deleteWineStorage as e,
  getStoredWines as g,
  retrieveWine as r,
  updateWineStorage as u
};
