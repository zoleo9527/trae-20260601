import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'coffee.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
	if (_db) return _db;
	if (!fs.existsSync(DATA_DIR)) {
		fs.mkdirSync(DATA_DIR, { recursive: true });
	}
	_db = new Database(DB_PATH);
	_db.pragma('journal_mode = WAL');
	_db.pragma('foreign_keys = ON');
	return _db;
}

export function resetDb(): void {
	if (_db) {
		_db.close();
		_db = null;
	}
	if (fs.existsSync(DB_PATH)) {
		fs.unlinkSync(DB_PATH);
	}
	const wal = DB_PATH + '-wal';
	if (fs.existsSync(wal)) fs.unlinkSync(wal);
	const shm = DB_PATH + '-shm';
	if (fs.existsSync(shm)) fs.unlinkSync(shm);
}

export function initSchema(): void {
	const db = getDb();
	db.exec(`
		CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			username TEXT UNIQUE NOT NULL,
			password TEXT NOT NULL,
			role TEXT NOT NULL CHECK(role IN ('roaster','cupper','cs')),
			display_name TEXT NOT NULL
		);

		CREATE TABLE IF NOT EXISTS green_beans (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			batch_no TEXT UNIQUE NOT NULL,
			name TEXT NOT NULL,
			origin TEXT NOT NULL,
			variety TEXT NOT NULL,
			process TEXT NOT NULL,
			weight_kg REAL NOT NULL,
			remaining_kg REAL NOT NULL,
			bag_count INTEGER NOT NULL,
			supplier TEXT NOT NULL,
			contract_no TEXT DEFAULT '',
			arrival_date TEXT NOT NULL,
			warehouse_location TEXT DEFAULT '',
			moisture_content REAL,
			density REAL,
			screen_size TEXT,
			notes TEXT DEFAULT '',
			status TEXT NOT NULL DEFAULT 'pending_inspection' CHECK(status IN ('pending_inspection','inspected','stored','exception')),
			created_by INTEGER REFERENCES users(id),
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL
		);

		CREATE TABLE IF NOT EXISTS roasting_plans (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			plan_no TEXT UNIQUE NOT NULL,
			green_bean_id INTEGER NOT NULL REFERENCES green_beans(id),
			plan_date TEXT NOT NULL,
			target_roast_level TEXT NOT NULL,
			batch_size_kg REAL NOT NULL,
			expected_output_kg REAL NOT NULL,
			priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('low','normal','high','urgent')),
			status TEXT NOT NULL DEFAULT 'planned' CHECK(status IN ('planned','approved','in_progress','completed','cancelled')),
			assigned_roaster INTEGER REFERENCES users(id),
			notes TEXT DEFAULT '',
			created_by INTEGER REFERENCES users(id),
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL
		);

		CREATE TABLE IF NOT EXISTS roast_batches (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			batch_no TEXT UNIQUE NOT NULL,
			roasting_plan_id INTEGER NOT NULL REFERENCES roasting_plans(id),
			green_bean_id INTEGER NOT NULL REFERENCES green_beans(id),
			roaster_id INTEGER NOT NULL REFERENCES users(id),
			actual_roast_level TEXT NOT NULL,
			start_time TEXT NOT NULL,
			end_time TEXT,
			input_weight_kg REAL NOT NULL,
			output_weight_kg REAL,
			notes TEXT DEFAULT '',
			created_at TEXT NOT NULL
		);

		CREATE TABLE IF NOT EXISTS cupping_records (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			roast_batch_id INTEGER NOT NULL REFERENCES roast_batches(id),
			cupper_id INTEGER NOT NULL REFERENCES users(id),
			aroma_score REAL NOT NULL,
			flavor_score REAL NOT NULL,
			aftertaste_score REAL NOT NULL,
			acidity_score REAL NOT NULL,
			body_score REAL NOT NULL,
			balance_score REAL NOT NULL,
			overall_score REAL NOT NULL,
			notes TEXT DEFAULT '',
			created_at TEXT NOT NULL
		);

		CREATE TABLE IF NOT EXISTS exceptions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			entity_type TEXT NOT NULL CHECK(entity_type IN ('green_bean','roasting_plan','roast_batch')),
			entity_id INTEGER NOT NULL,
			severity TEXT NOT NULL DEFAULT 'medium' CHECK(severity IN ('low','medium','high','critical')),
			title TEXT NOT NULL,
			description TEXT NOT NULL,
			resolution TEXT,
			status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','in_progress','resolved','closed')),
			handler_id INTEGER REFERENCES users(id),
			created_by INTEGER NOT NULL REFERENCES users(id),
			created_at TEXT NOT NULL,
			resolved_at TEXT
		);

		CREATE TABLE IF NOT EXISTS timeline_events (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			entity_type TEXT NOT NULL,
			entity_id INTEGER NOT NULL,
			event_type TEXT NOT NULL,
			description TEXT NOT NULL,
			created_by INTEGER REFERENCES users(id),
			created_at TEXT NOT NULL
		);
	`);
}

