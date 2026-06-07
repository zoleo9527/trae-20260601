const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../data/dairy.db');

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('旧数据库已删除');
}

require('./initDB');
console.log('数据库重置完成');
