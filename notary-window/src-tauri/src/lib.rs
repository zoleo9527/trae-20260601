mod commands;
mod models;

use models::AppState;

fn init_db(conn: &rusqlite::Connection) -> Result<(), String> {
    conn.execute_batch(include_str!("../migrations/init.sql"))
        .map_err(|e| e.to_string())?;

    let has_col: bool = conn
        .prepare("SELECT issued_by_role FROM correction_notices LIMIT 1")
        .is_ok();
    if !has_col {
        conn.execute_batch(
            "ALTER TABLE correction_notices ADD COLUMN issued_by_role TEXT NOT NULL DEFAULT 'window';",
        )
        .map_err(|e| e.to_string())?;
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
