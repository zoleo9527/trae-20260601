const db = require('./db');
const bcrypt = require('bcryptjs');
const dayjs = require('dayjs');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('clerk', 'courier', 'customer_service')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS routes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT NOT NULL,
      route_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (route_id) REFERENCES routes(id)
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      spec TEXT,
      price REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      start_date DATE NOT NULL,
      end_date DATE,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'paused', 'cancelled')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS daily_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      delivery_date DATE NOT NULL,
      subscription_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      route_id INTEGER,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'signed', 'exception', 'replenished')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (route_id) REFERENCES routes(id)
    );

    CREATE TABLE IF NOT EXISTS morning_checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      checkin_date DATE NOT NULL,
      route_id INTEGER NOT NULL,
      courier_id INTEGER NOT NULL,
      clerk_id INTEGER,
      total_orders INTEGER NOT NULL,
      signed_orders INTEGER NOT NULL DEFAULT 0,
      exception_orders INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'confirmed')),
      remark TEXT,
      submitted_at DATETIME,
      confirmed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (route_id) REFERENCES routes(id),
      FOREIGN KEY (courier_id) REFERENCES users(id),
      FOREIGN KEY (clerk_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS exceptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      daily_order_id INTEGER NOT NULL,
      checkin_id INTEGER,
      reported_by INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('missed', 'damaged', 'wrong_product', 'customer_absent', 'other')),
      description TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'resolved', 'closed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (daily_order_id) REFERENCES daily_orders(id),
      FOREIGN KEY (checkin_id) REFERENCES morning_checkins(id),
      FOREIGN KEY (reported_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS replenishments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exception_id INTEGER NOT NULL,
      daily_order_id INTEGER NOT NULL,
      handled_by INTEGER NOT NULL,
      confirmed_by INTEGER,
      quantity INTEGER NOT NULL,
      method TEXT NOT NULL CHECK(method IN ('redelivery', 'refund', 'replace')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'delivered', 'confirmed', 'cancelled')),
      remark TEXT,
      delivered_at DATETIME,
      confirmed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (exception_id) REFERENCES exceptions(id),
      FOREIGN KEY (daily_order_id) REFERENCES daily_orders(id),
      FOREIGN KEY (handled_by) REFERENCES users(id),
      FOREIGN KEY (confirmed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER,
      detail TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_daily_orders_date ON daily_orders(delivery_date);
    CREATE INDEX IF NOT EXISTS idx_daily_orders_route ON daily_orders(route_id);
    CREATE INDEX IF NOT EXISTS idx_daily_orders_customer ON daily_orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_checkins_date ON morning_checkins(checkin_date);
    CREATE INDEX IF NOT EXISTS idx_exceptions_order ON exceptions(daily_order_id);
    CREATE INDEX IF NOT EXISTS idx_logs_target ON operation_logs(target_type, target_id);
  `);

  console.log('数据库表结构初始化完成');
}

function initSeedData() {
  const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (existingUsers.count > 0) {
    console.log('已有数据，跳过种子数据初始化');
    return;
  }

  const hashPassword = (password) => bcrypt.hashSync(password, 10);

  const insertUser = db.prepare(`
    INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)
  `);

  const clerkId = insertUser.run('clerk', hashPassword('123456'), '张文员', 'clerk').lastInsertRowid;
  const courier1Id = insertUser.run('courier1', hashPassword('123456'), '李配送', 'courier').lastInsertRowid;
  const courier2Id = insertUser.run('courier2', hashPassword('123456'), '王配送', 'courier').lastInsertRowid;
  const csId = insertUser.run('cs', hashPassword('123456'), '赵客服', 'customer_service').lastInsertRowid;

  console.log('演示账号创建完成');

  const insertRoute = db.prepare('INSERT INTO routes (name, description) VALUES (?, ?)');
  const route1Id = insertRoute.run('A线 - 城区东段', '包含人民路、建设路沿线小区').lastInsertRowid;
  const route2Id = insertRoute.run('B线 - 城区西段', '包含中山路、解放路沿线小区').lastInsertRowid;

  const insertProduct = db.prepare('INSERT INTO products (name, spec, price) VALUES (?, ?, ?)');
  const product1Id = insertProduct.run('鲜牛奶', '250ml/瓶', 5.5).lastInsertRowid;
  const product2Id = insertProduct.run('原味酸奶', '200g/瓶', 6.0).lastInsertRowid;
  const product3Id = insertProduct.run('高钙奶', '250ml/瓶', 6.5).lastInsertRowid;

  const insertCustomer = db.prepare('INSERT INTO customers (name, phone, address, route_id) VALUES (?, ?, ?, ?)');
  const customers = [
    ['刘先生', '13800138001', '人民路1号阳光小区1-101', route1Id],
    ['陈女士', '13800138002', '人民路3号阳光小区2-203', route1Id],
    ['周先生', '13800138003', '建设路5号幸福花园3-102', route1Id],
    ['吴女士', '13800138004', '中山路2号紫金苑1-501', route2Id],
    ['郑先生', '13800138005', '中山路8号紫金苑2-302', route2Id],
    ['孙女士', '13800138006', '解放路10号丽景花园4-201', route2Id],
  ];
  const customerIds = customers.map(c => insertCustomer.run(...c).lastInsertRowid);

  const customerRouteMap = {};
  customerIds.forEach((cid, idx) => {
    customerRouteMap[cid] = customers[idx][3];
  });

  const insertSubscription = db.prepare(`
    INSERT INTO subscriptions (customer_id, product_id, quantity, start_date) VALUES (?, ?, ?, ?)
  `);
  const today = dayjs().format('YYYY-MM-DD');
  const startDate = dayjs().subtract(7, 'day').format('YYYY-MM-DD');

  const subscriptions = [
    [customerIds[0], product1Id, 1, startDate],
    [customerIds[0], product2Id, 1, startDate],
    [customerIds[1], product1Id, 2, startDate],
    [customerIds[2], product3Id, 1, startDate],
    [customerIds[3], product1Id, 1, startDate],
    [customerIds[3], product2Id, 2, startDate],
    [customerIds[4], product2Id, 1, startDate],
    [customerIds[5], product1Id, 1, startDate],
    [customerIds[5], product3Id, 1, startDate],
  ];
  const subscriptionIds = subscriptions.map(s => insertSubscription.run(...s).lastInsertRowid);

  const insertDailyOrder = db.prepare(`
    INSERT INTO daily_orders (delivery_date, subscription_id, customer_id, product_id, quantity, route_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (let i = 0; i < 3; i++) {
    const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
    subscriptionIds.forEach((subId, idx) => {
      const sub = subscriptions[idx];
      const status = i === 0 ? 'pending' : (Math.random() > 0.15 ? 'signed' : 'exception');
      insertDailyOrder.run(date, subId, sub[0], sub[1], sub[2], customerRouteMap[sub[0]], status);
    });
  }

  const insertCheckin = db.prepare(`
    INSERT INTO morning_checkins (checkin_date, route_id, courier_id, clerk_id, total_orders, signed_orders, exception_orders, status, submitted_at, confirmed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (let i = 1; i < 3; i++) {
    const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
    const route1Orders = db.prepare('SELECT COUNT(*) as count FROM daily_orders WHERE delivery_date = ? AND route_id = ?').get(date, route1Id).count;
    const route2Orders = db.prepare('SELECT COUNT(*) as count FROM daily_orders WHERE delivery_date = ? AND route_id = ?').get(date, route2Id).count;

    insertCheckin.run(
      date, route1Id, courier1Id, clerkId, route1Orders, Math.floor(route1Orders * 0.85), route1Orders - Math.floor(route1Orders * 0.85),
      'confirmed',
      dayjs(date).add(6, 'hour').toISOString(),
      dayjs(date).add(7, 'hour').toISOString()
    );
    insertCheckin.run(
      date, route2Id, courier2Id, clerkId, route2Orders, Math.floor(route2Orders * 0.85), route2Orders - Math.floor(route2Orders * 0.85),
      'confirmed',
      dayjs(date).add(6, 'hour').toISOString(),
      dayjs(date).add(7, 'hour').toISOString()
    );
  }

  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
  const yesterdayRoute1Checkin = db.prepare('SELECT id FROM morning_checkins WHERE checkin_date = ? AND route_id = ?').get(yesterday, route1Id);
  const yesterdayExceptionOrders = db.prepare(`
    SELECT id FROM daily_orders WHERE delivery_date = ? AND route_id = ? AND status = 'exception' LIMIT 3
  `).all(yesterday, route1Id);

  if (yesterdayExceptionOrders.length >= 3) {
    const insertException = db.prepare(`
      INSERT INTO exceptions (daily_order_id, checkin_id, reported_by, type, description, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertReplenishment = db.prepare(`
      INSERT INTO replenishments (exception_id, daily_order_id, handled_by, confirmed_by, quantity, method, remark, status, delivered_at, confirmed_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const ex1 = insertException.run(
      yesterdayExceptionOrders[0].id, yesterdayRoute1Checkin.id, courier1Id,
      'missed', '配送时漏装了一瓶鲜牛奶', 'resolved',
      dayjs(yesterday).add(6, 'hour').add(15, 'minute').toISOString()
    ).lastInsertRowid;
    insertReplenishment.run(
      ex1, yesterdayExceptionOrders[0].id, clerkId, csId,
      1, 'redelivery', '客户要求下午4点后配送', 'confirmed',
      dayjs(yesterday).add(9, 'hour').toISOString(),
      dayjs(yesterday).add(10, 'hour').toISOString(),
      dayjs(yesterday).add(7, 'hour').toISOString()
    );

    const ex2 = insertException.run(
      yesterdayExceptionOrders[1].id, yesterdayRoute1Checkin.id, courier1Id,
      'damaged', '配送途中瓶盖破裂，牛奶洒出', 'resolved',
      dayjs(yesterday).add(6, 'hour').add(25, 'minute').toISOString()
    ).lastInsertRowid;
    insertReplenishment.run(
      ex2, yesterdayExceptionOrders[1].id, clerkId, null,
      2, 'replace', '更换全新的两瓶原味酸奶', 'delivered',
      dayjs(yesterday).add(11, 'hour').toISOString(),
      null,
      dayjs(yesterday).add(8, 'hour').toISOString()
    );

    const ex3 = insertException.run(
      yesterdayExceptionOrders[2].id, yesterdayRoute1Checkin.id, courier1Id,
      'customer_absent', '客户不在家，电话未接通', 'pending',
      dayjs(yesterday).add(6, 'hour').add(40, 'minute').toISOString()
    ).lastInsertRowid;
  }

  const todayDate = dayjs().format('YYYY-MM-DD');
  const todayRoute1CheckinId = insertCheckin.run(
    todayDate, route1Id, courier1Id, null,
    db.prepare('SELECT COUNT(*) as count FROM daily_orders WHERE delivery_date = ? AND route_id = ?').get(todayDate, route1Id).count,
    0, 0, 'draft', null, null
  ).lastInsertRowid;

  const todayPendingOrders = db.prepare(`
    SELECT id FROM daily_orders WHERE delivery_date = ? AND route_id = ? LIMIT 4
  `).all(todayDate, route1Id);

  if (todayPendingOrders.length >= 2) {
    db.prepare('UPDATE daily_orders SET status = ? WHERE id = ?').run('signed', todayPendingOrders[0].id);
    db.prepare('UPDATE daily_orders SET status = ? WHERE id = ?').run('signed', todayPendingOrders[1].id);

    const todayEx = db.prepare(`
      INSERT INTO exceptions (daily_order_id, checkin_id, reported_by, type, description, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      todayPendingOrders[0].id, todayRoute1CheckinId, courier1Id,
      'wrong_product', '拿错了规格，客户订的高钙奶拿成了鲜牛奶', 'processing',
      dayjs().add(5, 'hour').toISOString()
    ).lastInsertRowid;

    db.prepare(`
      INSERT INTO replenishments (exception_id, daily_order_id, handled_by, quantity, method, remark, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      todayEx, todayPendingOrders[0].id, clerkId,
      1, 'redelivery', '正在仓库换货，半小时后送出', 'pending',
      dayjs().add(5, 'hour').add(10, 'minute').toISOString()
    );
  }

  const signedCount = db.prepare(`
    SELECT COUNT(*) as count FROM daily_orders WHERE delivery_date = ? AND route_id = ? AND status = 'signed'
  `).get(todayDate, route1Id).count;
  const exceptionCount = db.prepare(`
    SELECT COUNT(*) as count FROM daily_orders WHERE delivery_date = ? AND route_id = ? AND status = 'exception'
  `).get(todayDate, route1Id).count;

  db.prepare('UPDATE morning_checkins SET signed_orders = ?, exception_orders = ? WHERE id = ?').run(
    signedCount, exceptionCount, todayRoute1CheckinId
  );

  console.log('种子数据初始化完成，已包含异常补送演示数据');
}

initSchema();
initSeedData();
