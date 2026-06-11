import { Database } from '@tauri-apps/plugin-sql';

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load('sqlite:industrial_park_crm.db');
    await initSchema(db);
  }
  return db;
}

async function initSchema(db: Database) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      avatar TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      company_name TEXT NOT NULL,
      contact_person TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      industry TEXT,
      required_area REAL,
      budget REAL,
      status TEXT NOT NULL,
      source_type TEXT NOT NULL,
      source_reference TEXT,
      source_uploaded_at TEXT,
      source_uploaded_by TEXT,
      assigned_to TEXT,
      assigned_role TEXT,
      assigned_at TEXT,
      current_responsible TEXT,
      current_responsible_role TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      created_by TEXT NOT NULL,
      priority TEXT DEFAULT 'medium',
      tags TEXT,
      remark TEXT,
      has_exception INTEGER DEFAULT 0,
      exception_type TEXT,
      exception_message TEXT,
      exception_at TEXT,
      FOREIGN KEY (assigned_to) REFERENCES users(id),
      FOREIGN KEY (current_responsible) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
    CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
    CREATE INDEX IF NOT EXISTS idx_leads_current_responsible ON leads(current_responsible);
    CREATE INDEX IF NOT EXISTS idx_leads_has_exception ON leads(has_exception);
    CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
    CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);

    CREATE TABLE IF NOT EXISTS followup_records (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      location TEXT,
      scheduled_at TEXT,
      started_at TEXT,
      completed_at TEXT,
      status TEXT NOT NULL,
      handled_by TEXT NOT NULL,
      handled_role TEXT NOT NULL,
      next_action TEXT,
      next_action_at TEXT,
      next_responsible TEXT,
      next_responsible_role TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      attachments TEXT,
      FOREIGN KEY (lead_id) REFERENCES leads(id),
      FOREIGN KEY (handled_by) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_followup_lead_id ON followup_records(lead_id);
    CREATE INDEX IF NOT EXISTS idx_followup_status ON followup_records(status);
    CREATE INDEX IF NOT EXISTS idx_followup_scheduled_at ON followup_records(scheduled_at);
    CREATE INDEX IF NOT EXISTS idx_followup_handled_by ON followup_records(handled_by);

    CREATE TABLE IF NOT EXISTS status_transitions (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      followup_id TEXT,
      from_status TEXT,
      to_status TEXT NOT NULL,
      from_followup_status TEXT,
      to_followup_status TEXT,
      from_responsible TEXT,
      to_responsible TEXT,
      from_responsible_role TEXT,
      to_responsible_role TEXT,
      transitioned_at TEXT NOT NULL,
      transitioned_by TEXT NOT NULL,
      transitioned_by_role TEXT NOT NULL,
      remark TEXT,
      is_gap_detected INTEGER DEFAULT 0,
      gap_duration_minutes REAL DEFAULT 0,
      FOREIGN KEY (lead_id) REFERENCES leads(id),
      FOREIGN KEY (followup_id) REFERENCES followup_records(id)
    );

    CREATE INDEX IF NOT EXISTS idx_transitions_lead_id ON status_transitions(lead_id);
    CREATE INDEX IF NOT EXISTS idx_transitions_transitioned_at ON status_transitions(transitioned_at);
    CREATE INDEX IF NOT EXISTS idx_transitions_is_gap ON status_transitions(is_gap_detected);

    CREATE TABLE IF NOT EXISTS exception_logs (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      followup_id TEXT,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      detected_at TEXT NOT NULL,
      handled INTEGER DEFAULT 0,
      handled_at TEXT,
      handled_by TEXT,
      handled_remark TEXT,
      triggered_by_transition_id TEXT,
      FOREIGN KEY (lead_id) REFERENCES leads(id),
      FOREIGN KEY (followup_id) REFERENCES followup_records(id),
      FOREIGN KEY (triggered_by_transition_id) REFERENCES status_transitions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_exception_lead_id ON exception_logs(lead_id);
    CREATE INDEX IF NOT EXISTS idx_exception_handled ON exception_logs(handled);
    CREATE INDEX IF NOT EXISTS idx_exception_detected_at ON exception_logs(detected_at);

    CREATE TABLE IF NOT EXISTS sync_status (
      id TEXT PRIMARY KEY,
      last_sync_at TEXT,
      pending_changes TEXT,
      offline_mode INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await initSeedData(db);
}

async function initSeedData(db: Database) {
  const userCount = await db.select<{ count: number }[]>(
    'SELECT COUNT(*) as count FROM users'
  );
  if (userCount[0].count === 0) {
    await db.execute(
      `INSERT INTO users (id, name, role) VALUES
       ('user_1', '张经理', 'manager'),
       ('user_2', '李主管', 'supervisor'),
       ('user_3', '王物业', 'property'),
       ('user_4', '赵工程', 'engineering')`
    );
  }

  const settingsCount = await db.select<{ count: number }[]>(
    'SELECT COUNT(*) as count FROM app_settings'
  );
  if (settingsCount[0].count === 0) {
    await db.execute(
      `INSERT INTO app_settings (key, value) VALUES
       ('current_user_id', 'user_1'),
       ('gap_detection_threshold_minutes', '30'),
       ('auto_assignment_enabled', 'true')`
    );
  }
}

export async function closeDb() {
  if (db) {
    await db.close();
    db = null;
  }
}
