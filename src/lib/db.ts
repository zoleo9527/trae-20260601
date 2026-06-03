import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
	fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'rental.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDb() {
	db.exec(`
		CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			username TEXT UNIQUE NOT NULL,
			name TEXT NOT NULL,
			role TEXT NOT NULL CHECK (role IN ('store_clerk', 'equipment_manager', 'finance')),
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS deliveries (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			delivery_no TEXT UNIQUE NOT NULL,
			customer_name TEXT NOT NULL,
			customer_phone TEXT,
			equipment_name TEXT NOT NULL,
			equipment_model TEXT,
			serial_no TEXT,
			rental_start_date DATE NOT NULL,
			expected_return_date DATE NOT NULL,
			actual_return_date DATE,
			deposit_amount REAL DEFAULT 0,
			rental_fee REAL DEFAULT 0,
			status TEXT NOT NULL DEFAULT 'PENDING_RETURN',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS damage_reports (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			delivery_id INTEGER NOT NULL,
			reported_by INTEGER NOT NULL,
			damage_type TEXT NOT NULL,
			description TEXT NOT NULL,
			severity TEXT NOT NULL CHECK (severity IN ('minor', 'moderate', 'severe')),
			estimated_cost REAL,
			materials_provided TEXT,
			materials_missing TEXT,
			photos TEXT,
			status TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
			reviewed_by INTEGER,
			review_comment TEXT,
			reviewed_at DATETIME,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (delivery_id) REFERENCES deliveries(id),
			FOREIGN KEY (reported_by) REFERENCES users(id),
			FOREIGN KEY (reviewed_by) REFERENCES users(id)
		);

		CREATE TABLE IF NOT EXISTS repair_followups (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			damage_report_id INTEGER NOT NULL,
			assigned_to INTEGER NOT NULL,
			repair_type TEXT,
			repair_description TEXT,
			actual_cost REAL,
			repair_status TEXT NOT NULL DEFAULT 'PENDING',
			repair_start_date DATE,
			repair_complete_date DATE,
			repair_notes TEXT,
			created_by INTEGER NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (damage_report_id) REFERENCES damage_reports(id),
			FOREIGN KEY (assigned_to) REFERENCES users(id),
			FOREIGN KEY (created_by) REFERENCES users(id)
		);

		CREATE TABLE IF NOT EXISTS status_logs (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			delivery_id INTEGER NOT NULL,
			old_status TEXT,
			new_status TEXT NOT NULL,
			changed_by INTEGER NOT NULL,
			change_reason TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (delivery_id) REFERENCES deliveries(id),
			FOREIGN KEY (changed_by) REFERENCES users(id)
		);

		CREATE TABLE IF NOT EXISTS payments (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			delivery_id INTEGER NOT NULL,
			amount REAL NOT NULL,
			payment_type TEXT NOT NULL,
			confirmed_by INTEGER NOT NULL,
			confirmed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			notes TEXT,
			FOREIGN KEY (delivery_id) REFERENCES deliveries(id),
			FOREIGN KEY (confirmed_by) REFERENCES users(id)
		);

		CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
		CREATE INDEX IF NOT EXISTS idx_deliveries_delivery_no ON deliveries(delivery_no);
		CREATE INDEX IF NOT EXISTS idx_damage_reports_delivery ON damage_reports(delivery_id);
		CREATE INDEX IF NOT EXISTS idx_repair_followups_damage ON repair_followups(damage_report_id);
		CREATE INDEX IF NOT EXISTS idx_status_logs_delivery ON status_logs(delivery_id);
	`);

	const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
	if (userCount.count === 0) {
		const insertUser = db.prepare(
			'INSERT INTO users (username, name, role) VALUES (?, ?, ?)'
		);
		insertUser.run('clerk1', '张门店', 'store_clerk');
		insertUser.run('manager1', '李器材', 'equipment_manager');
		insertUser.run('finance1', '王财务', 'finance');
	}

	const deliveryCount = db.prepare('SELECT COUNT(*) as count FROM deliveries').get() as { count: number };
	if (deliveryCount.count === 0) {
		seedData();
	}
}

