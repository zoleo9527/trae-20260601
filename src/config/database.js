import { Sequelize } from 'sequelize';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isTest = process.env.NODE_ENV === 'test';
const storagePath = isTest ? ':memory:' : join(__dirname, '../../data.sqlite');
const logging = isTest ? false : console.log;

let sequelize;
let dbDriver = 'fallback';

try {
  const BetterSQLite3 = require('better-sqlite3');
  
  const sqliteModule = {
    Database: function databaseWrapper(filename, mode, callback) {
      if (typeof mode === 'function') {
        callback = mode;
        mode = undefined;
      }
      const options = {};
      if (mode !== undefined) {
        options.readonly = (mode & 1) === 1;
        options.fileMustExist = (mode & 2) === 2;
      }
      if (filename === ':memory:') {
        options.fileMustExist = false;
      }
      const db = new BetterSQLite3(filename, options);
      if (callback) {
        setImmediate(() => callback(null, db));
      }
      db.configure = function configure(option, value) {
        if (option === 'busyTimeout') {
          db.pragma(`busy_timeout = ${value}`);
        }
        return db;
      };
      db.serialize = function serialize(callback) {
        if (callback) callback.call(db);
        return db;
      };
      db.run = function run(sql, ...params) {
        const stmt = db.prepare(sql);
        const info = stmt.run(...params);
        return Object.assign(stmt, { lastID: info.lastInsertRowid, changes: info.changes });
      };
      db.all = function all(sql, ...params) {
        const callback = params.pop();
        try {
          const stmt = db.prepare(sql);
          const rows = stmt.all(...params);
          if (callback) callback(null, rows);
          return db;
        } catch (err) {
          if (callback) callback(err);
          return db;
        }
      };
      db.get = function get(sql, ...params) {
        const callback = params.pop();
        try {
          const stmt = db.prepare(sql);
          const row = stmt.get(...params);
          if (callback) callback(null, row);
          return db;
        } catch (err) {
          if (callback) callback(err);
          return db;
        }
      };
      db.exec = function exec(sql, callback) {
        try {
          db.exec(sql);
          if (callback) callback(null);
          return db;
        } catch (err) {
          if (callback) callback(err);
          return db;
        }
      };
      db.each = function each(sql, ...params) {
        const callback = params.pop();
        const complete = params.pop();
        try {
          const stmt = db.prepare(sql);
          const rows = stmt.all(...params);
          for (let i = 0; i < rows.length; i++) {
            callback(null, rows[i]);
          }
          if (complete) complete(null, rows.length);
          return db;
        } catch (err) {
          if (callback) callback(err);
          return db;
        }
      };
      return db;
    },
  };
  
  sequelize = new Sequelize({
    dialect: 'sqlite',
    dialectModule: sqliteModule,
    storage: storagePath,
    logging,
  });
  
  dbDriver = 'better-sqlite3';
  console.log('✓ 使用 better-sqlite3 原生驱动');
} catch (betterSqliteError) {
  try {
    const sqlite3 = require('sqlite3');
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: storagePath,
      logging,
    });
    dbDriver = 'sqlite3';
    console.log('✓ 使用 sqlite3 原生驱动');
  } catch (sqlite3Error) {
    console.log(`ℹ  better-sqlite3 和 sqlite3 均不可用，使用 Sequelize 内置内存模式`);
    console.log(`  - better-sqlite3 错误: ${betterSqliteError.message.split('\n')[0]}`);
    console.log(`  - sqlite3 错误: ${sqlite3Error.message.split('\n')[0]}`);
    console.log(`ℹ  如需完整功能，请安装编译工具: xcode-select --install && pnpm add better-sqlite3`);
    
    const initSqlJs = require('sql.js');
    const SQL = await initSqlJs();
    const memoryDb = new SQL.Database();
    
    function hasParams(sql) {
      return sql.indexOf('?') !== -1;
    }
    function cleanParams(params) {
      return params.filter(p => {
        if (typeof p === 'object' && p !== null) {
          return Object.keys(p).length > 0;
        }
        return true;
      });
    }
    const sqljsModule = {
      Database: function databaseWrapper(filename, mode, callback) {
        if (typeof mode === 'function') {
          callback = mode;
          mode = undefined;
        }
        if (callback) {
          setImmediate(() => callback(null, memoryDb));
        }
        memoryDb.configure = function configure() { return memoryDb; };
        memoryDb.serialize = function serialize(cb) { if (cb) cb.call(memoryDb); return memoryDb; };
        memoryDb.run = function run(sql, ...params) {
          let callback = null;
          if (params.length > 0 && typeof params[params.length - 1] === 'function') {
            callback = params.pop();
          }
          const clean = cleanParams(params);
          try {
            const stmt = memoryDb.prepare(sql);
            const result = hasParams(sql) && clean.length > 0 ? stmt.run(clean) : stmt.run();
            const ret = {
              lastID: result.lastInsertRowid,
              changes: result.getRowsModified(),
            };
            if (callback) callback(null, ret);
            return Object.assign(stmt, ret);
          } catch (err) {
            if (callback) callback(err);
            return memoryDb;
          }
        };
        memoryDb.all = function all(sql, ...params) {
          let callback = null;
          if (params.length > 0 && typeof params[params.length - 1] === 'function') {
            callback = params.pop();
          }
          const clean = cleanParams(params);
          try {
            const stmt = memoryDb.prepare(sql);
            if (hasParams(sql) && clean.length > 0) {
              stmt.bind(clean);
            }
            const rows = [];
            while (stmt.step()) {
              rows.push(stmt.getAsObject());
            }
            stmt.free();
            if (callback) callback(null, rows);
            return memoryDb;
          } catch (err) {
            if (callback) callback(err);
            return memoryDb;
          }
        };
        memoryDb.get = function get(sql, ...params) {
          let callback = null;
          if (params.length > 0 && typeof params[params.length - 1] === 'function') {
            callback = params.pop();
          }
          const clean = cleanParams(params);
          try {
            const stmt = memoryDb.prepare(sql);
            if (hasParams(sql) && clean.length > 0) {
              stmt.bind(clean);
            }
            let row = null;
            if (stmt.step()) {
              row = stmt.getAsObject();
            }
            stmt.free();
            if (callback) callback(null, row);
            return memoryDb;
          } catch (err) {
            if (callback) callback(err);
            return memoryDb;
          }
        };
        memoryDb.exec = function exec(sql, callback) {
          try {
            memoryDb.run(sql);
            if (typeof callback === 'function') callback(null);
            return memoryDb;
          } catch (err) {
            if (typeof callback === 'function') callback(err);
            return memoryDb;
          }
        };
        memoryDb.each = function each(sql, ...params) {
          let callback = null;
          let complete = null;
          if (params.length >= 2 && typeof params[params.length - 1] === 'function' && typeof params[params.length - 2] === 'function') {
            complete = params.pop();
            callback = params.pop();
          } else if (params.length >= 1 && typeof params[params.length - 1] === 'function') {
            callback = params.pop();
          }
          const clean = cleanParams(params);
          try {
            const stmt = memoryDb.prepare(sql);
            if (hasParams(sql) && clean.length > 0) {
              stmt.bind(clean);
            }
            let count = 0;
            while (stmt.step()) {
              const row = stmt.getAsObject();
              if (callback) callback(null, row);
              count++;
            }
            stmt.free();
            if (complete) complete(null, count);
            return memoryDb;
          } catch (err) {
            if (callback) callback(err);
            return memoryDb;
          }
        };
        return memoryDb;
      },
    };
    
    sequelize = new Sequelize({
      dialect: 'sqlite',
      dialectModule: sqljsModule,
      storage: ':memory:',
      logging: false,
    });
    
    dbDriver = 'sql.js';
  }
}

export function getDatabaseDriver() {
  return dbDriver;
}

export default sequelize;
