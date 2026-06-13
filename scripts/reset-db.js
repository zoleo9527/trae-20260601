const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require(path.join(__dirname, '../backend/node_modules/bcrypt'));
const fs = require('fs');

const dbPath = path.join(__dirname, '../backend/database/training.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.exec(`
  DROP TABLE IF EXISTS notification_log;
  DROP TABLE IF EXISTS notification;
  DROP TABLE IF EXISTS status_change_history;
  DROP TABLE IF EXISTS student;
  DROP TABLE IF EXISTS course_project;
  DROP TABLE IF EXISTS training_need_remark;
  DROP TABLE IF EXISTS training_need;
  DROP TABLE IF EXISTS user;

  CREATE TABLE user (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    department VARCHAR(100),
    role VARCHAR(20) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE training_need (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    department VARCHAR(100) NOT NULL,
    submitter_id VARCHAR(36) NOT NULL,
    current_handler_id VARCHAR(36),
    expected_date DATE NOT NULL,
    participant_count INTEGER DEFAULT 0,
    budget DECIMAL(10, 2),
    urgency VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'pending',
    attachments TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submitter_id) REFERENCES user(id),
    FOREIGN KEY (current_handler_id) REFERENCES user(id)
  );

  CREATE TABLE training_need_remark (
    id VARCHAR(36) PRIMARY KEY,
    training_need_id VARCHAR(36) NOT NULL,
    handler_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    action VARCHAR(20) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (training_need_id) REFERENCES training_need(id),
    FOREIGN KEY (handler_id) REFERENCES user(id)
  );

  CREATE TABLE course_project (
    id VARCHAR(36) PRIMARY KEY,
    training_need_id VARCHAR(36) NOT NULL,
    instructor_id VARCHAR(36) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    objectives TEXT,
    outline TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    location VARCHAR(200),
    enrollment_deadline DATETIME,
    max_participants INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (training_need_id) REFERENCES training_need(id),
    FOREIGN KEY (instructor_id) REFERENCES user(id)
  );

  CREATE TABLE student (
    id VARCHAR(36) PRIMARY KEY,
    course_project_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    status VARCHAR(20) DEFAULT 'enrolled',
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    attended_at DATETIME,
    absent_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_project_id) REFERENCES course_project(id),
    FOREIGN KEY (user_id) REFERENCES user(id),
    UNIQUE(course_project_id, user_id)
  );

  CREATE TABLE status_change_history (
    id VARCHAR(36) PRIMARY KEY,
    entity_type VARCHAR(20) NOT NULL,
    entity_id VARCHAR(36) NOT NULL,
    from_status VARCHAR(20) NOT NULL,
    to_status VARCHAR(20) NOT NULL,
    changed_by_id VARCHAR(36) NOT NULL,
    reason TEXT,
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (changed_by_id) REFERENCES user(id)
  );

  CREATE TABLE notification (
    id VARCHAR(36) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    recipient_id VARCHAR(36) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    related_entity_type VARCHAR(50),
    related_entity_id VARCHAR(36),
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipient_id) REFERENCES user(id)
  );

  CREATE TABLE notification_log (
    id VARCHAR(36) PRIMARY KEY,
    notification_id VARCHAR(36) NOT NULL,
    trigger_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    trigger_result VARCHAR(20) NOT NULL,
    error_message TEXT,
    log_file_path VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (notification_id) REFERENCES notification(id)
  );

  CREATE INDEX idx_training_need_status ON training_need(status);
  CREATE INDEX idx_training_need_department ON training_need(department);
  CREATE INDEX idx_course_project_status ON course_project(status);
  CREATE INDEX idx_course_project_instructor ON course_project(instructor_id);
  CREATE INDEX idx_student_course ON student(course_project_id);
  CREATE INDEX idx_notification_recipient ON notification(recipient_id);
`);

const hashedPassword = bcrypt.hashSync('password123', 10);

const users = [
  { id: 'admin-001', username: 'admin', password: hashedPassword, name: '系统管理员', email: 'admin@company.com', phone: '13800000000', department: 'IT部', role: 'training_manager' },
  { id: 'manager-001', username: 'training_manager', password: hashedPassword, name: '张经理', email: 'zhang@company.com', phone: '13800000001', department: '培训部', role: 'training_manager' },
  { id: 'manager-002', username: 'training_manager2', password: hashedPassword, name: '李经理', email: 'li2@company.com', phone: '13800000002', department: '培训部', role: 'training_manager' },
  { id: 'dept-001', username: 'dept_head', password: hashedPassword, name: '王主管', email: 'wang@company.com', phone: '13800000003', department: '研发部', role: 'department_head' },
  { id: 'dept-002', username: 'dept_head2', password: hashedPassword, name: '赵主管', email: 'zhao2@company.com', phone: '13800000004', department: '市场部', role: 'department_head' },
  { id: 'instructor-001', username: 'instructor', password: hashedPassword, name: '刘讲师', email: 'liu@company.com', phone: '13800000005', department: '培训部', role: 'instructor' },
  { id: 'instructor-002', username: 'instructor2', password: hashedPassword, name: '陈讲师', email: 'chen@company.com', phone: '13800000006', department: '培训部', role: 'instructor' },
  { id: 'student-001', username: 'student', password: hashedPassword, name: '孙学员', email: 'sun@company.com', phone: '13800000007', department: '研发部', role: 'student' },
  { id: 'student-002', username: 'student2', password: hashedPassword, name: '周学员', email: 'zhou@company.com', phone: '13800000008', department: '市场部', role: 'student' },
];

const insertUser = db.prepare(`
  INSERT INTO user (id, username, password, name, email, phone, department, role)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const user of users) {
  insertUser.run(user.id, user.username, user.password, user.name, user.email, user.phone, user.department, user.role);
}

