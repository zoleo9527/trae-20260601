import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'maintenance.db');
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

const SQL = await initSqlJs();
const db = new SQL.Database();

db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('inspector', 'property', 'supervisor')),
    phone TEXT,
    department TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE buildings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    property_manager_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_manager_id) REFERENCES users(id)
  );

  CREATE TABLE maintenance_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_no TEXT UNIQUE NOT NULL,
    building_id INTEGER NOT NULL,
    inspector_id INTEGER NOT NULL,
    current_status TEXT NOT NULL,
    inspection_date DATE NOT NULL,
    fire_alarm_system TEXT,
    sprinkler_system TEXT,
    fire_extinguishers TEXT,
    emergency_lights TEXT,
    fire_doors TEXT,
    other_equipment TEXT,
    problems_found TEXT,
    suggestions TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (building_id) REFERENCES buildings(id),
    FOREIGN KEY (inspector_id) REFERENCES users(id)
  );

  CREATE TABLE status_transitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER NOT NULL,
    from_status TEXT,
    to_status TEXT NOT NULL,
    operator_id INTEGER NOT NULL,
    operator_role TEXT NOT NULL,
    remark TEXT,
    transition_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES maintenance_reports(id),
    FOREIGN KEY (operator_id) REFERENCES users(id)
  );

  CREATE TABLE signature_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER NOT NULL,
    signatory_id INTEGER NOT NULL,
    signatory_name TEXT NOT NULL,
    signature_data TEXT,
    signed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    remark TEXT,
    FOREIGN KEY (report_id) REFERENCES maintenance_reports(id),
    FOREIGN KEY (signatory_id) REFERENCES users(id)
  );

  CREATE INDEX idx_reports_status ON maintenance_reports(current_status);
  CREATE INDEX idx_reports_building ON maintenance_reports(building_id);
  CREATE INDEX idx_transitions_report ON status_transitions(report_id);
  CREATE INDEX idx_transitions_time ON status_transitions(transition_time);
`);

function insert(sql, params) {
  db.run(sql, params);
  return {
    changes: db.getRowsModified(),
    lastInsertRowid: db.exec('SELECT last_insert_rowid() as id')[0].values[0][0]
  };
}

function dateStr(d) {
  return d.toISOString().split('T')[0];
}

function dateTimeStr(d) {
  return d.toISOString().replace('T', ' ').substring(0, 19);
}

function escape(str) {
  return str.replace(/'/g, "''");
}

const inspector1 = insert(
  "INSERT INTO users (name, role, phone, department) VALUES (?, ?, ?, ?)",
  ['张伟', 'inspector', '13800138001', '维保部一组']
);
const inspector2 = insert(
  "INSERT INTO users (name, role, phone, department) VALUES (?, ?, ?, ?)",
  ['李强', 'inspector', '13800138002', '维保部二组']
);
const property1 = insert(
  "INSERT INTO users (name, role, phone, department) VALUES (?, ?, ?, ?)",
  ['王芳', 'property', '13900139001', '阳光花园物业']
);
const property2 = insert(
  "INSERT INTO users (name, role, phone, department) VALUES (?, ?, ?, ?)",
  ['陈静', 'property', '13900139002', '金茂大厦物业']
);
const supervisor1 = insert(
  "INSERT INTO users (name, role, phone, department) VALUES (?, ?, ?, ?)",
  ['刘建国', 'supervisor', '13700137001', '维保部']
);

const building1 = insert(
  "INSERT INTO buildings (name, address, property_manager_id) VALUES (?, ?, ?)",
  ['阳光花园A区', '北京市朝阳区阳光路1号', property1.lastInsertRowid]
);
const building2 = insert(
  "INSERT INTO buildings (name, address, property_manager_id) VALUES (?, ?, ?)",
  ['金茂大厦', '北京市海淀区科技路88号', property2.lastInsertRowid]
);

const now = new Date();

const report1Date = new Date(now);
report1Date.setDate(report1Date.getDate() - 5);
const report1 = insert(
  `INSERT INTO maintenance_reports (
    report_no, building_id, inspector_id, current_status,
    inspection_date, fire_alarm_system, sprinkler_system,
    fire_extinguishers, emergency_lights, fire_doors,
    other_equipment, problems_found, suggestions
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    'WB202606001', building1.lastInsertRowid, inspector1.lastInsertRowid, 'signed',
    dateStr(report1Date),
    '正常', '正常', '12具，压力正常', '正常', '正常', '消防泵运行正常',
    '无', '建议每季度抽查灭火器压力'
  ]
);

