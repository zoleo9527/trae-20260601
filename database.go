package main

import (
	"database/sql"
	"log"
	"time"

	_ "modernc.org/sqlite"
)

type DB struct {
	*sql.DB
}

var database *DB

func InitDB() *DB {
	db, err := sql.Open("sqlite", "./lottery.db?_pragma=foreign_keys(1)&_pragma=journal_mode(WAL)")
	if err != nil {
		log.Fatal(err)
	}

	database = &DB{db}
	database.createTables()
	database.seedData()
	return database
}

func (d *DB) createTables() {
	schemas := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			username TEXT NOT NULL UNIQUE,
			name TEXT NOT NULL,
			role TEXT NOT NULL CHECK(role IN ('clerk','store_manager','area_manager')),
			store_id INTEGER,
			area_id INTEGER,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS stores (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			area_id INTEGER,
			address TEXT
		)`,
		`CREATE TABLE IF NOT EXISTS shift_settlements (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			store_id INTEGER NOT NULL,
			shift_no TEXT NOT NULL,
			clerk_id INTEGER NOT NULL,
			shift_date DATE NOT NULL,
			shift_type TEXT NOT NULL CHECK(shift_type IN ('morning','afternoon','night')),
			ticket_sales REAL DEFAULT 0,
			scratch_sales REAL DEFAULT 0,
			total_sales REAL DEFAULT 0,
			cash_expected REAL DEFAULT 0,
			cash_actual REAL,
			status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','submitted','approved','rejected','pending_cash')),
			reject_reason TEXT,
			created_by INTEGER NOT NULL,
			approved_by INTEGER,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (store_id) REFERENCES stores(id),
			FOREIGN KEY (clerk_id) REFERENCES users(id)
		)`,
		`CREATE TABLE IF NOT EXISTS cash_verifications (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			shift_settlement_id INTEGER NOT NULL UNIQUE,
			store_id INTEGER NOT NULL,
			store_manager_id INTEGER,
			area_manager_id INTEGER,
			cash_declared REAL NOT NULL,
			cash_counted REAL,
			difference REAL,
			status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','counting','matched','mismatched','escalated','resolved')),
			previous_conclusion TEXT,
			material_notes TEXT,
			notes TEXT,
			resolution TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (shift_settlement_id) REFERENCES shift_settlements(id)
		)`,
		`CREATE TABLE IF NOT EXISTS materials (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			cash_verification_id INTEGER NOT NULL,
			type TEXT NOT NULL CHECK(type IN ('redeem_register','fault_ticket','bank_slip','receipt','other')),
			name TEXT NOT NULL,
			amount REAL,
			reference_no TEXT,
			file_url TEXT,
			uploaded_by INTEGER,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (cash_verification_id) REFERENCES cash_verifications(id)
		)`,
		`CREATE TABLE IF NOT EXISTS operation_logs (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			ref_type TEXT NOT NULL CHECK(ref_type IN ('shift_settlement','cash_verification')),
			ref_id INTEGER NOT NULL,
			action TEXT NOT NULL,
			old_status TEXT,
			new_status TEXT,
			operator_id INTEGER NOT NULL,
			operator_name TEXT NOT NULL,
			operator_role TEXT NOT NULL,
			detail TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS notifications (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			ref_type TEXT NOT NULL,
			ref_id INTEGER NOT NULL,
			type TEXT NOT NULL CHECK(type IN ('approval','review','escalation','mismatch','overdue')),
			title TEXT NOT NULL,
			content TEXT,
			is_read INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id)
		)`,
		`CREATE INDEX IF NOT EXISTS idx_settlement_store ON shift_settlements(store_id, status)`,
		`CREATE INDEX IF NOT EXISTS idx_cash_status ON cash_verifications(status)`,
		`CREATE INDEX IF NOT EXISTS idx_logs_ref ON operation_logs(ref_type, ref_id)`,
		`CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, is_read)`,
	}

	for _, s := range schemas {
		if _, err := d.Exec(s); err != nil {
			log.Printf("Schema error: %v, SQL: %s", err, s)
		}
	}
}

func (d *DB) seedData() {
	var count int
	d.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
	if count > 0 {
		return
	}

	d.Exec(`INSERT INTO stores (id, name, area_id, address) VALUES
		(1, '朝阳路旗舰店', 1, '北京市朝阳区朝阳路168号'),
		(2, '海淀中关村店', 1, '北京市海淀区中关村大街1号'),
		(3, '西城金融街店', 2, '北京市西城区金融街10号')`)

	d.Exec(`INSERT INTO users (id, username, name, role, store_id, area_id) VALUES
		(1, 'clerk_wang', '王小明', 'clerk', 1, 1),
		(2, 'clerk_li', '李小红', 'clerk', 1, 1),
		(3, 'manager_zhang', '张店长', 'store_manager', 1, 1),
		(4, 'area_zhao', '赵片区', 'area_manager', NULL, 1),
		(5, 'clerk_chen', '陈小刚', 'clerk', 2, 1),
		(6, 'manager_sun', '孙店长', 'store_manager', 2, 1)`)

	now := time.Now()
	today := now.Format("2006-01-02")
	yesterday := now.AddDate(0, 0, -1).Format("2006-01-02")
	twoDaysAgo := now.AddDate(0, 0, -2).Format("2006-01-02")
	hm := func(days, h, m int) time.Time {
		return now.AddDate(0, 0, days).Add(time.Duration(h)*time.Hour + time.Duration(m)*time.Minute)
	}

	d.Exec(`INSERT INTO shift_settlements (id, store_id, shift_no, clerk_id, shift_date, shift_type, ticket_sales, scratch_sales, total_sales, cash_expected, cash_actual, status, reject_reason, created_by, approved_by, created_at, updated_at) VALUES
		(1, 1, 'SS20260612M001', 1, ?, 'morning', 12680.00, 3500.00, 16180.00, 16180.00, NULL, 'pending_cash', NULL, 1, 3, ?, ?),
		(2, 1, 'SS20260613A001', 1, ?, 'afternoon', 8920.50, 1200.00, 10120.50, 10120.50, 9820.50, 'submitted', NULL, 1, NULL, ?, ?),
		(3, 1, 'SS20260613N001', 2, ?, 'night', 5670.00, 800.00, 6470.00, 6470.00, 6470.00, 'approved', NULL, 2, 3, ?, ?),
		(4, 1, 'SS20260614M001', 1, ?, 'morning', 9450.00, 2100.00, 11550.00, 11550.00, NULL, 'rejected', '系统数据与销售小票总额不一致，请重新核对', 1, NULL, ?, ?),
		(5, 2, 'SS20260613M001', 5, ?, 'morning', 7230.00, 1500.00, 8730.00, 8730.00, 8730.00, 'approved', NULL, 5, 6, ?, ?),
		(6, 2, 'SS20260614A001', 5, ?, 'afternoon', 6890.00, 2200.00, 9090.00, 9090.00, NULL, 'pending_cash', NULL, 5, 6, ?, ?)`,
		twoDaysAgo, hm(-2, 12, 0), hm(-2, 14, 0),
		yesterday, hm(-1, 18, 0), hm(-1, 18, 0),
		yesterday, hm(-1, 22, 0), hm(-1, 23, 0),
		today, hm(0, 9, 0), hm(0, 10, 0),
		yesterday, hm(-1, 14, 0), hm(-1, 15, 0),
		today, hm(0, 2, 0), hm(0, 3, 0))

	d.Exec(`INSERT INTO cash_verifications (id, shift_settlement_id, store_id, store_manager_id, area_manager_id, cash_declared, cash_counted, difference, status, previous_conclusion, material_notes, notes, resolution, created_at, updated_at) VALUES
		(1, 1, 1, 3, NULL, 16180.00, 15680.00, -500.00, 'escalated', '店长初盘发现短款500元，店员王小明坚称已全额上交，现场监控有死角', '兑奖登记单3张共1820元、设备故障单1张(终端号T001读卡器异常)', '短款原因待查，店员声称中午替隔壁店临时兑奖500元但无记录', '已申请调取周边3家门店监控，待片区复核', ?, ?),
		(2, 3, 1, 3, NULL, 6470.00, 6470.00, 0.00, 'matched', '正常交接，无异常', '兑奖登记单2张共460元，无设备故障', '账实相符，现金已入保险柜', '', ?, ?),
		(3, 5, 2, 6, NULL, 8730.00, 8730.00, 0.00, 'matched', '正常', '兑奖1张100元', '核对无误', '', ?, ?),
		(4, 6, 2, 6, NULL, 9090.00, NULL, NULL, 'pending', NULL, NULL, NULL, NULL, ?, ?)`,
		hm(-2, 14, 0), hm(-1, 10, 0),
		hm(-1, 23, 0), hm(-1, 23, 0),
		hm(-1, 15, 0), hm(-1, 15, 0),
		hm(0, 3, 0), hm(0, 3, 0))

	d.Exec(`INSERT INTO materials (cash_verification_id, type, name, amount, reference_no, uploaded_by, created_at) VALUES
		(1, 'redeem_register', '兑奖登记单-20260612-001', 680.00, 'RD20260612001', 3, ?),
		(1, 'redeem_register', '兑奖登记单-20260612-002', 940.00, 'RD20260612002', 3, ?),
		(1, 'redeem_register', '兑奖登记单-20260612-003', 200.00, 'RD20260612003', 3, ?),
		(1, 'fault_ticket', '设备故障单-T001读卡器', 0, 'FT20260612T001', 3, ?),
		(1, 'receipt', '银行存款回执-未完成', NULL, NULL, 3, ?),
		(2, 'redeem_register', '兑奖登记单-夜班汇总', 460.00, 'RD20260613004', 3, ?),
		(3, 'redeem_register', '兑奖登记-中关村店', 100.00, 'RD20260613010', 6, ?)`,
		hm(-2, 14, 0), hm(-2, 14, 5), hm(-2, 14, 10), hm(-2, 14, 15),
		hm(-2, 15, 0), hm(-1, 23, 0), hm(-1, 15, 0))

	d.Exec(`INSERT INTO operation_logs (ref_type, ref_id, action, old_status, new_status, operator_id, operator_name, operator_role, detail, created_at) VALUES
		('shift_settlement', 1, 'create', NULL, 'draft', 1, '王小明', 'clerk', '创建早班销售班结，销售总额16180元', ?),
		('shift_settlement', 1, 'submit', 'draft', 'submitted', 1, '王小明', 'clerk', '提交班结申请', ?),
		('shift_settlement', 1, 'approve', 'submitted', 'pending_cash', 3, '张店长', 'store_manager', '数据审核通过，待现金核对', ?),
		('cash_verification', 1, 'create', NULL, 'pending', 3, '张店长', 'store_manager', '创建现金核对单，申报金额16180元', ?),
		('cash_verification', 1, 'start_count', 'pending', 'counting', 3, '张店长', 'store_manager', '开始现场盘点', ?),
		('cash_verification', 1, 'count_result', 'counting', 'mismatched', 3, '张店长', 'store_manager', '盘点实得15680元，短款500元', ?),
		('cash_verification', 1, 'upload_material', NULL, NULL, 3, '张店长', 'store_manager', '上传兑奖登记单3张、故障单1张', ?),
		('cash_verification', 1, 'escalate', 'mismatched', 'escalated', 3, '张店长', 'store_manager', '无法达成一致，上报片区管理员', ?),
		('shift_settlement', 2, 'create', NULL, 'draft', 1, '王小明', 'clerk', '创建下午班结，销售10120.50元', ?),
		('shift_settlement', 2, 'submit', 'draft', 'submitted', 1, '王小明', 'clerk', '提交班结（现金申报9820.50，差异300元原因未注明）', ?),
		('shift_settlement', 3, 'create', NULL, 'draft', 2, '李小红', 'clerk', '创建夜班结6470元', ?),
		('shift_settlement', 3, 'submit', 'draft', 'submitted', 2, '李小红', 'clerk', '提交', ?),
		('shift_settlement', 3, 'approve', 'submitted', 'approved', 3, '张店长', 'store_manager', '数据+现金全通过', ?),
		('cash_verification', 2, 'create', NULL, 'matched', 3, '张店长', 'store_manager', '现金清点无误，直接匹配', ?),
		('shift_settlement', 4, 'create', NULL, 'draft', 1, '王小明', 'clerk', '今日早班销售11550元', ?),
		('shift_settlement', 4, 'submit', 'draft', 'submitted', 1, '王小明', 'clerk', '提交班结', ?),
		('shift_settlement', 4, 'reject', 'submitted', 'rejected', 3, '张店长', 'store_manager', '驳回：系统数据与销售小票总额不一致，请重新核对', ?),
		('shift_settlement', 5, 'approve', 'submitted', 'approved', 6, '孙店长', 'store_manager', '审核通过', ?),
		('cash_verification', 3, 'create', NULL, 'matched', 6, '孙店长', 'store_manager', '现金核对完成', ?),
		('shift_settlement', 6, 'submit', 'draft', 'submitted', 5, '陈小刚', 'clerk', '提交班结', ?),
		('shift_settlement', 6, 'approve', 'submitted', 'pending_cash', 6, '孙店长', 'store_manager', '数据通过，待现金核对', ?),
		('cash_verification', 4, 'create', NULL, 'pending', 6, '孙店长', 'store_manager', '待店长核对现金', ?)`,
		hm(-2, 12, 0), hm(-2, 12, 30), hm(-2, 13, 0), hm(-2, 14, 0),
		hm(-2, 14, 30), hm(-2, 15, 0), hm(-2, 15, 20), hm(-1, 10, 0),
		hm(-1, 18, 0), hm(-1, 18, 40), hm(-1, 22, 0), hm(-1, 22, 30),
		hm(-1, 23, 0), hm(-1, 23, 0), hm(0, 9, 0), hm(0, 9, 30),
		hm(0, 10, 0), hm(-1, 14, 0), hm(-1, 15, 0), hm(0, 2, 0),
		hm(0, 2, 30), hm(0, 3, 0))

	d.Exec(`INSERT INTO notifications (user_id, ref_type, ref_id, type, title, content, created_at) VALUES
		(4, 'cash_verification', 1, 'escalation', '现金短款已升级：朝阳路旗舰店早班缺500元', '店长张店长无法与店员就短款500元达成一致，申请片区介入。涉及班结SS20260612M001。', ?),
		(3, 'cash_verification', 1, 'mismatch', '现金短款提醒：500元未解决', '您上报的朝阳路旗舰店现金差异等待片区处理已超过1天，请关注。', ?),
		(1, 'shift_settlement', 4, 'approval', '班结被驳回：请重新核对销售数据', '店长张店长驳回了您的班结SS20260614M001：系统数据与销售小票总额不一致。', ?),
		(3, 'shift_settlement', 2, 'review', '待审核：王小明下午班现金自报少300元', '班结SS20260613A001店员申报现金9820.50，较系统少300元，请重点关注。', ?),
		(6, 'cash_verification', 4, 'review', '待现金核对：中关村店下午班9090元', '班结SS20260614A001数据已审核，请安排现场现金清点。', ?),
		(4, 'shift_settlement', 2, 'review', '片区关注：现金自报差异超2小时未处理', '朝阳路旗舰店班结SS20260613A001有300元差异未说明，建议督促店长处理。', ?)`,
		hm(-1, 10, 0), hm(0, 1, 0), hm(0, 10, 0),
		hm(-1, 19, 0), hm(0, 3, 0), hm(0, 0, 30))
}
