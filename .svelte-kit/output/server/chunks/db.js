import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
const dbPath = "/tmp/data.db";
const db = new Database(dbPath);
db.exec(`
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT UNIQUE NOT NULL,
		password TEXT NOT NULL,
		role TEXT NOT NULL CHECK(role IN ('tax_advisor', 'project_manager', 'client_finance')),
		name TEXT NOT NULL,
		email TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS risk_alerts (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		code TEXT UNIQUE NOT NULL,
		title TEXT NOT NULL,
		type TEXT NOT NULL CHECK(type IN (
			'policy_dispute',
			'draft_version_chaos',
			'response_unsigned',
			'missing_docs',
			'deadline_risk',
			'system_error'
		)),
		severity TEXT NOT NULL CHECK(severity IN ('high', 'medium', 'low')),
		status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN (
			'pending',
			'processing',
			'confirming',
			'completed',
			'closed'
		)),
		assignee_id INTEGER REFERENCES users(id),
		creator_id INTEGER REFERENCES users(id),
		related_type TEXT CHECK(related_type IN ('consult', 'policy', 'draft')),
		related_id TEXT,
		reject_reason TEXT,
		supplement_note TEXT,
		due_date DATETIME,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS todo_items (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		risk_alert_id INTEGER REFERENCES risk_alerts(id),
		user_id INTEGER REFERENCES users(id),
		todo_type TEXT NOT NULL CHECK(todo_type IN (
			'risk_process',
			'review_confirm',
			'sign_receive',
			'supplement_docs',
			'follow_up'
		)),
		status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed')),
		priority TEXT CHECK(priority IN ('high', 'medium', 'low')),
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS follow_ups (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		risk_alert_id INTEGER REFERENCES risk_alerts(id),
		follow_date DATETIME NOT NULL,
		result TEXT NOT NULL CHECK(result IN ('resolved', 'pending', 'escalated')),
		note TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS operation_logs (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		risk_alert_id INTEGER REFERENCES risk_alerts(id),
		user_id INTEGER REFERENCES users(id),
		action TEXT NOT NULL,
		description TEXT,
		old_value TEXT,
		new_value TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
`);
function initializeSampleData() {
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get();
  if (userCount.count === 0) {
    const hashedPassword = bcrypt.hashSync("password123", 10);
    db.exec(`
			INSERT INTO users (username, password, role, name, email) VALUES
			('TA001', '${hashedPassword}', 'tax_advisor', '张税务', 'zhang@sino-tax.com'),
			('PM001', '${hashedPassword}', 'project_manager', '李经理', 'li@sino-tax.com'),
			('CF001', '${hashedPassword}', 'client_finance', '王财务', 'wang@client.com');
		`);
    const now = /* @__PURE__ */ new Date();
    const formatDate = (d) => d.toISOString();
    const addDays = (d, days) => new Date(d.getTime() + days * 24 * 60 * 60 * 1e3);
    const subtractDays = (d, days) => new Date(d.getTime() - days * 24 * 60 * 60 * 1e3);
    db.exec(`
			INSERT INTO risk_alerts (code, title, type, severity, status, assignee_id, creator_id, related_type, related_id, reject_reason, supplement_note, due_date, created_at, updated_at) VALUES
			('RF-20240610-001', '股权激励个税计算政策适用争议', 'policy_dispute', 'high', 'processing', 1, 2, 'consult', '2024-个税-001', NULL, '需在申报前完成最终确认', '${formatDate(addDays(now, 3))}', '${formatDate(subtractDays(now, 5))}', '${formatDate(now)}'),
			('RF-20240611-002', '研发费用加计扣除底稿版本混乱', 'draft_version_chaos', 'medium', 'confirming', 1, 2, 'draft', '2024-企税-015', '需客户提供最终审计报告', '客户已承诺下周一前提供', '${formatDate(addDays(now, 7))}', '${formatDate(subtractDays(now, 3))}', '${formatDate(now)}'),
			('RF-20240612-003', '增值税进项抵扣答复未签收', 'response_unsigned', 'low', 'completed', 2, 1, 'consult', '2024-增值-003', NULL, '客户确认口头知晓，需补签书面确认', '${formatDate(addDays(now, 15))}', '${formatDate(subtractDays(now, 1))}', '${formatDate(now)}');
		`);
    db.exec(`
			INSERT INTO todo_items (risk_alert_id, user_id, todo_type, status, priority, created_at, updated_at) VALUES
			(1, 1, 'risk_process', 'processing', 'high', '${formatDate(subtractDays(now, 5))}', '${formatDate(now)}'),
			(1, 2, 'review_confirm', 'pending', 'high', '${formatDate(subtractDays(now, 5))}', '${formatDate(subtractDays(now, 5))}'),
			(2, 3, 'supplement_docs', 'pending', 'medium', '${formatDate(subtractDays(now, 3))}', '${formatDate(subtractDays(now, 3))}'),
			(2, 1, 'review_confirm', 'processing', 'medium', '${formatDate(subtractDays(now, 3))}', '${formatDate(now)}'),
			(3, 2, 'follow_up', 'pending', 'low', '${formatDate(now)}', '${formatDate(now)}');
		`);
    db.exec(`
			INSERT INTO follow_ups (risk_alert_id, follow_date, result, note, created_at) VALUES
			(3, '${formatDate(addDays(now, 7))}', 'pending', '等待客户补签书面确认', '${formatDate(now)}');
		`);
    db.exec(`
			INSERT INTO operation_logs (risk_alert_id, user_id, action, description, old_value, new_value, created_at) VALUES
			(1, 2, '创建风险提示', '从咨询工单2024-个税-001识别政策适用争议风险', NULL, 'pending', '${formatDate(subtractDays(now, 5))}'),
			(1, 1, '开始处理', '税务顾问开始处理股权激励个税计算争议', 'pending', 'processing', '${formatDate(subtractDays(now, 4))}'),
			(1, 1, '提出方案', '提出两种计算方案：方案A（按行权时点计算）和方案B（按授予时点计算）', NULL, NULL, '${formatDate(subtractDays(now, 3))}'),
			(1, 2, '组织讨论', '项目经理组织内部讨论，邀请相关专家参与', NULL, NULL, '${formatDate(subtractDays(now, 2))}'),
			(1, 3, '提供数据', '客户财务提供历史股权激励数据', NULL, NULL, '${formatDate(subtractDays(now, 1))}'),
			(1, 1, '确定方案', '经过讨论确定采用方案B，更符合最新政策要求', NULL, NULL, '${formatDate(now)}'),
			(2, 2, '创建风险提示', '从申报底稿2024-企税-015发现版本混乱问题', NULL, 'pending', '${formatDate(subtractDays(now, 3))}'),
			(2, 1, '开始处理', '税务顾问开始核对底稿版本', 'pending', 'processing', '${formatDate(subtractDays(now, 2))}'),
			(2, 1, '确认版本', '核对后确认v2.0为最终版本，v1.2和v1.3为中间版本', NULL, NULL, '${formatDate(subtractDays(now, 1))}'),
			(2, 1, '退回补充', '需要客户提供最终审计报告才能继续', 'processing', 'confirming', '${formatDate(now)}'),
			(3, 1, '创建风险提示', '系统自动检测到答复未签收', NULL, 'pending', '${formatDate(subtractDays(now, 1))}'),
			(3, 2, '发送提醒', '再次发送签收提醒给客户', 'pending', 'processing', '${formatDate(subtractDays(now, 0.5))}'),
			(3, 2, '电话联系', '客户未响应，项目经理电话联系客户财务', NULL, NULL, '${formatDate(now)}'),
			(3, 2, '客户确认', '客户确认已阅，知悉处理结果', 'processing', 'completed', '${formatDate(now)}');
		`);
  }
}
initializeSampleData();
export {
  db as d
};
