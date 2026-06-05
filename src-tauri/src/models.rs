use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BookingRecord {
    pub id: i64,
    pub booking_no: String,
    pub court_id: i64,
    pub court_name: String,
    pub coach_id: Option<i64>,
    pub coach_name: Option<String>,
    pub member_id: Option<i64>,
    pub member_name: Option<String>,
    pub member_card_no: Option<String>,
    pub booker_name: String,
    pub booker_phone: String,
    pub booking_date: String,
    pub start_time: String,
    pub end_time: String,
    pub status: String,
    pub status_text: String,
    pub created_by: String,
    pub created_at: DateTime<Local>,
    pub return_reason: Option<String>,
    pub return_by: Option<String>,
    pub return_at: Option<DateTime<Local>>,
    pub supplement_note: Option<String>,
    pub supplement_by: Option<String>,
    pub supplement_at: Option<DateTime<Local>>,
    pub review_result: Option<String>,
    pub review_note: Option<String>,
    pub review_by: Option<String>,
    pub review_at: Option<DateTime<Local>>,
    pub verify_status: Option<String>,
    pub verify_card_no: Option<String>,
    pub verify_balance_before: Option<f64>,
    pub verify_balance_after: Option<f64>,
    pub verify_amount: Option<f64>,
    pub verify_by: Option<String>,
    pub verify_at: Option<DateTime<Local>>,
    pub liability_flag: Option<String>,
    pub remark: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateBooking {
    pub court_id: i64,
    pub coach_id: Option<i64>,
    pub member_id: Option<i64>,
    pub booker_name: String,
    pub booker_phone: String,
    pub booking_date: String,
    pub start_time: String,
    pub end_time: String,
    pub created_by: String,
    pub remark: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct BookingFilter {
    pub status: Option<String>,
    pub date_from: Option<String>,
    pub date_to: Option<String>,
    pub court_id: Option<i64>,
    pub keyword: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct BookingSupplement {
    pub supplement_note: String,
    pub member_id: Option<i64>,
    pub coach_id: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct MemberVerify {
    pub card_no: String,
    pub amount: f64,
    pub balance_before: f64,
    pub balance_after: f64,
}

#[derive(Debug, Serialize)]
pub struct TodoItem {
    pub id: i64,
    pub booking_no: String,
    pub title: String,
    pub desc: String,
    pub status: String,
    pub priority: String,
    pub created_at: String,
}

#[derive(Debug, Serialize)]
pub struct TodoList {
    pub pending: Vec<TodoItem>,
    pub in_progress: Vec<TodoItem>,
    pub today_count: i64,
    pub total_count: i64,
}

#[derive(Debug, Serialize, Clone)]
pub struct Court {
    pub id: i64,
    pub name: String,
    pub court_type: String,
    pub price_per_hour: f64,
}

#[derive(Debug, Serialize, Clone)]
pub struct Coach {
    pub id: i64,
    pub name: String,
    pub phone: String,
    pub specialty: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct MemberCard {
    pub id: i64,
    pub card_no: String,
    pub member_name: String,
    pub phone: String,
    pub balance: f64,
    pub card_type: String,
}
