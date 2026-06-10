const { getDb } = require('./connection');
const crypto = require('crypto');

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS _meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('owner', 'technician', 'warehouse')),
  phone TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS farmers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  village TEXT,
  address TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS crop_seasons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS credit_sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  farmer_id INTEGER NOT NULL,
  crop_season_id INTEGER NOT NULL,
  sale_date TEXT NOT NULL,
  total_amount REAL NOT NULL,
  paid_amount REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'partial', 'paid', 'disputed', 'overdue')),
  operator_id INTEGER,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (farmer_id) REFERENCES farmers(id),
  FOREIGN KEY (crop_season_id) REFERENCES crop_seasons(id),
  FOREIGN KEY (operator_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  credit_sale_id INTEGER NOT NULL,
  product_type TEXT NOT NULL CHECK(product_type IN ('fertilizer', 'pesticide', 'seed', 'other')),
  product_name TEXT NOT NULL,
  unit TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL,
  subtotal REAL NOT NULL,
  warehouse_out_confirmed INTEGER NOT NULL DEFAULT 0,
  warehouse_confirmed_by INTEGER,
  warehouse_confirmed_at TEXT,
  FOREIGN KEY (credit_sale_id) REFERENCES credit_sales(id) ON DELETE CASCADE,
  FOREIGN KEY (warehouse_confirmed_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS payment_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  credit_sale_id INTEGER NOT NULL,
  planned_amount REAL NOT NULL,
  planned_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'overdue', 'partial')),
  actual_paid_amount REAL NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (credit_sale_id) REFERENCES credit_sales(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS collection_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  credit_sale_id INTEGER NOT NULL,
  collector_id INTEGER NOT NULL,
  visit_date TEXT NOT NULL,
  visit_type TEXT NOT NULL CHECK(visit_type IN ('phone', 'visit', 'wechat')),
  content TEXT NOT NULL,
  farmer_response TEXT,
  next_action TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (credit_sale_id) REFERENCES credit_sales(id) ON DELETE CASCADE,
  FOREIGN KEY (collector_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS partial_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  credit_sale_id INTEGER NOT NULL,
  payment_plan_id INTEGER,
  amount REAL NOT NULL,
  payment_date TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'transfer', 'wechat', 'alipay', 'other')),
  received_by INTEGER NOT NULL,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (credit_sale_id) REFERENCES credit_sales(id) ON DELETE CASCADE,
  FOREIGN KEY (payment_plan_id) REFERENCES payment_plans(id),
  FOREIGN KEY (received_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS reconciliations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  credit_sale_id INTEGER NOT NULL,
  confirmed_by INTEGER NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('owner', 'technician', 'warehouse')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'disputed')),
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (credit_sale_id) REFERENCES credit_sales(id) ON DELETE CASCADE,
  FOREIGN KEY (confirmed_by) REFERENCES users(id)
);
`;

const SEED_SQL = `
INSERT INTO users (name, role, phone) VALUES
  ('王老板', 'owner', '13800000001'),
  ('李农技', 'technician', '13800000002'),
  ('张仓管', 'warehouse', '13800000003');

INSERT INTO farmers (name, phone, village, address, notes) VALUES
  ('赵秋收', '13900000001', '东河村', '东河村12号', '秋收后还款，信誉良好'),
  ('钱老赖', '13900000002', '西坡村', '西坡村8号', '长期拖欠，需重点关注'),
  ('孙争议', '13900000003', '南沟村', '南沟村5号', '对出库数量有异议，账目争议中');

INSERT INTO crop_seasons (name, start_date, end_date) VALUES
  ('2025年春夏季', '2025-03-01', '2025-08-31'),
  ('2025年秋冬季', '2025-09-01', '2026-02-28'),
  ('2026年春夏季', '2026-03-01', '2026-08-31');

-- ============================================================
-- 场景1: 赵秋收 — 秋收后还款，信誉良好
-- 2026年春夏季赊销，回款计划定在秋收后，尚未到期
-- ============================================================
INSERT INTO credit_sales (farmer_id, crop_season_id, sale_date, total_amount, paid_amount, status, operator_id, notes) VALUES
  (1, 3, '2026-04-15', 3200.00, 0, 'pending', 1, '春耕赊销，约定秋收后还款'),
  (1, 3, '2026-05-20', 1800.00, 0, 'pending', 1, '追肥赊销，约定秋收后还款');

