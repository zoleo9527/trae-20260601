use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConsultationStatus {
    PendingAccept,
    Accepted,
    PendingSupplement,
    Supplementing,
    PendingReview,
    Reviewed,
    Rejected,
    DocListCompleted,
}

impl ConsultationStatus {
    pub fn to_string(&self) -> String {
        match self {
            ConsultationStatus::PendingAccept => "待受理",
            ConsultationStatus::Accepted => "已受理",
            ConsultationStatus::PendingSupplement => "待补录",
            ConsultationStatus::Supplementing => "补录中",
            ConsultationStatus::PendingReview => "待复核",
            ConsultationStatus::Reviewed => "复核通过",
            ConsultationStatus::Rejected => "已退回",
            ConsultationStatus::DocListCompleted => "资料清单完成",
        }
        .to_string()
    }

    pub fn from_str(s: &str) -> Self {
        match s {
            "待受理" => ConsultationStatus::PendingAccept,
            "已受理" => ConsultationStatus::Accepted,
            "待补录" => ConsultationStatus::PendingSupplement,
            "补录中" => ConsultationStatus::Supplementing,
            "待复核" => ConsultationStatus::PendingReview,
            "复核通过" => ConsultationStatus::Reviewed,
            "已退回" => ConsultationStatus::Rejected,
            "资料清单完成" => ConsultationStatus::DocListCompleted,
            _ => ConsultationStatus::PendingAccept,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DocumentStatus {
    Pending,
    Requested,
    Provided,
    Received,
    Waived,
}

impl DocumentStatus {
    pub fn to_string(&self) -> String {
        match self {
            DocumentStatus::Pending => "待发起",
            DocumentStatus::Requested => "已要求提供",
            DocumentStatus::Provided => "客户已提供",
            DocumentStatus::Received => "已收到",
            DocumentStatus::Waived => "已豁免",
        }
        .to_string()
    }

    pub fn from_str(s: &str) -> Self {
        match s {
            "待发起" => DocumentStatus::Pending,
            "已要求提供" => DocumentStatus::Requested,
            "客户已提供" => DocumentStatus::Provided,
            "已收到" => DocumentStatus::Received,
            "已豁免" => DocumentStatus::Waived,
            _ => DocumentStatus::Pending,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum UserRole {
    Consultant,
    ProjectManager,
    ClientFinance,
}

impl UserRole {
    pub fn to_string(&self) -> String {
        match self {
            UserRole::Consultant => "consultant",
            UserRole::ProjectManager => "project_manager",
            UserRole::ClientFinance => "client_finance",
        }
        .to_string()
    }

    pub fn display_name(&self) -> String {
        match self {
            UserRole::Consultant => "税务顾问",
            UserRole::ProjectManager => "项目经理",
            UserRole::ClientFinance => "客户财务",
        }
        .to_string()
    }

    pub fn from_str(s: &str) -> Self {
        match s {
            "consultant" => UserRole::Consultant,
            "project_manager" => UserRole::ProjectManager,
            "client_finance" => UserRole::ClientFinance,
            _ => UserRole::Consultant,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub id: i64,
    pub name: String,
    pub role: String,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub department: Option<String>,
    pub created_at: DateTime<Local>,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Consultation {
    pub id: i64,
    pub consultation_no: String,
    pub client_name: String,
    pub tax_type: String,
    pub description: String,
    pub status: String,
    pub current_handler: String,
    pub handler_role: String,
    pub consultant_id: Option<i64>,
    pub project_manager_id: Option<i64>,
    pub client_finance_id: Option<i64>,
    pub created_at: DateTime<Local>,
    pub updated_at: DateTime<Local>,
    pub deadline: Option<String>,
    pub priority: i32,
    pub amount: Option<f64>,
    pub remarks: Option<String>,
    pub reject_reason: Option<String>,
    pub supplement_reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConsultationDetail {
    pub consultation: Consultation,
    pub documents: Vec<DocumentItem>,
    pub logs: Vec<OperationLog>,
    pub consultant_name: Option<String>,
    pub project_manager_name: Option<String>,
    pub client_finance_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DocumentItem {
    pub id: i64,
    pub consultation_id: i64,
    pub item_name: String,
    pub item_description: Option<String>,
    pub required: bool,
    pub status: String,
    pub provided_by: Option<String>,
    pub provided_at: Option<DateTime<Local>>,
    pub received_by: Option<String>,
    pub received_at: Option<DateTime<Local>>,
    pub remarks: Option<String>,
    pub incomplete_reason: Option<String>,
    pub created_at: DateTime<Local>,
    pub updated_at: DateTime<Local>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OperationLog {
    pub id: i64,
    pub consultation_id: i64,
    pub document_list_id: Option<i64>,
    pub operation_type: String,
    pub from_status: Option<String>,
    pub to_status: Option<String>,
    pub operator: String,
    pub operator_role: String,
    pub reason: Option<String>,
    pub remarks: Option<String>,
    pub created_at: DateTime<Local>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateConsultationRequest {
    pub client_name: String,
    pub tax_type: String,
    pub description: String,
    pub consultant_id: Option<i64>,
    pub project_manager_id: Option<i64>,
    pub client_finance_id: Option<i64>,
    pub deadline: Option<String>,
    pub priority: i32,
    pub amount: Option<f64>,
    pub remarks: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateConsultationRequest {
    pub id: i64,
    pub status: String,
    pub current_handler: String,
    pub handler_role: String,
    pub remarks: Option<String>,
    pub reason: Option<String>,
    pub operator: String,
    pub operator_role: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateDocumentRequest {
    pub consultation_id: i64,
    pub item_name: String,
    pub item_description: Option<String>,
    pub required: bool,
    pub operator: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateDocumentRequest {
    pub id: i64,
    pub status: String,
    pub provided_by: Option<String>,
    pub received_by: Option<String>,
    pub remarks: Option<String>,
    pub incomplete_reason: Option<String>,
    pub operator: String,
    pub operator_role: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchUpdateDocumentRequest {
    pub ids: Vec<i64>,
    pub status: String,
    pub operator: String,
    pub operator_role: String,
    pub remarks: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DashboardStats {
    pub total_consultations: i64,
    pub pending_accept: i64,
    pub accepted: i64,
    pub pending_supplement: i64,
    pub supplementing: i64,
    pub pending_review: i64,
    pub reviewed: i64,
    pub rejected: i64,
    pub doc_list_completed: i64,
    pub my_pending: i64,
    pub total_documents: i64,
    pub docs_received: i64,
    pub docs_pending: i64,
    pub overdue_consultations: Vec<Consultation>,
    pub rejected_consultations: Vec<Consultation>,
    pub incomplete_doc_consultations: Vec<ConsultationDetail>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QueryFilter {
    pub status: Option<String>,
    pub handler_role: Option<String>,
    pub current_handler: Option<String>,
    pub client_name: Option<String>,
    pub tax_type: Option<String>,
    pub priority: Option<i32>,
    pub date_from: Option<String>,
    pub date_to: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchCreateConsultationRequest {
    pub items: Vec<CreateConsultationRequest>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DocumentListItem {
    pub id: i64,
    pub consultation_id: i64,
    pub consultation_no: String,
    pub client_name: String,
    pub tax_type: String,
    pub item_name: String,
    pub item_description: Option<String>,
    pub required: bool,
    pub status: String,
    pub provided_by: Option<String>,
    pub provided_at: Option<DateTime<Local>>,
    pub received_by: Option<String>,
    pub received_at: Option<DateTime<Local>>,
    pub remarks: Option<String>,
    pub incomplete_reason: Option<String>,
    pub current_handler: String,
    pub handler_role: String,
    pub consultation_status: String,
    pub created_at: DateTime<Local>,
    pub updated_at: DateTime<Local>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DocumentQueryFilter {
    pub status: Option<String>,
    pub required: Option<bool>,
    pub incomplete_only: Option<bool>,
    pub client_name: Option<String>,
    pub tax_type: Option<String>,
    pub consultation_status: Option<String>,
    pub handler_role: Option<String>,
    pub current_handler: Option<String>,
    pub date_from: Option<String>,
    pub date_to: Option<String>,
}
