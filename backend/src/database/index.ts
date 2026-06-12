import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';

let db: Database | null = null;

const DB_PATH = process.env.DB_PATH || './data/tender_bid.db';

export const getDb = async (): Promise<Database> => {
  if (db) return db;

  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  });

  await db.run('PRAGMA journal_mode = WAL');
  await db.run('PRAGMA foreign_keys = ON');

  return db;
};

export const initDatabase = async (): Promise<void> => {
  const database = await getDb();

  await database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      department TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      project_no TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      client_name TEXT NOT NULL,
      client_contact TEXT,
      client_phone TEXT,
      project_type TEXT NOT NULL,
      budget_amount REAL NOT NULL,
      bidding_method TEXT NOT NULL,
      status TEXT NOT NULL,
      current_handler_id TEXT NOT NULL,
      current_handler_name TEXT NOT NULL,
      current_handler_role TEXT NOT NULL,
      project_specialist_id TEXT NOT NULL,
      project_specialist_name TEXT NOT NULL,
      review_secretary_id TEXT,
      review_secretary_name TEXT,
      finance_id TEXT,
      finance_name TEXT,
      estimated_bidding_date TEXT,
      actual_bidding_date TEXT,
      bidding_location TEXT,
      room_number TEXT,
      description TEXT,
      remarks TEXT,
      attachments TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS project_arrangements (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      project_no TEXT NOT NULL,
      project_name TEXT NOT NULL,
      status TEXT NOT NULL,
      bidding_date TEXT NOT NULL,
      bidding_start_time TEXT NOT NULL,
      bidding_end_time TEXT NOT NULL,
      bidding_location TEXT NOT NULL,
      room_number TEXT NOT NULL,
      expert_count INTEGER NOT NULL,
      expert_ids TEXT NOT NULL,
      supervision_expert_id TEXT,
      supervision_expert_name TEXT,
      document_preparation INTEGER NOT NULL DEFAULT 0,
      venue_reservation INTEGER NOT NULL DEFAULT 0,
      equipment_check INTEGER NOT NULL DEFAULT 0,
      material_printing INTEGER NOT NULL DEFAULT 0,
      finance_confirmed INTEGER NOT NULL DEFAULT 0,
      deposit_received INTEGER NOT NULL DEFAULT 0,
      fee_calculated INTEGER NOT NULL DEFAULT 0,
      applicant_id TEXT NOT NULL,
      applicant_name TEXT NOT NULL,
      applicant_role TEXT NOT NULL,
      reviewer_id TEXT,
      reviewer_name TEXT,
      review_comment TEXT,
      reviewed_at TEXT,
      reject_reason TEXT,
      rejected_at TEXT,
      last_modified_at TEXT,
      modification_count INTEGER NOT NULL DEFAULT 0,
      block_reason TEXT,
      block_at TEXT,
      block_handler_id TEXT,
      block_handler_name TEXT,
      attachments TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS experts (
      id TEXT PRIMARY KEY,
      expert_no TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      gender TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      id_card TEXT NOT NULL,
      expertise TEXT NOT NULL,
      title TEXT NOT NULL,
      organization TEXT NOT NULL,
      status TEXT NOT NULL,
      total_signin_count INTEGER NOT NULL DEFAULT 0,
      absent_count INTEGER NOT NULL DEFAULT 0,
      late_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS expert_signin_records (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      project_no TEXT NOT NULL,
      project_name TEXT NOT NULL,
      arrangement_id TEXT NOT NULL,
      expert_id TEXT NOT NULL,
      expert_name TEXT NOT NULL,
      expertise TEXT NOT NULL,
      status TEXT NOT NULL,
      scheduled_arrival_time TEXT NOT NULL,
      actual_arrival_time TEXT,
      signin_time TEXT,
      signin_method TEXT,
      seat_number TEXT,
      is_supervision INTEGER NOT NULL DEFAULT 0,
      leave_reason TEXT,
      substitute_expert_id TEXT,
      substitute_expert_name TEXT,
      signin_complete_reason TEXT,
      handler_id TEXT,
      handler_name TEXT,
      handler_role TEXT,
      attachments TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (arrangement_id) REFERENCES project_arrangements(id),
      FOREIGN KEY (expert_id) REFERENCES experts(id)
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      description TEXT NOT NULL,
      operator_id TEXT NOT NULL,
      operator_name TEXT NOT NULL,
      operator_role TEXT NOT NULL,
      old_status TEXT,
      new_status TEXT,
      details TEXT,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS exception_records (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      project_no TEXT NOT NULL,
      project_name TEXT NOT NULL,
      type TEXT NOT NULL,
      severity TEXT NOT NULL,
      status TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      triggered_at TEXT NOT NULL,
      triggered_by TEXT NOT NULL,
      trigger_source TEXT NOT NULL,
      handler_id TEXT,
      handler_name TEXT,
      handler_role TEXT,
      handled_at TEXT,
      resolution TEXT,
      auto_trigger INTEGER NOT NULL DEFAULT 0,
      trigger_condition TEXT,
      attachments TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      related_entity_type TEXT NOT NULL,
      related_entity_id TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      read_at TEXT,
      action_required INTEGER NOT NULL DEFAULT 0,
      action_url TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    CREATE INDEX IF NOT EXISTS idx_projects_handler ON projects(current_handler_id);
    CREATE INDEX IF NOT EXISTS idx_project_arrangements_project ON project_arrangements(project_id);
    CREATE INDEX IF NOT EXISTS idx_project_arrangements_status ON project_arrangements(status);
    CREATE INDEX IF NOT EXISTS idx_signin_records_project ON expert_signin_records(project_id);
    CREATE INDEX IF NOT EXISTS idx_signin_records_arrangement ON expert_signin_records(arrangement_id);
    CREATE INDEX IF NOT EXISTS idx_signin_records_expert ON expert_signin_records(expert_id);
    CREATE INDEX IF NOT EXISTS idx_logs_entity ON operation_logs(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_exceptions_project ON exception_records(project_id);
    CREATE INDEX IF NOT EXISTS idx_exceptions_status ON exception_records(status);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
  `);
};

export const closeDatabase = async (): Promise<void> => {
  if (db) {
    await db.close();
    db = null;
  }
};
