const fs = require("fs");
let content = fs.readFileSync("api/routes/incidents.ts", "utf-8");

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

const marker = "anomaly_referenced_notes: anomalyReferencedNotes\n  }\n}";
const idx = content.indexOf(marker) + marker.length;
content = content.slice(0, idx) + processNoteFunc + content.slice(idx);

fs.writeFileSync("api/routes/incidents.ts", content);
console.log("processNote function added");