export function addTimelineEvent(
	entity_type: string,
	entity_id: number,
	event_type: string,
	description: string,
	created_by: number | null = null
): void {
	const db = getDb();
	const now = new Date().toISOString();
	db.prepare(
		`INSERT INTO timeline_events (entity_type, entity_id, event_type, description, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)`
	).run(entity_type, entity_id, event_type, description, created_by, now);
}

export function getTimeline(entity_type: string, entity_id: number) {
	const db = getDb();
	return db.prepare(`
		SELECT t.*, u.display_name as creator_name
		FROM timeline_events t
		LEFT JOIN users u ON t.created_by = u.id
		WHERE t.entity_type = ? AND t.entity_id = ?
		ORDER BY t.created_at ASC
	`).all(entity_type, entity_id);
}

export function getGreenBeans(filters?: { status?: string; search?: string }) {
	const db = getDb();
	let sql = 'SELECT * FROM green_beans WHERE 1=1';
	const params: unknown[] = [];
	if (filters?.status) {
		sql += ' AND status = ?';
		params.push(filters.status);
	}
	if (filters?.search) {
		sql += ' AND (name LIKE ? OR batch_no LIKE ? OR origin LIKE ?)';
		params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
	}
	sql += ' ORDER BY created_at DESC';
	return db.prepare(sql).all(...params);
}

export function getGreenBean(id: number) {
	const db = getDb();
	return db.prepare('SELECT * FROM green_beans WHERE id = ?').get(id);
}

export function createGreenBean(data: Omit<import('./types.js').GreenBean, 'id' | 'created_at' | 'updated_at'>) {
	const db = getDb();
	const now = new Date().toISOString();
	const result = db.prepare(`
		INSERT INTO green_beans (batch_no, name, origin, variety, process, weight_kg, remaining_kg, bag_count, supplier, contract_no, arrival_date, warehouse_location, moisture_content, density, screen_size, notes, status, created_by, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`).run(
		data.batch_no, data.name, data.origin, data.variety, data.process,
		data.weight_kg, data.remaining_kg, data.bag_count, data.supplier,
		data.contract_no, data.arrival_date, data.warehouse_location,
		data.moisture_content, data.density, data.screen_size, data.notes,
		data.status, data.created_by, now, now
	);
	return result.lastInsertRowid;
}

export function updateGreenBeanStatus(id: number, status: string, updated_by: number | null = null) {
	const db = getDb();
	const now = new Date().toISOString();
	db.prepare('UPDATE green_beans SET status = ?, updated_at = ? WHERE id = ?').run(status, now, id);
	addTimelineEvent('green_bean', id, 'status_change', `状态变更为: ${status}`, updated_by);
}

export function getRoastingPlans(filters?: { status?: string; green_bean_id?: number }) {
	const db = getDb();
	let sql = 'SELECT rp.*, gb.name as green_bean_name, gb.batch_no as green_bean_batch_no, u.display_name as roaster_name FROM roasting_plans rp LEFT JOIN green_beans gb ON rp.green_bean_id = gb.id LEFT JOIN users u ON rp.assigned_roaster = u.id WHERE 1=1';
	const params: unknown[] = [];
	if (filters?.status) {
		sql += ' AND rp.status = ?';
		params.push(filters.status);
	}
	if (filters?.green_bean_id) {
		sql += ' AND rp.green_bean_id = ?';
		params.push(filters.green_bean_id);
	}
	sql += ' ORDER BY rp.created_at DESC';
	return db.prepare(sql).all(...params);
}

export function getRoastingPlan(id: number) {
	const db = getDb();
	return db.prepare(`
		SELECT rp.*, gb.name as green_bean_name, gb.batch_no as green_bean_batch_no, gb.origin as green_bean_origin, gb.remaining_kg as green_bean_remaining, u.display_name as roaster_name
		FROM roasting_plans rp
		LEFT JOIN green_beans gb ON rp.green_bean_id = gb.id
		LEFT JOIN users u ON rp.assigned_roaster = u.id
		WHERE rp.id = ?
	`).get(id);
}

