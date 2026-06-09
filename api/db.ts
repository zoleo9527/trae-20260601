import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, "..", "data", "parcel.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  return db;
}

export function initDb(): void {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS stations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      manager_id INTEGER
    );

    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('customer_service', 'courier', 'station_manager')),
      station_id INTEGER,
      FOREIGN KEY (station_id) REFERENCES stations(id)
    );

    CREATE TABLE IF NOT EXISTS parcels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tracking_no TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'arrived_pending',
      responsible_id INTEGER NOT NULL,
      responsible_type TEXT NOT NULL CHECK(responsible_type IN ('customer_service', 'courier', 'station_manager')),
      assignee_id INTEGER,
      assignee_type TEXT CHECK(assignee_type IN ('courier', 'station', NULL)),
      scanned_by INTEGER NOT NULL,
      arrived_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      dispatched_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (responsible_id) REFERENCES staff(id),
      FOREIGN KEY (scanned_by) REFERENCES staff(id),
      FOREIGN KEY (assignee_id) REFERENCES staff(id)
    );

    CREATE TABLE IF NOT EXISTS parcel_status_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parcel_id INTEGER NOT NULL,
      from_status TEXT,
      to_status TEXT NOT NULL,
      operator_id INTEGER NOT NULL,
      operator_role TEXT NOT NULL,
      responsible_id INTEGER NOT NULL,
      responsible_type TEXT NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (parcel_id) REFERENCES parcels(id),
      FOREIGN KEY (operator_id) REFERENCES staff(id),
      FOREIGN KEY (responsible_id) REFERENCES staff(id)
    );

    CREATE TABLE IF NOT EXISTS problem_parcels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parcel_id INTEGER NOT NULL,
      problem_type TEXT NOT NULL,
      resolution TEXT,
      reported_by INTEGER NOT NULL,
      resolved_by INTEGER,
      reported_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      resolved_at TEXT,
      FOREIGN KEY (parcel_id) REFERENCES parcels(id),
      FOREIGN KEY (reported_by) REFERENCES staff(id),
      FOREIGN KEY (resolved_by) REFERENCES staff(id)
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_parcels_status ON parcels(status);
    CREATE INDEX IF NOT EXISTS idx_parcels_responsible ON parcels(responsible_id);
    CREATE INDEX IF NOT EXISTS idx_parcels_assignee ON parcels(assignee_id);
    CREATE INDEX IF NOT EXISTS idx_parcels_tracking ON parcels(tracking_no);
    CREATE INDEX IF NOT EXISTS idx_audit_parcel ON parcel_status_log(parcel_id);
    CREATE INDEX IF NOT EXISTS idx_audit_time ON parcel_status_log(created_at);
  `);

  const staffCount = db.prepare("SELECT COUNT(*) as cnt FROM staff").get() as { cnt: number };
  if (staffCount.cnt === 0) {
    seedData(db);
  }
}

function seedData(db: Database.Database): void {
  const insertStation = db.prepare("INSERT INTO stations (id, name) VALUES (?, ?)");
  const insertStaff = db.prepare("INSERT INTO staff (id, name, role, station_id) VALUES (?, ?, ?, ?)");
  const updateStationManager = db.prepare("UPDATE stations SET manager_id = ? WHERE id = ?");
  const insertParcel = db.prepare(
    "INSERT INTO parcels (id, tracking_no, status, responsible_id, responsible_type, scanned_by, assignee_id, assignee_type, arrived_at, dispatched_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  const insertLog = db.prepare(
    "INSERT INTO parcel_status_log (parcel_id, from_status, to_status, operator_id, operator_role, responsible_id, responsible_type, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  );
  const insertProblem = db.prepare(
    "INSERT INTO problem_parcels (parcel_id, problem_type, reported_by) VALUES (?, ?, ?)"
  );
  const updateProblem = db.prepare(
    "UPDATE problem_parcels SET resolution = ?, resolved_by = ?, resolved_at = datetime('now', 'localtime') WHERE parcel_id = ?"
  );

  const transaction = db.transaction(() => {
    insertStation.run(1, "城东驿站");
    insertStation.run(2, "城西驿站");
    insertStation.run(3, "城南驿站");

    insertStaff.run(1, "张客服", "customer_service", null);
    insertStaff.run(2, "李客服", "customer_service", null);
    insertStaff.run(3, "王派件员", "courier", null);
    insertStaff.run(4, "赵派件员", "courier", null);
    insertStaff.run(5, "刘派件员", "courier", null);
    insertStaff.run(6, "陈站长", "station_manager", 1);
    insertStaff.run(7, "周站长", "station_manager", 2);
    insertStaff.run(8, "吴站长", "station_manager", 3);

    updateStationManager.run(6, 1);
    updateStationManager.run(7, 2);
    updateStationManager.run(8, 3);

    insertParcel.run(1, "SF1234567890", "arrived_pending", 1, "customer_service", 1, null, null, "2025-06-09 08:00:00", null);
    insertParcel.run(2, "SF1234567891", "arrived_pending", 1, "customer_service", 1, null, null, "2025-06-09 08:05:00", null);
    insertParcel.run(3, "SF1234567892", "dispatched_pending", 3, "courier", 1, 3, "courier", "2025-06-09 08:10:00", "2025-06-09 08:30:00");
    insertParcel.run(4, "SF1234567893", "dispatched_pending", 6, "station_manager", 2, 6, "station", "2025-06-09 08:15:00", "2025-06-09 08:35:00");
    insertParcel.run(5, "SF1234567894", "delivering", 4, "courier", 1, 4, "courier", "2025-06-09 08:20:00", "2025-06-09 08:40:00");
    insertParcel.run(6, "SF1234567895", "signed", 4, "courier", 1, 4, "courier", "2025-06-09 08:25:00", "2025-06-09 08:45:00");
    insertParcel.run(7, "SF1234567896", "problem_pending", 3, "courier", 2, null, null, "2025-06-09 08:30:00", null);
    insertParcel.run(8, "SF1234567897", "closed", 1, "customer_service", 1, null, null, "2025-06-09 08:35:00", null);

    insertLog.run(1, null, "arrived_pending", 1, "customer_service", 1, "customer_service", "到件扫描，责任人：张客服");
    insertLog.run(2, null, "arrived_pending", 1, "customer_service", 1, "customer_service", "到件扫描，责任人：张客服");
    insertLog.run(3, null, "arrived_pending", 1, "customer_service", 1, "customer_service", "到件扫描，责任人：张客服");
    insertLog.run(3, "arrived_pending", "dispatched_pending", 1, "customer_service", 3, "courier", "分配给王派件员，责任人变更为王派件员");
    insertLog.run(4, null, "arrived_pending", 2, "customer_service", 2, "customer_service", "到件扫描，责任人：李客服");
    insertLog.run(4, "arrived_pending", "dispatched_pending", 2, "customer_service", 6, "station_manager", "分配给城东驿站，责任人变更为陈站长");
    insertLog.run(5, null, "arrived_pending", 1, "customer_service", 1, "customer_service", "到件扫描，责任人：张客服");
    insertLog.run(5, "arrived_pending", "dispatched_pending", 1, "customer_service", 4, "courier", "分配给赵派件员，责任人变更为赵派件员");
    insertLog.run(5, "dispatched_pending", "delivering", 4, "courier", 4, "courier", "开始派件，责任人：赵派件员");
    insertLog.run(6, null, "arrived_pending", 1, "customer_service", 1, "customer_service", "到件扫描，责任人：张客服");
    insertLog.run(6, "arrived_pending", "dispatched_pending", 1, "customer_service", 4, "courier", "分配给赵派件员，责任人变更为赵派件员");
    insertLog.run(6, "dispatched_pending", "delivering", 4, "courier", 4, "courier", "开始派件，责任人：赵派件员");
    insertLog.run(6, "delivering", "signed", 4, "courier", 4, "courier", "本人签收，责任人：赵派件员");
    insertLog.run(7, null, "arrived_pending", 2, "customer_service", 2, "customer_service", "到件扫描，责任人：李客服");
    insertLog.run(7, "arrived_pending", "problem_pending", 3, "courier", 3, "courier", "外包装破损，责任人变更为王派件员（上报人）");
    insertLog.run(8, null, "arrived_pending", 1, "customer_service", 1, "customer_service", "到件扫描，责任人：张客服");
    insertLog.run(8, "arrived_pending", "problem_pending", 1, "customer_service", 1, "customer_service", "地址错误，责任人：张客服");
    insertLog.run(8, "problem_pending", "closed", 1, "customer_service", 1, "customer_service", "客服裁决关闭，责任人：张客服");

    insertProblem.run(7, "外包装破损", 3);
    insertProblem.run(8, "地址错误", 1);
    updateProblem.run("客服裁决关闭", 1, 8);
  });

  transaction();
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
