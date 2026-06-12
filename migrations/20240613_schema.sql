-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('accountant', 'manager', 'supervisor', 'admin')),
    email TEXT,
    phone TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 客户表
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    tax_number TEXT,
    contract_start_date DATE,
    contract_end_date DATE,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'expiring', 'expired', 'suspended')),
    risk_level TEXT DEFAULT 'none' CHECK(risk_level IN ('high', 'medium', 'low', 'none')),
    risk_reasons TEXT DEFAULT '[]',
    accountant_id TEXT,
    manager_id TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (accountant_id) REFERENCES users(id),
    FOREIGN KEY (manager_id) REFERENCES users(id)
);

-- 交接清单表
CREATE TABLE IF NOT EXISTS handovers (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    from_user_id TEXT NOT NULL,
    to_user_id TEXT NOT NULL,
    from_user_role TEXT NOT NULL CHECK(from_user_role IN ('accountant', 'manager')),
    pending_items TEXT NOT NULL DEFAULT '{}',
    customer_habits TEXT NOT NULL DEFAULT '{}',
    invoice_details TEXT NOT NULL DEFAULT '{}',
    next_declaration TEXT NOT NULL DEFAULT '{}',
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'pending', 'approved', 'rejected')),
    review_comment TEXT,
    reviewer_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (from_user_id) REFERENCES users(id),
    FOREIGN KEY (to_user_id) REFERENCES users(id),
    FOREIGN KEY (reviewer_id) REFERENCES users(id)
);

-- 续约跟进记录表
CREATE TABLE IF NOT EXISTS renewal_follow_ups (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    contact_date DATE NOT NULL,
    contact_method TEXT NOT NULL CHECK(contact_method IN ('phone', 'wechat', 'email', 'visit')),
    content TEXT NOT NULL,
    result TEXT,
    next_follow_up_date DATE,
    attachments TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 历史备注表
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('general', 'handover', 'renewal', 'issue')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    attachments TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_risk_level ON customers(risk_level);
CREATE INDEX IF NOT EXISTS idx_customers_contract_end ON customers(contract_end_date);
CREATE INDEX IF NOT EXISTS idx_customers_accountant ON customers(accountant_id);
CREATE INDEX IF NOT EXISTS idx_customers_manager ON customers(manager_id);

CREATE INDEX IF NOT EXISTS idx_handovers_customer ON handovers(customer_id);
CREATE INDEX IF NOT EXISTS idx_handovers_status ON handovers(status);
CREATE INDEX IF NOT EXISTS idx_handovers_from_user ON handovers(from_user_id);
CREATE INDEX IF NOT EXISTS idx_handovers_to_user ON handovers(to_user_id);

CREATE INDEX IF NOT EXISTS idx_renewals_customer ON renewal_follow_ups(customer_id);
CREATE INDEX IF NOT EXISTS idx_renewals_date ON renewal_follow_ups(contact_date);

CREATE INDEX IF NOT EXISTS idx_notes_customer ON notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_notes_type ON notes(type);
CREATE INDEX IF NOT EXISTS idx_notes_created ON notes(created_at);