INSERT INTO sale_items (credit_sale_id, product_type, product_name, unit, quantity, unit_price, subtotal) VALUES
  (1, 'fertilizer', '复合肥45%', '袋', 20, 120.00, 2400.00),
  (1, 'seed', '杂交水稻种', '斤', 10, 80.00, 800.00),
  (2, 'fertilizer', '尿素', '袋', 10, 130.00, 1300.00),
  (2, 'pesticide', '草甘膦', '瓶', 5, 100.00, 500.00);

INSERT INTO payment_plans (credit_sale_id, planned_amount, planned_date, status, notes) VALUES
  (1, 3200.00, '2026-10-15', 'pending', '秋收卖粮后还清'),
  (2, 1800.00, '2026-10-31', 'pending', '秋收卖粮后还清');

-- ============================================================
-- 场景2: 钱老赖 — 长期拖欠
-- 2025年春夏季赊销，回款计划全部逾期，仅还500元
-- 赊销单状态: overdue（部分还款但不改变逾期性质）
-- ============================================================
INSERT INTO credit_sales (farmer_id, crop_season_id, sale_date, total_amount, paid_amount, status, operator_id, notes) VALUES
  (2, 1, '2025-03-10', 4500.00, 500.00, 'overdue', 1, '春耕赊销，长期拖欠，仅还500'),
  (2, 1, '2025-04-25', 2800.00, 0, 'overdue', 1, '追肥赊销，长期拖欠，分文未还'),
  (2, 1, '2025-06-01', 1500.00, 0, 'overdue', 1, '农药赊销，长期拖欠，分文未还');

INSERT INTO sale_items (credit_sale_id, product_type, product_name, unit, quantity, unit_price, subtotal) VALUES
  (3, 'fertilizer', '复合肥45%', '袋', 30, 120.00, 3600.00),
  (3, 'seed', '玉米种', '袋', 3, 300.00, 900.00),
  (4, 'fertilizer', '尿素', '袋', 15, 130.00, 1950.00),
  (4, 'pesticide', '吡虫啉', '盒', 10, 85.00, 850.00),
  (5, 'pesticide', '草甘膦', '瓶', 8, 100.00, 800.00),
  (5, 'pesticide', '敌敌畏', '瓶', 7, 100.00, 700.00);

INSERT INTO payment_plans (credit_sale_id, planned_amount, planned_date, status, actual_paid_amount, notes) VALUES
  (3, 4500.00, '2025-06-30', 'overdue', 500.00, '原定6月底还清，仅还500'),
  (4, 2800.00, '2025-07-31', 'overdue', 0, '原定7月底还清，分文未还'),
  (5, 1500.00, '2025-08-31', 'overdue', 0, '原定8月底还清，分文未还');

INSERT INTO collection_records (credit_sale_id, collector_id, visit_date, visit_type, content, farmer_response, next_action) VALUES
  (3, 2, '2025-07-05', 'visit', '上门催收4500元欠款', '手头紧，等卖了猪再说', '9月再上门'),
  (3, 2, '2025-09-10', 'phone', '电话催收，提醒已逾期2个多月', '过几天就来还', '2周后再联系'),
  (4, 2, '2025-08-10', 'visit', '上门催收2800元欠款', '不在家，家属说不知道', '联系本人');

INSERT INTO partial_payments (credit_sale_id, payment_plan_id, amount, payment_date, payment_method, received_by, notes) VALUES
  (3, 3, 500.00, '2025-07-20', 'cash', 1, '钱老赖仅还了500元现金，赊销单仍为overdue');

-- ============================================================
-- 场景3: 孙争议 — 账目争议
-- 2025年春夏季赊销，对出库数量有异议
-- 仓管核对：部分商品已确认出库，部分商品出库记录与农户说法不符
-- 赊销单状态: disputed（争议未解决，部分还款也不会变成partial）
-- ============================================================
INSERT INTO credit_sales (farmer_id, crop_season_id, sale_date, total_amount, paid_amount, status, operator_id, notes) VALUES
  (3, 1, '2025-04-01', 2600.00, 0, 'disputed', 1, '孙争议对出库数量有异议'),
  (3, 1, '2025-05-15', 1200.00, 0, 'disputed', 1, '孙争议称未收到全部商品');

INSERT INTO sale_items (credit_sale_id, product_type, product_name, unit, quantity, unit_price, subtotal, warehouse_out_confirmed) VALUES
  (6, 'fertilizer', '复合肥45%', '袋', 15, 120.00, 1800.00, 1),
  (6, 'pesticide', '草甘膦', '瓶', 4, 100.00, 400.00, 1),
  (6, 'seed', '大豆种', '斤', 10, 40.00, 400.00, 0),
  (7, 'fertilizer', '尿素', '袋', 8, 130.00, 1040.00, 1),
  (7, 'pesticide', '吡虫啉', '盒', 2, 80.00, 160.00, 0);

