const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

function newId() { return uuidv4().replace(/-/g, '').slice(0, 24); }

const DB_PATH = path.join(__dirname, '..', 'data', 'old-schema.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin_staff', 'invigilator', 'tech_support')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS exam_rooms (
    id TEXT PRIMARY KEY,
    room_code TEXT UNIQUE NOT NULL,
    building TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 30,
    exam_time TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS invigilator_assignments (
    id TEXT PRIMARY KEY,
    exam_room_id TEXT NOT NULL,
    invigilator_id TEXT NOT NULL,
    assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (exam_room_id) REFERENCES exam_rooms(id),
    FOREIGN KEY (invigilator_id) REFERENCES users(id),
    UNIQUE(exam_room_id, invigilator_id)
  );

  CREATE TABLE IF NOT EXISTS registrations (
    id TEXT PRIMARY KEY,
    candidate_name TEXT NOT NULL,
    id_card TEXT NOT NULL,
    exam_type TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'pending_review')),
    auditor_id TEXT,
    audit_time TEXT,
    reject_reason TEXT,
    submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (auditor_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS registration_timeline (
    id TEXT PRIMARY KEY,
    registration_id TEXT NOT NULL,
    action_type TEXT NOT NULL,
    operator_id TEXT,
    operator_role TEXT,
    detail TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE,
    FOREIGN KEY (operator_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS admission_tickets (
    id TEXT PRIMARY KEY,
    registration_id TEXT UNIQUE NOT NULL,
    ticket_no TEXT UNIQUE NOT NULL,
    exam_room_id TEXT,
    seat_no INTEGER,
    generated_by TEXT NOT NULL,
    generated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (registration_id) REFERENCES registrations(id),
    FOREIGN KEY (exam_room_id) REFERENCES exam_rooms(id),
    FOREIGN KEY (generated_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_role TEXT NOT NULL,
    registration_id TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

const admin1 = newId(), admin2 = newId();
const inv1 = newId(), inv2 = newId();
const tech1 = newId(), tech2 = newId();
const room1 = newId(), room2 = newId(), room3 = newId();

const insertUser = db.prepare('INSERT INTO users (id, username, name, role) VALUES (?, ?, ?, ?)');
insertUser.run(admin1, 'admin_wang', '王考务', 'admin_staff');
insertUser.run(admin2, 'admin_li', '李专员', 'admin_staff');
insertUser.run(inv1, 'inv_zhang', '张监考', 'invigilator');
insertUser.run(inv2, 'inv_zhao', '赵老师', 'invigilator');
insertUser.run(tech1, 'tech_chen', '陈工', 'tech_support');
insertUser.run(tech2, 'tech_sun', '孙支持', 'tech_support');

const insertRoom = db.prepare('INSERT INTO exam_rooms (id, room_code, building, capacity, exam_time) VALUES (?, ?, ?, ?, ?)');
insertRoom.run(room1, 'A101', '一号楼', 30, '2026-07-01 09:00:00');
insertRoom.run(room2, 'A102', '一号楼', 30, '2026-07-01 09:00:00');
insertRoom.run(room3, 'B201', '二号楼', 25, '2026-07-01 14:00:00');

const insertAssign = db.prepare('INSERT INTO invigilator_assignments (id, exam_room_id, invigilator_id) VALUES (?, ?, ?)');
insertAssign.run(newId(), room1, inv1);
insertAssign.run(newId(), room2, inv2);
insertAssign.run(newId(), room3, inv1);

const insertReg = db.prepare(`
  INSERT INTO registrations (id, candidate_name, id_card, exam_type, phone, email, status, auditor_id, audit_time, reject_reason, submitted_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const reg1 = newId(), reg2 = newId(), reg3 = newId();
insertReg.run(reg1, '旧版待审核', '110101199001010001', '计算机二级', '13800000001', 'old1@example.com', 'pending', null, null, null, '2026-06-01 10:00:00');
insertReg.run(reg2, '旧版已通过', '110101199001010002', '英语四级', '13800000002', 'old2@example.com', 'approved', admin1, '2026-06-02 10:00:00', null, '2026-06-01 11:00:00');
insertReg.run(reg3, '旧版已退回', '110101199001010003', '英语六级', '13800000003', null, 'rejected', admin1, '2026-06-03 10:00:00', '信息不全，请补全材料', '2026-06-01 12:00:00');

console.log('✅ 旧版数据库已创建：', DB_PATH);
console.log('   registrations 表列（旧版）：');
db.prepare('PRAGMA table_info(registrations)').all().forEach(c => console.log(`     - ${c.name} (${c.type})`));
console.log('   报名记录数：', db.prepare('SELECT COUNT(*) AS c FROM registrations').get().c);

db.close();
