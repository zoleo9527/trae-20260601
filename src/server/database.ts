import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '../../data');
const dbPath = join(dataDir, 'restaurant.sqlite');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log('数据库连接成功');
    initDatabase();
  }
});

const initDatabase = () => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('manager', 'supervisor', 'purchaser')),
      store_name TEXT NOT NULL,
      region TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS dishes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      unit TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      safety_stock INTEGER NOT NULL DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS out_of_stock_records (
      id TEXT PRIMARY KEY,
      dish_id TEXT NOT NULL,
      dish_name TEXT NOT NULL,
      store_id TEXT NOT NULL,
      store_name TEXT NOT NULL,
      region TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      reason TEXT NOT NULL,
      remark TEXT,
      status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected', 'replenished', 'closed')),
      submitter_id TEXT NOT NULL,
      submitter_name TEXT NOT NULL,
      submit_time TEXT NOT NULL,
      approver_id TEXT,
      approver_name TEXT,
      approve_time TEXT,
      reject_reason TEXT,
      replenish_order_id TEXT,
      close_time TEXT,
      FOREIGN KEY (dish_id) REFERENCES dishes(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS replenish_orders (
      id TEXT PRIMARY KEY,
      out_of_stock_id TEXT NOT NULL,
      dish_id TEXT NOT NULL,
      dish_name TEXT NOT NULL,
      store_id TEXT NOT NULL,
      store_name TEXT NOT NULL,
      region TEXT NOT NULL,
      requested_quantity INTEGER NOT NULL,
      actual_quantity INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
      remark TEXT,
      submitter_id TEXT NOT NULL,
      submitter_name TEXT NOT NULL,
      submit_time TEXT NOT NULL,
      confirmer_id TEXT,
      confirmer_name TEXT,
      confirm_time TEXT,
      completion_time TEXT,
      cancel_reason TEXT,
      FOREIGN KEY (out_of_stock_id) REFERENCES out_of_stock_records(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS operation_logs (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('out_of_stock', 'replenish')),
      target_id TEXT NOT NULL,
      action TEXT NOT NULL,
      operator_id TEXT NOT NULL,
      operator_name TEXT NOT NULL,
      operator_role TEXT NOT NULL,
      store_name TEXT NOT NULL,
      region TEXT NOT NULL,
      detail TEXT NOT NULL,
      operation_time TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      region TEXT NOT NULL
    )
  `);

  insertInitialData();
};

const insertInitialData = () => {
  db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
    if (!err && (row as { count: number }).count === 0) {
      db.run(`INSERT INTO users (id, name, role, store_name, region) VALUES 
        ('u1', '张三', 'manager', '北京朝阳店', '华北区'),
        ('u2', '李四', 'supervisor', '区域督导', '华北区'),
        ('u3', '王五', 'purchaser', '采购部', '总部'),
        ('u4', '赵六', 'manager', '北京海淀店', '华北区'),
        ('u5', '钱七', 'supervisor', '区域督导', '华东区')
      `);
    }
  });

  db.get('SELECT COUNT(*) as count FROM dishes', (err, row) => {
    if (!err && (row as { count: number }).count === 0) {
      db.run(`INSERT INTO dishes (id, name, category, unit, price, stock, safety_stock) VALUES 
        ('d1', '宫保鸡丁', '热菜', '份', 38, 20, 10),
        ('d2', '鱼香肉丝', '热菜', '份', 32, 15, 8),
        ('d3', '蒜蓉西兰花', '素菜', '份', 22, 25, 12),
        ('d4', '糖醋里脊', '热菜', '份', 42, 0, 10),
        ('d5', '麻婆豆腐', '热菜', '份', 28, 5, 8),
        ('d6', '清蒸鲈鱼', '海鲜', '条', 68, 0, 5),
        ('d7', '红烧肉', '热菜', '份', 48, 10, 6),
        ('d8', '炒时蔬', '素菜', '份', 18, 30, 15)
      `);
    }
  });

  db.get('SELECT COUNT(*) as count FROM stores', (err, row) => {
    if (!err && (row as { count: number }).count === 0) {
      db.run(`INSERT INTO stores (id, name, region) VALUES 
        ('s1', '北京朝阳店', '华北区'),
        ('s2', '北京海淀店', '华北区'),
        ('s3', '上海浦东店', '华东区'),
        ('s4', '广州天河店', '华南区')
      `);
    }
  });

  db.get('SELECT COUNT(*) as count FROM out_of_stock_records', (err, row) => {
    if (!err && (row as { count: number }).count === 0) {
      db.run(`INSERT INTO out_of_stock_records (id, dish_id, dish_name, store_id, store_name, region, quantity, reason, remark, status, submitter_id, submitter_name, submit_time, approver_id, approver_name, approve_time, reject_reason, replenish_order_id, close_time) VALUES 
        ('oos1', 'd4', '糖醋里脊', 's1', '北京朝阳店', '华北区', 15, '原材料短缺', '今日进货不足，预计明日到货', 'pending', 'u1', '张三', '2024-01-15 09:30:00', NULL, NULL, NULL, NULL, NULL, NULL),
        ('oos2', 'd6', '清蒸鲈鱼', 's1', '北京朝阳店', '华北区', 8, '供应商延迟', '水产供应商配送延迟，已联系加急', 'approved', 'u1', '张三', '2024-01-15 10:15:00', 'u2', '李四', '2024-01-15 11:00:00', NULL, 'r1', NULL),
        ('oos3', 'd5', '麻婆豆腐', 's2', '北京海淀店', '华北区', 10, '销量超出预期', '午市高峰期销量激增，库存见底', 'rejected', 'u4', '赵六', '2024-01-14 14:20:00', 'u2', '李四', '2024-01-14 15:30:00', '当前库存5份，未达到安全库存以下，暂不需要补货', NULL, NULL),
        ('oos4', 'd2', '鱼香肉丝', 's1', '北京朝阳店', '华北区', 5, '原材料质量问题', '今日采购的猪肉品质不佳，已退回', 'replenished', 'u1', '张三', '2024-01-13 08:45:00', 'u2', '李四', '2024-01-13 09:30:00', NULL, 'r2', NULL),
        ('oos5', 'd1', '宫保鸡丁', 's2', '北京海淀店', '华北区', 12, '原材料短缺', '花生库存不足', 'closed', 'u4', '赵六', '2024-01-12 11:00:00', 'u2', '李四', '2024-01-12 11:30:00', NULL, 'r3', '2024-01-12 16:00:00')
      `);
    }
  });

  db.get('SELECT COUNT(*) as count FROM replenish_orders', (err, row) => {
    if (!err && (row as { count: number }).count === 0) {
      db.run(`INSERT INTO replenish_orders (id, out_of_stock_id, dish_id, dish_name, store_id, store_name, region, requested_quantity, actual_quantity, status, remark, submitter_id, submitter_name, submit_time, confirmer_id, confirmer_name, confirm_time, completion_time, cancel_reason) VALUES 
        ('r1', 'oos2', 'd6', '清蒸鲈鱼', 's1', '北京朝阳店', '华北区', 8, 8, 'confirmed', '加急配送，优先处理', 'u2', '李四', '2024-01-15 11:05:00', 'u3', '王五', '2024-01-15 11:30:00', NULL, NULL),
        ('r2', 'oos4', 'd2', '鱼香肉丝', 's1', '北京朝阳店', '华北区', 5, 5, 'completed', '', 'u2', '李四', '2024-01-13 09:35:00', 'u3', '王五', '2024-01-13 10:00:00', '2024-01-13 14:00:00', NULL),
        ('r3', 'oos5', 'd1', '宫保鸡丁', 's2', '北京海淀店', '华北区', 12, 12, 'completed', '已送达门店', 'u2', '李四', '2024-01-12 11:35:00', 'u3', '王五', '2024-01-12 12:00:00', '2024-01-12 15:30:00', NULL)
      `);
    }
  });

  db.get('SELECT COUNT(*) as count FROM operation_logs', (err, row) => {
    if (!err && (row as { count: number }).count === 0) {
      db.run(`INSERT INTO operation_logs (id, type, target_id, action, operator_id, operator_name, operator_role, store_name, region, detail, operation_time) VALUES 
        ('log1', 'out_of_stock', 'oos1', '提交售罄申请', 'u1', '张三', '店长', '北京朝阳店', '华北区', '菜品：糖醋里脊，数量：15份，原因：原材料短缺，备注：今日进货不足，预计明日到货', '2024-01-15 09:30:00'),
        ('log2', 'out_of_stock', 'oos2', '提交售罄申请', 'u1', '张三', '店长', '北京朝阳店', '华北区', '菜品：清蒸鲈鱼，数量：8条，原因：供应商延迟，备注：水产供应商配送延迟，已联系加急', '2024-01-15 10:15:00'),
        ('log3', 'out_of_stock', 'oos2', '确认售罄申请', 'u2', '李四', '区域督导', '区域督导', '华北区', '同意北京朝阳店的清蒸鲈鱼售罄申请，已生成临时补货单', '2024-01-15 11:00:00'),
        ('log4', 'replenish', 'r1', '创建临时补货单', 'u2', '李四', '区域督导', '区域督导', '华北区', '为北京朝阳店创建清蒸鲈鱼补货单，数量：8条，备注：加急配送，优先处理', '2024-01-15 11:05:00'),
        ('log5', 'replenish', 'r1', '确认补货单', 'u3', '王五', '采购', '采购部', '总部', '确认北京朝阳店清蒸鲈鱼补货单，安排加急配送', '2024-01-15 11:30:00'),
        ('log6', 'out_of_stock', 'oos3', '驳回售罄申请', 'u2', '李四', '区域督导', '区域督导', '华北区', '驳回北京海淀店麻婆豆腐售罄申请，原因：当前库存5份，未达到安全库存以下，暂不需要补货', '2024-01-14 15:30:00')
      `);
    }
  });
};
