use crate::models::*;
use chrono::Local;
use rusqlite::params;
use tauri::State;

fn generate_id() -> String {
    uuid::Uuid::new_v4().to_string()
}

fn generate_appointment_no() -> String {
    let now = Local::now();
    format!(
        "GZ-{}-{:04}",
        now.format("%Y%m%d%H%M%S"),
        rand::random::<u16>() % 10000
    )
}

fn now_str() -> String {
    Local::now().format("%Y-%m-%d %H:%M:%S").to_string()
}

fn row_to_appointment(row: &rusqlite::Row) -> rusqlite::Result<Appointment> {
    Ok(Appointment {
        id: row.get(0)?,
        appointment_no: row.get(1)?,
        applicant_name: row.get(2)?,
        applicant_id_no: row.get(3)?,
        applicant_phone: row.get(4)?,
        notary_type: row.get(5)?,
        appointment_time: row.get(6)?,
        status: row.get(7)?,
        current_handler_role: row.get(8)?,
        created_at: row.get(9)?,
        updated_at: row.get(10)?,
    })
}

fn row_to_material(row: &rusqlite::Row) -> rusqlite::Result<Material> {
    Ok(Material {
        id: row.get(0)?,
        appointment_id: row.get(1)?,
        material_name: row.get(2)?,
        material_code: row.get(3)?,
        is_required: row.get(4)?,
        status: row.get(5)?,
        review_comment: row.get(6)?,
        reviewed_by: row.get(7)?,
        reviewed_at: row.get(8)?,
        created_at: row.get(9)?,
    })
}

fn row_to_flow_record(row: &rusqlite::Row) -> rusqlite::Result<FlowRecord> {
    Ok(FlowRecord {
        id: row.get(0)?,
        appointment_id: row.get(1)?,
        from_role: row.get(2)?,
        to_role: row.get(3)?,
        action: row.get(4)?,
        comment: row.get(5)?,
        operator_name: row.get(6)?,
        created_at: row.get(7)?,
    })
}

fn row_to_correction_notice(row: &rusqlite::Row) -> rusqlite::Result<CorrectionNotice> {
    Ok(CorrectionNotice {
        id: row.get(0)?,
        appointment_id: row.get(1)?,
        material_id: row.get(2)?,
        notice_content: row.get(3)?,
        deadline: row.get(4)?,
        status: row.get(5)?,
        issued_by: row.get(6)?,
        issued_at: row.get(7)?,
        resolved_at: row.get(8)?,
    })
}

#[tauri::command]
pub fn create_appointment(
    state: State<AppState>,
    payload: CreateAppointmentPayload,
) -> Result<Appointment, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    let id = generate_id();
    let appointment_no = generate_appointment_no();
    let now = now_str();

    conn.execute(
        "INSERT INTO appointments (id, appointment_no, applicant_name, applicant_id_no, applicant_phone, notary_type, appointment_time, status, current_handler_role, created_at, updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)",
        params![id, appointment_no, payload.applicant_name, payload.applicant_id_no, payload.applicant_phone, payload.notary_type, payload.appointment_time, "pending_accept", "window", now, now],
    ).map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare("SELECT * FROM appointments WHERE id = ?1").map_err(|e| e.to_string())?;
    let apt = stmt.query_row(params![id], row_to_appointment).map_err(|e| e.to_string())?;
    Ok(apt)
}

#[tauri::command]
pub fn accept_appointment(
    state: State<AppState>,
    payload: AcceptAppointmentPayload,
) -> Result<Appointment, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    let now = now_str();

    let mut stmt = conn.prepare("SELECT * FROM appointments WHERE id = ?1").map_err(|e| e.to_string())?;
    let apt = stmt.query_row(params![payload.appointment_id], row_to_appointment).map_err(|e| e.to_string())?;

    if apt.status != "pending_accept" {
        return Err(format!("当前状态为 {}，无法受理", apt.status));
    }

    conn.execute(
        "UPDATE appointments SET status = 'accepted_reviewing', updated_at = ?1 WHERE id = ?2",
        params![now, payload.appointment_id],
    ).map_err(|e| e.to_string())?;

    let flow_id = generate_id();
    conn.execute(
        "INSERT INTO flow_records (id, appointment_id, from_role, to_role, action, comment, operator_name, created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8)",
        params![flow_id, payload.appointment_id, "window", "window", "accept", "窗口受理预约", payload.operator_name, now],
    ).map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare("SELECT * FROM appointments WHERE id = ?1").map_err(|e| e.to_string())?;
    let apt = stmt.query_row(params![payload.appointment_id], row_to_appointment).map_err(|e| e.to_string())?;
    Ok(apt)
}

