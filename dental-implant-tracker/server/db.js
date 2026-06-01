import Database from 'better-sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'dental.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('frontdesk', 'doctor', 'warehouse')),
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    gender TEXT,
    age INTEGER,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS treatment_nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    node_type TEXT NOT NULL CHECK(node_type IN ('film', 'consultation', 'surgery1', 'suture_removal', 'surgery2', 'crown')),
    planned_date TEXT NOT NULL,
    actual_date TEXT,
    status TEXT NOT NULL DEFAULT 'planned' CHECK(status IN ('planned', 'completed', 'cancelled', 'rescheduled')),
    notes TEXT,
    doctor_id INTEGER,
    consumable_id INTEGER,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES users(id),
    FOREIGN KEY (consumable_id) REFERENCES consumables(id)
  );

  CREATE TABLE IF NOT EXISTS consumables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    model TEXT,
    batch_no TEXT,
    category TEXT NOT NULL CHECK(category IN ('implant', 'abutment', 'crown', 'tool')),
    stock_qty INTEGER NOT NULL DEFAULT 0,
    locked_qty INTEGER NOT NULL DEFAULT 0,
    used_qty INTEGER NOT NULL DEFAULT 0,
    unit TEXT DEFAULT '个',
    status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'locked', 'used', 'expired')),
    location TEXT,
    patient_id INTEGER,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (patient_id) REFERENCES patients(id)
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER,
    type TEXT NOT NULL CHECK(type IN ('reschedule', 'consumable_change', 'missed_followup')),
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (patient_id) REFERENCES patients(id)
  );

  CREATE TABLE IF NOT EXISTS operation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    user_name TEXT,
    user_role TEXT,
    action TEXT NOT NULL,
    detail TEXT,
    patient_id INTEGER,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id)
  );
`);

const invalidDoctors = db.prepare(`
  SELECT tn.id, tn.doctor_id, u.name as user_name, u.role
  FROM treatment_nodes tn
  JOIN users u ON tn.doctor_id = u.id
  WHERE u.role != 'doctor'
`).all();

if (invalidDoctors.length > 0) {
  const fixStmt = db.prepare('UPDATE treatment_nodes SET doctor_id = NULL WHERE id = ?');
  const logStmt = db.prepare(`
    INSERT INTO operation_logs (user_id, user_name, user_role, action, detail, patient_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const systemUser = db.prepare("SELECT id FROM users WHERE role = 'doctor' ORDER BY id LIMIT 1").get();
  const systemUserId = systemUser ? systemUser.id : null;
  for (const node of invalidDoctors) {
    fixStmt.run(node.id);
    const patient = db.prepare('SELECT id, name FROM patients WHERE id = (SELECT patient_id FROM treatment_nodes WHERE id = ?)').get(node.id);
    logStmt.run(
      systemUserId,
      'system',
      'system',
      '数据修复',
      `清理无效负责医生：节点ID ${node.id} 的 doctor_id=${node.doctor_id}（${node.user_name}，角色：${node.role}）不是医生角色，已置空`,
      patient ? patient.id : null
    );
  }
  console.log(`数据修复完成：已清理 ${invalidDoctors.length} 条非医生角色的 doctor_id 记录`);
}

const orphanedUsed = db.prepare(`
  SELECT c.id, c.name, c.status
  FROM consumables c
  WHERE c.patient_id IS NULL AND c.status IN ('used', 'locked')
`).all();

if (orphanedUsed.length > 0) {
  let restored = 0;
  const systemUser = db.prepare("SELECT id FROM users WHERE role = 'doctor' ORDER BY id LIMIT 1").get();
  const systemUserId = systemUser ? systemUser.id : null;
  for (const item of orphanedUsed) {
    const lockLog = db.prepare(`
      SELECT patient_id FROM operation_logs
      WHERE action = '锁定耗材' AND detail LIKE ? AND patient_id IS NOT NULL
      ORDER BY created_at DESC LIMIT 1
    `).get(`%${item.name}%`);
    if (lockLog && lockLog.patient_id) {
      db.prepare('UPDATE consumables SET patient_id = ? WHERE id = ?').run(lockLog.patient_id, item.id);
      db.prepare(`
        INSERT INTO operation_logs (user_id, user_name, user_role, action, detail, patient_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        systemUserId, 'system', 'system', '数据修复',
        `恢复耗材患者归属：耗材ID ${item.id}（${item.name}，状态：${item.status}）的 patient_id 从操作日志恢复为 ${lockLog.patient_id}`,
        lockLog.patient_id
      );
      restored++;
    }
  }
  console.log(`耗材归属修复完成：已恢复 ${restored}/${orphanedUsed.length} 条已使用/已锁定耗材的 patient_id`);
}

export function logOperation(user, action, detail, patientId) {
  const stmt = db.prepare(`
    INSERT INTO operation_logs (user_id, user_name, user_role, action, detail, patient_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(user.id, user.name, user.role, action, detail, patientId || null);
}

export default db;
