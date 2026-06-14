import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import * as fs from 'fs';
import * as path from 'path';

export interface User {
  id: number;
  username: string;
  password: string;
  role: 'lobby_manager' | 'account_manager' | 'operation_manager';
  display_name: string;
  created_at: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  business_type: string;
  urgency: 'normal' | 'urgent' | 'vip';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  assigned_to: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerDocument {
  id: number;
  customer_id: number;
  document_type: string;
  file_name: string;
  file_size: number;
  file_type: string;
  status: 'pending' | 'uploaded' | 'approved' | 'rejected';
  notes: string;
  created_at: string;
}

export interface DueDiligence {
  id: number;
  customer_id: number;
  source_customer_id: number;
  inherited_notes: string;
  processing_notes: string;
  status: 'pending' | 'processing' | 'submitted' | 'completed' | 'rejected';
  assigned_to: number;
  created_at: string;
  updated_at: string;
}

export interface DueDiligenceAttachment {
  id: number;
  due_diligence_id: number;
  file_name: string;
  file_size: number;
  file_type: string;
  notes: string;
  created_at: string;
}

export interface Handoff {
  id: number;
  type: 'shift' | 'task';
  from_user: number;
  to_user: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  confirmed_at: string;
}

export interface HandoffTask {
  id: number;
  handoff_id: number;
  task_type: 'customer' | 'due_diligence';
  task_id: number;
  task_description: string;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  is_read: number;
  created_at: string;
}

let db: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (db) return db;

  const dbDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, 'bank_system.db');
  
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL CHECK(role IN ('lobby_manager', 'account_manager', 'operation_manager')),
      display_name VARCHAR(100) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(20),
      business_type VARCHAR(50) NOT NULL,
      urgency VARCHAR(20) DEFAULT 'normal' CHECK(urgency IN ('normal', 'urgent', 'vip')),
      status VARCHAR(30) DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'rejected')),
      assigned_to INTEGER REFERENCES users(id),
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS customer_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      document_type VARCHAR(50) NOT NULL,
      file_name VARCHAR(255),
      file_size INTEGER,
      file_type VARCHAR(50),
      status VARCHAR(20) DEFAULT 'pending' CHECK(status IN ('pending', 'uploaded', 'approved', 'rejected')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS due_diligences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      source_customer_id INTEGER,
      inherited_notes TEXT,
      processing_notes TEXT,
      status VARCHAR(20) DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'submitted', 'completed', 'rejected')),
      assigned_to INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.exec(`
    ALTER TABLE due_diligences ADD COLUMN IF NOT EXISTS processing_notes TEXT;
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS due_diligence_attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      due_diligence_id INTEGER NOT NULL REFERENCES due_diligences(id),
      file_name VARCHAR(255) NOT NULL,
      file_size INTEGER,
      file_type VARCHAR(50),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS handoffs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type VARCHAR(20) DEFAULT 'shift' CHECK(type IN ('shift', 'task')),
      from_user INTEGER NOT NULL REFERENCES users(id),
      to_user INTEGER NOT NULL REFERENCES users(id),
      status VARCHAR(20) DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'cancelled')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      confirmed_at DATETIME
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS handoff_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      handoff_id INTEGER NOT NULL REFERENCES handoffs(id),
      task_type VARCHAR(30) NOT NULL,
      task_id INTEGER NOT NULL,
      task_description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      type VARCHAR(30) NOT NULL,
      title VARCHAR(100) NOT NULL,
      message TEXT,
      is_read BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const userCount = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM users');
  if (userCount && userCount.count === 0) {
    await db.run(`
      INSERT INTO users (username, password, role, display_name) VALUES
      ('lobby_mgr', 'password123', 'lobby_manager', '张大堂'),
      ('account_mgr', 'password123', 'account_manager', '李经理'),
      ('operation_mgr', 'password123', 'operation_manager', '王主管');
    `);

    const businessTypes = ['开户', '转账', '贷款申请', '信用卡办理', '理财咨询', '挂失补办', '信息变更'];
    const statuses = ['pending', 'processing', 'completed', 'rejected'];
    const urgencies = ['normal', 'urgent', 'vip'];
    const names = [
      '张伟', '王芳', '李明', '刘洋', '陈静',
      '杨帆', '赵磊', '周婷', '吴强', '郑雪'
    ];

    for (let i = 0; i < 10; i++) {
      const name = names[i];
      const phone = `138${String(10000000 + i).slice(-8)}`;
      const businessType = businessTypes[i % businessTypes.length];
      const urgency = urgencies[i % urgencies.length];
      const status = statuses[i % statuses.length];
      const assignedTo = (i % 3) + 1;
      const createdBy = 1;

      const result = await db.run(
        'INSERT INTO customers (name, phone, business_type, urgency, status, assigned_to, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, phone, businessType, urgency, status, assignedTo, createdBy]
      );

      const customerId = result.lastID;

      const docTypes = ['身份证', '营业执照', '财务报表', '授权委托书'];
      for (let j = 0; j < 3; j++) {
        const docType = docTypes[(i + j) % docTypes.length];
        const docStatus = statuses[j % statuses.length];
        await db.run(
          'INSERT INTO customer_documents (customer_id, document_type, status, notes) VALUES (?, ?, ?, ?)',
          [customerId, docType, docStatus, j === 0 ? `客户${name}的${docType}已审核` : '']
        );
      }

      if (status === 'completed') {
        await db.run(
          'INSERT INTO due_diligences (customer_id, source_customer_id, inherited_notes, status, assigned_to) VALUES (?, ?, ?, ?, ?)',
          [customerId, customerId, `来自客户资料处理备注：${name}的${businessType}业务已完成初步审核，需进一步核实财务状况`, 'completed', assignedTo]
        );
      }
    }
  }

  return db;
}

export async function addNotification(userId: number, type: string, title: string, message: string) {
  const database = await getDatabase();
  await database.run(
    'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
    [userId, type, title, message]
  );
}
