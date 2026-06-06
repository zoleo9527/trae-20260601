import fs from 'fs';

const filePath = '/Users/liu/Documents/private/model-test/trae-20260601-4/api/db.ts';
let content = fs.readFileSync(filePath, 'utf8');

// 1. 在 incident_notes 表中添加 referenced_note_ids 字段
content = content.replace(
  '    referenced_note_id TEXT,\n    created_at TEXT NOT NULL,\n    FOREIGN KEY (incident_id) REFERENCES rescue_incidents(id)',
  '    referenced_note_id TEXT,\n    referenced_note_ids TEXT,\n    created_at TEXT NOT NULL,\n    FOREIGN KEY (incident_id) REFERENCES rescue_incidents(id)'
);

// 2. 更新 insertNote 预编译语句
content = content.replace(
  'INSERT INTO incident_notes (id, incident_id, author, category, content, referenced_note_id, created_at)\n      VALUES (@id, @incident_id, @author, @category, @content, @referenced_note_id, @created_at)',
  'INSERT INTO incident_notes (id, incident_id, author, category, content, referenced_note_id, referenced_note_ids, created_at)\n      VALUES (@id, @incident_id, @author, @category, @content, @referenced_note_id, @referenced_note_ids, @created_at)'
);

// 3. 为所有备注添加 referenced_note_ids 字段
// note1_1
content = content.replace(
  "referenced_note_id: null,\n      created_at: '2026-06-03T09:22:00.000Z',\n    })\n    insertNote.run({\n      id: note1_2,",
  "referenced_note_id: null,\n      referenced_note_ids: JSON.stringify([]),\n      created_at: '2026-06-03T09:22:00.000Z',\n    })\n    insertNote.run({\n      id: note1_2,"
);

// note1_2
content = content.replace(
  "referenced_note_id: note1_1,\n      created_at: '2026-06-03T09:45:00.000Z',\n    })\n    insertNote.run({\n      id: note1_3,",
  "referenced_note_id: note1_1,\n      referenced_note_ids: JSON.stringify([note1_1]),\n      created_at: '2026-06-03T09:45:00.000Z',\n    })\n    insertNote.run({\n      id: note1_3,"
);

// note1_3
content = content.replace(
  "referenced_note_id: null,\n      created_at: '2026-06-03T10:10:00.000Z',\n    })\n    insertNote.run({\n      id: note1_4,",
  "referenced_note_id: null,\n      referenced_note_ids: JSON.stringify([]),\n      created_at: '2026-06-03T10:10:00.000Z',\n    })\n    insertNote.run({\n      id: note1_4,"
);

// note1_4
content = content.replace(
  "referenced_note_id: note1_2,\n      created_at: '2026-06-03T10:30:00.000Z',\n    })\n\n    insertTransition.run({",
  "referenced_note_id: note1_2,\n      referenced_note_ids: JSON.stringify([note1_2]),\n      created_at: '2026-06-03T10:30:00.000Z',\n    })\n\n    insertTransition.run({"
);

// note2_1
content = content.replace(
  "referenced_note_id: null,\n      created_at: '2026-06-02T14:38:00.000Z',\n    })\n    insertNote.run({\n      id: note2_2,",
  "referenced_note_id: null,\n      referenced_note_ids: JSON.stringify([]),\n      created_at: '2026-06-02T14:38:00.000Z',\n    })\n    insertNote.run({\n      id: note2_2,"
);

// note2_2
content = content.replace(
  "referenced_note_id: note2_1,\n      created_at: '2026-06-02T14:55:00.000Z',\n    })\n    insertNote.run({\n      id: note2_3,",
  "referenced_note_id: note2_1,\n      referenced_note_ids: JSON.stringify([note2_1]),\n      created_at: '2026-06-02T14:55:00.000Z',\n    })\n    insertNote.run({\n      id: note2_3,"
);

// note2_3
content = content.replace(
  "referenced_note_id: null,\n      created_at: '2026-06-02T15:05:00.000Z',\n    })\n    insertNote.run({\n      id: note2_4,",
  "referenced_note_id: null,\n      referenced_note_ids: JSON.stringify([]),\n      created_at: '2026-06-02T15:05:00.000Z',\n    })\n    insertNote.run({\n      id: note2_4,"
);

// note2_4 (anomaly)
content = content.replace(
  "referenced_note_id: note2_1,\n      created_at: '2026-06-02T16:20:00.000Z',\n    })\n    insertNote.run({\n      id: note2_5,",
  "referenced_note_id: note2_1,\n      referenced_note_ids: JSON.stringify([note2_1]),\n      created_at: '2026-06-02T16:20:00.000Z',\n    })\n    insertNote.run({\n      id: note2_5,"
);

// note2_5
content = content.replace(
  "referenced_note_id: note2_4,\n      created_at: '2026-06-02T17:30:00.000Z',\n    })\n    insertNote.run({\n      id: note2_6,",
  "referenced_note_id: note2_4,\n      referenced_note_ids: JSON.stringify([note2_4]),\n      created_at: '2026-06-02T17:30:00.000Z',\n    })\n    insertNote.run({\n      id: note2_6,"
);

