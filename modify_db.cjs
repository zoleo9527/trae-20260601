const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'api', 'db.ts');
let content = fs.readFileSync(dbPath, 'utf8');

console.log('Original content length:', content.length);

// 1. 添加字段到表结构 - 在 referenced_note_ids TEXT 后添加新字段
const tablePattern = /(referenced_note_ids TEXT,)(\s+created_at TEXT NOT NULL,)/;
if (tablePattern.test(content)) {
  content = content.replace(tablePattern, '$1\n    anomaly_referenced_note_ids TEXT,$2');
  console.log('✓ 表结构已更新');
} else {
  console.log('✗ 未找到表结构匹配');
}

// 2. 更新 insertInsurance 预编译语句 - 字段列表
const insertFieldsPattern = /(referenced_note_ids,)(\s+created_at, updated_at\))/;
if (insertFieldsPattern.test(content)) {
  content = content.replace(insertFieldsPattern, '$1 anomaly_referenced_note_ids,$2');
  console.log('✓ INSERT 字段列表已更新');
} else {
  console.log('✗ 未找到 INSERT 字段列表匹配');
}

// 3. 更新 insertInsurance 预编译语句 - 值列表
const insertValuesPattern = /(@referenced_note_ids,)(\s+@created_at, @updated_at\))/;
if (insertValuesPattern.test(content)) {
  content = content.replace(insertValuesPattern, '$1 @anomaly_referenced_note_ids,$2');
  console.log('✓ INSERT 值列表已更新');
} else {
  console.log('✗ 未找到 INSERT 值列表匹配');
}

// 4. 为所有保险材料添加 anomaly_referenced_note_ids 字段
// 找到所有 insertInsurance.run 调用，在 referenced_note_ids 行后添加新字段
// 使用正则表达式匹配模式
const insurancePattern = /(referenced_note_ids: (JSON\.stringify\([^\)]+\)|null),)(\s+created_at:)/g;

let matchCount = 0;
content = content.replace(insurancePattern, (match, p1, p2, p3) => {
  matchCount++;
  // 对于 RSC-2026-002 中被驳回的材料（ins2_3），设置真实的关联备注ID
  // 其他材料设置为 null
  if (matchCount === 6) { // 第6个是 ins2_3（被驳回的材料）
    return `${p1}\n      anomaly_referenced_note_ids: JSON.stringify([note2_5]),${p3}`;
  }
  return `${p1}\n      anomaly_referenced_note_ids: null,${p3}`;
});

console.log(`✓ 已更新 ${matchCount} 个保险材料记录`);

fs.writeFileSync(dbPath, content, 'utf8');
console.log('\n文件修改完成！');
console.log('新内容长度:', content.length);
