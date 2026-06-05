#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;
mod models;

use db::Database;
use models::{BookingRecord, BookingFilter, BookingSupplement, CreateBooking, TodoList, Court, Coach, MemberCard};
use std::sync::Mutex;
use tauri::State;

struct AppState {
    db: Mutex<Database>,
}

#[tauri::command]
fn create_booking(
    booking: CreateBooking,
    state: State<AppState>,
) -> Result<BookingRecord, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.create_booking(booking).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_bookings(filter: BookingFilter, state: State<AppState>) -> Result<Vec<BookingRecord>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_bookings(filter).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_booking_by_id(id: i64, state: State<AppState>) -> Result<BookingRecord, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_booking_by_id(id).map_err(|e| e.to_string())
}

#[tauri::command]
fn return_booking(
    id: i64,
    reason: String,
    operator: String,
    state: State<AppState>,
) -> Result<BookingRecord, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.return_booking(id, reason, operator).map_err(|e| e.to_string())
}

#[tauri::command]
fn supplement_booking(
    id: i64,
    supplement: BookingSupplement,
    operator: String,
    state: State<AppState>,
) -> Result<BookingRecord, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.supplement_booking(id, supplement, operator)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn review_booking(
    id: i64,
    approved: bool,
    review_note: Option<String>,
    operator: String,
    state: State<AppState>,
) -> Result<BookingRecord, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.review_booking(id, approved, review_note, operator)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn verify_member(
    id: i64,
    card_no: String,
    amount: f64,
    operator: String,
    state: State<AppState>,
) -> Result<BookingRecord, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.verify_member(id, &card_no, amount, operator)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_member_by_card_no(
    card_no: String,
    state: State<AppState>,
) -> Result<Option<MemberCard>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_member_by_card_no(&card_no).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_todos(role: String, state: State<AppState>) -> Result<TodoList, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_todos(role).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_courts(state: State<AppState>) -> Result<Vec<Court>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_courts().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_coaches(state: State<AppState>) -> Result<Vec<Coach>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_coaches().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_members(state: State<AppState>) -> Result<Vec<MemberCard>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_members().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_verification_history(state: State<AppState>) -> Result<Vec<BookingRecord>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_verification_history().map_err(|e| e.to_string())
}

fn main() {
    let db = Database::new().expect("Failed to initialize database");
    db.init_seed_data().expect("Failed to init seed data");

    tauri::Builder::default()
        .manage(AppState { db: Mutex::new(db) })
        .invoke_handler(tauri::generate_handler![
            create_booking,
            get_bookings,
            get_booking_by_id,
            return_booking,
            supplement_booking,
            review_booking,
            verify_member,
            get_member_by_card_no,
            get_todos,
            get_courts,
            get_coaches,
            get_members,
            get_verification_history
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
