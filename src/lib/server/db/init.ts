import { db } from './index';
import { seedDatabase } from './seed';

const createTablesStatements = [
	`CREATE TABLE IF NOT EXISTS users (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		role TEXT NOT NULL CHECK (role IN ('consultant', 'teacher', 'admin')),
		created_at TEXT DEFAULT CURRENT_TIMESTAMP
	)`,
	`CREATE TABLE IF NOT EXISTS students (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		phone TEXT,
		created_at TEXT DEFAULT CURRENT_TIMESTAMP
	)`,
	`CREATE TABLE IF NOT EXISTS student_packages (
		id TEXT PRIMARY KEY,
		student_id TEXT NOT NULL REFERENCES students(id),
		total_hours INTEGER NOT NULL DEFAULT 0,
		remaining_hours INTEGER NOT NULL DEFAULT 0,
		created_at TEXT DEFAULT CURRENT_TIMESTAMP,
		updated_at TEXT DEFAULT CURRENT_TIMESTAMP
	)`,
	`CREATE TABLE IF NOT EXISTS consumptions (
		id TEXT PRIMARY KEY,
		student_id TEXT NOT NULL REFERENCES students(id),
		course_name TEXT NOT NULL,
		hours INTEGER NOT NULL,
		status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
		consultant_id TEXT NOT NULL REFERENCES users(id),
		consultant_name TEXT NOT NULL,
		teacher_id TEXT REFERENCES users(id),
		teacher_name TEXT,
		remark TEXT,
		reject_reason TEXT,
		created_at TEXT DEFAULT CURRENT_TIMESTAMP,
		confirmed_at TEXT
	)`,
	`CREATE TABLE IF NOT EXISTS makeups (
		id TEXT PRIMARY KEY,
		student_id TEXT NOT NULL REFERENCES students(id),
		original_course_date TEXT NOT NULL,
		original_course_name TEXT NOT NULL,
		reason TEXT,
		status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'completed', 'cancelled')),
		consultant_id TEXT NOT NULL REFERENCES users(id),
		consultant_name TEXT NOT NULL,
		teacher_id TEXT REFERENCES users(id),
		teacher_name TEXT,
		scheduled_date TEXT,
		classroom TEXT,
		makeup_content TEXT,
		cancel_reason TEXT,
		created_at TEXT DEFAULT CURRENT_TIMESTAMP,
		scheduled_at TEXT,
		completed_at TEXT,
		cancelled_at TEXT
	)`,
	`CREATE TABLE IF NOT EXISTS audit_logs (
		id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL,
		user_name TEXT NOT NULL,
		action TEXT NOT NULL,
		entity_type TEXT NOT NULL,
		entity_id TEXT NOT NULL,
		detail TEXT,
		created_at TEXT DEFAULT CURRENT_TIMESTAMP
	)`
];

const createIndexesStatements = [
	`CREATE INDEX IF NOT EXISTS idx_consumptions_student ON consumptions(student_id)`,
	`CREATE INDEX IF NOT EXISTS idx_consumptions_status ON consumptions(status)`,
	`CREATE INDEX IF NOT EXISTS idx_makeups_student ON makeups(student_id)`,
	`CREATE INDEX IF NOT EXISTS idx_makeups_status ON makeups(status)`,
	`CREATE INDEX IF NOT EXISTS idx_makeups_scheduled_date ON makeups(scheduled_date)`,
	`CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC)`
];

export async function initDatabase() {
	try {
		for (const stmt of createTablesStatements) {
			db.run(stmt);
		}
		for (const stmt of createIndexesStatements) {
			db.run(stmt);
		}
		await seedDatabase();
		console.log('Database initialized successfully');
	} catch (error) {
		console.error('Error initializing database:', error);
	}
}
