import fs from 'fs';

// 1. 修改 insurance.ts
let insuranceContent = fs.readFileSync('/Users/liu/Documents/private/model-test/trae-20260601-4/api/routes/insurance.ts', 'utf-8');

// 更新 IncidentNote 接口
insuranceContent = insuranceContent.replace(
  `interface IncidentNote {
  id: string
  incident_id: string
  author: string
  category: string
  content: string
  referenced_note_id: string | null
  created_at: string
}`,
  `interface IncidentNote {
  id: string
  incident_id: string
  author: string
  category: string
  content: string
  referenced_note_id: string | null
  referenced_note_ids: string[] | null
  created_at: string
}`
);

// 添加辅助函数处理备注数据
const processNoteHelper = `
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
    ...note as IncidentNote,
    referenced_note_ids: noteIds
  }
}
`;

// 在 getMaterialWithNotes 函数之前添加 processNote 函数
insuranceContent = insuranceContent.replace(
  'function getMaterialWithNotes(material: Record<string, unknown>): InsuranceMaterialWithNotes {',
  processNoteHelper + '\nfunction getMaterialWithNotes(material: Record<string, unknown>): InsuranceMaterialWithNotes {'
);

// 修改异常说明提交接口
// 1. 修改 INSERT 语句，添加 referenced_note_ids 字段
insuranceContent = insuranceContent.replace(
  `  db.prepare(\`
    INSERT INTO incident_notes (id, incident_id, author, category, content, referenced_note_id, created_at)
    VALUES (?, ?, ?, 'anomaly', ?, ?, ?)
  \`).run(noteId, incidentId, operator, noteContent, referencedNoteId, now)`,
  `  db.prepare(\`
    INSERT INTO incident_notes (id, incident_id, author, category, content, referenced_note_id, referenced_note_ids, created_at)
    VALUES (?, ?, ?, 'anomaly', ?, ?, ?, ?)
  \`).run(noteId, incidentId, operator, noteContent, referencedNoteId, anomalyReferencedNoteIdsStr, now)`
);

// 2. 修改返回的 createdNote，处理 referenced_note_ids
insuranceContent = insuranceContent.replace(
  '  const createdNote = db.prepare(\'SELECT * FROM incident_notes WHERE id = ?\').get(noteId) as Record<string, unknown>',
  '  const createdNoteRaw = db.prepare(\'SELECT * FROM incident_notes WHERE id = ?\').get(noteId) as Record<string, unknown>\n  const createdNote = processNote(createdNoteRaw)'
);

// 3. 在救援医疗备注接口中也处理备注数据
insuranceContent = insuranceContent.replace(
  `  const notes = db.prepare(\`
    SELECT * FROM incident_notes 
    WHERE incident_id = ? AND (category = 'rescue' OR category = 'medical')
    ORDER BY created_at DESC
  \`).all(id)

  res.json({ success: true, data: notes })`,
  `  const notesRaw = db.prepare(\`
    SELECT * FROM incident_notes 
    WHERE incident_id = ? AND (category = 'rescue' OR category = 'medical')
    ORDER BY created_at DESC
  \`).all(id) as Record<string, unknown>[]

  const notes = notesRaw.map(n => processNote(n))

  res.json({ success: true, data: notes })`
);

fs.writeFileSync('/Users/liu/Documents/private/model-test/trae-20260601-4/api/routes/insurance.ts', insuranceContent);
console.log('insurance.ts updated successfully');

// 2. 修改 incidents.ts
let incidentsContent = fs.readFileSync('/Users/liu/Documents/private/model-test/trae-20260601-4/api/routes/incidents.ts', 'utf-8');

// 更新 IncidentNote 接口
incidentsContent = incidentsContent.replace(
  `interface IncidentNote {
  id: string
  incident_id: string
  author: string
  category: string
  content: string
  referenced_note_id: string | null
  created_at: string
}`,
  `interface IncidentNote {
  id: string
  incident_id: string
  author: string
  category: string
  content: string
  referenced_note_id: string | null
  referenced_note_ids: string[] | null
  created_at: string
}`
);

// 添加 processNote 辅助函数
incidentsContent = incidentsContent.replace(
  'function mapIncidentRow(row: Record<string, unknown>): Record<string, unknown> {',
  `function processNote(note: Record<string, unknown>): IncidentNote {
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
    ...note as IncidentNote,
    referenced_note_ids: noteIds
  }
}

function mapIncidentRow(row: Record<string, unknown>): Record<string, unknown> {`
);

// 修改事件详情接口中的 notes
incidentsContent = incidentsContent.replace(
  '  const notes = db.prepare(\'SELECT * FROM incident_notes WHERE incident_id = ? ORDER BY created_at ASC\').all(id)',
  '  const notesRaw = db.prepare(\'SELECT * FROM incident_notes WHERE incident_id = ? ORDER BY created_at ASC\').all(id) as Record<string, unknown>[]\n  const notes = notesRaw.map(n => processNote(n))'
);

