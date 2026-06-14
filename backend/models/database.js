import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'judicial_appraisal.db'));

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    organization VARCHAR(200),
    email VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    last_login_time DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS delegations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    delegation_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL,
    applicant_name VARCHAR(100),
    applicant_organization VARCHAR(200),
    applicant_contact VARCHAR(50),
    applicant_id_card VARCHAR(50),
    case_type VARCHAR(100),
    case_description TEXT,
    incident_date DATE,
    incident_location VARCHAR(200),
    appraisal_items TEXT,
    expected_completion_date DATE,
    current_assignee VARCHAR(50),
    created_by VARCHAR(50) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completion_date DATETIME,
    is_abnormal INTEGER DEFAULT 0,
    abnormal_type VARCHAR(50),
    abnormal_reason TEXT,
    FOREIGN KEY (created_by) REFERENCES users(username)
  );

  CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    delegation_id INTEGER NOT NULL,
    material_name VARCHAR(200) NOT NULL,
    material_type VARCHAR(50),
    is_required INTEGER DEFAULT 1,
    is_provided INTEGER DEFAULT 0,
    verification_status VARCHAR(20) DEFAULT 'pending',
    verification_notes TEXT,
    verified_by VARCHAR(50),
    verified_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (delegation_id) REFERENCES delegations(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    delegation_id INTEGER NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    operator_username VARCHAR(50) NOT NULL,
    operator_role VARCHAR(50) NOT NULL,
    operator_name VARCHAR(100),
    operate_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    remarks TEXT,
    details TEXT,
    FOREIGN KEY (delegation_id) REFERENCES delegations(id) ON DELETE CASCADE,
    FOREIGN KEY (operator_username) REFERENCES users(username)
  );

  CREATE INDEX IF NOT EXISTS idx_delegation_status ON delegations(status);
  CREATE INDEX IF NOT EXISTS idx_delegation_abnormal ON delegations(is_abnormal);
  CREATE INDEX IF NOT EXISTS idx_materials_delegation ON materials(delegation_id);
  CREATE INDEX IF NOT EXISTS idx_audit_delegation ON audit_logs(delegation_id);
`);

export default db;
