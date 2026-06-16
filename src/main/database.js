const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');
const log = require('electron-log');

class AppDatabase {
  constructor() {
    const path_module = require('path');
    const fs = require('fs');
    
    const dbPath = path_module.join(__dirname, '../../data/restaurant.db');
    
    const dataDir = path_module.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    log.info('数据库路径:', dbPath);
    
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    
    this.initializeTables();
    this.initializeSampleData();
  }

  initializeTables() {
    log.info('初始化数据库表...');

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS stores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        region TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        manager_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        spec TEXT,
        unit TEXT DEFAULT '箱',
        category TEXT,
        is_cold_chain INTEGER DEFAULT 0,
        temperature_min REAL,
        temperature_max REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        store_id INTEGER,
        region TEXT,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id)
      );

      CREATE TABLE IF NOT EXISTS shortage_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        requested_qty INTEGER NOT NULL,
        reason TEXT NOT NULL,
        affect_business INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending',
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        reviewed_by INTEGER,
        reviewed_at DATETIME,
        review_note TEXT,
        FOREIGN KEY (store_id) REFERENCES stores(id),
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (created_by) REFERENCES employees(id),
        FOREIGN KEY (reviewed_by) REFERENCES employees(id)
      );

      CREATE TABLE IF NOT EXISTS allocations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id INTEGER NOT NULL,
        allocated_qty INTEGER NOT NULL,
        allocated_by INTEGER,
        allocated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        warehouse TEXT,
        shipping_date DATE,
        tracking_no TEXT,
        status TEXT DEFAULT 'allocated',
        FOREIGN KEY (request_id) REFERENCES shortage_requests(id),
        FOREIGN KEY (allocated_by) REFERENCES employees(id)
      );

      CREATE TABLE IF NOT EXISTS receipts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        allocation_id INTEGER NOT NULL,
        store_id INTEGER NOT NULL,
        received_qty INTEGER,
        received_at DATETIME,
        received_by INTEGER,
        status TEXT DEFAULT 'pending',
        FOREIGN KEY (allocation_id) REFERENCES allocations(id),
        FOREIGN KEY (store_id) REFERENCES stores(id),
        FOREIGN KEY (received_by) REFERENCES employees(id)
      );

      CREATE TABLE IF NOT EXISTS discrepancies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        receipt_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        qty_diff INTEGER DEFAULT 0,
        temperature REAL,
        photo_path TEXT,
        status TEXT DEFAULT 'reported',
        resolved_by INTEGER,
        resolved_at DATETIME,
        resolve_note TEXT,
        FOREIGN KEY (receipt_id) REFERENCES receipts(id),
        FOREIGN KEY (resolved_by) REFERENCES employees(id)
      );

      CREATE TABLE IF NOT EXISTS feedbacks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id INTEGER NOT NULL,
        receipt_id INTEGER,
        content TEXT NOT NULL,
        type TEXT DEFAULT 'general',
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id),
        FOREIGN KEY (receipt_id) REFERENCES receipts(id),
        FOREIGN KEY (created_by) REFERENCES employees(id)
      );

      CREATE INDEX IF NOT EXISTS idx_shortage_status ON shortage_requests(status);
      CREATE INDEX IF NOT EXISTS idx_shortage_store ON shortage_requests(store_id);
      CREATE INDEX IF NOT EXISTS idx_allocation_request ON allocations(request_id);
      CREATE INDEX IF NOT EXISTS idx_receipt_allocation ON receipts(allocation_id);
      CREATE INDEX IF NOT EXISTS idx_discrepancy_receipt ON discrepancies(receipt_id);
    `);

    log.info('数据库表初始化完成');
  }

  initializeSampleData() {
    const storeCount = this.db.prepare('SELECT COUNT(*) as count FROM stores').get();
    if (storeCount.count > 0) {
      log.info('样例数据已存在，跳过初始化');
      return;
    }

    log.info('初始化样例数据...');

    const insertStore = this.db.prepare(`
      INSERT INTO stores (name, region, address, phone, manager_name)
      VALUES (?, ?, ?, ?, ?)
    `);

    const stores = [
      ['北京朝阳店', '北京', '北京市朝阳区建国路88号', '010-12345678', '张伟'],
      ['北京海淀店', '北京', '北京市海淀区中关村大街1号', '010-87654321', '李娜'],
      ['上海浦东店', '上海', '上海市浦东新区陆家嘴环路100号', '021-12345678', '王强'],
      ['上海徐汇店', '上海', '上海市徐汇区淮海中路1000号', '021-87654321', '刘芳'],
      ['广州天河店', '广州', '广州市天河区天河路388号', '020-12345678', '陈明']
    ];
    stores.forEach(s => insertStore.run(s));

    const insertProduct = this.db.prepare(`
      INSERT INTO products (name, code, spec, unit, category, is_cold_chain, temperature_min, temperature_max)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const products = [
      ['五花肉', 'PRD001', '500g/包', '箱', '肉类', 1, -18, 0],
      ['鸡翅中', 'PRD002', '1kg/袋', '箱', '禽类', 1, -18, 0],
      ['生菜', 'PRD003', '500g/袋', '箱', '蔬菜', 1, 0, 4],
      ['番茄', 'PRD004', '500g/盒', '箱', '蔬菜', 0, null, null],
      ['大米', 'PRD005', '10kg/袋', '袋', '粮油', 0, null, null],
      ['食用油', 'PRD006', '5L/桶', '箱', '粮油', 0, null, null],
      ['冷冻虾仁', 'PRD007', '500g/袋', '箱', '海鲜', 1, -18, 0],
      ['豆腐', 'PRD008', '300g/盒', '箱', '豆制品', 1, 0, 4],
      ['鸡蛋', 'PRD009', '30枚/盒', '箱', '蛋类', 0, null, null],
      ['鲜奶', 'PRD010', '1L/瓶', '箱', '乳制品', 1, 2, 6]
    ];
    products.forEach(p => insertProduct.run(p));

    const insertEmployee = this.db.prepare(`
      INSERT INTO employees (name, role, store_id, region, phone)
      VALUES (?, ?, ?, ?, ?)
    `);

    const employees = [
      ['张伟', 'manager', 1, '北京', '13800138001'],
      ['李娜', 'manager', 2, '北京', '13800138002'],
      ['王强', 'manager', 3, '上海', '13800138003'],
      ['刘芳', 'manager', 4, '上海', '13800138004'],
      ['陈明', 'manager', 5, '广州', '13800138005'],
      ['赵磊', 'supervisor', null, '北京', '13900139001'],
      ['孙丽', 'supervisor', null, '上海', '13900139002'],
      ['周伟', 'supervisor', null, '广州', '13900139003'],
      ['吴敏', 'purchaser', null, '总部', '13700137001'],
      ['郑华', 'warehouse', null, '总部', '13700137002']
    ];
    employees.forEach(e => insertEmployee.run(e));

    const insertRequest = this.db.prepare(`
      INSERT INTO shortage_requests (store_id, product_id, requested_qty, reason, affect_business, status, created_by, reviewed_by, reviewed_at, review_note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const requests = [
      [1, 1, 5, '库存不足，预计今日断货', 1, 'approved', 1, 6, '2024-01-10 09:00:00', '影响营业，优先处理'],
      [1, 2, 3, '周末备货不足', 0, 'approved', 1, 6, '2024-01-10 09:30:00', '常规补货'],
      [2, 3, 4, '蔬菜损耗较大', 1, 'pending', 2, null, null, null],
      [3, 7, 2, '冷链运输损耗', 1, 'allocated', 3, 7, '2024-01-09 14:00:00', '加急处理'],
      [3, 10, 6, '鲜奶销量超出预期', 0, 'shipped', 3, 7, '2024-01-08 10:00:00', '已发货'],
      [4, 5, 10, '大米库存告急', 1, 'received', 4, 8, '2024-01-07 11:00:00', '已到货'],
      [5, 8, 8, '豆制品供应商延迟', 0, 'pending', 5, null, null, null],
      [5, 9, 12, '鸡蛋需求增加', 0, 'approved', 5, 9, '2024-01-10 10:00:00', '确认配货']
    ];
    requests.forEach(r => insertRequest.run(r));

    const insertAllocation = this.db.prepare(`
      INSERT INTO allocations (request_id, allocated_qty, allocated_by, warehouse, shipping_date, tracking_no, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const allocations = [
      [1, 5, 10, '北京仓', '2024-01-11', 'SF123456789', 'shipped'],
      [2, 3, 10, '北京仓', '2024-01-12', 'SF123456790', 'allocated'],
      [4, 2, 10, '上海仓', '2024-01-10', 'SF987654321', 'shipped'],
      [5, 6, 10, '上海仓', '2024-01-09', 'SF987654322', 'delivered'],
      [6, 10, 10, '广州仓', '2024-01-08', 'SF555555555', 'delivered'],
      [8, 10, 10, '广州仓', '2024-01-11', 'SF666666666', 'allocated']
    ];
    allocations.forEach(a => insertAllocation.run(a));

    const insertReceipt = this.db.prepare(`
      INSERT INTO receipts (allocation_id, store_id, received_qty, received_at, received_by, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const receipts = [
      [4, 3, 2, '2024-01-10 14:30:00', 3, 'completed'],
      [5, 4, 9, '2024-01-09 10:00:00', 4, 'completed'],
      [3, 3, 2, '2024-01-10 15:00:00', 3, 'completed']
    ];
    receipts.forEach(r => insertReceipt.run(r));

    const insertDiscrepancy = this.db.prepare(`
      INSERT INTO discrepancies (receipt_id, type, description, qty_diff, temperature, status, resolved_by, resolved_at, resolve_note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const discrepancies = [
      [2, 'shortage', '到货数量不足，少配1箱', -1, null, 'resolved', 10, '2024-01-09 11:00:00', '已补发1箱'],
      [3, 'temperature', '冷链温度异常，到货时温度为8度，超过上限4度', 0, 8, 'pending', null, null, null],
      [1, 'wrong_item', '错配商品，应为冷冻虾仁，实际收到鸡翅中', 0, null, 'resolved', 10, '2024-01-10 16:00:00', '已安排换货']
    ];
    discrepancies.forEach(d => insertDiscrepancy.run(d));

    const insertFeedback = this.db.prepare(`
      INSERT INTO feedbacks (store_id, receipt_id, content, type, created_by)
      VALUES (?, ?, ?, ?, ?)
    `);

    const feedbacks = [
      [1, null, '最近配送时效有所改善，希望继续保持', 'general', 1],
      [3, 1, '本次到货差异处理及时，满意', 'receipt', 3],
      [4, 2, '建议增加冷藏车数量，保障冷链商品质量', 'general', 4],
      [5, null, '希望能提前一天通知到货时间', 'general', 5]
    ];
    feedbacks.forEach(f => insertFeedback.run(f));

    log.info('样例数据初始化完成');
  }

  getStores() {
    return this.db.prepare(`
      SELECT * FROM stores ORDER BY region, name
    `).all();
  }

  getProducts() {
    return this.db.prepare(`
      SELECT * FROM products ORDER BY category, name
    `).all();
  }

  getEmployees() {
    return this.db.prepare(`
      SELECT e.*, s.name as store_name FROM employees e
      LEFT JOIN stores s ON e.store_id = s.id
      ORDER BY role, name
    `).all();
  }

  getShortageRequests(filters = {}) {
    let query = `
      SELECT sr.*, s.name as store_name, p.name as product_name, p.code as product_code, 
             p.spec as product_spec, p.unit as product_unit, 
             e1.name as created_by_name, e2.name as reviewed_by_name
      FROM shortage_requests sr
      LEFT JOIN stores s ON sr.store_id = s.id
      LEFT JOIN products p ON sr.product_id = p.id
      LEFT JOIN employees e1 ON sr.created_by = e1.id
      LEFT JOIN employees e2 ON sr.reviewed_by = e2.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.store_id) {
      query += ' AND sr.store_id = ?';
      params.push(filters.store_id);
    }
    if (filters.status) {
      query += ' AND sr.status = ?';
      params.push(filters.status);
    }
    if (filters.affect_business) {
      query += ' AND sr.affect_business = 1';
    }

    query += ' ORDER BY sr.created_at DESC';
    return this.db.prepare(query).all(params);
  }

  createShortageRequest(data) {
    const result = this.db.prepare(`
      INSERT INTO shortage_requests 
      (store_id, product_id, requested_qty, reason, affect_business, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(data.store_id, data.product_id, data.requested_qty, data.reason, data.affect_business ? 1 : 0, data.created_by);
    
    return this.getShortageRequests({ status: 'pending' });
  }

  reviewShortageRequest(id, data) {
    this.db.prepare(`
      UPDATE shortage_requests 
      SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, review_note = ?
      WHERE id = ?
    `).run(data.status, data.reviewed_by, data.review_note, id);
    
    return this.getShortageRequests();
  }

  getAllocations(filters = {}) {
    let query = `
      SELECT a.*, sr.store_id, sr.product_id, s.name as store_name, 
             p.name as product_name, p.code as product_code,
             e.name as allocated_by_name, sr.requested_qty
      FROM allocations a
      LEFT JOIN shortage_requests sr ON a.request_id = sr.id
      LEFT JOIN stores s ON sr.store_id = s.id
      LEFT JOIN products p ON sr.product_id = p.id
      LEFT JOIN employees e ON a.allocated_by = e.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.request_id) {
      query += ' AND a.request_id = ?';
      params.push(filters.request_id);
    }
    if (filters.store_id) {
      query += ' AND sr.store_id = ?';
      params.push(filters.store_id);
    }
    if (filters.status) {
      query += ' AND a.status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY a.allocated_at DESC';
    return this.db.prepare(query).all(params);
  }

  createAllocation(data) {
    const result = this.db.prepare(`
      INSERT INTO allocations 
      (request_id, allocated_qty, allocated_by, warehouse, shipping_date, tracking_no)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(data.request_id, data.allocated_qty, data.allocated_by, data.warehouse, data.shipping_date, data.tracking_no);

    this.db.prepare(`
      UPDATE shortage_requests SET status = 'allocated' WHERE id = ?
    `).run(data.request_id);

    return this.getAllocations();
  }

  updateAllocationStatus(id, status) {
    this.db.prepare(`
      UPDATE allocations SET status = ? WHERE id = ?
    `).run(status, id);

    if (status === 'shipped') {
      const allocation = this.db.prepare('SELECT request_id FROM allocations WHERE id = ?').get(id);
      this.db.prepare(`
        UPDATE shortage_requests SET status = 'shipped' WHERE id = ?
      `).run(allocation.request_id);
    }

    return this.getAllocations();
  }

  getReceipts(filters = {}) {
    let query = `
      SELECT r.*, a.request_id, sr.store_id, sr.product_id, 
             s.name as store_name, p.name as product_name, 
             p.code as product_code, e.name as received_by_name,
             a.allocated_qty, a.tracking_no, a.shipping_date
      FROM receipts r
      LEFT JOIN allocations a ON r.allocation_id = a.id
      LEFT JOIN shortage_requests sr ON a.request_id = sr.id
      LEFT JOIN stores s ON r.store_id = s.id
      LEFT JOIN products p ON sr.product_id = p.id
      LEFT JOIN employees e ON r.received_by = e.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.allocation_id) {
      query += ' AND r.allocation_id = ?';
      params.push(filters.allocation_id);
    }
    if (filters.store_id) {
      query += ' AND r.store_id = ?';
      params.push(filters.store_id);
    }
    if (filters.status) {
      query += ' AND r.status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY r.received_at DESC';
    return this.db.prepare(query).all(params);
  }

  createReceipt(data) {
    const result = this.db.prepare(`
      INSERT INTO receipts 
      (allocation_id, store_id, received_qty, received_at, received_by, status)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
    `).run(data.allocation_id, data.store_id, data.received_qty, data.received_by, data.status);

    if (data.status === 'completed') {
      this.db.prepare(`
        UPDATE allocations SET status = 'delivered' WHERE id = ?
      `).run(data.allocation_id);

      const allocation = this.db.prepare('SELECT request_id FROM allocations WHERE id = ?').get(data.allocation_id);
      this.db.prepare(`
        UPDATE shortage_requests SET status = 'received' WHERE id = ?
      `).run(allocation.request_id);
    }

    return this.getReceipts();
  }

  getDiscrepancies(filters = {}) {
    let query = `
      SELECT d.*, r.store_id, s.name as store_name, e.name as resolved_by_name
      FROM discrepancies d
      LEFT JOIN receipts r ON d.receipt_id = r.id
      LEFT JOIN stores s ON r.store_id = s.id
      LEFT JOIN employees e ON d.resolved_by = e.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.receipt_id) {
      query += ' AND d.receipt_id = ?';
      params.push(filters.receipt_id);
    }
    if (filters.store_id) {
      query += ' AND r.store_id = ?';
      params.push(filters.store_id);
    }
    if (filters.status) {
      query += ' AND d.status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY d.created_at DESC';
    return this.db.prepare(query).all(params);
  }

  createDiscrepancy(data) {
    const result = this.db.prepare(`
      INSERT INTO discrepancies 
      (receipt_id, type, description, qty_diff, temperature, photo_path)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(data.receipt_id, data.type, data.description, data.qty_diff || 0, data.temperature || null, data.photo_path || null);

    this.db.prepare(`
      UPDATE receipts SET status = 'discrepancy' WHERE id = ?
    `).run(data.receipt_id);

    return this.getDiscrepancies();
  }

  resolveDiscrepancy(id, data) {
    this.db.prepare(`
      UPDATE discrepancies 
      SET status = 'resolved', resolved_by = ?, resolved_at = CURRENT_TIMESTAMP, resolve_note = ?
      WHERE id = ?
    `).run(data.resolved_by, data.resolve_note, id);

    const discrepancy = this.db.prepare('SELECT receipt_id FROM discrepancies WHERE id = ?').get(id);
    const otherPending = this.db.prepare(`
      SELECT COUNT(*) as count FROM discrepancies WHERE receipt_id = ? AND status = 'reported'
    `).get(discrepancy.receipt_id);

    if (otherPending.count === 0) {
      this.db.prepare(`
        UPDATE receipts SET status = 'completed' WHERE id = ?
      `).run(discrepancy.receipt_id);
    }

    return this.getDiscrepancies();
  }

  getFeedbacks(filters = {}) {
    let query = `
      SELECT f.*, s.name as store_name, e.name as created_by_name,
             r.id as receipt_id
      FROM feedbacks f
      LEFT JOIN stores s ON f.store_id = s.id
      LEFT JOIN employees e ON f.created_by = e.id
      LEFT JOIN receipts r ON f.receipt_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.store_id) {
      query += ' AND f.store_id = ?';
      params.push(filters.store_id);
    }
    if (filters.type) {
      query += ' AND f.type = ?';
      params.push(filters.type);
    }

    query += ' ORDER BY f.created_at DESC';
    return this.db.prepare(query).all(params);
  }

  createFeedback(data) {
    const result = this.db.prepare(`
      INSERT INTO feedbacks (store_id, receipt_id, content, type, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(data.store_id, data.receipt_id || null, data.content, data.type || 'general', data.created_by);

    return this.getFeedbacks();
  }

  getDashboardStats() {
    const stats = {
      pendingRequests: this.db.prepare(`SELECT COUNT(*) as count FROM shortage_requests WHERE status = 'pending'`).get().count,
      affectBusiness: this.db.prepare(`SELECT COUNT(*) as count FROM shortage_requests WHERE affect_business = 1 AND status != 'received'`).get().count,
      pendingAllocations: this.db.prepare(`SELECT COUNT(*) as count FROM allocations WHERE status = 'allocated'`).get().count,
      pendingReceipts: this.db.prepare(`SELECT COUNT(*) as count FROM receipts WHERE status = 'pending'`).get().count,
      pendingDiscrepancies: this.db.prepare(`SELECT COUNT(*) as count FROM discrepancies WHERE status = 'reported'`).get().count
    };
    return stats;
  }
}

module.exports = AppDatabase;