const t1 = new Date(report1Date);
t1.setHours(10, 30, 0);
db.exec(`INSERT INTO status_transitions (report_id, from_status, to_status, operator_id, operator_role, remark, transition_time)
  VALUES (${report1.lastInsertRowid}, NULL, 'inspection_completed', ${inspector1.lastInsertRowid}, 'inspector', '现场巡检完成，设备运行正常', '${dateTimeStr(t1)}')`);

t1.setHours(11, 15, 0);
db.exec(`INSERT INTO status_transitions (report_id, from_status, to_status, operator_id, operator_role, remark, transition_time)
  VALUES (${report1.lastInsertRowid}, 'inspection_completed', 'report_submitted', ${inspector1.lastInsertRowid}, 'inspector', '提交巡检报告，含现场照片6张', '${dateTimeStr(t1)}')`);

t1.setHours(14, 20, 0);
db.exec(`INSERT INTO status_transitions (report_id, from_status, to_status, operator_id, operator_role, remark, transition_time)
  VALUES (${report1.lastInsertRowid}, 'report_submitted', 'report_approved', ${supervisor1.lastInsertRowid}, 'supervisor', '报告内容完整，数据准确', '${dateTimeStr(t1)}')`);

t1.setHours(14, 30, 0);
db.exec(`INSERT INTO status_transitions (report_id, from_status, to_status, operator_id, operator_role, remark, transition_time)
  VALUES (${report1.lastInsertRowid}, 'report_approved', 'pending_signature', ${supervisor1.lastInsertRowid}, 'supervisor', '推送至物业签收', '${dateTimeStr(t1)}')`);

t1.setDate(t1.getDate() + 1);
t1.setHours(9, 45, 0);
db.exec(`INSERT INTO status_transitions (report_id, from_status, to_status, operator_id, operator_role, remark, transition_time)
  VALUES (${report1.lastInsertRowid}, 'pending_signature', 'signed', ${property1.lastInsertRowid}, 'property', '确认无误，同意签收', '${dateTimeStr(t1)}')`);

