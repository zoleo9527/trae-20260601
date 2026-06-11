const db = require('../database/db');

const initTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT,
      phone TEXT,
      brand_id INTEGER,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand_code TEXT UNIQUE NOT NULL,
      brand_name TEXT NOT NULL,
      category TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS brand_leases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lease_no TEXT UNIQUE NOT NULL,
      brand_id INTEGER NOT NULL,
      brand_name TEXT NOT NULL,
      store_code TEXT,
      floor TEXT,
      area REAL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      base_rent REAL,
      payment_method TEXT,
      contract_content TEXT,
      has_special_clause INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      submitter_id INTEGER,
      confirmer_id INTEGER,
      submitted_at TEXT,
      activated_at TEXT,
      rejected_reason TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (submitter_id) REFERENCES users(id),
      FOREIGN KEY (confirmer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS deduction_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lease_id INTEGER NOT NULL,
      base_rate REAL NOT NULL DEFAULT 0,
      promotion_rate REAL NOT NULL DEFAULT 0,
      tiered_rules TEXT,
      special_clause TEXT,
      effective_start TEXT,
      effective_end TEXT,
      liability_flag TEXT,
      liability_reason TEXT,
      liability_marked_by INTEGER,
      liability_marked_at TEXT,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      version INTEGER NOT NULL DEFAULT 1,
      creator_id INTEGER,
      confirmer_id INTEGER,
      confirmed_at TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (lease_id) REFERENCES brand_leases(id),
      FOREIGN KEY (creator_id) REFERENCES users(id),
      FOREIGN KEY (confirmer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lease_id INTEGER,
      deduction_rule_id INTEGER,
      operator_id INTEGER NOT NULL,
      operator_name TEXT NOT NULL,
      operator_role TEXT NOT NULL,
      action TEXT NOT NULL,
      action_detail TEXT,
      from_status TEXT,
      to_status TEXT,
      ip TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (lease_id) REFERENCES brand_leases(id),
      FOREIGN KEY (deduction_rule_id) REFERENCES deduction_rules(id)
    );

    CREATE TABLE IF NOT EXISTS export_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      user_name TEXT NOT NULL,
      task_type TEXT NOT NULL,
      task_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      params_json TEXT,
      file_path TEXT,
      file_name TEXT,
      progress INTEGER DEFAULT 0,
      error_msg TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      completed_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      type TEXT DEFAULT 'SYSTEM',
      related_lease_id INTEGER,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS stock_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lease_id INTEGER NOT NULL,
      brand_id INTEGER NOT NULL,
      report_date TEXT NOT NULL,
      total_sku INTEGER,
      total_quantity INTEGER,
      total_value REAL,
      reporter_id INTEGER,
      remark TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (lease_id) REFERENCES brand_leases(id)
    );

    CREATE TABLE IF NOT EXISTS discount_activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lease_id INTEGER NOT NULL,
      activity_name TEXT NOT NULL,
      activity_type TEXT,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      discount_desc TEXT,
      deduction_rate_override REAL,
      status TEXT DEFAULT 'PLANNED',
      creator_id INTEGER,
      approved_by INTEGER,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (lease_id) REFERENCES brand_leases(id)
    );

    CREATE INDEX IF NOT EXISTS idx_leases_status ON brand_leases(status);
    CREATE INDEX IF NOT EXISTS idx_leases_submitter ON brand_leases(submitter_id);
    CREATE INDEX IF NOT EXISTS idx_rules_lease ON deduction_rules(lease_id);
    CREATE INDEX IF NOT EXISTS idx_rules_liability ON deduction_rules(liability_flag);
    CREATE INDEX IF NOT EXISTS idx_logs_lease ON operation_logs(lease_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
  `);
};

module.exports = initTables;
