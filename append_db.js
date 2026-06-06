const fs = require('fs');

const part3 = `export function getLateReturns() {
  return db.prepare(\`
    SELECT r.*, s.name as student_name, s.dorm_room, s.counselor
    FROM late_return_records r
    LEFT JOIN students s ON r.student_id = s.student_id
    ORDER BY r.id DESC
  \`).all();
}

export function getLateReturnById(id: number) {
  const record: any = db.prepare(\`
    SELECT r.*, s.name as student_name, s.dorm_room, s.counselor
    FROM late_return_records r
    LEFT JOIN students s ON r.student_id = s.student_id
    WHERE r.id = ?
  \`).get(id);
  if (!record) return null;
  const logs = db.prepare('SELECT * FROM status_logs WHERE record_id = ? ORDER BY id ASC').all(id);
  return { ...record, logs };
}

`;

fs.appendFileSync('api/db.ts', part3);
console.log('Part 3 完成');
console.log('当前行数:', fs.readFileSync('api/db.ts', 'utf-8').split('\n').length);