#[tauri::command]
pub fn review_material(
    state: State<AppState>,
    payload: ReviewMaterialPayload,
) -> Result<Material, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    let now = now_str();

    conn.execute(
        "UPDATE materials SET status = ?1, review_comment = ?2, reviewed_by = ?3, reviewed_at = ?4 WHERE id = ?5",
        params![payload.status, payload.review_comment, payload.reviewed_by, now, payload.material_id],
    ).map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare("SELECT * FROM materials WHERE id = ?1").map_err(|e| e.to_string())?;
    let mat = stmt.query_row(params![payload.material_id], row_to_material).map_err(|e| e.to_string())?;
    Ok(mat)
}

#[tauri::command]
pub fn forward_appointment(
    state: State<AppState>,
    payload: ForwardPayload,
) -> Result<FlowRecord, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    let now = now_str();

    let status_map = match payload.to_role.as_str() {
        "notary" => "notary_reviewing",
        "archivist" => "archiving",
        _ => "in_process",
    };

    conn.execute(
        "UPDATE appointments SET current_handler_role = ?1, status = ?2, updated_at = ?3 WHERE id = ?4",
        params![payload.to_role, status_map, now, payload.appointment_id],
    ).map_err(|e| e.to_string())?;

    let flow_id = generate_id();
    conn.execute(
        "INSERT INTO flow_records (id, appointment_id, from_role, to_role, action, comment, operator_name, created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8)",
        params![flow_id, payload.appointment_id, payload.from_role, payload.to_role, payload.action, payload.comment, payload.operator_name, now],
    ).map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare("SELECT * FROM flow_records WHERE id = ?1").map_err(|e| e.to_string())?;
    let record = stmt.query_row(params![flow_id], row_to_flow_record).map_err(|e| e.to_string())?;
    Ok(record)
}

#[tauri::command]
pub fn get_appointment_detail(
    state: State<AppState>,
    appointment_id: String,
) -> Result<AppointmentWithMaterials, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare("SELECT * FROM appointments WHERE id = ?1").map_err(|e| e.to_string())?;
    let appointment = stmt.query_row(params![appointment_id], row_to_appointment).map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare("SELECT * FROM materials WHERE appointment_id = ?1").map_err(|e| e.to_string())?;
    let materials = stmt.query_map(params![appointment_id], row_to_material).map_err(|e| e.to_string())?.filter_map(|m| m.ok()).collect();

    let mut stmt = conn.prepare("SELECT * FROM flow_records WHERE appointment_id = ?1 ORDER BY created_at ASC").map_err(|e| e.to_string())?;
    let flow_records = stmt.query_map(params![appointment_id], row_to_flow_record).map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();

    let mut stmt = conn.prepare("SELECT * FROM correction_notices WHERE appointment_id = ?1").map_err(|e| e.to_string())?;
    let correction_notices = stmt.query_map(params![appointment_id], row_to_correction_notice).map_err(|e| e.to_string())?.filter_map(|n| n.ok()).collect();

    Ok(AppointmentWithMaterials {
        appointment,
        materials,
        flow_records,
        correction_notices,
    })
}

