mod commands;
mod db;

use commands::*;
use db::Database;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::Manager;

fn get_database_path() -> PathBuf {
    if let Some(data_dir) = dirs::data_dir() {
        let app_dir = data_dir.join("tax-consultation-system");
        std::fs::create_dir_all(&app_dir).ok();
        app_dir.join("data.db")
    } else {
        PathBuf::from("data.db")
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db_path = get_database_path();
    let database = Arc::new(Database::new(db_path).expect("Failed to initialize database"));

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState { db: database })
        .invoke_handler(tauri::generate_handler![
            get_all_users,
            get_users_by_role,
            query_consultations,
            get_consultation_detail,
            create_consultation,
            batch_create_consultations,
            update_consultation_status,
            create_document,
            update_document_status,
            batch_update_document_status,
            get_operation_logs,
            get_dashboard_stats,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
