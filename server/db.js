const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('accountant', 'manager', 'supervisor')),
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      company_name TEXT NOT NULL,
      tax_type TEXT NOT NULL CHECK(tax_type IN ('general', 'small_scale')),
      industry TEXT,
      contact_person TEXT,
      contact_phone TEXT,
      accountant_id INTEGER,
      manager_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (accountant_id) REFERENCES users(id),
      FOREIGN KEY (manager_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS tax_filings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      period TEXT NOT NULL,
      tax_type TEXT NOT NULL CHECK(tax_type IN ('vat', 'income', 'personal_income', 'additional')),
      status TEXT NOT NULL CHECK(status IN ('pending', 'in_progress', 'submitted', 'approved', 'rejected', 'completed')),
      due_date DATE,
      submitted_date DATE,
      current_remark TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS exceptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      tax_filing_id INTEGER,
      type TEXT NOT NULL CHECK(type IN ('urge', 'reject', 'supplement')),
      status TEXT NOT NULL CHECK(status IN ('open', 'processing', 'resolved', 'closed')),
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
      related_remark TEXT,
      assigned_to INTEGER,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (tax_filing_id) REFERENCES tax_filings(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ref_type TEXT NOT NULL CHECK(ref_type IN ('tax_filing', 'exception')),
      ref_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      old_status TEXT,
      new_status TEXT,
      remark TEXT,
      operator_id INTEGER,
      operator_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ref_type TEXT NOT NULL CHECK(ref_type IN ('tax_filing', 'exception')),
      ref_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_size INTEGER,
      file_type TEXT,
      file_path TEXT NOT NULL,
      uploaded_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_tax_filings_customer ON tax_filings(customer_id);
    CREATE INDEX IF NOT EXISTS idx_tax_filings_status ON tax_filings(status);
    CREATE INDEX IF NOT EXISTS idx_tax_filings_period ON tax_filings(period);
    CREATE INDEX IF NOT EXISTS idx_exceptions_customer ON exceptions(customer_id);
    CREATE INDEX IF NOT EXISTS idx_exceptions_status ON exceptions(status);
    CREATE INDEX IF NOT EXISTS idx_exceptions_type ON exceptions(type);
    CREATE INDEX IF NOT EXISTS idx_operation_logs_ref ON operation_logs(ref_type, ref_id);
  `);
}

module.exports = { db, initDB };
