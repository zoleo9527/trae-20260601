const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, '..', 'data', 'gym.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log('已连接到 SQLite 数据库');
    initDatabase();
  }
});

function initDatabase() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      password TEXT NOT NULL,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      level TEXT DEFAULT 'beginner',
      membership_expire DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS routes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      grade TEXT NOT NULL,
      color TEXT,
      wall TEXT,
      setter_id TEXT,
      status TEXT DEFAULT 'active',
      last_maintenance DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (setter_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS route_maintenance (
      id TEXT PRIMARY KEY,
      route_id TEXT NOT NULL,
      maintainer_id TEXT,
      type TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending',
      scheduled_date DATE,
      completed_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (route_id) REFERENCES routes(id),
      FOREIGN KEY (maintainer_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS reservations (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL,
      date DATE NOT NULL,
      time_slot TEXT NOT NULL,
      type TEXT DEFAULT 'free',
      status TEXT DEFAULT 'confirmed',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS staff_schedules (
      id TEXT PRIMARY KEY,
      staff_id TEXT NOT NULL,
      date DATE NOT NULL,
      shift TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT DEFAULT 'scheduled',
      assigned_by TEXT,
      reviewed_by TEXT,
      review_notes TEXT,
      check_in_time DATETIME,
      check_out_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (staff_id) REFERENCES users(id),
      FOREIGN KEY (assigned_by) REFERENCES users(id),
      FOREIGN KEY (reviewed_by) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS risk_alerts (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      severity TEXT DEFAULT 'medium',
      title TEXT NOT NULL,
      description TEXT,
      related_type TEXT,
      related_id TEXT,
      status TEXT DEFAULT 'open',
      reported_by TEXT,
      handled_by TEXT,
      handled_at DATETIME,
      resolution TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reported_by) REFERENCES users(id),
      FOREIGN KEY (handled_by) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS equipment (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT,
      status TEXT DEFAULT 'available',
      last_check DATE,
      notes TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    seedInitialData();
  });
}

function seedInitialData() {
  db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
    if (err || row.count > 0) return;

    const users = [
      { id: uuidv4(), username: 'frontdesk', name: '林前台', role: 'frontdesk', password: '123456' },
      { id: uuidv4(), username: 'belayer1', name: '张保护', role: 'belayer', password: '123456' },
      { id: uuidv4(), username: 'belayer2', name: '王保护', role: 'belayer', password: '123456' },
      { id: uuidv4(), username: 'routesetter', name: '陈定线', role: 'routesetter', password: '123456' },
      { id: uuidv4(), username: 'manager', name: '李经理', role: 'manager', password: '123456' }
    ];

    const members = [
      { id: uuidv4(), name: '会员小明', phone: '13800000001', level: 'beginner', membership_expire: '2026-12-31' },
      { id: uuidv4(), name: '会员小红', phone: '13800000002', level: 'intermediate', membership_expire: '2026-08-15' },
      { id: uuidv4(), name: '会员老王', phone: '13800000003', level: 'advanced', membership_expire: '2026-10-01' },
      { id: uuidv4(), name: '体验客小李', phone: '13800000004', level: 'beginner', membership_expire: null }
    ];

    const routes = [
      { id: uuidv4(), name: '热身线A', grade: '5.8', color: '绿色', wall: '热身区', setter_id: users[3].id, status: 'active', last_maintenance: '2026-05-28' },
      { id: uuidv4(), name: '进阶线B', grade: '5.10b', color: '蓝色', wall: '主墙区', setter_id: users[3].id, status: 'active', last_maintenance: '2026-05-20' },
      { id: uuidv4(), name: '高手线C', grade: '5.12a', color: '红色', wall: '难度区', setter_id: users[3].id, status: 'maintenance', last_maintenance: '2026-04-15' },
      { id: uuidv4(), name: '体验专线', grade: '5.6', color: '黄色', wall: '体验区', setter_id: users[3].id, status: 'active', last_maintenance: '2026-05-30' }
    ];

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const schedules = [
      { id: uuidv4(), staff_id: users[1].id, date: today, shift: 'morning', role: 'belayer', status: 'pending_review', assigned_by: users[0].id },
      { id: uuidv4(), staff_id: users[2].id, date: today, shift: 'afternoon', role: 'belayer', status: 'scheduled', assigned_by: users[0].id },
      { id: uuidv4(), staff_id: users[1].id, date: tomorrow, shift: 'morning', role: 'belayer', status: 'draft', assigned_by: users[0].id }
    ];

    const reservations = [
      { id: uuidv4(), member_id: members[0].id, date: today, time_slot: '10:00-12:00', type: 'free', status: 'confirmed' },
      { id: uuidv4(), member_id: members[1].id, date: today, time_slot: '14:00-16:00', type: 'course', status: 'confirmed', notes: '体验课第二节' },
      { id: uuidv4(), member_id: members[3].id, date: today, time_slot: '16:00-18:00', type: 'trial', status: 'pending' }
    ];

    const maintenance = [
      { id: uuidv4(), route_id: routes[2].id, maintainer_id: users[3].id, type: 'rebolt', description: '顶链磨损需要更换', status: 'in_progress', scheduled_date: today },
      { id: uuidv4(), route_id: routes[1].id, maintainer_id: null, type: 'check', description: '例行安全检查', status: 'pending', scheduled_date: tomorrow }
    ];

    const risks = [
      { id: uuidv4(), type: 'member_mismatch', severity: 'high', title: '新手误入高难度线路', description: '会员小明（新手）在高手线C附近徘徊，可能误攀', related_type: 'member', related_id: members[0].id, status: 'open', reported_by: users[1].id },
      { id: uuidv4(), type: 'equipment', severity: 'medium', title: '快挂归还缺件', description: '昨日借出的12个快挂只归还了10个', related_type: 'equipment', related_id: null, status: 'processing', reported_by: users[0].id, handled_by: users[1].id },
      { id: uuidv4(), type: 'conversion', severity: 'low', title: '体验课转化断层', description: '上周3节体验课无一人转化会员', related_type: 'reservation', related_id: null, status: 'open', reported_by: users[4].id }
    ];

    const stmtUser = db.prepare("INSERT INTO users (id, username, name, role, password) VALUES (?, ?, ?, ?, ?)");
    users.forEach(u => stmtUser.run(u.id, u.username, u.name, u.role, u.password));

    const stmtMember = db.prepare("INSERT INTO members (id, name, phone, level, membership_expire) VALUES (?, ?, ?, ?, ?)");
    members.forEach(m => stmtMember.run(m.id, m.name, m.phone, m.level, m.membership_expire));

    const stmtRoute = db.prepare("INSERT INTO routes (id, name, grade, color, wall, setter_id, status, last_maintenance) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    routes.forEach(r => stmtRoute.run(r.id, r.name, r.grade, r.color, r.wall, r.setter_id, r.status, r.last_maintenance));

    const stmtSched = db.prepare("INSERT INTO staff_schedules (id, staff_id, date, shift, role, status, assigned_by) VALUES (?, ?, ?, ?, ?, ?, ?)");
    schedules.forEach(s => stmtSched.run(s.id, s.staff_id, s.date, s.shift, s.role, s.status, s.assigned_by));

    const stmtResv = db.prepare("INSERT INTO reservations (id, member_id, date, time_slot, type, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)");
    reservations.forEach(r => stmtResv.run(r.id, r.member_id, r.date, r.time_slot, r.type, r.status, r.notes));

    const stmtMaint = db.prepare("INSERT INTO route_maintenance (id, route_id, maintainer_id, type, description, status, scheduled_date) VALUES (?, ?, ?, ?, ?, ?, ?)");
    maintenance.forEach(m => stmtMaint.run(m.id, m.route_id, m.maintainer_id, m.type, m.description, m.status, m.scheduled_date));

    const stmtRisk = db.prepare("INSERT INTO risk_alerts (id, type, severity, title, description, related_type, related_id, status, reported_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    risks.forEach(r => stmtRisk.run(r.id, r.type, r.severity, r.title, r.description, r.related_type, r.related_id, r.status, r.reported_by));

    console.log('初始数据植入完成');
  });
}

module.exports = db;