function seedData() {
	const insertDelivery = db.prepare(`
		INSERT INTO deliveries (
			delivery_no, customer_name, customer_phone, equipment_name,
			equipment_model, serial_no, rental_start_date, expected_return_date,
			actual_return_date, deposit_amount, rental_fee, status
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`);

	const insertDamage = db.prepare(`
		INSERT INTO damage_reports (
			delivery_id, reported_by, damage_type, description, severity,
			estimated_cost, materials_provided, materials_missing,
			status, reviewed_by, review_comment, reviewed_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`);

	const insertRepair = db.prepare(`
		INSERT INTO repair_followups (
			damage_report_id, assigned_to, repair_type, repair_description,
			repair_status, repair_start_date, repair_complete_date, actual_cost, repair_notes, created_by
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`);

	const insertStatusLog = db.prepare(`
		INSERT INTO status_logs (
			delivery_id, old_status, new_status, changed_by, change_reason
		) VALUES (?, ?, ?, ?, ?)
	`);

	const insertPayment = db.prepare(`
		INSERT INTO payments (delivery_id, amount, payment_type, confirmed_by, notes)
		VALUES (?, ?, ?, ?, ?)
	`);

	const today = new Date();
	const formatDate = (d: Date) => d.toISOString().split('T')[0];

	const d1 = new Date(today); d1.setDate(d1.getDate() - 10);
	const d2 = new Date(today); d2.setDate(d2.getDate() - 5);
	const d3 = new Date(today); d3.setDate(d3.getDate() - 3);
	const d4 = new Date(today); d4.setDate(d4.getDate() - 15);
	const d5 = new Date(today); d5.setDate(d5.getDate() - 7);
	const d6 = new Date(today); d6.setDate(d6.getDate() - 2);
	const d7 = new Date(today); d7.setDate(d7.getDate() + 3);

	// ── 1. 缺材料单 ──
	const delivery1Id = insertDelivery.run(
		'REN20260520001', '陈先生', '13800138001',
		'佳能 EOS R5 全画幅微单', 'EOS R5', 'CN01234567',
		formatDate(d1), formatDate(d2), formatDate(d3),
		8000, 350, 'MATERIALS_MISSING'
	).lastInsertRowid as number;

	insertDamage.run(
		delivery1Id, 1, '镜头划痕',
		'镜头前组镜片有明显划痕，约3mm长，影响成像',
		'moderate', 1200,
		'镜头盖、说明书',
		'原装电池1块、充电器、镜头袋',
		'PENDING_REVIEW', null, null, null
	);

	insertStatusLog.run(delivery1Id, 'RETURNED', 'DAMAGE_IDENTIFIED', 1, '归还时发现镜头划痕');
	insertStatusLog.run(delivery1Id, 'DAMAGE_IDENTIFIED', 'MATERIALS_MISSING', 1, '缺少原装电池和充电器');

	// ── 2. 超时单（维修已完成但超时未处理） ──
	const delivery2Id = insertDelivery.run(
		'REN20260515002', '刘女士', '13900139002',
		'索尼 FE 24-70mm F2.8 GM II 镜头', 'SEL2470GM2', 'SN20245678',
		formatDate(d4), formatDate(d5), formatDate(d6),
		5000, 280, 'REPAIR_COMPLETED'
	).lastInsertRowid as number;

	insertDamage.run(
		delivery2Id, 1, '变焦环卡涩',
		'变焦环转动不顺畅，有异响',
		'minor', 500,
		'完整配件', '',
		'REVIEW_REJECTED', 2, '初次鉴定描述不清，需补充检查变焦环阻尼和光圈联动', formatDate(d5)
	);

	const damage2bId = insertDamage.run(
		delivery2Id, 1, '镜筒掉漆',
		'镜筒多处掉漆，有磕碰痕迹',
		'minor', 300,
		'完整配件', '',
		'APPROVED', 2, '鉴定通过，掉漆属实', formatDate(d5)
	).lastInsertRowid as number;

	insertRepair.run(
		damage2bId, 2, '外观修复',
		'镜筒补漆处理',
		'REPAIR_COMPLETED',
		formatDate(d6), formatDate(d6), 280, '补漆完成，外观恢复', 2
	);

	insertStatusLog.run(delivery2Id, 'RETURNED', 'DAMAGE_IDENTIFIED', 1, '归还时发现变焦环问题');
	insertStatusLog.run(delivery2Id, 'DAMAGE_IDENTIFIED', 'REVIEW_REJECTED', 2, '初次鉴定描述不清，要求重新检查');
	insertStatusLog.run(delivery2Id, 'REVIEW_REJECTED', 'DAMAGE_IDENTIFIED', 1, '补充检查发现镜筒掉漆');
	insertStatusLog.run(delivery2Id, 'DAMAGE_IDENTIFIED', 'REPAIR_PENDING', 2, '鉴定通过，待安排维修');
	insertStatusLog.run(delivery2Id, 'REPAIR_PENDING', 'REPAIR_IN_PROGRESS', 2, '维修开始');
	insertStatusLog.run(delivery2Id, 'REPAIR_IN_PROGRESS', 'REPAIR_COMPLETED', 2, '维修完成，镜筒补漆');

	// ── 3. 待归还（正常单） ──
	const delivery3Id = insertDelivery.run(
		'REN20260525003', '周先生', '13700137003',
		'大疆 Mavic 3 Pro 无人机', 'Mavic 3 Pro', 'DJI20260001',
		formatDate(d3), formatDate(d7), null,
		15000, 1200, 'PENDING_RETURN'
	).lastInsertRowid as number;

	insertStatusLog.run(delivery3Id, null, 'PENDING_RETURN', 1, '设备已出库');

	// ── 4. 复核不通过单 ── 补齐复核人和复核意见
	const delivery4Id = insertDelivery.run(
		'REN20260510004', '赵女士', '13600136004',
		'神牛 AD600 Pro 外拍灯', 'AD600 Pro', 'GN20240012',
		formatDate(d4), formatDate(d1), formatDate(d2),
		3000, 450, 'REVIEW_REJECTED'
	).lastInsertRowid as number;

	const damage4Id = insertDamage.run(
		delivery4Id, 1, '电池鼓包',
		'原配电池鼓包，无法正常使用',
		'severe', 800,
		'灯体、反光罩',
		'原装电池',
		'REVIEW_REJECTED',
		2,
		'鉴定不通过：电池鼓包需客户确认是否为租赁期间损坏，而非存放不当导致',
		formatDate(d2)
	).lastInsertRowid as number;

	insertRepair.run(
		damage4Id, 2, '电池更换',
		'更换原装锂电池',
		'PENDING',
		null, null, null, null, 2
	);

	insertStatusLog.run(delivery4Id, 'RETURNED', 'DAMAGE_IDENTIFIED', 1, '归还时发现电池鼓包');
	insertStatusLog.run(delivery4Id, 'DAMAGE_IDENTIFIED', 'REVIEW_REJECTED', 2, '鉴定不通过：需客户确认电池是租赁期间损坏');

	// ── 5. 维修中单 ──
	const delivery5Id = insertDelivery.run(
		'REN20260518005', '孙先生', '13500135005',
		'曼富图 504X 液压云台', '504X', 'MV20250089',
		formatDate(d5), formatDate(d3), formatDate(d6),
		2000, 180, 'REPAIR_IN_PROGRESS'
	).lastInsertRowid as number;

	const damage5Id = insertDamage.run(
		delivery5Id, 1, '云台漏油',
		'液压云台底部有明显漏油痕迹，阻尼不顺畅',
		'moderate', 600,
		'完整配件', '',
		'APPROVED', 2, '鉴定通过，漏油属实', formatDate(d6)
	).lastInsertRowid as number;

	insertRepair.run(
		damage5Id, 2, '液压系统维修',
		'拆解清洗，更换密封圈，重新注油',
		'IN_PROGRESS',
		formatDate(d6), null, null, null, 2
	);

	insertPayment.run(delivery5Id, 600, 'repair_fee', 3, '维修费用从押金扣除');

	insertStatusLog.run(delivery5Id, 'RETURNED', 'DAMAGE_IDENTIFIED', 1, '归还时发现云台漏油');
	insertStatusLog.run(delivery5Id, 'DAMAGE_IDENTIFIED', 'REPAIR_PENDING', 2, '鉴定通过，待安排维修');
	insertStatusLog.run(delivery5Id, 'REPAIR_PENDING', 'REPAIR_IN_PROGRESS', 2, '开始维修，预计3天完成');
}

export default db;
