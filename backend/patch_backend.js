const fs = require('fs');
const path = require('path');

// 修复 inventory.service.ts 的 review 记录查询：增加 material_type 兼容
const invPath = path.join(__dirname, 'src/services/inventory.service.ts');
let invContent = fs.readFileSync(invPath, 'utf-8');

// 在 getAllReviewRecords 后面，增加 material_type 兼容处理
// 方法是先检查表是否有该字段，如果查询报错就 fallback 到 JOIN 查询
const fallbackCode = `
const getMaterialTypeForReview = (sortedMaterialId: string): string => {
  try {
    const row = db.prepare('SELECT material_type FROM sorted_materials WHERE id = ?').get(sortedMaterialId) as any;
    return row ? row.material_type : 'unknown';
  } catch (e) {
    return 'unknown';
  }
};

const enrichReviewRecord = (r: any): ReviewRecord => {
  return {
    ...r,
    material_type: r.material_type || getMaterialTypeForReview(r.sorted_material_id)
  };
};
`;

// 把 enrichReviewRecord 加到 getAllReviewRecords 等函数的返回值
if (!invContent.includes('enrichReviewRecord')) {
  // 在文件 import 后面注入辅助函数
  const insertPos = invContent.indexOf('interface CreateInventoryInput');
  if (insertPos > 0) {
    invContent = invContent.slice(0, insertPos) + fallbackCode + '\n' + invContent.slice(insertPos);
  }

  // 修改 getAllReviewRecords
  const getAllReviewOld = 'return stmt.all() as ReviewRecord[];';
  const getAllReviewNew = 'return stmt.all().map(r => enrichReviewRecord(r as any)) as ReviewRecord[];';
  invContent = invContent.split(getAllReviewOld).join(getAllReviewNew);

  // 修改 getReviewRecordsByBatchId
  const getByBatchOld = "return stmt.all(batchId) as ReviewRecord[];";
  const getByBatchNew = "return stmt.all(batchId).map(r => enrichReviewRecord(r as any)) as ReviewRecord[];";
  invContent = invContent.split(getByBatchOld).join(getByBatchNew);

  // 修改 getReviewRecordsByJudgmentId
  const getByJudgmentOld = "return stmt.all(judgmentId) as ReviewRecord[];";
  const getByJudgmentNew = "return stmt.all(judgmentId).map(r => enrichReviewRecord(r as any)) as ReviewRecord[];";
  invContent = invContent.split(getByJudgmentOld).join(getByJudgmentNew);

  console.log('inventory.service.ts patched');
} else {
  console.log('inventory.service.ts already patched');
}

fs.writeFileSync(invPath, invContent, 'utf-8');

// 修复 grade.service.ts：如果没有 material_type 就从关联表查
const gradePath = path.join(__dirname, 'src/services/grade.service.ts');
let gradeContent = fs.readFileSync(gradePath, 'utf-8');