const report2Date = new Date(now);
report2Date.setDate(report2Date.getDate() - 2);
const report2 = insert(
  `INSERT INTO maintenance_reports (
    report_no, building_id, inspector_id, current_status,
    inspection_date, fire_alarm_system, sprinkler_system,
    fire_extinguishers, emergency_lights, fire_doors,
    other_equipment, problems_found, suggestions
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    'WB202606002', building2.lastInsertRowid, inspector2.lastInsertRowid, 'pending_signature',
    dateStr(report2Date),
    '正常', '12层喷淋末端压力偏低', '36具，2具压力不足', '3层应急灯故障', '正常', '防火卷帘正常',
    '1. 2具干粉灭火器压力不足需更换\n2. 3层西侧应急灯不亮\n3. 12层喷淋末端压力0.2MPa，低于标准0.3MPa',
    '建议1周内完成整改'
  ]
);

const t2 = new Date(report2Date);
t2.setHours(9, 0, 0);
db.exec(`INSERT INTO status_transitions (report_id, from_status, to_status, operator_id, operator_role, remark, transition_time)
  VALUES (${report2.lastInsertRowid}, NULL, 'inspection_completed', ${inspector2.lastInsertRowid}, 'inspector', '巡检完成，发现3项问题', '${dateTimeStr(t2)}')`);

t2.setHours(10, 0, 0);
db.exec(`INSERT INTO status_transitions (report_id, from_status, to_status, operator_id, operator_role, remark, transition_time)
  VALUES (${report2.lastInsertRowid}, 'inspection_completed', 'report_submitted', ${inspector2.lastInsertRowid}, 'inspector', '提交报告，附问题照片和位置图', '${dateTimeStr(t2)}')`);

t2.setHours(16, 30, 0);
db.exec(`INSERT INTO status_transitions (report_id, from_status, to_status, operator_id, operator_role, remark, transition_time)
  VALUES (${report2.lastInsertRowid}, 'report_submitted', 'report_rejected', ${supervisor1.lastInsertRowid}, 'supervisor', '问题描述不够具体，请补充每台设备的编号', '${dateTimeStr(t2)}')`);

t2.setDate(t2.getDate() + 1);
t2.setHours(9, 0, 0);
db.exec(`INSERT INTO status_transitions (report_id, from_status, to_status, operator_id, operator_role, remark, transition_time)
  VALUES (${report2.lastInsertRowid}, 'report_rejected', 'report_submitted', ${inspector2.lastInsertRowid}, 'inspector', '已补充设备编号：灭火器F-012、F-028，应急灯E-305', '${dateTimeStr(t2)}')`);

t2.setHours(11, 0, 0);
db.exec(`INSERT INTO status_transitions (report_id, from_status, to_status, operator_id, operator_role, remark, transition_time)
  VALUES (${report2.lastInsertRowid}, 'report_submitted', 'report_approved', ${supervisor1.lastInsertRowid}, 'supervisor', '审核通过，请物业尽快处理问题', '${dateTimeStr(t2)}')`);

t2.setHours(11, 5, 0);
db.exec(`INSERT INTO status_transitions (report_id, from_status, to_status, operator_id, operator_role, remark, transition_time)
  VALUES (${report2.lastInsertRowid}, 'report_approved', 'pending_signature', ${supervisor1.lastInsertRowid}, 'supervisor', '推送物业签收，问题项需重点关注', '${dateTimeStr(t2)}')`);

const report3Date = new Date(now);
const report3 = insert(
  `INSERT INTO maintenance_reports (
    report_no, building_id, inspector_id, current_status,
    inspection_date, fire_alarm_system, sprinkler_system,
    fire_extinguishers, emergency_lights, fire_doors,
    other_equipment, problems_found, suggestions
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    'WB202606003', building1.lastInsertRowid, inspector1.lastInsertRowid, 'report_submitted',
    dateStr(report3Date),
    '正常', '正常', '正常', '正常', 'B2层防火门闭门器损坏', '排烟风机正常',
    'B2层西侧防火门闭门器损坏，门无法自动关闭',
    '建议3日内更换闭门器'
  ]
);

const t3 = new Date(report3Date);
t3.setHours(14, 0, 0);
db.exec(`INSERT INTO status_transitions (report_id, from_status, to_status, operator_id, operator_role, remark, transition_time)
  VALUES (${report3.lastInsertRowid}, NULL, 'inspection_completed', ${inspector1.lastInsertRowid}, 'inspector', '巡检完成，发现防火门问题', '${dateTimeStr(t3)}')`);

t3.setHours(15, 10, 0);
db.exec(`INSERT INTO status_transitions (report_id, from_status, to_status, operator_id, operator_role, remark, transition_time)
  VALUES (${report3.lastInsertRowid}, 'inspection_completed', 'report_submitted', ${inspector1.lastInsertRowid}, 'inspector', '提交报告', '${dateTimeStr(t3)}')`);

insert(
  "INSERT INTO signature_records (report_id, signatory_id, signatory_name, remark) VALUES (?, ?, ?, ?)",
  [report1.lastInsertRowid, property1.lastInsertRowid, '王芳', '已核对现场情况，报告属实']
);

const data = db.export();
const buffer = Buffer.from(data);
fs.writeFileSync(dbPath, buffer);

console.log('数据库初始化完成！');
console.log('创建用户: 5 人');
console.log('创建建筑: 2 个');
console.log('创建报告: 3 份');
console.log('创建状态流转记录: 11 条');
console.log('创建签收记录: 1 条');
console.log('');
console.log('测试账号:');
console.log('  巡检工程师: 张伟 (id:1) / 李强 (id:2)');
console.log('  物业联系人: 王芳 (id:3) / 陈静 (id:4)');
console.log('  维保主管:   刘建国 (id:5)');

db.close();
