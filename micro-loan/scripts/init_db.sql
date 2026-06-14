-- Create database if not exists
CREATE DATABASE IF NOT EXISTS micro_loan CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE micro_loan;

-- Tables will be auto-migrated by GORM, but here is the structure for reference:

-- loan_applications
CREATE TABLE IF NOT EXISTS loan_applications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    application_no VARCHAR(50) NOT NULL UNIQUE,
    customer_id VARCHAR(50) NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    loan_amount DECIMAL(15,2) NOT NULL,
    loan_term INT NOT NULL,
    interest_rate DECIMAL(10,6) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    status_updated_at DATETIME NOT NULL,
    current_handler VARCHAR(50),
    remark TEXT,
    disbursed_at DATETIME,
    due_date DATETIME,
    deleted_at DATETIME,
    created_at DATETIME,
    updated_at DATETIME,
    INDEX idx_status (status),
    INDEX idx_customer_id (customer_id),
    INDEX idx_current_handler (current_handler)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- document_collections
CREATE TABLE IF NOT EXISTS document_collections (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    loan_application_id BIGINT UNSIGNED NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    document_url VARCHAR(500),
    upload_time DATETIME NOT NULL,
    uploaded_by VARCHAR(50) NOT NULL,
    is_forged BOOLEAN DEFAULT FALSE,
    forgery_reason TEXT,
    audit_status VARCHAR(20) DEFAULT 'pending',
    audited_by VARCHAR(50),
    audited_at DATETIME,
    remark TEXT,
    created_at DATETIME,
    updated_at DATETIME,
    INDEX idx_loan_application_id (loan_application_id),
    INDEX idx_audit_status (audit_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- risk_audits
CREATE TABLE IF NOT EXISTS risk_audits (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    loan_application_id BIGINT UNSIGNED NOT NULL,
    risk_score DECIMAL(10,2) NOT NULL,
    risk_conclusion TEXT NOT NULL,
    risk_suggestion TEXT,
    auditor_id VARCHAR(50) NOT NULL,
    audit_time DATETIME NOT NULL,
    is_forgery BOOLEAN DEFAULT FALSE,
    forgery_description TEXT,
    remark TEXT,
    created_at DATETIME,
    updated_at DATETIME,
    INDEX idx_loan_application_id (loan_application_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- collection_records
CREATE TABLE IF NOT EXISTS collection_records (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    loan_application_id BIGINT UNSIGNED NOT NULL,
    collection_method VARCHAR(50) NOT NULL,
    collection_time DATETIME NOT NULL,
    collection_officer_id VARCHAR(50) NOT NULL,
    collection_result TEXT,
    remark TEXT,
    created_at DATETIME,
    updated_at DATETIME,
    INDEX idx_loan_application_id (loan_application_id),
    INDEX idx_collection_time (collection_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- extension_records
CREATE TABLE IF NOT EXISTS extension_records (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    loan_application_id BIGINT UNSIGNED NOT NULL,
    extension_reason TEXT NOT NULL,
    original_due_date DATETIME NOT NULL,
    new_due_date DATETIME NOT NULL,
    extension_amount DECIMAL(15,2) DEFAULT 0,
    extension_rate DECIMAL(10,6) DEFAULT 0,
    applicant_id VARCHAR(50) NOT NULL,
    approval_status VARCHAR(20) DEFAULT 'pending',
    approved_by VARCHAR(50),
    approved_at DATETIME,
    remark TEXT,
    created_at DATETIME,
    updated_at DATETIME,
    INDEX idx_loan_application_id (loan_application_id),
    INDEX idx_approval_status (approval_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- warning_records
CREATE TABLE IF NOT EXISTS warning_records (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    loan_application_id BIGINT UNSIGNED,
    warning_type VARCHAR(50) NOT NULL,
    warning_content TEXT NOT NULL,
    warning_time DATETIME NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    handler_id VARCHAR(50),
    handled_at DATETIME,
    remark TEXT,
    created_at DATETIME,
    updated_at DATETIME,
    INDEX idx_loan_application_id (loan_application_id),
    INDEX idx_warning_type (warning_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    operation_type VARCHAR(50) NOT NULL,
    operator_id VARCHAR(50) NOT NULL,
    operator_role VARCHAR(30),
    loan_application_id BIGINT UNSIGNED,
    operation_desc TEXT NOT NULL,
    before_data JSON,
    after_data JSON,
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    created_at DATETIME,
    INDEX idx_loan_application_id (loan_application_id),
    INDEX idx_operator_id (operator_id),
    INDEX idx_operation_type (operation_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- status_histories
CREATE TABLE IF NOT EXISTS status_histories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    loan_application_id BIGINT UNSIGNED NOT NULL,
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(50) NOT NULL,
    changed_at DATETIME NOT NULL,
    remark TEXT,
    created_at DATETIME,
    INDEX idx_loan_application_id (loan_application_id),
    INDEX idx_changed_at (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
