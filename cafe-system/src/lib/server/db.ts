import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', '..', '..', 'data', 'cafe.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
	if (!_db) {
		const dir = path.dirname(dbPath);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
		_db = new Database(dbPath);
		_db.pragma('journal_mode = WAL');
		_db.pragma('foreign_keys = ON');
		initSchema(_db);
		migrateSchema(_db);
		const count = (_db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
		if (count === 0) {
			seedData(_db);
		}
	}
	return _db;
}

function initSchema(db: Database.Database) {
	db.exec(`
		CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			username TEXT NOT NULL UNIQUE,
			password TEXT NOT NULL,
			display_name TEXT NOT NULL,
			role TEXT NOT NULL CHECK(role IN ('admin', 'operator', 'tournament')),
			created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
		);

		CREATE TABLE IF NOT EXISTS members (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			phone TEXT,
			balance REAL NOT NULL DEFAULT 0,
			bonus_minutes INTEGER NOT NULL DEFAULT 0,
			created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
		);

		CREATE TABLE IF NOT EXISTS recharges (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			member_id INTEGER NOT NULL,
			amount REAL NOT NULL,
			bonus_minutes INTEGER NOT NULL DEFAULT 0,
			payment_method TEXT NOT NULL DEFAULT 'cash',
			status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'cancelled')),
			operator_id INTEGER NOT NULL,
			reviewer_id INTEGER,
			review_note TEXT,
			created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
			reviewed_at TEXT,
			cancelled_by INTEGER,
			cancelled_at TEXT,
			FOREIGN KEY (member_id) REFERENCES members(id),
			FOREIGN KEY (operator_id) REFERENCES users(id),
			FOREIGN KEY (reviewer_id) REFERENCES users(id),
			FOREIGN KEY (cancelled_by) REFERENCES users(id)
		);

		CREATE TABLE IF NOT EXISTS time_gifts (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			member_id INTEGER NOT NULL,
			minutes INTEGER NOT NULL,
			reason TEXT NOT NULL,
			source_type TEXT NOT NULL DEFAULT 'manual' CHECK(source_type IN ('manual', 'tournament', 'promotion', 'recharge_bonus')),
			source_id INTEGER,
			recharge_id INTEGER,
			status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'cancelled')),
			operator_id INTEGER NOT NULL,
			reviewer_id INTEGER,
			review_note TEXT,
			created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
			reviewed_at TEXT,
			cancelled_by INTEGER,
			cancelled_at TEXT,
			FOREIGN KEY (member_id) REFERENCES members(id),
			FOREIGN KEY (operator_id) REFERENCES users(id),
			FOREIGN KEY (reviewer_id) REFERENCES users(id),
			FOREIGN KEY (cancelled_by) REFERENCES users(id),
			FOREIGN KEY (recharge_id) REFERENCES recharges(id)
		);

		CREATE TABLE IF NOT EXISTS computer_sessions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			member_id INTEGER NOT NULL,
			computer_id TEXT NOT NULL,
			start_time TEXT NOT NULL,
			end_time TEXT,
			duration_minutes INTEGER,
			operator_id INTEGER NOT NULL,
			FOREIGN KEY (member_id) REFERENCES members(id),
			FOREIGN KEY (operator_id) REFERENCES users(id)
		);

		CREATE TABLE IF NOT EXISTS tournaments (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			game TEXT NOT NULL,
			start_time TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'upcoming' CHECK(status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
			max_participants INTEGER NOT NULL DEFAULT 32,
			prize_minutes INTEGER NOT NULL DEFAULT 0,
			operator_id INTEGER NOT NULL,
			FOREIGN KEY (operator_id) REFERENCES users(id)
		);

		CREATE TABLE IF NOT EXISTS tournament_registrations (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			tournament_id INTEGER NOT NULL,
			member_id INTEGER NOT NULL,
			registered_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
			registered_by INTEGER NOT NULL,
			status TEXT NOT NULL DEFAULT 'registered' CHECK(status IN ('registered', 'checked_in', 'eliminated', 'won', 'cancelled')),
			FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
			FOREIGN KEY (member_id) REFERENCES members(id),
			FOREIGN KEY (registered_by) REFERENCES users(id)
		);

		CREATE TABLE IF NOT EXISTS equipment_repairs (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			computer_id TEXT NOT NULL,
			issue TEXT NOT NULL,
			reported_by INTEGER NOT NULL,
			assigned_to INTEGER,
			status TEXT NOT NULL DEFAULT 'reported' CHECK(status IN ('reported', 'in_progress', 'resolved', 'wont_fix')),
			created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
			resolved_at TEXT,
			resolution_note TEXT,
			FOREIGN KEY (reported_by) REFERENCES users(id),
			FOREIGN KEY (assigned_to) REFERENCES users(id)
		);

		CREATE TABLE IF NOT EXISTS operation_logs (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			entity_type TEXT NOT NULL,
			entity_id INTEGER NOT NULL,
			action TEXT NOT NULL,
			operator_id INTEGER NOT NULL,
			detail TEXT,
			created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
			FOREIGN KEY (operator_id) REFERENCES users(id)
		);
	`);
}

