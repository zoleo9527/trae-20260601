declare module 'sqlite3' {
  interface Database {
    run(sql: string, params: unknown[], callback: (err: Error | null) => void): void
    get<T>(sql: string, params: unknown[], callback: (err: Error | null, row: T) => void): void
    all<T>(sql: string, params: unknown[], callback: (err: Error | null, rows: T[]) => void): void
    exec(sql: string, callback: (err: Error | null) => void): void
    close(callback: (err: Error | null) => void): void
    serialize(callback?: () => void): void
  }

  interface RunResult {
    lastID: number
    changes: number
  }

  export default class sqlite3 {
    static Database: new (filename: string, callback?: (err: Error | null) => void) => Database
    static OPEN_READONLY: number
    static OPEN_READWRITE: number
    static OPEN_CREATE: number
  }

  export { Database, RunResult }
}