const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'tracking.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      code TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS instrument_packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      package_no TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      instruments TEXT NOT NULL,
      instrument_count INTEGER NOT NULL,
      status TEXT DEFAULT 'available',
      current_location TEXT DEFAULT 'hospital',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sterilization_batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_no TEXT UNIQUE NOT NULL,
      sterilizer_id TEXT NOT NULL,
      program TEXT NOT NULL,
      temperature REAL NOT NULL,
      duration INTEGER NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME,
      status TEXT DEFAULT 'processing',
      operator_id INTEGER,
      bio_indicator_result TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS batch_packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id INTEGER NOT NULL,
      package_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (batch_id) REFERENCES sterilization_batches(id),
      FOREIGN KEY (package_id) REFERENCES instrument_packages(id),
      UNIQUE(batch_id, package_id)
    );

    CREATE TABLE IF NOT EXISTS tracking_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      package_id INTEGER NOT NULL,
      batch_id INTEGER,
      action TEXT NOT NULL,
      status TEXT NOT NULL,
      operator_id INTEGER,
      department_id INTEGER,
      location TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (package_id) REFERENCES instrument_packages(id),
      FOREIGN KEY (batch_id) REFERENCES sterilization_batches(id),
      FOREIGN KEY (operator_id) REFERENCES users(id),
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS exception_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      package_id INTEGER NOT NULL,
      batch_id INTEGER,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      missing_items TEXT,
      reporter_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      handler_id INTEGER,
      resolution TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      FOREIGN KEY (package_id) REFERENCES instrument_packages(id),
      FOREIGN KEY (batch_id) REFERENCES sterilization_batches(id),
      FOREIGN KEY (reporter_id) REFERENCES users(id),
      FOREIGN KEY (handler_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS recall_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recall_no TEXT UNIQUE NOT NULL,
      batch_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      initiator_id INTEGER NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (batch_id) REFERENCES sterilization_batches(id),
      FOREIGN KEY (initiator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS recall_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recall_id INTEGER NOT NULL,
      package_id INTEGER NOT NULL,
      department_id INTEGER,
      status TEXT DEFAULT 'pending',
      recovered_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (recall_id) REFERENCES recall_tasks(id),
      FOREIGN KEY (package_id) REFERENCES instrument_packages(id),
      FOREIGN KEY (department_id) REFERENCES departments(id),
      UNIQUE(recall_id, package_id)
    );
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    seedData();
  }
}

