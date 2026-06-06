import fs from 'fs';

const filePath = '/Users/liu/Documents/private/model-test/trae-20260601-4/api/db.ts';
let content = fs.readFileSync(filePath, 'utf8');

// 1. 确保 note2_6 变量定义存在
if (!content.includes('const note2_6 = crypto.randomUUID()')) {
  content = content.replace(
    'const note2_5 = crypto.randomUUID()',
    'const note2_5 = crypto.randomUUID()\n    const note2_6 = crypto.randomUUID()'
  );
  console.log('Added note2_6 variable definition');
}

// 2. 检查 note2_6 的 insertNote 是否存在，如果不存在则添加
const note2_5InsertEnd = `      created_at: '2026-06-02T17:30:00.000Z',
    })`;

const note2_6Insert = `    insertNote.run({
      id: note2_6,
      incident_id: inc2Id,
      author: '李保险',
      category: 'anomaly',
      content: '[材料异常] 伤者身份证及滑雪票：身份证复印件模糊不清，需重新提交清晰版本',
      referenced_note_id: note2_1,
      referenced_note_ids: JSON.stringify([note2_1, note2_2, note2_5]),
      created_at: '2026-06-02T17:45:00.000Z',
    })`;

if (!content.includes('id: note2_6')) {
  content = content.replace(
    note2_5InsertEnd,
    note2_5InsertEnd + '\n\n' + note2_6Insert
  );
  console.log('Added note2_6 insertNote');
} else {
  // 如果已存在，确保 referenced_note_id 是 note2_1
  content = content.replace(
    /referenced_note_id: note2_2,\n      referenced_note_ids: JSON\.stringify\(\[note2_1, note2_2, note2_5\]\)/,
    'referenced_note_id: note2_1,\n      referenced_note_ids: JSON.stringify([note2_1, note2_2, note2_5])'
  );
  console.log('Updated referenced_note_id to note2_1');
}

// 3. 检查操作日志是否存在
const logPattern = /insertLog\.run\(\{ id: crypto\.randomUUID\(\), incident_id: inc2Id, action: 'add_note', operator: '李保险', detail: '添加保险分类备注', created_at: '2026-06-02T17:30:00\.000Z' \}\)/;
const newLog = `insertLog.run({ id: crypto.randomUUID(), incident_id: inc2Id, action: 'add_note', operator: '李保险', detail: '添加异常分类备注', created_at: '2026-06-02T17:45:00.000Z' })`;

if (!content.includes("添加异常分类备注', created_at: '2026-06-02T17:45:00.000Z'")) {
  content = content.replace(
    logPattern,
    (match) => match + '\n    ' + newLog
  );
  console.log('Added operation log for note2_6');
}

// 4. 确保 insurance_materials 中的 ins2_3 的 anomaly_referenced_note_ids 引用 note2_6
content = content.replace(
  /anomaly_referenced_note_ids: JSON\.stringify\(\[note2_5\]\)/,
  'anomaly_referenced_note_ids: JSON.stringify([note2_6])'
);
console.log('Updated insurance material to reference note2_6');

fs.writeFileSync(filePath, content, 'utf8');
console.log('File updated successfully!');
