import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, '..', 'outlet.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    floor TEXT,
    area REAL,
    manager TEXT,
    phone TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    avatar TEXT
  );

  CREATE TABLE IF NOT EXISTS inspection_rectifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    store_name TEXT NOT NULL,
    brand TEXT NOT NULL,
    inspector_id INTEGER,
    inspector_name TEXT,
    inspection_date TEXT NOT NULL,
    category TEXT NOT NULL,
    severity TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    requirement TEXT NOT NULL,
    deadline TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    handler_id INTEGER,
    handler_name TEXT,
    rectify_note TEXT,
    rectify_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS close_store_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rectification_id INTEGER NOT NULL,
    store_id INTEGER NOT NULL,
    store_name TEXT NOT NULL,
    brand TEXT NOT NULL,
    reviewer_id INTEGER,
    reviewer_name TEXT,
    review_date TEXT,
    result TEXT,
    review_note TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (rectification_id) REFERENCES inspection_rectifications(id)
  );

  CREATE TABLE IF NOT EXISTS attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ref_type TEXT NOT NULL,
    ref_id INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    uploader_name TEXT,
    uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS operation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ref_type TEXT NOT NULL,
    ref_id INTEGER NOT NULL,
    operator_name TEXT NOT NULL,
    action TEXT NOT NULL,
    detail TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ref_type TEXT NOT NULL,
    ref_id INTEGER NOT NULL,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const storeCount = db.prepare('SELECT COUNT(*) as cnt FROM stores').get().cnt;
