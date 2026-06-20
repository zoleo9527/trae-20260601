import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'recycling.db');

export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
const ensureColumn = (table: string, column: string, def: string) => {
  try {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
    if (!cols.find(c => c.name === column)) {
      db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`).run();
      console.log(`  + 迁移: ${table}.${column}`);
    }
  } catch (e) {
    console.log(`  = 跳过: ${table}.${column}`);
  }
};

const runMigrations = () => {
  console.log("检查数据库字段迁移...");
  ensureColumn("sorted_materials", "is_scrapped", "INTEGER DEFAULT 0");
  ensureColumn("review_records", "material_type", "TEXT");
  console.log("迁移检查完成.\n");
};

runMigrations();

export default db;
