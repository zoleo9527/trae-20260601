const fs = require('fs');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'central-kitchen.db');
const walPath = dbPath + '-wal';
const shmPath = dbPath + '-shm';

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('Database file deleted');
}

if (fs.existsSync(walPath)) {
  fs.unlinkSync(walPath);
  console.log('WAL file deleted');
}

if (fs.existsSync(shmPath)) {
  fs.unlinkSync(shmPath);
  console.log('SHM file deleted');
}

console.log('Database reset complete');
