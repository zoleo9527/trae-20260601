import db from './db';

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      student_id TEXT NOT NULL UNIQUE,
      dorm_room TEXT NOT NULL,
      counselor TEXT NOT NULL,
      phone TEXT
    );

    CREATE TABLE IF NOT EXISTS late_return_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      late_time TEXT NOT NULL,
      return_time TEXT NOT NULL,
      reason TEXT,
      status TEXT NOT NULL DEFAULT 'å·¥ç¢ºÀ§&Ð