"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertSampleData = exports.initDatabase = exports.db = void 0;
const sqlite3_1 = require("sqlite3");
const path_1 = require("path");
const url_1 = require("url");
const __dirname = (0, path_1.dirname)((0, url_1.fileURLToPath)(import.meta.url));
const dbPath = (0, path_1.join)(__dirname, '../data/database.sqlite');
exports.db = new sqlite3_1.default.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
    }
    else {
        console.log('Connected to SQLite database');
    }
});
const initDatabase = () => {
    const createTables = `
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      device_model TEXT NOT NULL,
      serial_number TEXT,
      issue_description TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_by TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inspections (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      technician_id TEXT NOT NULL,
      technician_name TEXT NOT NULL,
      appearance_condition TEXT NOT NULL,
      screen_condition TEXT NOT NULL,
      battery_condition TEXT NOT NULL,
      accessories TEXT,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS warranties (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      manager_id TEXT NOT NULL,
      manager_name TEXT NOT NULL,
      warranty_type TEXT NOT NULL,
      warranty_period INTEGER NOT NULL,
      responsibility TEXT NOT NULL,
      approved BOOLEAN NOT NULL DEFAULT 0,
      approved_at DATETIME,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS inspection_photos (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      file_path TEXT NOT NULL,
      description TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS spare_parts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      location TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS spare_part_usages (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      spare_part_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      used_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (spare_part_id) REFERENCES spare_parts(id)
    );
  `;
    exports.db.exec(createTables, (err) => {
        if (err) {
            console.error('Error creating tables:', err);
        }
        else {
            console.log('Tables created successfully');
        }
    });
};
exports.initDatabase = initDatabase;
const insertSampleData = () => {
    const sampleOrders = [
        {
            id: 'ORD-001',
            customer_name: '张三',
            phone: '13800138001',
            device_model: 'iPhone 15 Pro',
            serial_number: 'F19P2X3Q4R5S',
            issue_description: '屏幕出现竖线，触控不灵敏',
            status: 'completed',
            created_by: '前台-王芳',
            created_at: '2026-01-10 09:30:00',
            updated_at: '2026-01-12 16:00:00'
        },
        {
            id: 'ORD-002',
            customer_name: '李四',
            phone: '13900139002',
            device_model: '华为 Mate60 Pro',
            serial_number: 'HW20260105002',
            issue_description: '电池鼓包，续航严重下降',
            status: 'warranty_pending',
            created_by: '前台-王芳',
            created_at: '2026-01-12 10:15:00',
            updated_at: '2026-01-12 15:30:00'
        },
        {
            id: 'ORD-003',
            customer_name: '王五',
            phone: '13700137003',
            device_model: '小米14 Ultra',
            serial_number: 'MI20260108003',
            issue_description: '后置摄像头无法对焦',
            status: 'inspection_pending',
            created_by: '前台-李明',
            created_at: '2026-01-13 08:45:00',
            updated_at: '2026-01-13 08:45:00'
        },
        {
            id: 'ORD-004',
            customer_name: '赵六',
            phone: '13600136004',
            device_model: 'OPPO Find X7',
            serial_number: 'OP20260110004',
            issue_description: '充电接口松动，无法快充',
            status: 'repairing',
            created_by: '前台-李明',
            created_at: '2026-01-14 11:00:00',
            updated_at: '2026-01-14 14:00:00'
        },
        {
            id: 'ORD-005',
            customer_name: '钱七',
            phone: '13500135005',
            device_model: 'vivo X100 Pro',
            serial_number: 'VV20260111005',
            issue_description: '扬声器有杂音，通话声音小',
            status: 'pending',
            created_by: '前台-王芳',
            created_at: '2026-01-15 09:00:00',
            updated_at: '2026-01-15 09:00:00'
        }
    ];
    const sampleInspections = [
        {
            id: 'INS-001',
            order_id: 'ORD-001',
            technician_id: 'tech-001',
            technician_name: '维修师-刘强',
            appearance_condition: '良好',
            screen_condition: '有竖线',
            battery_condition: '正常',
            accessories: '原装充电器、数据线',
            description: '屏幕显示异常，触控IC故障，需要更换屏幕总成',
            status: 'approved',
            created_at: '2026-01-10 10:30:00'
        },
        {
            id: 'INS-002',
            order_id: 'ORD-002',
            technician_id: 'tech-002',
            technician_name: '维修师-陈刚',
            appearance_condition: '轻微划痕',
            screen_condition: '正常',
            battery_condition: '鼓包严重',
            accessories: '无配件',
            description: '电池严重鼓包，存在安全隐患，需要立即更换电池',
            status: 'approved',
            created_at: '2026-01-12 14:00:00'
        },
        {
            id: 'INS-003',
            order_id: 'ORD-004',
            technician_id: 'tech-001',
            technician_name: '维修师-刘强',
            appearance_condition: '良好',
            screen_condition: '正常',
            battery_condition: '正常',
            accessories: '原装充电器',
            description: '充电接口针脚氧化，需要更换充电口',
            status: 'approved',
            created_at: '2026-01-14 13:00:00'
        }
    ];
    const sampleWarranties = [
        {
            id: 'WAR-001',
            order_id: 'ORD-001',
            manager_id: 'mgr-001',
            manager_name: '店长-张伟',
            warranty_type: '厂家保修',
            warranty_period: 90,
            responsibility: '厂家负责',
            approved: 1,
            approved_at: '2026-01-10 11:00:00',
            created_at: '2026-01-10 10:45:00'
        }
    ];
    const sampleNotes = [
        { id: 'NT-001', order_id: 'ORD-001', user_id: 'front-001', user_name: '前台-王芳', content: '客户描述屏幕在使用中突然出现竖线', created_at: '2026-01-10 09:35:00' },
        { id: 'NT-002', order_id: 'ORD-001', user_id: 'tech-001', user_name: '维修师-刘强', content: '初步检测为触控IC问题，已提交质检报告', created_at: '2026-01-10 10:30:00' },
        { id: 'NT-003', order_id: 'ORD-001', user_id: 'mgr-001', user_name: '店长-张伟', content: '已确认厂家保修，安排更换屏幕', created_at: '2026-01-10 11:00:00' },
        { id: 'NT-004', order_id: 'ORD-001', user_id: 'tech-001', user_name: '维修师-刘强', content: '屏幕更换完成，测试正常', created_at: '2026-01-12 15:30:00' },
        { id: 'NT-005', order_id: 'ORD-001', user_id: 'front-001', user_name: '前台-王芳', content: '已通知客户取机', created_at: '2026-01-12 16:00:00' },
        { id: 'NT-006', order_id: 'ORD-002', user_id: 'front-001', user_name: '前台-王芳', content: '客户反映电池使用不到半天就没电', created_at: '2026-01-12 10:20:00' },
        { id: 'NT-007', order_id: 'ORD-002', user_id: 'tech-002', user_name: '维修师-陈刚', content: '电池鼓包明显，建议立即更换', created_at: '2026-01-12 14:00:00' },
        { id: 'NT-008', order_id: 'ORD-003', user_id: 'front-002', user_name: '前台-李明', content: '客户刚买的新机，摄像头有问题', created_at: '2026-01-13 08:50:00' },
        { id: 'NT-009', order_id: 'ORD-004', user_id: 'tech-001', user_name: '维修师-刘强', content: '正在更换充电接口，预计半小时完成', created_at: '2026-01-14 14:00:00' },
        { id: 'NT-010', order_id: 'ORD-005', user_id: 'front-001', user_name: '前台-王芳', content: '等待维修师接单', created_at: '2026-01-15 09:05:00' }
    ];
    const samplePhotos = [
        { id: 'PH-001', order_id: 'ORD-001', file_path: '/uploads/ORD-001-1.jpg', description: '屏幕竖线问题', created_at: '2026-01-10 10:20:00' },
        { id: 'PH-002', order_id: 'ORD-001', file_path: '/uploads/ORD-001-2.jpg', description: '设备外观', created_at: '2026-01-10 10:22:00' },
        { id: 'PH-003', order_id: 'ORD-002', file_path: '/uploads/ORD-002-1.jpg', description: '电池鼓包', created_at: '2026-01-12 13:50:00' },
        { id: 'PH-004', order_id: 'ORD-004', file_path: '/uploads/ORD-004-1.jpg', description: '充电接口', created_at: '2026-01-14 12:50:00' }
    ];
    const sampleSpareParts = [
        { id: 'SP-001', name: 'iPhone 15 Pro 屏幕总成', sku: 'IP15-PRO-SCREEN', quantity: 10, location: 'A区-01', created_at: '2026-01-01 00:00:00', updated_at: '2026-01-10 15:00:00' },
        { id: 'SP-002', name: '华为 Mate60 Pro 电池', sku: 'HW-MATE60-BATT', quantity: 8, location: 'A区-02', created_at: '2026-01-01 00:00:00', updated_at: '2026-01-12 16:00:00' },
        { id: 'SP-003', name: '充电接口-通用', sku: 'USB-C-PORT', quantity: 50, location: 'B区-01', created_at: '2026-01-01 00:00:00', updated_at: '2026-01-14 14:00:00' },
        { id: 'SP-004', name: '小米14 Ultra 摄像头模组', sku: 'MI14-ULTRA-CAM', quantity: 5, location: 'A区-03', created_at: '2026-01-05 00:00:00', updated_at: '2026-01-05 00:00:00' },
        { id: 'SP-005', name: 'vivo X100 Pro 扬声器', sku: 'VIVOX100-SPK', quantity: 12, location: 'B区-02', created_at: '2026-01-01 00:00:00', updated_at: '2026-01-01 00:00:00' }
    ];
    return new Promise((resolve) => {
        exports.db.run('DELETE FROM spare_part_usages');
        exports.db.run('DELETE FROM spare_parts');
        exports.db.run('DELETE FROM inspection_photos');
        exports.db.run('DELETE FROM notes');
        exports.db.run('DELETE FROM warranties');
        exports.db.run('DELETE FROM inspections');
        exports.db.run('DELETE FROM orders', () => {
            sampleOrders.forEach(order => {
                exports.db.run('INSERT INTO orders (id, customer_name, phone, device_model, serial_number, issue_description, status, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [order.id, order.customer_name, order.phone, order.device_model, order.serial_number, order.issue_description, order.status, order.created_by, order.created_at, order.updated_at]);
            });
            sampleInspections.forEach(inspection => {
                exports.db.run('INSERT INTO inspections (id, order_id, technician_id, technician_name, appearance_condition, screen_condition, battery_condition, accessories, description, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [inspection.id, inspection.order_id, inspection.technician_id, inspection.technician_name, inspection.appearance_condition, inspection.screen_condition, inspection.battery_condition, inspection.accessories, inspection.description, inspection.status, inspection.created_at]);
            });
            sampleWarranties.forEach(warranty => {
                exports.db.run('INSERT INTO warranties (id, order_id, manager_id, manager_name, warranty_type, warranty_period, responsibility, approved, approved_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [warranty.id, warranty.order_id, warranty.manager_id, warranty.manager_name, warranty.warranty_type, warranty.warranty_period, warranty.responsibility, warranty.approved, warranty.approved_at, warranty.created_at]);
            });
            sampleNotes.forEach(note => {
                exports.db.run('INSERT INTO notes (id, order_id, user_id, user_name, content, created_at) VALUES (?, ?, ?, ?, ?, ?)', [note.id, note.order_id, note.user_id, note.user_name, note.content, note.created_at]);
            });
            samplePhotos.forEach(photo => {
                exports.db.run('INSERT INTO inspection_photos (id, order_id, file_path, description, created_at) VALUES (?, ?, ?, ?, ?)', [photo.id, photo.order_id, photo.file_path, photo.description, photo.created_at]);
            });
            sampleSpareParts.forEach(part => {
                exports.db.run('INSERT INTO spare_parts (id, name, sku, quantity, location, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)', [part.id, part.name, part.sku, part.quantity, part.location, part.created_at, part.updated_at]);
            });
            setTimeout(() => {
                console.log('Sample data inserted');
                resolve();
            }, 100);
        });
    });
};
exports.insertSampleData = insertSampleData;