if (!gradeContent.includes('enrichGradeJudgment')) {
  const gradeFallback = `
const getMaterialTypeForGrade = (sortedMaterialId: string): string => {
  try {
    const row = db.prepare('SELECT material_type FROM sorted_materials WHERE id = ?').get(sortedMaterialId) as any;
    return row ? row.material_type : 'unknown';
  } catch (e) {
    return 'unknown';
  }
};

const enrichGradeJudgment = (j: any): GradeJudgment => {
  return {
    ...j,
    photo_urls: parseJsonSafely<string[]>(j.photo_urls, []),
    is_reviewed: (j.is_reviewed ?? 0) === 1,
    material_type: j.material_type || getMaterialTypeForGrade(j.sorted_material_id)
  };
};
`;

  // 注入辅助函数
  const gradeInsertPos = gradeContent.indexOf('interface CreateGradeJudgmentInput');
  if (gradeInsertPos > 0) {
    gradeContent = gradeContent.slice(0, gradeInsertPos) + gradeFallback + '\n' + gradeContent.slice(gradeInsertPos);
  }

  // 替换所有解析逻辑使用 enrichGradeJudgment
  const oldPatterns = [
    'return {\n    ...judgment,\n    photo_urls: parseJsonSafely<string[]>(judgment.photo_urls, []),\n    is_reviewed: judgment.is_reviewed === 1\n  };',
    'return judgments.map(j => ({\n    ...j,\n    photo_urls: parseJsonSafely<string[]>(j.photo_urls, []),\n    is_reviewed: j.is_reviewed === 1\n  }));'
  ];

  // getGradeJudgmentById 使用 enrich
  gradeContent = gradeContent.replace(
    oldPatterns[0],
    'return enrichGradeJudgment(judgment);'
  );

  // getGradeJudgmentsByBatchId 和 getAllGradeJudgments 使用 enrich
  gradeContent = gradeContent.split(oldPatterns[1]).join(
    'return judgments.map(j => enrichGradeJudgment(j));'
  );

  // getGradeJudgmentByMaterialId 也替换
  const byMaterialOld = 'return {\n    ...judgment,\n    photo_urls: parseJsonSafely<string[]>(judgment.photo_urls, []),\n    is_reviewed: judgment.is_reviewed === 1\n  };';
  gradeContent = gradeContent.split(byMaterialOld).join('return enrichGradeJudgment(judgment);');

  // updateGradeJudgment 中 material_type 兼容（如果没有就从 sorted_material 查）
  const reviewStmtOld = `reviewStmt.run(
    reviewId, id, judgment.batch_id, judgment.sorted_material_id, judgment.material_type,`;
  const reviewStmtNew = `reviewStmt.run(
    reviewId, id, judgment.batch_id, judgment.sorted_material_id, judgment.material_type || getMaterialTypeForGrade(judgment.sorted_material_id),`;
  gradeContent = gradeContent.split(reviewStmtOld).join(reviewStmtNew);

  console.log('grade.service.ts patched');
} else {
  console.log('grade.service.ts already patched');
}

fs.writeFileSync(gradePath, gradeContent, 'utf-8');

// initDb.ts：增加安全的字段迁移（如果数据库存在但没有新字段，就 ALTER TABLE ADD COLUMN）
const initDbPath = path.join(__dirname, 'src/scripts/initDb.ts');
let initDbContent = fs.readFileSync(initDbPath, 'utf-8');

if (!initDbContent.includes('ALTER TABLE')) {
  const migrationCode = `
const ensureColumnExists = (tableName: string, columnName: string, columnDef: string) => {
  try {
    const columns = db.prepare(\`PRAGMA table_info(\${tableName})\`).all() as any[];
    if (!columns.find(c => c.name === columnName)) {
      db.prepare(\`ALTER TABLE \${tableName} ADD COLUMN \${columnName} \${columnDef}\`).run();
      console.log(\`✓ Added column \${columnName} to \${tableName}\`);
    }
  } catch (e) {
    console.log(\`⚠ Column migration skipped for \${tableName}.\${columnName}: \${(e as Error).message}\`);
  }
};

const runMigrations = () => {
  ensureColumnExists('sorted_materials', 'is_scrapped', 'INTEGER DEFAULT 0');
  ensureColumnExists('review_records', 'material_type', 'TEXT');
  console.log('✓ Database migrations completed');
};
`;

  // 在 "Tables created successfully" 之后运行迁移
  initDbContent = initDbContent.replace(
    "console.log('✓ Database tables created successfully');",
    "console.log('✓ Database tables created successfully');\n\n  runMigrations();"
  );

  // 注入函数定义（在 createTables 之后）
  initDbContent = initDbContent.replace(
    'const createTables = () => {',
    migrationCode + '\nconst createTables = () => {'
  );

  console.log('initDb.ts patched with migrations');
} else {
  console.log('initDb.ts already has migrations');
}

fs.writeFileSync(initDbPath, initDbContent, 'utf-8');

console.log('\nAll backend patches applied!');
