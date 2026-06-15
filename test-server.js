const sqlite3 = require('sqlite3');
const path = require('path');

console.log('Testing sqlite3...');

const dbPath = path.join(__dirname, 'data/database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  } else {
    console.log('Connected to SQLite database');
    
    db.run('CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY)', (err) => {
      if (err) {
        console.error('Error creating table:', err.message);
      } else {
        console.log('Table created successfully');
      }
      db.close();
      console.log('Test completed successfully');
    });
  }
});
