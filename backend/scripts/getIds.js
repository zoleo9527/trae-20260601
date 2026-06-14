const { getDB } = require('../src/db');
const db = getDB();

console.log('=== 用户 ===');
db.prepare('SELECT id, name, role FROM users').all().forEach(u => {
  console.log(`${u.name}: ${u.id} (${u.role})`);
});

console.log('\n=== 学员 ===');
db.prepare('SELECT id, name, current_subject FROM students').all().forEach(s => {
  console.log(`${s.name}: ${s.id} (科目${s.current_subject})`);
});

console.log('\n=== 待审核考试预约 ===');
db.prepare(`
  SELECT eb.id, s.name as student_name, eb.subject, eb.status
  FROM exam_bookings eb
  JOIN students s ON eb.student_id = s.id
  WHERE eb.status = 'pending'
`).all().forEach(b => {
  console.log(`${b.student_name} 科目${b.subject}: ${b.id}`);
});

console.log('\n=== 考试场次（科目1） ===');
db.prepare('SELECT id, subject, exam_date, exam_time FROM exam_sessions WHERE subject = 1').all().forEach(s => {
  console.log(`科目${s.subject} ${s.exam_date} ${s.exam_time}: ${s.id}`);
});

console.log('\n=== 补考 ===');
db.prepare(`
  SELECT m.id, s.name as student_name, m.subject, m.status
  FROM makeup_exams m
  JOIN students s ON m.student_id = s.id
`).all().forEach(m => {
  console.log(`${m.student_name} 科目${m.subject}: ${m.id} (${m.status})`);
});
