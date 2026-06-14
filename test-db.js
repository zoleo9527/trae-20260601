const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'training.db');
const db = new sqlite3.Database(dbPath);

console.log('数据库路径:', dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS test (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100),
      status VARCHAR(50)
    )
  `);

  try {
    db.prepare(`INSERT INTO test (name, status) VALUES (?, ?, ?)`).run('test', 'pending', 'extra');
    console.log('插入成功');
  } catch (err) {
    console.error('插入错误:', err.message);
  }

  db.close();
});
