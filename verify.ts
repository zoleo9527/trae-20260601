import db from "./api/db";

const materials = db.prepare(`
  SELECT im.material_type, im.status, im.anomaly_referenced_note_ids, ri.incident_no
  FROM insurance_materials im
  JOIN rescue_incidents ri ON im.incident_id = ri.id
  WHERE ri.incident_no = "RSC-2026-002"
`).all();

console.log("RSC-2026-002 保险材料:");
materials.forEach(mat => {
  console.log(`  - ${mat.material_type} (${mat.status})`);
  console.log(`    anomaly_referenced_note_ids: ${mat.anomaly_referenced_note_ids}`);
});

const rejected = materials.find(m => m.status === "rejected");
if (rejected && rejected.anomaly_referenced_note_ids) {
  const noteIds = JSON.parse(rejected.anomaly_referenced_note_ids);
  console.log(`\n被驳回材料关联了 ${noteIds.length} 个备注ID`);
  if (noteIds.length > 0) {
    const notes = db.prepare(`SELECT author, category, substr(content, 1, 80) as content FROM incident_notes WHERE id = ?`).all(noteIds[0]);
    console.log("关联的备注:");
    notes.forEach(note => {
      console.log(`  [${note.category}] ${note.author}: ${note.content}...`);
    });
  }
}
console.log("\n✓ 验证完成！");
