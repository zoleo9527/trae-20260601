const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'training.db');
const db = new Database(dbPath);

db.initialize = function() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(100) NOT NULL,
      role VARCHAR(50) NOT NULL CHECK(role IN ('training_manager', 'department_head', 'instructor', 'employee')),
      department VARCHAR(100),
      email VARCHAR(100),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS training_projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(200) NOT NULL,
      type VARCHAR(20) NOT NULL CHECK(type IN ('required', 'elective')),
      format VARCHAR(20) NOT NULL CHECK(format IN ('online', 'offline', 'hybrid')),
      instructor_id INTEGER REFERENCES users(id),
      instructor_name VARCHAR(100),
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      status VARCHAR(30) NOT NULL CHECK(status IN ('planning', 'registration', 'in_progress', 'completed', 'cancelled')),
      max_participants INTEGER DEFAULT 50,
      description TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS training_registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER REFERENCES training_projects(id),
      user_id INTEGER REFERENCES users(id),
      user_name VARCHAR(100),
      user_department VARCHAR(100),
      status VARCHAR(20) NOT NULL CHECK(status IN ('registered', 'attended', 'absent', 'cancelled', 'replaced')),
      absence_reason TEXT,
      check_in_time DATETIME,
      check_out_time DATETIME,
      remarks TEXT,
      registered_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      certificate_number VARCHAR(50) UNIQUE NOT NULL,
      project_id INTEGER REFERENCES training_projects(id),
      project_name VARCHAR(200),
      user_id INTEGER REFERENCES users(id),
      user_name VARCHAR(100),
      user_department VARCHAR(100),
      status VARCHAR(30) NOT NULL CHECK(status IN ('pending', 'creating', 'pending_review', 'needs_correction', 'approved', 'issued', 'cancelled', 'revoked')),
      issue_date DATE,
      correction_reason TEXT,
      revoke_reason TEXT,
      created_by INTEGER REFERENCES users(id),
      issued_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS certificate_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      certificate_id INTEGER REFERENCES certificates(id),
      action VARCHAR(50) NOT NULL,
      from_status VARCHAR(50),
      to_status VARCHAR(50),
      operator_id INTEGER REFERENCES users(id),
      operator_name VARCHAR(100),
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS homework_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER REFERENCES training_projects(id),
      user_id INTEGER REFERENCES users(id),
      user_name VARCHAR(100),
      status VARCHAR(20) NOT NULL CHECK(status IN ('not_submitted', 'submitted', 'late', 'graded')),
      submission_date DATETIME,
      grade DECIMAL(5,2),
      remarks TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS effect_evaluations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER REFERENCES training_projects(id),
      project_name VARCHAR(200),
      satisfaction_score DECIMAL(3,2),
      completion_rate DECIMAL(5,2),
      pass_rate DECIMAL(5,2),
      issuance_rate DECIMAL(5,2),
      behavior_change_score DECIMAL(3,2),
      performance_improvement DECIMAL(5,2),
      report_status VARCHAR(20) NOT NULL CHECK(report_status IN ('draft', 'published', 'frozen')),
      frozen_reason TEXT,
      published_at DATETIME,
      last_recalculated_at DATETIME,
      recalculate_trigger TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS exceptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exception_number VARCHAR(50) UNIQUE,
      type VARCHAR(50) NOT NULL CHECK(type IN ('registration_absent', 'homework_not_submitted', 'certificate_error', 'certificate_duplicate', 'certificate_missed')),
      project_id INTEGER REFERENCES training_projects(id),
      project_name VARCHAR(200),
      related_id INTEGER,
      related_type VARCHAR(50),
      description TEXT,
      status VARCHAR(20) NOT NULL CHECK(status IN ('discovered', 'assigned', 'processing', 'resolved', 'closed')),
      priority VARCHAR(10) DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
      discovered_by INTEGER REFERENCES users(id),
      discovered_by_name VARCHAR(100),
      assigned_to INTEGER REFERENCES users(id),
      assigned_to_name VARCHAR(100),
      resolution TEXT,
      resolved_by INTEGER REFERENCES users(id),
      resolved_by_name VARCHAR(100),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS exception_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exception_id INTEGER REFERENCES exceptions(id),
      action VARCHAR(50) NOT NULL,
      operator_id INTEGER REFERENCES users(id),
      operator_name VARCHAR(100),
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get();
  const projectCount = db.prepare("SELECT COUNT(*) as count FROM training_projects").get();
  const certCount = db.prepare("SELECT COUNT(*) as count FROM certificates").get();
  const excCount = db.prepare("SELECT COUNT(*) as count FROM exceptions").get();
  const hwCount = db.prepare("SELECT COUNT(*) as count FROM homework_submissions").get();
  const evalCount = db.prepare("SELECT COUNT(*) as count FROM effect_evaluations").get();
  const regCount = db.prepare("SELECT COUNT(*) as count FROM training_registrations").get();

  console.log('数据库状态:');
  console.log('  - 用户:', userCount.count);
  console.log('  - 培训项目:', projectCount.count);
  console.log('  - 证书:', certCount.count);
  console.log('  - 异常:', excCount.count);
  console.log('  - 作业:', hwCount.count);
  console.log('  - 效果评估:', evalCount.count);
  console.log('  - 报名记录:', regCount.count);

  const needsFullInit = userCount.count === 0;
  const needsProjects = projectCount.count === 0;
  const needsCertificates = certCount.count === 0;
  const needsExceptions = excCount.count === 0;
  const needsHomework = hwCount.count === 0;
  const needsEvaluations = evalCount.count === 0;
  const needsRegistrations = regCount.count === 0;

  if (needsFullInit) {
    console.log('\n开始初始化完整示例数据...');
    seedData();
    console.log('完整示例数据初始化完成');
    console.log('\n数据纠偏检查...');
    correctDataInconsistencies();
    console.log('数据纠偏完成\n');
  } else {
    console.log('\n开始增量补充数据...');
    let hasUpdates = false;

    if (needsProjects) {
      seedProjects();
      console.log('  ✓ 培训项目已补充');
      hasUpdates = true;
    }

    if (needsRegistrations) {
      seedProject3Registrations();
      console.log('  ✓ 第3批报名记录已补充');
      hasUpdates = true;
    }

    if (needsCertificates) {
      seedProject3Certificates();
      console.log('  ✓ 第3批证书已补充');
      hasUpdates = true;
    }

    if (needsHomework) {
      seedProject2Homework();
      console.log('  ✓ 作业数据已补充');
      hasUpdates = true;
    }

    if (needsEvaluations) {
      seedEvaluations();
      console.log('  ✓ 效果评估已补充');
      hasUpdates = true;
    }

    if (needsExceptions) {
      seedExceptions();
      console.log('  ✓ 异常数据已补充');
      hasUpdates = true;
    }

    if (hasUpdates) {
      console.log('\n数据纠偏检查...');
      correctDataInconsistencies();
      console.log('数据纠偏完成\n');
    }

    if (!hasUpdates) {
      console.log('  ✓ 数据库数据完整，无需补充\n');
    }
  }
};

