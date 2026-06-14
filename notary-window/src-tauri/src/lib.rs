mod commands;
mod models;

use models::AppState;
use rusqlite::params;

const LATEST_SCHEMA_VERSION: i32 = 3;

fn init_db(conn: &rusqlite::Connection) -> Result<(), String> {
    conn.execute_batch(include_str!("../migrations/init.sql"))
        .map_err(|e| e.to_string())?;

    let current_version = get_schema_version(conn);
    if current_version < LATEST_SCHEMA_VERSION {
        migrate(conn, current_version)?;
        set_schema_version(conn, LATEST_SCHEMA_VERSION);
    }

    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM appointments",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    if count == 0 {
        conn.execute_batch(include_str!("../migrations/seed.sql"))
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

fn get_schema_version(conn: &rusqlite::Connection) -> i32 {
    conn.query_row("PRAGMA user_version", [], |row| row.get(0))
        .unwrap_or(0)
}

fn set_schema_version(conn: &rusqlite::Connection, version: i32) {
    let _ = conn.execute_batch(&format!("PRAGMA user_version = {}", version));
}

fn migrate(conn: &rusqlite::Connection, from_version: i32) -> Result<(), String> {
    let mut version = from_version;

    if version < 1 {
        migrate_v1(conn)?;
        version = 1;
    }
    if version < 2 {
        migrate_v2(conn)?;
        version = 2;
    }
    if version < 3 {
        migrate_v3(conn)?;
    }

    Ok(())
}

fn migrate_v1(conn: &rusqlite::Connection) -> Result<(), String> {
    let has_col: bool = conn
        .prepare("SELECT issued_by_role FROM correction_notices LIMIT 1")
        .is_ok();
    if !has_col {
        conn.execute_batch(
            "ALTER TABLE correction_notices ADD COLUMN issued_by_role TEXT NOT NULL DEFAULT 'window';",
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn migrate_v2(conn: &rusqlite::Connection) -> Result<(), String> {
    backfill_create_flow_records(conn)?;
    backfill_correction_issued_by_role(conn)?;
    Ok(())
}

fn migrate_v3(conn: &rusqlite::Connection) -> Result<(), String> {
    fix_correction_issued_handler_role(conn)?;
    fix_resolved_correction_appointment_status(conn)?;
    Ok(())
}

fn backfill_create_flow_records(conn: &rusqlite::Connection) -> Result<(), String> {
    let mut stmt = conn.prepare(
        "SELECT a.id, a.created_at FROM appointments a \
         WHERE NOT EXISTS (SELECT 1 FROM flow_records fr WHERE fr.appointment_id = a.id)"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
    }).map_err(|e| e.to_string())?;

    let ids: Vec<(String, String)> = rows.filter_map(|r| r.ok()).collect();

    for (id, created_at) in ids {
        let flow_id = uuid::Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO flow_records (id, appointment_id, from_role, to_role, action, comment, operator_name, created_at) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![flow_id, id, "system", "window", "create", "新建预约单，等待窗口受理", "系统", created_at],
        ).map_err(|e| e.to_string())?;
    }

    Ok(())
}

fn backfill_correction_issued_by_role(conn: &rusqlite::Connection) -> Result<(), String> {
    let mut stmt = conn.prepare(
        "SELECT cn.id, cn.appointment_id, cn.issued_at, cn.status \
         FROM correction_notices cn \
         WHERE cn.issued_by_role = 'window'"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
            row.get::<_, String>(3)?,
        ))
    }).map_err(|e| e.to_string())?;

    let notices: Vec<_> = rows.filter_map(|r| r.ok()).collect();

    for (notice_id, appointment_id, issued_at, _status) in notices {
        let inferred = infer_issuer_role(conn, &appointment_id, &issued_at);
        if inferred != "window" {
            conn.execute(
                "UPDATE correction_notices SET issued_by_role = ?1 WHERE id = ?2",
                params![inferred, notice_id],
            ).map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}

fn infer_issuer_role(conn: &rusqlite::Connection, appointment_id: &str, issued_at: &str) -> String {
    if let Ok(role) = conn.query_row(
        "SELECT from_role FROM flow_records \
         WHERE appointment_id = ?1 AND action = 'issue_correction' AND created_at <= ?2 \
         ORDER BY created_at DESC LIMIT 1",
        params![appointment_id, issued_at],
        |row| row.get::<_, String>(0),
    ) {
        return role;
    }

    if let Ok(role) = conn.query_row(
        "SELECT to_role FROM flow_records \
         WHERE appointment_id = ?1 AND created_at < ?2 \
         ORDER BY created_at DESC LIMIT 1",
        params![appointment_id, issued_at],
        |row| row.get::<_, String>(0),
    ) {
        return role;
    }

    if let Ok(status) = conn.query_row(
        "SELECT status FROM appointments WHERE id = ?1",
        params![appointment_id],
        |row| row.get::<_, String>(0),
    ) {
        return match status.as_str() {
            "notary_reviewing" => "notary".to_string(),
            "archiving" => "archivist".to_string(),
            _ => "window".to_string(),
        };
    }

    "window".to_string()
}

fn fix_correction_issued_handler_role(conn: &rusqlite::Connection) -> Result<(), String> {
    conn.execute(
        "UPDATE appointments SET current_handler_role = 'window' WHERE status = 'correction_issued'",
        [],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

fn fix_resolved_correction_appointment_status(conn: &rusqlite::Connection) -> Result<(), String> {
    let mut stmt = conn.prepare(
        "SELECT DISTINCT cn.appointment_id, cn.issued_by_role, cn.resolved_at \
         FROM correction_notices cn \
         JOIN appointments a ON a.id = cn.appointment_id \
         WHERE cn.status = 'resolved' \
           AND ((cn.issued_by_role = 'notary' AND a.status != 'notary_reviewing' AND a.status NOT IN ('archiving', 'completed')) \
             OR (cn.issued_by_role = 'archivist' AND a.status != 'archiving' AND a.status != 'completed')) \
         ORDER BY cn.resolved_at DESC"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
        ))
    }).map_err(|e| e.to_string())?;

    let appointments: Vec<_> = rows.filter_map(|r| r.ok()).collect();

    for (apt_id, issued_by_role, resolved_at) in appointments {
        let flow_count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM flow_records WHERE appointment_id = ?1 AND created_at > ?2",
            params![apt_id, resolved_at],
            |row| row.get(0),
        ).unwrap_or(0);

        if flow_count > 0 {
            continue;
        }

        let (new_status, new_role) = match issued_by_role.as_str() {
            "notary" => ("notary_reviewing", "notary"),
            "archivist" => ("archiving", "archivist"),
            _ => ("accepted_reviewing", "window"),
        };

        conn.execute(
            "UPDATE appointments SET status = ?1, current_handler_role = ?2 WHERE id = ?3",
            params![new_status, new_role, apt_id],
        ).map_err(|e| e.to_string())?;

        let flow_id = uuid::Uuid::new_v4().to_string();
        let role_label = match new_role {
            "notary" => "公证员",
            "archivist" => "档案员",
            _ => "窗口人员",
        };
        let comment = format!("补正完成，恢复至{}审核（数据迁移回填）", role_label);
        conn.execute(
            "INSERT INTO flow_records (id, appointment_id, from_role, to_role, action, comment, operator_name, created_at) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![flow_id, apt_id, "window", new_role, "resolve_correction", comment, "系统", resolved_at],
        ).map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let conn = rusqlite::Connection::open("notary.db").expect("failed to open database");
    init_db(&conn).expect("failed to initialize database");

    tauri::Builder::default()
        .manage(AppState {
            conn: std::sync::Mutex::new(conn),
        })
        .invoke_handler(tauri::generate_handler![
            commands::create_appointment,
            commands::accept_appointment,
            commands::review_material,
            commands::forward_appointment,
            commands::get_appointment_detail,
            commands::get_dashboard,
            commands::get_recent_status_changes,
            commands::batch_create_appointments,
            commands::add_materials,
            commands::issue_correction,
            commands::resolve_correction,
            commands::get_prereview_history,
            commands::complete_appointment,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
