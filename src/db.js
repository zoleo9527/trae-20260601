const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'dance_exam.db');

let db;

function getDb() {
  if (!db) {
    const fs = require('fs');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initSchema() {
  const d = getDb();

  d.exec(`
    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL DEFAULT 'teacher',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      gender TEXT CHECK(gender IN ('M','F')),
      birth_date TEXT,
      id_card_number TEXT,
      phone TEXT,
      guardian_name TEXT,
      guardian_phone TEXT,
      current_level TEXT,
      teacher_id INTEGER,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (teacher_id) REFERENCES teachers(id)
    );

    CREATE TABLE IF NOT EXISTS exam_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      level TEXT NOT NULL,
      exam_date TEXT NOT NULL,
      registration_deadline TEXT NOT NULL,
      location TEXT,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed','completed')),
      fee REAL NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      exam_session_id INTEGER NOT NULL,
      costume_size TEXT,
      track_name TEXT,
      payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid','paid','refunded')),
      payment_amount REAL DEFAULT 0,
      payment_time TEXT,
      registration_status TEXT NOT NULL DEFAULT 'draft' CHECK(registration_status IN ('draft','submitted','approved','rejected','returned')),
      teacher_confirmed INTEGER NOT NULL DEFAULT 0,
      teacher_confirmed_by INTEGER,
      teacher_confirmed_at TEXT,
      remark TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (exam_session_id) REFERENCES exam_sessions(id),
      FOREIGN KEY (teacher_confirmed_by) REFERENCES teachers(id)
    );

    CREATE TABLE IF NOT EXISTS registration_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      registration_id INTEGER NOT NULL,
      document_type TEXT NOT NULL CHECK(document_type IN ('photo','id_card_copy','previous_certificate','track_video','other')),
      document_value TEXT,
      upload_status TEXT NOT NULL DEFAULT 'pending' CHECK(upload_status IN ('pending','uploaded','verified','rejected')),
      rejection_reason TEXT,
      uploaded_at TEXT,
      verified_at TEXT,
      verified_by INTEGER,
      FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE,
      FOREIGN KEY (verified_by) REFERENCES teachers(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      registration_id INTEGER NOT NULL,
      action TEXT NOT NULL CHECK(action IN ('submit','approve','reject','return','resubmit')),
      operator_id INTEGER,
      operator_role TEXT CHECK(operator_role IN ('admin','teacher','academic','student','parent')),
      comment TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE,
      FOREIGN KEY (operator_id) REFERENCES teachers(id)
    );

    CREATE TABLE IF NOT EXISTS resubmission_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      registration_id INTEGER NOT NULL,
      document_id INTEGER NOT NULL,
      resubmitted_by TEXT NOT NULL CHECK(resubmitted_by IN ('parent','teacher','student')),
      resubmitted_at TEXT DEFAULT (datetime('now','localtime')),
      confirmed_by INTEGER,
      confirmed_at TEXT,
      note TEXT,
      FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE,
      FOREIGN KEY (document_id) REFERENCES registration_documents(id) ON DELETE CASCADE,
      FOREIGN KEY (confirmed_by) REFERENCES teachers(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      registration_id INTEGER,
      type TEXT NOT NULL CHECK(type IN ('material_missing','deadline_approaching','audit_returned','payment_reminder','general')),
      content TEXT NOT NULL,
      sent_to TEXT NOT NULL,
      sent_at TEXT DEFAULT (datetime('now','localtime')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sent','read')),
      FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE
    );
  `);
}

function seedData() {
  const d = getDb();

  const count = d.prepare('SELECT COUNT(*) as cnt FROM teachers').get();
  if (count.cnt > 0) return;

  const insertTeacher = d.prepare(
    `INSERT INTO teachers (name, phone, role) VALUES (?, ?, ?)`
  );
  const t1 = insertTeacher.run('王芳', '13800001111', 'academic');
  const t2 = insertTeacher.run('李明', '13800002222', 'teacher');
  const t3 = insertTeacher.run('赵红', '13800003333', 'teacher');
  const t4 = insertTeacher.run('陈校长', '13800004444', 'admin');

  const insertStudent = d.prepare(
    `INSERT INTO students (name, gender, birth_date, id_card_number, phone, guardian_name, guardian_phone, current_level, teacher_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const s1 = insertStudent.run('张小梅', 'F', '2012-03-15', '110101201203150024', '13900001111', '张大伟', '13900001112', '三级', t2.lastInsertRowid);
  const s2 = insertStudent.run('刘思雨', 'F', '2013-07-22', '110101201307220048', '13900002221', '刘建国', '13900002222', '二级', t2.lastInsertRowid);
  const s3 = insertStudent.run('王浩然', 'M', '2011-11-08', '110101201111080031', '13900003331', '王丽华', '13900003332', '四级', t3.lastInsertRowid);
  const s4 = insertStudent.run('陈诗涵', 'F', '2014-01-30', '110101201401300065', '13900004441', '陈志强', '13900004442', '一级', t3.lastInsertRowid);
  const s5 = insertStudent.run('周天乐', 'M', '2012-09-12', '110101201209120017', '13900005551', '周敏', '13900005552', '三级', t2.lastInsertRowid);
  const s6 = insertStudent.run('孙雨萱', 'F', '2013-05-20', '110101201305200089', '13900006661', '孙建军', '13900006662', '二级', t3.lastInsertRowid);
  const s7 = insertStudent.run('吴子轩', 'M', '2011-08-03', '11010120110803005X', '13900007771', '吴静', '13900007772', '四级', t2.lastInsertRowid);
  const s8 = insertStudent.run('郑梦瑶', 'F', '2012-12-01', '', '13900008881', '郑建国', '13900008882', '三级', t2.lastInsertRowid);
  const s9 = insertStudent.run('冯俊杰', 'M', '2013-03-10', '110101201303100029', '13900009991', '冯晓华', '13900009992', '二级', t3.lastInsertRowid);
  const s10 = insertStudent.run('韩雨桐', 'F', '2011-06-25', '110101201106250083', '13900010001', '韩梅', '13900010002', '四级', t2.lastInsertRowid);

  const insertExam = d.prepare(
    `INSERT INTO exam_sessions (name, level, exam_date, registration_deadline, location, status, fee) VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const e1 = insertExam.run('2026年夏季中国舞考级', '四级', '2026-07-20', '2026-06-25', '本中心A教室', 'open', 380);
  const e2 = insertExam.run('2026年夏季中国舞考级', '三级', '2026-07-21', '2026-06-25', '本中心A教室', 'open', 350);
  const e3 = insertExam.run('2026年夏季中国舞考级', '二级', '2026-07-22', '2026-06-25', '本中心B教室', 'open', 320);

  const insertReg = d.prepare(
    `INSERT INTO registrations (student_id, exam_session_id, costume_size, track_name, payment_status, payment_amount, payment_time, registration_status, teacher_confirmed, teacher_confirmed_by, teacher_confirmed_at, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const r1 = insertReg.run(s1.lastInsertRowid, e1.lastInsertRowid, 'M', '《春晓》', 'paid', 380, '2026-06-10 09:30:00', 'submitted', 1, t2.lastInsertRowid, '2026-06-09 14:00:00', null);
  const r2 = insertReg.run(s2.lastInsertRowid, e3.lastInsertRowid, 'S', '《茉莉花》', 'paid', 320, '2026-06-11 15:20:00', 'returned', 1, t2.lastInsertRowid, '2026-06-10 10:00:00', '照片不合格被退回');
  const r3 = insertReg.run(s3.lastInsertRowid, e1.lastInsertRowid, 'L', '《少年行》', 'unpaid', 0, null, 'submitted', 1, t3.lastInsertRowid, '2026-06-11 09:00:00', null);
  const r4 = insertReg.run(s4.lastInsertRowid, e3.lastInsertRowid, 'XS', '《小星星》', 'paid', 320, '2026-06-12 11:00:00', 'submitted', 0, null, null, null);
  const r5 = insertReg.run(s5.lastInsertRowid, e2.lastInsertRowid, 'M', '《渔舟唱晚》', 'paid', 350, '2026-06-08 16:45:00', 'submitted', 1, t2.lastInsertRowid, '2026-06-08 11:30:00', '跨级报考：当前三级报三级需确认');
  const r6 = insertReg.run(s6.lastInsertRowid, e1.lastInsertRowid, 'S', '《彩云追月》', 'paid', 380, '2026-06-13 08:10:00', 'returned', 1, t3.lastInsertRowid, '2026-06-12 15:00:00', '身份证号与系统不一致');
  const r7 = insertReg.run(s7.lastInsertRowid, e1.lastInsertRowid, 'L', '《将进酒》', 'paid', 380, '2026-06-09 10:00:00', 'submitted', 0, null, null, null);
  const r8 = insertReg.run(s8.lastInsertRowid, e2.lastInsertRowid, 'M', '《兰亭序》', 'paid', 350, '2026-06-13 14:00:00', 'submitted', 1, t2.lastInsertRowid, '2026-06-13 10:00:00', '身份证号缺失');
  const r9 = insertReg.run(s9.lastInsertRowid, e3.lastInsertRowid, 'S', null, 'paid', 320, '2026-06-12 17:00:00', 'submitted', 1, t3.lastInsertRowid, '2026-06-12 15:00:00', '曲目未确定');
  const r10 = insertReg.run(s10.lastInsertRowid, e1.lastInsertRowid, null, '《满江红》', 'paid', 380, '2026-06-11 12:00:00', 'submitted', 1, t2.lastInsertRowid, '2026-06-11 10:00:00', '服装尺码待确认');

  const insertDoc = d.prepare(
    `INSERT INTO registration_documents (registration_id, document_type, document_value, upload_status, rejection_reason, uploaded_at, verified_at, verified_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  insertDoc.run(r1.lastInsertRowid, 'photo', 'zhang_xiaomei_photo.jpg', 'verified', null, '2026-06-10 08:00:00', '2026-06-10 10:00:00', t1.lastInsertRowid);
  insertDoc.run(r1.lastInsertRowid, 'id_card_copy', 'zhang_xiaomei_id.jpg', 'verified', null, '2026-06-10 08:01:00', '2026-06-10 10:01:00', t1.lastInsertRowid);
  insertDoc.run(r1.lastInsertRowid, 'previous_certificate', 'zhang_xiaomei_cert.jpg', 'verified', null, '2026-06-10 08:02:00', '2026-06-10 10:02:00', t1.lastInsertRowid);

  insertDoc.run(r2.lastInsertRowid, 'photo', 'liu_siyu_photo_old.jpg', 'rejected', '照片背景非白底，请重新拍摄白底证件照', '2026-06-11 10:00:00', '2026-06-12 09:00:00', t1.lastInsertRowid);
  insertDoc.run(r2.lastInsertRowid, 'id_card_copy', 'liu_siyu_id.jpg', 'verified', null, '2026-06-11 10:01:00', '2026-06-12 09:01:00', t1.lastInsertRowid);
  insertDoc.run(r2.lastInsertRowid, 'previous_certificate', 'liu_siyu_cert.jpg', 'verified', null, '2026-06-11 10:02:00', '2026-06-12 09:02:00', t1.lastInsertRowid);

  insertDoc.run(r3.lastInsertRowid, 'photo', 'wang_haoran_photo.jpg', 'uploaded', null, '2026-06-12 14:00:00', null, null);
  insertDoc.run(r3.lastInsertRowid, 'id_card_copy', 'wang_haoran_id.jpg', 'uploaded', null, '2026-06-12 14:01:00', null, null);
  insertDoc.run(r3.lastInsertRowid, 'previous_certificate', null, 'pending', null, null, null, null);

  insertDoc.run(r4.lastInsertRowid, 'photo', 'chen_shihan_photo.jpg', 'uploaded', null, '2026-06-12 16:00:00', null, null);
  insertDoc.run(r4.lastInsertRowid, 'id_card_copy', null, 'pending', null, null, null, null);
  insertDoc.run(r4.lastInsertRowid, 'previous_certificate', null, 'pending', null, null, null, null);

  insertDoc.run(r5.lastInsertRowid, 'photo', 'zhou_tianle_photo.jpg', 'verified', null, '2026-06-08 09:00:00', '2026-06-09 08:00:00', t1.lastInsertRowid);
  insertDoc.run(r5.lastInsertRowid, 'id_card_copy', 'zhou_tianle_id.jpg', 'verified', null, '2026-06-08 09:01:00', '2026-06-09 08:01:00', t1.lastInsertRowid);
  insertDoc.run(r5.lastInsertRowid, 'previous_certificate', 'zhou_tianle_cert.jpg', 'verified', null, '2026-06-08 09:02:00', '2026-06-09 08:02:00', t1.lastInsertRowid);

  insertDoc.run(r6.lastInsertRowid, 'photo', 'sun_yuxuan_photo.jpg', 'rejected', '身份证号与系统登记不一致，请核实后重新上传', '2026-06-13 07:00:00', '2026-06-13 10:00:00', t1.lastInsertRowid);
  insertDoc.run(r6.lastInsertRowid, 'id_card_copy', 'sun_yuxuan_id.jpg', 'rejected', '身份证复印件模糊，请重新上传清晰原件', '2026-06-13 07:01:00', '2026-06-13 10:01:00', t1.lastInsertRowid);
  insertDoc.run(r6.lastInsertRowid, 'previous_certificate', 'sun_yuxuan_cert.jpg', 'verified', null, '2026-06-13 07:02:00', '2026-06-13 10:02:00', t1.lastInsertRowid);

  insertDoc.run(r7.lastInsertRowid, 'photo', 'wu_zixuan_photo.jpg', 'uploaded', null, '2026-06-09 08:30:00', null, null);
  insertDoc.run(r7.lastInsertRowid, 'id_card_copy', 'wu_zixuan_id.jpg', 'uploaded', null, '2026-06-09 08:31:00', null, null);
  insertDoc.run(r7.lastInsertRowid, 'previous_certificate', null, 'pending', null, null, null, null);

  insertDoc.run(r8.lastInsertRowid, 'photo', 'zheng_mengyao_photo.jpg', 'verified', null, '2026-06-13 11:00:00', '2026-06-13 15:00:00', t1.lastInsertRowid);
  insertDoc.run(r8.lastInsertRowid, 'id_card_copy', 'zheng_mengyao_id.jpg', 'verified', null, '2026-06-13 11:01:00', '2026-06-13 15:01:00', t1.lastInsertRowid);
  insertDoc.run(r8.lastInsertRowid, 'previous_certificate', 'zheng_mengyao_cert.jpg', 'verified', null, '2026-06-13 11:02:00', '2026-06-13 15:02:00', t1.lastInsertRowid);

  insertDoc.run(r9.lastInsertRowid, 'photo', 'feng_junjie_photo.jpg', 'verified', null, '2026-06-12 16:00:00', '2026-06-13 09:00:00', t1.lastInsertRowid);
  insertDoc.run(r9.lastInsertRowid, 'id_card_copy', 'feng_junjie_id.jpg', 'verified', null, '2026-06-12 16:01:00', '2026-06-13 09:01:00', t1.lastInsertRowid);
  insertDoc.run(r9.lastInsertRowid, 'previous_certificate', 'feng_junjie_cert.jpg', 'verified', null, '2026-06-12 16:02:00', '2026-06-13 09:02:00', t1.lastInsertRowid);

  insertDoc.run(r10.lastInsertRowid, 'photo', 'han_yutong_photo.jpg', 'verified', null, '2026-06-11 13:00:00', '2026-06-12 10:00:00', t1.lastInsertRowid);
  insertDoc.run(r10.lastInsertRowid, 'id_card_copy', 'han_yutong_id.jpg', 'verified', null, '2026-06-11 13:01:00', '2026-06-12 10:01:00', t1.lastInsertRowid);
  insertDoc.run(r10.lastInsertRowid, 'previous_certificate', 'han_yutong_cert.jpg', 'verified', null, '2026-06-11 13:02:00', '2026-06-12 10:02:00', t1.lastInsertRowid);

  const insertAudit = d.prepare(
    `INSERT INTO audit_logs (registration_id, action, operator_id, operator_role, comment, created_at) VALUES (?, ?, ?, ?, ?, ?)`
  );

  insertAudit.run(r1.lastInsertRowid, 'submit', t2.lastInsertRowid, 'teacher', '任课老师确认提交', '2026-06-10 09:00:00');
  insertAudit.run(r2.lastInsertRowid, 'submit', t2.lastInsertRowid, 'teacher', '任课老师确认提交', '2026-06-11 14:00:00');
  insertAudit.run(r2.lastInsertRowid, 'return', t1.lastInsertRowid, 'academic', '照片背景非白底，请重新拍摄白底证件照', '2026-06-12 09:00:00');
  insertAudit.run(r3.lastInsertRowid, 'submit', t3.lastInsertRowid, 'teacher', '任课老师确认提交', '2026-06-12 10:00:00');
  insertAudit.run(r5.lastInsertRowid, 'submit', t2.lastInsertRowid, 'teacher', '跨级报考确认提交', '2026-06-08 11:30:00');
  insertAudit.run(r6.lastInsertRowid, 'submit', t3.lastInsertRowid, 'teacher', '任课老师确认提交', '2026-06-13 08:00:00');
  insertAudit.run(r6.lastInsertRowid, 'return', t1.lastInsertRowid, 'academic', '身份证号与系统登记不一致', '2026-06-13 10:00:00');
  insertAudit.run(r7.lastInsertRowid, 'submit', null, 'student', '家长自行提交，待任课老师确认', '2026-06-09 09:00:00');
  insertAudit.run(r8.lastInsertRowid, 'submit', t2.lastInsertRowid, 'teacher', '任课老师确认提交，注意：学员身份证号缺失', '2026-06-13 10:00:00');
  insertAudit.run(r9.lastInsertRowid, 'submit', t3.lastInsertRowid, 'teacher', '任课老师确认提交，注意：曲目待定', '2026-06-12 15:00:00');
  insertAudit.run(r10.lastInsertRowid, 'submit', t2.lastInsertRowid, 'teacher', '任课老师确认提交，注意：服装尺码待确认', '2026-06-11 10:00:00');

  const insertResub = d.prepare(
    `INSERT INTO resubmission_logs (registration_id, document_id, resubmitted_by, resubmitted_at, confirmed_by, confirmed_at, note) VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  insertResub.run(r2.lastInsertRowid, 4, 'parent', '2026-06-12 16:00:00', null, null, '家长重新上传了白底证件照，待确认');

  const insertNotif = d.prepare(
    `INSERT INTO notifications (registration_id, type, content, sent_to, sent_at, status) VALUES (?, ?, ?, ?, ?, ?)`
  );
  insertNotif.run(r2.lastInsertRowid, 'audit_returned', '您的考级报名资料被退回，原因：照片背景非白底，请重新拍摄白底证件照', '13900002221', '2026-06-12 09:05:00', 'sent');
  insertNotif.run(r3.lastInsertRowid, 'material_missing', '您有资料未上传：上一级证书，请尽快补充', '13900003331', '2026-06-13 08:00:00', 'sent');
  insertNotif.run(r3.lastInsertRowid, 'payment_reminder', '您尚未缴费，请尽快完成缴费，截止日期2026-06-25', '13900003331', '2026-06-14 08:00:00', 'pending');
  insertNotif.run(r4.lastInsertRowid, 'material_missing', '您有2项资料未上传：身份证复印件、上一级证书，请尽快补充', '13900004441', '2026-06-13 08:00:00', 'sent');
  insertNotif.run(r6.lastInsertRowid, 'audit_returned', '您的考级报名资料被退回，原因：身份证号与系统登记不一致，请核实后重新上传', '13900006661', '2026-06-13 10:05:00', 'sent');
  insertNotif.run(r7.lastInsertRowid, 'material_missing', '您有1项资料未上传：上一级证书，请尽快补充', '13900007771', '2026-06-14 08:00:00', 'pending');
  insertNotif.run(r8.lastInsertRowid, 'material_missing', '您的身份证号尚未登记，请尽快补充身份证号', '13900008881', '2026-06-14 08:00:00', 'pending');
  insertNotif.run(r9.lastInsertRowid, 'material_missing', '考级曲目尚未确定，请尽快联系任课老师确认曲目', '13900009991', '2026-06-14 08:00:00', 'pending');
  insertNotif.run(r10.lastInsertRowid, 'material_missing', '服装尺码尚未确认，请尽快补充服装尺码', '13900010001', '2026-06-14 08:00:00', 'pending');

  console.log('种子数据初始化完成');
}

function init() {
  initSchema();
  seedData();
  console.log('数据库初始化完成');
}

module.exports = { getDb, init, initSchema, seedData };

if (require.main === module) {
  init();
}
