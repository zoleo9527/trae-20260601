const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'central-kitchen.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    address TEXT,
    contact TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS dishes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    allergens TEXT,
    unit TEXT NOT NULL DEFAULT '份',
    specification TEXT,
    production_time INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS daily_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_date DATE NOT NULL,
    store_id INTEGER NOT NULL,
    dish_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    is_urgent BOOLEAN DEFAULT 0,
    allergens_confirmation TEXT,
    special_instructions TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (dish_id) REFERENCES dishes(id),
    UNIQUE(order_date, store_id, dish_id, is_urgent)
  );

  CREATE TABLE IF NOT EXISTS production_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    schedule_date DATE NOT NULL,
    dish_id INTEGER NOT NULL,
    total_quantity INTEGER NOT NULL,
    start_time DATETIME,
    end_time DATETIME,
    status TEXT NOT NULL DEFAULT 'scheduled',
    assigned_to TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dish_id) REFERENCES dishes(id),
    UNIQUE(schedule_date, dish_id)
  );

  CREATE TABLE IF NOT EXISTS production_batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    schedule_id INTEGER NOT NULL,
    batch_number TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    started_at DATETIME,
    completed_at DATETIME,
    operator TEXT,
    FOREIGN KEY (schedule_id) REFERENCES production_schedules(id)
  );

  CREATE TABLE IF NOT EXISTS deliveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    delivery_date DATE NOT NULL,
    store_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    dish_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    dispatched_at DATETIME,
    received_at DATETIME,
    received_by TEXT,
    receiver_signature TEXT,
    notes TEXT,
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (order_id) REFERENCES daily_orders(id),
    FOREIGN KEY (dish_id) REFERENCES dishes(id)
  );

  CREATE TABLE IF NOT EXISTS operation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operation_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    old_value TEXT,
    new_value TEXT,
    operator TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
  );
`);

const stores = [
  { name: '朝阳门店', code: 'CY001', address: '北京市朝阳区朝阳门外大街1号', contact: '张店长 13800138001' },
  { name: '海淀店', code: 'HD001', address: '北京市海淀区中关村大街1号', contact: '李店长 13800138002' },
  { name: '西城店', code: 'XC001', address: '北京市西城区金融街1号', contact: '王店长 13800138003' },
  { name: '东城店', code: 'DC001', address: '北京市东城区王府井大街1号', contact: '赵店长 13800138004' },
  { name: '丰台店', code: 'FT001', address: '北京市丰台区丰台路1号', contact: '刘店长 13800138005' },
];

const insertStore = db.prepare('INSERT INTO stores (name, code, address, contact) VALUES (?, ?, ?, ?)');
stores.forEach(store => insertStore.run(store.name, store.code, store.address, store.contact));

const dishes = [
  { name: '红烧肉', code: 'DISH001', category: '热菜', allergens: '无', unit: '份', specification: '300g/份', production_time: 45 },
  { name: '清蒸鲈鱼', code: 'DISH002', category: '热菜', allergens: '鱼类', unit: '份', specification: '500g/份', production_time: 25 },
  { name: '宫保鸡丁', code: 'DISH003', category: '热菜', allergens: '花生', unit: '份', specification: '280g/份', production_time: 20 },
  { name: '麻婆豆腐', code: 'DISH004', category: '热菜', allergens: '大豆', unit: '份', specification: '250g/份', production_time: 15 },
  { name: '糖醋排骨', code: 'DISH005', category: '热菜', allergens: '无', unit: '份', specification: '300g/份', production_time: 40 },
  { name: '蒜蓉西兰花', code: 'DISH006', category: '素菜', allergens: '无', unit: '份', specification: '250g/份', production_time: 10 },
  { name: '西红柿炒鸡蛋', code: 'DISH007', category: '素菜', allergens: '蛋类', unit: '份', specification: '260g/份', production_time: 10 },
  { name: '米饭', code: 'DISH008', category: '主食', allergens: '无', unit: '盒', specification: '300g/盒', production_time: 30 },
  { name: '紫菜蛋花汤', code: 'DISH009', category: '汤品', allergens: '蛋类', unit: '份', specification: '350ml/份', production_time: 15 },
  { name: '酸辣汤', code: 'DISH010', category: '汤品', allergens: '大豆', unit: '份', specification: '350ml/份', production_time: 20 },
];

const insertDish = db.prepare('INSERT INTO dishes (name, code, category, allergens, unit, specification, production_time) VALUES (?, ?, ?, ?, ?, ?, ?)');
dishes.forEach(dish => insertDish.run(dish.name, dish.code, dish.category, dish.allergens, dish.unit, dish.specification, dish.production_time));

console.log('Database seeded successfully');
console.log(`Inserted ${stores.length} stores`);
console.log(`Inserted ${dishes.length} dishes`);

db.close();
