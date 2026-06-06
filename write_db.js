const fs = require('fs');
const path = require('path');

// 1. Write api/db.ts
const dbContent = [
"import Database from 'better-sqlite3';",
"import path from 'path';",
"",
"const DB_PATH = path.join(__dirname, '..', 'dorm.db');",
"",
"const db = new Database(DB_PATH);",
"",
"db.pragma('journal_mode = WAL');",
"db.pragma('foreign_keys = ON');",
"",
"export default db;",
].join('\\n');
fs.writeFileSync('api/db.ts', dbContent);
console.log('api/db.ts 基础部分写入完成');
