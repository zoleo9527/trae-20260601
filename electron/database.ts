import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

let db: Database.Database | null = null;

export function initDatabase() {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'machinery.db');
  const photosDir = path.join(userDataPath, 'photos');

  if (!fs.existsSync(photosDir)) {
    fs.mkdirSync(photosDir, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  createTables();
  insertSeedData();

  return db;
}

function createTables() {
  if (!db) return;

  db.exec(`
    CREATE TABLE IF NOT EXISTS equipment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      model TEXT NOT NULL,
      serial_number TEXT UNIQUE,
      category TEXT,
      status TEXT DEFAULT 'idle',
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_no TEXT UNIQUE NOT NULL,
      equipment_id INTEGER NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT,
      customer_address TEXT,
      rent_start_date TEXT NOT NULL,
      planned_return_date TEXT NOT NULL,
      daily_rate REAL NOT NULL DEFAULT 0,
      monthly_rate REAL,
      deposit REAL NOT NULL DEFAULT 0,
      contract_manager TEXT,
      status TEXT DEFAULT 'active',
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (equipment_id) REFERENCES equipment(id)
    );

    CREATE TABLE IF NOT EXISTS dispatch_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_id INTEGER NOT NULL,
      dispatch_time DATETIME NOT NULL,
      dispatcher TEXT,
      operator_name TEXT,
      start_fuel_level REAL DEFAULT 0,
      start_working_hours REAL DEFAULT 0,
      remark TEXT,
      FOREIGN KEY (contract_id) REFERENCES contracts(id)
    );

    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_size INTEGER DEFAULT 0,
      upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      type TEXT NOT NULL,
      related_id INTEGER,
      remark TEXT
    );

    CREATE TABLE IF NOT EXISTS return_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_id INTEGER NOT NULL,
      equipment_id INTEGER NOT NULL,
      return_time DATETIME NOT NULL,
      actual_return_date TEXT NOT NULL,
      dispatcher TEXT,
      contract_manager TEXT,
      end_fuel_level REAL DEFAULT 0,
      fuel_difference REAL DEFAULT 0,
      fuel_cost_per_unit REAL DEFAULT 7.5,
      fuel_compensation REAL DEFAULT 0,
      end_working_hours REAL DEFAULT 0,
      working_hours_used REAL DEFAULT 0,
      working_hours_over_limit REAL DEFAULT 0,
      over_hours_rate REAL DEFAULT 0,
      over_hours_cost REAL DEFAULT 0,
      cleaning_status TEXT DEFAULT 'clean',
      cleaning_cost REAL DEFAULT 0,
      rent_days INTEGER DEFAULT 0,
      total_rent REAL DEFAULT 0,
      extra_days INTEGER DEFAULT 0,
      extra_days_cost REAL DEFAULT 0,
      total_damage_deductible REAL DEFAULT 0,
      total_deductions REAL DEFAULT 0,
      deposit REAL DEFAULT 0,
      deposit_refund REAL DEFAULT 0,
      additional_payment REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      dispatch_photo_ids TEXT,
      return_photo_ids TEXT,
      customer_remark TEXT,
      settlement_remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      confirmed_at DATETIME,
      customer_confirmed_at DATETIME,
      FOREIGN KEY (contract_id) REFERENCES contracts(id),
      FOREIGN KEY (equipment_id) REFERENCES equipment(id)
    );

    CREATE TABLE IF NOT EXISTS damage_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      return_record_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      severity TEXT DEFAULT 'minor',
      need_repair INTEGER DEFAULT 0,
      repair_cost REAL DEFAULT 0,
      deductible REAL DEFAULT 0,
      repairer TEXT,
      photo_ids TEXT,
      remark TEXT,
      FOREIGN KEY (return_record_id) REFERENCES return_records(id) ON DELETE CASCADE
    );
  `);
}

function insertSeedData() {
  if (!db) return;

  const equipmentCount = db.prepare('SELECT COUNT(*) as count FROM equipment').get() as { count: number };
  if (equipmentCount.count > 0) return;

  const insertEquipment = db.prepare(`
    INSERT INTO equipment (name, model, serial_number, category, status, remark)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const equipments = [
    ['CAT 320D 挖掘机', '320D', 'CAT320D-2023001', '挖掘机', 'idle', '2023年购入，状态良好'],
    ['小松 PC200-8', 'PC200-8', 'KOMATSU-PC200-001', '挖掘机', 'rented', '常用设备，性能稳定'],
    ['三一 SY75C', 'SY75C', 'SANY-SY75-001', '小型挖掘机', 'idle', '小型挖掘机，适合狭小空间'],
    ['徐工 50吨吊车', 'QY50K', 'XCMG-QY50-001', '起重机', 'idle', '50吨汽车吊'],
    ['日立 ZX130', 'ZX130', 'HITACHI-ZX130-001', '挖掘机', 'returned', '刚回场，待验收'],
  ];

  equipments.forEach((e) => insertEquipment.run(...e));

  const insertContract = db.prepare(`
    INSERT INTO contracts (contract_no, equipment_id, customer_name, customer_phone,
      customer_address, rent_start_date, planned_return_date, daily_rate, monthly_rate,
      deposit, contract_manager, status, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const today = new Date();
  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  const addDays = (d: Date, days: number) => {
    const nd = new Date(d);
    nd.setDate(nd.getDate() + days);
    return nd;
  };

  const contracts = [
    [
      'HT-2026-0515-001', 2, '北京城建集团', '13800138001', '北京市朝阳区建国路88号',
      formatDate(addDays(today, -30)), formatDate(addDays(today, -1)),
      1200, 28000, 30000, '张经理', 'active', '地铁项目设备租赁'
    ],
    [
      'HT-2026-0601-002', 5, '中国建筑第三工程局', '13900139002', '上海市浦东新区世纪大道100号',
      formatDate(addDays(today, -15)), formatDate(addDays(today, 15)),
      1500, 35000, 50000, '李经理', 'active', '高层建筑施工'
    ],
    [
      'HT-2026-0610-003', 4, '市政工程公司', '13700137003', '广州市天河区天河北路368号',
      formatDate(addDays(today, -5)), formatDate(addDays(today, 10)),
      2000, 45000, 60000, '王经理', 'active', '桥梁吊装作业'
    ],
  ];

  contracts.forEach((c) => insertContract.run(...c));

  const insertDispatch = db.prepare(`
    INSERT INTO dispatch_records (contract_id, dispatch_time, dispatcher, operator_name,
      start_fuel_level, start_working_hours, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertDispatch.run(
    1,
    new Date(addDays(today, -30)).toISOString(),
    '调度-刘师傅',
    '王操作',
    85,
    1250,
    '出场时车况良好，油满箱'
  );
  insertDispatch.run(
    2,
    new Date(addDays(today, -15)).toISOString(),
    '调度-陈师傅',
    '李操作',
    90,
    980,
    '设备检测合格出场'
  );
}

export function getDb(): Database.Database {
  if (!db) {
    return initDatabase();
  }
  return db;
}

export function getPhotosDir() {
  return path.join(app.getPath('userData'), 'photos');
}