#[tauri::command]
pub fn get_dashboard(
    state: State<AppState>,
    role: String,
) -> Result<Vec<DashboardItem>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let status_filter: Vec<&str> = match role.as_str() {
        "window" => vec!["pending_accept", "accepted_reviewing", "correction_issued"],
        "notary" => vec!["notary_reviewing"],
        "archivist" => vec!["archiving"],
        _ => vec!["pending_accept"],
    };

    let placeholders: Vec<String> = status_filter.iter().enumerate().map(|(i, _)| format!("?{}", i + 1)).collect();
    let sql = format!(
        "SELECT * FROM appointments WHERE status IN ({}) ORDER BY updated_at DESC",
        placeholders.join(",")
    );

    let param_refs: Vec<&dyn rusqlite::types::ToSql> = status_filter.iter().map(|s| s as &dyn rusqlite::types::ToSql).collect();
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(param_refs.as_slice(), row_to_appointment).map_err(|e| e.to_string())?;

    let mut items = Vec::new();
    for row in rows {
        let apt = row.map_err(|e| e.to_string())?;

        let pending_count: i32 = conn.query_row(
            "SELECT COUNT(*) FROM materials WHERE appointment_id = ?1 AND status = 'pending'",
            params![apt.id],
            |r| r.get(0),
        ).unwrap_or(0);

        let latest: Option<(String, String)> = conn.query_row(
            "SELECT action, created_at FROM flow_records WHERE appointment_id = ?1 ORDER BY created_at DESC LIMIT 1",
            params![apt.id],
            |r| Ok((r.get(0)?, r.get(1)?)),
        ).ok();

        items.push(DashboardItem {
            appointment: apt,
            pending_material_count: pending_count,
            latest_action: latest.as_ref().map(|l| l.0.clone()),
            latest_action_time: latest.as_ref().map(|l| l.1.clone()),
        });
    }

    Ok(items)
}

#[tauri::command]
pub fn get_recent_status_changes(
    state: State<AppState>,
    limit: Option<i32>,
) -> Result<Vec<StatusChange>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    let lim = limit.unwrap_or(20);

    let mut stmt = conn.prepare(
        "SELECT fr.appointment_id, a.appointment_no, a.applicant_name, fr.action, fr.from_role, fr.to_role, fr.operator_name, fr.created_at FROM flow_records fr JOIN appointments a ON fr.appointment_id = a.id ORDER BY fr.created_at DESC LIMIT ?1"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map(params![lim], |row| {
        Ok(StatusChange {
            appointment_id: row.get(0)?,
            appointment_no: row.get(1)?,
            applicant_name: row.get(2)?,
            action: row.get(3)?,
            from_role: row.get(4)?,
            to_role: row.get(5)?,
            operator_name: row.get(6)?,
            created_at: row.get(7)?,
        })
    }).map_err(|e| e.to_string())?;

    Ok(rows.filter_map(|r| r.ok()).collect())
}

#[tauri::command]
pub fn batch_create_appointments(
    state: State<AppState>,
    payload: BatchCreatePayload,
) -> Result<Vec<Appointment>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    let mut results = Vec::new();

    for item in payload.appointments {
        let id = generate_id();
        let appointment_no = generate_appointment_no();
        let now = now_str();

        conn.execute(
            "INSERT INTO appointments (id, appointment_no, applicant_name, applicant_id_no, applicant_phone, notary_type, appointment_time, status, current_handler_role, created_at, updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)",
            params![id, appointment_no, item.applicant_name, item.applicant_id_no, item.applicant_phone, item.notary_type, item.appointment_time, "pending_accept", "window", now, now],
        ).map_err(|e| e.to_string())?;

        let mut stmt = conn.prepare("SELECT * FROM appointments WHERE id = ?1").map_err(|e| e.to_string())?;
        let apt = stmt.query_row(params![id], row_to_appointment).map_err(|e| e.to_string())?;
        results.push(apt);
    }

    Ok(results)
}

