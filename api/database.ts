import sqlite3 from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Order, Addon, Damage, Expense, OperationLog, Exception } from '../src/types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../data/database.sqlite');

let initCallback: (() => void) | null = null;
let isInitialized = false;

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    initDatabase();
  }
});

export function onInit(callback: () => void) {
  if (isInitialized) {
    callback();
  } else {
    initCallback = callback;
  }
}

function initDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address_from TEXT NOT NULL,
      address_to TEXT NOT NULL,
      scheduled_time DATETIME NOT NULL,
      status TEXT NOT NULL DEFAULT 'reserved',
      vehicle_id TEXT,
      driver_name TEXT,
      base_fee DECIMAL(10, 2) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS addons (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      type TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price DECIMAL(10, 2) NOT NULL,
      description TEXT,
      operator_id TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS damages (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      description TEXT NOT NULL,
      value DECIMAL(10, 2) NOT NULL,
      responsibility TEXT NOT NULL,
      photos TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      base_fee DECIMAL(10, 2) NOT NULL,
      addon_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
      damage_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
      total_fee DECIMAL(10, 2) NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      confirmed_at DATETIME,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      action TEXT NOT NULL,
      operator TEXT NOT NULL,
      timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      details TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS exceptions (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'warning',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      resolved BOOLEAN NOT NULL DEFAULT 0,
      resolved_at DATETIME,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )
  `, () => {
    insertSampleData();
    isInitialized = true;
    if (initCallback) {
      initCallback();
    }
  });
}

function insertSampleData() {
  db.get('SELECT COUNT(*) as count FROM orders', (err, row) => {
    if (err) {
      console.error('Error checking orders:', err);
      return;
    }
    if ((row as { count: number }).count === 0) {
      const now = new Date();
      const sampleOrders: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>[] = [
        {
          customerName: '张三',
          phone: '13800138001',
          addressFrom: '北京市朝阳区望京SOHO',
          addressTo: '北京市海淀区中关村',
          scheduledTime: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
          status: 'serving',
          vehicleId: 'V001',
          driverName: '李司机',
          baseFee: 800,
        },
        {
          customerName: '李四',
          phone: '13800138002',
          addressFrom: '上海市浦东新区陆家嘴',
          addressTo: '上海市静安区南京西路',
          scheduledTime: new Date(now.getTime() + 15 * 60 * 1000).toISOString(),
          status: 'reserved',
          baseFee: 600,
        },
        {
          customerName: '王五',
          phone: '13800138003',
          addressFrom: '广州市天河区珠江新城',
          addressTo: '广州市越秀区北京路',
          scheduledTime: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          vehicleId: 'V002',
          driverName: '王司机',
          baseFee: 500,
        },
        {
          customerName: '赵六',
          phone: '13800138004',
          addressFrom: '深圳市南山区科技园',
          addressTo: '深圳市福田区CBD',
          scheduledTime: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
          status: 'transporting',
          vehicleId: 'V003',
          driverName: '张司机',
          baseFee: 700,
        },
        {
          customerName: '钱七',
          phone: '13800138005',
          addressFrom: '杭州市西湖区文三路',
          addressTo: '杭州市滨江区星光大道',
          scheduledTime: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
          status: 'settling',
          vehicleId: 'V004',
          driverName: '刘司机',
          baseFee: 400,
        },
        {
          customerName: '孙八',
          phone: '13800138006',
          addressFrom: '成都市锦江区春熙路',
          addressTo: '成都市武侯区武侯祠',
          scheduledTime: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          status: 'serving',
          vehicleId: 'V005',
          driverName: '陈司机',
          baseFee: 550,
        },
        {
          customerName: '周九',
          phone: '13800138007',
          addressFrom: '武汉市江汉区江汉路',
          addressTo: '武汉市武昌区黄鹤楼',
          scheduledTime: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
          status: 'dispute',
          vehicleId: 'V006',
          driverName: '杨司机',
          baseFee: 650,
        },
        {
          customerName: '吴十',
          phone: '13800138008',
          addressFrom: '西安市碑林区钟楼',
          addressTo: '西安市雁塔区大雁塔',
          scheduledTime: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
          status: 'serving',
          vehicleId: 'V007',
          driverName: '黄司机',
          baseFee: 480,
        },
      ];

      const orderIds: string[] = [];

      sampleOrders.forEach((order) => {
        const id = uuidv4();
        orderIds.push(id);
        db.run(
          `INSERT INTO orders (id, customer_name, phone, address_from, address_to, scheduled_time, status, vehicle_id, driver_name, base_fee, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            order.customerName,
            order.phone,
            order.addressFrom,
            order.addressTo,
            order.scheduledTime,
            order.status,
            order.vehicleId,
            order.driverName,
            order.baseFee,
            now.toISOString(),
            now.toISOString(),
          ]
        );

        if (order.status === 'pending') {
          db.run(
            `INSERT INTO addons (id, order_id, type, quantity, unit_price, description, operator_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [uuidv4(), id, '搬运钢琴', 1, 300, '大型钢琴搬运', 'OP001', now.toISOString()]
          );

          db.run(
            `INSERT INTO expenses (id, order_id, base_fee, addon_fee, damage_fee, total_fee, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [uuidv4(), id, 500, 300, 0, 800, 'pending']
          );
        }

        if (order.status === 'serving') {
          db.run(
            `INSERT INTO addons (id, order_id, type, quantity, unit_price, description, operator_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [uuidv4(), id, '爬楼费', 3, 50, '3层楼梯搬运', 'OP002', now.toISOString()]
          );
        }

        if (order.status === 'settling') {
          db.run(
            `INSERT INTO expenses (id, order_id, base_fee, addon_fee, damage_fee, total_fee, status, confirmed_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [uuidv4(), id, 400, 100, 50, 450, 'approved', now.toISOString()]
          );
        }

        if (order.status === 'dispute') {
          db.run(
            `INSERT INTO damages (id, order_id, description, value, responsibility, photos, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [uuidv4(), id, '电视机屏幕破损', 2000, '我方责任', '[]', now.toISOString()]
          );
        }

        db.run(
          `INSERT INTO logs (id, order_id, action, operator, timestamp, details)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [uuidv4(), id, '创建订单', '系统', now.toISOString(), '订单已创建']
        );

        if (order.vehicleId) {
          db.run(
            `INSERT INTO logs (id, order_id, action, operator, timestamp, details)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [uuidv4(), id, '分配车辆', '调度员', now.toISOString(), `车辆: ${order.vehicleId}, 司机: ${order.driverName}`]
          );
        }
      });

      db.run(
        `INSERT INTO exceptions (id, order_id, type, message, severity, created_at, resolved)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), orderIds[0], 'late', '车辆迟到超过30分钟', 'critical', new Date(now.getTime() - 30 * 60 * 1000).toISOString(), 0]
      );

      db.run(
        `INSERT INTO exceptions (id, order_id, type, message, severity, created_at, resolved)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), orderIds[2], 'unconfirmed', '费用待确认超过2小时', 'error', new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), 0]
      );

      db.run(
        `INSERT INTO exceptions (id, order_id, type, message, severity, created_at, resolved)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), orderIds[3], 'late', '车辆迟到超过45分钟', 'critical', new Date(now.getTime() - 45 * 60 * 1000).toISOString(), 0]
      );

      db.run(
        `INSERT INTO exceptions (id, order_id, type, message, severity, created_at, resolved)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), orderIds[6], 'damage', '客户投诉物品破损，金额2000元', 'error', new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), 0]
      );

      db.run(
        `INSERT INTO exceptions (id, order_id, type, message, severity, created_at, resolved)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), orderIds[6], 'dispute', '客户拒绝支付，存在纠纷', 'critical', new Date(now.getTime() - 30 * 60 * 1000).toISOString(), 0]
      );

      console.log('Sample data inserted successfully');
    }
  });
}