if (storeCount === 0) {
  const insertStore = db.prepare(`
    INSERT INTO stores (name, brand, floor, area, manager, phone)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const stores = [
    ['1F-01 耐克工厂店', 'NIKE', '1F', 280, '张伟', '13800138001'],
    ['1F-08 阿迪达斯', 'Adidas', '1F', 320, '李娜', '13800138002'],
    ['2F-15 优衣库', 'UNIQLO', '2F', 520, '王芳', '13800138003'],
    ['2F-22 无印良品', 'MUJI', '2F', 260, '刘洋', '13800138004'],
    ['B1-03 星巴克', 'Starbucks', 'B1', 180, '陈静', '13800138005'],
    ['1F-12 李宁', 'LI-NING', '1F', 210, '赵磊', '13800138006'],
    ['3F-05 玩具反斗城', 'ToysRUs', '3F', 450, '孙丽', '13800138007'],
    ['2F-30 热风', 'Hotwind', '2F', 175, '周杰', '13800138008'],
  ];

  stores.forEach((s) => insertStore.run(...s));

  const insertUser = db.prepare(`
    INSERT INTO users (name, role, avatar)
    VALUES (?, ?, ?)
  `);

  const users = [
    ['赵明', 'leasing_manager', '👔'],
    ['钱红', 'ops_supervisor', '📋'],
    ['孙明', 'ops_supervisor', '📋'],
    ['张伟', 'store_manager', '👤'],
    ['李娜', 'store_manager', '👤'],
    ['王芳', 'store_manager', '👤'],
    ['刘洋', 'store_manager', '👤'],
    ['陈静', 'store_manager', '👤'],
    ['赵磊', 'store_manager', '👤'],
    ['孙丽', 'store_manager', '👤'],
    ['周杰', 'store_manager', '👤'],
  ];

  users.forEach((u) => insertUser.run(...u));

  const insertRect = db.prepare(`
    INSERT INTO inspection_rectifications (
      store_id, store_name, brand, inspector_id, inspector_name,
      inspection_date, category, severity, title, description,
      requirement, deadline, status, handler_id, handler_name,
      rectify_note, rectify_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const rectifications = [
    [1, '1F-01 耐克工厂店', 'NIKE', 3, '孙明', '2026-06-08', '卫生', '严重', '试衣间清洁不达标',
     '试衣间地面有明显污渍，镜面有指纹痕迹，挂钩积灰严重，异味明显。',
     '立即全面清洁试衣间，制定每日清洁检查表，店长每日抽查。',
     '2026-06-12', 'pending', 4, '张伟', null, null],

    [2, '1F-08 阿迪达斯', 'Adidas', 3, '孙明', '2026-06-09', '陈列', '一般', '橱窗陈列杂乱',
     '橱窗内模特服装搭配不协调，道具摆放凌乱，缺少主题感。',
     '重新规划橱窗陈列主题，按季更换，每周二检查陈列标准。',
     '2026-06-15', 'in_progress', 5, '李娜',
     '已安排陈列师本周三到店调整，预计周四完成。', '2026-06-10'],

    [3, '2F-15 优衣库', 'UNIQLO', 2, '钱红', '2026-06-07', '安全', '紧急', '消防通道堆货',
     '2F西侧消防通道被整箱货物堵塞，宽度不足0.8米，严重违反消防安全规定。',
     '立即清理消防通道所有杂物，保证通道宽度不小于1.5米，店长签署消防安全承诺书。',
     '2026-06-08', 'pending_review', 6, '王芳',
     '已完成通道清理，货物移至后场仓库指定区域，已组织全员消防培训。', '2026-06-08'],

    [4, '2F-22 无印良品', 'MUJI', 2, '钱红', '2026-06-05', '人员', '一般', '员工仪容仪表不规范',
     '抽查3名员工，2名未按规定佩戴工牌，1名着装不符合品牌标准。',
     '重申员工着装和工牌佩戴规定，店长每日班前会检查。',
     '2026-06-12', 'completed', null, null, null, null],

    [5, 'B1-03 星巴克', 'Starbucks', 3, '孙明', '2026-06-10', '卫生', '严重', '后厨操作台卫生问题',
     '后厨操作台有咖啡渍残留，原料罐未加盖，灭蝇灯未正常开启。',
     '彻底清洁后厨所有台面，原料密封存放，检查灭蝇设备运行，每日收市后进行卫生检查。',
     '2026-06-13', 'in_progress', null, '陈静',
     '已安排今日收市后全面清洁，明天上午由店经理复检。', '2026-06-10'],

    [6, '1F-12 李宁', 'LI-NING', 2, '钱红', '2026-06-03', '陈列', '一般', '货品陈列密度过高',
     '中岛区域货品过于密集，顾客通行空间狭窄，部分尺码缺货未及时补货。',
     '调整陈列密度，保证主通道宽度不低于1.2米，建立每日补货检查机制。',
     '2026-06-10', 'completed', null, null, null, null],
  ];

  const rectIds = [];
  rectifications.forEach((r) => {
    const info = insertRect.run(...r);
    rectIds.push(info.lastInsertRowid);
  });

  const insertReview = db.prepare(`
    INSERT INTO close_store_reviews (
      rectification_id, store_id, store_name, brand,
      reviewer_id, reviewer_name, review_date, result, review_note, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const reviews = [
    [rectIds[2], 3, '2F-15 优衣库', 'UNIQLO', 2, '钱红', null, null, null, 'pending'],
    [rectIds[3], 4, '2F-22 无印良品', 'MUJI', 2, '钱红', '2026-06-09', 'passed',
     '试衣间清洁达标，每日清洁检查表已落实，抽查3间均符合标准。', 'completed'],
    [rectIds[5], 6, '1F-12 李宁', 'LI-NING', 3, '孙明', '2026-06-11', 'passed',
     '陈列调整到位，通道宽度达标，缺货货品已补齐，整体效果良好。', 'completed'],
  ];

  reviews.forEach((r) => insertReview.run(...r));

  const insertAttachment = db.prepare(`
    INSERT INTO attachments (ref_type, ref_id, file_name, file_type, file_size, uploader_name)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const attachments = [
    ['rectification', rectIds[0], '试衣间污渍照片1.jpg', 'image/jpeg', 2450000, '孙明'],
    ['rectification', rectIds[0], '试衣间污渍照片2.jpg', 'image/jpeg', 3120000, '孙明'],
    ['rectification', rectIds[1], '橱窗现状.jpg', 'image/jpeg', 1890000, '孙明'],
    ['rectification', rectIds[2], '消防通道堵塞.jpg', 'image/jpeg', 4210000, '钱红'],
    ['rectification', rectIds[2], '通道位置平面图.png', 'image/png', 560000, '钱红'],
    ['rectification', rectIds[2], '清理后照片1.jpg', 'image/jpeg', 2780000, '王芳'],
    ['rectification', rectIds[2], '清理后照片2.jpg', 'image/jpeg', 3050000, '王芳'],
    ['rectification', rectIds[4], '后厨卫生问题.jpg', 'image/jpeg', 1670000, '孙明'],
    ['review', 1, '复查现场照片.jpg', 'image/jpeg', 2980000, '钱红'],
    ['review', 2, '复查确认单.pdf', 'application/pdf', 156000, '钱红'],
  ];

  attachments.forEach((a) => insertAttachment.run(...a));

  const insertLog = db.prepare(`
    INSERT INTO operation_logs (ref_type, ref_id, operator_name, action, detail)
    VALUES (?, ?, ?, ?, ?)
  `);

  const logs = [
    ['rectification', rectIds[0], '孙明', 'create', '创建巡店整改单'],
    ['rectification', rectIds[0], '系统', 'assign', '指派店长张伟负责整改'],
    ['rectification', rectIds[1], '孙明', 'create', '创建巡店整改单'],
    ['rectification', rectIds[1], '李娜', 'update_status', '更新状态为整改中'],
    ['rectification', rectIds[1], '李娜', 'comment', '已安排陈列师本周三到店调整'],
    ['rectification', rectIds[2], '钱红', 'create', '创建巡店整改单（紧急）'],
    ['rectification', rectIds[2], '王芳', 'update_status', '更新状态为整改中'],
    ['rectification', rectIds[2], '王芳', 'update_status', '提交整改完成，申请复查'],
    ['rectification', rectIds[2], '系统', 'create_review', '关联生成闭店复查单 #1'],
    ['review', 1, '系统', 'create', '由整改单自动生成复查单'],
    ['rectification', rectIds[3], '钱红', 'create', '创建巡店整改单'],
    ['rectification', rectIds[3], '刘洋', 'update_status', '更新状态为整改中'],
    ['rectification', rectIds[3], '刘洋', 'update_status', '提交整改完成，申请复查'],
    ['review', 2, '钱红', 'review', '复查通过，整改完成'],
    ['rectification', rectIds[3], '系统', 'close', '整改单已结案'],
    ['rectification', rectIds[4], '孙明', 'create', '创建巡店整改单'],
    ['rectification', rectIds[4], '陈静', 'update_status', '更新状态为整改中'],
    ['rectification', rectIds[4], '陈静', 'comment', '已安排今日收市后全面清洁'],
    ['rectification', rectIds[5], '钱红', 'create', '创建巡店整改单'],
    ['rectification', rectIds[5], '赵磊', 'update_status', '更新状态为整改中'],
    ['rectification', rectIds[5], '赵磊', 'update_status', '提交整改完成，申请复查'],
    ['review', 3, '孙明', 'review', '复查通过，整改完成'],
    ['rectification', rectIds[5], '系统', 'close', '整改单已结案'],
  ];

  logs.forEach((l) => insertLog.run(...l));

  const insertComment = db.prepare(`
    INSERT INTO comments (ref_type, ref_id, author_name, content)
    VALUES (?, ?, ?, ?)
  `);

  const comments = [
    ['rectification', rectIds[0], '赵明', '这个店最近卫生问题比较多，请店长重视起来。'],
    ['rectification', rectIds[0], '张伟', '收到，今天就安排全面整改。'],
    ['rectification', rectIds[1], '李娜', '陈列师明天下午到店，调整完我先自检一遍。'],
    ['rectification', rectIds[2], '钱红', '这个是消防隐患，必须今天内解决！'],
    ['rectification', rectIds[2], '王芳', '已经在清了，保证今天下班前搞定。'],
    ['rectification', rectIds[2], '王芳', '已完成清理，上传了照片，请督导复查。'],
    ['rectification', rectIds[4], '孙明', '星巴克的卫生标准一直很高，这次要注意了。'],
    ['review', 1, '钱红', '明天上午过去复查。'],
  ];

  comments.forEach((c) => insertComment.run(...c));
}

const allStores = db.prepare("SELECT DISTINCT manager FROM stores WHERE manager IS NOT NULL AND manager != ''").all();
const existingMgrs = db.prepare('SELECT name FROM users WHERE role = ?').all('store_manager').map(u => u.name);

allStores.forEach(s => {
  if (s.manager && !existingMgrs.includes(s.manager)) {
    db.prepare('INSERT INTO users (name, role, avatar) VALUES (?, ?, ?)').run(s.manager, 'store_manager', '👤');
    existingMgrs.push(s.manager);
  }
});

export default db;
