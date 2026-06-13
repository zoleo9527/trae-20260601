const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'translation.db');

function saveDatabase(db) {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

function prepareResult(result) {
  if (!result || result.length === 0) return [];
  const { columns, values } = result[0];
  if (!values || values.length === 0) return [];
  return values.map(row => {
    const obj = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
}

function getLastInsertId(db) {
  const result = db.exec('SELECT last_insert_rowid() as id');
  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }
  return result[0].values[0][0];
}

function createManuscript(db, project_name, client_name, source_language, target_language, word_count, deadline, status) {
  db.run(`
    INSERT INTO manuscripts (project_name, client_name, source_language, target_language, word_count, deadline, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [project_name, client_name, source_language, target_language, word_count, deadline, status]);
  const id = getLastInsertId(db);
  return { lastInsertRowid: id };
}

function createVersion(db, manuscript_id, version_number, file_name, file_path, translator_id, translator_name, notes, is_final, review_status) {
  db.run(`
    INSERT INTO versions (manuscript_id, version_number, file_name, file_path, translator_id, translator_name, notes, is_final, review_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [manuscript_id, version_number, file_name, file_path, translator_id, translator_name, notes, is_final, review_status]);
  const id = getLastInsertId(db);
  return { lastInsertRowid: id };
}

function createReviewComment(db, version_id, reviewer_id, reviewer_name, comment_type, position, original_text, suggested_text, comment_text, severity) {
  db.run(`
    INSERT INTO review_comments (version_id, reviewer_id, reviewer_name, comment_type, position, original_text, suggested_text, comment_text, severity)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [version_id, reviewer_id, reviewer_name, comment_type, position, original_text, suggested_text, comment_text, severity]);
  const id = getLastInsertId(db);
  return { lastInsertRowid: id };
}

function createReworkRecord(db, version_id, rework_version_id, reviewer_id, reviewer_name, rework_reason, status, created_at, completed_at) {
  db.run(`
    INSERT INTO rework_records (version_id, rework_version_id, reviewer_id, reviewer_name, rework_reason, status, created_at, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [version_id, rework_version_id, reviewer_id, reviewer_name, rework_reason, status, created_at, completed_at]);
  const id = getLastInsertId(db);
  return { lastInsertRowid: id };
}

function createDeliveryRecord(db, manuscript_id, version_id, client_name, delivery_method, recipient, notes, client_feedback, feedback_time) {
  db.run(`
    INSERT INTO delivery_records (manuscript_id, version_id, client_name, delivery_method, recipient, notes, client_feedback, feedback_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [manuscript_id, version_id, client_name, delivery_method, recipient, notes, client_feedback, feedback_time]);
  const id = getLastInsertId(db);
  return { lastInsertRowid: id };
}

async function initDatabase() {
  const SQL = await initSqlJs();
  
  let db;
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS manuscripts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_name TEXT NOT NULL,
      client_name TEXT NOT NULL,
      source_language TEXT NOT NULL,
      target_language TEXT NOT NULL,
      word_count INTEGER NOT NULL,
      deadline TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      manuscript_id INTEGER NOT NULL,
      version_number TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT,
      translator_id INTEGER NOT NULL,
      translator_name TEXT NOT NULL,
      upload_time TEXT DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      is_final INTEGER DEFAULT 0,
      review_status TEXT DEFAULT 'pending',
      FOREIGN KEY (manuscript_id) REFERENCES manuscripts(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS review_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version_id INTEGER NOT NULL,
      reviewer_id INTEGER NOT NULL,
      reviewer_name TEXT NOT NULL,
      comment_type TEXT NOT NULL,
      position TEXT,
      original_text TEXT,
      suggested_text TEXT,
      comment_text TEXT NOT NULL,
      severity TEXT DEFAULT 'normal',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (version_id) REFERENCES versions(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS rework_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version_id INTEGER NOT NULL,
      rework_version_id INTEGER,
      reviewer_id INTEGER NOT NULL,
      reviewer_name TEXT NOT NULL,
      rework_reason TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT,
      FOREIGN KEY (version_id) REFERENCES versions(id),
      FOREIGN KEY (rework_version_id) REFERENCES versions(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS delivery_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      manuscript_id INTEGER NOT NULL,
      version_id INTEGER NOT NULL,
      client_name TEXT NOT NULL,
      delivery_time TEXT DEFAULT CURRENT_TIMESTAMP,
      delivery_method TEXT,
      recipient TEXT,
      notes TEXT,
      client_feedback TEXT,
      feedback_time TEXT,
      FOREIGN KEY (manuscript_id) REFERENCES manuscripts(id),
      FOREIGN KEY (version_id) REFERENCES versions(id)
    )
  `);

  console.log('开始初始化样例数据...');
  
  db.run('DELETE FROM delivery_records');
  db.run('DELETE FROM rework_records');
  db.run('DELETE FROM review_comments');
  db.run('DELETE FROM versions');
  db.run('DELETE FROM manuscripts');
  
  console.log('\n=== 场景1: 术语不统一 ===');
  const m1 = createManuscript(db, '产品说明书翻译项目', '科技有限公司', '中文', '英文', 15000, '2024-02-15', 'completed');
  console.log('创建稿件:', m1.lastInsertRowid);
  
  const v1_1 = createVersion(db, m1.lastInsertRowid, 'v1.0', '产品说明书_v1.0.docx', '/files/m1/v1.0.docx', 101, '张译员', '初稿翻译完成', 0, 'rejected');
  console.log('创建版本 v1.0 (待审校):', v1_1.lastInsertRowid);
  
  createReviewComment(db, v1_1.lastInsertRowid, 201, '李审校', 'terminology', '第3页第2段', '用户', 'user', '术语不统一：前面翻译为"用户"，这里又翻译为"使用者"，建议统一使用"用户"', 'high');
  createReviewComment(db, v1_1.lastInsertRowid, 201, '李审校', 'terminology', '第5页第4段', '登录', 'log in', '术语不统一:文档中"登录"有"log in"和"sign in"两种译法,建议统一使用"log in"', 'high');
  createReviewComment(db, v1_1.lastInsertRowid, 201, '李审校', 'terminology', '第8页第1段', '数据库', 'database', '术语不统一:前面用"数据库",后面用"资料库",建议统一为"数据库"', 'medium');
  console.log('添加审校意见: 3条术语不统一问题');
  
  const rework1_1 = createReworkRecord(db, v1_1.lastInsertRowid, null, 201, '李审校', '术语翻译不统一,需要统一术语表', 'pending', '2024-02-10 10:30:00', null);
  console.log('创建返工记录:', rework1_1.lastInsertRowid);
  
  const v1_2 = createVersion(db, m1.lastInsertRowid, 'v1.1', '产品说明书_v1.1.docx', '/files/m1/v1.1.docx', 101, '张译员', '根据审校意见统一术语', 0, 'approved');
  console.log('创建版本 v1.1 (已通过):', v1_2.lastInsertRowid);
  
  createReworkRecord(db, v1_1.lastInsertRowid, v1_2.lastInsertRowid, 201, '李审校', '术语翻译不统一,需要统一术语表', 'completed', '2024-02-10 10:30:00', '2024-02-11 14:00:00');
  
  const v1_3 = createVersion(db, m1.lastInsertRowid, 'v1.2', '产品说明书_v1.2_final.docx', '/files/m1/v1.2_final.docx', 101, '张译员', '最终版本,通过审校', 1, 'approved');
  console.log('创建最终版本 v1.2:', v1_3.lastInsertRowid);
  
  createDeliveryRecord(db, m1.lastInsertRowid, v1_3.lastInsertRowid, '科技有限公司', '邮件', '王经理', '最终交付版本', '翻译质量很好,术语统一', '2024-02-15 16:00:00');
  console.log('创建交付记录');
  
  console.log('\n=== 场景2: 客户临时改格式 ===');
  const m2 = createManuscript(db, '合同翻译项目', '贸易集团', '中文', '英文', 8000, '2024-02-20', 'completed');
  console.log('创建稿件:', m2.lastInsertRowid);
  
  const v2_1 = createVersion(db, m2.lastInsertRowid, 'v1.0', '合同_v1.0.docx', '/files/m2/v1.0.docx', 102, '王译员', '初稿翻译完成', 0, 'rejected');
  console.log('创建版本 v1.0:', v2_1.lastInsertRowid);
  
  createReviewComment(db, v2_1.lastInsertRowid, 202, '赵审校', 'format', '全文', null, null, '客户临时要求:需要将Word格式改为PDF格式,并添加公司水印', 'high');
  console.log('添加审校意见: 客户改格式要求');
  
  createReworkRecord(db, v2_1.lastInsertRowid, null, 202, '赵审校', '客户临时要求改格式', 'pending', '2024-02-18 14:00:00', null);
  
  const v2_2 = createVersion(db, m2.lastInsertRowid, 'v1.1', '合同_v1.1.pdf', '/files/m2/v1.1.pdf', 102, '王译员', '根据客户要求转换为PDF格式并添加水印', 1, 'approved');
  console.log('创建版本 v1.1:', v2_2.lastInsertRowid);
  
  createReworkRecord(db, v2_1.lastInsertRowid, v2_2.lastInsertRowid, 202, '赵审校', '客户临时要求改格式', 'completed', '2024-02-18 14:00:00', '2024-02-19 10:00:00');
  
  createDeliveryRecord(db, m2.lastInsertRowid, v2_2.lastInsertRowid, '贸易集团', '邮件', '李总', 'PDF格式,带水印', '格式符合要求,谢谢配合', '2024-02-20 18:00:00');
  console.log('创建交付记录');
  
  console.log('\n=== 场景3: 审校退回两次 ===');
  const m3 = createManuscript(db, '技术文档翻译项目', '软件公司', '英文', '中文', 20000, '2024-02-25', 'completed');
  console.log('创建稿件:', m3.lastInsertRowid);
  
  const v3_1 = createVersion(db, m3.lastInsertRowid, 'v1.0', '技术文档_v1.0.docx', '/files/m3/v1.0.docx', 103, '李译员', '初稿翻译完成', 0, 'rejected');
  console.log('创建版本 v1.0:', v3_1.lastInsertRowid);
  
  createReviewComment(db, v3_1.lastInsertRowid, 203, '孙审校', 'translation', '第2章第3节', 'The system will be available 24/7', '系统将全天候可用', '翻译不准确,建议改为"系统将提供7×24小时服务"', 'high');
  createReviewComment(db, v3_1.lastInsertRowid, 203, '孙审校', 'translation', '第4章第1节', 'Please refer to the user manual', '请参考用户手册', '翻译过于生硬,建议改为"详见用户手册"', 'medium');
  console.log('添加审校意见: 第1次审校发现的问题');
  
  const rework3_1 = createReworkRecord(db, v3_1.lastInsertRowid, null, 203, '孙审校', '翻译质量不达标,多处表达不准确', 'pending', '2024-02-18 9:00:00', null);
  console.log('创建第1次返工记录:', rework3_1.lastInsertRowid);
  
  const v3_2 = createVersion(db, m3.lastInsertRowid, 'v1.1', '技术文档_v1.1.docx', '/files/m3/v1.1.docx', 103, '李译员', '第一次修改完成', 0, 'rejected');
  console.log('创建版本 v1.1:', v3_2.lastInsertRowid);
  
  createReworkRecord(db, v3_1.lastInsertRowid, v3_2.lastInsertRowid, 203, '孙审校', '翻译质量不达标,多处表达不准确', 'completed', '2024-02-18 9:00:00', '2024-02-19 15:00:00');
  
  createReviewComment(db, v3_2.lastInsertRowid, 203, '孙审校', 'translation', '第6章第2节', 'Click the button to proceed', '点击按钮继续', '仍然不够准确,建议改为"单击按钮以继续操作"', 'high');
  createReviewComment(db, v3_2.lastInsertRowid, 203, '孙审校', 'grammar', '第8章第4节', 'The data will be saved automatically', '数据将被自动保存', '语法问题,建议改为"数据将自动保存"', 'medium');
  console.log('添加审校意见: 第2次审校发现的问题');
  
  const rework3_2 = createReworkRecord(db, v3_2.lastInsertRowid, null, 203, '孙审校', '仍有部分翻译不准确,需要再次修改', 'pending', '2024-02-19 16:00:00', null);
  console.log('创建第2次返工记录:', rework3_2.lastInsertRowid);
  
  const v3_3 = createVersion(db, m3.lastInsertRowid, 'v1.2', '技术文档_v1.2.docx', '/files/m3/v1.2.docx', 103, '李译员', '第二次修改完成', 0, 'approved');
  console.log('创建版本 v1.2:', v3_3.lastInsertRowid);
  
  createReworkRecord(db, v3_2.lastInsertRowid, v3_3.lastInsertRowid, 203, '孙审校', '仍有部分翻译不准确,需要再次修改', 'completed', '2024-02-19 16:00:00', '2024-02-20 10:00:00');
  
  createReviewComment(db, v3_3.lastInsertRowid, 203, '孙审校', 'approval', null, null, null, '修改后质量达标,同意通过', 'low');
  console.log('添加审校意见: 审校通过');
  
  const v3_4 = createVersion(db, m3.lastInsertRowid, 'v1.3', '技术文档_v1.3_final.docx', '/files/m3/v1.3_final.docx', 103, '李译员', '最终版本,通过审校', 1, 'approved');
  console.log('创建最终版本 v1.3:', v3_4.lastInsertRowid);
  
  createDeliveryRecord(db, m3.lastInsertRowid, v3_4.lastInsertRowid, '软件公司', '邮件', '陈经理', '经过两次返工的最终版本', '感谢耐心修改,质量满意', '2024-02-25 17:00:00');
  console.log('创建交付记录');
  
  console.log('\n=== 场景4: 进行中的项目 ===');
  const m4 = createManuscript(db, '营销文案翻译项目', '广告公司', '中文', '日文', 5000, '2024-02-28', 'in_review');
  console.log('创建稿件:', m4.lastInsertRowid);
  
  const v4_1 = createVersion(db, m4.lastInsertRowid, 'v1.0', '营销文案_v1.0.docx', '/files/m4/v1.0.docx', 104, '赵译员', '初稿翻译完成', 0, 'in_review');
  console.log('创建版本 v1.0:', v4_1.lastInsertRowid);
  
  createReviewComment(db, v4_1.lastInsertRowid, 204, '周审校', 'style', '第1段', '我们的产品是最好的', '当社の製品は最高です', '语气过于生硬,建议改为更委婉的表达"、当社の製品は最適な選択です"', 'medium');
  console.log('添加审校意见');
  
  saveDatabase(db);
  
  console.log('\n样例数据初始化完成!');
  
  function getCount(db, tableName) {
    const result = db.exec(`SELECT COUNT(*) as count FROM ${tableName}`);
    if (result.length === 0 || result[0].values.length === 0) {
      return 0;
    }
    return result[0].values[0][0];
  }
  
  const stats = {
    manuscripts: getCount(db, 'manuscripts'),
    versions: getCount(db, 'versions'),
    reviewComments: getCount(db, 'review_comments'),
    reworkRecords: getCount(db, 'rework_records'),
    deliveryRecords: getCount(db, 'delivery_records')
  };
  
  console.log('\n数据统计:');
  console.log('- 稿件数量:', stats.manuscripts);
  console.log('- 版本数量:', stats.versions);
  console.log('- 审校意见:', stats.reviewComments);
  console.log('- 返工记录:', stats.reworkRecords);
  console.log('- 交付记录:', stats.deliveryRecords);
}

initDatabase().then(() => {
  console.log('数据库初始化完成');
}).catch(err => {
  console.error('数据库初始化失败:', err);
});