function migrateSchema(db: Database.Database) {
	const cols = db.prepare("PRAGMA table_info(time_gifts)").all() as { name: string }[];
	if (!cols.find(c => c.name === 'recharge_id')) {
		db.exec(`ALTER TABLE time_gifts ADD COLUMN recharge_id INTEGER REFERENCES recharges(id)`);
	}
	const hasSourceType = cols.find(c => c.name === 'source_type');
	if (hasSourceType) {
		db.exec(`CREATE INDEX IF NOT EXISTS idx_time_gifts_recharge_id ON time_gifts(recharge_id)`);
	}
}

function seedData(db: Database.Database) {
	const existing = db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number };
	if (existing.c > 0) return;

	const insertUser = db.prepare(
		'INSERT INTO users (username, password, display_name, role) VALUES (?, ?, ?, ?)'
	);
	const insertMember = db.prepare(
		'INSERT INTO members (name, phone, balance, bonus_minutes) VALUES (?, ?, ?, ?)'
	);
	const insertRecharge = db.prepare(
		'INSERT INTO recharges (member_id, amount, bonus_minutes, payment_method, status, operator_id, reviewer_id, review_note, created_at, reviewed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
	);
	const insertTimeGift = db.prepare(
		'INSERT INTO time_gifts (member_id, minutes, reason, source_type, source_id, recharge_id, status, operator_id, reviewer_id, review_note, created_at, reviewed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
	);
	const insertSession = db.prepare(
		'INSERT INTO computer_sessions (member_id, computer_id, start_time, end_time, duration_minutes, operator_id) VALUES (?, ?, ?, ?, ?, ?)'
	);
	const insertTournament = db.prepare(
		'INSERT INTO tournaments (name, game, start_time, status, max_participants, prize_minutes, operator_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
	);
	const insertReg = db.prepare(
		'INSERT INTO tournament_registrations (tournament_id, member_id, registered_by, status) VALUES (?, ?, ?, ?)'
	);
	const insertRepair = db.prepare(
		'INSERT INTO equipment_repairs (computer_id, issue, reported_by, assigned_to, status, created_at, resolved_at, resolution_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
	);
	const insertLog = db.prepare(
		'INSERT INTO operation_logs (entity_type, entity_id, action, operator_id, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)'
	);

	const seed = db.transaction(() => {
		insertUser.run('wang', '123456', '网管小王', 'operator');
		insertUser.run('li', '123456', '赛事运营小李', 'tournament');
		insertUser.run('zhao', '123456', '店长老赵', 'admin');

		insertMember.run('张三', '13800001111', 100, 60);
		insertMember.run('李四', '13800002222', 50, 0);
		insertMember.run('王五', '13800003333', 200, 120);
		insertMember.run('赵六', '13800004444', 0, 30);
		insertMember.run('孙七', '13800005555', 80, 0);

		const now = new Date();
		const h = (offset: number) => {
			const d = new Date(now.getTime() + offset * 3600000);
			return d.toISOString().replace('T', ' ').replace('Z', '').substring(0, 19);
		};
		const d = (offset: number) => {
			const dt = new Date(now.getTime() + offset * 86400000);
			return dt.toISOString().replace('T', ' ').replace('Z', '').substring(0, 19);
		};

		insertRecharge.run(1, 100, 60, 'wechat', 'approved', 1, 3, null, d(-5) + ' 10:00:00', d(-5) + ' 10:15:00');
		insertLog.run('recharge', 1, 'create', 1, '提交会员充值：金额100元，赠送60分钟，支付方式：微信', d(-5) + ' 10:00:00');
		insertLog.run('recharge', 1, 'approve', 3, '审核通过，余额+100元', d(-5) + ' 10:15:00');

		insertTimeGift.run(1, 60, '充值赠送：随充值单#1附赠', 'recharge_bonus', null, 1, 'approved', 1, 3, null, d(-5) + ' 10:00:00', d(-5) + ' 10:15:00');
		insertLog.run('time_gift', 1, 'create', 1, '自动创建：随充值单#1附赠60分钟', d(-5) + ' 10:00:00');
		insertLog.run('time_gift', 1, 'approve', 3, '复核通过，赠送时长+60分钟', d(-5) + ' 10:15:00');

		insertRecharge.run(2, 50, 0, 'cash', 'approved', 1, 3, null, d(-3) + ' 14:30:00', d(-3) + ' 14:45:00');
		insertLog.run('recharge', 2, 'create', 1, '提交会员充值：金额50元，支付方式：现金', d(-3) + ' 14:30:00');
		insertLog.run('recharge', 2, 'approve', 3, '审核通过，余额+50元', d(-3) + ' 14:45:00');

		insertRecharge.run(3, 200, 120, 'alipay', 'approved', 1, 3, null, d(-2) + ' 09:00:00', d(-2) + ' 09:20:00');
		insertLog.run('recharge', 3, 'create', 1, '提交会员充值：金额200元，赠送120分钟，支付方式：支付宝', d(-2) + ' 09:00:00');
		insertLog.run('recharge', 3, 'approve', 3, '审核通过，余额+200元', d(-2) + ' 09:20:00');

		insertTimeGift.run(3, 120, '充值赠送：随充值单#3附赠', 'recharge_bonus', null, 3, 'approved', 1, 3, null, d(-2) + ' 09:00:00', d(-2) + ' 09:20:00');
		insertLog.run('time_gift', 2, 'create', 1, '自动创建：随充值单#3附赠120分钟', d(-2) + ' 09:00:00');
		insertLog.run('time_gift', 2, 'approve', 3, '复核通过，赠送时长+120分钟', d(-2) + ' 09:20:00');

		insertRecharge.run(4, 30, 30, 'cash', 'pending', 1, null, null, h(-2), null);
		insertLog.run('recharge', 4, 'create', 1, '提交会员充值：金额30元，赠送30分钟，支付方式：现金', h(-2));

		insertTimeGift.run(4, 30, '充值赠送：随充值单#4附赠', 'recharge_bonus', null, 4, 'pending', 1, null, null, h(-2), null);
		insertLog.run('time_gift', 3, 'create', 1, '自动创建：随充值单#4附赠30分钟', h(-2));

		insertRecharge.run(5, 50, 60, 'wechat', 'rejected', 1, 3, '赠送时长与充值金额比例异常，请核实后重新提交', d(-4) + ' 16:00:00', d(-4) + ' 16:20:00');
		insertLog.run('recharge', 5, 'create', 1, '提交会员充值：金额50元，赠送60分钟，支付方式：微信', d(-4) + ' 16:00:00');
		insertLog.run('recharge', 5, 'reject', 3, '已退回，原因：赠送时长与充值金额比例异常，请核实后重新提交', d(-4) + ' 16:20:00');

		insertTimeGift.run(5, 60, '充值赠送：随充值单#5附赠', 'recharge_bonus', null, 5, 'rejected', 1, 3, '充值单已退回，关联赠送自动退回', d(-4) + ' 16:00:00', d(-4) + ' 16:20:00');
		insertLog.run('time_gift', 4, 'create', 1, '自动创建：随充值单#5附赠60分钟', d(-4) + ' 16:00:00');
		insertLog.run('time_gift', 4, 'reject', 3, '复核不通过：充值单已退回，关联赠送自动退回', d(-4) + ' 16:20:00');

		insertTimeGift.run(1, 30, '新会员欢迎赠送', 'promotion', null, null, 'approved', 1, 3, null, d(-4) + ' 16:00:00', d(-4) + ' 16:10:00');
		insertLog.run('time_gift', 5, 'create', 1, '提交时长赠送：30分钟，原因：新会员欢迎赠送，来源：活动', d(-4) + ' 16:00:00');
		insertLog.run('time_gift', 5, 'approve', 3, '复核通过，赠送时长+30分钟', d(-4) + ' 16:10:00');

		insertTimeGift.run(3, 120, '周末CS2赛事冠军奖励', 'tournament', 1, null, 'rejected', 2, 3, '赛事尚未结束，冠军未确认，无法发放奖励', h(-6), h(-5));
		insertLog.run('time_gift', 6, 'create', 2, '提交时长赠送：120分钟，原因：周末CS2赛事冠军奖励，来源：赛事，关联赛事：周末CS2对抗赛', h(-6));
		insertLog.run('time_gift', 6, 'reject', 3, '复核不通过：赛事尚未结束，冠军未确认，无法发放奖励', h(-5));

		insertTimeGift.run(4, 60, '设备故障补偿', 'manual', null, null, 'pending', 1, null, null, h(-3), null);
		insertLog.run('time_gift', 7, 'create', 1, '提交时长赠送：60分钟，原因：设备故障补偿，来源：手动', h(-3));

		insertTimeGift.run(2, 30, '会员生日赠送', 'promotion', null, null, 'approved', 1, 3, null, d(-6) + ' 11:00:00', d(-6) + ' 11:10:00');
		insertLog.run('time_gift', 8, 'create', 1, '提交时长赠送：30分钟，原因：会员生日赠送，来源：活动', d(-6) + ' 11:00:00');
		insertLog.run('time_gift', 8, 'approve', 3, '复核通过，赠送时长+30分钟', d(-6) + ' 11:10:00');

		insertSession.run(1, 'A-01', d(-5) + ' 10:30:00', d(-5) + ' 12:30:00', 120, 1);
		insertLog.run('session', 1, 'create', 1, '会员张三上机，机位A-01', d(-5) + ' 10:30:00');
		insertSession.run(3, 'B-05', d(-3) + ' 14:00:00', d(-3) + ' 18:00:00', 240, 1);
		insertLog.run('session', 2, 'create', 1, '会员王五上机，机位B-05', d(-3) + ' 14:00:00');
		insertSession.run(5, 'A-03', d(-2) + ' 09:30:00', null, null, 1);
		insertLog.run('session', 3, 'create', 1, '会员孙七上机，机位A-03', d(-2) + ' 09:30:00');
		insertSession.run(2, 'C-02', d(-1) + ' 15:00:00', d(-1) + ' 17:00:00', 120, 1);
		insertLog.run('session', 4, 'end', 1, '会员李四下机，机位C-02，时长120分钟', d(-1) + ' 17:00:00');

		insertTournament.run('周末CS2对抗赛', 'CS2', d(2) + ' 14:00:00', 'upcoming', 16, 120, 2);
		insertLog.run('tournament', 1, 'create', 2, '创建赛事：周末CS2对抗赛（CS2），冠军奖励120分钟', d(-3) + ' 10:00:00');
		insertTournament.run('LOL水友赛', 'LOL', d(-1) + ' 19:00:00', 'ongoing', 32, 60, 2);
		insertLog.run('tournament', 2, 'create', 2, '创建赛事：LOL水友赛（LOL），冠军奖励60分钟', d(-5) + ' 10:00:00');

		insertReg.run(1, 1, 2, 'registered');
		insertLog.run('tournament_reg', 1, 'register', 2, '会员张三报名周末CS2对抗赛', d(-2) + ' 15:00:00');
		insertReg.run(1, 3, 2, 'registered');
		insertLog.run('tournament_reg', 1, 'register', 2, '会员王五报名周末CS2对抗赛', d(-2) + ' 15:30:00');
		insertReg.run(2, 2, 2, 'checked_in');
		insertLog.run('tournament_reg', 2, 'checkin', 2, '会员李四签到LOL水友赛', d(-1) + ' 18:30:00');
		insertReg.run(2, 5, 2, 'checked_in');
		insertLog.run('tournament_reg', 2, 'checkin', 2, '会员孙七签到LOL水友赛', d(-1) + ' 18:45:00');

		insertRepair.run('A-02', '显示器闪烁，需要检查连接线', 1, 1, 'in_progress', d(-2) + ' 11:00:00', null, null);
		insertLog.run('equipment', 1, 'create', 1, '报修机位A-02：显示器闪烁，需要检查连接线', d(-2) + ' 11:00:00');
		insertLog.run('equipment', 1, 'assign', 3, '店长老赵指派网管小王处理', d(-2) + ' 11:30:00');
		insertRepair.run('B-08', '键盘部分按键失灵', 1, null, 'reported', h(-4), null, null);
		insertLog.run('equipment', 2, 'create', 1, '报修机位B-08：键盘部分按键失灵', h(-4));
		insertRepair.run('C-01', '耳机无声', 1, 1, 'resolved', d(-6) + ' 09:00:00', d(-5) + ' 16:00:00', '更换耳机，恢复正常');
		insertLog.run('equipment', 3, 'create', 1, '报修机位C-01：耳机无声', d(-6) + ' 09:00:00');
		insertLog.run('equipment', 3, 'resolve', 1, '已修复：更换耳机，恢复正常', d(-5) + ' 16:00:00');
	});

	seed();
}

export function addLog(
	entityType: string,
	entityId: number,
	action: string,
	operatorId: number,
	detail: string
) {
	getDb()
		.prepare(
			"INSERT INTO operation_logs (entity_type, entity_id, action, operator_id, detail, created_at) VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))"
		)
		.run(entityType, entityId, action, operatorId, detail);
}
