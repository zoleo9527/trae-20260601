use super::models::*;
use chrono::Local;
use dirs::data_dir;
use rusqlite::{params, Connection, Result};
use std::fs;
use std::path::PathBuf;

const STATUS_PENDING: &str = "pending";
const STATUS_PENDING_TEXT: &str = "待确认";
const STATUS_RETURNED: &str = "returned";
const STATUS_RETURNED_TEXT: &str = "已退回";
const STATUS_SUPPLEMENTED: &str = "supplemented";
const STATUS_SUPPLEMENTED_TEXT: &str = "待复核";
const STATUS_APPROVED: &str = "approved";
const STATUS_APPROVED_TEXT: &str = "已确认";
const STATUS_REJECTED: &str = "rejected";
const STATUS_REJECTED_TEXT: &str = "已拒绝";
const STATUS_VERIFIED: &str = "verified";
const STATUS_VERIFIED_TEXT: &str = "已核销";

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new() -> Result<Self> {
        let db_path = Self::get_db_path();
        if let Some(parent) = db_path.parent() {
            fs::create_dir_all(parent).ok();
        }
        let conn = Connection::open(&db_path)?;
        let db = Self { conn };
        db.init_tables()?;
        Ok(db)
    }

    fn get_db_path() -> PathBuf {
        let mut path = data_dir().unwrap_or_else(|| PathBuf::from("."));
        path.push("stadium-operation");
        path.push("data.db");
        path
    }

    fn init_tables(&self) -> Result<()> {
        self.conn.execute_batch(
            r#"
            CREATE TABLE IF NOT EXISTS courts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                court_type TEXT NOT NULL,
                price_per_hour REAL NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS coaches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT,
                specialty TEXT
            );

            CREATE TABLE IF NOT EXISTS member_cards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                card_no TEXT NOT NULL UNIQUE,
                member_name TEXT NOT NULL,
                phone TEXT,
                balance REAL NOT NULL DEFAULT 0,
                card_type TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                booking_no TEXT NOT NULL UNIQUE,
                court_id INTEGER NOT NULL,
                coach_id INTEGER,
                member_id INTEGER,
                booker_name TEXT NOT NULL,
                booker_phone TEXT NOT NULL,
                booking_date TEXT NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                status TEXT NOT NULL,
                status_text TEXT NOT NULL,
                created_by TEXT NOT NULL,
                created_at TEXT NOT NULL,
                return_reason TEXT,
                return_by TEXT,
                return_at TEXT,
                supplement_note TEXT,
                supplement_by TEXT,
                supplement_at TEXT,
                review_result TEXT,
                review_note TEXT,
                review_by TEXT,
                review_at TEXT,
                verify_status TEXT,
                verify_card_no TEXT,
                verify_balance_before REAL,
                verify_balance_after REAL,
                verify_amount REAL,
                verify_by TEXT,
                verify_at TEXT,
                liability_flag TEXT,
                remark TEXT,
                FOREIGN KEY (court_id) REFERENCES courts(id),
                FOREIGN KEY (coach_id) REFERENCES coaches(id),
                FOREIGN KEY (member_id) REFERENCES member_cards(id)
            );

            CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
            CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
            "#,
        )?;
        Ok(())
    }

    pub fn init_seed_data(&self) -> Result<()> {
        let count: i64 = self.conn.query_row("SELECT COUNT(*) FROM courts", [], |row| row.get(0))?;
        if count > 0 {
            return Ok(());
        }

        let courts = vec![
            ("1号场", "羽毛球", 50.0),
            ("2号场", "羽毛球", 50.0),
            ("3号场", "羽毛球", 60.0),
            ("4号场", "篮球", 200.0),
            ("5号场", "网球", 80.0),
            ("6号场", "乒乓球", 30.0),
        ];
        for (name, court_type, price) in courts {
            self.conn.execute(
                "INSERT INTO courts (name, court_type, price_per_hour) VALUES (?1, ?2, ?3)",
                params![name, court_type, price],
            )?;
        }

        let coaches = vec![
            ("张教练", "13800138001", "羽毛球"),
            ("李教练", "13800138002", "篮球"),
            ("王教练", "13800138003", "网球"),
        ];
        for (name, phone, specialty) in coaches {
            self.conn.execute(
                "INSERT INTO coaches (name, phone, specialty) VALUES (?1, ?2, ?3)",
                params![name, phone, specialty],
            )?;
        }

        let members = vec![
            ("C001", "陈会员", "13900139001", 1500.0, "年卡"),
            ("C002", "刘会员", "13900139002", 800.0, "次卡"),
            ("C003", "周会员", "13900139003", 300.0, "月卡"),
        ];
        for (card_no, name, phone, balance, card_type) in members {
            self.conn.execute(
                "INSERT INTO member_cards (card_no, member_name, phone, balance, card_type) VALUES (?1, ?2, ?3, ?4, ?5)",
                params![card_no, name, phone, balance, card_type],
            )?;
        }

        self.create_demo_bookings()?;
        Ok(())
    }

    fn create_demo_bookings(&self) -> Result<()> {
        let today = Local::now().format("%Y-%m-%d").to_string();
        let demos = vec![
            (1, None, Some(1), "陈会员", "13900139001", &today, "09:00", "10:00", "前台小王", STATUS_PENDING, STATUS_PENDING_TEXT, None, None),
            (2, Some(1), Some(2), "刘会员", "13900139002", &today, "14:00", "16:00", "前台小李", STATUS_RETURNED, STATUS_RETURNED_TEXT, Some("会员卡信息不一致，需要补充"), Some("值班店长")),
            (3, Some(2), None, "散客赵", "13700137001", &today, "19:00", "21:00", "前台小王", STATUS_SUPPLEMENTED, STATUS_SUPPLEMENTED_TEXT, None, None),
            (4, None, Some(3), "周会员", "13900139003", &today, "10:00", "11:00", "前台小李", STATUS_VERIFIED, STATUS_VERIFIED_TEXT, None, None),
            (5, Some(3), Some(1), "陈会员", "13900139001", &today, "15:00", "17:00", "前台小王", STATUS_APPROVED, STATUS_APPROVED_TEXT, None, None),
        ];

        for (i, (court_id, coach_id, member_id, booker_name, booker_phone, booking_date, start_time, end_time, created_by, status, status_text, return_reason, return_by)) in demos.iter().enumerate() {
            let booking_no = format!("B{:08}", i + 1);
            let created_at = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
            let return_at = if return_reason.is_some() {
                Some(Local::now().format("%Y-%m-%d %H:%M:%S").to_string())
            } else {
                None
            };

            let mut liability_flag = None;
            if status == STATUS_RETURNED || status == STATUS_PENDING {
                liability_flag = Some("待确认:场地预约/会员核销责任不清".to_string());
            }

            self.conn.execute(
                r#"INSERT INTO bookings 
                (booking_no, court_id, coach_id, member_id, booker_name, booker_phone, 
                 booking_date, start_time, end_time, status, status_text, 
                 created_by, created_at, return_reason, return_by, return_at, liability_flag)
                VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17)"#,
                params![
                    booking_no, court_id, coach_id, member_id, booker_name, booker_phone,
                    booking_date, start_time, end_time, status, status_text,
                    created_by, created_at, return_reason, return_by, return_at, liability_flag
                ],
            )?;

            if status == STATUS_VERIFIED {
                self.conn.execute(
                    r#"UPDATE bookings SET 
                        verify_status = 'verified',
                        verify_card_no = 'C003',
                        verify_balance_before = 350.0,
                        verify_balance_after = 300.0,
                        verify_amount = 50.0,
                        verify_by = '前台小李',
                        verify_at = ?1
                    WHERE booking_no = ?2"#,
                    params![created_at, booking_no],
                )?;
            }
        }
        Ok(())
    }

    fn generate_booking_no() -> String {
        format!("B{}", Local::now().format("%Y%m%d%H%M%S"))
    }

    pub fn create_booking(&self, b: CreateBooking) -> Result<BookingRecord> {
        let booking_no = Self::generate_booking_no();
        let created_at = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
        let liability_flag = if b.member_id.is_some() {
            Some("待确认:场地预约/会员核销责任不清".to_string())
        } else {
            None
        };

        self.conn.execute(
            r#"INSERT INTO bookings 
            (booking_no, court_id, coach_id, member_id, booker_name, booker_phone, 
             booking_date, start_time, end_time, status, status_text, 
             created_by, created_at, liability_flag, remark)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)"#,
            params![
                booking_no, b.court_id, b.coach_id, b.member_id, b.booker_name, b.booker_phone,
                b.booking_date, b.start_time, b.end_time, STATUS_PENDING, STATUS_PENDING_TEXT,
                b.created_by, created_at, liability_flag, b.remark
            ],
        )?;

        let id = self.conn.last_insert_rowid();
        self.get_booking_by_id(id)
    }

    pub fn get_booking_by_id(&self, id: i64) -> Result<BookingRecord> {
        self.conn.query_row(
            r#"SELECT 
                b.id, b.booking_no, b.court_id, c.name as court_name,
                b.coach_id, ch.name as coach_name,
                b.member_id, m.member_name, m.card_no as member_card_no,
                b.booker_name, b.booker_phone, b.booking_date, b.start_time, b.end_time,
                b.status, b.status_text, b.created_by, b.created_at,
                b.return_reason, b.return_by, b.return_at,
                b.supplement_note, b.supplement_by, b.supplement_at,
                b.review_result, b.review_note, b.review_by, b.review_at,
                b.verify_status, b.verify_card_no, b.verify_balance_before, 
                b.verify_balance_after, b.verify_amount, b.verify_by, b.verify_at,
                b.liability_flag, b.remark
            FROM bookings b
            LEFT JOIN courts c ON b.court_id = c.id
            LEFT JOIN coaches ch ON b.coach_id = ch.id
            LEFT JOIN member_cards m ON b.member_id = m.id
            WHERE b.id = ?1"#,
            params![id],
            Self::row_to_booking,
        )
    }

    pub fn get_bookings(&self, filter: BookingFilter) -> Result<Vec<BookingRecord>> {
        let mut sql = r#"SELECT 
                b.id, b.booking_no, b.court_id, c.name as court_name,
                b.coach_id, ch.name as coach_name,
                b.member_id, m.member_name, m.card_no as member_card_no,
                b.booker_name, b.booker_phone, b.booking_date, b.start_time, b.end_time,
                b.status, b.status_text, b.created_by, b.created_at,
                b.return_reason, b.return_by, b.return_at,
                b.supplement_note, b.supplement_by, b.supplement_at,
                b.review_result, b.review_note, b.review_by, b.review_at,
                b.verify_status, b.verify_card_no, b.verify_balance_before, 
                b.verify_balance_after, b.verify_amount, b.verify_by, b.verify_at,
                b.liability_flag, b.remark
            FROM bookings b
            LEFT JOIN courts c ON b.court_id = c.id
            LEFT JOIN coaches ch ON b.coach_id = ch.id
            LEFT JOIN member_cards m ON b.member_id = m.id
            WHERE 1=1"#
            .to_string();

        let mut params_vec: Vec<String> = Vec::new();

        if let Some(status) = &filter.status {
            sql.push_str(" AND b.status = ?");
            params_vec.push(status.clone());
        }
        if let Some(date_from) = &filter.date_from {
            sql.push_str(" AND b.booking_date >= ?");
            params_vec.push(date_from.clone());
        }
        if let Some(date_to) = &filter.date_to {
            sql.push_str(" AND b.booking_date <= ?");
            params_vec.push(date_to.clone());
        }
        if let Some(court_id) = &filter.court_id {
            sql.push_str(" AND b.court_id = ?");
            params_vec.push(court_id.to_string());
        }
        if let Some(keyword) = &filter.keyword {
            sql.push_str(" AND (b.booker_name LIKE ? OR b.booking_no LIKE ? OR b.booker_phone LIKE ?)");
            let kw = format!("%{}%", keyword);
            params_vec.push(kw.clone());
            params_vec.push(kw.clone());
            params_vec.push(kw);
        }

        sql.push_str(" ORDER BY b.booking_date DESC, b.start_time DESC");

        let mut stmt = self.conn.prepare(&sql)?;
        let params_ref: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|s| s as &dyn rusqlite::ToSql).collect();
        let rows = stmt.query_map(&params_ref[..], Self::row_to_booking)?;
        rows.collect()
    }

    pub fn return_booking(&self, id: i64, reason: String, operator: String) -> Result<BookingRecord> {
        let return_at = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
        self.conn.execute(
            r#"UPDATE bookings SET 
                status = ?1, status_text = ?2,
                return_reason = ?3, return_by = ?4, return_at = ?5,
                liability_flag = '待确认:场地预约/会员核销责任不清'
            WHERE id = ?6"#,
            params![STATUS_RETURNED, STATUS_RETURNED_TEXT, reason, operator, return_at, id],
        )?;
        self.get_booking_by_id(id)
    }

    pub fn supplement_booking(&self, id: i64, s: BookingSupplement, operator: String) -> Result<BookingRecord> {
        let supplement_at = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
        self.conn.execute(
            r#"UPDATE bookings SET 
                status = ?1, status_text = ?2,
                supplement_note = ?3, supplement_by = ?4, supplement_at = ?5,
                member_id = ?6, coach_id = ?7,
                liability_flag = '待复核'
            WHERE id = ?8"#,
            params![
                STATUS_SUPPLEMENTED, STATUS_SUPPLEMENTED_TEXT,
                s.supplement_note, operator, supplement_at,
                s.member_id, s.coach_id, id
            ],
        )?;
        self.get_booking_by_id(id)
    }

    pub fn review_booking(&self, id: i64, approved: bool, review_note: Option<String>, operator: String) -> Result<BookingRecord> {
        let review_at = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
        let (status, status_text, result) = if approved {
            (STATUS_APPROVED, STATUS_APPROVED_TEXT, "approved")
        } else {
            (STATUS_REJECTED, STATUS_REJECTED_TEXT, "rejected")
        };

        self.conn.execute(
            r#"UPDATE bookings SET 
                status = ?1, status_text = ?2,
                review_result = ?3, review_note = ?4, review_by = ?5, review_at = ?6,
                liability_flag = NULL
            WHERE id = ?7"#,
            params![status, status_text, result, review_note, operator, review_at, id],
        )?;
        self.get_booking_by_id(id)
    }

    pub fn get_member_by_card_no(&self, card_no: &str) -> Result<Option<MemberCard>> {
        let result = self.conn.query_row(
            "SELECT id, card_no, member_name, phone, balance, card_type FROM member_cards WHERE card_no = ?1",
            params![card_no],
            |row| {
                Ok(MemberCard {
                    id: row.get(0)?,
                    card_no: row.get(1)?,
                    member_name: row.get(2)?,
                    phone: row.get(3)?,
                    balance: row.get(4)?,
                    card_type: row.get(5)?,
                })
            },
        );
        match result {
            Ok(member) => Ok(Some(member)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    pub fn get_member_by_id(&self, member_id: i64) -> Result<Option<MemberCard>> {
        let result = self.conn.query_row(
            "SELECT id, card_no, member_name, phone, balance, card_type FROM member_cards WHERE id = ?1",
            params![member_id],
            |row| {
                Ok(MemberCard {
                    id: row.get(0)?,
                    card_no: row.get(1)?,
                    member_name: row.get(2)?,
                    phone: row.get(3)?,
                    balance: row.get(4)?,
                    card_type: row.get(5)?,
                })
            },
        );
        match result {
            Ok(member) => Ok(Some(member)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    pub fn update_member_balance(&self, card_no: &str, new_balance: f64) -> Result<()> {
        self.conn.execute(
            "UPDATE member_cards SET balance = ?1 WHERE card_no = ?2",
            params![new_balance, card_no],
        )?;
        Ok(())
    }

    pub fn verify_member(&self, booking_id: i64, card_no: &str, amount: f64, operator: String) -> Result<BookingRecord> {
        let tx = self.conn.transaction()?;

        let member_result = tx.query_row(
            "SELECT id, balance FROM member_cards WHERE card_no = ?1",
            params![card_no],
            |row| {
                Ok((row.get::<_, i64>(0)?, row.get::<_, f64>(1)?))
            },
        );

        let (_member_id, balance_before) = match member_result {
            Ok(m) => m,
            Err(rusqlite::Error::QueryReturnedNoRows) => {
                return Err(rusqlite::Error::from(std::io::Error::new(
                    std::io::ErrorKind::NotFound,
                    "会员卡不存在，请检查卡号",
                )));
            }
            Err(e) => return Err(e),
        };

        if balance_before < amount {
            return Err(rusqlite::Error::from(std::io::Error::new(
                std::io::ErrorKind::InvalidInput,
                format!("余额不足，当前余额: ¥{:.2}，核销金额: ¥{:.2}", balance_before, amount),
            )));
        }
        let balance_after = balance_before - amount;

        tx.execute(
            "UPDATE member_cards SET balance = ?1 WHERE card_no = ?2",
            params![balance_after, card_no],
        )?;

        let verify_at = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
        tx.execute(
            r#"UPDATE bookings SET 
                status = ?1, status_text = ?2,
                verify_status = 'verified', verify_card_no = ?3,
                verify_balance_before = ?4, verify_balance_after = ?5, verify_amount = ?6,
                verify_by = ?7, verify_at = ?8,
                liability_flag = NULL
            WHERE id = ?9"#,
            params![
                STATUS_VERIFIED, STATUS_VERIFIED_TEXT,
                card_no, balance_before, balance_after, amount,
                operator, verify_at, booking_id
            ],
        )?;

        tx.commit()?;
        self.get_booking_by_id(booking_id)
    }

    pub fn get_todos(&self, role: String) -> Result<TodoList> {
        let today = Local::now().format("%Y-%m-%d").to_string();
        let mut pending: Vec<TodoItem> = Vec::new();
        let mut in_progress: Vec<TodoItem> = Vec::new();

        let base_sql = r#"SELECT b.id, b.booking_no, b.booker_name, c.name as court_name, 
            b.booking_date, b.start_time, b.status, b.status_text, b.created_at
            FROM bookings b
            LEFT JOIN courts c ON b.court_id = c.id"#;

        match role.as_str() {
            "reception" => {
                let sql = format!("{} WHERE b.status IN ('returned', 'pending') AND b.booking_date >= ?1 ORDER BY b.created_at DESC LIMIT 20", base_sql);
                let rows = self.conn.prepare(&sql)?.query_map(params![today], |row| {
                    Ok((
                        row.get::<_, i64>(0)?,
                        row.get::<_, String>(1)?,
                        row.get::<_, String>(2)?,
                        row.get::<_, String>(3)?,
                        row.get::<_, String>(4)?,
                        row.get::<_, String>(5)?,
                        row.get::<_, String>(6)?,
                        row.get::<_, String>(7)?,
                        row.get::<_, String>(8)?,
                    ))
                })?;
                for r in rows {
                    let (id, booking_no, booker, court, date, time, status, status_text, created) = r?;
                    let title = format!("{} - {} {}", court, booker, status_text);
                    let desc = format!("{} {} 预订号:{}", date, time, booking_no);
                    let priority = if status == "returned" { "high" } else { "medium" };
                    pending.push(TodoItem { id, booking_no, title, desc, status, priority: priority.to_string(), created_at: created });
                }
            }
            "coach" => {
                let sql = format!("{} WHERE b.status = 'approved' AND b.booking_date = ?1 ORDER BY b.start_time ASC", base_sql);
                let rows = self.conn.prepare(&sql)?.query_map(params![today], |row| {
                    Ok((
                        row.get::<_, i64>(0)?,
                        row.get::<_, String>(1)?,
                        row.get::<_, String>(2)?,
                        row.get::<_, String>(3)?,
                        row.get::<_, String>(4)?,
                        row.get::<_, String>(5)?,
                        row.get::<_, String>(6)?,
                        row.get::<_, String>(7)?,
                        row.get::<_, String>(8)?,
                    ))
                })?;
                for r in rows {
                    let (id, booking_no, booker, court, date, time, status, status_text, created) = r?;
                    let title = format!("今日课程: {} 场", court);
                    let desc = format!("{} 学员:{} 预订号:{}", time, booker, booking_no);
                    in_progress.push(TodoItem { id, booking_no, title, desc, status, priority: "high".to_string(), created_at: created });
                }
            }
            "manager" => {
                let sql = format!("{} WHERE b.status = 'supplemented' ORDER BY b.created_at DESC LIMIT 20", base_sql);
                let rows = self.conn.prepare(&sql)?.query_map([], |row| {
                    Ok((
                        row.get::<_, i64>(0)?,
                        row.get::<_, String>(1)?,
                        row.get::<_, String>(2)?,
                        row.get::<_, String>(3)?,
                        row.get::<_, String>(4)?,
                        row.get::<_, String>(5)?,
                        row.get::<_, String>(6)?,
                        row.get::<_, String>(7)?,
                        row.get::<_, String>(8)?,
                    ))
                })?;
                for r in rows {
                    let (id, booking_no, booker, court, date, time, status, status_text, created) = r?;
                    let title = format!("待复核: {} - {}", court, booker);
                    let desc = format!("{} {} 预订号:{} {}", date, time, booking_no, status_text);
                    pending.push(TodoItem { id, booking_no, title, desc, status, priority: "high".to_string(), created_at: created });
                }

                let sql2 = format!("{} WHERE b.liability_flag IS NOT NULL AND b.status != 'supplemented' ORDER BY b.created_at DESC LIMIT 10", base_sql);
                let rows2 = self.conn.prepare(&sql2)?.query_map([], |row| {
                    Ok((
                        row.get::<_, i64>(0)?,
                        row.get::<_, String>(1)?,
                        row.get::<_, String>(2)?,
                        row.get::<_, String>(3)?,
                        row.get::<_, String>(4)?,
                        row.get::<_, String>(5)?,
                        row.get::<_, String>(6)?,
                        row.get::<_, String>(7)?,
                        row.get::<_, String>(8)?,
                    ))
                })?;
                for r in rows2 {
                    let (id, booking_no, booker, court, date, time, status, status_text, created) = r?;
                    let title = format!("⚠️ 责任待确认: {} - {}", court, booker);
                    let desc = format!("{} {} 预订号:{} {}", date, time, booking_no, status_text);
                    in_progress.push(TodoItem { id, booking_no, title, desc, status, priority: "urgent".to_string(), created_at: created });
                }
            }
            _ => {}
        }

        let today_count: i64 = self.conn.query_row(
            "SELECT COUNT(*) FROM bookings WHERE booking_date = ?1",
            params![today],
            |row| row.get(0),
        )?;
        let total_count: i64 = self.conn.query_row("SELECT COUNT(*) FROM bookings", [], |row| row.get(0))?;

        Ok(TodoList { pending, in_progress, today_count, total_count })
    }

    pub fn get_courts(&self) -> Result<Vec<Court>> {
        let mut stmt = self.conn.prepare("SELECT id, name, court_type, price_per_hour FROM courts ORDER BY id")?;
        let rows = stmt.query_map([], |row| {
            Ok(Court {
                id: row.get(0)?,
                name: row.get(1)?,
                court_type: row.get(2)?,
                price_per_hour: row.get(3)?,
            })
        })?;
        rows.collect()
    }

    pub fn get_coaches(&self) -> Result<Vec<Coach>> {
        let mut stmt = self.conn.prepare("SELECT id, name, phone, specialty FROM coaches ORDER BY id")?;
        let rows = stmt.query_map([], |row| {
            Ok(Coach {
                id: row.get(0)?,
                name: row.get(1)?,
                phone: row.get(2)?,
                specialty: row.get(3)?,
            })
        })?;
        rows.collect()
    }

    pub fn get_members(&self) -> Result<Vec<MemberCard>> {
        let mut stmt = self.conn.prepare("SELECT id, card_no, member_name, phone, balance, card_type FROM member_cards ORDER BY id")?;
        let rows = stmt.query_map([], |row| {
            Ok(MemberCard {
                id: row.get(0)?,
                card_no: row.get(1)?,
                member_name: row.get(2)?,
                phone: row.get(3)?,
                balance: row.get(4)?,
                card_type: row.get(5)?,
            })
        })?;
        rows.collect()
    }

    pub fn get_verification_history(&self) -> Result<Vec<BookingRecord>> {
        let mut stmt = self.conn.prepare(
            r#"SELECT 
                b.id, b.booking_no, b.court_id, c.name as court_name,
                b.coach_id, ch.name as coach_name,
                b.member_id, m.member_name, m.card_no as member_card_no,
                b.booker_name, b.booker_phone, b.booking_date, b.start_time, b.end_time,
                b.status, b.status_text, b.created_by, b.created_at,
                b.return_reason, b.return_by, b.return_at,
                b.supplement_note, b.supplement_by, b.supplement_at,
                b.review_result, b.review_note, b.review_by, b.review_at,
                b.verify_status, b.verify_card_no, b.verify_balance_before, 
                b.verify_balance_after, b.verify_amount, b.verify_by, b.verify_at,
                b.liability_flag, b.remark
            FROM bookings b
            LEFT JOIN courts c ON b.court_id = c.id
            LEFT JOIN coaches ch ON b.coach_id = ch.id
            LEFT JOIN member_cards m ON b.member_id = m.id
            WHERE b.status = 'verified'
            ORDER BY b.verify_at DESC LIMIT 50"#,
        )?;
        let rows = stmt.query_map([], Self::row_to_booking)?;
        rows.collect()
    }

    fn row_to_booking(row: &rusqlite::Row) -> Result<BookingRecord> {
        Ok(BookingRecord {
            id: row.get(0)?,
            booking_no: row.get(1)?,
            court_id: row.get(2)?,
            court_name: row.get(3)?,
            coach_id: row.get(4)?,
            coach_name: row.get(5)?,
            member_id: row.get(6)?,
            member_name: row.get(7)?,
            member_card_no: row.get(8)?,
            booker_name: row.get(9)?,
            booker_phone: row.get(10)?,
            booking_date: row.get(11)?,
            start_time: row.get(12)?,
            end_time: row.get(13)?,
            status: row.get(14)?,
            status_text: row.get(15)?,
            created_by: row.get(16)?,
            created_at: row.get::<_, Option<String>>(17)?.unwrap_or_default(),
            return_reason: row.get(18)?,
            return_by: row.get(19)?,
            return_at: row.get(20)?,
            supplement_note: row.get(21)?,
            supplement_by: row.get(22)?,
            supplement_at: row.get(23)?,
            review_result: row.get(24)?,
            review_note: row.get(25)?,
            review_by: row.get(26)?,
            review_at: row.get(27)?,
            verify_status: row.get(28)?,
            verify_card_no: row.get(29)?,
            verify_balance_before: row.get(30)?,
            verify_balance_after: row.get(31)?,
            verify_amount: row.get(32)?,
            verify_by: row.get(33)?,
            verify_at: row.get(34)?,
            liability_flag: row.get(35)?,
            remark: row.get(36)?,
        })
    }
}