#[tauri::command]
pub fn add_materials(
    state: State<AppState>,
    payload: AddMaterialsPayload,
) -> Result<Vec<Material>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    let now = now_str();
    let mut results = Vec::new();

    for mat in payload.materials {
        let id = generate_id();
        conn.execute(
            "INSERT INTO materials (id, appointment_id, material_name, material_code, is_required, status, created_at) VALUES (?1,?2,?3,?4,?5,?6,?7)",
            params![id, payload.appointment_id, mat.material_name, mat.material_code, mat.is_required, "pending", now],
        ).map_err(|e| e.to_string())?;

        let mut stmt = conn.prepare("SELECT * FROM materials WHERE id = ?1").map_err(|e| e.to_string())?;
        let m = stmt.query_row(params![id], row_to_material).map_err(|e| e.to_string())?;
        results.push(m);
    }

    Ok(results)
}

#[tauri::command]
pub fn issue_correction(
    state: State<AppState>,
    payload: IssueCorrectionPayload,
) -> Result<CorrectionNotice, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    let now = now_str();

    let id = generate_id();
    conn.execute(
        "INSERT INTO correction_notices (id, appointment_id, material_id, notice_content, deadline, status, issued_by, issued_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8)",
        params![id, payload.appointment_id, payload.material_id, payload.notice_content, payload.deadline, "issued", payload.issued_by, now],
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE appointments SET status = 'correction_issued', updated_at = ?1 WHERE id = ?2",
        params![now, payload.appointment_id],
    ).map_err(|e| e.to_string())?;

    let flow_id = generate_id();
    let comment = format!("发出补正通知：{}", payload.notice_content);
    conn.execute(
        "INSERT INTO flow_records (id, appointment_id, from_role, to_role, action, comment, operator_name, created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8)",
        params![flow_id, payload.appointment_id, "window", "window", "issue_correction", comment, payload.issued_by, now],
    ).map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare("SELECT * FROM correction_notices WHERE id = ?1").map_err(|e| e.to_string())?;
    let notice = stmt.query_row(params![id], row_to_correction_notice).map_err(|e| e.to_string())?;
    Ok(notice)
}

#[tauri::command]
pub fn resolve_correction(
    state: State<AppState>,
    payload: ResolveCorrectionPayload,
) -> Result<CorrectionNotice, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    let now = now_str();

    conn.execute(
        "UPDATE correction_notices SET status = 'resolved', resolved_at = ?1 WHERE id = ?2",
        params![now, payload.notice_id],
    ).map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare("SELECT * FROM correction_notices WHERE id = ?1").map_err(|e| e.to_string())?;
    let notice = stmt.query_row(params![payload.notice_id], row_to_correction_notice).map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE appointments SET status = 'accepted_reviewing', updated_at = ?1 WHERE id = ?2",
        params![now, notice.appointment_id],
    ).map_err(|e| e.to_string())?;

    Ok(notice)
}

#[tauri::command]
pub fn get_prereview_history(
    state: State<AppState>,
    appointment_id: String,
) -> Result<Vec<Material>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT * FROM materials WHERE appointment_id = ?1 ORDER BY CASE WHEN reviewed_at IS NULL THEN 1 ELSE 0 END, reviewed_at DESC, created_at ASC"
    ).map_err(|e| e.to_string())?;

    let materials = stmt.query_map(params![appointment_id], row_to_material).map_err(|e| e.to_string())?.filter_map(|m| m.ok()).collect();
    Ok(materials)
}

#[tauri::command]
pub fn complete_appointment(
    state: State<AppState>,
    appointment_id: String,
    operator_name: String,
) -> Result<Appointment, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    let now = now_str();

    conn.execute(
        "UPDATE appointments SET status = 'completed', updated_at = ?1 WHERE id = ?2",
        params![now, appointment_id],
    ).map_err(|e| e.to_string())?;

    let flow_id = generate_id();
    conn.execute(
        "INSERT INTO flow_records (id, appointment_id, from_role, to_role, action, comment, operator_name, created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8)",
        params![flow_id, appointment_id, "archivist", "archivist", "complete", "归档完成", operator_name, now],
    ).map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare("SELECT * FROM appointments WHERE id = ?1").map_err(|e| e.to_string())?;
    let apt = stmt.query_row(params![appointment_id], row_to_appointment).map_err(|e| e.to_string())?;
    Ok(apt)
}
