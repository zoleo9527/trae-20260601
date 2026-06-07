
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import type {
  User,
  UserRole,
  PromotionDisplay,
  InspectionRectification,
  Remark,
  OperationHistory,
} from '../../shared/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.db');
const database = new DatabaseSync(dbPath);

database.exec('PRAGMA journal_mode = WAL');
database.exec('PRAGMA foreign_keys = ON');

function createTables() {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      store_id TEXT,
      store_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS promotions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      store_id TEXT NOT NULL,
      store_name TEXT NOT NULL,
      product_specialist_id TEXT NOT NULL,
      product_specialist_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      deadline DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inspections (
      id TEXT PRIMARY KEY,
      promotion_id TEXT,
      promotion_title TEXT,
      store_id TEXT NOT NULL,
      store_name TEXT NOT NULL,
      supervisor_id TEXT NOT NULL,
      supervisor_name TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      requirement TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      deadline DATE NOT NULL,
      reject_count INTEGER DEFAULT 0,
      last_reject_reason TEXT,
      reply_content TEXT,
      reply_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS remarks (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL,
      source TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS operation_history (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL,
      source TEXT NOT NULL,
      action TEXT NOT NULL,
      description TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      reject_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_remarks_source ON remarks(source_id, source);
    CREATE INDEX IF NOT EXISTS idx_history_source ON operation_history(source_id, source);
    CREATE INDEX IF NOT EXISTS idx_inspections_promotion ON inspections(promotion_id);
  `);
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

function addOperationHistory(
  sourceId: string,
  source: 'promotion' | 'inspection',
  action: string,
  description: string,
  userId: string,
  userName: string,
  userRole: string,
  rejectReason?: string
) {
  const id = generateId();
  const stmt = database.prepare(`
    INSERT INTO operation_history (id, source_id, source, action, description, user_id, user_name, user_role, reject_reason, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, sourceId, source, action, description, userId, userName, userRole, rejectReason || null, new Date().toISOString());
}

function seedData() {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);

  const userCount = database.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) return;

  const insertUser = database.prepare(`
    INSERT INTO users (id, username, role, name, store_id, store_name)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertUser.run('u1', 'manager', 'store_manager', '张店长', 's1', '便利店-望京店');
  insertUser.run('u2', 'supervisor', 'supervisor', '李督导', null, null);
  insertUser.run('u3', 'specialist', 'product_specialist', '王专员', null, null);

  const insertPromotion = database.prepare(`
    INSERT INTO promotions (id, title, description, store_id, store_name, product_specialist_id, product_specialist_name, status, deadline, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertPromotion.run(
    'p1',
    '618夏季饮料堆头陈列',
    '入口处主通道堆头，可乐、雪碧、冰红茶各2层，搭配爆炸贴',
    's1',
    '便利店-望京店',
    'u3',
    '王专员',
    'processing',
    tomorrow.toISOString().split('T')[0],
    yesterday.toISOString()
  );
  insertPromotion.run(
    'p2',
    '冰淇淋新品端架陈列',
    '冷柜旁端架，梦龙、可爱多新品主打，配试吃盒',
    's1',
    '便利店-望京店',
    'u3',
    '王专员',
    'pending',
    nextWeek.toISOString().split('T')[0],
    now.toISOString()
  );
  insertPromotion.run(
    'p3',
    '日用品促销挂条陈列',
    '收银台旁挂条，牙膏、牙刷、纸巾组合装',
    's1',
    '便利店-望京店',
    'u3',
    '王专员',
    'has_issue',
    yesterday.toISOString().split('T')[0],
    threeDaysAgo.toISOString()
  );

  const insertInspection = database.prepare(`
    INSERT INTO inspections (id, promotion_id, promotion_title, store_id, store_name, supervisor_id, supervisor_name, title, description, requirement, status, deadline, reject_count, last_reject_reason, reply_content, reply_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertInspection.run(
    'i1',
    'p1',
    '618夏季饮料堆头陈列',
    's1',
    '便利店-望京店',
    'u2',
    '李督导',
    '饮料堆头陈列不规范',
    '巡店发现618饮料堆头缺少爆炸贴，可乐摆放位置错误，未按陈列图执行',
    '今天内补充爆炸贴，按照陈列图重新摆放，确保商品正面朝外',
    'rejected',
    tomorrow.toISOString().split('T')[0],
    1,
    '整改照片不清晰，爆炸贴位置仍然不对，重新整改',
    '已整改，爆炸贴已重新粘贴，请查看',
    oneHourAgo.toISOString(),
    yesterday.toISOString()
  );
  insertInspection.run(
    'i2',
    null,
    null,
    's1',
    '便利店-望京店',
    'u2',
    '李督导',
    '货架商品过期',
    'A3货架第2层有3包面包已过期2天，存在食品安全隐患',
    '立即下架所有过期商品，全面检查全店商品效期，提交检查报告',
    'reviewing',
    now.toISOString().split('T')[0],
    0,
    null,
    '已全部下架，完成全店效期检查，共发现并下架5件临期商品',
    oneHourAgo.toISOString(),
    twoHoursAgo.toISOString()
  );
  insertInspection.run(
    'i3',
    null,
    null,
    's1',
    '便利店-望京店',
    'u2',
    '李督导',
    '收银台卫生不达标',
    '收银台有污渍，POS机表面灰尘较多，垃圾桶未及时清理',
    '立即清洁，保持台面整洁，制定每小时清洁制度',
    'completed',
    yesterday.toISOString().split('T')[0],
    0,
    null,
    '已清洁完成，已制定收银台清洁检查表',
    twoHoursAgo.toISOString(),
    threeDaysAgo.toISOString()
  );
  insertInspection.run(
    'i4',
    'p3',
    '日用品促销挂条陈列',
    's1',
    '便利店-望京店',
    'u2',
    '李督导',
    '促销挂条位置错误',
    '日用品促销挂条未挂在收银台旁，被移到了角落，严重影响销售',
    '立即将挂条移回收银台旁显眼位置，确保顾客容易看到',
    'rejected',
    yesterday.toISOString().split('T')[0],
    2,
    '第二次退回：挂条仍然不在指定位置，店长请重视！',
    '已移动，请检查',
    new Date(threeDaysAgo.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    threeDaysAgo.toISOString()
  );
  insertInspection.run(
    'i5',
    'p2',
    '冰淇淋新品端架陈列',
    's1',
    '便利店-望京店',
    'u2',
    '李督导',
    '冰淇淋端架缺货',
    '巡店发现冰淇淋新品端架有2个空位，梦龙口味缺货，试吃盒为空',
    '立即补货，确保端架饱满，试吃盒随时有试吃品',
    'pending',
    tomorrow.toISOString().split('T')[0],
    0,
    null,
    null,
    null,
    now.toISOString()
  );

  const insertRemark = database.prepare(`
    INSERT INTO remarks (id, source_id, source, user_id, user_name, user_role, content, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertRemark.run(
    'r1',
    'p1',
    'promotion',
    'u3',
    '王专员',
    'product_specialist',
    '堆头位置选在入口主通道，注意保持通道畅通',
    yesterday.toISOString()
  );
  insertRemark.run(
    'r2',
    'p1',
    'promotion',
    'u1',
    '张店长',
    'store_manager',
    '已收到，今天下午安排店员执行',
    new Date(yesterday.getTime() + 2 * 60 * 60 * 1000).toISOString()
  );
  insertRemark.run(
    'r3',
    'i1',
    'inspection',
    'u2',
    '李督导',
    'supervisor',
    '这个问题和促销陈列p1直接相关，陈列图上周刚发过',
    yesterday.toISOString()
  );
  insertRemark.run(
    'r4',
    'i1',
    'inspection',
    'u1',
    '张店长',
    'store_manager',
    '已整改，照片已上传，请查看',
    oneHourAgo.toISOString()
  );

  const insertHistory = database.prepare(`
    INSERT INTO operation_history (id, source_id, source, action, description, user_id, user_name, user_role, reject_reason, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertHistory.run('h1', 'p1', 'promotion', 'create', '商品专员创建了促销陈列任务', 'u3', '王专员', 'product_specialist', null, yesterday.toISOString());
  insertHistory.run('h2', 'p1', 'promotion', 'status_update', '状态更新为「处理中」', 'u1', '张店长', 'store_manager', null, new Date(yesterday.getTime() + 4 * 60 * 60 * 1000).toISOString());
  insertHistory.run('h3', 'i1', 'inspection', 'create', '督导发起了巡店整改，关联促销陈列p1', 'u2', '李督导', 'supervisor', null, yesterday.toISOString());
  insertHistory.run('h4', 'i1', 'inspection', 'reply', '店长提交了整改回复，等待审核', 'u1', '张店长', 'store_manager', null, oneHourAgo.toISOString());
  insertHistory.run('h5', 'i1', 'inspection', 'status_update', '状态更新为「已退回」', 'u2', '李督导', 'supervisor', '整改照片不清晰，爆炸贴位置仍然不对，重新整改', new Date(oneHourAgo.getTime() + 30 * 60 * 1000).toISOString());
  insertHistory.run('h6', 'i3', 'inspection', 'create', '督导发起了巡店整改', 'u2', '李督导', 'supervisor', null, threeDaysAgo.toISOString());
  insertHistory.run('h7', 'i3', 'inspection', 'reply', '店长提交了整改回复，等待审核', 'u1', '张店长', 'store_manager', null, new Date(threeDaysAgo.getTime() + 12 * 60 * 60 * 1000).toISOString());
  insertHistory.run('h8', 'i3', 'inspection', 'status_update', '状态更新为「已完成」', 'u2', '李督导', 'supervisor', null, twoHoursAgo.toISOString());
  insertHistory.run('h9', 'i2', 'inspection', 'create', '督导发起了巡店整改', 'u2', '李督导', 'supervisor', null, twoHoursAgo.toISOString());
  insertHistory.run('h10', 'i2', 'inspection', 'reply', '店长提交了整改回复，等待审核', 'u1', '张店长', 'store_manager', null, oneHourAgo.toISOString());
  insertHistory.run('h11', 'i4', 'inspection', 'create', '督导发起了巡店整改，关联促销陈列p3', 'u2', '李督导', 'supervisor', null, threeDaysAgo.toISOString());
  insertHistory.run('h12', 'i4', 'inspection', 'reply', '店长提交了整改回复，等待审核', 'u1', '张店长', 'store_manager', null, new Date(threeDaysAgo.getTime() + 6 * 60 * 60 * 1000).toISOString());
  insertHistory.run('h13', 'i4', 'inspection', 'status_update', '状态更新为「已退回」', 'u2', '李督导', 'supervisor', '挂条位置不对，仍在角落，请重新放置', new Date(threeDaysAgo.getTime() + 8 * 60 * 60 * 1000).toISOString());
  insertHistory.run('h14', 'i4', 'inspection', 'reply', '店长重新提交了整改回复，等待审核', 'u1', '张店长', 'store_manager', null, new Date(threeDaysAgo.getTime() + 24 * 60 * 60 * 1000).toISOString());
  insertHistory.run('h15', 'i4', 'inspection', 'status_update', '状态更新为「已退回」（第2次）', 'u2', '李督导', 'supervisor', '第二次退回：挂条仍然不在指定位置，店长请重视！', new Date(threeDaysAgo.getTime() + 30 * 60 * 60 * 1000).toISOString());
  insertHistory.run('h16', 'i5', 'inspection', 'create', '督导发起了巡店整改，关联促销陈列p2', 'u2', '李督导', 'supervisor', null, now.toISOString());
  insertHistory.run('h17', 'p3', 'promotion', 'status_update', '状态更新为「有问题」', 'u2', '李督导', 'supervisor', null, new Date(threeDaysAgo.getTime() + 30 * 60 * 60 * 1000).toISOString());
}

export function initDatabase() {
  createTables();
  seedData();
}

export function resetDatabase() {
  database.exec(`
    DELETE FROM operation_history;
    DELETE FROM remarks;
    DELETE FROM inspections;
    DELETE FROM promotions;
    DELETE FROM users;
  `);
  seedData();
}

function rowToPromotion(row: any): PromotionDisplay {
  const remarkRows = database.prepare(`
    SELECT * FROM remarks WHERE source_id = ? AND source = 'promotion' ORDER BY created_at DESC
  `).all(row.id);
  const remarks = remarkRows.map((r: any) => ({
    id: r.id,
    sourceId: r.source_id,
    source: r.source,
    userId: r.user_id,
    userName: r.user_name,
    userRole: r.user_role as UserRole,
    content: r.content,
    createdAt: r.created_at,
  })) as Remark[];
  const inspectionCount = database.prepare(`
    SELECT COUNT(*) as count FROM inspections WHERE promotion_id = ?
  `).get(row.id) as { count: number };
  
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    storeId: row.store_id,
    storeName: row.store_name,
    productSpecialistId: row.product_specialist_id,
    productSpecialistName: row.product_specialist_name,
    status: row.status as any,
    createdAt: row.created_at,
    deadline: row.deadline,
    remarks,
    images: [],
    inspectionCount: inspectionCount.count,
  };
}

function mapToRemark(row: any): Remark {
  return {
    id: row.id,
    sourceId: row.source_id,
    source: row.source,
    userId: row.user_id,
    userName: row.user_name,
    userRole: row.user_role as UserRole,
    content: row.content,
    createdAt: row.created_at,
  };
}

function rowToInspection(row: any): InspectionRectification {
  const inspectionRemarkRows = database.prepare(`
    SELECT * FROM remarks WHERE source_id = ? AND source = 'inspection' ORDER BY created_at DESC
  `).all(row.id);
  const inspectionRemarks = inspectionRemarkRows.map(mapToRemark) as Remark[];
  
  const relatedPromotionRemarks = row.promotion_id
    ? (database.prepare(`
        SELECT * FROM remarks WHERE source_id = ? AND source = 'promotion' ORDER BY created_at DESC
      `).all(row.promotion_id)).map(mapToRemark) as Remark[]
    : [];
  
  const allRemarks = [...inspectionRemarks, ...relatedPromotionRemarks].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return {
    id: row.id,
    promotionId: row.promotion_id || undefined,
    promotionTitle: row.promotion_title || undefined,
    storeId: row.store_id,
    storeName: row.store_name,
    supervisorId: row.supervisor_id,
    supervisorName: row.supervisor_name,
    title: row.title,
    description: row.description,
    requirement: row.requirement,
    status: row.status as any,
    createdAt: row.created_at,
    deadline: row.deadline,
    remarks: allRemarks,
    rejectCount: row.reject_count || 0,
    lastRejectReason: row.last_reject_reason || undefined,
    images: [],
    replyImages: [],
    replyContent: row.reply_content || undefined,
    replyAt: row.reply_at || undefined,
  };
}

export const dbAccess = {
  get users(): User[] {
    return database.prepare('SELECT * FROM users').all().map((row: any) => ({
      id: row.id,
      username: row.username,
      role: row.role as UserRole,
      name: row.name,
      storeId: row.store_id || undefined,
      storeName: row.store_name || undefined,
    }));
  },

  get promotions(): PromotionDisplay[] {
    const rows = database.prepare('SELECT * FROM promotions ORDER BY created_at DESC').all();
    return rows.map(rowToPromotion);
  },

  get inspections(): InspectionRectification[] {
    const rows = database.prepare('SELECT * FROM inspections ORDER BY created_at DESC').all();
    return rows.map(rowToInspection);
  },

  get remarks(): Remark[] {
    return database.prepare('SELECT * FROM remarks ORDER BY created_at DESC').all().map((row: any) => ({
      id: row.id,
      sourceId: row.source_id,
      source: row.source as any,
      userId: row.user_id,
      userName: row.user_name,
      userRole: row.user_role as UserRole,
      content: row.content,
      createdAt: row.created_at,
    }));
  },

  getUserById: (id: string): User | undefined => {
    const row = database.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    if (!row) return undefined;
    return {
      id: row.id,
      username: row.username,
      role: row.role as UserRole,
      name: row.name,
      storeId: row.store_id || undefined,
      storeName: row.store_name || undefined,
    };
  },

  findUserByUsernameAndRole: (username: string, role: string): User | undefined => {
    const row = database.prepare('SELECT * FROM users WHERE username = ? AND role = ?').get(username, role) as any;
    if (!row) return undefined;
    return {
      id: row.id,
      username: row.username,
      role: row.role as UserRole,
      name: row.name,
      storeId: row.store_id || undefined,
      storeName: row.store_name || undefined,
    };
  },

  addPromotion: (promo: Omit<PromotionDisplay, 'id' | 'createdAt' | 'remarks' | 'images' | 'inspectionCount'>): PromotionDisplay => {
    const id = generateId();
    const stmt = database.prepare(`
      INSERT INTO promotions (id, title, description, store_id, store_name, product_specialist_id, product_specialist_name, status, deadline, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toISOString();
    stmt.run(id, promo.title, promo.description, promo.storeId, promo.storeName, promo.productSpecialistId, promo.productSpecialistName, promo.status, promo.deadline, now);
    
    addOperationHistory(
      id,
      'promotion',
      'create',
      '商品专员创建了促销陈列任务',
      promo.productSpecialistId,
      promo.productSpecialistName,
      'product_specialist'
    );
    
    return dbAccess.getPromotionById(id)!;
  },

  updatePromotionStatus: (id: string, status: string, userId?: string, userName?: string, userRole?: string): boolean => {
    const result = database.prepare('UPDATE promotions SET status = ? WHERE id = ?').run(status, id);
    if (result.changes > 0 && userId && userName && userRole) {
      const statusText: Record<string, string> = {
        pending: '待处理',
        processing: '处理中',
        completed: '已完成',
        has_issue: '有问题',
      };
      addOperationHistory(
        id,
        'promotion',
        'status_update',
        `状态更新为「${statusText[status] || status}」`,
        userId,
        userName,
        userRole
      );
    }
    return result.changes > 0;
  },

  getPromotionById: (id: string): PromotionDisplay | null => {
    const row = database.prepare('SELECT * FROM promotions WHERE id = ?').get(id) as any;
    if (!row) return null;
    const promotion = rowToPromotion(row);
    const history = database.prepare(`
      SELECT * FROM operation_history WHERE source_id = ? AND source = 'promotion' ORDER BY created_at DESC
    `).all(id);
    return { ...promotion, operationHistory: history } as any;
  },

  addPromotionRemark: (promotionId: string, userId: string, userName: string, userRole: string, content: string): Remark => {
    const id = generateId();
    const now = new Date().toISOString();
    const stmt = database.prepare(`
      INSERT INTO remarks (id, source_id, source, user_id, user_name, user_role, content, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, promotionId, 'promotion', userId, userName, userRole, content, now);
    return {
      id,
      sourceId: promotionId,
      source: 'promotion',
      userId,
      userName,
      userRole: userRole as UserRole,
      content,
      createdAt: now,
    };
  },

  addInspection: (inspection: Omit<InspectionRectification, 'id' | 'createdAt' | 'remarks' | 'images' | 'replyImages' | 'rejectCount' | 'lastRejectReason'>): InspectionRectification => {
    const id = generateId();
    const now = new Date().toISOString();
    const stmt = database.prepare(`
      INSERT INTO inspections (id, promotion_id, promotion_title, store_id, store_name, supervisor_id, supervisor_name, title, description, requirement, status, deadline, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      inspection.promotionId || null,
      inspection.promotionTitle || null,
      inspection.storeId,
      inspection.storeName,
      inspection.supervisorId,
      inspection.supervisorName,
      inspection.title,
      inspection.description,
      inspection.requirement,
      inspection.status,
      inspection.deadline,
      now
    );

    const description = inspection.promotionId
      ? `督导发起了巡店整改，关联促销陈列${inspection.promotionId}`
      : '督导发起了巡店整改';
    addOperationHistory(
      id,
      'inspection',
      'create',
      description,
      inspection.supervisorId,
      inspection.supervisorName,
      'supervisor'
    );

    return dbAccess.getInspectionById(id)!;
  },

  updateInspectionStatus: (id: string, status: string, rejectReason?: string, userId?: string, userName?: string, userRole?: string): boolean => {
    const inspection = database.prepare('SELECT * FROM inspections WHERE id = ?').get(id) as any;
    if (!inspection) return false;

    let rejectCount = inspection.reject_count || 0;
    let lastRejectReason = inspection.last_reject_reason;

    if (status === 'rejected' && rejectReason) {
      rejectCount += 1;
      lastRejectReason = rejectReason;
    }

    const result = database.prepare(`
      UPDATE inspections 
      SET status = ?, reject_count = ?, last_reject_reason = ?
      WHERE id = ?
    `).run(status, rejectCount, lastRejectReason, id);

    if (result.changes > 0 && userId && userName && userRole) {
      const statusText: Record<string, string> = {
        pending: '待整改',
        processing: '整改中',
        reviewing: '待审核',
        completed: '已完成',
        rejected: '已退回',
      };
      addOperationHistory(
        id,
        'inspection',
        'status_update',
        `状态更新为「${statusText[status] || status}」${rejectCount > 1 ? `（第${rejectCount}次）` : ''}`,
        userId,
        userName,
        userRole,
        status === 'rejected' ? rejectReason : undefined
      );
    }
    return result.changes > 0;
  },

  replyInspection: (id: string, content: string, userId?: string, userName?: string, userRole?: string): boolean => {
    const now = new Date().toISOString();
    const result = database.prepare(`
      UPDATE inspections 
      SET reply_content = ?, reply_at = ?, status = 'reviewing'
      WHERE id = ?
    `).run(content, now, id);

    if (result.changes > 0 && userId && userName && userRole) {
      addOperationHistory(
        id,
        'inspection',
        'reply',
        '店长提交了整改回复，等待审核',
        userId,
        userName,
        userRole
      );
    }
    return result.changes > 0;
  },

  getInspectionById: (id: string): InspectionRectification | null => {
    const row = database.prepare('SELECT * FROM inspections WHERE id = ?').get(id) as any;
    if (!row) return null;
    const inspection = rowToInspection(row);
    const history = database.prepare(`
      SELECT * FROM operation_history WHERE source_id = ? AND source = 'inspection' ORDER BY created_at DESC
    `).all(id);
    return { ...inspection, operationHistory: history } as any;
  },

  addInspectionRemark: (inspectionId: string, userId: string, userName: string, userRole: string, content: string): Remark => {
    const id = generateId();
    const now = new Date().toISOString();
    const stmt = database.prepare(`
      INSERT INTO remarks (id, source_id, source, user_id, user_name, user_role, content, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, inspectionId, 'inspection', userId, userName, userRole, content, now);
    return {
      id,
      sourceId: inspectionId,
      source: 'inspection',
      userId,
      userName,
      userRole: userRole as UserRole,
      content,
      createdAt: now,
    };
  },

  getPromotionRemarksForInspection: (promotionId: string | null | undefined): Remark[] => {
    if (!promotionId) return [];
    const rows = database.prepare(`
      SELECT * FROM remarks WHERE source_id = ? AND source = 'promotion' ORDER BY created_at DESC
    `).all(promotionId);
    return rows.map(mapToRemark) as Remark[];
  },
};

export const db = dbAccess;
