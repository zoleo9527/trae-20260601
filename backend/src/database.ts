import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export async function getDb() {
  return open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });
}

export async function initDatabase() {
  const db = await getDb();
  
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('warehouse_manager', 'driver', 'customer_service')),
      phone TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      orderNo TEXT NOT NULL UNIQUE,
      customerName TEXT NOT NULL,
      customerPhone TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'locked', 'allocated', 'picked', 'loaded', 'in_transit', 'delivered', 'signed', 'completed', 'cancelled')),
      lockStatus TEXT NOT NULL DEFAULT 'pending' CHECK(lockStatus IN ('pending', 'locked', 'partial', 'released')),
      riskLevel TEXT CHECK(riskLevel IN ('high', 'medium', 'low')),
      riskReason TEXT,
      lockedBy TEXT,
      lockedAt TEXT,
      allocatedBy TEXT,
      allocatedAt TEXT,
      pickedBy TEXT,
      pickedAt TEXT,
      driverId TEXT,
      loadedAt TEXT,
      deliveredAt TEXT,
      signedBy TEXT,
      signedAt TEXT,
      completedAt TEXT,
      notes TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lockedBy) REFERENCES users(id),
      FOREIGN KEY (allocatedBy) REFERENCES users(id),
      FOREIGN KEY (pickedBy) REFERENCES users(id),
      FOREIGN KEY (driverId) REFERENCES users(id),
      FOREIGN KEY (signedBy) REFERENCES users(id)
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      orderId TEXT NOT NULL,
      productName TEXT NOT NULL,
      spec TEXT,
      unit TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      lockedQuantity INTEGER NOT NULL DEFAULT 0,
      allocatedQuantity INTEGER NOT NULL DEFAULT 0,
      pickedQuantity INTEGER NOT NULL DEFAULT 0,
      loadedQuantity INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      zone TEXT NOT NULL,
      rack TEXT,
      level TEXT,
      capacity INTEGER NOT NULL DEFAULT 0,
      currentQty INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'empty' CHECK(status IN ('empty', 'occupied', 'reserved', 'locked')),
      allocatedBy TEXT,
      allocatedAt TEXT,
      orderId TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (allocatedBy) REFERENCES users(id),
      FOREIGN KEY (orderId) REFERENCES orders(id)
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS operation_logs (
      id TEXT PRIMARY KEY,
      orderId TEXT NOT NULL,
      orderNo TEXT NOT NULL,
      operationType TEXT NOT NULL CHECK(operationType IN ('lock', 'unlock', 'allocate', 'deallocate', 'pick', 'load', 'deliver', 'sign', 'complete', 'create')),
      operatorId TEXT NOT NULL,
      operatorName TEXT NOT NULL,
      operatorRole TEXT NOT NULL,
      description TEXT,
      details TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (orderId) REFERENCES orders(id),
      FOREIGN KEY (operatorId) REFERENCES users(id)
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS task_assignments (
      id TEXT PRIMARY KEY,
      orderId TEXT NOT NULL,
      orderNo TEXT NOT NULL,
      taskType TEXT NOT NULL CHECK(taskType IN ('lock', 'allocate', 'pick', 'deliver', 'sign')),
      assigneeId TEXT NOT NULL,
      assigneeName TEXT NOT NULL,
      assigneeRole TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'cancelled')),
      assignedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      completedAt TEXT,
      FOREIGN KEY (orderId) REFERENCES orders(id),
      FOREIGN KEY (assigneeId) REFERENCES users(id)
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS delivery_notes (
      id TEXT PRIMARY KEY,
      noteNo TEXT NOT NULL UNIQUE,
      orderId TEXT NOT NULL,
      orderNo TEXT NOT NULL,
      driverId TEXT,
      driverName TEXT,
      licensePlate TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'loaded', 'in_transit', 'delivered', 'signed')),
      loadedAt TEXT,
      departedAt TEXT,
      deliveredAt TEXT,
      signedAt TEXT,
      signerName TEXT,
      signerPhone TEXT,
      notes TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (orderId) REFERENCES orders(id),
      FOREIGN KEY (driverId) REFERENCES users(id)
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS idempotency_keys (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      orderId TEXT,
      operationType TEXT,
      response TEXT,
      expiresAt TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (orderId) REFERENCES orders(id)
    );
  `);

  await db.close();
}

export async function seedData() {
  const db = await getDb();
  
  const existingUsers = await db.get('SELECT COUNT(*) as count FROM users');
  if (existingUsers.count === 0) {
    await db.run(`
      INSERT INTO users (id, name, role, phone) VALUES
      ('u1', '张主管', 'warehouse_manager', '13800138001'),
      ('u2', '李经理', 'warehouse_manager', '13800138002'),
      ('u3', '王司机', 'driver', '13800138003'),
      ('u4', '陈司机', 'driver', '13800138004'),
      ('u5', '刘客服', 'customer_service', '13800138005'),
      ('u6', '赵客服', 'customer_service', '13800138006');
    `);
  }

  const existingLocations = await db.get('SELECT COUNT(*) as count FROM locations');
  if (existingLocations.count === 0) {
    await db.run(`
      INSERT INTO locations (id, code, zone, rack, level, capacity, currentQty, status) VALUES
      ('loc1', 'A-01-01', 'A', '01', '01', 100, 45, 'occupied'),
      ('loc2', 'A-01-02', 'A', '01', '02', 100, 30, 'occupied'),
      ('loc3', 'A-02-01', 'A', '02', '01', 100, 0, 'empty'),
      ('loc4', 'A-02-02', 'A', '02', '02', 100, 20, 'occupied'),
      ('loc5', 'B-01-01', 'B', '01', '01', 200, 150, 'occupied'),
      ('loc6', 'B-01-02', 'B', '01', '02', 200, 0, 'empty'),
      ('loc7', 'B-02-01', 'B', '02', '01', 200, 80, 'occupied'),
      ('loc8', 'B-02-02', 'B', '02', '02', 200, 0, 'empty'),
      ('loc9', 'C-01-01', 'C', '01', '01', 50, 0, 'empty'),
      ('loc10', 'C-01-02', 'C', '01', '02', 50, 35, 'occupied'),
      ('loc11', 'C-02-01', 'C', '02', '01', 50, 0, 'empty'),
      ('loc12', 'C-02-02', 'C', '02', '02', 50, 0, 'empty');
    `);
  }

  const existingOrders = await db.get('SELECT COUNT(*) as count FROM orders');
  if (existingOrders.count === 0) {
    await db.run(`
      INSERT INTO orders (id, orderNo, customerName, customerPhone, status, lockStatus, notes) VALUES
      ('ord1', 'PO-2026-0001', '北京建材公司', '13900139001', 'pending', 'pending', '优先处理'),
      ('ord2', 'PO-2026-0002', '上海建工集团', '13900139002', 'locked', 'locked', ''),
      ('ord3', 'PO-2026-0003', '广州装修公司', '13900139003', 'allocated', 'locked', ''),
      ('ord4', 'PO-2026-0004', '深圳建设集团', '13900139004', 'picked', 'locked', ''),
      ('ord5', 'PO-2026-0005', '成都建筑公司', '13900139005', 'in_transit', 'locked', ''),
      ('ord6', 'PO-2026-0006', '武汉建工集团', '13900139006', 'delivered', 'locked', ''),
      ('ord7', 'PO-2026-0007', '南京建材市场', '13900139007', 'completed', 'locked', ''),
      ('ord8', 'PO-2026-0008', '杭州装修公司', '13900139008', 'pending', 'partial', '部分商品库存不足');
    `);

    await db.run(`
      INSERT INTO order_items (id, orderId, productName, spec, unit, quantity, lockedQuantity, allocatedQuantity, pickedQuantity) VALUES
      ('item1', 'ord1', '水泥', 'P.O 42.5', '吨', 20, 0, 0, 0),
      ('item2', 'ord1', '钢筋', 'HRB400', '吨', 15, 0, 0, 0),
      ('item3', 'ord1', '砂石', '中砂', '方', 30, 0, 0, 0),
      ('item4', 'ord2', '水泥', 'P.O 42.5', '吨', 10, 10, 10, 10),
      ('item5', 'ord2', '砖块', '标准砖', '千块', 5, 5, 5, 5),
      ('item6', 'ord3', '钢材', 'Q235', '吨', 8, 8, 8, 0),
      ('item7', 'ord3', '木材', '松木', '方', 12, 12, 12, 0),
      ('item8', 'ord4', '水泥', 'P.O 32.5', '吨', 15, 15, 15, 15),
      ('item9', 'ord4', '砂石', '细砂', '方', 20, 20, 20, 20),
      ('item10', 'ord5', '钢筋', 'HRB500', '吨', 12, 12, 12, 12),
      ('item11', 'ord5', '水泥', 'P.O 42.5', '吨', 8, 8, 8, 8),
      ('item12', 'ord6', '砖块', '空心砖', '千块', 10, 10, 10, 10),
      ('item13', 'ord6', '砂石', '粗砂', '方', 15, 15, 15, 15),
      ('item14', 'ord7', '钢材', 'Q355', '吨', 6, 6, 6, 6),
      ('item15', 'ord7', '木材', '橡木', '方', 8, 8, 8, 8),
      ('item16', 'ord8', '水泥', 'P.O 42.5', '吨', 25, 15, 0, 0),
      ('item17', 'ord8', '钢筋', 'HRB400', '吨', 20, 20, 0, 0);
    `);

    await db.run(`
      INSERT INTO operation_logs (id, orderId, orderNo, operationType, operatorId, operatorName, operatorRole, description) VALUES
      ('log1', 'ord2', 'PO-2026-0002', 'lock', 'u1', '张主管', 'warehouse_manager', '订单锁货完成'),
      ('log2', 'ord2', 'PO-2026-0002', 'allocate', 'u1', '张主管', 'warehouse_manager', '库位分配完成'),
      ('log3', 'ord2', 'PO-2026-0002', 'pick', 'u2', '李经理', 'warehouse_manager', '拣货完成'),
      ('log4', 'ord3', 'PO-2026-0003', 'lock', 'u2', '李经理', 'warehouse_manager', '订单锁货完成'),
      ('log5', 'ord3', 'PO-2026-0003', 'allocate', 'u2', '李经理', 'warehouse_manager', '库位分配完成'),
      ('log6', 'ord4', 'PO-2026-0004', 'lock', 'u1', '张主管', 'warehouse_manager', '订单锁货完成'),
      ('log7', 'ord4', 'PO-2026-0004', 'allocate', 'u1', '张主管', 'warehouse_manager', '库位分配完成'),
      ('log8', 'ord4', 'PO-2026-0004', 'pick', 'u1', '张主管', 'warehouse_manager', '拣货完成'),
      ('log9', 'ord5', 'PO-2026-0005', 'lock', 'u2', '李经理', 'warehouse_manager', '订单锁货完成'),
      ('log10', 'ord5', 'PO-2026-0005', 'allocate', 'u2', '李经理', 'warehouse_manager', '库位分配完成'),
      ('log11', 'ord5', 'PO-2026-0005', 'pick', 'u2', '李经理', 'warehouse_manager', '拣货完成'),
      ('log12', 'ord5', 'PO-2026-0005', 'load', 'u3', '王司机', 'driver', '装车完成，出发送货'),
      ('log13', 'ord6', 'PO-2026-0006', 'lock', 'u1', '张主管', 'warehouse_manager', '订单锁货完成'),
      ('log14', 'ord6', 'PO-2026-0006', 'allocate', 'u1', '张主管', 'warehouse_manager', '库位分配完成'),
      ('log15', 'ord6', 'PO-2026-0006', 'pick', 'u1', '张主管', 'warehouse_manager', '拣货完成'),
      ('log16', 'ord6', 'PO-2026-0006', 'load', 'u4', '陈司机', 'driver', '装车完成'),
      ('log17', 'ord6', 'PO-2026-0006', 'deliver', 'u4', '陈司机', 'driver', '货物已送达'),
      ('log18', 'ord7', 'PO-2026-0007', 'lock', 'u2', '李经理', 'warehouse_manager', '订单锁货完成'),
      ('log19', 'ord7', 'PO-2026-0007', 'allocate', 'u2', '李经理', 'warehouse_manager', '库位分配完成'),
      ('log20', 'ord7', 'PO-2026-0007', 'pick', 'u2', '李经理', 'warehouse_manager', '拣货完成'),
      ('log21', 'ord7', 'PO-2026-0007', 'load', 'u3', '王司机', 'driver', '装车完成'),
      ('log22', 'ord7', 'PO-2026-0007', 'deliver', 'u3', '王司机', 'driver', '货物已送达'),
      ('log23', 'ord7', 'PO-2026-0007', 'sign', 'u5', '刘客服', 'customer_service', '客户已签收'),
      ('log24', 'ord7', 'PO-2026-0007', 'complete', 'u5', '刘客服', 'customer_service', '订单完成');
    `);
  }

  await db.close();
}
