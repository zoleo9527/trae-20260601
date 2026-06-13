
CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    real_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    role INTEGER NOT NULL DEFAULT 2,
    company_id INTEGER,
    department VARCHAR(100),
    status INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS position (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    position_name VARCHAR(100) NOT NULL,
    company_id INTEGER NOT NULL,
    company_name VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    work_location VARCHAR(200),
    salary_min DECIMAL(10,2),
    salary_max DECIMAL(10,2),
    salary_type INTEGER DEFAULT 1,
    requirement TEXT,
    benefits TEXT,
    rebate_amount DECIMAL(10,2),
    rebate_condition TEXT,
    status INTEGER NOT NULL DEFAULT 1,
    expire_time DATETIME,
    created_by INTEGER NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS candidate_application (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    position_id INTEGER NOT NULL,
    position_name VARCHAR(100) NOT NULL,
    candidate_name VARCHAR(50) NOT NULL,
    candidate_phone VARCHAR(20) NOT NULL,
    candidate_id_card VARCHAR(18),
    age INTEGER,
    gender INTEGER,
    education VARCHAR(50),
    work_experience VARCHAR(500),
    skills VARCHAR(500),
    source_channel VARCHAR(100),
    judgment_note TEXT,
    status INTEGER NOT NULL DEFAULT 1,
    submitted_by INTEGER NOT NULL,
    submitted_by_name VARCHAR(50) NOT NULL,
    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmed_by INTEGER,
    confirmed_at DATETIME,
    rejected_reason TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS interview_invitation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL,
    position_id INTEGER NOT NULL,
    position_name VARCHAR(100) NOT NULL,
    candidate_name VARCHAR(50) NOT NULL,
    candidate_phone VARCHAR(20) NOT NULL,
    interview_time DATETIME NOT NULL,
    interview_location VARCHAR(200) NOT NULL,
    interviewer_name VARCHAR(50),
    interviewer_phone VARCHAR(20),
    status INTEGER NOT NULL DEFAULT 1,
    invited_by INTEGER NOT NULL,
    invited_by_name VARCHAR(50) NOT NULL,
    invited_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmed_at DATETIME,
    candidate_confirmed INTEGER DEFAULT 0,
    no_show_reason TEXT,
    remark TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module VARCHAR(50) NOT NULL,
    operation_type VARCHAR(50) NOT NULL,
    target_type VARCHAR(50),
    target_id INTEGER,
    operator_id INTEGER,
    operator_name VARCHAR(50),
    content TEXT NOT NULL,
    ip_address VARCHAR(50),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO user (id, username, password, real_name, phone, role, company_id, department) VALUES
(1, 'admin', 'admin', '管理员', '13800138000', 1, 1, '系统管理'),
(2, 'operator', 'operator', '运营人员', '13800138001', 2, 1, '运营部'),
(3, 'recruiter', 'recruiter', '招聘顾问', '13800138002', 3, 1, '招聘部'),
(4, 'hr', 'hr', '企业HR', '13800138003', 4, 1, '人事部');

INSERT OR IGNORE INTO position (id, position_name, company_id, company_name, department, work_location, salary_min, salary_max, salary_type, requirement, benefits, rebate_amount, rebate_condition, status, expire_time, created_by) VALUES
(1, '操作工', 1, '测试公司', '生产部', '上海市浦东新区张江高科技园区', 6000, 8000, 1, '18-45岁，能吃苦耐劳，有工厂工作经验优先', '五险一金，包吃包住，加班补贴', 500, '入职满30天发放', 2, DATETIME('now', '+30 days'), 1),
(2, '仓库管理员', 1, '测试公司', '仓储部', '上海市浦东新区外高桥保税区', 5500, 7000, 1, '20-40岁，会使用电脑，有仓储管理经验', '五险一金，提供住宿，餐补', 400, '入职满30天发放', 2, DATETIME('now', '+30 days'), 1),
(3, '质检员', 1, '测试公司', '质检部', '上海市闵行区工业园区', 6500, 8500, 1, '22-35岁，大专及以上学历，有质检经验', '五险一金，年终奖，带薪年假', 600, '入职满30天发放', 2, DATETIME('now', '+30 days'), 1);
