use super::models::*;
use super::Database;
use chrono::{DateTime, Local};
use rusqlite::{params, OptionalExtension};
use std::sync::MutexGuard;

fn generate_consultation_no() -> String {
    let now = Local::now();
    format!(
        "TAX-{}-{:04}",
        now.format("%Y%m%d"),
        rand::random::<u16>()
    )
}

pub fn get_all_users(db: &Database) -> Result<Vec<User>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT * FROM users WHERE is_active = 1 ORDER BY role, name")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(User {
                id: row.get(0)?,
                name: row.get(1)?,
                role: row.get(2)?,
                phone: row.get(3)?,
                email: row.get(4)?,
                department: row.get(5)?,
                created_at: row.get(6)?,
                is_active: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut users = Vec::new();
    for row in rows {
        users.push(row.map_err(|e| e.to_string())?);
    }
    Ok(users)
}

pub fn get_users_by_role(db: &Database, role: &str) -> Result<Vec<User>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT * FROM users WHERE is_active = 1 AND role = ?1 ORDER BY name")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![role], |row| {
            Ok(User {
                id: row.get(0)?,
                name: row.get(1)?,
                role: row.get(2)?,
                phone: row.get(3)?,
                email: row.get(4)?,
                department: row.get(5)?,
                created_at: row.get(6)?,
                is_active: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut users = Vec::new();
    for row in rows {
        users.push(row.map_err(|e| e.to_string())?);
    }
    Ok(users)
}

pub fn query_consultations(
    db: &Database,
    filter: &QueryFilter,
) -> Result<Vec<Consultation>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut sql = String::from("SELECT * FROM consultations WHERE 1=1");
    let mut params_list: Vec<String> = Vec::new();

    if let Some(status) = &filter.status {
        sql.push_str(" AND status = ?");
        params_list.push(status.clone());
    }
    if let Some(handler_role) = &filter.handler_role {
        sql.push_str(" AND handler_role = ?");
        params_list.push(handler_role.clone());
    }
    if let Some(current_handler) = &filter.current_handler {
        sql.push_str(" AND current_handler = ?");
        params_list.push(current_handler.clone());
    }
    if let Some(client_name) = &filter.client_name {
        sql.push_str(" AND client_name LIKE ?");
        params_list.push(format!("%{}%", client_name));
    }
    if let Some(tax_type) = &filter.tax_type {
        sql.push_str(" AND tax_type = ?");
        params_list.push(tax_type.clone());
    }
    if let Some(priority) = &filter.priority {
        sql.push_str(" AND priority = ?");
        params_list.push(priority.to_string());
    }
    if let Some(date_from) = &filter.date_from {
        sql.push_str(" AND date(created_at) >= date(?)");
        params_list.push(date_from.clone());
    }
    if let Some(date_to) = &filter.date_to {
        sql.push_str(" AND date(created_at) <= date(?)");
        params_list.push(date_to.clone());
    }

    sql.push_str(" ORDER BY priority DESC, created_at DESC, updated_at DESC");

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;

    let param_refs: Vec<&dyn rusqlite::ToSql> = params_list
        .iter()
        .map(|s| s as &dyn rusqlite::ToSql)
        .collect();

    let rows = stmt
        .query_map(rusqlite::params_from_iter(param_refs), |row| {
            Ok(Consultation {
                id: row.get(0)?,
                consultation_no: row.get(1)?,
                client_name: row.get(2)?,
                tax_type: row.get(3)?,
                description: row.get(4)?,
                status: row.get(5)?,
                current_handler: row.get(6)?,
                handler_role: row.get(7)?,
                consultant_id: row.get(8)?,
                project_manager_id: row.get(9)?,
                client_finance_id: row.get(10)?,
                created_at: row.get(11)?,
                updated_at: row.get(12)?,
                deadline: row.get(13)?,
                priority: row.get(14)?,
                amount: row.get(15)?,
                remarks: row.get(16)?,
                reject_reason: row.get::<_, Option<String>>(17)?,
                supplement_reason: row.get::<_, Option<String>>(18)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut consultations = Vec::new();
    for row in rows {
        consultations.push(row.map_err(|e| e.to_string())?);
    }
    Ok(consultations)
}

pub fn get_consultation_detail(
    db: &Database,
    id: i64,
) -> Result<ConsultationDetail, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let consultation = get_consultation_by_id(&conn, id)?;
    let documents = get_documents_by_consultation_id(&conn, id)?;
    let logs = get_logs_by_consultation_id(&conn, id)?;

    let get_name = |uid: Option<i64>| -> Option<String> {
        uid.and_then(|id| {
            conn.query_row(
                "SELECT name FROM users WHERE id = ?1",
                params![id],
                |row| row.get::<_, String>(0).ok(),
            )
            .ok()
            .flatten()
        })
    };

    let consultant_name = get_name(consultation.consultant_id);
    let project_manager_name = get_name(consultation.project_manager_id);
    let client_finance_name = get_name(consultation.client_finance_id);

    Ok(ConsultationDetail {
        consultation,
        documents,
        logs,
        consultant_name,
        project_manager_name,
        client_finance_name,
    })
}

fn get_consultation_by_id(
    conn: &MutexGuard<rusqlite::Connection>,
    id: i64,
) -> Result<Consultation, String> {
    let mut stmt = conn
        .prepare("SELECT * FROM consultations WHERE id = ?1")
        .map_err(|e| e.to_string())?;

    stmt.query_row(params![id], |row| {
        Ok(Consultation {
            id: row.get(0)?,
            consultation_no: row.get(1)?,
            client_name: row.get(2)?,
            tax_type: row.get(3)?,
            description: row.get(4)?,
            status: row.get(5)?,
            current_handler: row.get(6)?,
            handler_role: row.get(7)?,
            consultant_id: row.get(8)?,
            project_manager_id: row.get(9)?,
            client_finance_id: row.get(10)?,
            created_at: row.get(11)?,
            updated_at: row.get(12)?,
            deadline: row.get(13)?,
            priority: row.get(14)?,
            amount: row.get(15)?,
            remarks: row.get(16)?,
            reject_reason: row.get::<_, Option<String>>(17)?,
            supplement_reason: row.get::<_, Option<String>>(18)?,
        })
    })
    .map_err(|e| e.to_string())
}

fn get_documents_by_consultation_id(
    conn: &MutexGuard<rusqlite::Connection>,
    consultation_id: i64,
) -> Result<Vec<DocumentItem>, String> {
    let mut stmt = conn
        .prepare("SELECT * FROM document_lists WHERE consultation_id = ?1 ORDER BY created_at")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![consultation_id], |row| {
            Ok(DocumentItem {
                id: row.get(0)?,
                consultation_id: row.get(1)?,
                item_name: row.get(2)?,
                item_description: row.get(3)?,
                required: row.get(4)?,
                status: row.get(5)?,
                provided_by: row.get(6)?,
                provided_at: row.get(7)?,
                received_by: row.get(8)?,
                received_at: row.get(9)?,
                remarks: row.get(10)?,
                incomplete_reason: row.get::<_, Option<String>>(11)?,
                created_at: row.get::<_, DateTime<Local>>(12)?,
                updated_at: row.get::<_, DateTime<Local>>(13)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut documents = Vec::new();
    for row in rows {
        documents.push(row.map_err(|e| e.to_string())?);
    }
    Ok(documents)
}

fn get_logs_by_consultation_id(
    conn: &MutexGuard<rusqlite::Connection>,
    consultation_id: i64,
) -> Result<Vec<OperationLog>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT * FROM operation_logs WHERE consultation_id = ?1 ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![consultation_id], |row| {
            Ok(OperationLog {
                id: row.get(0)?,
                consultation_id: row.get(1)?,
                document_list_id: row.get(2)?,
                operation_type: row.get(3)?,
                from_status: row.get(4)?,
                to_status: row.get(5)?,
                operator: row.get(6)?,
                operator_role: row.get(7)?,
                reason: row.get::<_, Option<String>>(8)?,
                remarks: row.get::<_, Option<String>>(9)?,
                created_at: row.get::<_, DateTime<Local>>(10)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut logs = Vec::new();
    for row in rows {
        logs.push(row.map_err(|e| e.to_string())?);
    }
    Ok(logs)
}

pub fn create_consultation(
    db: &Database,
    req: &CreateConsultationRequest,
) -> Result<Consultation, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let consultation_no = generate_consultation_no();
    let initial_handler = req
        .consultant_id
        .and_then(|id| {
            conn.query_row::<String, _, _>(
                "SELECT name FROM users WHERE id = ?1",
                params![id],
                |row| row.get(0),
            )
            .ok()
        })
        .unwrap_or_else(|| "待分配".to_string());

    let initial_status = if req.consultant_id.is_some() {
        ConsultationStatus::Accepted.to_string()
    } else {
        ConsultationStatus::PendingAccept.to_string()
    };

    let initial_role = UserRole::Consultant.to_string();

    conn.execute(
        r#"INSERT INTO consultations (
            consultation_no, client_name, tax_type, description, status,
            current_handler, handler_role, consultant_id, project_manager_id,
            client_finance_id, deadline, priority, amount, remarks
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)"#,
        params![
            consultation_no,
            req.client_name,
            req.tax_type,
            req.description,
            initial_status,
            initial_handler,
            initial_role,
            req.consultant_id,
            req.project_manager_id,
            req.client_finance_id,
            req.deadline,
            req.priority,
            req.amount,
            req.remarks,
        ],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    let _ = insert_operation_log(
        &conn,
        id,
        None,
        "创建咨询",
        None,
        Some(initial_status.clone()),
        &initial_handler,
        &initial_role,
        None,
        Some("系统自动创建咨询记录".to_string()),
    );

    get_consultation_by_id(&conn, id)
}

pub fn batch_create_consultations(
    db: &Database,
    items: &[CreateConsultationRequest],
) -> Result<Vec<Consultation>, String> {
    let mut results = Vec::new();
    for item in items {
        let consultation = create_consultation(db, item)?;
        results.push(consultation);
    }
    Ok(results)
}

pub fn update_consultation_status(
    db: &Database,
    req: &UpdateConsultationRequest,
) -> Result<Consultation, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let old_consultation = get_consultation_by_id(&conn, req.id)?;

    let reason_requires_check = req.status == "已退回"
        || req.status == "待补录"
        || req.status == "补录中"
        || req.status == "待复核";
    if reason_requires_check && req.reason.is_none() && req.remarks.is_none() {
        return Err(format!(
            "状态变更为「{}」时必须填写原因",
            req.status
        ));
    }

    let reject_reason_update = if req.status == "已退回" {
        req.reason.clone().or(req.remarks.clone())
    } else {
        None
    };

    let supplement_reason_update = if req.status == "待补录" || req.status == "补录中" {
        req.reason.clone().or(req.remarks.clone())
    } else {
        None
    };

    conn.execute(
        r#"UPDATE consultations SET
            status = ?1,
            current_handler = ?2,
            handler_role = ?3,
            updated_at = CURRENT_TIMESTAMP,
            remarks = COALESCE(?4, remarks),
            reject_reason = COALESCE(?5, reject_reason),
            supplement_reason = COALESCE(?6, supplement_reason)
        WHERE id = ?7"#,
        params![
            req.status,
            req.current_handler,
            req.handler_role,
            req.remarks,
            reject_reason_update,
            supplement_reason_update,
            req.id,
        ],
    )
    .map_err(|e| e.to_string())?;

    let operation_type = match req.status.as_str() {
        "已退回" => "退回",
        "待补录" => "发起补录",
        "补录中" => "开始补录",
        "待复核" => "提交复核",
        "复核通过" => "复核通过",
        "资料清单完成" => "资料清单完成",
        "已受理" => {
            if old_consultation.status == "已退回" {
                "重新受理"
            } else {
                "受理"
            }
        }
        _ => "状态更新",
    };

    let _ = insert_operation_log(
        &conn,
        req.id,
        None,
        operation_type,
        Some(old_consultation.status.clone()),
        Some(req.status.clone()),
        &req.operator,
        &req.operator_role,
        req.reason.clone(),
        req.remarks.clone(),
    );

    get_consultation_by_id(&conn, req.id)
}

pub fn create_document(
    db: &Database,
    req: &CreateDocumentRequest,
) -> Result<DocumentItem, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        r#"INSERT INTO document_lists (
            consultation_id, item_name, item_description, required, status
        ) VALUES (?1, ?2, ?3, ?4, ?5)"#,
        params![
            req.consultation_id,
            req.item_name,
            req.item_description,
            req.required,
            DocumentStatus::Requested.to_string(),
        ],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    let _ = insert_operation_log(
        &conn,
        req.consultation_id,
        Some(id),
        "添加资料项",
        None,
        Some(DocumentStatus::Requested.to_string()),
        &req.operator,
        &UserRole::Consultant.to_string(),
        None,
        Some(format!("添加资料项: {}", req.item_name)),
    );

    get_document_by_id(&conn, id)
}

pub fn update_document_status(
    db: &Database,
    req: &UpdateDocumentRequest,
) -> Result<DocumentItem, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let old_doc = get_document_by_id(&conn, req.id)?;

    let now: Option<DateTime<Local>> = if req.status == "客户已提供"
        || req.status == "已收到"
    {
        Some(Local::now())
    } else {
        None
    };

    conn.execute(
        r#"UPDATE document_lists SET
            status = ?1,
            provided_by = COALESCE(?2, provided_by),
            provided_at = COALESCE(?3, provided_at),
            received_by = COALESCE(?4, received_by),
            received_at = COALESCE(?5, received_at),
            remarks = COALESCE(?6, remarks),
            incomplete_reason = COALESCE(?7, incomplete_reason),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?8"#,
        params![
            req.status,
            req.provided_by,
            if req.status == "客户已提供" { now } else { None },
            req.received_by,
            if req.status == "已收到" { now } else { None },
            req.remarks,
            req.incomplete_reason,
            req.id,
        ],
    )
    .map_err(|e| e.to_string())?;

    let operation_type = match req.status.as_str() {
        "客户已提供" => "客户提供资料",
        "已收到" => "确认收到资料",
        "已豁免" => "豁免资料项",
        _ => "更新资料状态",
    };

    let _ = insert_operation_log(
        &conn,
        old_doc.consultation_id,
        Some(req.id),
        operation_type,
        Some(old_doc.status.clone()),
        Some(req.status.clone()),
        &req.operator,
        &req.operator_role,
        req.incomplete_reason.clone(),
        req.remarks.clone(),
    );

    get_document_by_id(&conn, req.id)
}

pub fn batch_update_document_status(
    db: &Database,
    req: &BatchUpdateDocumentRequest,
) -> Result<Vec<DocumentItem>, String> {
    let mut results = Vec::new();
    for doc_id in &req.ids {
        let single_req = UpdateDocumentRequest {
            id: *doc_id,
            status: req.status.clone(),
            provided_by: None,
            received_by: None,
            remarks: req.remarks.clone(),
            incomplete_reason: None,
            operator: req.operator.clone(),
            operator_role: req.operator_role.clone(),
        };
        let doc = update_document_status(db, &single_req)?;
        results.push(doc);
    }
    Ok(results)
}

pub fn get_dashboard_stats(
    db: &Database,
    current_user_name: &str,
    current_user_role: &str,
) -> Result<DashboardStats, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let count_status = |status: &str| -> i64 {
        conn.query_row(
            "SELECT COUNT(*) FROM consultations WHERE status = ?1",
            params![status],
            |row| row.get::<_, i64>(0),
        )
        .unwrap_or(0)
    };

    let my_pending: i64 = conn.query_row(
        "SELECT COUNT(*) FROM consultations WHERE current_handler = ?1 AND status != '资料清单完成'",
        params![current_user_name],
        |row| row.get::<_, i64>(0),
    ).unwrap_or(0);

    let total_documents: i64 = conn.query_row(
        "SELECT COUNT(*) FROM document_lists",
        [],
        |row| row.get::<_, i64>(0),
    ).unwrap_or(0);

    let docs_received: i64 = conn.query_row(
        "SELECT COUNT(*) FROM document_lists WHERE status = '已收到'",
        [],
        |row| row.get::<_, i64>(0),
    ).unwrap_or(0);

    let docs_pending: i64 = conn.query_row(
        "SELECT COUNT(*) FROM document_lists WHERE status IN ('待发起', '已要求提供') AND required = 1",
        [],
        |row| row.get::<_, i64>(0),
    ).unwrap_or(0);

    let overdue_consultations = {
        let mut stmt = conn
            .prepare(
                "SELECT * FROM consultations WHERE deadline IS NOT NULL AND deadline < date('now') AND status != '资料清单完成' ORDER BY deadline ASC LIMIT 20",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt.query_map([], |row| {
            Ok(Consultation {
                id: row.get(0)?,
                consultation_no: row.get(1)?,
                client_name: row.get(2)?,
                tax_type: row.get(3)?,
                description: row.get(4)?,
                status: row.get(5)?,
                current_handler: row.get(6)?,
                handler_role: row.get(7)?,
                consultant_id: row.get(8)?,
                project_manager_id: row.get(9)?,
                client_finance_id: row.get(10)?,
                created_at: row.get(11)?,
                updated_at: row.get(12)?,
                deadline: row.get(13)?,
                priority: row.get(14)?,
                amount: row.get(15)?,
                remarks: row.get(16)?,
                reject_reason: row.get::<_, Option<String>>(17)?,
                supplement_reason: row.get::<_, Option<String>>(18)?,
            })
        }).map_err(|e| e.to_string())?;
        let mut results = Vec::new();
        for row in rows {
            results.push(row.map_err(|e| e.to_string())?);
        }
        results
    };

    let rejected_consultations = {
        let mut stmt = conn
            .prepare("SELECT * FROM consultations WHERE status = '已退回' ORDER BY updated_at DESC LIMIT 20")
            .map_err(|e| e.to_string())?;
        let rows = stmt.query_map([], |row| {
            Ok(Consultation {
                id: row.get(0)?,
                consultation_no: row.get(1)?,
                client_name: row.get(2)?,
                tax_type: row.get(3)?,
                description: row.get(4)?,
                status: row.get(5)?,
                current_handler: row.get(6)?,
                handler_role: row.get(7)?,
                consultant_id: row.get(8)?,
                project_manager_id: row.get(9)?,
                client_finance_id: row.get(10)?,
                created_at: row.get(11)?,
                updated_at: row.get(12)?,
                deadline: row.get(13)?,
                priority: row.get(14)?,
                amount: row.get(15)?,
                remarks: row.get(16)?,
                reject_reason: row.get::<_, Option<String>>(17)?,
                supplement_reason: row.get::<_, Option<String>>(18)?,
            })
        }).map_err(|e| e.to_string())?;
        let mut results = Vec::new();
        for row in rows {
            results.push(row.map_err(|e| e.to_string())?);
        }
        results
    };

    let incomplete_doc_consultations = {
        let mut stmt = conn
            .prepare(
                r#"SELECT c.id FROM consultations c
                WHERE c.status NOT IN ('待受理', '资料清单完成')
                AND EXISTS (
                    SELECT 1 FROM document_lists d
                    WHERE d.consultation_id = c.id
                    AND d.required = 1
                    AND d.status NOT IN ('已收到', '已豁免')
                )
                ORDER BY c.priority DESC, c.updated_at DESC
                LIMIT 10"#,
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt.query_map([], |row| row.get::<_, i64>(0)).map_err(|e| e.to_string())?;
        let mut results = Vec::new();
        for cid in rows {
            if let Ok(detail) = get_consultation_detail_unlocked(&conn, cid.map_err(|e| e.to_string())?) {
                results.push(detail);
            }
        }
        results
    };

    Ok(DashboardStats {
        total_consultations: count_status("待受理") + count_status("已受理")
            + count_status("待补录") + count_status("补录中")
            + count_status("待复核") + count_status("复核通过")
            + count_status("已退回") + count_status("资料清单完成"),
        pending_accept: count_status("待受理"),
        accepted: count_status("已受理"),
        pending_supplement: count_status("待补录"),
        supplementing: count_status("补录中"),
        pending_review: count_status("待复核"),
        reviewed: count_status("复核通过"),
        rejected: count_status("已退回"),
        doc_list_completed: count_status("资料清单完成"),
        my_pending,
        total_documents,
        docs_received,
        docs_pending,
        overdue_consultations,
        rejected_consultations,
        incomplete_doc_consultations,
    })
}

fn get_consultation_detail_unlocked(
    conn: &MutexGuard<rusqlite::Connection>,
    id: i64,
) -> Result<ConsultationDetail, String> {
    let consultation = get_consultation_by_id(conn, id)?;
    let documents = get_documents_by_consultation_id(conn, id)?;
    let logs = get_logs_by_consultation_id(conn, id)?;

    let get_name = |uid: Option<i64>| -> Option<String> {
        uid.and_then(|id| {
            conn.query_row(
                "SELECT name FROM users WHERE id = ?1",
                params![id],
                |row| row.get::<_, String>(0).ok(),
            )
            .ok()
            .flatten()
        })
    };

    Ok(ConsultationDetail {
        consultant_name: get_name(consultation.consultant_id),
        project_manager_name: get_name(consultation.project_manager_id),
        client_finance_name: get_name(consultation.client_finance_id),
        consultation,
        documents,
        logs,
    })
}

fn get_document_by_id(
    conn: &MutexGuard<rusqlite::Connection>,
    id: i64,
) -> Result<DocumentItem, String> {
    let mut stmt = conn
        .prepare("SELECT * FROM document_lists WHERE id = ?1")
        .map_err(|e| e.to_string())?;

    stmt.query_row(params![id], |row| {
        Ok(DocumentItem {
            id: row.get(0)?,
            consultation_id: row.get(1)?,
            item_name: row.get(2)?,
            item_description: row.get(3)?,
            required: row.get(4)?,
            status: row.get(5)?,
            provided_by: row.get(6)?,
            provided_at: row.get(7)?,
            received_by: row.get(8)?,
            received_at: row.get(9)?,
            remarks: row.get(10)?,
            incomplete_reason: row.get::<_, Option<String>>(11)?,
            created_at: row.get::<_, DateTime<Local>>(12)?,
            updated_at: row.get::<_, DateTime<Local>>(13)?,
        })
    })
    .map_err(|e| e.to_string())
}

fn insert_operation_log(
    conn: &MutexGuard<rusqlite::Connection>,
    consultation_id: i64,
    document_list_id: Option<i64>,
    operation_type: &str,
    from_status: Option<String>,
    to_status: Option<String>,
    operator: &str,
    operator_role: &str,
    reason: Option<String>,
    remarks: Option<String>,
) -> Result<i64, String> {
    conn.execute(
        r#"INSERT INTO operation_logs (
            consultation_id, document_list_id, operation_type,
            from_status, to_status, operator, operator_role, reason, remarks
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)"#,
        params![
            consultation_id,
            document_list_id,
            operation_type,
            from_status,
            to_status,
            operator,
            operator_role,
            reason,
            remarks,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(conn.last_insert_rowid())
}

pub fn get_operation_logs(
    db: &Database,
    consultation_id: i64,
) -> Result<Vec<OperationLog>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    get_logs_by_consultation_id(&conn, consultation_id)
}

pub fn query_documents(
    db: &Database,
    filter: &DocumentQueryFilter,
) -> Result<Vec<DocumentListItem>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut sql = String::from(
        r#"SELECT d.id, d.consultation_id, c.consultation_no, c.client_name, c.tax_type,
           d.item_name, d.item_description, d.required, d.status,
           d.provided_by, d.provided_at, d.received_by, d.received_at,
           d.remarks, d.incomplete_reason,
           c.current_handler, c.handler_role, c.status as consultation_status,
           d.created_at, d.updated_at
        FROM document_lists d
        JOIN consultations c ON d.consultation_id = c.id
        WHERE 1=1"#,
    );
    let mut params_list: Vec<String> = Vec::new();

    if let Some(status) = &filter.status {
        sql.push_str(" AND d.status = ?");
        params_list.push(status.clone());
    }
    if let Some(required) = filter.required {
        sql.push_str(" AND d.required = ?");
        params_list.push(required.to_string());
    }
    if filter.incomplete_only.unwrap_or(false) {
        sql.push_str(" AND d.incomplete_reason IS NOT NULL AND d.incomplete_reason != ''");
    }
    if let Some(client_name) = &filter.client_name {
        sql.push_str(" AND c.client_name LIKE ?");
        params_list.push(format!("%{}%", client_name));
    }
    if let Some(tax_type) = &filter.tax_type {
        sql.push_str(" AND c.tax_type = ?");
        params_list.push(tax_type.clone());
    }
    if let Some(consultation_status) = &filter.consultation_status {
        sql.push_str(" AND c.status = ?");
        params_list.push(consultation_status.clone());
    }
    if let Some(handler_role) = &filter.handler_role {
        sql.push_str(" AND c.handler_role = ?");
        params_list.push(handler_role.clone());
    }
    if let Some(current_handler) = &filter.current_handler {
        sql.push_str(" AND c.current_handler = ?");
        params_list.push(current_handler.clone());
    }
    if let Some(date_from) = &filter.date_from {
        sql.push_str(" AND date(d.created_at) >= date(?)");
        params_list.push(date_from.clone());
    }
    if let Some(date_to) = &filter.date_to {
        sql.push_str(" AND date(d.created_at) <= date(?)");
        params_list.push(date_to.clone());
    }

    sql.push_str(" ORDER BY d.updated_at DESC, d.created_at DESC LIMIT 500");

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;

    let param_refs: Vec<&dyn rusqlite::ToSql> = params_list
        .iter()
        .map(|s| s as &dyn rusqlite::ToSql)
        .collect();

    let rows = stmt
        .query_map(rusqlite::params_from_iter(param_refs), |row| {
            Ok(DocumentListItem {
                id: row.get(0)?,
                consultation_id: row.get(1)?,
                consultation_no: row.get(2)?,
                client_name: row.get(3)?,
                tax_type: row.get(4)?,
                item_name: row.get(5)?,
                item_description: row.get(6)?,
                required: row.get(7)?,
                status: row.get(8)?,
                provided_by: row.get(9)?,
                provided_at: row.get(10)?,
                received_by: row.get(11)?,
                received_at: row.get(12)?,
                remarks: row.get(13)?,
                incomplete_reason: row.get(14)?,
                current_handler: row.get(15)?,
                handler_role: row.get(16)?,
                consultation_status: row.get(17)?,
                created_at: row.get(18)?,
                updated_at: row.get(19)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut documents = Vec::new();
    for row in rows {
        documents.push(row.map_err(|e| e.to_string())?);
    }
    Ok(documents)
}
