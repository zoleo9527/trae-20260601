use rusqlite::{Connection, Result};

pub fn init_tables(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS consultations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            consultation_no TEXT UNIQUE NOT NULL,
            client_name TEXT NOT NULL,
            tax_type TEXT NOT NULL,
            description TEXT NOT NULL,
            status TEXT NOT NULL,
            current_handler TEXT NOT NULL,
            handler_role TEXT NOT NULL,
            consultant_id INTEGER,
            project_manager_id INTEGER,
            client_finance_id INTEGER,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            deadline DATE,
            priority INTEGER DEFAULT 1,
            amount REAL,
            remarks TEXT,
            reject_reason TEXT,
            supplement_reason TEXT
        );

        CREATE TABLE IF NOT EXISTS document_lists (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            consultation_id INTEGER NOT NULL,
            item_name TEXT NOT NULL,
            item_description TEXT,
            required BOOLEAN NOT NULL DEFAULT 1,
            status TEXT NOT NULL,
            provided_by TEXT,
            provided_at DATETIME,
            received_by TEXT,
            received_at DATETIME,
            remarks TEXT,
            incomplete_reason TEXT,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS operation_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            consultation_id INTEGER NOT NULL,
            document_list_id INTEGER,
            operation_type TEXT NOT NULL,
            from_status TEXT,
            to_status TEXT,
            operator TEXT NOT NULL,
            operator_role TEXT NOT NULL,
            reason TEXT,
            remarks TEXT,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            role TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            department TEXT,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN NOT NULL DEFAULT 1
        );

        CREATE INDEX IF NOT EXISTS idx_consultation_status ON consultations(status);
        CREATE INDEX IF NOT EXISTS idx_consultation_handler ON consultations(current_handler);
        CREATE INDEX IF NOT EXISTS idx_consultation_handler_role ON consultations(handler_role);
        CREATE INDEX IF NOT EXISTS idx_consultation_client ON consultations(client_name);
        CREATE INDEX IF NOT EXISTS idx_document_consultation ON document_lists(consultation_id);
        CREATE INDEX IF NOT EXISTS idx_document_status ON document_lists(status);
        CREATE INDEX IF NOT EXISTS idx_log_consultation ON operation_logs(consultation_id);
        CREATE INDEX IF NOT EXISTS idx_user_role ON users(role);
        "#,
    )?;

    migrate_old_tables(conn)?;
    init_default_users(conn)?;
    Ok(())
}

fn migrate_old_tables(conn: &Connection) -> Result<()> {
    let has_reject_reason: bool = conn
        .query_row(
            "SELECT COUNT(*) > 0 FROM pragma_table_info('consultations') WHERE name='reject_reason'",
            [],
            |row| row.get(0),
        )
        .unwrap_or(false);

    if !has_reject_reason {
        conn.execute_batch(
            "ALTER TABLE consultations ADD COLUMN reject_reason TEXT;
             ALTER TABLE consultations ADD COLUMN supplement_reason TEXT;",
        )
        .ok();
    }

    let has_incomplete_reason: bool = conn
        .query_row(
            "SELECT COUNT(*) > 0 FROM pragma_table_info('document_lists') WHERE name='incomplete_reason'",
            [],
            |row| row.get(0),
        )
        .unwrap_or(false);

    if !has_incomplete_reason {
        conn.execute_batch("ALTER TABLE document_lists ADD COLUMN incomplete_reason TEXT;")
            .ok();
    }

    let has_reason: bool = conn
        .query_row(
            "SELECT COUNT(*) > 0 FROM pragma_table_info('operation_logs') WHERE name='reason'",
            [],
            |row| row.get(0),
        )
        .unwrap_or(false);

    if !has_reason {
        conn.execute_batch("ALTER TABLE operation_logs ADD COLUMN reason TEXT;")
            .ok();
    }

    Ok(())
}

fn init_default_users(conn: &Connection) -> Result<()> {
    let count: i64 = conn.query_row("SELECT COUNT(*) FROM users", [], |row| row.get(0))?;
    if count == 0 {
        let default_users = [
            ("张顾问", "consultant", "税务部", "13800138001"),
            ("李顾问", "consultant", "税务部", "13800138002"),
            ("王经理", "project_manager", "项目部", "13900139001"),
            ("赵经理", "project_manager", "项目部", "13900139002"),
            ("孙财务", "client_finance", "客户方", "13700137001"),
            ("周财务", "client_finance", "客户方", "13700137002"),
        ];

        for (name, role, dept, phone) in default_users.iter() {
            conn.execute(
                "INSERT INTO users (name, role, department, phone) VALUES (?1, ?2, ?3, ?4)",
                params![name, role, dept, phone],
            )?;
        }
    }
    Ok(())
}
