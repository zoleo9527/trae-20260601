import Database from 'better-sqlite3'
import path from 'path'

let db: Database.Database | null = null

export function getDB(): Database.Database {
  if (db) return db
  const dbPath = path.join(process.cwd(), 'data.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  try {
    initTables(db)
    seedData(db)
  } catch (e) {
    console.error('DB init error, recreating:', e)
    db.close()
    try { require('fs').unlinkSync(dbPath) } catch {}
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    initTables(db)
    seedData(db)
  }
  return db
}

function initTables(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS outbound_orders (
      id TEXT PRIMARY KEY,
      order_no TEXT UNIQUE NOT NULL,
      customer_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_qual_expiry TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending_submit',
      submitted_by TEXT,
      submitted_at TEXT,
      reviewed_by TEXT,
      reviewed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS outbound_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES outbound_orders(id),
      consumable_name TEXT NOT NULL,
      batch_no TEXT NOT NULL,
      production_date TEXT NOT NULL,
      expiry_date TEXT NOT NULL,
      stock_qty INTEGER NOT NULL,
      outbound_qty INTEGER NOT NULL,
      review_status TEXT NOT NULL DEFAULT 'pending',
      abnormal_type TEXT,
      abnormal_note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS timeline_entries (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES outbound_orders(id),
      action TEXT NOT NULL,
      operator TEXT NOT NULL,
      operator_role TEXT NOT NULL,
      detail TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS review_snapshots (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES outbound_orders(id),
      reviewed_by TEXT NOT NULL,
      reviewed_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS review_snapshot_items (
      id TEXT PRIMARY KEY,
      snapshot_id TEXT NOT NULL REFERENCES review_snapshots(id),
      item_id TEXT NOT NULL REFERENCES outbound_items(id),
      consumable_name TEXT NOT NULL,
      batch_no TEXT NOT NULL,
      result TEXT NOT NULL,
      abnormal_type TEXT,
      abnormal_note TEXT
    );

    CREATE TABLE IF NOT EXISTS batch_issues (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES outbound_orders(id),
      item_id TEXT NOT NULL REFERENCES outbound_items(id),
      abnormal_type TEXT NOT NULL,
      abnormal_note TEXT NOT NULL,
      process_status TEXT NOT NULL DEFAULT 'pending',
      process_result TEXT,
      process_note TEXT,
      processed_by TEXT,
      processed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS idempotency_keys (
      key TEXT PRIMARY KEY,
      response_body TEXT NOT NULL,
      status_code INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_outbound_orders_status ON outbound_orders(status);
    CREATE INDEX IF NOT EXISTS idx_outbound_items_order_id ON outbound_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_timeline_entries_order_id ON timeline_entries(order_id);
    CREATE INDEX IF NOT EXISTS idx_review_snapshots_order_id ON review_snapshots(order_id);
    CREATE INDEX IF NOT EXISTS idx_batch_issues_process_status ON batch_issues(process_status);
    CREATE INDEX IF NOT EXISTS idx_batch_issues_order_id ON batch_issues(order_id);
  `)
}

function seedData(db: Database.Database): void {
  const count = (db.prepare('SELECT COUNT(*) as cnt FROM outbound_orders').get() as { cnt: number }).cnt
  if (count > 0) return

  const insertOrder = db.prepare(`
    INSERT INTO outbound_orders (id, order_no, customer_id, customer_name, customer_qual_expiry, status, submitted_by, submitted_at, reviewed_by, reviewed_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertItem = db.prepare(`
    INSERT INTO outbound_items (id, order_id, consumable_name, batch_no, production_date, expiry_date, stock_qty, outbound_qty, review_status, abnormal_type, abnormal_note, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertTimeline = db.prepare(`
    INSERT INTO timeline_entries (id, order_id, action, operator, operator_role, detail, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const insertSnapshot = db.prepare(`
    INSERT INTO review_snapshots (id, order_id, reviewed_by, reviewed_at)
    VALUES (?, ?, ?, ?)
  `)

  const insertSnapshotItem = db.prepare(`
    INSERT INTO review_snapshot_items (id, snapshot_id, item_id, consumable_name, batch_no, result, abnormal_type, abnormal_note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertBatchIssue = db.prepare(`
    INSERT INTO batch_issues (id, order_id, item_id, abnormal_type, abnormal_note, process_status, process_result, process_note, processed_by, processed_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const transaction = db.transaction(() => {
    insertOrder.run(
      'ord-001', 'CK-2026-001', 'cust-001', '瑞尔齿科朝阳分院', '2027-03-15',
      'completed', '张丽', '2026-06-01T09:30:00.000Z', '王强', '2026-06-01T10:15:00.000Z',
      '2026-06-01T09:00:00.000Z', '2026-06-01T10:30:00.000Z'
    )
    insertItem.run(
      'item-001', 'ord-001', '光固化树脂', 'B20260301', '2026-03-01', '2027-03-01',
      100, 20, 'normal', null, null, '2026-06-01T09:00:00.000Z'
    )
    insertItem.run(
      'item-002', 'ord-001', '玻璃离子水门汀', 'B20260215', '2026-02-15', '2028-02-15',
      50, 10, 'normal', null, null, '2026-06-01T09:00:00.000Z'
    )
    insertTimeline.run(
      'tl-001', 'ord-001', 'create', '系统', '系统',
      '创建出库单 CK-2026-001，客户：瑞尔齿科朝阳分院',
      '2026-06-01T09:00:00.000Z'
    )
    insertTimeline.run(
      'tl-002', 'ord-001', 'submit', '张丽', '销售内勤',
      '销售内勤张丽提交出库单，客户资质有效期至2027-03-15，资质正常',
      '2026-06-01T09:30:00.000Z'
    )
    insertTimeline.run(
      'tl-003', 'ord-001', 'start_review', '王强', '仓库员',
      '仓库员王强开始复核出库单',
      '2026-06-01T10:00:00.000Z'
    )
    insertTimeline.run(
      'tl-004', 'ord-001', 'complete_review', '王强', '仓库员',
      '复核完成，全部耗材批号正常，出库单已完成',
      '2026-06-01T10:15:00.000Z'
    )
    insertTimeline.run(
      'tl-005', 'ord-001', 'complete', '王强', '仓库员',
      '出库完成，2项耗材全部正常出库',
      '2026-06-01T10:30:00.000Z'
    )
    insertSnapshot.run(
      'snap-001', 'ord-001', '王强', '2026-06-01T10:15:00.000Z'
    )
    insertSnapshotItem.run(
      'si-001', 'snap-001', 'item-001', '光固化树脂', 'B20260301', 'normal', null, null
    )
    insertSnapshotItem.run(
      'si-002', 'snap-001', 'item-002', '玻璃离子水门汀', 'B20260215', 'normal', null, null
    )

    insertOrder.run(
      'ord-002', 'CK-2026-002', 'cust-002', '拜博口腔海淀店', '2026-06-20',
      'has_issue', '张丽', '2026-06-02T10:00:00.000Z', '王强', '2026-06-02T11:00:00.000Z',
      '2026-06-02T09:30:00.000Z', '2026-06-02T14:30:00.000Z'
    )
    insertItem.run(
      'item-003', 'ord-002', '牙科印模材', 'B20260110', '2026-01-10', '2026-08-15',
      80, 15, 'abnormal', 'near_expiry', '耗材临近有效期，距过期仅64天',
      '2026-06-02T09:30:00.000Z'
    )
    insertItem.run(
      'item-004', 'ord-002', '根管锉', 'B20260401', '2026-04-01', '2027-04-01',
      200, 30, 'normal', null, null, '2026-06-02T09:30:00.000Z'
    )
    insertItem.run(
      'item-005', 'ord-002', '复合树脂', 'B20250901', '2025-09-01', '2026-05-01',
      60, 10, 'abnormal', 'expired', '耗材已过期32天，不可出库',
      '2026-06-02T09:30:00.000Z'
    )
    insertTimeline.run(
      'tl-006', 'ord-002', 'create', '系统', '系统',
      '创建出库单 CK-2026-002，客户：拜博口腔海淀店',
      '2026-06-02T09:30:00.000Z'
    )
    insertTimeline.run(
      'tl-007', 'ord-002', 'submit', '张丽', '销售内勤',
      '销售内勤张丽提交出库单，系统警告：客户资质即将过期（2026-06-20，剩余18天），牙科印模材(B20260110)临期预警',
      '2026-06-02T10:00:00.000Z'
    )
    insertTimeline.run(
      'tl-008', 'ord-002', 'start_review', '王强', '仓库员',
      '仓库员王强开始复核出库单',
      '2026-06-02T10:30:00.000Z'
    )
    insertTimeline.run(
      'tl-009', 'ord-002', 'review_abnormal', '王强', '仓库员',
      '复核发现异常：复合树脂(B20250901)已过期，牙科印模材(B20260110)临期，出库单标记为异常',
      '2026-06-02T11:00:00.000Z'
    )
    insertTimeline.run(
      'tl-010', 'ord-002', 'process_issue', '李敏', '售后',
      '售后李敏处理异常：复合树脂(B20250901)已过期→退货处理；牙科印模材(B20260110)临期→特批放行',
      '2026-06-02T14:00:00.000Z'
    )
    insertTimeline.run(
      'tl-011', 'ord-002', 'issue_processed', '李敏', '售后',
      '所有批号异常已处理完成，出库单状态更新为异常已处理',
      '2026-06-02T14:30:00.000Z'
    )
    insertSnapshot.run(
      'snap-002', 'ord-002', '王强', '2026-06-02T11:00:00.000Z'
    )
    insertSnapshotItem.run(
      'si-003', 'snap-002', 'item-003', '牙科印模材', 'B20260110', 'abnormal', 'near_expiry', '耗材临近有效期，距过期仅64天'
    )
    insertSnapshotItem.run(
      'si-004', 'snap-002', 'item-004', '根管锉', 'B20260401', 'normal', null, null
    )
    insertSnapshotItem.run(
      'si-005', 'snap-002', 'item-005', '复合树脂', 'B20250901', 'abnormal', 'expired', '耗材已过期32天，不可出库'
    )
    insertBatchIssue.run(
      'bi-001', 'ord-002', 'item-005', 'expired', '复合树脂(B20250901)已过期，有效期至2026-05-01',
      'processed', 'return', '已过期耗材安排退货处理', '李敏', '2026-06-02T14:00:00.000Z',
      '2026-06-02T11:00:00.000Z'
    )
    insertBatchIssue.run(
      'bi-002', 'ord-002', 'item-003', 'near_expiry', '牙科印模材(B20260110)临期，有效期至2026-08-15，距过期仅64天',
      'processed', 'special_approval', '临期耗材经主管特批放行', '李敏', '2026-06-02T14:30:00.000Z',
      '2026-06-02T11:00:00.000Z'
    )

    insertOrder.run(
      'ord-003', 'CK-2026-003', 'cust-003', '佳美口腔西直门店', '2028-12-31',
      'pending_review', '张丽', '2026-06-03T10:30:00.000Z', null, null,
      '2026-06-03T10:00:00.000Z', '2026-06-03T10:30:00.000Z'
    )
    insertItem.run(
      'item-006', 'ord-003', '硅橡胶印模', 'B20260501', '2026-05-01', '2027-05-01',
      120, 25, 'pending', null, null, '2026-06-03T10:00:00.000Z'
    )
    insertItem.run(
      'item-007', 'ord-003', '粘接剂', 'B20260420', '2026-04-20', '2027-04-20',
      90, 18, 'pending', null, null, '2026-06-03T10:00:00.000Z'
    )
    insertTimeline.run(
      'tl-012', 'ord-003', 'create', '系统', '系统',
      '创建出库单 CK-2026-003，客户：佳美口腔西直门店',
      '2026-06-03T10:00:00.000Z'
    )
    insertTimeline.run(
      'tl-013', 'ord-003', 'submit', '张丽', '销售内勤',
      '销售内勤张丽提交出库单，客户资质有效期至2028-12-31，资质正常',
      '2026-06-03T10:30:00.000Z'
    )

    insertOrder.run(
      'ord-004', 'CK-2026-004', 'cust-004', '爱尔眼科口腔科', '2026-07-15',
      'reviewing', '刘芳', '2026-06-04T09:30:00.000Z', '赵磊', '2026-06-04T10:00:00.000Z',
      '2026-06-04T09:00:00.000Z', '2026-06-04T10:00:00.000Z'
    )
    insertItem.run(
      'item-008', 'ord-004', '氧化锌丁香油', 'B20260201', '2026-02-01', '2027-01-01',
      70, 12, 'pending', null, null, '2026-06-04T09:00:00.000Z'
    )
    insertItem.run(
      'item-009', 'ord-004', '磷酸锌水门汀', 'B20250801', '2025-08-01', '2026-07-01',
      45, 8, 'pending', null, null, '2026-06-04T09:00:00.000Z'
    )
    insertTimeline.run(
      'tl-014', 'ord-004', 'create', '系统', '系统',
      '创建出库单 CK-2026-004，客户：爱尔眼科口腔科',
      '2026-06-04T09:00:00.000Z'
    )
    insertTimeline.run(
      'tl-015', 'ord-004', 'submit', '刘芳', '销售内勤',
      '销售内勤刘芳提交出库单，系统警告：客户资质即将过期（2026-07-15，剩余41天），磷酸锌水门汀(B20250801)临期预警',
      '2026-06-04T09:30:00.000Z'
    )
    insertTimeline.run(
      'tl-016', 'ord-004', 'start_review', '赵磊', '仓库员',
      '仓库员赵磊开始复核出库单',
      '2026-06-04T10:00:00.000Z'
    )

    insertOrder.run(
      'ord-005', 'CK-2026-005', 'cust-005', '可恩口腔历城店', '2026-06-10',
      'pending_submit', null, null, null, null,
      '2026-06-05T08:30:00.000Z', '2026-06-05T08:30:00.000Z'
    )
    insertItem.run(
      'item-010', 'ord-005', '纤维桩', 'B20260315', '2026-03-15', '2028-03-15',
      150, 30, 'pending', null, null, '2026-06-05T08:30:00.000Z'
    )
    insertItem.run(
      'item-011', 'ord-005', '牙胶尖', 'B20260410', '2026-04-10', '2027-10-10',
      200, 40, 'pending', null, null, '2026-06-05T08:30:00.000Z'
    )
    insertTimeline.run(
      'tl-017', 'ord-005', 'create', '系统', '系统',
      '创建出库单 CK-2026-005，客户：可恩口腔历城店，注意：客户资质已过期（2026-06-10）',
      '2026-06-05T08:30:00.000Z'
    )
  })

  transaction()
}
