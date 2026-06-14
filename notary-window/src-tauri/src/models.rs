use serde::{Deserialize, Serialize};

pub struct AppState {
    pub conn: std::sync::Mutex<rusqlite::Connection>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Appointment {
    pub id: String,
    pub appointment_no: String,
    pub applicant_name: String,
    pub applicant_id_no: String,
    pub applicant_phone: Option<String>,
    pub notary_type: String,
    pub appointment_time: String,
    pub status: String,
    pub current_handler_role: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Material {
    pub id: String,
    pub appointment_id: String,
    pub material_name: String,
    pub material_code: String,
    pub is_required: i32,
    pub status: String,
    pub review_comment: Option<String>,
    pub reviewed_by: Option<String>,
    pub reviewed_at: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FlowRecord {
    pub id: String,
    pub appointment_id: String,
    pub from_role: String,
    pub to_role: String,
    pub action: String,
    pub comment: Option<String>,
    pub operator_name: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CorrectionNotice {
    pub id: String,
    pub appointment_id: String,
    pub material_id: Option<String>,
    pub notice_content: String,
    pub deadline: Option<String>,
    pub status: String,
    pub issued_by: Option<String>,
    pub issued_by_role: String,
    pub issued_at: String,
    pub resolved_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AppointmentWithMaterials {
    pub appointment: Appointment,
    pub materials: Vec<Material>,
    pub flow_records: Vec<FlowRecord>,
    pub correction_notices: Vec<CorrectionNotice>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DashboardItem {
    pub appointment: Appointment,
    pub pending_material_count: i32,
    pub latest_action: Option<String>,
    pub latest_action_time: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StatusChange {
    pub appointment_id: String,
    pub appointment_no: String,
    pub applicant_name: String,
    pub action: String,
    pub from_role: String,
    pub to_role: String,
    pub operator_name: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateAppointmentPayload {
    pub applicant_name: String,
    pub applicant_id_no: String,
    pub applicant_phone: Option<String>,
    pub notary_type: String,
    pub appointment_time: String,
}

#[derive(Debug, Deserialize)]
pub struct AcceptAppointmentPayload {
    pub appointment_id: String,
    pub operator_name: String,
}

#[derive(Debug, Deserialize)]
pub struct ReviewMaterialPayload {
    pub material_id: String,
    pub status: String,
    pub review_comment: Option<String>,
    pub reviewed_by: String,
}

#[derive(Debug, Deserialize)]
pub struct BatchCreatePayload {
    pub appointments: Vec<CreateAppointmentPayload>,
}

#[derive(Debug, Deserialize)]
pub struct ForwardPayload {
    pub appointment_id: String,
    pub from_role: String,
    pub to_role: String,
    pub action: String,
    pub comment: Option<String>,
    pub operator_name: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct IssueCorrectionPayload {
    pub appointment_id: String,
    pub material_id: Option<String>,
    pub notice_content: String,
    pub deadline: Option<String>,
    pub issued_by: Option<String>,
    pub from_role: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ResolveCorrectionPayload {
    pub notice_id: String,
}

#[derive(Debug, Deserialize)]
pub struct AddMaterialsPayload {
    pub appointment_id: String,
    pub materials: Vec<MaterialTemplate>,
}

#[derive(Debug, Deserialize)]
pub struct MaterialTemplate {
    pub material_name: String,
    pub material_code: String,
    pub is_required: i32,
}
