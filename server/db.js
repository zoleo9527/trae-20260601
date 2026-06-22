const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'gas_inspection.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      community TEXT,
      building_no TEXT,
      room_no TEXT,
      gas_account TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inspectors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      employee_no TEXT UNIQUE NOT NULL,
      phone TEXT,
      area TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inspection_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_no TEXT UNIQUE NOT NULL,
      plan_name TEXT NOT NULL,
      inspector_id INTEGER,
      plan_date DATE NOT NULL,
      area TEXT,
      status TEXT DEFAULT 'pending',
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (inspector_id) REFERENCES inspectors(id)
    );

    CREATE TABLE IF NOT EXISTS plan_customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      visit_status TEXT DEFAULT 'pending',
      visit_times INTEGER DEFAULT 0,
      last_visit_time DATETIME,
      FOREIGN KEY (plan_id) REFERENCES inspection_plans(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS hazard_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      severity TEXT NOT NULL,
      description TEXT,
      is_construction INTEGER DEFAULT 0,
      default_deadline_days INTEGER DEFAULT 7,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inspection_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_no TEXT UNIQUE NOT NULL,
      plan_customer_id INTEGER,
      inspector_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      inspect_date DATETIME NOT NULL,
      is_user_at_home INTEGER NOT NULL DEFAULT 1,
      meter_reading TEXT,
      overall_status TEXT DEFAULT 'normal',
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (plan_customer_id) REFERENCES plan_customers(id),
      FOREIGN KEY (inspector_id) REFERENCES inspectors(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS hazard_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id INTEGER,
      customer_id INTEGER NOT NULL,
      hazard_type_id INTEGER NOT NULL,
      location TEXT,
      description TEXT,
      photo_url TEXT,
      severity TEXT NOT NULL,
      rectify_status TEXT DEFAULT 'pending',
      deadline DATE,
      handler_id INTEGER,
      FOREIGN KEY (record_id) REFERENCES inspection_records(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (hazard_type_id) REFERENCES hazard_types(id),
      FOREIGN KEY (handler_id) REFERENCES inspectors(id)
    );

    CREATE TABLE IF NOT EXISTS rectify_notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      notice_no TEXT UNIQUE NOT NULL,
      hazard_record_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      issue_date DATETIME NOT NULL,
      deadline DATE NOT NULL,
      rectify_requirement TEXT NOT NULL,
      notice_method TEXT NOT NULL,
      operator_id INTEGER,
      customer_signature TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hazard_record_id) REFERENCES hazard_records(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (operator_id) REFERENCES inspectors(id)
    );

    CREATE TABLE IF NOT EXISTS revisit_appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_no TEXT UNIQUE NOT NULL,
      hazard_record_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      customer_name TEXT,
      customer_phone TEXT,
      appointment_date DATE NOT NULL,
      appointment_time_slot TEXT,
      status TEXT DEFAULT 'scheduled',
      operator_id INTEGER,
      inspector_id INTEGER,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hazard_record_id) REFERENCES hazard_records(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (operator_id) REFERENCES inspectors(id),
      FOREIGN KEY (inspector_id) REFERENCES inspectors(id)
    );

    CREATE TABLE IF NOT EXISTS revisit_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      revisit_no TEXT UNIQUE NOT NULL,
      appointment_id INTEGER,
      hazard_record_id INTEGER NOT NULL,
      inspector_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      revisit_date DATETIME NOT NULL,
      is_user_at_home INTEGER NOT NULL DEFAULT 1,
      rectify_result TEXT NOT NULL,
      description TEXT,
      photo_url TEXT,
      next_action TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (appointment_id) REFERENCES revisit_appointments(id),
      FOREIGN KEY (hazard_record_id) REFERENCES hazard_records(id),
      FOREIGN KEY (inspector_id) REFERENCES inspectors(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS customer_visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visit_no TEXT UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL,
      record_id INTEGER,
      operator_id INTEGER,
      visit_date DATETIME NOT NULL,
      visit_method TEXT NOT NULL,
      visit_purpose TEXT NOT NULL,
      visit_content TEXT,
      customer_feedback TEXT,
      satisfaction_level TEXT,
      status TEXT DEFAULT 'completed',
      follow_up TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (record_id) REFERENCES inspection_records(id),
      FOREIGN KEY (operator_id) REFERENCES inspectors(id)
    );
  `);

  seedData();
}

function seedData() {
  const hazardCount = db.prepare('SELECT COUNT(*) as cnt FROM hazard_types').get().cnt;
  if (hazardCount > 0) return;

  const insertHazard = db.prepare(`
    INSERT INTO hazard_types (code, name, category, severity, description, is_construction, default_deadline_days)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const hazards = [
    ['HOSE_001', '燃气软管老化开裂', '软管类', 'high', '橡胶软管出现老化、裂纹、鼓包等现象，需立即更换', 0, 3],
    ['HOSE_002', '燃气软管超长', '软管类', 'medium', '软管长度超过2米，存在安全隐患', 0, 7],
    ['HOSE_003', '软管穿墙/无管卡', '软管类', 'high', '软管穿墙、穿楼板或未使用管卡固定', 0, 3],
    ['ALARM_001', '燃气报警器缺失', '报警类', 'high', '未安装可燃气体报警器或报警器失效', 1, 7],
    ['ALARM_002', '报警器未通电/故障', '报警类', 'medium', '报警器未接通电源或显示故障', 0, 3],
    ['VALVE_001', '燃气阀门损坏/漏气', '阀门类', 'high', '阀门开关不灵活或存在漏气现象', 1, 3],
    ['PIPE_001', '燃气管道锈蚀', '管道类', 'medium', '金属管道表面出现锈蚀', 1, 15],
    ['PIPE_002', '管道私接乱改', '管道类', 'high', '用户私自改造燃气管道', 1, 7],
    ['STOVE_001', '灶具超期服役', '灶具类', 'medium', '灶具使用超过8年报废期限', 0, 15],
    ['STOVE_002', '灶具无熄火保护', '灶具类', 'high', '灶具未安装熄火保护装置', 0, 7],
    ['ENV_001', '厨房通风不良', '环境类', 'medium', '厨房密闭通风条件差', 0, 15],
    ['ENV_002', '燃气设施附近堆放易燃物', '环境类', 'medium', '燃气表、管道周围堆放易燃易爆物品', 0, 7],
    ['OTHER_001', '表具损坏/异常', '表具类', 'medium', '燃气表损坏、计量异常或铅封缺失', 1, 7]
  ];

  const tx = db.transaction((items) => {
    for (const item of items) insertHazard.run(...item);
  });
  tx(hazards);

  const insertInspector = db.prepare(`
    INSERT INTO inspectors (name, employee_no, phone, area) VALUES (?, ?, ?, ?)
  `);
  const inspectors = [
    ['张伟', 'AJ2024001', '13800138001', '朝阳区'],
    ['李强', 'AJ2024002', '13800138002', '朝阳区'],
    ['王芳', 'KF2024001', '13800138003', '客服中心'],
    ['赵刚', 'WX2024001', '13800138004', '维修队'],
    ['刘洋', 'AJ2024003', '13800138005', '海淀区']
  ];
  const tx2 = db.transaction((items) => {
    for (const item of items) insertInspector.run(...item);
  });
  tx2(inspectors);

  const insertCustomer = db.prepare(`
    INSERT INTO customers (name, phone, address, community, building_no, room_no, gas_account)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const customers = [
    ['陈明', '13911110001', '朝阳区望京新城A区1号楼2单元501', '望京新城A区', '1号楼', '501', 'GAS0010001'],
    ['李小红', '13911110002', '朝阳区望京新城A区1号楼2单元1002', '望京新城A区', '1号楼', '1002', 'GAS0010002'],
    ['王建国', '13911110003', '朝阳区望京新城A区2号楼1单元301', '望京新城A区', '2号楼', '301', 'GAS0010003'],
    ['赵玉兰', '13911110004', '朝阳区望京新城A区2号楼1单元802', '望京新城A区', '2号楼', '802', 'GAS0010004'],
    ['孙涛', '13911110005', '朝阳区望京新城A区3号楼3单元1203', '望京新城A区', '3号楼', '1203', 'GAS0010005'],
    ['周丽萍', '13911110006', '朝阳区望京新城A区3号楼3单元601', '望京新城A区', '3号楼', '601', 'GAS0010006'],
    ['吴海军', '13911110007', '朝阳区望京新城B区4号楼2单元902', '望京新城B区', '4号楼', '902', 'GAS0020001'],
    ['郑美玲', '13911110008', '朝阳区望京新城B区4号楼2单元1101', '望京新城B区', '4号楼', '1101', 'GAS0020002'],
    ['钱伟', '13911110009', '朝阳区望京新城B区5号楼1单元403', '望京新城B区', '5号楼', '403', 'GAS0020003'],
    ['冯建华', '13911110010', '朝阳区望京新城B区5号楼1单元1502', '望京新城B区', '5号楼', '1502', 'GAS0020004']
  ];
  const tx3 = db.transaction((items) => {
    for (const item of items) insertCustomer.run(...item);
  });
  tx3(customers);

  const insertPlan = db.prepare(`
    INSERT INTO inspection_plans (plan_no, plan_name, inspector_id, plan_date, area, status, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const tomorrow = new Date(now.getTime() + 86400000).toISOString().slice(0, 10);
  const yesterday = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);

  const plans = [
    ['PLAN20260601001', '望京新城A区6月安检计划（第一批次）', 1, yesterday, '望京新城A区', 'completed', '重点排查软管老化和报警器问题'],
    ['PLAN20260602001', '望京新城A区6月安检计划（第二批次）', 2, today, '望京新城A区', 'in_progress', '今日需完成2号楼和3号楼'],
    ['PLAN20260603001', '望京新城B区6月安检计划', 5, tomorrow, '望京新城B区', 'pending', '下周启动B区安检']
  ];
  const tx4 = db.transaction((items) => {
    for (const item of items) insertPlan.run(...item);
  });
  tx4(plans);

  const insertPlanCustomer = db.prepare(`
    INSERT INTO plan_customers (plan_id, customer_id, visit_status, visit_times, last_visit_time)
    VALUES (?, ?, ?, ?, ?)
  `);
  const yesterdayTime = new Date(now.getTime() - 86400000).toISOString().replace('T', ' ').slice(0, 19);
  const planCustomers = [
    [1, 1, 'completed', 1, yesterdayTime],
    [1, 2, 'completed', 1, yesterdayTime],
    [1, 3, 'missed', 3, yesterdayTime],
    [1, 4, 'completed', 1, yesterdayTime],
    [2, 5, 'pending', 0, null],
    [2, 6, 'pending', 0, null],
    [2, 3, 'pending', 3, yesterdayTime],
    [3, 7, 'pending', 0, null],
    [3, 8, 'pending', 0, null],
    [3, 9, 'pending', 0, null],
    [3, 10, 'pending', 0, null]
  ];
  const tx5 = db.transaction((items) => {
    for (const item of items) insertPlanCustomer.run(...item);
  });
  tx5(planCustomers);

  const insertRecord = db.prepare(`
    INSERT INTO inspection_records (record_no, plan_customer_id, inspector_id, customer_id, inspect_date, is_user_at_home, meter_reading, overall_status, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const records = [
    ['REC20260621001', 1, 1, 1, yesterdayTime, 1, '2568.5', 'hazard', '发现两处隐患，已发整改通知'],
    ['REC20260621002', 2, 1, 2, yesterdayTime, 1, '1890.2', 'normal', '安检正常，用户安全意识较好'],
    ['REC20260621003', 3, 1, 3, yesterdayTime, 0, null, 'missed', '连续3次上门均无人，已贴通知条'],
    ['REC20260621004', 4, 1, 4, yesterdayTime, 1, '3420.8', 'hazard', '报警器缺失，已通知安排安装'],
    ['REC20260621005', null, 2, 5, yesterdayTime, 1, '1125.3', 'hazard', '复查上次软管老化问题，已整改完成']
  ];
  const tx6 = db.transaction((items) => {
    for (const item of items) insertRecord.run(...item);
  });
  tx6(records);

  const insertHazardRecord = db.prepare(`
    INSERT INTO hazard_records (record_id, customer_id, hazard_type_id, location, description, severity, rectify_status, deadline, handler_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const deadline1 = new Date(now.getTime() + 3 * 86400000).toISOString().slice(0, 10);
  const deadline2 = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10);
  const passedDeadline = new Date(now.getTime() - 2 * 86400000).toISOString().slice(0, 10);

  const hazardRecords = [
    [1, 1, 1, '厨房灶具连接处', '用户家橡胶软管使用超过5年，连接处出现明显裂纹，有轻微燃气泄漏迹象', 'high', 'pending', deadline1, null],
    [1, 1, 3, '厨房穿墙处', '燃气软管穿墙而过未加套管保护，且软管超长约3米', 'high', 'pending', deadline1, null],
    [4, 4, 4, '厨房吊顶下方', '用户家中未安装任何可燃气体报警装置，存在重大安全隐患', 'high', 'scheduled', deadline2, 4],
    [4, 4, 10, '厨房操作台', '用户使用老式灶具无自动熄火保护，汤水溢出易导致燃气泄漏', 'high', 'notified', deadline2, null],
    [2, 2, 6, '表箱阀门', '表箱前阀门有轻微锈蚀，开关正常无需更换', 'medium', 'waived', null, null],
    [null, 5, 4, '厨房', '（复查关联）该用户原报警器缺失问题，本次复查确认已完成安装，验收合格', 'high', 'rectified', null, 4],
    [null, 3, 1, '厨房', '（王建国）软管严重老化，多次上门无人，无法当面告知，已电话联系多次未接通', 'high', 'unreachable', passedDeadline, null]
  ];
  const tx7 = db.transaction((items) => {
    for (const item of items) insertHazardRecord.run(...item);
  });
  tx7(hazardRecords);

  const insertNotice = db.prepare(`
    INSERT INTO rectify_notices (notice_no, hazard_record_id, customer_id, issue_date, deadline, rectify_requirement, notice_method, operator_id, customer_signature)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const notices = [
    ['NT20260621001', 1, 1, yesterdayTime, deadline1, '1.立即更换老化开裂的燃气橡胶软管，建议使用不锈钢波纹管；2.穿墙软管必须加装金属套管保护，软管总长度不得超过2米', 'onsite', 3, '陈明'],
    ['NT20260621002', 2, 1, yesterdayTime, deadline1, '软管超长且穿墙无保护，同上述要求一并整改', 'onsite', 3, '陈明'],
    ['NT20260621003', 3, 4, yesterdayTime, deadline2, '1.7日内安装合格的可燃气体报警器，建议选购带联动切断阀的产品；2.建议更换带熄火保护装置的安全灶具', 'onsite', 3, '赵玉兰'],
    ['NT20260621004', 4, 4, yesterdayTime, deadline2, '灶具无熄火保护，建议更换为GB16410-2020标准的家用燃气灶具', 'onsite', 3, '赵玉兰'],
    ['NT20260621005', 7, 3, yesterdayTime, passedDeadline, '软管严重老化需立即更换。已通过电话、短信、上门贴条等多种方式告知，请尽快联系燃气公司安排整改。逾期未整改将上报相关部门', 'sticker', 3, null]
  ];
  const tx8 = db.transaction((items) => {
    for (const item of items) insertNotice.run(...item);
  });
  tx8(notices);

  const insertAppointment = db.prepare(`
    INSERT INTO revisit_appointments (appointment_no, hazard_record_id, customer_id, customer_name, customer_phone, appointment_date, appointment_time_slot, status, operator_id, inspector_id, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const appointments = [
    ['AP20260624001', 1, 1, '陈明', '13911110001', deadline1, '09:00-11:00', 'scheduled', 3, 1, '用户已购买新软管，届时需要师傅现场指导更换'],
    ['AP20260624002', 2, 1, '陈明', '13911110001', deadline1, '09:00-11:00', 'scheduled', 3, 1, '同上，一并复查穿墙套管整改情况'],
    ['AP20260628001', 3, 4, '赵玉兰', '13911110004', deadline2, '14:00-16:00', 'scheduled', 3, 4, '维修队上门安装报警器，需要施工'],
    ['AP20260625001', 7, 3, '王建国', '13911110003', today, '18:00-20:00', 'pending', 3, 2, '客服多次打电话无人接听，预约傍晚时间再次尝试上门']
  ];
  const tx9 = db.transaction((items) => {
    for (const item of items) insertAppointment.run(...item);
  });
  tx9(appointments);

  const insertRevisit = db.prepare(`
    INSERT INTO revisit_records (revisit_no, appointment_id, hazard_record_id, inspector_id, customer_id, revisit_date, is_user_at_home, rectify_result, description, next_action)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const revists = [
    ['RV20260621001', null, 6, 2, 5, yesterdayTime, 1, 'rectified', '用户已自行购买并安装燃气报警器，型号符合国家标准，现场测试报警功能正常，出具整改验收合格单', 'closed']
  ];
  const tx10 = db.transaction((items) => {
    for (const item of items) insertRevisit.run(...item);
  });
  tx10(revists);

  const insertVisit = db.prepare(`
    INSERT INTO customer_visits (visit_no, customer_id, record_id, operator_id, visit_date, visit_method, visit_purpose, visit_content, customer_feedback, satisfaction_level, status, follow_up)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const visits = [
    ['CV20260621001', 1, 1, 3, yesterdayTime, 'phone', 'hazard_warning', '电话回访陈明先生，告知其家中软管老化问题的严重性，确认其已收到整改通知书并知晓整改期限', '用户表示理解，承诺本周内完成更换，对安检服务表示认可', 'satisfied', 'completed', '6月24日上门复查'],
    ['CV20260621002', 4, 4, 3, yesterdayTime, 'onsite', 'hazard_warning', '当面向赵玉兰阿姨讲解报警器缺失的风险，协助预约报警器安装服务', '用户老伴住院，近期无暇顾及，感谢燃气公司主动帮忙安排安装', 'satisfied', 'completed', '6月28日维修队上门安装后复查'],
    ['CV20260621003', 3, 3, 3, yesterdayTime, 'phone', 'contact_retry', '拨打王建国电话3次，均无人接听；发送短信告知安检未遇，请回电预约安检', '未联系到用户', null, 'pending', '明日继续电话联系，傍晚再上门尝试'],
    ['CV20260621004', 5, 5, 3, yesterdayTime, 'phone', 'satisfaction', '对孙涛先生进行整改复查后的满意度回访', '报警器安装师傅服务专业，测试认真，非常满意', 'very_satisfied', 'completed', null],
    ['CV20260621005', 2, 2, 3, yesterdayTime, 'sms', 'safety_education', '发送安全用气短信给李小红女士，提醒日常用气注意事项', '用户回短信感谢提醒', 'satisfied', 'completed', null]
  ];
  const tx11 = db.transaction((items) => {
    for (const item of items) insertVisit.run(...item);
  });
  tx11(visits);
}

initDatabase();

module.exports = db;