export function createRoastingPlan(data: {
	green_bean_id: number;
	plan_date: string;
	target_roast_level: string;
	batch_size_kg: number;
	expected_output_kg: number;
	priority: string;
	assigned_roaster: number | null;
	notes: string;
	created_by: number;
}) {
	const db = getDb();
	const now = new Date().toISOString();
	const count = (db.prepare("SELECT COUNT(*) as c FROM roasting_plans WHERE created_at >= date('now')").get() as { c: number }).c;
	const plan_no = `RP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(count + 1).padStart(3, '0')}`;
	const result = db.prepare(`
		INSERT INTO roasting_plans (plan_no, green_bean_id, plan_date, target_roast_level, batch_size_kg, expected_output_kg, priority, status, assigned_roaster, notes, created_by, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, 'planned', ?, ?, ?, ?, ?)
	`).run(
		plan_no, data.green_bean_id, data.plan_date, data.target_roast_level,
		data.batch_size_kg, data.expected_output_kg, data.priority,
		data.assigned_roaster, data.notes, data.created_by, now, now
	);
	const planId = Number(result.lastInsertRowid);
	addTimelineEvent('roasting_plan', planId, 'created', `烘焙计划 ${plan_no} 已创建，关联生豆批次`, data.created_by);
	return { id: planId, plan_no };
}

export function updateRoastingPlanStatus(id: number, status: string, updated_by: number | null = null) {
	const db = getDb();
	const now = new Date().toISOString();
	db.prepare('UPDATE roasting_plans SET status = ?, updated_at = ? WHERE id = ?').run(status, now, id);
	addTimelineEvent('roasting_plan', id, 'status_change', `烘焙计划状态变更为: ${status}`, updated_by);
}

export function getExceptions(filters?: { entity_type?: string; entity_id?: number; status?: string }) {
	const db = getDb();
	let sql = 'SELECT e.*, u.display_name as handler_name, c.display_name as creator_name FROM exceptions e LEFT JOIN users u ON e.handler_id = u.id LEFT JOIN users c ON e.created_by = c.id WHERE 1=1';
	const params: unknown[] = [];
	if (filters?.entity_type) {
		sql += ' AND e.entity_type = ?';
		params.push(filters.entity_type);
	}
	if (filters?.entity_id) {
		sql += ' AND e.entity_id = ?';
		params.push(filters.entity_id);
	}
	if (filters?.status) {
		sql += ' AND e.status = ?';
		params.push(filters.status);
	}
	sql += ' ORDER BY e.created_at DESC';
	return db.prepare(sql).all(...params);
}

export function createException(data: {
	entity_type: string;
	entity_id: number;
	severity: string;
	title: string;
	description: string;
	created_by: number;
}) {
	const db = getDb();
	const now = new Date().toISOString();
	const result = db.prepare(`
		INSERT INTO exceptions (entity_type, entity_id, severity, title, description, status, created_by, created_at)
		VALUES (?, ?, ?, ?, ?, 'open', ?, ?)
	`).run(data.entity_type, data.entity_id, data.severity, data.title, data.description, data.created_by, now);
	const exId = Number(result.lastInsertRowid);
	addTimelineEvent(data.entity_type, data.entity_id, 'exception_created', `新增异常: ${data.title}`, data.created_by);
	return exId;
}

export function updateException(id: number, data: { status?: string; resolution?: string; handler_id?: number }) {
	const db = getDb();
	const now = new Date().toISOString();
	if (data.status === 'resolved' || data.status === 'closed') {
		db.prepare('UPDATE exceptions SET status = ?, resolution = ?, handler_id = ?, resolved_at = ? WHERE id = ?')
			.run(data.status, data.resolution || null, data.handler_id || null, now, id);
	} else if (data.status) {
		db.prepare('UPDATE exceptions SET status = ?, handler_id = ? WHERE id = ?')
			.run(data.status, data.handler_id || null, id);
	}
}

export function getCuppingRecords(roastBatchId?: number) {
	const db = getDb();
	if (roastBatchId) {
		return db.prepare(`
			SELECT cr.*, u.display_name as cupper_name, rb.batch_no
			FROM cupping_records cr
			LEFT JOIN users u ON cr.cupper_id = u.id
			LEFT JOIN roast_batches rb ON cr.roast_batch_id = rb.id
			WHERE cr.roast_batch_id = ?
			ORDER BY cr.created_at DESC
		`).all(roastBatchId);
	}
	return db.prepare(`
		SELECT cr.*, u.display_name as cupper_name, rb.batch_no
		FROM cupping_records cr
		LEFT JOIN users u ON cr.cupper_id = u.id
		LEFT JOIN roast_batches rb ON cr.roast_batch_id = rb.id
		ORDER BY cr.created_at DESC
	`).all();
}