INSERT INTO payment_plans (credit_sale_id, planned_amount, planned_date, status, notes) VALUES
  (6, 2600.00, '2025-09-30', 'pending', '争议解决后确认还款时间'),
  (7, 1200.00, '2025-10-15', 'pending', '争议解决后确认还款时间');

INSERT INTO reconciliations (credit_sale_id, confirmed_by, role, status, notes) VALUES
  (6, 3, 'warehouse', 'confirmed', '出库明细核对：复合肥15袋、草甘膦4瓶已确认出库'),
  (6, 3, 'warehouse', 'disputed', '大豆种10斤出库记录缺失，需进一步核实'),
  (7, 3, 'warehouse', 'confirmed', '尿素8袋已确认出库'),
  (7, 3, 'warehouse', 'disputed', '吡虫啉2盒出库记录与系统不符，农户称未收到');

INSERT INTO collection_records (credit_sale_id, collector_id, visit_date, visit_type, content, farmer_response, next_action) VALUES
  (6, 2, '2025-08-20', 'visit', '上门沟通争议账目', '大豆种只拿了5斤不是10斤，草甘膦只拿了3瓶', '调取仓库出库记录对比');
`;

const TABLES = [
  'reconciliations',
  'partial_payments',
  'collection_records',
  'payment_plans',
  'sale_items',
  'credit_sales',
  'crop_seasons',
  'farmers',
  'users',
  '_meta'
];

function computeSeedHash() {
  return crypto.createHash('sha256').update(SEED_SQL).digest('hex').slice(0, 16);
}

function rebuildDatabase() {
  const db = getDb();
  db.pragma('foreign_keys = OFF');

  const dropAndRebuild = db.transaction(() => {
    for (const t of TABLES) {
      db.exec(`DROP TABLE IF EXISTS ${t}`);
    }
    db.exec(SCHEMA_SQL);
    db.exec(SEED_SQL);
    db.prepare("INSERT INTO _meta (key, value) VALUES ('seed_hash', ?)").run(computeSeedHash());
  });

  try {
    dropAndRebuild();
    console.log('数据库已重建：清除脏数据，重新建表并插入种子数据');
  } catch (e) {
    console.error('数据库重建失败:', e.message);
    throw e;
  } finally {
    db.pragma('foreign_keys = ON');
  }
}

function verifySeedIntegrity(db) {
  const EXPECTED = {
    1: { farmer: '赵秋收', sales: [{ status: 'pending', paid: 0 }, { status: 'pending', paid: 0 }] },
    2: { farmer: '钱老赖', sales: [{ status: 'overdue', paid: 500 }, { status: 'overdue', paid: 0 }, { status: 'overdue', paid: 0 }] },
    3: { farmer: '孙争议', sales: [{ status: 'disputed', paid: 0 }, { status: 'disputed', paid: 0 }] }
  };

  for (const [farmerId, expected] of Object.entries(EXPECTED)) {
    const farmer = db.prepare('SELECT name FROM farmers WHERE id = ?').get(farmerId);
    if (!farmer || farmer.name !== expected.farmer) return false;

    const sales = db.prepare(
      'SELECT status, paid_amount FROM credit_sales WHERE farmer_id = ? ORDER BY id'
    ).all(farmerId);

    if (sales.length !== expected.sales.length) return false;
    for (let i = 0; i < sales.length; i++) {
      if (sales[i].status !== expected.sales[i].status) return false;
      if (sales[i].paid_amount !== expected.sales[i].paid) return false;
    }
  }

  const paymentCount = db.prepare('SELECT COUNT(*) as cnt FROM partial_payments').get().cnt;
  if (paymentCount !== 1) return false;

  return true;
}

function initDatabase() {
  const db = getDb();
  db.exec(SCHEMA_SQL);

  const storedHash = db.prepare("SELECT value FROM _meta WHERE key = 'seed_hash'").get();
  const currentHash = computeSeedHash();

  if (storedHash && storedHash.value === currentHash) {
    if (verifySeedIntegrity(db)) {
      console.log('种子数据完整，跳过初始化');
      return;
    }
    console.warn('种子数据被篡改，自动重建数据库');
    rebuildDatabase();
    return;
  }

  if (storedHash && storedHash.value !== currentHash) {
    console.warn('种子数据版本变更，自动重建数据库');
    rebuildDatabase();
    return;
  }

  rebuildDatabase();
}

if (require.main === module) {
  initDatabase();
  console.log('数据库初始化完成');
}

module.exports = { initDatabase, rebuildDatabase, SCHEMA_SQL, SEED_SQL };