export const dbOperations = {
  getAllOrders: (callback: (err: Error | null, orders?: Order[]) => void) => {
    db.all(
      'SELECT * FROM orders ORDER BY scheduled_time DESC',
      (err, rows: unknown[]) => {
        if (err) {
          callback(err);
        } else {
          const orders = rows.map((row) => {
            const r = row as Record<string, unknown>;
            return {
              id: r.id as string,
              customerName: r.customer_name as string,
              phone: r.phone as string,
              addressFrom: r.address_from as string,
              addressTo: r.address_to as string,
              scheduledTime: r.scheduled_time as string,
              status: r.status as Order['status'],
              vehicleId: r.vehicle_id as string,
              driverName: r.driver_name as string,
              baseFee: parseFloat(r.base_fee as string),
              createdAt: r.created_at as string,
              updatedAt: r.updated_at as string,
            };
          });
          callback(null, orders);
        }
      }
    );
  },

  getOrderById: (id: string, callback: (err: Error | null, order?: Order) => void) => {
    db.get(
      'SELECT * FROM orders WHERE id = ?',
      [id],
      (err, row) => {
        if (err) {
          callback(err);
        } else if (!row) {
          callback(null, undefined);
        } else {
          const r = row as Record<string, unknown>;
          const order: Order = {
            id: r.id as string,
            customerName: r.customer_name as string,
            phone: r.phone as string,
            addressFrom: r.address_from as string,
            addressTo: r.address_to as string,
            scheduledTime: r.scheduled_time as string,
            status: r.status as Order['status'],
            vehicleId: r.vehicle_id as string,
            driverName: r.driver_name as string,
            baseFee: parseFloat(r.base_fee as string),
            createdAt: r.created_at as string,
            updatedAt: r.updated_at as string,
          };
          callback(null, order);
        }
      }
    );
  },

  createOrder: (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>, callback: (err: Error | null, order?: Order) => void) => {
    const id = uuidv4();
    const now = new Date().toISOString();
    db.run(
      `INSERT INTO orders (id, customer_name, phone, address_from, address_to, scheduled_time, status, vehicle_id, driver_name, base_fee, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        orderData.customerName,
        orderData.phone,
        orderData.addressFrom,
        orderData.addressTo,
        orderData.scheduledTime,
        orderData.status,
        orderData.vehicleId,
        orderData.driverName,
        orderData.baseFee,
        now,
        now,
      ],
      (err) => {
        if (err) {
          callback(err);
        } else {
          dbOperations.getOrderById(id, callback);
        }
      }
    );
  },

  updateOrderStatus: (id: string, status: Order['status'], callback: (err: Error | null) => void) => {
    db.run(
      'UPDATE orders SET status = ?, updated_at = ? WHERE id = ?',
      [status, new Date().toISOString(), id],
      callback
    );
  },

  updateOrderVehicle: (id: string, vehicleId: string, driverName: string, callback: (err: Error | null) => void) => {
    db.run(
      'UPDATE orders SET vehicle_id = ?, driver_name = ?, status = ?, updated_at = ? WHERE id = ?',
      [vehicleId, driverName, 'transporting', new Date().toISOString(), id],
      callback
    );
  },

  getAllAddonsByOrderId: (orderId: string, callback: (err: Error | null, addons?: Addon[]) => void) => {
    db.all(
      'SELECT * FROM addons WHERE order_id = ? ORDER BY created_at DESC',
      [orderId],
      (err, rows: unknown[]) => {
        if (err) {
          callback(err);
        } else {
          const addons = rows.map((row) => {
            const r = row as Record<string, unknown>;
            return {
              id: r.id as string,
              orderId: r.order_id as string,
              type: r.type as string,
              quantity: r.quantity as number,
              unitPrice: parseFloat(r.unit_price as string),
              description: r.description as string,
              operatorId: r.operator_id as string,
              createdAt: r.created_at as string,
            };
          });
          callback(null, addons);
        }
      }
    );
  },

  createAddon: (addonData: Omit<Addon, 'id' | 'createdAt'>, callback: (err: Error | null, addon?: Addon) => void) => {
    const id = uuidv4();
    const now = new Date().toISOString();
    db.run(
      `INSERT INTO addons (id, order_id, type, quantity, unit_price, description, operator_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        addonData.orderId,
        addonData.type,
        addonData.quantity,
        addonData.unitPrice,
        addonData.description,
        addonData.operatorId,
        now,
      ],
      (err) => {
        if (err) {
          callback(err);
        } else {
          db.get(
            'SELECT * FROM addons WHERE id = ?',
            [id],
            (err, row) => {
              if (err) {
                callback(err);
              } else {
                const r = row as Record<string, unknown>;
                const addon: Addon = {
                  id: r.id as string,
                  orderId: r.order_id as string,
                  type: r.type as string,
                  quantity: r.quantity as number,
                  unitPrice: parseFloat(r.unit_price as string),
                  description: r.description as string,
                  operatorId: r.operator_id as string,
                  createdAt: r.created_at as string,
                };
                callback(null, addon);
              }
            }
          );
        }
      }
    );
  },

  getAllDamagesByOrderId: (orderId: string, callback: (err: Error | null, damages?: Damage[]) => void) => {
    db.all(
      'SELECT * FROM damages WHERE order_id = ? ORDER BY created_at DESC',
      [orderId],
      (err, rows: unknown[]) => {
        if (err) {
          callback(err);
        } else {
          const damages = rows.map((row) => {
            const r = row as Record<string, unknown>;
            return {
              id: r.id as string,
              orderId: r.order_id as string,
              description: r.description as string,
              value: parseFloat(r.value as string),
              responsibility: r.responsibility as string,
              photos: r.photos ? JSON.parse(r.photos as string) : [],
              createdAt: r.created_at as string,
            };
          });
          callback(null, damages);
        }
      }
    );
  },

  createDamage: (damageData: Omit<Damage, 'id' | 'createdAt'>, callback: (err: Error | null, damage?: Damage) => void) => {
    const id = uuidv4();
    const now = new Date().toISOString();
    db.run(
      `INSERT INTO damages (id, order_id, description, value, responsibility, photos, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        damageData.orderId,
        damageData.description,
        damageData.value,
        damageData.responsibility,
        JSON.stringify(damageData.photos),
        now,
      ],
      (err) => {
        if (err) {
          callback(err);
        } else {
          db.get(
            'SELECT * FROM damages WHERE id = ?',
            [id],
            (err, row) => {
              if (err) {
                callback(err);
              } else {
                const r = row as Record<string, unknown>;
                const damage: Damage = {
                  id: r.id as string,
                  orderId: r.order_id as string,
                  description: r.description as string,
                  value: parseFloat(r.value as string),
                  responsibility: r.responsibility as string,
                  photos: r.photos ? JSON.parse(r.photos as string) : [],
                  createdAt: r.created_at as string,
                };
                callback(null, damage);
              }
            }
          );
        }
      }
    );
  },

  getExpensesByOrderId: (orderId: string, callback: (err: Error | null, expense?: Expense) => void) => {
    db.get(
      'SELECT * FROM expenses WHERE order_id = ?',
      [orderId],
      (err, row) => {
        if (err) {
          callback(err);
        } else if (!row) {
          callback(null, undefined);
        } else {
          const r = row as Record<string, unknown>;
          const expense: Expense = {
            id: r.id as string,
            orderId: r.order_id as string,
            baseFee: parseFloat(r.base_fee as string),
            addonFee: parseFloat(r.addon_fee as string),
            damageFee: parseFloat(r.damage_fee as string),
            totalFee: parseFloat(r.total_fee as string),
            status: r.status as Expense['status'],
            confirmedAt: r.confirmed_at as string,
          };
          callback(null, expense);
        }
      }
    );
  },

  createOrUpdateExpenses: (expenseData: Omit<Expense, 'id'>, callback: (err: Error | null, expense?: Expense) => void) => {
    db.get(
      'SELECT * FROM expenses WHERE order_id = ?',
      [expenseData.orderId],
      (err, row) => {
        if (err) {
          callback(err);
        } else if (row) {
          const r = row as Record<string, unknown>;
          db.run(
            'UPDATE expenses SET base_fee = ?, addon_fee = ?, damage_fee = ?, total_fee = ?, status = ?, confirmed_at = ? WHERE id = ?',
            [
              expenseData.baseFee,
              expenseData.addonFee,
              expenseData.damageFee,
              expenseData.totalFee,
              expenseData.status,
              expenseData.confirmedAt,
              r.id,
            ],
            (err) => {
              if (err) {
                callback(err);
              } else {
                dbOperations.getExpensesByOrderId(expenseData.orderId, callback);
              }
            }
          );
        } else {
          const id = uuidv4();
          db.run(
            `INSERT INTO expenses (id, order_id, base_fee, addon_fee, damage_fee, total_fee, status, confirmed_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              expenseData.orderId,
              expenseData.baseFee,
              expenseData.addonFee,
              expenseData.damageFee,
              expenseData.totalFee,
              expenseData.status,
              expenseData.confirmedAt,
            ],
            (err) => {
              if (err) {
                callback(err);
              } else {
                dbOperations.getExpensesByOrderId(expenseData.orderId, callback);
              }
            }
          );
        }
      }
    );
  },

  getAllLogsByOrderId: (orderId: string, callback: (err: Error | null, logs?: OperationLog[]) => void) => {
    db.all(
      'SELECT * FROM logs WHERE order_id = ? ORDER BY timestamp DESC',
      [orderId],
      (err, rows: unknown[]) => {
        if (err) {
          callback(err);
        } else {
          const logs = rows.map((row) => {
            const r = row as Record<string, unknown>;
            return {
              id: r.id as string,
              orderId: r.order_id as string,
              action: r.action as string,
              operator: r.operator as string,
              timestamp: r.timestamp as string,
              details: r.details as string,
            };
          });
          callback(null, logs);
        }
      }
    );
  },

  createLog: (logData: Omit<OperationLog, 'id' | 'timestamp'>, callback: (err: Error | null) => void) => {
    const id = uuidv4();
    const now = new Date().toISOString();
    db.run(
      `INSERT INTO logs (id, order_id, action, operator, timestamp, details)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, logData.orderId, logData.action, logData.operator, now, logData.details],
      callback
    );
  },

  getAllExceptions: (callback: (err: Error | null, exceptions?: Exception[]) => void) => {
    db.all(
      'SELECT * FROM exceptions WHERE resolved = 0 ORDER BY severity DESC, created_at DESC',
      (err, rows: unknown[]) => {
        if (err) {
          callback(err);
        } else {
          const exceptions = rows.map((row) => {
            const r = row as Record<string, unknown>;
            return {
              id: r.id as string,
              orderId: r.order_id as string,
              type: r.type as Exception['type'],
              message: r.message as string,
              severity: r.severity as Exception['severity'],
              createdAt: r.created_at as string,
              resolved: r.resolved === 1,
              resolvedAt: r.resolved_at as string,
            };
          });
          callback(null, exceptions);
        }
      }
    );
  },

  createException: (exceptionData: Omit<Exception, 'id' | 'createdAt' | 'resolved' | 'resolvedAt'>, callback: (err: Error | null, exception?: Exception) => void) => {
    const id = uuidv4();
    const now = new Date().toISOString();
    db.run(
      `INSERT INTO exceptions (id, order_id, type, message, severity, created_at, resolved)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, exceptionData.orderId, exceptionData.type, exceptionData.message, exceptionData.severity, now, 0],
      (err) => {
        if (err) {
          callback(err);
        } else {
          const exception: Exception = {
            id,
            orderId: exceptionData.orderId,
            type: exceptionData.type,
            message: exceptionData.message,
            severity: exceptionData.severity,
            createdAt: now,
            resolved: false,
          };
          callback(null, exception);
        }
      }
    );
  },

  resolveException: (id: string, callback: (err: Error | null) => void) => {
    db.run(
      'UPDATE exceptions SET resolved = 1, resolved_at = ? WHERE id = ?',
      [new Date().toISOString(), id],
      callback
    );
  },
};

export default db;