export function getRoastBatches(roastingPlanId?: number) {
	const db = getDb();
	if (roastingPlanId) {
		return db.prepare(`
			SELECT rb.*, u.display_name as roaster_name
			FROM roast_batches rb
			LEFT JOIN users u ON rb.roaster_id = u.id
			WHERE rb.roasting_plan_id = ?
			ORDER BY rb.created_at DESC
		`).all(roastingPlanId);
	}
	return db.prepare(`
		SELECT rb.*, u.display_name as roaster_name
		FROM roast_batches rb
		LEFT JOIN users u ON rb.roaster_id = u.id
		ORDER BY rb.created_at DESC
	`).all();
}

export function createRoastBatch(data: {
	roasting_plan_id: number;
	green_bean_id: number;
	roaster_id: number;
	actual_roast_level: string;
	start_time: string;
	input_weight_kg: number;
	notes?: string;
}) {
	const db = getDb();
	const now = new Date().toISOString();
	const count = (db.prepare("SELECT COUNT(*) as c FROM roast_batches WHERE created_at >= date('now')").get() as { c: number }).c;
	const batch_no = `RB-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(count + 1).padStart(3, '0')}`;
	const result = db.prepare(`
		INSERT INTO roast_batches (batch_no, roasting_plan_id, green_bean_id, roaster_id, actual_roast_level, start_time, input_weight_kg, notes, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`).run(
		batch_no, data.roasting_plan_id, data.green_bean_id, data.roaster_id,
		data.actual_roast_level, data.start_time, data.input_weight_kg, data.notes || '', now
	);
	const batchId = Number(result.lastInsertRowid);
	addTimelineEvent('roasting_plan', data.roasting_plan_id, 'batch_started', `烘焙批次 ${batch_no} 开始`, data.roaster_id);
	return { id: batchId, batch_no };
}

export function createCuppingRecord(data: {
	roast_batch_id: number;
	cupper_id: number;
	aroma_score: number;
	flavor_score: number;
	aftertaste_score: number;
	acidity_score: number;
	body_score: number;
	balance_score: number;
	overall_score: number;
	notes?: string;
}) {
	const db = getDb();
	const now = new Date().toISOString();
	const result = db.prepare(`
		INSERT INTO cupping_records (roast_batch_id, cupper_id, aroma_score, flavor_score, aftertaste_score, acidity_score, body_score, balance_score, overall_score, notes, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`).run(
		data.roast_batch_id, data.cupper_id, data.aroma_score, data.flavor_score,
		data.aftertaste_score, data.acidity_score, data.body_score, data.balance_score,
		data.overall_score, data.notes || '', now
	);
	const recordId = Number(result.lastInsertRowid);
	const batch = db.prepare('SELECT roasting_plan_id FROM roast_batches WHERE id = ?').get(data.roast_batch_id) as { roasting_plan_id: number } | undefined;
	if (batch) {
		addTimelineEvent('roasting_plan', batch.roasting_plan_id, 'cupping_done', `杯测完成，综合评分: ${data.overall_score}`, data.cupper_id);
	}
	return recordId;
}

export function getDashboardStats() {
	const db = getDb();
	const pendingBeans = (db.prepare("SELECT COUNT(*) as c FROM green_beans WHERE status = 'pending_inspection'").get() as { c: number }).c;
	const storedBeans = (db.prepare("SELECT COUNT(*) as c FROM green_beans WHERE status = 'stored'").get() as { c: number }).c;
	const plannedRoasts = (db.prepare("SELECT COUNT(*) as c FROM roasting_plans WHERE status IN ('planned','approved')").get() as { c: number }).c;
	const inProgressRoasts = (db.prepare("SELECT COUNT(*) as c FROM roasting_plans WHERE status = 'in_progress'").get() as { c: number }).c;
	const openExceptions = (db.prepare("SELECT COUNT(*) as c FROM exceptions WHERE status IN ('open','in_progress')").get() as { c: number }).c;
	const recentBeans = db.prepare('SELECT * FROM green_beans ORDER BY created_at DESC LIMIT 5').all();
	const recentPlans = db.prepare(`
		SELECT rp.*, gb.name as green_bean_name, u.display_name as roaster_name
		FROM roasting_plans rp
		LEFT JOIN green_beans gb ON rp.green_bean_id = gb.id
		LEFT JOIN users u ON rp.assigned_roaster = u.id
		ORDER BY rp.created_at DESC LIMIT 5
	`).all();
	return { pendingBeans, storedBeans, plannedRoasts, inProgressRoasts, openExceptions, recentBeans, recentPlans };
}

export function getUsers() {
	const db = getDb();
	return db.prepare('SELECT id, username, role, display_name FROM users').all();
}

export function getRoasters() {
	const db = getDb();
	return db.prepare("SELECT id, username, display_name FROM users WHERE role = 'roaster'").all();
}