// note2_6 (材料异常备注 - 特殊处理，包含所有关联备注)
content = content.replace(
  "referenced_note_id: note2_2,\n      created_at: '2026-06-02T17:45:00.000Z',\n    })\n\n    insertTransition.run({",
  "referenced_note_id: note2_2,\n      referenced_note_ids: JSON.stringify([note2_1, note2_2, note2_5]),\n      created_at: '2026-06-02T17:45:00.000Z',\n    })\n\n    insertTransition.run({"
);

// note3_1
content = content.replace(
  "referenced_note_id: null,\n      created_at: '2026-05-28T10:05:00.000Z',\n    })\n    insertNote.run({\n      id: note3_2,",
  "referenced_note_id: null,\n      referenced_note_ids: JSON.stringify([]),\n      created_at: '2026-05-28T10:05:00.000Z',\n    })\n    insertNote.run({\n      id: note3_2,"
);

// note3_2
content = content.replace(
  "referenced_note_id: note3_1,\n      created_at: '2026-05-28T12:30:00.000Z',\n    })\n    insertNote.run({\n      id: note3_3,",
  "referenced_note_id: note3_1,\n      referenced_note_ids: JSON.stringify([note3_1]),\n      created_at: '2026-05-28T12:30:00.000Z',\n    })\n    insertNote.run({\n      id: note3_3,"
);

// note3_3
content = content.replace(
  "referenced_note_id: null,\n      created_at: '2026-05-28T10:45:00.000Z',\n    })\n    insertNote.run({\n      id: note3_4,",
  "referenced_note_id: null,\n      referenced_note_ids: JSON.stringify([]),\n      created_at: '2026-05-28T10:45:00.000Z',\n    })\n    insertNote.run({\n      id: note3_4,"
);

// note3_4
content = content.replace(
  "referenced_note_id: note3_2,\n      created_at: '2026-05-28T14:10:00.000Z',\n    })\n    insertNote.run({\n      id: note3_5,",
  "referenced_note_id: note3_2,\n      referenced_note_ids: JSON.stringify([note3_2]),\n      created_at: '2026-05-28T14:10:00.000Z',\n    })\n    insertNote.run({\n      id: note3_5,"
);

// note3_5
content = content.replace(
  "referenced_note_id: note3_4,\n      created_at: '2026-05-28T15:00:00.000Z',\n    })\n    insertNote.run({\n      id: note3_6,",
  "referenced_note_id: note3_4,\n      referenced_note_ids: JSON.stringify([note3_4]),\n      created_at: '2026-05-28T15:00:00.000Z',\n    })\n    insertNote.run({\n      id: note3_6,"
);

// note3_6
content = content.replace(
  "referenced_note_id: note3_5,\n      created_at: '2026-05-29T15:00:00.000Z',\n    })\n\n    insertTransition.run({",
  "referenced_note_id: note3_5,\n      referenced_note_ids: JSON.stringify([note3_5]),\n      created_at: '2026-05-29T15:00:00.000Z',\n    })\n\n    insertTransition.run({"
);

// note4_1
content = content.replace(
  "referenced_note_id: null,\n      created_at: '2026-06-04T08:50:00.000Z',\n    })\n\n    insertTransition.run({",
  "referenced_note_id: null,\n      referenced_note_ids: JSON.stringify([]),\n      created_at: '2026-06-04T08:50:00.000Z',\n    })\n\n    insertTransition.run({"
);

// note5_1
content = content.replace(
  "referenced_note_id: null,\n      created_at: '2026-05-25T11:25:00.000Z',\n    })\n    insertNote.run({\n      id: note5_2,",
  "referenced_note_id: null,\n      referenced_note_ids: JSON.stringify([]),\n      created_at: '2026-05-25T11:25:00.000Z',\n    })\n    insertNote.run({\n      id: note5_2,"
);

// note5_2
content = content.replace(
  "referenced_note_id: note5_1,\n      created_at: '2026-05-25T12:10:00.000Z',\n    })\n    insertNote.run({\n      id: note5_3,",
  "referenced_note_id: note5_1,\n      referenced_note_ids: JSON.stringify([note5_1]),\n      created_at: '2026-05-25T12:10:00.000Z',\n    })\n    insertNote.run({\n      id: note5_3,"
);

// note5_3
content = content.replace(
  "referenced_note_id: null,\n      created_at: '2026-05-25T13:00:00.000Z',\n    })\n    insertNote.run({\n      id: note5_4,",
  "referenced_note_id: null,\n      referenced_note_ids: JSON.stringify([]),\n      created_at: '2026-05-25T13:00:00.000Z',\n    })\n    insertNote.run({\n      id: note5_4,"
);

// note5_4
content = content.replace(
  "referenced_note_id: null,\n      created_at: '2026-05-25T15:00:00.000Z',\n    })\n\n    insertTransition.run({",
  "referenced_note_id: null,\n      referenced_note_ids: JSON.stringify([]),\n      created_at: '2026-05-25T15:00:00.000Z',\n    })\n\n    insertTransition.run({"
);

// 更新 ins2_3 的 anomaly_referenced_note_ids，关联到 note2_6
content = content.replace(
  "anomaly_referenced_note_ids: JSON.stringify([note2_2]),",
  "anomaly_referenced_note_ids: JSON.stringify([note2_6]),"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('File modified successfully!');
