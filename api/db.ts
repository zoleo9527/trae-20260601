import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = path.join(__dirname, 'inspection.db')

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    initTables()
    seedData()
  }
  return db
}

function initTables() {
  const d = db!
  d.exec(`
    CREATE TABLE IF NOT EXISTS appointment_records (
      id TEXT PRIMARY KEY,
      plate_number TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      vehicle_type TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending_reception',
      receptionist_id TEXT,
      reception_time TEXT,
      reception_notes TEXT DEFAULT '',
      inspector_id TEXT,
      inspection_time TEXT,
      inspection_result TEXT DEFAULT '',
      reviewer_id TEXT,
      review_time TEXT,
      review_result TEXT,
      return_reason TEXT DEFAULT '',
      supplementary_notes TEXT DEFAULT '',
      retry_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)

  d.exec(`
    CREATE TABLE IF NOT EXISTS action_logs (
      id TEXT PRIMARY KEY,
      record_id TEXT NOT NULL,
      action TEXT NOT NULL,
      operator_role TEXT NOT NULL,
      operator_id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      notes TEXT DEFAULT '',
      FOREIGN KEY (record_id) REFERENCES appointment_records(id)
    );
  `)

  d.exec(`CREATE INDEX IF NOT EXISTS idx_records_status ON appointment_records(status);`)
  d.exec(`CREATE INDEX IF NOT EXISTS idx_logs_record_id ON action_logs(record_id);`)
}

const SEED_RECORDS = [
  {
    id: 'REC001', plateNumber: '京A·88721', ownerName: '张伟', vehicleType: '小型轿车',
    appointmentTime: '2026-06-14 09:00', status: 'pending_reception',
  },
  {
    id: 'REC002', plateNumber: '京B·33056', ownerName: '李娜', vehicleType: 'SUV',
    appointmentTime: '2026-06-14 09:30', status: 'pending_reception',
  },
  {
    id: 'REC003', plateNumber: '京C·76509', ownerName: '王芳', vehicleType: '小型轿车',
    appointmentTime: '2026-06-14 10:00', status: 'pending_reception',
  },
  {
    id: 'REC004', plateNumber: '京D·12188', ownerName: '赵强', vehicleType: '轻型货车',
    appointmentTime: '2026-06-14 10:30', status: 'pending_inspection',
    receptionistId: 'receptionist-1', receptionTime: '2026-06-14 10:35',
    receptionNotes: '外观良好，行驶证和身份证齐全，注意右前轮胎磨损',
  },
  {
    id: 'REC005', plateNumber: '京E·55432', ownerName: '陈明', vehicleType: 'SUV',
    appointmentTime: '2026-06-14 11:00', status: 'pending_inspection',
    receptionistId: 'receptionist-1', receptionTime: '2026-06-14 11:05',
    receptionNotes: '车主提供保险单过期，需核实是否在续保宽限期内',
  },
  {
    id: 'REC006', plateNumber: '京F·99817', ownerName: '刘洋', vehicleType: '小型轿车',
    appointmentTime: '2026-06-14 11:30', status: 'pending_review',
    receptionistId: 'receptionist-1', receptionTime: '2026-06-14 11:32',
    receptionNotes: '资料齐全，车辆外观正常',
    inspectorId: 'inspector-1', inspectionTime: '2026-06-14 11:50',
    inspectionResult: '尾气排放达标，灯光正常，制动合格',
  },
  {
    id: 'REC007', plateNumber: '京G·44563', ownerName: '周杰', vehicleType: '小型轿车',
    appointmentTime: '2026-06-14 13:00', status: 'returned',
    receptionistId: 'receptionist-1', receptionTime: '2026-06-14 13:05',
    receptionNotes: '初次接车，行驶证地址与身份证不一致',
    inspectorId: 'inspector-1', inspectionTime: '2026-06-14 13:30',
    inspectionResult: '尾气排放合格，制动合格，灯光合格',
    reviewerId: 'reviewer-1', reviewTime: '2026-06-14 13:45',
    reviewResult: 'return', returnReason: '行驶证登记地址与身份证地址不一致，需提供居住证明或变更行驶证地址后重新提交',
    retryCount: 1,
  },
  {
    id: 'REC008', plateNumber: '京H·22190', ownerName: '吴磊', vehicleType: 'SUV',
    appointmentTime: '2026-06-14 14:00', status: 'completed',
    receptionistId: 'receptionist-1', receptionTime: '2026-06-14 14:02',
    receptionNotes: '资料齐全，车辆状况良好',
    inspectorId: 'inspector-1', inspectionTime: '2026-06-14 14:20',
    inspectionResult: '全部检测项目合格',
    reviewerId: 'reviewer-1', reviewTime: '2026-06-14 14:35',
    reviewResult: 'pass',
  },
]

function seedData() {
  const d = db!
  const count = d.prepare('SELECT COUNT(*) as cnt FROM appointment_records').get() as { cnt: number }
  if (count.cnt > 0) return

  const insertRecord = d.prepare(`
    INSERT INTO appointment_records (
      id, plate_number, owner_name, vehicle_type, appointment_time,
      status, receptionist_id, reception_time, reception_notes,
      inspector_id, inspection_time, inspection_result,
      reviewer_id, review_time, review_result,
      return_reason, supplementary_notes, retry_count,
      created_at, updated_at
    ) VALUES (
      @id, @plateNumber, @ownerName, @vehicleType, @appointmentTime,
      @status, @receptionistId, @receptionTime, @receptionNotes,
      @inspectorId, @inspectionTime, @inspectionResult,
      @reviewerId, @reviewTime, @reviewResult,
      @returnReason, @supplementaryNotes, @retryCount,
      @createdAt, @updatedAt
    )
  `)

  const now = new Date().toISOString()
  const transaction = d.transaction(() => {
    for (const r of SEED_RECORDS) {
      insertRecord.run({
        id: r.id,
        plateNumber: r.plateNumber,
        ownerName: r.ownerName,
        vehicleType: r.vehicleType,
        appointmentTime: r.appointmentTime,
        status: r.status,
        receptionistId: r.receptionistId || null,
        receptionTime: r.receptionTime || null,
        receptionNotes: r.receptionNotes || '',
        inspectorId: r.inspectorId || null,
        inspectionTime: r.inspectionTime || null,
        inspectionResult: r.inspectionResult || '',
        reviewerId: r.reviewerId || null,
        reviewTime: r.reviewTime || null,
        reviewResult: r.reviewResult || null,
        returnReason: r.returnReason || '',
        supplementaryNotes: '',
        retryCount: r.retryCount || 0,
        createdAt: now,
        updatedAt: now,
      })
    }
  })
  transaction()
}

export function resetData() {
  const d = getDb()
  d.prepare('DELETE FROM action_logs').run()
  d.prepare('DELETE FROM appointment_records').run()
  seedData()
}
