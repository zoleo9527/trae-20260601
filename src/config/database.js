import { Sequelize } from 'sequelize';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isTest = process.env.NODE_ENV === 'test';

let sequelize;

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
    storage: isTest ? ':memory:' : join(__dirname, '../../data.sqlite'),
    logging: isTest ? false : console.log,
  });
  
  console.log('✓ 使用 better-sqlite3 原生驱动');
} catch (e) {
  console.log(`ℹ  better-sqlite3 不可用，使用纯内存模式进行验证: ${e.message.split('\n')[0]}`);
  
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
  });
}

export default sequelize;
