const fs = require('fs');
let content = fs.readFileSync('api/routes/insurance.ts', 'utf-8');

// 在 getMaterialWithNotes 函数之前添加 processNote 函数
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
    ...note as IncidentNote,
    referenced_note_ids: noteIds
  }
}

`;

const getMaterialFunc = 'function getMaterialWithNotes(material: Record<string, unknown>): InsuranceMaterialWithNotes {';
content = content.replace(getMaterialFunc, processNoteFunc + getMaterialFunc);

fs.writeFileSync('api/routes/insurance.ts', content);
console.log('processNote function added to insurance.ts');
