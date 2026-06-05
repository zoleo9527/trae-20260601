const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DB_DIR, 'flower_delivery.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const INIT_SQL = `
CREATE TABLE IF NOT EXISTS handlers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('花艺师', '配送调度', '售后客服')),
  phone TEXT DEFAULT '',
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT DEFAULT '',
  flower_type TEXT DEFAULT '',
  arrangement_style TEXT DEFAULT '',
  delivery_address TEXT DEFAULT '',
  expected_delivery_time TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT '待制作' CHECK(status IN ('待制作','制作中','待派单','已派单','配送中','已送达待签收','已签收','退回','补材料','已关闭')),
  florist_id INTEGER,
  remarks TEXT DEFAULT '',
  source TEXT DEFAULT '现场' CHECK(source IN ('现场','线上','电话','旧台账')),
  created_at TEXT DEFAULT (datetime('now','localtime')),
  updated_at TEXT DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (florist_id) REFERENCES handlers(id)
);

CREATE TABLE IF NOT EXISTS dispatches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  dispatcher_id INTEGER NOT NULL,
  courier_name TEXT DEFAULT '',
  courier_phone TEXT DEFAULT '',
  dispatch_time TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT '待派单' CHECK(status IN ('待派单','已派单','配送中','已送达待签收','退回','异常')),
  stuck_reason TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now','localtime')),
  updated_at TEXT DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (dispatcher_id) REFERENCES handlers(id)
);

CREATE TABLE IF NOT EXISTS signatures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dispatch_id INTEGER NOT NULL,
  signed_by TEXT DEFAULT '',
  signed_at TEXT DEFAULT '',
  signature_data TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT '待签收' CHECK(status IN ('待签收','已签收','退回','补材料')),
  return_reason TEXT DEFAULT '',
  supplement_desc TEXT DEFAULT '',
  exception_id INTEGER,
  handover_log_id INTEGER,
  remarks TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now','localtime')),
  updated_at TEXT DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (dispatch_id) REFERENCES dispatches(id),
  FOREIGN KEY (exception_id) REFERENCES exceptions(id),
  FOREIGN KEY (handover_log_id) REFERENCES handover_logs(id)
);

CREATE TABLE IF NOT EXISTS exceptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  handler_id INTEGER,
  type TEXT NOT NULL CHECK(type IN ('催','退回','补材料')),
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT '未处理' CHECK(status IN ('未处理','处理中','已解决')),
  created_at TEXT DEFAULT (datetime('now','localtime')),
  resolved_at TEXT DEFAULT '',
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (handler_id) REFERENCES handlers(id)
);