function seedData() {
  console.log('seedData 函数被调用');
  
  const insertUser = db.prepare("INSERT INTO users (username, name, role, department, email) VALUES (?, ?, ?, ?, ?)");
  
  const users = [
    { username: 'wangfang', name: '王芳', role: 'training_manager', department: '培训部', email: 'wangfang@company.com' },
    { username: 'zhaoli', name: '赵丽', role: 'department_head', department: '技术部', email: 'zhaoli@company.com' },
    { username: 'liming', name: '李明', role: 'instructor', department: '培训部', email: 'liming@company.com' },
    { username: 'chenwu', name: '陈武', role: 'department_head', department: '市场部', email: 'chenwu@company.com' },
    { username: 'sunmei', name: '孙梅', role: 'instructor', department: '培训部', email: 'sunmei@company.com' },
    { username: 'zhangwei', name: '张伟', role: 'employee', department: '技术部', email: 'zhangwei@company.com' },
    { username: 'liufang', name: '刘芳', role: 'employee', department: '市场部', email: 'liufang@company.com' },
    { username: 'wangqiang', name: '王强', role: 'employee', department: '技术部', email: 'wangqiang@company.com' },
    { username: 'zhaomin', name: '赵敏', role: 'employee', department: '财务部', email: 'zhaomin@company.com' },
    { username: 'sunlei', name: '孙磊', role: 'employee', department: '技术部', email: 'sunlei@company.com' },
    { username: 'zhoutao', name: '周涛', role: 'employee', department: '市场部', email: 'zhoutao@company.com' },
    { username: 'wujing', name: '吴静', role: 'employee', department: '技术部', email: 'wujing@company.com' },
    { username: 'zhenghua', name: '郑华', role: 'employee', department: '财务部', email: 'zhenghua@company.com' },
    { username: 'yangyang', name: '杨洋', role: 'employee', department: '市场部', email: 'yangyang@company.com' },
    { username: 'lintao', name: '林涛', role: 'employee', department: '技术部', email: 'lintao@company.com' },
    { username: 'huangli', name: '黄丽', role: 'employee', department: '财务部', email: 'huangli@company.com' },
    { username: 'xugang', name: '徐刚', role: 'employee', department: '技术部', email: 'xugang@company.com' },
    { username: 'mayan', name: '马艳', role: 'employee', department: '市场部', email: 'mayan@company.com' },
    { username: 'zhulei', name: '朱磊', role: 'employee', department: '技术部', email: 'zhulei@company.com' },
    { username: 'huyun', name: '胡云', role: 'employee', department: '财务部', email: 'huyun@company.com' },
    { username: 'zhanghua', name: '张华', role: 'employee', department: '技术部', email: 'zhanghua@company.com' },
    { username: 'lina', name: '李娜', role: 'employee', department: '市场部', email: 'lina@company.com' },
    { username: 'wanglei', name: '王磊', role: 'employee', department: '技术部', email: 'wanglei@company.com' },
    { username: 'zhaoxue', name: '赵雪', role: 'employee', department: '财务部', email: 'zhaoxue@company.com' },
    { username: 'sunchao', name: '孙超', role: 'employee', department: '市场部', email: 'sunchao@company.com' },
    { username: 'zhoulin', name: '周琳', role: 'employee', department: '技术部', email: 'zhoulin@company.com' },
    { username: 'wuhao', name: '吴昊', role: 'employee', department: '财务部', email: 'wuhao@company.com' },
    { username: 'zhengjian', name: '郑健', role: 'employee', department: '市场部', email: 'zhengjian@company.com' },
    { username: 'yangfan', name: '杨帆', role: 'employee', department: '技术部', email: 'yangfan@company.com' },
    { username: 'linjing', name: '林静', role: 'employee', department: '财务部', email: 'linjing@company.com' },
    { username: 'huangyong', name: '黄勇', role: 'employee', department: '市场部', email: 'huangyong@company.com' },
    { username: 'xumin', name: '徐敏', role: 'employee', department: '技术部', email: 'xumin@company.com' },
    { username: 'machao', name: '马超', role: 'employee', department: '财务部', email: 'machao@company.com' },
    { username: 'zhuli', name: '朱莉', role: 'employee', department: '市场部', email: 'zhuli@company.com' },
    { username: 'hutao', name: '胡涛', role: 'employee', department: '技术部', email: 'hutao@company.com' },
    { username: 'mali', name: '马丽', role: 'employee', department: '财务部', email: 'mali@company.com' },
    { username: 'zhangli', name: '张力', role: 'employee', department: '市场部', email: 'zhangli@company.com' },
    { username: 'limin', name: '李敏', role: 'employee', department: '技术部', email: 'limin@company.com' }
  ];

  for (const user of users) {
    insertUser.run(user.username, user.name, user.role, user.department, user.email);
  }

  const insertProject = db.prepare(`
    INSERT INTO training_projects (name, type, format, instructor_id, instructor_name, start_date, end_date, status, max_participants, description, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const projects = [
    {
      name: '新员工入职培训',
      type: 'required',
      format: 'offline',
      instructor_id: 3,
      instructor_name: '李明',
      start_date: '2024-01-10',
      end_date: '2024-01-12',
      status: 'completed',
      max_participants: 20,
      description: '针对新入职员工的全面培训，包括公司文化、规章制度、岗位技能等'
    },
    {
      name: '中层管理能力提升',
      type: 'required',
      format: 'offline',
      instructor_id: 5,
      instructor_name: '孙梅',
      start_date: '2024-01-20',
      end_date: '2024-01-25',
      status: 'completed',
      max_participants: 25,
      description: '提升中层管理者的领导力、团队管理和战略思维能力'
    },
    {
      name: '技术技能认证培训',
      type: 'elective',
      format: 'hybrid',
      instructor_id: 3,
      instructor_name: '李明',
      start_date: '2024-01-28',
      end_date: '2024-01-30',
      status: 'completed',
      max_participants: 30,
      description: '针对技术人员的专业技能认证培训'
    }
  ];

  for (const project of projects) {
    insertProject.run(
      project.name, project.type, project.format, project.instructor_id, project.instructor_name,
      project.start_date, project.end_date, project.status, project.max_participants, project.description, 1
    );
  }

  const insertReg1 = db.prepare(`
    INSERT INTO training_registrations (project_id, user_id, user_name, user_department, status, absence_reason, check_in_time)
    VALUES (1, ?, ?, ?, ?, ?, datetime('2024-01-10 09:00:00'))
  `);

  const registrations1 = [
    { user_id: 6, user_name: '张伟', user_department: '技术部', status: 'attended' },
    { user_id: 7, user_name: '刘芳', user_department: '市场部', status: 'attended' },
    { user_id: 8, user_name: '王强', user_department: '技术部', status: 'cancelled', absence_reason: '因病取消' },
    { user_id: 9, user_name: '赵敏', user_department: '财务部', status: 'cancelled', absence_reason: '因病取消' },
    { user_id: 10, user_name: '孙磊', user_department: '技术部', status: 'absent', absence_reason: '无故缺席' },
    { user_id: 11, user_name: '周涛', user_department: '市场部', status: 'attended' },
    { user_id: 12, user_name: '吴静', user_department: '技术部', status: 'attended' },
    { user_id: 13, user_name: '郑华', user_department: '财务部', status: 'attended' },
    { user_id: 14, user_name: '杨洋', user_department: '市场部', status: 'attended' },
    { user_id: 15, user_name: '林涛', user_department: '技术部', status: 'attended' },
    { user_id: 16, user_name: '黄丽', user_department: '财务部', status: 'attended' },
    { user_id: 17, user_name: '徐刚', user_department: '技术部', status: 'attended' },
    { user_id: 18, user_name: '马艳', user_department: '市场部', status: 'attended' },
    { user_id: 19, user_name: '朱磊', user_department: '技术部', status: 'attended' },
    { user_id: 20, user_name: '胡云', user_department: '财务部', status: 'attended' }
  ];

  for (const reg of registrations1) {
    insertReg1.run(reg.user_id, reg.user_name, reg.user_department, reg.status, reg.absence_reason || null);
  }

  const insertReg2 = db.prepare(`
    INSERT INTO training_registrations (project_id, user_id, user_name, user_department, status, absence_reason, check_in_time, remarks)
    VALUES (2, ?, ?, ?, ?, ?, datetime('2024-01-20 09:00:00'), ?)
  `);

  const registrations2 = [
    { user_id: 21, user_name: '张华', user_department: '技术部', status: 'attended' },
    { user_id: 22, user_name: '李娜', user_department: '市场部', status: 'attended' },
    { user_id: 23, user_name: '王磊', user_department: '技术部', status: 'cancelled', absence_reason: '项目紧急取消' },
    { user_id: 24, user_name: '赵雪', user_department: '财务部', status: 'attended' },
    { user_id: 25, user_name: '孙超', user_department: '市场部', status: 'attended' },
    { user_id: 26, user_name: '周琳', user_department: '技术部', status: 'attended' },
    { user_id: 27, user_name: '吴昊', user_department: '财务部', status: 'attended' },
    { user_id: 28, user_name: '郑健', user_department: '市场部', status: 'attended', remarks: '迟到30分钟' },
    { user_id: 29, user_name: '杨帆', user_department: '技术部', status: 'attended' },
    { user_id: 30, user_name: '林静', user_department: '财务部', status: 'attended' },
    { user_id: 31, user_name: '黄勇', user_department: '市场部', status: 'attended' },
    { user_id: 32, user_name: '徐敏', user_department: '技术部', status: 'attended' },
    { user_id: 33, user_name: '马超', user_department: '财务部', status: 'attended' },
    { user_id: 34, user_name: '朱莉', user_department: '市场部', status: 'attended' },
    { user_id: 35, user_name: '胡涛', user_department: '技术部', status: 'attended' },
    { user_id: 36, user_name: '马丽', user_department: '财务部', status: 'attended' },
    { user_id: 37, user_name: '张力', user_department: '市场部', status: 'attended' },
    { user_id: 38, user_name: '李敏', user_department: '技术部', status: 'attended' }
  ];

  for (const reg of registrations2) {
    insertReg2.run(reg.user_id, reg.user_name, reg.user_department, reg.status, reg.absence_reason || null, reg.remarks || null);
  }

  const insertCert1 = db.prepare(`
    INSERT INTO certificates (certificate_number, project_id, project_name, user_id, user_name, user_department, status, issue_date, created_by, issued_by)
    VALUES (?, 1, '新员工入职培训', ?, ?, ?, ?, ?, 1, 1)
  `);

  const certificates1 = [
    { user_id: 6, user_name: '张伟', user_department: '技术部', status: 'issued', issue_date: '2024-01-15' },
    { user_id: 7, user_name: '刘芳', user_department: '市场部', status: 'issued', issue_date: '2024-01-15' },
    { user_id: 11, user_name: '周涛', user_department: '市场部', status: 'issued', issue_date: '2024-01-15' },
    { user_id: 12, user_name: '吴静', user_department: '技术部', status: 'issued', issue_date: '2024-01-15' },
    { user_id: 13, user_name: '郑华', user_department: '财务部', status: 'issued', issue_date: '2024-01-15' },
    { user_id: 14, user_name: '杨洋', user_department: '市场部', status: 'issued', issue_date: '2024-01-15' },
    { user_id: 15, user_name: '林涛', user_department: '技术部', status: 'issued', issue_date: '2024-01-15' },
    { user_id: 16, user_name: '黄丽', user_department: '财务部', status: 'issued', issue_date: '2024-01-15' },
    { user_id: 17, user_name: '徐刚', user_department: '技术部', status: 'issued', issue_date: '2024-01-15' },
    { user_id: 18, user_name: '马艳', user_department: '市场部', status: 'issued', issue_date: '2024-01-15' },
    { user_id: 19, user_name: '朱磊', user_department: '技术部', status: 'issued', issue_date: '2024-01-15' },
    { user_id: 20, user_name: '胡云', user_department: '财务部', status: 'issued', issue_date: '2024-01-15' }
  ];

  const insertCertHistory = db.prepare(`
    INSERT INTO certificate_history (certificate_id, action, to_status, from_status, operator_id, operator_name, remark, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (let index = 0; index < certificates1.length; index++) {
    const cert = certificates1[index];
    const certNum = `CERT-2024-${String(index + 1).padStart(4, '0')}`;
    insertCert1.run(certNum, cert.user_id, cert.user_name, cert.user_department, cert.status, cert.issue_date);

    const certId = db.prepare("SELECT last_insert_rowid() as id").get().id;
    insertCertHistory.run(certId, 'auto_generated', 'pending', null, 1, '系统', '培训完成，系统自动生成待发放记录', '2024-01-13 16:00:00');
    insertCertHistory.run(certId, 'created', 'creating', 'pending', 3, '李明', '开始制作证书，检查姓名和身份证信息一致性', '2024-01-13 09:30:00');
    insertCertHistory.run(certId, 'submitted', 'pending_review', 'creating', 3, '李明', '证书制作完成，照片已添加，提交培训经理王芳审核', '2024-01-14 14:20:00');
    insertCertHistory.run(certId, 'approved', 'issued', 'pending_review', 1, '王芳', '审核通过，证书信息与培训记录一致，已发放', '2024-01-15 11:00:00');
  }

  const insertCert2 = db.prepare(`
    INSERT INTO certificates (certificate_number, project_id, project_name, user_id, user_name, user_department, status, correction_reason, created_by)
    VALUES (?, 2, '中层管理能力提升', ?, ?, ?, ?, ?, 5)
  `);

  const certificates2 = [
    { user_id: 21, user_name: '张华', user_department: '技术部', status: 'pending' },
    { user_id: 22, user_name: '李娜', user_department: '市场部', status: 'pending' },
    { user_id: 24, user_name: '赵雪', user_department: '财务部', status: 'pending' },
    { user_id: 25, user_name: '孙超', user_department: '市场部', status: 'pending' },
    { user_id: 26, user_name: '周琳', user_department: '技术部', status: 'pending' },
    { user_id: 27, user_name: '吴昊', user_department: '财务部', status: 'needs_correction', correction_reason: '证书姓名与身份证不符' },
    { user_id: 29, user_name: '杨帆', user_department: '技术部', status: 'pending' },
    { user_id: 30, user_name: '林静', user_department: '财务部', status: 'pending' },
    { user_id: 31, user_name: '黄勇', user_department: '市场部', status: 'pending' },
    { user_id: 32, user_name: '徐敏', user_department: '技术部', status: 'pending' },
    { user_id: 33, user_name: '马超', user_department: '财务部', status: 'pending' },
    { user_id: 34, user_name: '朱莉', user_department: '市场部', status: 'pending' },
    { user_id: 35, user_name: '胡涛', user_department: '技术部', status: 'pending' },
    { user_id: 36, user_name: '马丽', user_department: '财务部', status: 'pending' },
    { user_id: 37, user_name: '张力', user_department: '市场部', status: 'pending' },
    { user_id: 38, user_name: '李敏', user_department: '技术部', status: 'pending' }
  ];

  for (let index = 0; index < certificates2.length; index++) {
    const cert = certificates2[index];
    const certNum = `CERT-2024-${String(index + 13).padStart(4, '0')}`;
    insertCert2.run(certNum, cert.user_id, cert.user_name, cert.user_department, cert.status, cert.correction_reason || null);

    const certId = db.prepare("SELECT last_insert_rowid() as id").get().id;
    insertCertHistory.run(certId, 'auto_generated', 'pending', null, 1, '系统', '系统自动生成待发放记录', '2024-01-26 09:00:00');

    if (cert.status === 'needs_correction') {
      insertCertHistory.run(certId, 'created', 'creating', 'pending', 5, '孙梅', '证书制作中', '2024-01-26 10:30:00');
      insertCertHistory.run(certId, 'submitted', 'pending_review', 'creating', 5, '孙梅', '证书已制作完成，提交审核', '2024-01-26 15:00:00');
      insertCertHistory.run(certId, 'info_error_detected', 'needs_correction', 'pending_review', 1, '王芳', '员工姓名错写，需要修正', '2024-01-26 16:30:00');
    }
  }

  const insertHw = db.prepare(`
    INSERT INTO homework_submissions (project_id, user_id, user_name, status, submission_date)
    VALUES (?, ?, ?, ?, ?)
  `);

  const homeworks = [];
  for (let i = 21; i <= 38; i++) {
    if (i !== 23) {
      const status = [24, 26, 28, 29, 32, 35].includes(i) ? 'late' :
                     [27, 30, 33, 36, 37].includes(i) ? 'not_submitted' : 'submitted';
      const userName = db.prepare("SELECT name FROM users WHERE id = ?").get(i)?.name || '未知';
      homeworks.push({ project_id: 2, user_id: i, user_name: userName, status, submission_date: status === 'late' ? '2024-01-27 23:59:00' : '2024-01-26 18:00:00' });
    }
  }

  for (const hw of homeworks) {
    insertHw.run(hw.project_id, hw.user_id, hw.user_name, hw.status, hw.submission_date);
  }

  const insertEval = db.prepare(`
    INSERT INTO effect_evaluations (project_id, project_name, satisfaction_score, completion_rate, pass_rate, issuance_rate, report_status, frozen_reason, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const evaluations = [
    {
      project_id: 1,
      project_name: '新员工入职培训',
      satisfaction_score: 4.5,
      completion_rate: 80.0,
      pass_rate: 100.0,
      issuance_rate: 100.0,
      report_status: 'published',
      published_at: '2024-01-16 10:00:00'
    },
    {
      project_id: 2,
      project_name: '中层管理能力提升',
      satisfaction_score: null,
      completion_rate: 88.89,
      pass_rate: null,
      issuance_rate: null,
      report_status: 'draft',
      published_at: null
    },
    {
      project_id: 3,
      project_name: '技术技能认证培训',
      satisfaction_score: null,
      completion_rate: 93.33,
      pass_rate: null,
      issuance_rate: null,
      report_status: 'frozen',
      frozen_reason: '存在未解决的证书异常，数据待核查',
      published_at: null
    }
  ];

  for (const eval of evaluations) {
    insertEval.run(eval.project_id, eval.project_name, eval.satisfaction_score, eval.completion_rate, eval.pass_rate, eval.issuance_rate, eval.report_status, eval.frozen_reason || null, eval.published_at);
  }

  const insertExc = db.prepare(`
    INSERT INTO exceptions (exception_number, type, project_id, project_name, description, status, priority, discovered_by, discovered_by_name, assigned_to, assigned_to_name, resolution, resolved_by, resolved_by_name, resolved_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertExcHistory = db.prepare(`
    INSERT INTO exception_history (exception_id, action, operator_id, operator_name, remark, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const exceptions = [
    {
      exception_number: 'EXC-2024-0001',
      type: 'registration_absent',
      project_id: 1,
      project_name: '新员工入职培训',
      description: '员工孙磊报名后无故缺席培训',
      status: 'resolved',
      priority: 'high',
      discovered_by: 1,
      discovered_by_name: '王芳',
      assigned_to: 2,
      assigned_to_name: '赵丽',
      resolution: '已与员工沟通，了解原因是当天家中有急事无法请假。已记入考勤异常，并提醒其后续培训需提前请假',
      resolved_by: 2,
      resolved_by_name: '赵丽',
      resolved_at: '2024-01-12 17:00:00',
      history: [
        { action: 'discovered', operator_id: 1, operator_name: '王芳', remark: '发现孙磊报名后未签到，也未提前请假', time: '2024-01-12 09:15:00' },
        { action: 'assigned', operator_id: 1, operator_name: '王芳', remark: '分配给技术部负责人赵丽跟进', time: '2024-01-12 09:30:00' },
        { action: 'processing_started', operator_id: 2, operator_name: '赵丽', remark: '联系员工孙磊了解情况', time: '2024-01-12 10:00:00' },
        { action: 'resolved', operator_id: 2, operator_name: '赵丽', remark: '员工表示家中有急事，已纳入考勤异常处理', time: '2024-01-12 17:00:00' }
      ]
    },
    {
      exception_number: 'EXC-2024-0002',
      type: 'homework_not_submitted',
      project_id: 2,
      project_name: '中层管理能力提升',
      description: '5名学员课后作业迟交',
      status: 'processing',
      priority: 'medium',
      discovered_by: 1,
      discovered_by_name: '王芳',
      assigned_to: 5,
      assigned_to_name: '孙梅',
      history: [
        { action: 'discovered', operator_id: 1, operator_name: '王芳', remark: '检查作业提交情况，发现5人迟交（31号、34号、37号、40号、41号）', time: '2024-01-27 16:00:00' },
        { action: 'assigned', operator_id: 1, operator_name: '王芳', remark: '分配给讲师孙梅跟进', time: '2024-01-27 16:30:00' },
        { action: 'processing_started', operator_id: 5, operator_name: '孙梅', remark: '正在联系迟交学员了解原因', time: '2024-01-28 09:00:00' }
      ]
    },
    {
      exception_number: 'EXC-2024-0003',
      type: 'certificate_error',
      project_id: 2,
      project_name: '中层管理能力提升',
      description: '员工吴昊的证书姓名与身份证不符',
      status: 'processing',
      priority: 'high',
      discovered_by: 2,
      discovered_by_name: '赵丽',
      assigned_to: 5,
      assigned_to_name: '孙梅',
      history: [
        { action: 'discovered', operator_id: 2, operator_name: '赵丽', remark: '员工吴昊反映证书上的名字与身份证不一致', time: '2024-01-26 16:00:00' },
        { action: 'assigned', operator_id: 2, operator_name: '赵丽', remark: '提交给讲师孙梅重新制作', time: '2024-01-26 16:15:00' },
        { action: 'processing_started', operator_id: 5, operator_name: '孙梅', remark: '正在核对原始报名数据，准备重新制作证书', time: '2024-01-26 16:30:00' }
      ]
    },
    {
      exception_number: 'EXC-2024-0004',
      type: 'registration_absent',
      project_id: 3,
      project_name: '技术技能认证培训',
      description: '2名员工报名后无故缺席',
      status: 'discovered',
      priority: 'high',
      discovered_by: 1,
      discovered_by_name: '王芳',
      history: [
        { action: 'discovered', operator_id: 1, operator_name: '王芳', remark: '发现赵强和钱琳报名后未签到，也未提前取消报名', time: '2024-01-28 09:15:00' }
      ]
    },
    {
      exception_number: 'EXC-2024-0005',
      type: 'certificate_error',
      project_id: 3,
      project_name: '技术技能认证培训',
      description: '发现3张证书信息错误',
      status: 'assigned',
      priority: 'urgent',
      discovered_by: 1,
      discovered_by_name: '王芳',
      assigned_to: 3,
      assigned_to_name: '李明',
      history: [
        { action: 'discovered', operator_id: 1, operator_name: '王芳', remark: '审核证书时发现编号错误、姓名拼写错误、部门信息错误各1张', time: '2024-02-01 09:00:00' },
        { action: 'assigned', operator_id: 1, operator_name: '王芳', remark: '紧急分配给讲师李明处理', time: '2024-02-01 09:30:00' }
      ]
    },
    {
      exception_number: 'EXC-2024-0006',
      type: 'certificate_duplicate',
      project_id: 3,
      project_name: '技术技能认证培训',
      description: '发现疑似重复发放的证书',
      status: 'discovered',
      priority: 'urgent',
      discovered_by: 1,
      discovered_by_name: '王芳',
      history: [
        { action: 'discovered', operator_id: 1, operator_name: '王芳', remark: '系统检测到吴昊的证书存在重复记录，需要核查', time: '2024-02-01 10:00:00' }
      ]
    }
  ];

  for (const exc of exceptions) {
    insertExc.run(
      exc.exception_number, exc.type, exc.project_id, exc.project_name, exc.description,
      exc.status, exc.priority, exc.discovered_by, exc.discovered_by_name,
      exc.assigned_to || null, exc.assigned_to_name || null,
      exc.resolution || null, exc.resolved_by || null, exc.resolved_by_name || null, exc.resolved_at || null
    );

    const excId = db.prepare("SELECT last_insert_rowid() as id").get().id;

    if (exc.history && exc.history.length > 0) {
      for (const h of exc.history) {
        insertExcHistory.run(excId, h.action, h.operator_id, h.operator_name, h.remark, h.time);
      }
    }
  }

  const insertReg3 = db.prepare(`
    INSERT INTO training_registrations (project_id, user_id, user_name, user_department, status, absence_reason, check_in_time)
    VALUES (3, ?, ?, ?, ?, ?, datetime('2024-01-28 09:00:00'))
  `);

  const registrations3 = [
    { user_id: 6, user_name: '张伟', user_department: '技术部', status: 'absent', absence_reason: '无故缺席' },
    { user_id: 7, user_name: '刘芳', user_department: '市场部', status: 'absent', absence_reason: '无故缺席' },
    { user_id: 8, user_name: '王强', user_department: '技术部', status: 'attended' },
    { user_id: 9, user_name: '赵敏', user_department: '财务部', status: 'attended' },
    { user_id: 10, user_name: '孙磊', user_department: '技术部', status: 'attended' },
    { user_id: 11, user_name: '周涛', user_department: '市场部', status: 'attended' },
    { user_id: 12, user_name: '吴静', user_department: '技术部', status: 'attended' },
    { user_id: 13, user_name: '郑华', user_department: '财务部', status: 'attended' },
    { user_id: 14, user_name: '杨洋', user_department: '市场部', status: 'attended' },
    { user_id: 15, user_name: '林涛', user_department: '技术部', status: 'attended' },
    { user_id: 16, user_name: '黄丽', user_department: '财务部', status: 'attended' },
    { user_id: 17, user_name: '徐刚', user_department: '技术部', status: 'attended' },
    { user_id: 18, user_name: '马艳', user_department: '市场部', status: 'attended' },
    { user_id: 19, user_name: '朱磊', user_department: '技术部', status: 'attended' },
    { user_id: 20, user_name: '胡云', user_department: '财务部', status: 'attended' },
    { user_id: 21, user_name: '张华', user_department: '技术部', status: 'attended' },
    { user_id: 22, user_name: '李娜', user_department: '市场部', status: 'attended' },
    { user_id: 23, user_name: '王磊', user_department: '技术部', status: 'attended' },
    { user_id: 24, user_name: '赵雪', user_department: '财务部', status: 'attended' },
    { user_id: 25, user_name: '孙超', user_department: '市场部', status: 'attended' },
    { user_id: 26, user_name: '周琳', user_department: '技术部', status: 'attended' },
    { user_id: 27, user_name: '吴昊', user_department: '财务部', status: 'attended' },
    { user_id: 28, user_name: '郑健', user_department: '市场部', status: 'attended' },
    { user_id: 29, user_name: '杨帆', user_department: '技术部', status: 'attended' },
    { user_id: 30, user_name: '林静', user_department: '财务部', status: 'attended' },
    { user_id: 31, user_name: '黄勇', user_department: '市场部', status: 'attended' },
    { user_id: 32, user_name: '徐敏', user_department: '技术部', status: 'attended' },
    { user_id: 33, user_name: '马超', user_department: '财务部', status: 'attended' },
    { user_id: 34, user_name: '朱莉', user_department: '市场部', status: 'attended' }
  ];

  for (const reg of registrations3) {
    insertReg3.run(reg.user_id, reg.user_name, reg.user_department, reg.status, reg.absence_reason || null);
  }

  const insertCert3 = db.prepare(`
    INSERT INTO certificates (certificate_number, project_id, project_name, user_id, user_name, user_department, status, correction_reason, created_by)
    VALUES (?, 3, '技术技能认证培训', ?, ?, ?, ?, ?, 3)
  `);

  const certificates3 = [
    { user_id: 8, user_name: '王强', user_department: '技术部', status: 'pending' },
    { user_id: 9, user_name: '赵敏', user_department: '财务部', status: 'pending' },
    { user_id: 10, user_name: '孙磊', user_department: '技术部', status: 'pending' },
    { user_id: 11, user_name: '周涛', user_department: '市场部', status: 'pending' },
    { user_id: 12, user_name: '吴静', user_department: '技术部', status: 'pending' },
    { user_id: 13, user_name: '郑华', user_department: '财务部', status: 'pending' },
    { user_id: 14, user_name: '杨洋', user_department: '市场部', status: 'pending' },
    { user_id: 15, user_name: '林涛', user_department: '技术部', status: 'pending' },
    { user_id: 16, user_name: '黄丽', user_department: '财务部', status: 'pending' },
    { user_id: 17, user_name: '徐刚', user_department: '技术部', status: 'pending' },
    { user_id: 18, user_name: '马艳', user_department: '市场部', status: 'needs_correction', correction_reason: '证书编号错误' },
    { user_id: 19, user_name: '朱磊', user_department: '技术部', status: 'needs_correction', correction_reason: '员工姓名拼写错误' },
    { user_id: 20, user_name: '胡云', user_department: '财务部', status: 'needs_correction', correction_reason: '部门信息错误' },
    { user_id: 21, user_name: '张华', user_department: '技术部', status: 'pending' },
    { user_id: 22, user_name: '李娜', user_department: '市场部', status: 'pending' },
    { user_id: 23, user_name: '王磊', user_department: '技术部', status: 'pending' },
    { user_id: 24, user_name: '赵雪', user_department: '财务部', status: 'pending' },
    { user_id: 25, user_name: '孙超', user_department: '市场部', status: 'pending' },
    { user_id: 26, user_name: '周琳', user_department: '技术部', status: 'pending' },
    { user_id: 27, user_name: '吴昊', user_department: '财务部', status: 'pending' },
    { user_id: 28, user_name: '郑健', user_department: '市场部', status: 'pending' },
    { user_id: 29, user_name: '杨帆', user_department: '技术部', status: 'pending' },
    { user_id: 30, user_name: '林静', user_department: '财务部', status: 'pending' },
    { user_id: 31, user_name: '黄勇', user_department: '市场部', status: 'pending' },
    { user_id: 32, user_name: '徐敏', user_department: '技术部', status: 'pending' },
    { user_id: 33, user_name: '马超', user_department: '财务部', status: 'pending' },
    { user_id: 34, user_name: '朱莉', user_department: '市场部', status: 'pending' }
  ];

  for (let index = 0; index < certificates3.length; index++) {
    const cert = certificates3[index];
    const certNum = `CERT-2024-${String(index + 30).padStart(4, '0')}`;
    insertCert3.run(certNum, cert.user_id, cert.user_name, cert.user_department, cert.status, cert.correction_reason || null);

    const certId = db.prepare("SELECT last_insert_rowid() as id").get().id;
    insertCertHistory.run(certId, 'auto_generated', 'pending', null, 1, '系统', '系统自动生成待发放记录', '2024-01-31 09:00:00');

    if (cert.status === 'needs_correction') {
      insertCertHistory.run(certId, 'created', 'creating', 'pending', 3, '李明', '开始制作证书', '2024-01-31 10:30:00');
      insertCertHistory.run(certId, 'submitted', 'pending_review', 'creating', 3, '李明', '证书制作完成，提交审核', '2024-01-31 16:00:00');
      insertCertHistory.run(certId, 'info_error_detected', 'needs_correction', 'pending_review', 1, '王芳', cert.correction_reason, '2024-02-01 09:30:00');
    }
  }

  const homeworks3 = [];
  for (let i = 8; i <= 34; i++) {
    if (i !== 6 && i !== 7) {
      const status = [10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34].includes(i) ? 'late' : 'submitted';
      const userName = db.prepare("SELECT name FROM users WHERE id = ?").get(i)?.name || '未知';
      homeworks3.push({ project_id: 3, user_id: i, user_name: userName, status, submission_date: status === 'late' ? '2024-01-31 23:59:00' : '2024-01-30 18:00:00' });
    }
  }

  for (const hw of homeworks3) {
    insertHw.run(hw.project_id, hw.user_id, hw.user_name, hw.status, hw.submission_date);
  }

  const additionalExceptions = [
    {
      exception_number: 'EXC-2024-0007',
      type: 'homework_not_submitted',
      project_id: 3,
      project_name: '技术技能认证培训',
      description: '12名学员未提交课后作业',
      status: 'assigned',
      priority: 'high',
      discovered_by: 1,
      discovered_by_name: '王芳',
      assigned_to: 3,
      assigned_to_name: '李明',
      history: [
        { action: 'discovered', operator_id: 1, operator_name: '王芳', remark: '截止日期后检查作业提交情况，发现12人未提交', time: '2024-02-01 10:00:00' },
        { action: 'assigned', operator_id: 1, operator_name: '王芳', remark: '分配给讲师李明跟进催促', time: '2024-02-01 11:00:00' }
      ]
    },
    {
      exception_number: 'EXC-2024-0008',
      type: 'certificate_missed',
      project_id: 3,
      project_name: '技术技能认证培训',
      description: '2名缺席学员的证书需要特别处理',
      status: 'discovered',
      priority: 'medium',
      discovered_by: 1,
      discovered_by_name: '王芳',
      history: [
        { action: 'discovered', operator_id: 1, operator_name: '王芳', remark: '发现缺席学员赵强和钱琳的证书状态需要人工判断处理', time: '2024-02-01 10:30:00' }
      ]
    }
  ];

  for (const exc of additionalExceptions) {
    insertExc.run(
      exc.exception_number, exc.type, exc.project_id, exc.project_name, exc.description,
      exc.status, exc.priority, exc.discovered_by, exc.discovered_by_name,
      exc.assigned_to || null, exc.assigned_to_name || null,
      exc.resolution || null, exc.resolved_by || null, exc.resolved_by_name || null, exc.resolved_at || null
    );

    const excId = db.prepare("SELECT last_insert_rowid() as id").get().id;

    if (exc.history && exc.history.length > 0) {
      for (const h of exc.history) {
        insertExcHistory.run(excId, h.action, h.operator_id, h.operator_name, h.remark, h.time);
      }
    }
  }

  console.log('示例数据初始化完成');
}

function seedProjects() {
  const insertProject = db.prepare(`
    INSERT INTO training_projects (name, type, format, instructor_id, instructor_name, start_date, end_date, status, max_participants, description, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const projects = [
    {
      name: '新员工入职培训',
      type: 'required',
      format: 'offline',
      instructor_id: 3,
      instructor_name: '李明',
      start_date: '2024-01-10',
      end_date: '2024-01-12',
      status: 'completed',
      max_participants: 20,
      description: '针对新入职员工的全面培训，包括公司文化、规章制度、岗位技能等'
    },
    {
      name: '中层管理能力提升',
      type: 'required',
      format: 'offline',
      instructor_id: 5,
      instructor_name: '孙梅',
      start_date: '2024-01-20',
      end_date: '2024-01-25',
      status: 'completed',
      max_participants: 25,
      description: '提升中层管理者的领导力、团队管理和战略思维能力'
    },
    {
      name: '技术技能认证培训',
      type: 'elective',
      format: 'hybrid',
      instructor_id: 3,
      instructor_name: '李明',
      start_date: '2024-01-28',
      end_date: '2024-01-30',
      status: 'completed',
      max_participants: 30,
      description: '针对技术人员的专业技能认证培训'
    }
  ];

  for (const project of projects) {
    insertProject.run(
      project.name, project.type, project.format, project.instructor_id, project.instructor_name,
      project.start_date, project.end_date, project.status, project.max_participants, project.description, 1
    );
  }
}

function seedRegistrations() {
  const insertReg1 = db.prepare(`
    INSERT INTO training_registrations (project_id, user_id, user_name, user_department, status, absence_reason, check_in_time)
    VALUES (1, ?, ?, ?, ?, ?, datetime('2024-01-10 09:00:00'))
  `);

  const registrations1 = [
    { user_id: 6, user_name: '张伟', user_department: '技术部', status: 'attended' },
    { user_id: 7, user_name: '刘芳', user_department: '市场部', status: 'attended' },
    { user_id: 8, user_name: '王强', user_department: '技术部', status: 'cancelled', absence_reason: '因病取消' },
    { user_id: 9, user_name: '赵敏', user_department: '财务部', status: 'cancelled', absence_reason: '因病取消' },
    { user_id: 10, user_name: '孙磊', user_department: '技术部', status: 'absent', absence_reason: '无故缺席' },
    { user_id: 11, user_name: '周涛', user_department: '市场部', status: 'attended' },
    { user_id: 12, user_name: '吴静', user_department: '技术部', status: 'attended' },
    { user_id: 13, user_name: '郑华', user_department: '财务部', status: 'attended' },
    { user_id: 14, user_name: '杨洋', user_department: '市场部', status: 'attended' },
    { user_id: 15, user_name: '林涛', user_department: '技术部', status: 'attended' },
    { user_id: 16, user_name: '黄丽', user_department: '财务部', status: 'attended' },
    { user_id: 17, user_name: '徐刚', user_department: '技术部', status: 'attended' },
    { user_id: 18, user_name: '马艳', user_department: '市场部', status: 'attended' },
    { user_id: 19, user_name: '朱磊', user_department: '技术部', status: 'attended' },
    { user_id: 20, user_name: '胡云', user_department: '财务部', status: 'attended' }
  ];

  for (const reg of registrations1) {
    insertReg1.run(reg.user_id, reg.user_name, reg.user_department, reg.status, reg.absence_reason || null);
  }

  const insertReg2 = db.prepare(`
    INSERT INTO training_registrations (project_id, user_id, user_name, user_department, status, absence_reason, check_in_time, remarks)
    VALUES (2, ?, ?, ?, ?, ?, datetime('2024-01-20 09:00:00'), ?)
  `);

  const registrations2 = [
    { user_id: 21, user_name: '张华', user_department: '技术部', status: 'attended' },
    { user_id: 22, user_name: '李娜', user_department: '市场部', status: 'attended' },
    { user_id: 23, user_name: '王磊', user_department: '技术部', status: 'cancelled', absence_reason: '项目紧急取消' },
    { user_id: 24, user_name: '赵雪', user_department: '财务部', status: 'attended' },
    { user_id: 25, user_name: '孙超', user_department: '市场部', status: 'attended' },
    { user_id: 26, user_name: '周琳', user_department: '技术部', status: 'attended' },
    { user_id: 27, user_name: '吴昊', user_department: '财务部', status: 'attended' },
    { user_id: 28, user_name: '郑健', user_department: '市场部', status: 'attended', remarks: '迟到30分钟' },
    { user_id: 29, user_name: '杨帆', user_department: '技术部', status: 'attended' },
    { user_id: 30, user_name: '林静', user_department: '财务部', status: 'attended' },
    { user_id: 31, user_name: '黄勇', user_department: '市场部', status: 'attended' },
    { user_id: 32, user_name: '徐敏', user_department: '技术部', status: 'attended' },
    { user_id: 33, user_name: '马超', user_department: '财务部', status: 'attended' },
    { user_id: 34, user_name: '朱莉', user_department: '市场部', status: 'attended' },
    { user_id: 35, user_name: '胡涛', user_department: '技术部', status: 'attended' },
    { user_id: 36, user_name: '马丽', user_department: '财务部', status: 'attended' },
    { user_id: 37, user_name: '张力', user_department: '市场部', status: 'attended' },
    { user_id: 38, user_name: '李敏', user_department: '技术部', status: 'attended' }
  ];

  for (const reg of registrations2) {
    insertReg2.run(reg.user_id, reg.user_name, reg.user_department, reg.status, reg.absence_reason || null, reg.remarks || null);
  }
}

function seedCertificates() {
  const insertCert1 = db.prepare(`
    INSERT INTO certificates (certificate_number, project_id, project_name, user_id, user_name, user_department, status, issue_date, created_by, issued_by)
    VALUES (?, 1, '新员工入职培训', ?, ?, ?, ?, ?, 1, 1)
  `);

  const insertCertHistory = db.prepare(`
    INSERT INTO certificate_history (certificate_id, action, to_status, from_status, operator_id, operator_name, remark, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const certificates1 = [
    { user_id: 6, user_name: '张伟', user_department: '技术部', status: 'issued', issue_date: '2024-01-15' },
    { user_id: 7, user_name: '刘芳', user_department: '市场部', status: 'issued', issue_date: '2024-01-15' },
    { user_id: 11, user_name: '周涛', user_department: '市场部', status: 'issued', issue_date: '2024-01-15' },
    { user_id: 12, user_name: '吴静', user_department: '技术部', status: 'issued', issue_date: '2024-01-15' },
    { user_id: 13, user_name: '郑华', user_department: '财务部', status: 'issued', issue_date: '2024-01-15' },
    { user_id: 14, user_name: '杨洋', user_department: '市场部', status: 'issued', issue_date: '2024-01-15' },
    { user_id: 15, user_name: '林涛', user_department: '技术部', status: 'issued', issue_date: '2024-01-15' },
    { user_id: 16, user_name: '黄丽', user_department: '财务部', status: 'issued', issue_date: '2024-01-15' },
    { user_id: 17, user_name: '徐刚', user_department: '技术部', status: 'issued', issue_date: '2024-01-15' },
    { user_id: 18, user_name: '马艳', user_department: '市场部', status: 'issued', issue_date: '2024-01-15' },
    { user_id: 19, user_name: '朱磊', user_department: '技术部', status: 'issued', issue_date: '2024-01-15' },
    { user_id: 20, user_name: '胡云', user_department: '财务部', status: 'issued', issue_date: '2024-01-15' }
  ];

  for (let index = 0; index < certificates1.length; index++) {
    const cert = certificates1[index];
    const certNum = `CERT-2024-${String(index + 1).padStart(4, '0')}`;
    insertCert1.run(certNum, cert.user_id, cert.user_name, cert.user_department, cert.status, cert.issue_date);

    const certId = db.prepare("SELECT last_insert_rowid() as id").get().id;
    insertCertHistory.run(certId, 'auto_generated', 'pending', null, 1, '系统', '培训完成，系统自动生成待发放记录', '2024-01-13 16:00:00');
    insertCertHistory.run(certId, 'created', 'creating', 'pending', 3, '李明', '开始制作证书，检查姓名和身份证信息一致性', '2024-01-13 09:30:00');
    insertCertHistory.run(certId, 'submitted', 'pending_review', 'creating', 3, '李明', '证书制作完成，照片已添加，提交培训经理王芳审核', '2024-01-14 14:20:00');
    insertCertHistory.run(certId, 'approved', 'issued', 'pending_review', 1, '王芳', '审核通过，证书信息与培训记录一致，已发放', '2024-01-15 11:00:00');
  }
}

function seedHomework() {
  const insertHw = db.prepare(`
    INSERT INTO homework_submissions (project_id, user_id, user_name, status, submission_date)
    VALUES (?, ?, ?, ?, ?)
  `);

  const homeworks = [];
  for (let i = 21; i <= 38; i++) {
    if (i !== 23) {
      const status = [24, 26, 28, 29, 32, 35].includes(i) ? 'late' :
                     [27, 30, 33, 36, 37].includes(i) ? 'not_submitted' : 'submitted';
      const userName = db.prepare("SELECT name FROM users WHERE id = ?").get(i)?.name || '未知';
      homeworks.push({ project_id: 2, user_id: i, user_name: userName, status, submission_date: status === 'late' ? '2024-01-27 23:59:00' : '2024-01-26 18:00:00' });
    }
  }

  for (const hw of homeworks) {
    insertHw.run(hw.project_id, hw.user_id, hw.user_name, hw.status, hw.submission_date);
  }
}

function seedEvaluations() {
  const insertEval = db.prepare(`
    INSERT INTO effect_evaluations (project_id, project_name, satisfaction_score, completion_rate, pass_rate, issuance_rate, report_status, frozen_reason, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const evaluations = [
    {
      project_id: 1,
      project_name: '新员工入职培训',
      satisfaction_score: 4.5,
      completion_rate: 80.0,
      pass_rate: 100.0,
      issuance_rate: 100.0,
      report_status: 'published',
      published_at: '2024-01-16 10:00:00'
    },
    {
      project_id: 2,
      project_name: '中层管理能力提升',
      satisfaction_score: null,
      completion_rate: 88.89,
      pass_rate: null,
      issuance_rate: null,
      report_status: 'draft',
      published_at: null
    },
    {
      project_id: 3,
      project_name: '技术技能认证培训',
      satisfaction_score: null,
      completion_rate: 93.33,
      pass_rate: null,
      issuance_rate: null,
      report_status: 'frozen',
      frozen_reason: '存在未解决的证书异常，数据待核查',
      published_at: null
    }
  ];

  for (const eval of evaluations) {
    insertEval.run(eval.project_id, eval.project_name, eval.satisfaction_score, eval.completion_rate, eval.pass_rate, eval.issuance_rate, eval.report_status, eval.frozen_reason || null, eval.published_at);
  }
}

function seedExceptions() {
  const insertExc = db.prepare(`
    INSERT INTO exceptions (exception_number, type, project_id, project_name, description, status, priority, discovered_by, discovered_by_name, assigned_to, assigned_to_name, resolution, resolved_by, resolved_by_name, resolved_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertExcHistory = db.prepare(`
    INSERT INTO exception_history (exception_id, action, operator_id, operator_name, remark, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const exceptions = [
    {
      exception_number: 'EXC-2024-0001',
      type: 'registration_absent',
      project_id: 1,
      project_name: '新员工入职培训',
      description: '员工孙磊报名后无故缺席培训',
      status: 'resolved',
      priority: 'high',
      discovered_by: 1,
      discovered_by_name: '王芳',
      assigned_to: 2,
      assigned_to_name: '赵丽',
      resolution: '已与员工沟通，了解原因是当天家中有急事无法请假。已记入考勤异常，并提醒其后续培训需提前请假',
      resolved_by: 2,
      resolved_by_name: '赵丽',
      resolved_at: '2024-01-12 17:00:00',
      history: [
        { action: 'discovered', operator_id: 1, operator_name: '王芳', remark: '发现孙磊报名后未签到，也未提前请假', time: '2024-01-12 09:15:00' },
        { action: 'assigned', operator_id: 1, operator_name: '王芳', remark: '分配给技术部负责人赵丽跟进', time: '2024-01-12 09:30:00' },
        { action: 'processing_started', operator_id: 2, operator_name: '赵丽', remark: '联系员工孙磊了解情况', time: '2024-01-12 10:00:00' },
        { action: 'resolved', operator_id: 2, operator_name: '赵丽', remark: '员工表示家中有急事，已纳入考勤异常处理', time: '2024-01-12 17:00:00' }
      ]
    },
    {
      exception_number: 'EXC-2024-0002',
      type: 'homework_not_submitted',
      project_id: 2,
      project_name: '中层管理能力提升',
      description: '5名学员课后作业迟交',
      status: 'processing',
      priority: 'medium',
      discovered_by: 1,
      discovered_by_name: '王芳',
      assigned_to: 5,
      assigned_to_name: '孙梅',
      history: [
        { action: 'discovered', operator_id: 1, operator_name: '王芳', remark: '检查作业提交情况，发现5人迟交（27号、30号、33号、36号、37号）', time: '2024-01-27 16:00:00' },
        { action: 'assigned', operator_id: 1, operator_name: '王芳', remark: '分配给讲师孙梅跟进', time: '2024-01-27 16:30:00' },
        { action: 'processing_started', operator_id: 5, operator_name: '孙梅', remark: '正在联系迟交学员了解原因', time: '2024-01-28 09:00:00' }
      ]
    },
    {
      exception_number: 'EXC-2024-0003',
      type: 'certificate_error',
      project_id: 2,
      project_name: '中层管理能力提升',
      description: '员工吴昊的证书姓名与身份证不符',
      status: 'processing',
      priority: 'high',
      discovered_by: 2,
      discovered_by_name: '赵丽',
      assigned_to: 5,
      assigned_to_name: '孙梅',
      history: [
        { action: 'discovered', operator_id: 2, operator_name: '赵丽', remark: '员工吴昊反映证书上的名字与身份证不一致', time: '2024-01-26 16:00:00' },
        { action: 'assigned', operator_id: 2, operator_name: '赵丽', remark: '提交给讲师孙梅重新制作', time: '2024-01-26 16:15:00' },
        { action: 'processing_started', operator_id: 5, operator_name: '孙梅', remark: '正在核对原始报名数据，准备重新制作证书', time: '2024-01-26 16:30:00' }
      ]
    },
    {
      exception_number: 'EXC-2024-0004',
      type: 'registration_absent',
      project_id: 3,
      project_name: '技术技能认证培训',
      description: '2名员工报名后无故缺席',
      status: 'discovered',
      priority: 'high',
      discovered_by: 1,
      discovered_by_name: '王芳',
      history: [
        { action: 'discovered', operator_id: 1, operator_name: '王芳', remark: '发现2名员工报名后未签到，也未提前取消报名', time: '2024-01-28 09:15:00' }
      ]
    },
    {
      exception_number: 'EXC-2024-0005',
      type: 'certificate_error',
      project_id: 3,
      project_name: '技术技能认证培训',
      description: '发现3张证书信息错误',
      status: 'assigned',
      priority: 'urgent',
      discovered_by: 1,
      discovered_by_name: '王芳',
      assigned_to: 3,
      assigned_to_name: '李明',
      history: [
        { action: 'discovered', operator_id: 1, operator_name: '王芳', remark: '审核证书时发现编号错误、姓名拼写错误、部门信息错误各1张', time: '2024-02-01 09:00:00' },
        { action: 'assigned', operator_id: 1, operator_name: '王芳', remark: '紧急分配给讲师李明处理', time: '2024-02-01 09:30:00' }
      ]
    },
    {
      exception_number: 'EXC-2024-0006',
      type: 'certificate_duplicate',
      project_id: 3,
      project_name: '技术技能认证培训',
      description: '发现疑似重复发放的证书',
      status: 'discovered',
      priority: 'urgent',
      discovered_by: 1,
      discovered_by_name: '王芳',
      history: [
        { action: 'discovered', operator_id: 1, operator_name: '王芳', remark: '系统检测到证书存在重复记录，需要核查', time: '2024-02-01 10:00:00' }
      ]
    },
    {
      exception_number: 'EXC-2024-0007',
      type: 'homework_not_submitted',
      project_id: 3,
      project_name: '技术技能认证培训',
      description: '12名学员未提交课后作业',
      status: 'assigned',
      priority: 'high',
      discovered_by: 1,
      discovered_by_name: '王芳',
      assigned_to: 3,
      assigned_to_name: '李明',
      history: [
        { action: 'discovered', operator_id: 1, operator_name: '王芳', remark: '截止日期后检查作业提交情况，发现12人未提交', time: '2024-02-01 10:00:00' },
        { action: 'assigned', operator_id: 1, operator_name: '王芳', remark: '分配给讲师李明跟进催促', time: '2024-02-01 11:00:00' }
      ]
    },
    {
      exception_number: 'EXC-2024-0008',
      type: 'certificate_missed',
      project_id: 3,
      project_name: '技术技能认证培训',
      description: '2名缺席学员的证书需要特别处理',
      status: 'discovered',
      priority: 'medium',
      discovered_by: 1,
      discovered_by_name: '王芳',
      history: [
        { action: 'discovered', operator_id: 1, operator_name: '王芳', remark: '发现缺席学员的证书状态需要人工判断处理', time: '2024-02-01 10:30:00' }
      ]
    }
  ];

  for (const exc of exceptions) {
    insertExc.run(
      exc.exception_number, exc.type, exc.project_id, exc.project_name, exc.description,
      exc.status, exc.priority, exc.discovered_by, exc.discovered_by_name,
      exc.assigned_to || null, exc.assigned_to_name || null,
      exc.resolution || null, exc.resolved_by || null, exc.resolved_by_name || null, exc.resolved_at || null
    );

    const excId = db.prepare("SELECT last_insert_rowid() as id").get().id;

    if (exc.history && exc.history.length > 0) {
      for (const h of exc.history) {
        insertExcHistory.run(excId, h.action, h.operator_id, h.operator_name, h.remark, h.time);
      }
    }
  }
}

function seedProject3Registrations() {
  const insertReg = db.prepare(`
    INSERT INTO training_registrations (project_id, user_id, user_name, user_department, status, absence_reason, check_in_time)
    VALUES (?, ?, ?, ?, ?, ?, datetime('2024-01-28 09:00:00'))
  `);

  const registrations3 = [
    { user_id: 6, user_name: '张伟', user_department: '技术部', status: 'absent', absence_reason: '无故缺席' },
    { user_id: 7, user_name: '刘芳', user_department: '市场部', status: 'absent', absence_reason: '无故缺席' },
    { user_id: 8, user_name: '王强', user_department: '技术部', status: 'attended' },
    { user_id: 9, user_name: '赵敏', user_department: '财务部', status: 'attended' },
    { user_id: 10, user_name: '孙磊', user_department: '技术部', status: 'attended' },
    { user_id: 11, user_name: '周涛', user_department: '市场部', status: 'attended' },
    { user_id: 12, user_name: '吴静', user_department: '技术部', status: 'attended' },
    { user_id: 13, user_name: '郑华', user_department: '财务部', status: 'attended' },
    { user_id: 14, user_name: '杨洋', user_department: '市场部', status: 'attended' },
    { user_id: 15, user_name: '林涛', user_department: '技术部', status: 'attended' },
    { user_id: 16, user_name: '黄丽', user_department: '财务部', status: 'attended' },
    { user_id: 17, user_name: '徐刚', user_department: '技术部', status: 'attended' },
    { user_id: 18, user_name: '马艳', user_department: '市场部', status: 'attended' },
    { user_id: 19, user_name: '朱磊', user_department: '技术部', status: 'attended' },
    { user_id: 20, user_name: '胡云', user_department: '财务部', status: 'attended' },
    { user_id: 21, user_name: '张华', user_department: '技术部', status: 'attended' },
    { user_id: 22, user_name: '李娜', user_department: '市场部', status: 'attended' },
    { user_id: 23, user_name: '王磊', user_department: '技术部', status: 'attended' },
    { user_id: 24, user_name: '赵雪', user_department: '财务部', status: 'attended' },
    { user_id: 25, user_name: '孙超', user_department: '市场部', status: 'attended' },
    { user_id: 26, user_name: '周琳', user_department: '技术部', status: 'attended' },
    { user_id: 27, user_name: '吴昊', user_department: '财务部', status: 'attended' },
    { user_id: 28, user_name: '郑健', user_department: '市场部', status: 'attended' },
    { user_id: 29, user_name: '杨帆', user_department: '技术部', status: 'attended' },
    { user_id: 30, user_name: '林静', user_department: '财务部', status: 'attended' },
    { user_id: 31, user_name: '黄勇', user_department: '市场部', status: 'attended' },
    { user_id: 32, user_name: '徐敏', user_department: '技术部', status: 'attended' },
    { user_id: 33, user_name: '马超', user_department: '财务部', status: 'attended' },
    { user_id: 34, user_name: '朱莉', user_department: '市场部', status: 'attended' }
  ];

  for (const reg of registrations3) {
    insertReg.run(reg.user_id, reg.user_name, reg.user_department, reg.status, reg.absence_reason || null);
  }
}

function seedProject3Certificates() {
  const insertCert = db.prepare(`
    INSERT INTO certificates (certificate_number, project_id, project_name, user_id, user_name, user_department, status, correction_reason, created_by)
    VALUES (?, 3, '技术技能认证培训', ?, ?, ?, ?, ?, 3)
  `);

  const insertCertHistory = db.prepare(`
    INSERT INTO certificate_history (certificate_id, action, to_status, from_status, operator_id, operator_name, remark, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const certificates3 = [
    { user_id: 8, user_name: '王强', user_department: '技术部', status: 'pending' },
    { user_id: 9, user_name: '赵敏', user_department: '财务部', status: 'pending' },
    { user_id: 10, user_name: '孙磊', user_department: '技术部', status: 'pending' },
    { user_id: 11, user_name: '周涛', user_department: '市场部', status: 'pending' },
    { user_id: 12, user_name: '吴静', user_department: '技术部', status: 'pending' },
    { user_id: 13, user_name: '郑华', user_department: '财务部', status: 'pending' },
    { user_id: 14, user_name: '杨洋', user_department: '市场部', status: 'pending' },
    { user_id: 15, user_name: '林涛', user_department: '技术部', status: 'pending' },
    { user_id: 16, user_name: '黄丽', user_department: '财务部', status: 'pending' },
    { user_id: 17, user_name: '徐刚', user_department: '技术部', status: 'pending' },
    { user_id: 18, user_name: '马艳', user_department: '市场部', status: 'needs_correction', correction_reason: '证书编号错误' },
    { user_id: 19, user_name: '朱磊', user_department: '技术部', status: 'needs_correction', correction_reason: '员工姓名拼写错误' },
    { user_id: 20, user_name: '胡云', user_department: '财务部', status: 'needs_correction', correction_reason: '部门信息错误' },
    { user_id: 21, user_name: '张华', user_department: '技术部', status: 'pending' },
    { user_id: 22, user_name: '李娜', user_department: '市场部', status: 'pending' },
    { user_id: 23, user_name: '王磊', user_department: '技术部', status: 'pending' },
    { user_id: 24, user_name: '赵雪', user_department: '财务部', status: 'pending' },
    { user_id: 25, user_name: '孙超', user_department: '市场部', status: 'pending' },
    { user_id: 26, user_name: '周琳', user_department: '技术部', status: 'pending' },
    { user_id: 27, user_name: '吴昊', user_department: '财务部', status: 'pending' },
    { user_id: 28, user_name: '郑健', user_department: '市场部', status: 'pending' },
    { user_id: 29, user_name: '杨帆', user_department: '技术部', status: 'pending' },
    { user_id: 30, user_name: '林静', user_department: '财务部', status: 'pending' },
    { user_id: 31, user_name: '黄勇', user_department: '市场部', status: 'pending' },
    { user_id: 32, user_name: '徐敏', user_department: '技术部', status: 'pending' },
    { user_id: 33, user_name: '马超', user_department: '财务部', status: 'pending' },
    { user_id: 34, user_name: '朱莉', user_department: '市场部', status: 'pending' }
  ];

  for (let index = 0; index < certificates3.length; index++) {
    const cert = certificates3[index];
    const certNum = `CERT-2024-${String(index + 30).padStart(4, '0')}`;
    insertCert.run(certNum, cert.user_id, cert.user_name, cert.user_department, cert.status, cert.correction_reason || null);

    const certId = db.prepare("SELECT last_insert_rowid() as id").get().id;
    insertCertHistory.run(certId, 'auto_generated', 'pending', null, 1, '系统', '系统自动生成待发放记录', '2024-01-31 09:00:00');

    if (cert.status === 'needs_correction') {
      insertCertHistory.run(certId, 'created', 'creating', 'pending', 3, '李明', '开始制作证书', '2024-01-31 10:30:00');
      insertCertHistory.run(certId, 'submitted', 'pending_review', 'creating', 3, '李明', '证书制作完成，提交审核', '2024-01-31 16:00:00');
      insertCertHistory.run(certId, 'info_error_detected', 'needs_correction', 'pending_review', 1, '王芳', cert.correction_reason, '2024-02-01 09:30:00');
    }
  }
}

function seedProject2Homework() {
  const insertHw = db.prepare(`
    INSERT INTO homework_submissions (project_id, user_id, user_name, status, submission_date)
    VALUES (?, ?, ?, ?, ?)
  `);

  const homeworks = [];
  for (let i = 21; i <= 38; i++) {
    if (i !== 23) {
      const status = [24, 26, 28, 29, 32, 35].includes(i) ? 'late' :
                     [27, 30, 33, 36, 37].includes(i) ? 'not_submitted' : 'submitted';
      const userName = db.prepare("SELECT name FROM users WHERE id = ?").get(i)?.name || '未知';
      homeworks.push({ project_id: 2, user_id: i, user_name: userName, status, submission_date: status === 'late' ? '2024-01-27 23:59:00' : '2024-01-26 18:00:00' });
    }
  }

  for (const hw of homeworks) {
    insertHw.run(hw.project_id, hw.user_id, hw.user_name, hw.status, hw.submission_date);
  }
}

function correctDataInconsistencies() {
  console.log('  开始数据一致性检查...');

  const certificates = db.prepare('SELECT id, user_id, user_name, user_department FROM certificates').all();
  const users = db.prepare('SELECT id, name, department FROM users').all();
  const userMap = new Map(users.map(u => [u.id, u]));

  let correctedCerts = 0;
  for (const cert of certificates) {
    const user = userMap.get(cert.user_id);
    if (user && (cert.user_name !== user.name || cert.user_department !== user.department)) {
      db.prepare('UPDATE certificates SET user_name = ?, user_department = ? WHERE id = ?')
        .run(user.name, user.department, cert.id);
      correctedCerts++;
    }
  }
  if (correctedCerts > 0) {
    console.log(`    修正了 ${correctedCerts} 条证书的员工姓名和部门信息`);
  }

  const registrations = db.prepare('SELECT id, user_id, user_name, user_department FROM training_registrations').all();
  let correctedRegs = 0;
  for (const reg of registrations) {
    const user = userMap.get(reg.user_id);
    if (user && (reg.user_name !== user.name || reg.user_department !== user.department)) {
      db.prepare('UPDATE training_registrations SET user_name = ?, user_department = ? WHERE id = ?')
        .run(user.name, user.department, reg.id);
      correctedRegs++;
    }
  }
  if (correctedRegs > 0) {
    console.log(`    修正了 ${correctedRegs} 条报名记录的员工姓名和部门信息`);
  }

  const certExceptions = db.prepare("SELECT id, type, description FROM exceptions WHERE type LIKE 'certificate_%' AND related_id IS NULL").all();
  let linkedExcs = 0;
  for (const exc of certExceptions) {
    const descMatch = exc.description.match(/员工(\S+)的证书/);
    if (descMatch) {
      const userName = descMatch[1];
      const user = users.find(u => u.name === userName);
      if (user) {
        const cert = db.prepare('SELECT id FROM certificates WHERE user_id = ?').get(user.id);
        if (cert) {
          db.prepare('UPDATE exceptions SET related_id = ?, related_type = ?, description = description || \' [证书ID: \' || ? || \', 员工: \' || ? || \', 部门: \' || ? || \']\' WHERE id = ?')
            .run(cert.id, 'certificate', cert.id, user.name, user.department, exc.id);
          linkedExcs++;
        }
      }
    }
  }
  if (linkedExcs > 0) {
    console.log(`    补充了 ${linkedExcs} 条证书异常的关联信息`);
  }

  const exceptions = db.prepare('SELECT id, related_id, related_type FROM exceptions WHERE related_id IS NOT NULL').all();
  let correctedExcs = 0;
  for (const exc of exceptions) {
    if (exc.related_type === 'certificate') {
      const cert = db.prepare('SELECT user_name, user_department FROM certificates WHERE id = ?').get(exc.related_id);
      if (cert) {
        db.prepare('UPDATE exceptions SET description = description || \' [员工: \' || ? || \', 部门: \' || ? || \']\' WHERE id = ?')
          .run(cert.user_name, cert.user_department, exc.id);
        correctedExcs++;
      }
    }
  }
  if (correctedExcs > 0) {
    console.log(`    补充了 ${correctedExcs} 条异常的关联员工信息`);
  }

  console.log('  数据一致性检查完成');
}

module.exports = db;