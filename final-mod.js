const fs = require('fs');

// 1. 修复 db.ts 中的 VALUES 部分
console.log('=== 修改 db.ts ===');
let dbContent = fs.readFileSync('api/db.ts', 'utf-8');
dbContent = dbContent.replace(
  'VALUES (@id, @incident_id, @author, @category, @content, @referenced_note_id, @created_at)',
  'VALUES (@id, @incident_id, @author, @category, @content, @referenced_note_id, @referenced_note_ids, @created_at)'
);
fs.writeFileSync('api/db.ts', dbContent);
console.log('db.ts: INSERT 语句的 VALUES 部分已更新');

// 2. 修复 insurance.ts 中的类型问题
console.log('\n=== 修改 insurance.ts ===');
let insContent = fs.readFileSync('api/routes/insurance.ts', 'utf-8');

// 修复 processNote 函数中的类型转换
insContent = insContent.replace(
  'return {\n    ...note as IncidentNote,\n    referenced_note_ids: noteIds\n  }',
  'return {\n    ...(note as unknown as IncidentNote),\n    referenced_note_ids: noteIds\n  }'
);

// 修复 getMaterialWithNotes 中的类型断言 - 先查询再转换
insContent = insContent.replace(
  '.all(...noteIds).map(n => processNote(n)) as IncidentNote[]',
  '.all(...noteIds).map(n => processNote(n as Record<string, unknown>)) as IncidentNote[]'
);
insContent = insContent.replace(
  '.all(...anomalyNoteIds).map(n => processNote(n)) as IncidentNote[]',
  '.all(...anomalyNoteIds).map(n => processNote(n as Record<string, unknown>)) as IncidentNote[]'
);

fs.writeFileSync('api/routes/insurance.ts', insContent);
console.log('insurance.ts: 类型问题已修复');

// 3. 修改 incidents.ts - 完整修改
console.log('\n=== 修改 incidents.ts ===');
let incContent = fs.readFileSync('api/routes/incidents.ts', 'utf-8');

// 3.1 更新 IncidentNote 接口
incContent = incContent.replace(
  'interface IncidentNote {\n  id: string\n  incident_id: string\n  author: string\n  category: string\n  content: string\n  referenced_note_id: string | null\n  created_at: string\n}',
  'interface IncidentNote {\n  id: string\n  incident_id: string\n  author: string\n  category: string\n  content: string\n  referenced_note_id: string | null\n  referenced_note_ids: string[] | null\n  created_at: string\n}'
);
console.log('incidents.ts: IncidentNote 接口已更新');

// 3.2 在 getMaterialWithNotes 函数后添加 processNote 函数
const processNoteFunc = `
function processNote(note: Record<string, unknown>): IncidentNote {
  const noteIdsStr = note.referenced_note_ids as string | null
  let noteIds: string[] | null = null
  
  if (noteIdsStr) {
    try {
      noteIds = JSON.parse(noteIdsStr)
    } catch {
      noteIds = null
    }
  }
  
  return {
    ...(note as unknown as IncidentNote),
    referenced_note_ids: noteIds
  }
}
`;

// 找到 getMaterialWithNotes 函数结束的位置
const getMaterialEndMarker = 'anomaly_referenced_notes: anomalyReferencedNotes\n  }\n}';
const funcEndIndex = incContent.indexOf(getMaterialEndMarker) + getMaterialEndMarker.length;
incContent = incContent.slice(0, funcEndIndex) + processNoteFunc + incContent.slice(funcEndIndex);
console.log('incidents.ts: processNote 函数已添加');

// 3.3 修改 getMaterialWithNotes 中的查询结果
incContent = incContent.replace(
  '.all(...noteIds) as IncidentNote[]',
  '.all(...noteIds).map(n => processNote(n as Record<string, unknown>)) as IncidentNote[]'
);
incContent = incContent.replace(
  '.all(...anomalyNoteIds) as IncidentNote[]',
  '.all(...anomalyNoteIds).map(n => processNote(n as Record<string, unknown>)) as IncidentNote[]'
);
console.log('incidents.ts: getMaterialWithNotes 已更新');

// 3.4 修改事件详情接口（GET /:id）中的 notes
incContent = incContent.replace(
  "const notes = db.prepare('SELECT * FROM incident_notes WHERE incident_id = ? ORDER BY created_at ASC').all(id)",
  "const notesRaw = db.prepare('SELECT * FROM incident_notes WHERE incident_id = ? ORDER BY created_at ASC').all(id) as Record<string, unknown>[]\n  const notes = notesRaw.map(n => processNote(n))"
);
console.log('incidents.ts: 事件详情接口已更新');

// 3.5 修改获取备注列表接口（GET /:id/notes）
incContent = incContent.replace(
  "const notes = db.prepare('SELECT * FROM incident_notes WHERE incident_id = ? ORDER BY created_at DESC').all(id)\n  res.json({ success: true, data: notes })",
  "const notesRaw = db.prepare('SELECT * FROM incident_notes WHERE incident_id = ? ORDER BY created_at DESC').all(id) as Record<string, unknown>[]\n  const notes = notesRaw.map(n => processNote(n))\n  res.json({ success: true, data: notes })"
);
console.log('incidents.ts: 获取备注列表接口已更新');

// 3.6 修改创建备注接口（POST /:id/notes）的返回值
incContent = incContent.replace(
  "const note = db.prepare('SELECT * FROM incident_notes WHERE id = ?').get(noteId)\n  res.status(201).json({ success: true, data: note })",
  "const noteRaw = db.prepare('SELECT * FROM incident_notes WHERE id = ?').get(noteId) as Record<string, unknown>\n  const note = processNote(noteRaw)\n  res.status(201).json({ success: true, data: note })"
);
console.log('incidents.ts: 创建备注接口已更新');

// 3.7 修改 timeline 接口，在 SELECT 语句中添加 referenced_note_ids
incContent = incContent.replace(
  "SELECT id, 'note' as type, created_at, author as actor, category, content, referenced_note_id",
  "SELECT id, 'note' as type, created_at, author as actor, category, content, referenced_note_id, referenced_note_ids"
);
console.log('incidents.ts: timeline 接口已更新');

fs.writeFileSync('api/routes/incidents.ts', incContent);
console.log('\n所有文件修改完成！');
