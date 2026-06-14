const { initDB, getDB, tx, newId } = require('../src/db');

initDB();
const db = getDB();

const seed = () => {
  db.exec(`
    DELETE FROM notifications;
    DELETE FROM registration_timeline;
    DELETE FROM admission_tickets;
    DELETE FROM invigilator_assignments;
    DELETE FROM registrations;
    DELETE FROM exam_rooms;
    DELETE FROM users;
  `);

  const admin1 = newId();
  const admin2 = newId();
  const invigilator1 = newId();
  const invigilator2 = newId();
  const tech1 = newId();
  const tech2 = newId();

  const insertUser = db.prepare(`
    INSERT INTO users (id, username, name, role) VALUES (?, ?, ?, ?)
  `);
  insertUser.run(admin1, 'admin_wang', '王考务', 'admin_staff');
  insertUser.run(admin2, 'admin_li', '李专员', 'admin_staff');
  insertUser.run(invigilator1, 'inv_zhang', '张监考', 'invigilator');
  insertUser.run(invigilator2, 'inv_zhao', '赵老师', 'invigilator');
  insertUser.run(tech1, 'tech_chen', '陈工', 'tech_support');
  insertUser.run(tech2, 'tech_sun', '孙支持', 'tech_support');

  const room1 = newId();
  const room2 = newId();
  const room3 = newId();
  const insertRoom = db.prepare(`
    INSERT INTO exam_rooms (id, room_code, building, capacity, exam_time) VALUES (?, ?, ?, ?, ?)
  `);
  insertRoom.run(room1, 'A101', '第一教学楼', 30, '2026-07-01 09:00');
  insertRoom.run(room2, 'A102', '第一教学楼', 30, '2026-07-01 09:00');
  insertRoom.run(room3, 'B201', '第二教学楼', 25, '2026-07-01 14:00');

  const insertAssign = db.prepare(`
    INSERT INTO invigilator_assignments (id, exam_room_id, invigilator_id) VALUES (?, ?, ?)
  `);
  insertAssign.run(newId(), room1, invigilator1);
  insertAssign.run(newId(), room2, invigilator2);
  insertAssign.run(newId(), room3, invigilator1);

  const candidates = [
    ['张明', '110101199001011234', '计算机二级', '13800138001', 'zhangming@example.com', 'pending', null, null, null, null, null, null, null, null, '2026-06-14 12:22:19'],
    ['李华', '110101199502022345', '计算机二级', '13800138002', 'lihua@example.com', 'pending', null, null, null, null, null, null, null, null, '2026-06-10 10:00:00'],
    ['王芳', '110101199803033456', '英语四级', '13800138003', 'wangfang@example.com', 'pending', null, null, null, null, null, null, null, null, '2026-06-14 12:22:19'],
    ['赵强', '110101199204044567', '英语六级', '13800138004', 'zhaoqiang@example.com', 'approved', admin1, '2026-06-08 14:20:00', null, null, null, null, invigilator1, null, '2026-06-08 10:00:00'],
    ['刘洋', '110101199705055678', '计算机二级', '13800138005', null, 'rejected', admin2, '2026-06-07 09:15:00', '身份证照片模糊不清，请重新上传清晰的证件照。', null, null, tech1, null, null, '2026-06-07 08:00:00'],
    ['陈静', '110101199306066789', '英语四级', '13800138006', 'chenjing@example.com', 'pending_review', admin2, '2026-06-05 11:00:00', '报名照片与身份证照片不匹配，请重新上传近照。', '已重新拍摄并上传符合要求的照片，请核验。', '2026-06-06 15:30:00', tech1, tech1, null, '2026-06-05 08:30:00'],
    ['周磊', '110101199607077890', '计算机二级', '13800138007', null, 'pending', null, null, null, null, null, null, null, null, '2026-06-14 12:22:19'],
  ];
  const insertReg = db.prepare(`
    INSERT INTO registrations
    (id, candidate_name, id_card, exam_type, phone, email, status, auditor_id, audit_time, reject_reason, supplement_remark, supplement_time, handler_id, supplement_by, assigned_invigilator_id, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now')))
  `);
  candidates.forEach(row => insertReg.run(newId(), ...row));

  const timelines = [];
  const regChen = db.prepare("SELECT id, submitted_at FROM registrations WHERE candidate_name = '陈静'").get();
  if (regChen) {
    timelines.push([regChen.id, 'submit', null, null, `考生提交报名申请`, regChen.submitted_at]);
    timelines.push([regChen.id, 'reject', admin2, 'admin_staff', `审核退回：报名照片与身份证照片不匹配，请重新上传近照。`, '2026-06-05 11:00:00']);
    timelines.push([regChen.id, 'supplement_done', tech1, 'tech_support', `补正完成，标记待复审。处理说明：已重新拍摄并上传符合要求的照片，请核验。`, '2026-06-06 15:30:00']);
  }
  const regLiu = db.prepare("SELECT id, submitted_at FROM registrations WHERE candidate_name = '刘洋'").get();
  if (regLiu) {
    timelines.push([regLiu.id, 'submit', null, null, `考生提交报名申请`, regLiu.submitted_at]);
    timelines.push([regLiu.id, 'reject', admin2, 'admin_staff', `审核退回：身份证照片模糊不清，请重新上传清晰的证件照。`, '2026-06-07 09:15:00']);
  }
  const insertTl = db.prepare(`
    INSERT INTO registration_timeline (id, registration_id, action_type, operator_id, operator_role, detail, created_at)
    VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now')))
  `);
  timelines.forEach(t => insertTl.run(newId(), ...t));

  const notifications = [];
  if (regChen) {
    const admins = db.prepare("SELECT id, username FROM users WHERE role = 'admin_staff'").all();
    admins.forEach(a => notifications.push([a.id, 'admin_staff', regChen.id, '补正完成，待复审接回', `考生 陈静 已由 陈工 完成补正，请及时复审（已重新拍摄并上传符合要求的照片，请核验。）`, 'supplement_done']));
  }
  if (regLiu) {
    notifications.push([tech1, 'tech_support', regLiu.id, '您有新的报名退回补正任务', `考生 刘洋 报名被退回，原因：身份证照片模糊不清，请重新上传清晰的证件照。`, 'audit_reject']);
  }
  const insertNotif = db.prepare(`
    INSERT INTO notifications (id, user_id, user_role, registration_id, title, content, type)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  notifications.forEach(n => insertNotif.run(newId(), ...n));
};

db.transaction(seed)();

console.log('✅ 种子数据已创建完成：');
console.log('  用户：2 考务专员（王考务、李专员）');
console.log('        2 监考老师（张监考、赵老师）');
console.log('        2 技术支持（陈工、孙支持）');
console.log('  考场：A101（30人，监考：张监考）、A102（30人，监考：赵老师）、B201（25人，监考：张监考）');
console.log('  报名：7 条（4个状态全覆盖）');
console.log('    - 赵强 已通过，负责监考：张监考');
console.log('    - 刘洋 已退回，处理归属：陈工');
console.log('    - 陈静 补正完成待复审，补正处理人：陈工（考务待办已初始化）');
console.log('');
console.log('  使用示例用户ID（用于请求头 X-User-Id）：');
const users = db.prepare('SELECT id, username, name, role FROM users ORDER BY role').all();
users.forEach(u => console.log(`    ${u.role.padEnd(14)} ${u.id}  →  ${u.name}（${u.username}）`));
