import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(__dirname, "..", "dorm.db");
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export default db;

export function getStudents() {
  return db.prepare('SELECT * FROM students').all();
}

export function getUsers() {
  return db.prepare('SELECT * FROM users').all();
}

export function getLateReturns() {
  return db.prepare(`
    SELECT r.*, s.name as student_name, s.dorm_room, s.counselor
    FROM late_return_records r
    LEFT JOIN students s ON r.student_id = s.student_id
    ORDER BY r.id DESC
  `).all();
}

export function getLateReturnById(id: number) {
  const record: any = db.prepare(`
    SELECT r.*, s.name as student_name, s.dorm_room, s.counselor
    FROM late_return_records r
    LEFT JOIN students s ON r.student_id = s.student_id
    WHERE r.id = ?
  `).get(id);
  if (!record) return null;
  const logs = db.prepare('SELECT * FROM status_logs WHERE record_id = ? ORDER BY id ASC').all(id);
  return { ...record, logs };
}

export function insertLateReturn(r: {
  student_id: string; late_time: string; return_time: string; reason: string;
  dorm_officer_id: string; dorm_officer_name: string; dorm_officer_note?: string;
}) {
  const stmt = db.prepare(`
    INSERT INTO late_return_records 
    (student_id, late_time, return_time, reason, dorm_officer_id, dorm_officer_name, dorm_officer_note, status, registered_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, '已登记', datetime('now'))
  `);
  const result = stmt.run(r.student_id, r.late_time, r.return_time, r.reason, r.dorm_officer_id, r.dorm_officer_name, r.dorm_officer_note || null);
  return Number(result.lastInsertRowid);
}

export function updateLateReturn(id: number, updates: Record<string, any>) {
  const keys = Object.keys(updates);
  const values = Object.values(updates);
  const setClause = keys.map(k => `${k} = ?`).join(', ');
  const stmt = db.prepare(`UPDATE late_return_records SET ${setClause} WHERE id = ?`);
  stmt.run(...values, id);
}

export function insertStatusLog(l: {
  record_id: number; from_status: string | null; to_status: string;
  operator_id: string; operator_name: string; operator_role: string; note?: string;
}) {
  const stmt = db.prepare(`
    INSERT INTO status_logs 
    (record_id, from_status, to_status, operator_id, operator_name, operator_role, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);
  const result = stmt.run(l.record_id, l.from_status, l.to_status, l.operator_id, l.operator_name, l.operator_role, l.note || null);
  return Number(result.lastInsertRowid);
}

export function resetData() {
  db.exec('DELETE FROM late_return_records; DELETE FROM status_logs;');
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('late_return_records', 'status_logs');");
}

export function insertStudent(s: { id: string; name: string; student_id: string; dorm_room: string; counselor: string; phone?: string; }) {
  db.prepare('INSERT OR REPLACE INTO students (id, name, student_id, dorm_room, counselor, phone) VALUES (?, ?, ?, ?, ?, ?)').run(s.id, s.name, s.student_id, s.dorm_room, s.counselor, s.phone || null);
}

export function insertUser(u: { id: string; name: string; role: string; }) {
  db.prepare('INSERT OR REPLACE INTO users (id, name, role) VALUES (?, ?, ?)').run(u.id, u.name, u.role);
}

export function insertKey(k: { id: string; student_id: string; key_number: string; status?: string; issued_at?: string; }) {
  db.prepare('INSERT OR REPLACE INTO keys_register (id, student_id, key_number, status, issued_at) VALUES (?, ?, ?, ?, ?)').run(k.id, k.student_id, k.key_number, k.status || '正常', k.issued_at || null);
}

