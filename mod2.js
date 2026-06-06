const fs = require('fs');

// 修改 insurance.ts - 更新 IncidentNote 接口
let insurance = fs.readFileSync('api/routes/insurance.ts', 'utf-8');

// 使用正则表达式替换，不关心换行符
insurance = insurance.replace(
  /interface IncidentNote \{[\s\S]*?\}/,
  'interface IncidentNote {\n  id: string\n  incident_id: string\n  author: string\n  category: string\n  content: string\n  referenced_note_id: string | null\n  referenced_note_ids: string[] | null\n  created_at: string\n}'
);

fs.writeFileSync('api/routes/insurance.ts', insurance);
console.log('Step 2 done: Updated IncidentNote interface in insurance.ts');