const trainingNeeds = [
  { id: 'need-001', title: 'Python高级编程培训', description: '提升研发团队Python编程能力，学习高级特性和最佳实践', department: '研发部', submitter_id: 'dept-001', expected_date: '2026-07-01', participant_count: 20, budget: 50000, urgency: 'high', status: 'approved' },
  { id: 'need-002', title: '市场营销策略培训', description: '提升市场团队营销策略制定能力', department: '市场部', submitter_id: 'dept-002', expected_date: '2026-07-15', participant_count: 15, budget: 30000, urgency: 'medium', status: 'pending' },
  { id: 'need-003', title: '项目管理培训', description: '学习敏捷项目管理方法和工具使用', department: '研发部', submitter_id: 'dept-001', expected_date: '2026-08-01', participant_count: 25, budget: 40000, urgency: 'low', status: 'pending' },
];

const insertNeed = db.prepare(`
  INSERT INTO training_need (id, title, description, department, submitter_id, expected_date, participant_count, budget, urgency, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const need of trainingNeeds) {
  insertNeed.run(need.id, need.title, need.description, need.department, need.submitter_id, need.expected_date, need.participant_count, need.budget, need.urgency, need.status);
}

const remarks = [
  { id: 'remark-001', training_need_id: 'need-001', handler_id: 'manager-001', content: '需求合理，建议尽快安排培训', action: 'approve' },
];

const insertRemark = db.prepare(`
  INSERT INTO training_need_remark (id, training_need_id, handler_id, content, action)
  VALUES (?, ?, ?, ?, ?)
`);

for (const remark of remarks) {
  insertRemark.run(remark.id, remark.training_need_id, remark.handler_id, remark.content, remark.action);
}

const courseProjects = [
  { id: 'project-001', training_need_id: 'need-001', instructor_id: 'instructor-001', title: 'Python高级编程实战', description: '深入讲解Python高级特性', objectives: '掌握Python高级编程技巧', outline: '1. 高级数据结构\n2. 并发编程\n3. 性能优化', start_time: '2026-07-01 09:00:00', end_time: '2026-07-03 17:00:00', location: '培训室A', enrollment_deadline: '2026-06-25 18:00:00', max_participants: 20, status: 'published' },
];

const insertProject = db.prepare(`
  INSERT INTO course_project (id, training_need_id, instructor_id, title, description, objectives, outline, start_time, end_time, location, enrollment_deadline, max_participants, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const project of courseProjects) {
  insertProject.run(project.id, project.training_need_id, project.instructor_id, project.title, project.description, project.objectives, project.outline, project.start_time, project.end_time, project.location, project.enrollment_deadline, project.max_participants, project.status);
}

const students = [
  { id: 'student-record-001', course_project_id: 'project-001', user_id: 'student-001', status: 'enrolled' },
];

const insertStudent = db.prepare(`
  INSERT INTO student (id, course_project_id, user_id, status)
  VALUES (?, ?, ?, ?)
`);

for (const student of students) {
  insertStudent.run(student.id, student.course_project_id, student.user_id, student.status);
}

const statusHistories = [
  { id: 'history-001', entity_type: 'training_need', entity_id: 'need-001', from_status: 'pending', to_status: 'approved', changed_by_id: 'manager-001', reason: '需求合理', remarks: '建议尽快安排' },
  { id: 'history-002', entity_type: 'course_project', entity_id: 'project-001', from_status: 'pending', to_status: 'approved', changed_by_id: 'manager-001', reason: '审批通过' },
  { id: 'history-003', entity_type: 'course_project', entity_id: 'project-001', from_status: 'approved', to_status: 'published', changed_by_id: 'manager-001', reason: '发布课程' },
];

const insertHistory = db.prepare(`
  INSERT INTO status_change_history (id, entity_type, entity_id, from_status, to_status, changed_by_id, reason, remarks)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const history of statusHistories) {
  insertHistory.run(history.id, history.entity_type, history.entity_id, history.from_status, history.to_status, history.changed_by_id, history.reason, history.remarks || null);
}

db.close();

console.log('数据库初始化完成！');
console.log('测试用户已创建，默认密码: password123');
console.log('\n测试账号:');
console.log('- 培训经理: training_manager / password123');
console.log('- 培训经理2: training_manager2 / password123');
console.log('- 部门负责人: dept_head / password123');
console.log('- 部门负责人2: dept_head2 / password123');
console.log('- 讲师: instructor / password123');
console.log('- 讲师2: instructor2 / password123');
console.log('- 学员: student / password123');
console.log('- 学员2: student2 / password123');
console.log('- 管理员: admin / password123');