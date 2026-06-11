import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../../data/maintenance.db');

let dbInstance = null;
let SQL = null;

export async function initDb() {
  if (dbInstance) return dbInstance;

  SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    dbInstance = new SQL.Database(fileBuffer);
  } else {
    dbInstance = new SQL.Database();
    initSchema();
    saveDb();
  }

  return dbInstance;
}

export function saveDb() {
  if (!dbInstance) return;
  const data = dbInstance.export();
  const buffer = Buffer.from(data);
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  fs.writeFileSync(dbPath, buffer);
}

function initSchema() {
  dbInstance.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('inspector', 'property', 'supervisor')),
      phone TEXT,
      department TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE buildings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      property_manager_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (property_manager_id) REFERENCES users(id)
    );

    CREATE TABLE maintenance_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_no TEXT UNIQUE NOT NULL,
      building_id INTEGER NOT NULL,
      inspector_id INTEGER NOT NULL,
      current_status TEXT NOT NULL,
      inspection_date DATE NOT NULL,
      fire_alarm_system TEXT,
      sprinkler_system TEXT,
      fire_extinguishers TEXT,
      emergency_lights TEXT,
      fire_doors TEXT,
      other_equipment TEXT,
      problems_found TEXT,
      suggestions TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (building_id) REFERENCES buildings(id),
      FOREIGN KEY (inspector_id) REFERENCES users(id)
    );

    CREATE TABLE status_transitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER NOT NULL,
      from_status TEXT,
      to_status TEXT NOT NULL,
      operator_id INTEGER NOT NULL,
      operator_role TEXT NOT NULL,
      remark TEXT,
      transition_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES maintenance_reports(id),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    CREATE TABLE signature_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER NOT NULL,
      signatory_id INTEGER NOT NULL,
      signatory_name TEXT NOT NULL,
      signature_data TEXT,
      signed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      remark TEXT,
      FOREIGN KEY (report_id) REFERENCES maintenance_reports(id),
      FOREIGN KEY (signatory_id) REFERENCES users(id)
    );

    CREATE INDEX idx_reports_status ON maintenance_reports(current_status);
    CREATE INDEX idx_reports_building ON maintenance_reports(building_id);
    CREATE INDEX idx_transitions_report ON status_transitions(report_id);
    CREATE INDEX idx_transitions_time ON status_transitions(transition_time);
  `);
}

export async function getDb() {
  if (!dbInstance) {
    await initDb();
  }
  return dbInstance;
}

export function prepare(sql) {
  return {
    all: async (...params) => {
      const db = await getDb();
      const stmt = db.prepare(sql);
      stmt.bind(params);
      const result = [];
      while (stmt.step()) {
        result.push(stmt.getAsObject());
      }
      stmt.free();
      return result;
    },
    get: async (...params) => {
      const db = await getDb();
      const stmt = db.prepare(sql);
      stmt.bind(params);
      let result = null;
      if (stmt.step()) {
        result = stmt.getAsObject();
      }
      stmt.free();
      return result;
    },
    run: async (...params) => {
      const db = await getDb();
      db.run(sql, params);
      saveDb();
      return {
        changes: db.getRowsModified(),
        lastInsertRowid: db.exec('SELECT last_insert_rowid() as id')[0].values[0][0]
      };
    }
  };
}

export function exec(sql) {
  return new Promise(async (resolve) => {
    const db = await getDb();
    db.exec(sql);
    saveDb();
    resolve();
  });
}

export function transaction(fn) {
  return fn();
}

export const ROLES = {
  INSPECTOR: 'inspector',
  PROPERTY: 'property',
  SUPERVISOR: 'supervisor'
};

export const ROLE_LABELS = {
  inspector: '巡检工程师',
  property: '物业联系人',
  supervisor: '维保主管'
};

export const STATUS = {
  INSPECTION_COMPLETED: 'inspection_completed',
  REPORT_SUBMITTED: 'report_submitted',
  REPORT_REJECTED: 'report_rejected',
  REPORT_APPROVED: 'report_approved',
  PENDING_SIGNATURE: 'pending_signature',
  SIGNED: 'signed',
  DISPUTED: 'disputed',
  ARCHIVED: 'archived'
};

export const STATUS_META = {
  [STATUS.INSPECTION_COMPLETED]: { label: '巡检完成', color: '#6b7280', responsibleRole: ROLES.INSPECTOR },
  [STATUS.REPORT_SUBMITTED]: { label: '报告已提交', color: '#3b82f6', responsibleRole: ROLES.SUPERVISOR },
  [STATUS.REPORT_REJECTED]: { label: '报告被驳回', color: '#ef4444', responsibleRole: ROLES.INSPECTOR },
  [STATUS.REPORT_APPROVED]: { label: '报告已审核', color: '#10b981', responsibleRole: ROLES.PROPERTY },
  [STATUS.PENDING_SIGNATURE]: { label: '待客户签收', color: '#f59e0b', responsibleRole: ROLES.PROPERTY },
  [STATUS.SIGNED]: { label: '已签收', color: '#22c55e', responsibleRole: null },
  [STATUS.DISPUTED]: { label: '签收异议', color: '#dc2626', responsibleRole: ROLES.SUPERVISOR },
  [STATUS.ARCHIVED]: { label: '已归档', color: '#9ca3af', responsibleRole: null }
};

export const STATUS_TRANSITIONS = {
  [STATUS.INSPECTION_COMPLETED]: [STATUS.REPORT_SUBMITTED],
  [STATUS.REPORT_SUBMITTED]: [STATUS.REPORT_APPROVED, STATUS.REPORT_REJECTED],
  [STATUS.REPORT_REJECTED]: [STATUS.REPORT_SUBMITTED],
  [STATUS.REPORT_APPROVED]: [STATUS.PENDING_SIGNATURE],
  [STATUS.PENDING_SIGNATURE]: [STATUS.DISPUTED],
  [STATUS.DISPUTED]: [STATUS.PENDING_SIGNATURE, STATUS.REPORT_REJECTED],
  [STATUS.SIGNED]: [STATUS.ARCHIVED]
};

export const TRANSITION_OPERATOR_ROLES = {
  [STATUS.REPORT_SUBMITTED]: 'inspector',
  [STATUS.REPORT_APPROVED]: 'supervisor',
  [STATUS.REPORT_REJECTED]: 'supervisor',
  [STATUS.PENDING_SIGNATURE]: 'supervisor',
  [STATUS.DISPUTED]: 'property',
  [STATUS.SIGNED]: 'property',
  [STATUS.ARCHIVED]: 'system'
};
