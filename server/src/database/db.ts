import sqlite3 from 'sqlite3'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dbPath = join(__dirname, '../../database.sqlite')

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message)
  } else {
    console.log('数据库连接成功')
  }
})

export const initDatabase = () => {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('manager', 'bartender', 'customer_service')),
        phone TEXT NOT NULL
      )
    `)

    db.run(`
      CREATE TABLE IF NOT EXISTS tables (
        id TEXT PRIMARY KEY,
        number TEXT NOT NULL UNIQUE,
        area TEXT NOT NULL,
        capacity INTEGER NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('available', 'occupied', 'reserved'))
      )
    `)

    db.run(`
      CREATE TABLE IF NOT EXISTS complaints (
        id TEXT PRIMARY KEY,
        tableNumber TEXT NOT NULL,
        customerName TEXT NOT NULL,
        customerPhone TEXT NOT NULL,
        complaintType TEXT NOT NULL CHECK(complaintType IN ('duplicate_booking', 'schedule_change', 'storage_dispute', 'over_limit', 'other')),
        complaintReason TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('pending', 'compensated', 'followup', 'resolved')) DEFAULT 'pending',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        managerName TEXT NOT NULL,
        tableArea TEXT NOT NULL,
        FOREIGN KEY (tableNumber) REFERENCES tables(number)
      )
    `)

    db.run(`
      CREATE TABLE IF NOT EXISTS compensations (
        id TEXT PRIMARY KEY,
        complaintId TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('drinks', 'discount', 'free_entry', 'storage')),
        amount INTEGER NOT NULL,
        description TEXT NOT NULL,
        authorizedBy TEXT NOT NULL,
        authorizedAt TEXT NOT NULL,
        verifiedBy TEXT,
        verifiedAt TEXT,
        isAbnormal BOOLEAN NOT NULL DEFAULT 0,
        abnormalReason TEXT,
        FOREIGN KEY (complaintId) REFERENCES complaints(id),
        FOREIGN KEY (authorizedBy) REFERENCES users(name),
        FOREIGN KEY (verifiedBy) REFERENCES users(name)
      )
    `)

    db.run(`
      CREATE TABLE IF NOT EXISTS followups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        complaintId TEXT NOT NULL,
        followupBy TEXT NOT NULL,
        followupResult TEXT NOT NULL CHECK(followupResult IN ('resolved', 'pending')),
        followupNote TEXT NOT NULL,
        followupAt TEXT NOT NULL,
        FOREIGN KEY (complaintId) REFERENCES complaints(id),
        FOREIGN KEY (followupBy) REFERENCES users(name)
      )
    `)
  })
}