// 修改获取备注列表接口
incidentsContent = incidentsContent.replace(
  '  const notes = db.prepare(\'SELECT * FROM incident_notes WHERE incident_id = ? ORDER BY created_at DESC\').all(id)\n  res.json({ success: true, data: notes })',
  '  const notesRaw = db.prepare(\'SELECT * FROM incident_notes WHERE incident_id = ? ORDER BY created_at DESC\').all(id) as Record<string, unknown>[]\n  const notes = notesRaw.map(n => processNote(n))\n  res.json({ success: true, data: notes })'
);

// 修改创建备注接口返回值
incidentsContent = incidentsContent.replace(
  '  const note = db.prepare(\'SELECT * FROM incident_notes WHERE id = ?\').get(noteId)\n  res.status(201).json({ success: true, data: note })',
  '  const noteRaw = db.prepare(\'SELECT * FROM incident_notes WHERE id = ?\').get(noteId) as Record<string, unknown>\n  const note = processNote(noteRaw)\n  res.status(201).json({ success: true, data: note })'
);

// 修改 timeline 接口，添加 referenced_note_ids
incidentsContent = incidentsContent.replace(
  `  const notes = db.prepare(\`
    SELECT id, 'note' as type, created_at, author as actor, category, content, referenced_note_id
    FROM incident_notes
    WHERE incident_id = ?
  \`).all(id)`,
  `  const notes = db.prepare(\`
    SELECT id, 'note' as type, created_at, author as actor, category, content, referenced_note_id, referenced_note_ids
    FROM incident_notes
    WHERE incident_id = ?
  \`).all(id)`
);

fs.writeFileSync('/Users/liu/Documents/private/model-test/trae-20260601-4/api/routes/incidents.ts', incidentsContent);
console.log('incidents.ts updated successfully');

// 3. 修改 db.ts
let dbContent = fs.readFileSync('/Users/liu/Documents/private/model-test/trae-20260601-4/api/db.ts', 'utf-8');

// 更新表结构
dbContent = dbContent.replace(
  `  CREATE TABLE IF NOT EXISTS incident_notes (
    id TEXT PRIMARY KEY,
    incident_id TEXT NOT NULL,
    author TEXT NOT NULL,
    category TEXT NOT NULL,
    content TEXT NOT NULL,
    referenced_note_id TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (incident_id) REFERENCES rescue_incidents(id)
  );`,
  `  CREATE TABLE IF NOT EXISTS incident_notes (
    id TEXT PRIMARY KEY,
    incident_id TEXT NOT NULL,
    author TEXT NOT NULL,
    category TEXT NOT NULL,
    content TEXT NOT NULL,
    referenced_note_id TEXT,
    referenced_note_ids TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (incident_id) REFERENCES rescue_incidents(id)
  );`
);

// 更新 insertNote 预处理语句
dbContent = dbContent.replace(
  `    const insertNote = db.prepare(\`
      INSERT INTO incident_notes (id, incident_id, author, category, content, referenced_note_id, created_at)
      VALUES (@id, @incident_id, @author, @category, @content, @referenced_note_id, @created_at)
    \`)`,
  `    const insertNote = db.prepare(\`
      INSERT INTO incident_notes (id, incident_id, author, category, content, referenced_note_id, referenced_note_ids, created_at)
      VALUES (@id, @incident_id, @author, @category, @content, @referenced_note_id, @referenced_note_ids, @created_at)
    \`)`
);

// 更新种子数据中的所有 insertNote.run 调用
// 为每个备注添加 referenced_note_ids 字段
const notePattern = /insertNote\.run\(\{([^}]+)\}\)/g;
dbContent = dbContent.replace(notePattern, (match, content) => {
  if (content.includes('referenced_note_ids')) {
    return match;
  }
  
  // 提取 referenced_note_id
  const refIdMatch = content.match(/referenced_note_id:\s*(\w+|null)/);
  let referencedNoteIdsValue = 'null';
  
  if (refIdMatch && refIdMatch[1] !== 'null') {
    referencedNoteIdsValue = `JSON.stringify([${refIdMatch[1]}])`;
  }
  
  // 在 referenced_note_id 行后添加 referenced_note_ids
  return match.replace(
    /referenced_note_id:\s*(\w+|null),/,
    `referenced_note_id: $1,
      referenced_note_ids: ${referencedNoteIdsValue},`
  );
});

// 特别处理 note2_5，它引用了多个备注
dbContent = dbContent.replace(
  /note2_5,\s*\n\s+created_at:/,
  'note2_5,\n      referenced_note_ids: JSON.stringify([note2_1, note2_2, note2_4]),\n      created_at:'
);

fs.writeFileSync('/Users/liu/Documents/private/model-test/trae-20260601-4/api/db.ts', dbContent);
console.log('db.ts updated successfully');

console.log('All files updated successfully!');
