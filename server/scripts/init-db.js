const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const dayjs = require('dayjs');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'rescue.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('开始初始化数据库...');

db.pragma('foreign_keys = OFF');

db.exec(`
  DROP TABLE IF EXISTS notifications;
  DROP TABLE IF EXISTS attachments;
  DROP TABLE IF EXISTS shift_handovers;
  DROP TABLE IF EXISTS recall_records;
  DROP TABLE IF EXISTS visit_records;
  DROP TABLE IF EXISTS adoption_records;
  DROP TABLE IF EXISTS foster_records;
  DROP TABLE IF EXISTS animals;
  DROP TABLE IF EXISTS users;
`);

db.pragma('foreign_keys = ON');

console.log('创建表结构...');

db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('volunteer', 'vet', 'adoption_officer', 'admin')),
    name TEXT NOT NULL,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE animals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    species TEXT NOT NULL,
    breed TEXT,
    age INTEGER,
    gender TEXT CHECK(gender IN ('male', 'female', 'unknown')),
    rescue_date DATETIME,
    rescue_location TEXT,
    status TEXT NOT NULL CHECK(status IN ('rescued', 'fostered', 'adopted', 'recalled')) DEFAULT 'rescued',
    description TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE foster_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER NOT NULL,
    foster_user_name TEXT NOT NULL,
    foster_phone TEXT,
    foster_address TEXT,
    start_date DATETIME NOT NULL,
    end_date DATETIME,
    status TEXT NOT NULL CHECK(status IN ('active', 'ended')) DEFAULT 'active',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animals(id)
  );

  CREATE TABLE adoption_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER NOT NULL,
    adopter_name TEXT NOT NULL,
    adopter_phone TEXT,
    adopter_address TEXT,
    adopt_date DATETIME,
    reviewer_id INTEGER,
    status TEXT NOT NULL CHECK(status IN ('pending_review', 'approved', 'rejected')) DEFAULT 'pending_review',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animals(id),
    FOREIGN KEY (reviewer_id) REFERENCES users(id)
  );

  CREATE TABLE visit_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER NOT NULL,
    adoption_id INTEGER,
    visit_date DATETIME NOT NULL,
    visitor_id INTEGER,
    visitor_role TEXT,
    health_status TEXT,
    behavior_status TEXT,
    environment_status TEXT,
    notes TEXT,
    status TEXT NOT NULL CHECK(status IN ('pending', 'completed', 'need_followup', 'transferred_to_recall')) DEFAULT 'pending',
    recall_id INTEGER,
    next_visit_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animals(id),
    FOREIGN KEY (adoption_id) REFERENCES adoption_records(id),
    FOREIGN KEY (visitor_id) REFERENCES users(id),
    FOREIGN KEY (recall_id) REFERENCES recall_records(id)
  );

  CREATE TABLE recall_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER NOT NULL,
    source_visit_id INTEGER,
    reason TEXT NOT NULL,
    report_date DATETIME NOT NULL,
    reporter_id INTEGER,
    reporter_role TEXT,
    status TEXT NOT NULL CHECK(status IN ('initiated', 'reviewing', 'executing', 'recalled', 'closed')) DEFAULT 'initiated',
    handler_id INTEGER,
    handler_role TEXT,
    resolution TEXT,
    resolved_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animals(id),
    FOREIGN KEY (source_visit_id) REFERENCES visit_records(id),
    FOREIGN KEY (reporter_id) REFERENCES users(id),
    FOREIGN KEY (handler_id) REFERENCES users(id)
  );

  CREATE TABLE attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL CHECK(entity_type IN ('animal', 'visit', 'recall', 'handover')),
    entity_id INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    uploaded_by INTEGER,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
  );

  CREATE TABLE shift_handovers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_user_id INTEGER NOT NULL,
    to_user_id INTEGER NOT NULL,
    handover_date DATETIME NOT NULL,
    pending_visits INTEGER DEFAULT 0,
    active_recalls INTEGER DEFAULT 0,
    summary TEXT,
    key_notes TEXT,
    visit_ids TEXT,
    recall_ids TEXT,
    status TEXT NOT NULL CHECK(status IN ('pending', 'confirmed')) DEFAULT 'pending',
    confirmed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_user_id) REFERENCES users(id),
    FOREIGN KEY (to_user_id) REFERENCES users(id)
  );

  CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    type TEXT NOT NULL CHECK(type IN ('visit', 'recall', 'handover', 'system')),
    related_id INTEGER,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

