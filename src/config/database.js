import { Sequelize } from 'sequelize';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getConfig() {
  const isTest = process.env.NODE_ENV === 'test';
  return {
    isTest,
    storagePath: isTest ? ':memory:' : join(__dirname, '../../data.sqlite'),
    logging: isTest ? false : console.log,
  };
}

function createBetterSqlite3Wrapper(BetterSQLite3) {
  return {
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
}

async function createSqljsWrapper() {
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();
  const memoryDb = new SQL.Database();
  
  function convertNamedParams(sql, params) {
    let convertedSql = sql;
    const convertedParams = [];
    const paramMap = {};
    
    if (params.length === 1 && typeof params[0] === 'object' && params[0] !== null && !Array.isArray(params[0])) {
      const namedParams = params[0];
      if (Object.keys(namedParams).length > 0) {
        convertedSql = sql.replace(/\$(\d+)/g, (match, num) => {
          const key = `$${num}`;
          if (key in namedParams) {
            if (!(key in paramMap)) {
              paramMap[key] = convertedParams.length;
              convertedParams.push(namedParams[key]);
            }
            return `?${paramMap[key] + 1}`;
          }
          return match;
        });
      }
    } else if (params.length > 0) {
      for (const p of params) {
        if (typeof p === 'object' && p !== null && Object.keys(p).length === 0) {
          continue;
        }
        convertedParams.push(p);
      }
    }
    
    return { sql: convertedSql, params: convertedParams };
  }
  
  return {
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
        try {
          const { sql: convertedSql, params: convertedParams } = convertNamedParams(sql, params);
          const stmt = memoryDb.prepare(convertedSql);
          const result = convertedParams.length > 0 ? stmt.run(convertedParams) : stmt.run();
          const lastID = result.lastInsertRowid;
          const changes = memoryDb.getRowsModified();
          if (callback) {
            const resultObj = { lastID, changes };
            callback.call(resultObj, null);
          }
          return Object.assign(stmt, { lastID, changes });
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
        try {
          const { sql: convertedSql, params: convertedParams } = convertNamedParams(sql, params);
          const stmt = memoryDb.prepare(convertedSql);
          if (convertedParams.length > 0 && convertedSql.indexOf('?') !== -1) {
            stmt.bind(convertedParams);
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
        try {
          const { sql: convertedSql, params: convertedParams } = convertNamedParams(sql, params);
          const stmt = memoryDb.prepare(convertedSql);
          if (convertedParams.length > 0 && convertedSql.indexOf('?') !== -1) {
            stmt.bind(convertedParams);
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
        try {
          const { sql: convertedSql, params: convertedParams } = convertNamedParams(sql, params);
          const stmt = memoryDb.prepare(convertedSql);
          if (convertedParams.length > 0 && convertedSql.indexOf('?') !== -1) {
            stmt.bind(convertedParams);
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
}

function testBetterSqlite3Binding() {
  const BetterSQLite3 = require('better-sqlite3');
  const testDb = new BetterSQLite3(':memory:');
  testDb.exec('SELECT 1');
  testDb.close();
  return BetterSQLite3;
}

async function testSqlite3Binding() {
  const sqlite3 = require('sqlite3');
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(':memory:', (err) => {
      if (err) {
        reject(err);
        return;
      }
      db.get('SELECT 1', (err) => {
        db.close();
        if (err) reject(err);
        else resolve(sqlite3);
      });
    });
  });
}

let dbDriver = 'initializing';
let initPromise = null;
let initialized = false;

const config = getConfig();

let sequelize;
let currentDialectModule = null;

try {
  const BetterSQLite3 = require('better-sqlite3');
  currentDialectModule = createBetterSqlite3Wrapper(BetterSQLite3);
  dbDriver = 'better-sqlite3 (pending binding check)';
  sequelize = new Sequelize({
    dialect: 'sqlite',
    dialectModule: currentDialectModule,
    storage: config.storagePath,
    logging: config.logging,
  });
} catch (e) {
  try {
    require('sqlite3');
    dbDriver = 'sqlite3 (pending binding check)';
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: config.storagePath,
      logging: config.logging,
    });
  } catch (e2) {
    dbDriver = 'sql.js (pending init)';
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false,
    });
  }
}

async function tryInitializeWithFallback() {
  const errors = [];
  
  try {
    testBetterSqlite3Binding();
    dbDriver = 'better-sqlite3';
    console.log('✓ 使用 better-sqlite3 原生驱动');
    return;
  } catch (err) {
    errors.push({ driver: 'better-sqlite3', error: err });
  }
  
  try {
    await testSqlite3Binding();
    dbDriver = 'sqlite3';
    console.log('✓ 使用 sqlite3 原生驱动');
    return;
  } catch (err) {
    errors.push({ driver: 'sqlite3', error: err });
  }
  
  try {
    const dialectModule = await createSqljsWrapper();
    sequelize.options.dialectModule = dialectModule;
    sequelize.config.dialectModule = dialectModule;
    sequelize.dialect.connectionManager.lib = dialectModule;
    
    if (sequelize.connectionManager) {
      sequelize.connectionManager.lib = dialectModule;
    }
    
    dbDriver = 'sql.js';
    console.log('ℹ  better-sqlite3 和 sqlite3 均不可用，使用 Sequelize 内置内存模式');
    errors.forEach(({ driver, error }) => {
      console.log(`  - ${driver} 错误: ${error.message.split('\n')[0]}`);
    });
    console.log('ℹ  如需完整功能，请安装编译工具: xcode-select --install && pnpm add better-sqlite3');
    return;
  } catch (err) {
    errors.push({ driver: 'sql.js', error: err });
    throw new Error(`所有数据库驱动均不可用: ${errors.map(e => `${e.driver}: ${e.error.message}`).join('; ')}`);
  }
}

export async function initDatabase() {
  if (initialized) {
    return sequelize;
  }
  if (initPromise) {
    return initPromise;
  }
  initPromise = (async () => {
    try {
      await tryInitializeWithFallback();
      initialized = true;
      return sequelize;
    } finally {
      initPromise = null;
    }
  })();
  return initPromise;
}

const originalAuthenticate = sequelize.authenticate.bind(sequelize);
sequelize.authenticate = async function authenticate(options) {
  if (!initialized) {
    await initDatabase();
  }
  try {
    return await originalAuthenticate(options);
  } catch (err) {
    if (!initialized || err.message.includes('binding') || err.message.includes('Could not locate')) {
      await initDatabase();
      return await originalAuthenticate(options);
    }
    throw err;
  }
};

const originalSync = sequelize.sync.bind(sequelize);
sequelize.sync = async function sync(options) {
  if (!initialized) {
    await initDatabase();
  }
  return originalSync(options);
};

export function getDatabaseDriver() {
  return dbDriver;
}

export function isDatabaseInitialized() {
  return initialized;
}

export { getConfig };

export default sequelize;
