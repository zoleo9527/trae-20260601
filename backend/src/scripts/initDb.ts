import db from '../config/database';
import fs from 'fs';
import path from 'path';

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const initDatabase = () => {
  const createTables = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('weigher', 'sorting_foreman', 'sales_clerk', 'reviewer')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS inbound_batches (
      id TEXT PRIMARY KEY,
      batch_no TEXT UNIQUE NOT NULL,
      source TEXT NOT NULL,
      supplier TEXT NOT NULL,
      vehicle_plate TEXT NOT NULL,
      material_type TEXT NOT NULL,
      gross_weight REAL NOT NULL,
      tare_weight REAL NOT NULL,
      net_weight REAL NOT NULL,
      weigher_id TEXT NOT NULL,
      weigher_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'created',
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (weigher_id) REFERENCES users(id)
    )`,

    `CREATE TABLE IF NOT EXISTS sorting_records (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL,
      batch_no TEXT NOT NULL,
      team_id TEXT NOT NULL,
      team_name TEXT NOT NULL,
      foreman_id TEXT NOT NULL,
      foreman_name TEXT NOT NULL,
      total_sorted_weight REAL NOT NULL,
      loss_weight REAL NOT NULL,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (batch_id) REFERENCES inbound_batches(id),
      FOREIGN KEY (foreman_id) REFERENCES users(id)
    )`,

    `CREATE TABLE IF NOT EXISTS sorted_materials (
      id TEXT PRIMARY KEY,
      sorting_record_id TEXT NOT NULL,
      material_type TEXT NOT NULL,
      weight REAL NOT NULL,
      grade_level TEXT,
      unit_price REAL,
      amount REAL,
      photo_urls TEXT DEFAULT '[]',
      is_stocked INTEGER DEFAULT 0,
      is_scrapped INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sorting_record_id) REFERENCES sorting_records(id)
    )`,

    `CREATE TABLE IF NOT EXISTS grade_judgments (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL,
      sorted_material_id TEXT NOT NULL,
      material_type TEXT NOT NULL,
      original_grade TEXT NOT NULL,
      judged_grade TEXT NOT NULL,
      unit_price REAL NOT NULL,
      weight REAL NOT NULL,
      amount REAL NOT NULL,
      judge_id TEXT NOT NULL,
      judge_name TEXT NOT NULL,
      photo_urls TEXT DEFAULT '[]',
      remark TEXT,
      is_reviewed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (batch_id) REFERENCES inbound_batches(id),
      FOREIGN KEY (sorted_material_id) REFERENCES sorted_materials(id),
      FOREIGN KEY (judge_id) REFERENCES users(id)
    )`,

    `CREATE TABLE IF NOT EXISTS review_records (
      id TEXT PRIMARY KEY,
      grade_judgment_id TEXT NOT NULL,
      batch_id TEXT NOT NULL,
      sorted_material_id TEXT NOT NULL,
      material_type TEXT NOT NULL,
      original_grade TEXT NOT NULL,
      original_unit_price REAL NOT NULL,
      original_amount REAL NOT NULL,
      new_grade TEXT NOT NULL,
      new_unit_price REAL NOT NULL,
      new_amount REAL NOT NULL,
      grade_difference TEXT NOT NULL,
      price_difference REAL NOT NULL,
      amount_difference REAL NOT NULL,
      reviewer_id TEXT NOT NULL,
      reviewer_name TEXT NOT NULL,
      reason TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (grade_judgment_id) REFERENCES grade_judgments(id),
      FOREIGN KEY (batch_id) REFERENCES inbound_batches(id),
      FOREIGN KEY (sorted_material_id) REFERENCES sorted_materials(id),
      FOREIGN KEY (reviewer_id) REFERENCES users(id)
    )`,

    `CREATE TABLE IF NOT EXISTS inventory_records (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL,
      batch_no TEXT NOT NULL,
      sorted_material_id TEXT NOT NULL,
      material_type TEXT NOT NULL,
      grade_level TEXT NOT NULL,
      weight REAL NOT NULL,
      unit_price REAL NOT NULL,
      amount REAL NOT NULL,
      warehouse TEXT NOT NULL,
      location TEXT NOT NULL,
      stocker_id TEXT NOT NULL,
      stocker_name TEXT NOT NULL,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (batch_id) REFERENCES inbound_batches(id),
      FOREIGN KEY (sorted_material_id) REFERENCES sorted_materials(id),
      FOREIGN KEY (stocker_id) REFERENCES users(id)
    )`,

    `CREATE TABLE IF NOT EXISTS sorting_teams (
      id TEXT PRIMARY KEY,
      team_name TEXT NOT NULL,
      team_leader TEXT,
      members TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS price_list (
      id TEXT PRIMARY KEY,
      material_type TEXT NOT NULL,
      grade_level TEXT NOT NULL,
      unit_price REAL NOT NULL,
      effective_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(material_type, grade_level, effective_date)
    )`
  ];

  const createIndexes = [
    `CREATE INDEX IF NOT EXISTS idx_batches_status ON inbound_batches(status)`,
    `CREATE INDEX IF NOT EXISTS idx_batches_batch_no ON inbound_batches(batch_no)`,
    `CREATE INDEX IF NOT EXISTS idx_sorting_batch_id ON sorting_records(batch_id)`,
    `CREATE INDEX IF NOT EXISTS idx_sorted_materials_record_id ON sorted_materials(sorting_record_id)`,
    `CREATE INDEX IF NOT EXISTS idx_grade_judgments_batch ON grade_judgments(batch_id)`,
    `CREATE INDEX IF NOT EXISTS idx_review_records_judgment ON review_records(grade_judgment_id)`,
    `CREATE INDEX IF NOT EXISTS idx_inventory_batch ON inventory_records(batch_id)`
  ];

  console.log('开始创建数据库表...');
  
  createTables.forEach(sql => {
    db.exec(sql);
    console.log(`✓ 表创建完成: ${sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1] || 'unknown'}`);
  });

  createIndexes.forEach(sql => {
    db.exec(sql);
    console.log(`✓ 索引创建完成`);
  });

  console.log('\n数据库初始化完成！');
};

initDatabase();
