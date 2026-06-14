const { initDB, getDB } = require('../src/db');
initDB();
const db = getDB();

console.log('=== 学员考试预约 ===');
const students = db.prepare('SELECT id, name FROM students').all();
students.forEach(s => {
  const bookings = db.prepare('SELECT id, subject, status FROM exam_bookings WHERE student_id = ?').all(s.id);
  if (bookings.length > 0) {
    console.log(`\n${s.name}:`);
    bookings.forEach(b => {
      console.log(`  科目${b.subject}: ${b.status} (ID: ${b.id})`);
    });
  }
});

console.log('\n=== 所有补考 ===');
const makeups = db.prepare(`
  SELECT m.id, m.subject, m.status, s.name
  FROM makeup_exams m
  JOIN students s ON m.student_id = s.id
`).all();
makeups.forEach(m => {
  console.log(`  ${m.name} 科目${m.subject}: ${m.id} (${m.status})`);
});
