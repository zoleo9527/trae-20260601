CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    appointment_no TEXT NOT NULL UNIQUE,
    applicant_name TEXT NOT NULL,
    applicant_id_no TEXT NOT NULL,
    applicant_phone TEXT,
    notary_type TEXT NOT NULL,
    appointment_time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_accept',
    current_handler_role TEXT NOT NULL DEFAULT 'window',
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS materials (
    id TEXT PRIMARY KEY,
    appointment_id TEXT NOT NULL,
    material_name TEXT NOT NULL,
    material_code TEXT NOT NULL,
    is_required INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'pending',
    review_comment TEXT,
    reviewed_by TEXT,
    reviewed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);

CREATE TABLE IF NOT EXISTS flow_records (
    id TEXT PRIMARY KEY,
    appointment_id TEXT NOT NULL,
    from_role TEXT NOT NULL,
    to_role TEXT NOT NULL,
    action TEXT NOT NULL,
    comment TEXT,
    operator_name TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);

CREATE TABLE IF NOT EXISTS correction_notices (
    id TEXT PRIMARY KEY,
    appointment_id TEXT NOT NULL,
    material_id TEXT,
    notice_content TEXT NOT NULL,
    deadline TEXT,
    status TEXT NOT NULL DEFAULT 'issued',
    issued_by TEXT,
    issued_by_role TEXT NOT NULL DEFAULT 'window',
    issued_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    resolved_at TEXT,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    FOREIGN KEY (material_id) REFERENCES materials(id)
);

CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_handler ON appointments(current_handler_role);
CREATE INDEX IF NOT EXISTS idx_materials_appointment ON materials(appointment_id);
CREATE INDEX IF NOT EXISTS idx_flow_appointment ON flow_records(appointment_id);
CREATE INDEX IF NOT EXISTS idx_correction_appointment ON correction_notices(appointment_id);