CREATE TABLE IF NOT EXISTS handover_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  from_handler_id INTEGER,
  to_handler_id INTEGER,
  from_stage TEXT DEFAULT '',
  to_stage TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (from_handler_id) REFERENCES handlers(id),
  FOREIGN KEY (to_handler_id) REFERENCES handlers(id)
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_florist ON orders(florist_id);
CREATE INDEX IF NOT EXISTS idx_dispatches_order ON dispatches(order_id);
CREATE INDEX IF NOT EXISTS idx_dispatches_status ON dispatches(status);
CREATE INDEX IF NOT EXISTS idx_signatures_dispatch ON signatures(dispatch_id);
CREATE INDEX IF NOT EXISTS idx_signatures_status ON signatures(status);
CREATE INDEX IF NOT EXISTS idx_exceptions_order ON exceptions(order_id);
CREATE INDEX IF NOT EXISTS idx_exceptions_type ON exceptions(type);
CREATE INDEX IF NOT EXISTS idx_exceptions_status ON exceptions(status);
CREATE INDEX IF NOT EXISTS idx_handover_order ON handover_logs(order_id);
`;

db.exec(INIT_SQL);

function migrateDatabase() {
  const cols = db.prepare("PRAGMA table_info(signatures)").all().map(c => c.name);
  if (!cols.includes('exception_id')) {
    db.exec('ALTER TABLE signatures ADD COLUMN exception_id INTEGER REFERENCES exceptions(id)');
  }
  if (!cols.includes('handover_log_id')) {
    db.exec('ALTER TABLE signatures ADD COLUMN handover_log_id INTEGER REFERENCES handover_logs(id)');
  }
}

migrateDatabase();

function seedHandlers() {
  const count = db.prepare('SELECT COUNT(*) AS cnt FROM handlers').get().cnt;
  if (count > 0) return;
  const insert = db.prepare('INSERT INTO handlers (name, role, phone) VALUES (?, ?, ?)');
  const seed = [
    ['张花艺', '花艺师', '13800000001'],
    ['李花艺', '花艺师', '13800000002'],
    ['王调度', '配送调度', '13800000003'],
    ['赵调度', '配送调度', '13800000004'],
    ['钱客服', '售后客服', '13800000005'],
    ['孙客服', '售后客服', '13800000006'],
  ];
  const tx = db.transaction(() => {
    for (const [n, r, p] of seed) insert.run(n, r, p);
  });
  tx();
}

seedHandlers();

function getHandlers(role) {
  if (role) return db.prepare('SELECT * FROM handlers WHERE role = ? AND is_active = 1').all(role);
  return db.prepare('SELECT * FROM handlers WHERE is_active = 1').all();
}

function createOrder(o) {
  const sql = `INSERT INTO orders (order_no, customer_name, customer_phone, flower_type, arrangement_style, delivery_address, expected_delivery_time, status, florist_id, remarks, source)
    VALUES (@order_no, @customer_name, @customer_phone, @flower_type, @arrangement_style, @delivery_address, @expected_delivery_time, @status, @florist_id, @remarks, @source)`;
  return db.prepare(sql).run(o);
}

function updateOrder(id, fields) {
  const sets = [];
  const vals = {};
  for (const [k, v] of Object.entries(fields)) {
    sets.push(`${k} = @${k}`);
    vals[k] = v;
  }
  sets.push("updated_at = datetime('now','localtime')");
  vals.id = id;
  return db.prepare(`UPDATE orders SET ${sets.join(', ')} WHERE id = @id`).run(vals);
}

function getOrders(filter) {
  let sql = `SELECT o.*, h.name AS florist_name FROM orders o LEFT JOIN handlers h ON o.florist_id = h.id WHERE 1=1`;
  const params = {};
  if (filter.status) { sql += ' AND o.status = @status'; params.status = filter.status; }
  if (filter.florist_id) { sql += ' AND o.florist_id = @florist_id'; params.florist_id = filter.florist_id; }
  if (filter.keyword) {
    sql += ' AND (o.order_no LIKE @kw OR o.customer_name LIKE @kw OR o.customer_phone LIKE @kw)';
    params.kw = `%${filter.keyword}%`;
  }
  if (filter.source) { sql += ' AND o.source = @source'; params.source = filter.source; }
  sql += ' ORDER BY o.created_at DESC';
  if (filter.limit) { sql += ' LIMIT @limit'; params.limit = filter.limit; }
  return db.prepare(sql).all(params);
}

function getOrderById(id) {
  return db.prepare('SELECT o.*, h.name AS florist_name FROM orders o LEFT JOIN handlers h ON o.florist_id = h.id WHERE o.id = ?').get(id);
}

function createDispatch(d) {
  const sql = `INSERT INTO dispatches (order_id, dispatcher_id, courier_name, courier_phone, dispatch_time, status, stuck_reason, notes)
    VALUES (@order_id, @dispatcher_id, @courier_name, @courier_phone, @dispatch_time, @status, @stuck_reason, @notes)`;
  return db.prepare(sql).run(d);
}

function updateDispatch(id, fields) {
  const sets = [];
  const vals = {};
  for (const [k, v] of Object.entries(fields)) {
    sets.push(`${k} = @${k}`);
    vals[k] = v;
  }
  sets.push("updated_at = datetime('now','localtime')");
  vals.id = id;
  return db.prepare(`UPDATE dispatches SET ${sets.join(', ')} WHERE id = @id`).run(vals);
}

function getDispatchesByOrder(orderId) {
  return db.prepare('SELECT d.*, h.name AS dispatcher_name FROM dispatches d LEFT JOIN handlers h ON d.dispatcher_id = h.id WHERE d.order_id = ? ORDER BY d.created_at DESC').all(orderId);
}

function getDispatches(filter) {
  let sql = `SELECT d.*, o.order_no, o.customer_name, o.expected_delivery_time, h.name AS dispatcher_name
    FROM dispatches d
    JOIN orders o ON d.order_id = o.id
    LEFT JOIN handlers h ON d.dispatcher_id = h.id WHERE 1=1`;
  const params = {};
  if (filter.status) { sql += ' AND d.status = @status'; params.status = filter.status; }
  if (filter.dispatcher_id) { sql += ' AND d.dispatcher_id = @dispatcher_id'; params.dispatcher_id = filter.dispatcher_id; }
  sql += ' ORDER BY d.created_at DESC';
  return db.prepare(sql).all(params);
}

function createSignature(s) {
  const sql = `INSERT INTO signatures (dispatch_id, signed_by, signed_at, signature_data, status, return_reason, supplement_desc, exception_id, handover_log_id, remarks)
    VALUES (@dispatch_id, @signed_by, @signed_at, @signature_data, @status, @return_reason, @supplement_desc, @exception_id, @handover_log_id, @remarks)`;
  return db.prepare(sql).run(s);
}

function updateSignature(id, fields) {
  const sets = [];
  const vals = {};
  for (const [k, v] of Object.entries(fields)) {
    sets.push(`${k} = @${k}`);
    vals[k] = v;
  }
  sets.push("updated_at = datetime('now','localtime')");
  vals.id = id;
  return db.prepare(`UPDATE signatures SET ${sets.join(', ')} WHERE id = @id`).run(vals);
}

function getSignaturesByDispatch(dispatchId) {
  return db.prepare('SELECT * FROM signatures WHERE dispatch_id = ? ORDER BY created_at DESC').all(dispatchId);
}

function getSignatureById(id) {
  return db.prepare('SELECT * FROM signatures WHERE id = ?').get(id);
}

function getSignatures(filter) {
  let sql = `SELECT s.*, d.courier_name, d.order_id, o.order_no, o.customer_name, o.expected_delivery_time
    FROM signatures s
    JOIN dispatches d ON s.dispatch_id = d.id
    JOIN orders o ON d.order_id = o.id WHERE 1=1`;
  const params = {};
  if (filter.status) { sql += ' AND s.status = @status'; params.status = filter.status; }
  sql += ' ORDER BY s.created_at DESC';
  return db.prepare(sql).all(params);
}

function createException(e) {
  const sql = `INSERT INTO exceptions (order_id, handler_id, type, description, status)
    VALUES (@order_id, @handler_id, @type, @description, @status)`;
  return db.prepare(sql).run(e);
}

function updateException(id, fields) {
  const sets = [];
  const vals = {};
  for (const [k, v] of Object.entries(fields)) {
    sets.push(`${k} = @${k}`);
    vals[k] = v;
  }
  vals.id = id;
  return db.prepare(`UPDATE exceptions SET ${sets.join(', ')} WHERE id = @id`).run(vals);
}

function getExceptionById(id) {
  return db.prepare(`SELECT e.*, o.order_no, o.customer_name, h.name AS handler_name
    FROM exceptions e
    JOIN orders o ON e.order_id = o.id
    LEFT JOIN handlers h ON e.handler_id = h.id WHERE e.id = ?`).get(id);
}

function getExceptions(filter) {
  let sql = `SELECT e.*, o.order_no, o.customer_name, h.name AS handler_name
    FROM exceptions e
    JOIN orders o ON e.order_id = o.id
    LEFT JOIN handlers h ON e.handler_id = h.id WHERE 1=1`;
  const params = {};
  if (filter.status) { sql += ' AND e.status = @status'; params.status = filter.status; }
  if (filter.type) { sql += ' AND e.type = @type'; params.type = filter.type; }
  if (filter.order_id) { sql += ' AND e.order_id = @order_id'; params.order_id = filter.order_id; }
  sql += ' ORDER BY e.created_at DESC';
  return db.prepare(sql).all(params);
}

function createHandoverLog(l) {
  const sql = `INSERT INTO handover_logs (order_id, from_handler_id, to_handler_id, from_stage, to_stage, notes)
    VALUES (@order_id, @from_handler_id, @to_handler_id, @from_stage, @to_stage, @notes)`;
  return db.prepare(sql).run(l);
}

function updateHandoverLog(id, fields) {
  const sets = [];
  const vals = {};
  for (const [k, v] of Object.entries(fields)) {
    sets.push(`${k} = @${k}`);
    vals[k] = v;
  }
  vals.id = id;
  return db.prepare(`UPDATE handover_logs SET ${sets.join(', ')} WHERE id = @id`).run(vals);
}

function getHandoverLogs(orderId) {
  return db.prepare(`SELECT hl.*, fh.name AS from_handler_name, th.name AS to_handler_name
    FROM handover_logs hl
    LEFT JOIN handlers fh ON hl.from_handler_id = fh.id
    LEFT JOIN handlers th ON hl.to_handler_id = th.id
    WHERE hl.order_id = ? ORDER BY hl.created_at ASC`).all(orderId);
}

function getDashboardStats() {
  const orderStats = db.prepare(`SELECT status, COUNT(*) AS cnt FROM orders GROUP BY status`).all();
  const exceptionStats = db.prepare(`SELECT type, status AS estatus, COUNT(*) AS cnt FROM exceptions GROUP BY type, status`).all();
  const dispatchStuck = db.prepare(`SELECT d.stuck_reason, COUNT(*) AS cnt FROM dispatches d WHERE d.status IN ('待派单','异常') GROUP BY d.stuck_reason`).all();
  const signaturePending = db.prepare(`SELECT s.status, COUNT(*) AS cnt FROM signatures s WHERE s.status IN ('待签收','退回','补材料') GROUP BY s.status`).all();
  const urgentOrders = db.prepare(`SELECT o.id, o.order_no, o.customer_name, o.expected_delivery_time, o.status
    FROM orders o
    JOIN exceptions e ON e.order_id = o.id AND e.type = '催' AND e.status != '已解决'
    GROUP BY o.id ORDER BY o.expected_delivery_time ASC`).all();
  return { orderStats, exceptionStats, dispatchStuck, signaturePending, urgentOrders };
}

function getOrderFullDetail(orderId) {
  const order = getOrderById(orderId);
  if (!order) return null;
  const dispatches = db.prepare(`SELECT d.*, h.name AS dispatcher_name FROM dispatches d LEFT JOIN handlers h ON d.dispatcher_id = h.id WHERE d.order_id = ? ORDER BY d.created_at DESC`).all(orderId);
  const exceptions = db.prepare(`SELECT e.*, h.name AS handler_name FROM exceptions e LEFT JOIN handlers h ON e.handler_id = h.id WHERE e.order_id = ? ORDER BY e.created_at DESC`).all(orderId);
  const handovers = getHandoverLogs(orderId);
  const allSigs = [];
  for (const d of dispatches) {
    const sigs = getSignaturesByDispatch(d.id);
    allSigs.push({ dispatch: d, signatures: sigs });
  }
  return { order, dispatches, exceptions, handovers, signatureFlow: allSigs };
}

module.exports = {
  db,
  getHandlers,
  createOrder, updateOrder, getOrders, getOrderById,
  createDispatch, updateDispatch, getDispatchesByOrder, getDispatches,
  createSignature, updateSignature, getSignaturesByDispatch, getSignatureById, getSignatures,
  createException, updateException, getExceptionById, getExceptions,
  createHandoverLog, updateHandoverLog, getHandoverLogs,
  getDashboardStats, getOrderFullDetail,
};
