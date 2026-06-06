const fs = require("fs");
let content = fs.readFileSync("api/routes/incidents.ts", "utf-8");

// 1. 修改 getMaterialWithNotes 中的查询结果
content = content.replace(
  ".all(...noteIds) as IncidentNote[]",
  ".all(...noteIds).map(n => processNote(n as Record<string, unknown>)) as IncidentNote[]"
);
content = content.replace(
  ".all(...anomalyNoteIds) as IncidentNote[]",
  ".all(...anomalyNoteIds).map(n => processNote(n as Record<string, unknown>)) as IncidentNote[]"
);
console.log("1. getMaterialWithNotes updated");

// 2. 修改事件详情接口（GET /:id）中的 notes
content = content.replace(
  "const notes = db.prepare('SELECT * FROM incident_notes WHERE incident_id = ? ORDER BY created_at ASC').all(id)",
  "const notesRaw = db.prepare('SELECT * FROM incident_notes WHERE incident_id = ? ORDER BY created_at ASC').all(id) as Record<string, unknown>[]\n  const notes = notesRaw.map(n => processNote(n))"
);
console.log("2. 事件详情接口 updated");

// 3. 修改获取备注列表接口（GET /:id/notes）
content = content.replace(
  "const notes = db.prepare('SELECT * FROM incident_notes WHERE incident_id = ? ORDER BY created_at DESC').all(id)\n  res.json({ success: true, data: notes })",
  "const notesRaw = db.prepare('SELECT * FROM incident_notes WHERE incident_id = ? ORDER BY created_at DESC').all(id) as Record<string, unknown>[]\n  const notes = notesRaw.map(n => processNote(n))\n  res.json({ success: true, data: notes })"
);
console.log("3. 获取备注列表接口 updated");

// 4. 修改创建备注接口（POST /:id/notes）的返回值
content = content.replace(
  "const note = db.prepare('SELECT * FROM incident_notes WHERE id = ?').get(noteId)\n  res.status(201).json({ success: true, data: note })",
  "const noteRaw = db.prepare('SELECT * FROM incident_notes WHERE id = ?').get(noteId) as Record<string, unknown>\n  const note = processNote(noteRaw)\n  res.status(201).json({ success: true, data: note })"
);
console.log("4. 创建备注接口 updated");

// 5. 修改 timeline 接口
content = content.replace(
  "SELECT id, 'note' as type, created_at, author as actor, category, content, referenced_note_id",
  "SELECT id, 'note' as type, created_at, author as actor, category, content, referenced_note_id, referenced_note_ids"
);
console.log("5. timeline 接口 updated");

fs.writeFileSync("api/routes/incidents.ts", content);
console.log("\nAll modifications completed!");