function seedData() {
  const hash = bcrypt.hashSync('123456', 10);
  
  const insertUser = db.prepare(`
    INSERT INTO users (username, password, name, role, department)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertUser.run('admin', hash, '系统管理员', 'admin', null);
  insertUser.run('nurse_1', hash, '张护士', 'nurse', '手术室');
  insertUser.run('nurse_2', hash, '李护士', 'nurse', '外科病房');
  insertUser.run('cleaner_1', hash, '王清洗员', 'cleaner', null);
  insertUser.run('sterilizer_1', hash, '赵灭菌员', 'sterilizer', null);
  insertUser.run('deliverer_1', hash, '孙配送员', 'deliverer', null);
  insertUser.run('inspector_1', hash, '质检员', 'inspector', null);

  const insertDept = db.prepare('INSERT INTO departments (name, code) VALUES (?, ?)');
  insertDept.run('手术室', 'OR001');
  insertDept.run('外科病房', 'SUR001');
  insertDept.run('内科病房', 'INT001');
  insertDept.run('妇产科', 'OBG001');
  insertDept.run('供应室', 'SSD001');

  const insertPackage = db.prepare(`
    INSERT INTO instrument_packages (package_no, name, type, instruments, instrument_count, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const packages = [
    ['PKG20240601001', '基础外科手术包', 'surgery', '手术刀,止血钳,镊子,剪刀,持针器,组织钳,布巾钳,弯盘', 8, 'sterilized'],
    ['PKG20240601002', '妇产科检查包', 'obstetrics', '窥阴器,镊子,剪刀,弯盘,棉签,刮板', 6, 'in_use'],
    ['PKG20240601003', '手术室器械包A', 'surgery', '手术刀×2,止血钳×4,镊子×2,剪刀×2,持针器×2', 12, 'cleaning'],
    ['PKG20240601004', '清创缝合包', 'emergency', '手术刀,止血钳×2,镊子×2,剪刀,持针器,缝针,缝线', 9, 'sterilized'],
    ['PKG20240601005', '牙科检查包', 'dental', '口镜,探针,镊子,弯盘,吸唾管', 5, 'delivering'],
    ['PKG20240601006', '眼科手术包', 'surgery', '显微剪刀,显微镊子,持针器,眼科剪,虹膜恢复器', 6, 'in_use'],
    ['PKG20240601007', '剖腹产手术包', 'obstetrics', '手术刀×2,止血钳×6,镊子×3,剪刀×2,持针器×3', 16, 'sterilized'],
    ['PKG20240601008', '换药包', 'general', '镊子×2,剪刀,弯盘,药杯,纱布', 6, 'recycling']
  ];

  packages.forEach(p => insertPackage.run(...p));

  const insertBatch = db.prepare(`
    INSERT INTO sterilization_batches (batch_no, sterilizer_id, program, temperature, duration, start_time, end_time, status, operator_id, bio_indicator_result)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date();
  const batches = [
    ['BATCH20240601001', 'STE-001', '高温高压灭菌', 134, 18, new Date(now - 86400000 * 2).toISOString(), new Date(now - 86400000 * 2 + 3600000).toISOString(), 'completed', 5, 'pass'],
    ['BATCH20240601002', 'STE-001', '高温高压灭菌', 134, 18, new Date(now - 86400000).toISOString(), new Date(now - 86400000 + 3600000).toISOString(), 'completed', 5, 'pass'],
    ['BATCH20240601003', 'STE-002', '环氧乙烷灭菌', 55, 360, new Date(now - 3600000).toISOString(), null, 'processing', 5, null]
  ];

  batches.forEach(b => insertBatch.run(...b));

  const insertBatchPackage = db.prepare('INSERT INTO batch_packages (batch_id, package_id) VALUES (?, ?)');
  insertBatchPackage.run(1, 1);
  insertBatchPackage.run(1, 4);
  insertBatchPackage.run(2, 2);
  insertBatchPackage.run(2, 6);
  insertBatchPackage.run(3, 3);
  insertBatchPackage.run(1, 7);

  const insertTracking = db.prepare(`
    INSERT INTO tracking_records (package_id, batch_id, action, status, operator_id, department_id, location, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const records = [
    [1, 1, '回收', 'recycled', 2, 1, '手术室', '术后回收'],
    [1, 1, '清点', 'counted', 4, null, '清洗中心', '器械齐全'],
    [1, 1, '清洗', 'cleaned', 4, null, '清洗中心', '已完成超声波清洗'],
    [1, 1, '打包', 'packaged', 4, null, '打包区', '包装完好'],
    [1, 1, '灭菌', 'sterilized', 5, null, '灭菌室', '灭菌完成'],
    [1, 1, '质检', 'qualified', 7, null, '质检区', '检测合格'],
    [1, 1, '配送', 'delivering', 6, 1, '运输中', '发往手术室'],
    [1, 1, '签收', 'received', 2, 1, '手术室', '已签收'],
    
    [2, 2, '回收', 'recycled', 2, 4, '妇产科', '使用后回收'],
    [2, 2, '清点', 'counted', 4, null, '清洗中心', '器械齐全'],
    [2, 2, '清洗', 'cleaned', 4, null, '清洗中心', '清洗完成'],
    [2, 2, '灭菌', 'sterilized', 5, null, '灭菌室', '批次BATCH20240601002'],
    [2, 2, '配送', 'delivering', 6, 4, '运输中', '发往妇产科'],
    [2, null, '使用', 'in_use', 2, 4, '妇产科', '正在使用'],

    [3, 3, '回收', 'recycled', 2, 1, '手术室', '复杂手术'],
    [3, 3, '清洗', 'cleaning', 4, null, '清洗中心', '清洗中'],

    [4, 1, '回收', 'recycled', 2, 2, '外科病房', null],
    [4, 1, '灭菌', 'sterilized', 5, null, '灭菌室', null],
    [4, 1, '质检', 'qualified', 7, null, '质检区', null],
    [4, 1, '配送', 'delivering', 6, 2, '运输中', null],

    [8, null, '回收', 'recycling', 2, 2, '外科病房', '待回收']
  ];

  records.forEach(r => insertTracking.run(...r));

  const insertException = db.prepare(`
    INSERT INTO exception_reports (package_id, batch_id, type, description, missing_items, reporter_id, status, handler_id, resolution)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertException.run(
    3, 3, 'missing', '回收时发现缺少止血钳1把', '止血钳×1', 2, 'processing', 4, null
  );
  insertException.run(
    6, 2, 'contamination', '包装外层发现污渍', null, 7, 'resolved', 4, '重新清洗灭菌'
  );

  const insertRecall = db.prepare(`
    INSERT INTO recall_tasks (recall_no, batch_id, reason, initiator_id, status)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertRecall.run('RECALL20240601001', 1, '抽检发现湿包风险', 7, 'active');

  const insertRecallItem = db.prepare(`
    INSERT INTO recall_items (recall_id, package_id, department_id, status)
    VALUES (?, ?, ?, ?)
  `);
  insertRecallItem.run(1, 1, 1, 'pending');
  insertRecallItem.run(1, 4, 2, 'pending');
  insertRecallItem.run(1, 7, 4, 'recovered');
}

module.exports = { db, initDatabase };