console.log('插入种子数据...');

const passwordHash = bcrypt.hashSync('123456', 10);
const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

const insertUser = db.prepare(`
  INSERT INTO users (username, password_hash, role, name, phone, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const users = [
  { username: 'volunteer1', role: 'volunteer', name: '张志愿', phone: '13800138001' },
  { username: 'volunteer2', role: 'volunteer', name: '刘志愿', phone: '13800138004' },
  { username: 'vet1', role: 'vet', name: '李兽医', phone: '13800138002' },
  { username: 'vet2', role: 'vet', name: '赵兽医', phone: '13800138005' },
  { username: 'adoption1', role: 'adoption_officer', name: '王审核', phone: '13800138003' },
  { username: 'adoption2', role: 'adoption_officer', name: '陈审核', phone: '13800138006' },
  { username: 'admin1', role: 'admin', name: '管理员甲', phone: '13800138007' },
  { username: 'admin2', role: 'admin', name: '管理员乙', phone: '13800138008' },
];

const userIds = {};
users.forEach(user => {
  const info = insertUser.run(user.username, passwordHash, user.role, user.name, user.phone, now);
  userIds[user.username] = info.lastInsertRowid;
});
console.log(`  - 已插入 ${users.length} 个用户`);

const insertAnimal = db.prepare(`
  INSERT INTO animals (name, species, breed, age, gender, rescue_date, rescue_location, status, description, created_by, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const animals = [
  { name: '小黄', species: '狗', breed: '金毛', age: 2, gender: 'male', rescue_date: dayjs().subtract(60, 'day').format('YYYY-MM-DD'), rescue_location: '朝阳区公园', status: 'adopted', description: '性格温顺，喜欢与人亲近，已绝育', created_by: userIds.volunteer1 },
  { name: '花花', species: '猫', breed: '橘猫', age: 1, gender: 'female', rescue_date: dayjs().subtract(45, 'day').format('YYYY-MM-DD'), rescue_location: '海淀区小区', status: 'fostered', description: '活泼好动，爱吃罐头，待绝育', created_by: userIds.volunteer1 },
  { name: '大黑', species: '狗', breed: '拉布拉多', age: 3, gender: 'male', rescue_date: dayjs().subtract(30, 'day').format('YYYY-MM-DD'), rescue_location: '西城区街道', status: 'rescued', description: '刚被救助，正在观察中', created_by: userIds.volunteer2 },
  { name: '小白', species: '猫', breed: '英短', age: 1, gender: 'male', rescue_date: dayjs().subtract(25, 'day').format('YYYY-MM-DD'), rescue_location: '东城区商铺', status: 'adopted', description: '安静乖巧，适合家庭饲养', created_by: userIds.volunteer2 },
  { name: '旺财', species: '狗', breed: '中华田园犬', age: 4, gender: 'male', rescue_date: dayjs().subtract(20, 'day').format('YYYY-MM-DD'), rescue_location: '丰台区工地', status: 'recalled', description: '被领养后出现异常行为，已收回', created_by: userIds.volunteer1 },
  { name: '咪咪', species: '猫', breed: '狸花猫', age: 2, gender: 'female', rescue_date: dayjs().subtract(15, 'day').format('YYYY-MM-DD'), rescue_location: '通州区村口', status: 'fostered', description: '胆小但亲人，正在适应寄养环境', created_by: userIds.volunteer2 },
  { name: '豆豆', species: '狗', breed: '泰迪', age: 1, gender: 'female', rescue_date: dayjs().subtract(10, 'day').format('YYYY-MM-DD'), rescue_location: '昌平区路边', status: 'adopted', description: '活泼可爱，身体恢复良好', created_by: userIds.volunteer1 },
  { name: '大黄', species: '狗', breed: '中华田园犬', age: 5, gender: 'male', rescue_date: dayjs().subtract(5, 'day').format('YYYY-MM-DD'), rescue_location: '大兴区废品站', status: 'rescued', description: '老年犬，需持续关注健康', created_by: userIds.volunteer2 },
];

const animalIds = [];
animals.forEach(animal => {
  const info = insertAnimal.run(
    animal.name, animal.species, animal.breed, animal.age, animal.gender,
    animal.rescue_date, animal.rescue_location, animal.status, animal.description,
    animal.created_by, now, now
  );
  animalIds.push(info.lastInsertRowid);
});
console.log(`  - 已插入 ${animals.length} 只动物`);

const insertFoster = db.prepare(`
  INSERT INTO foster_records (animal_id, foster_user_name, foster_phone, foster_address, start_date, end_date, status, notes, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const fosters = [
  { animal_id: animalIds[1], foster_user_name: '周阿姨', foster_phone: '13900139001', foster_address: '海淀区xx小区3-201', start_date: dayjs().subtract(40, 'day').format('YYYY-MM-DD'), end_date: null, status: 'active', notes: '有养猫经验，环境良好' },
  { animal_id: animalIds[5], foster_user_name: '孙先生', foster_phone: '13900139002', foster_address: '通州区xx花园5-302', start_date: dayjs().subtract(10, 'day').format('YYYY-MM-DD'), end_date: null, status: 'active', notes: '第一次寄养，已做指导' },
  { animal_id: animalIds[0], foster_user_name: '吴大姐', foster_phone: '13900139003', foster_address: '朝阳区xx苑2-101', start_date: dayjs().subtract(55, 'day').format('YYYY-MM-DD'), end_date: dayjs().subtract(30, 'day').format('YYYY-MM-DD'), status: 'ended', notes: '寄养结束，已被领养' },
  { animal_id: animalIds[3], foster_user_name: '郑老师', foster_phone: '13900139004', foster_address: '东城区xx胡同8号', start_date: dayjs().subtract(20, 'day').format('YYYY-MM-DD'), end_date: dayjs().subtract(12, 'day').format('YYYY-MM-DD'), status: 'ended', notes: '短期寄养，已转领养' },
  { animal_id: animalIds[6], foster_user_name: '周阿姨', foster_phone: '13900139001', foster_address: '海淀区xx小区3-201', start_date: dayjs().subtract(8, 'day').format('YYYY-MM-DD'), end_date: dayjs().subtract(2, 'day').format('YYYY-MM-DD'), status: 'ended', notes: '恢复快，已转领养' },
];

fosters.forEach(f => {
  insertFoster.run(f.animal_id, f.foster_user_name, f.foster_phone, f.foster_address, f.start_date, f.end_date, f.status, f.notes, now);
});
console.log(`  - 已插入 ${fosters.length} 条寄养记录`);

const insertAdoption = db.prepare(`
  INSERT INTO adoption_records (animal_id, adopter_name, adopter_phone, adopter_address, adopt_date, reviewer_id, status, notes, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const adoptions = [
  { animal_id: animalIds[0], adopter_name: '钱先生', adopter_phone: '13700137001', adopter_address: '朝阳区xx家园6-501', adopt_date: dayjs().subtract(30, 'day').format('YYYY-MM-DD'), reviewer_id: userIds.adoption1, status: 'approved', notes: '有养狗经验，收入稳定' },
  { animal_id: animalIds[3], adopter_name: '冯女士', adopter_phone: '13700137002', adopter_address: '西城区xx街12号', adopt_date: dayjs().subtract(12, 'day').format('YYYY-MM-DD'), reviewer_id: userIds.adoption1, status: 'approved', notes: '家庭环境好，愿意定期回访' },
  { animal_id: animalIds[4], adopter_name: '韩先生', adopter_phone: '13700137003', adopter_address: '丰台区xx小区9-802', adopt_date: dayjs().subtract(15, 'day').format('YYYY-MM-DD'), reviewer_id: userIds.adoption2, status: 'approved', notes: '初次领养，已做培训' },
  { animal_id: animalIds[6], adopter_name: '曹小姐', adopter_phone: '13700137004', adopter_address: '昌平区xx新城3-1601', adopt_date: dayjs().subtract(2, 'day').format('YYYY-MM-DD'), reviewer_id: userIds.adoption1, status: 'approved', notes: '喜欢小型犬，家中无小孩' },
  { animal_id: animalIds[2], adopter_name: '魏先生', adopter_phone: '13700137005', adopter_address: '石景山区xx路5号', adopt_date: null, reviewer_id: userIds.adoption2, status: 'pending_review', notes: '申请领养大黑，待审核' },
  { animal_id: animalIds[7], adopter_name: '许女士', adopter_phone: '13700137006', adopter_address: '大兴区xx苑1-402', adopt_date: null, reviewer_id: null, status: 'pending_review', notes: '申请领养大黄，待审核' },
];

const adoptionIds = [];
adoptions.forEach(a => {
  const info = insertAdoption.run(a.animal_id, a.adopter_name, a.adopter_phone, a.adopter_address, a.adopt_date, a.reviewer_id, a.status, a.notes, now);
  adoptionIds.push(info.lastInsertRowid);
});
console.log(`  - 已插入 ${adoptions.length} 条领养记录`);

const insertVisit = db.prepare(`
  INSERT INTO visit_records (animal_id, adoption_id, visit_date, visitor_id, visitor_role, health_status, behavior_status, environment_status, notes, status, recall_id, next_visit_date, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const visits = [
  { animal_id: animalIds[0], adoption_id: adoptionIds[0], visit_date: dayjs().subtract(25, 'day').format('YYYY-MM-DD HH:mm:ss'), visitor_id: userIds.volunteer1, visitor_role: 'volunteer', health_status: '良好', behavior_status: '正常', environment_status: '良好', notes: '首次回访，适应良好，领养人很负责', status: 'completed', recall_id: null, next_visit_date: dayjs().subtract(18, 'day').format('YYYY-MM-DD') },
  { animal_id: animalIds[0], adoption_id: adoptionIds[0], visit_date: dayjs().subtract(18, 'day').format('YYYY-MM-DD HH:mm:ss'), visitor_id: userIds.volunteer1, visitor_role: 'volunteer', health_status: '良好', behavior_status: '正常', environment_status: '良好', notes: '第二次回访，状态稳定', status: 'completed', recall_id: null, next_visit_date: dayjs().subtract(11, 'day').format('YYYY-MM-DD') },
  { animal_id: animalIds[0], adoption_id: adoptionIds[0], visit_date: dayjs().subtract(11, 'day').format('YYYY-MM-DD HH:mm:ss'), visitor_id: userIds.vet1, visitor_role: 'vet', health_status: '健康', behavior_status: '正常', environment_status: '良好', notes: '兽医检查，各项指标正常，建议继续定期体检', status: 'completed', recall_id: null, next_visit_date: null },
  { animal_id: animalIds[1], adoption_id: null, visit_date: dayjs().subtract(20, 'day').format('YYYY-MM-DD HH:mm:ss'), visitor_id: userIds.volunteer1, visitor_role: 'volunteer', health_status: '良好', behavior_status: '活泼', environment_status: '良好', notes: '寄养家庭回访，适应良好', status: 'completed', recall_id: null, next_visit_date: dayjs().subtract(8, 'day').format('YYYY-MM-DD') },
  { animal_id: animalIds[1], adoption_id: null, visit_date: dayjs().subtract(8, 'day').format('YYYY-MM-DD HH:mm:ss'), visitor_id: userIds.vet1, visitor_role: 'vet', health_status: '轻微感冒', behavior_status: '正常', environment_status: '良好', notes: '已开药，建议3天后复查', status: 'need_followup', recall_id: null, next_visit_date: dayjs().add(2, 'day').format('YYYY-MM-DD') },
  { animal_id: animalIds[3], adoption_id: adoptionIds[1], visit_date: dayjs().subtract(7, 'day').format('YYYY-MM-DD HH:mm:ss'), visitor_id: userIds.volunteer2, visitor_role: 'volunteer', health_status: '良好', behavior_status: '正常', environment_status: '良好', notes: '首次回访，适应良好', status: 'completed', recall_id: null, next_visit_date: dayjs().format('YYYY-MM-DD') },
  { animal_id: animalIds[3], adoption_id: adoptionIds[1], visit_date: dayjs().format('YYYY-MM-DD HH:mm:ss'), visitor_id: userIds.adoption1, visitor_role: 'adoption_officer', health_status: '良好', behavior_status: '正常', environment_status: '良好', notes: '领养后回访，家庭氛围好', status: 'completed', recall_id: null, next_visit_date: null },
  { animal_id: animalIds[2], adoption_id: null, visit_date: dayjs().add(3, 'day').format('YYYY-MM-DD HH:mm:ss'), visitor_id: null, visitor_role: null, health_status: null, behavior_status: null, environment_status: null, notes: null, status: 'pending', recall_id: null, next_visit_date: null },
  { animal_id: animalIds[4], adoption_id: adoptionIds[2], visit_date: dayjs().subtract(10, 'day').format('YYYY-MM-DD HH:mm:ss'), visitor_id: userIds.adoption2, visitor_role: 'adoption_officer', health_status: '较差', behavior_status: '异常-攻击性', environment_status: '差-空间不足', notes: '领养人反映动物攻击性强，咬伤小孩，饲养环境不符合要求', status: 'transferred_to_recall', recall_id: null, next_visit_date: null },
  { animal_id: animalIds[6], adoption_id: adoptionIds[3], visit_date: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'), visitor_id: userIds.volunteer1, visitor_role: 'volunteer', health_status: '良好', behavior_status: '正常', environment_status: '良好', notes: '领养后首次回访，豆豆适应很好', status: 'completed', recall_id: null, next_visit_date: dayjs().add(14, 'day').format('YYYY-MM-DD') },
];

const visitIds = [];
visits.forEach(v => {
  const info = insertVisit.run(
    v.animal_id, v.adoption_id, v.visit_date, v.visitor_id, v.visitor_role,
    v.health_status, v.behavior_status, v.environment_status,
    v.notes, v.status, v.recall_id, v.next_visit_date, now, now
  );
  visitIds.push(info.lastInsertRowid);
});
console.log(`  - 已插入 ${visits.length} 条回访记录`);

const insertRecall = db.prepare(`
  INSERT INTO recall_records (animal_id, source_visit_id, reason, report_date, reporter_id, reporter_role, status, handler_id, handler_role, resolution, resolved_date, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const recalls = [
  { animal_id: animalIds[4], source_visit_id: visitIds[8], reason: '领养人反映动物攻击性强，咬伤小孩；回访发现饲养环境严重不达标', report_date: dayjs().subtract(9, 'day').format('YYYY-MM-DD HH:mm:ss'), reporter_id: userIds.adoption2, reporter_role: 'adoption_officer', status: 'recalled', handler_id: userIds.volunteer1, handler_role: 'volunteer', resolution: '已成功收回，正在进行行为评估和重新社会化训练', resolved_date: dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss') },
  { animal_id: animalIds[3], source_visit_id: null, reason: '领养人家庭出现变故，无法继续饲养小白', report_date: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'), reporter_id: userIds.volunteer2, reporter_role: 'volunteer', status: 'reviewing', handler_id: userIds.adoption1, handler_role: 'adoption_officer', resolution: null, resolved_date: null },
  { animal_id: animalIds[0], source_visit_id: null, reason: '回访发现饲养环境不符合要求，邻居投诉噪音', report_date: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'), reporter_id: userIds.vet1, reporter_role: 'vet', status: 'initiated', handler_id: null, handler_role: null, resolution: null, resolved_date: null },
  { animal_id: animalIds[6], source_visit_id: null, reason: '领养人经济困难，无法继续承担医疗费用', report_date: dayjs().format('YYYY-MM-DD HH:mm:ss'), reporter_id: userIds.adoption1, reporter_role: 'adoption_officer', status: 'executing', handler_id: userIds.volunteer1, handler_role: 'volunteer', resolution: null, resolved_date: null },
];

const recallIds = [];
recalls.forEach(r => {
  const info = insertRecall.run(
    r.animal_id, r.source_visit_id, r.reason, r.report_date, r.reporter_id, r.reporter_role,
    r.status, r.handler_id, r.handler_role, r.resolution, r.resolved_date, now, now
  );
  recallIds.push(info.lastInsertRowid);
});
console.log(`  - 已插入 ${recalls.length} 条异常收回记录`);

db.prepare(`UPDATE visit_records SET recall_id = ? WHERE id = ?`).run(recallIds[0], visitIds[8]);

const insertHandover = db.prepare(`
  INSERT INTO shift_handovers (from_user_id, to_user_id, handover_date, pending_visits, active_recalls, summary, key_notes, visit_ids, recall_ids, status, confirmed_at, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const handovers = [
  { from_user_id: userIds.volunteer1, to_user_id: userIds.volunteer2, handover_date: dayjs().subtract(7, 'day').format('YYYY-MM-DD HH:mm:ss'), pending_visits: 2, active_recalls: 1, summary: '本周救助3只动物，2只进入寄养', key_notes: '花花感冒需关注，大黑需要尽快安排兽医检查', visit_ids: `${visitIds[3]},${visitIds[4]}`, recall_ids: `${recallIds[0]}`, status: 'confirmed', confirmed_at: dayjs().subtract(7, 'day').format('YYYY-MM-DD HH:mm:ss') },
  { from_user_id: userIds.adoption1, to_user_id: userIds.adoption2, handover_date: dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'), pending_visits: 1, active_recalls: 1, summary: '审批2份领养申请，1份通过', key_notes: '小白领养家庭变故需跟进，豆豆领养审批已完成', visit_ids: `${visitIds[5]}`, recall_ids: `${recallIds[1]}`, status: 'confirmed', confirmed_at: dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss') },
  { from_user_id: userIds.volunteer1, to_user_id: userIds.volunteer2, handover_date: dayjs().format('YYYY-MM-DD HH:mm:ss'), pending_visits: 1, active_recalls: 2, summary: '今日处理1次回访，发起1次异常收回', key_notes: '小黄邻居投诉需跟进，豆豆领养人经济困难处理中', visit_ids: `${visitIds[9]}`, recall_ids: `${recallIds[2]},${recallIds[3]}`, status: 'pending', confirmed_at: null },
];

handovers.forEach(h => {
  insertHandover.run(h.from_user_id, h.to_user_id, h.handover_date, h.pending_visits, h.active_recalls, h.summary, h.key_notes, h.visit_ids, h.recall_ids, h.status, h.confirmed_at, now);
});
console.log(`  - 已插入 ${handovers.length} 条交班记录`);

const insertNotification = db.prepare(`
  INSERT INTO notifications (user_id, title, content, type, related_id, is_read, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const notifications = [
  { user_id: userIds.volunteer1, title: '新回访待处理', content: '大黑的回访计划已到日期，请安排回访', type: 'visit', related_id: visitIds[7], is_read: 0 },
  { user_id: userIds.adoption1, title: '异常收回待审核', content: '小白的领养人家庭变故，需审核异常收回申请', type: 'recall', related_id: recallIds[1], is_read: 0 },
  { user_id: userIds.vet1, title: '回访复查提醒', content: '花花感冒复查时间已到，请安排检查', type: 'visit', related_id: visitIds[4], is_read: 0 },
  { user_id: userIds.volunteer1, title: '交班确认', content: '您有一份待确认的交班记录', type: 'handover', related_id: 3, is_read: 1 },
  { user_id: userIds.volunteer2, title: '异常收回执行中', content: '豆豆的异常收回正在执行中，请配合', type: 'recall', related_id: recallIds[3], is_read: 0 },
  { user_id: userIds.adoption2, title: '领养审核待处理', content: '大黑的领养申请待审核', type: 'system', related_id: adoptionIds[4], is_read: 0 },
  { user_id: userIds.admin1, title: '系统通知', content: '本周新增救助3只动物，异常收回1只', type: 'system', related_id: null, is_read: 0 },
  { user_id: userIds.volunteer1, title: '异常收回已发起', content: '小黄的异常收回已发起，请关注处理进度', type: 'recall', related_id: recallIds[2], is_read: 0 },
];

notifications.forEach(n => {
  insertNotification.run(n.user_id, n.title, n.content, n.type, n.related_id, n.is_read, now);
});
console.log(`  - 已插入 ${notifications.length} 条通知`);

console.log('\n数据库初始化完成！');
console.log(`数据库路径: ${dbPath}`);
console.log('\n测试账号（密码均为 123456）:');
console.log('  志愿者: volunteer1 / volunteer2');
console.log('  兽医: vet1 / vet2');
console.log('  领养审核员: adoption1 / adoption2');
console.log('  管理员: admin1 / admin2');

db.close();
