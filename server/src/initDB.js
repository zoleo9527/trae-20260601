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

  const dateToday = dayjs().format('YYYY-MM-DD');
  const dateYesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
  const dateTwoDaysAgo = dayjs().subtract(2, 'day').format('YYYY-MM-DD');

  const route1SubIdx = [0, 1, 2, 3];
  const route2SubIdx = [4, 5, 6, 7, 8];

  const yesterdayRoute1ExceptionSubs = [0, 1, 2];
  const yesterdayRoute1SignedSubs = [3];
  const yesterdayRoute2ExceptionSubs = [5];
  const yesterdayRoute2SignedSubs = [4, 6, 7, 8];
  const twoDaysAgoExceptionSubs = [5];

  const createdOrderIds = {
    [dateToday]: {},
    [dateYesterday]: {},
    [dateTwoDaysAgo]: {},
  };

  [dateToday, dateYesterday, dateTwoDaysAgo].forEach((date) => {
    subscriptionIds.forEach((subId, idx) => {
      const sub = subscriptions[idx];
      let status = 'signed';
      if (date === dateToday) {
        status = 'pending';
      } else if (date === dateYesterday) {
        if (yesterdayRoute1ExceptionSubs.includes(idx)) {
          status = 'exception';
        } else if (yesterdayRoute2ExceptionSubs.includes(idx)) {
          status = 'exception';
        } else {
          status = 'signed';
        }
      } else {
        const twoDaysAgoRoute1ExceptionSubs = [2];
        const twoDaysAgoRoute2ExceptionSubs = [5];
        status = (twoDaysAgoRoute1ExceptionSubs.includes(idx) || twoDaysAgoRoute2ExceptionSubs.includes(idx)) ? 'exception' : 'signed';
      }
      const orderId = insertDailyOrder.run(
        date, subId, sub[0], sub[1], sub[2], customerRouteMap[sub[0]], status
      ).lastInsertRowid;
      createdOrderIds[date][idx] = orderId;
    });
  });

  const insertCheckin = db.prepare(`
    INSERT INTO morning_checkins (checkin_date, route_id, courier_id, clerk_id, total_orders, signed_orders, exception_orders, status, submitted_at, confirmed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertOpLog = db.prepare(`
    INSERT INTO operation_logs (user_id, action, target_type, target_id, detail, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  [dateYesterday, dateTwoDaysAgo].forEach((date) => {
    const route1OrderIds = route1SubIdx.map(idx => createdOrderIds[date][idx]);
    const route2OrderIds = route2SubIdx.map(idx => createdOrderIds[date][idx]);

    let route1ExceptionSubs = yesterdayRoute1ExceptionSubs;
    let route2ExceptionCount = 1;

    if (date === dateTwoDaysAgo) {
      route1ExceptionSubs = [2];
      route2ExceptionCount = 1;
    }

    const route1SignedCount = route1OrderIds.length - route1ExceptionSubs.length;
    const route1ExceptionCount = route1ExceptionSubs.length;

    const route1CheckinId = insertCheckin.run(
      date, route1Id, courier1Id, clerkId, route1OrderIds.length,
      route1SignedCount, route1ExceptionCount,
      'confirmed',
      dayjs(date).add(6, 'hour').toISOString(),
      dayjs(date).add(7, 'hour').toISOString()
    ).lastInsertRowid;

    route1OrderIds.forEach((orderId, i) => {
      const subIdx = route1SubIdx[i];
      const isException = route1ExceptionSubs.includes(subIdx);
      insertOpLog.run(
        courier1Id, 'update_order_in_checkin', 'daily_order', orderId,
        JSON.stringify({
          checkinId: route1CheckinId,
          oldStatus: 'pending',
          newStatus: isException ? 'exception' : 'signed'
        }),
        dayjs(date).add(6, 'hour').add(5 + i * 2, 'minute').toISOString()
      );
    });

    insertCheckin.run(
      date, route2Id, courier2Id, clerkId, route2OrderIds.length,
      route2OrderIds.length - route2ExceptionCount,
      route2ExceptionCount,
      'confirmed',
      dayjs(date).add(6, 'hour').toISOString(),
      dayjs(date).add(7, 'hour').toISOString()
    );
  });

  const yesterdayRoute1Checkin = db.prepare('SELECT id FROM morning_checkins WHERE checkin_date = ? AND route_id = ?').get(dateYesterday, route1Id);
  const yesterdayRoute1ExceptionOrderIds = yesterdayRoute1ExceptionSubs.map(idx => createdOrderIds[dateYesterday][idx]);

  const insertException = db.prepare(`
    INSERT INTO exceptions (daily_order_id, checkin_id, reported_by, type, description, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertReplenishment = db.prepare(`
    INSERT INTO replenishments (exception_id, daily_order_id, handled_by, confirmed_by, quantity, method, remark, status, delivered_at, confirmed_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const ex1 = insertException.run(
    yesterdayRoute1ExceptionOrderIds[0], yesterdayRoute1Checkin.id, courier1Id,
    'missed', '配送时漏装了一瓶鲜牛奶', 'resolved',
    dayjs(dateYesterday).add(6, 'hour').add(15, 'minute').toISOString()
  ).lastInsertRowid;
  insertReplenishment.run(
    ex1, yesterdayRoute1ExceptionOrderIds[0], clerkId, csId,
    1, 'redelivery', '客户要求下午4点后配送', 'confirmed',
    dayjs(dateYesterday).add(9, 'hour').toISOString(),
    dayjs(dateYesterday).add(10, 'hour').toISOString(),
    dayjs(dateYesterday).add(7, 'hour').toISOString()
  );

  const ex2 = insertException.run(
    yesterdayRoute1ExceptionOrderIds[1], yesterdayRoute1Checkin.id, courier1Id,
    'damaged', '配送途中瓶盖破裂，牛奶洒出', 'resolved',
    dayjs(dateYesterday).add(6, 'hour').add(25, 'minute').toISOString()
  ).lastInsertRowid;
  insertReplenishment.run(
    ex2, yesterdayRoute1ExceptionOrderIds[1], clerkId, null,
    2, 'replace', '更换全新的两瓶原味酸奶', 'delivered',
    dayjs(dateYesterday).add(11, 'hour').toISOString(),
    null,
    dayjs(dateYesterday).add(8, 'hour').toISOString()
  );

  const ex3 = insertException.run(
    yesterdayRoute1ExceptionOrderIds[2], yesterdayRoute1Checkin.id, courier1Id,
    'customer_absent', '客户不在家，电话未接通', 'pending',
    dayjs(dateYesterday).add(6, 'hour').add(40, 'minute').toISOString()
  ).lastInsertRowid;

  const todayRoute1CheckinId = insertCheckin.run(
    dateToday, route1Id, courier1Id, null,
    route1SubIdx.length, 0, 0, 'draft', null, null
  ).lastInsertRowid;

  const todayOrder0 = createdOrderIds[dateToday][route1SubIdx[0]];
  const todayOrder1 = createdOrderIds[dateToday][route1SubIdx[1]];

  if (todayOrder0 && todayOrder1) {
    db.prepare('UPDATE daily_orders SET status = ? WHERE id = ?').run('signed', todayOrder0);
    db.prepare('UPDATE daily_orders SET status = ? WHERE id = ?').run('signed', todayOrder1);

    insertOpLog.run(
      courier1Id, 'update_order_in_checkin', 'daily_order', todayOrder0,
      JSON.stringify({
        checkinId: todayRoute1CheckinId,
        oldStatus: 'pending',
        newStatus: 'signed'
      }),
      dayjs().add(5, 'hour').toISOString()
    );
    insertOpLog.run(
      courier1Id, 'update_order_in_checkin', 'daily_order', todayOrder1,
      JSON.stringify({
        checkinId: todayRoute1CheckinId,
        oldStatus: 'pending',
        newStatus: 'signed'
      }),
      dayjs().add(5, 'hour').add(1, 'minute').toISOString()
    );

    const todayEx = insertException.run(
      todayOrder0, todayRoute1CheckinId, courier1Id,
      'wrong_product', '拿错了规格，客户订的高钙奶拿成了鲜牛奶', 'processing',
      dayjs().add(5, 'hour').add(5, 'minute').toISOString()
    ).lastInsertRowid;

    db.prepare('UPDATE daily_orders SET status = ? WHERE id = ?').run('exception', todayOrder0);

    insertOpLog.run(
      courier1Id, 'update_order_in_checkin', 'daily_order', todayOrder0,
      JSON.stringify({
        checkinId: todayRoute1CheckinId,
        oldStatus: 'signed',
        newStatus: 'exception'
      }),
      dayjs().add(5, 'hour').add(5, 'minute').toISOString()
    );

    insertReplenishment.run(
      todayEx, todayOrder0, clerkId, null,
      1, 'redelivery', '正在仓库换货，半小时后送出', 'pending',
      null, null,
      dayjs().add(5, 'hour').add(10, 'minute').toISOString()
    );
  }

  const todaySignedCount = db.prepare(`
    SELECT COUNT(*) as count FROM daily_orders WHERE delivery_date = ? AND route_id = ? AND status = 'signed'
  `).get(dateToday, route1Id).count;
  const todayExceptionCount = db.prepare(`
    SELECT COUNT(*) as count FROM daily_orders WHERE delivery_date = ? AND route_id = ? AND status = 'exception'
  `).get(dateToday, route1Id).count;

  db.prepare('UPDATE morning_checkins SET signed_orders = ?, exception_orders = ? WHERE id = ?').run(
    todaySignedCount, todayExceptionCount, todayRoute1CheckinId
  );

  console.log('种子数据初始化完成，已包含完整异常补送演示数据');
}

initSchema();
initSeedData();
