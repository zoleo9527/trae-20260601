use crate::db::dao::*;
use crate::db::models::*;
use crate::db::Database;
use std::sync::Arc;
use tauri::State;

pub struct AppState {
    pub db: Arc<Database>,
}

#[tauri::command]
pub async fn get_all_users(state: State<'_, AppState>) -> Result<Vec<User>, String> {
    get_all_users(&state.db)
}

#[tauri::command]
pub async fn get_users_by_role(
    role: String,
    state: State<'_, AppState>,
) -> Result<Vec<User>, String> {
    get_users_by_role(&state.db, &role)
}

#[tauri::command]
pub async fn query_consultations(
    filter: QueryFilter,
    state: State<'_, AppState>,
) -> Result<Vec<Consultation>, String> {
    query_consultations(&state.db, &filter)
}

#[tauri::command]
pub async fn get_consultation_detail(
    id: i64,
    state: State<'_, AppState>,
) -> Result<ConsultationDetail, String> {
    get_consultation_detail(&state.db, id)
}

#[tauri::command]
pub async fn create_consultation(
    req: CreateConsultationRequest,
    state: State<'_, AppState>,
) -> Result<Consultation, String> {
    create_consultation(&state.db, &req)
}

#[tauri::command]
pub async fn batch_create_consultations(
    items: Vec<CreateConsultationRequest>,
    state: State<'_, AppState>,
) -> Result<Vec<Consultation>, String> {
    batch_create_consultations(&state.db, &items)
}

#[tauri::command]
pub async fn update_consultation_status(
    req: UpdateConsultationRequest,
    state: State<'_, AppState>,
) -> Result<Consultation, String> {
    update_consultation_status(&state.db, &req)
}

#[tauri::command]
pub async fn create_document(
    req: CreateDocumentRequest,
    state: State<'_, AppState>,
) -> Result<DocumentItem, String> {
    create_document(&state.db, &req)
}

#[tauri::command]
pub async fn update_document_status(
    req: UpdateDocumentRequest,
    state: State<'_, AppState>,
) -> Result<DocumentItem, String> {
    update_document_status(&state.db, &req)
}

#[tauri::command]
pub async fn batch_update_document_status(
    req: BatchUpdateDocumentRequest,
    state: State<'_, AppState>,
) -> Result<Vec<DocumentItem>, String> {
    batch_update_document_status(&state.db, &req)
}

#[tauri::command]
pub async fn get_operation_logs(
    consultation_id: i64,
    state: State<'_, AppState>,
) -> Result<Vec<OperationLog>, String> {
    get_operation_logs(&state.db, consultation_id)
}

#[tauri::command]
pub async fn get_dashboard_stats(
    current_user_name: String,
    current_user_role: String,
    state: State<'_, AppState>,
) -> Result<DashboardStats, String> {
    get_dashboard_stats(&state.db, &current_user_name, &current_user_role)
}

#[tauri::command]
pub async fn query_documents(
    filter: DocumentQueryFilter,
    state: State<'_, AppState>,
) -> Result<Vec<DocumentListItem>, String> {
    query_documents(&state.db, &filter)
}
