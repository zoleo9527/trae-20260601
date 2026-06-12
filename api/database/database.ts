import sqlite3 from 'sqlite3'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = path.join(__dirname, '../../data/database.sqlite')
const SCHEMA_PATH = path.join(__dirname, '../../migrations/20240613_schema.sql')
const SEED_PATH = path.join(__dirname, '../../migrations/20240613_seed.sql')

let db: sqlite3.Database | null = null

export function getDatabase(): sqlite3.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

export function initDatabase(): Promise<sqlite3.Database> {
  return new Promise((resolve, reject) => {
    const dataDir = path.dirname(DB_PATH)
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        reject(err)
        return
      }

      db!.serialize(() => {
        const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8')
        db!.exec(schemaSql, (schemaErr) => {
          if (schemaErr) {
            reject(schemaErr)
            return
          }

          db!.get('SELECT COUNT(*) as count FROM users', [], (countErr, row: { count: number }) => {
            if (countErr) {
              reject(countErr)
              return
            }

            if (row.count === 0) {
              const seedSql = fs.readFileSync(SEED_PATH, 'utf-8')
              db!.exec(seedSql, (seedErr) => {
                if (seedErr) {
                  reject(seedErr)
                  return
                }
                resolve(db!)
              })
            } else {
              resolve(db!)
            }
          })
        })
      })
    })
  })
}

export function closeDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!db) {
      resolve()
      return
    }

    db.close((err) => {
      if (err) {
        reject(err)
        return
      }
      db = null
      resolve()
    })
  })
}

export function run(sql: string, params: unknown[] = []): Promise<{ id: number; changes: number }> {
  return new Promise((resolve, reject) => {
    const database = getDatabase()
    database.run(sql, params, function (err) {
      if (err) {
        reject(err)
        return
      }
      resolve({ id: this.lastID, changes: this.changes })
    })
  })
}

export function get<T>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const database = getDatabase()
    database.get(sql, params, (err, row: T) => {
      if (err) {
        reject(err)
        return
      }
      resolve(row)
    })
  })
}

export function all<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const database = getDatabase()
    database.all(sql, params, (err, rows: T[]) => {
      if (err) {
        reject(err)
        return
      }
      resolve(rows || [])
    })
  })
}