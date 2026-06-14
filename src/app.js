const cors = require('cors');
const express = require('express');
const { getDb, init } = require('./db');
const registrationsRouter = require('./routes/registrations');
const documentsRouter = require('./routes/documents');
const auditRouter = require('./routes/audit');
const remindersRouter = require('./routes/reminders');
const exportRouter = require('./routes/export');

init();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/registrations', registrationsRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/audit', auditRouter);
app.use('/api/reminders', remindersRouter);
app.use('/api/export', exportRouter);

app.get('/api/exam-sessions', (req, res) => {
  const db = getDb();
  const sessions = db.prepare('SELECT * FROM exam_sessions ORDER BY exam_date').all();
  res.json({ code: 0, data: sessions });
});

app.get('/api/students', (req, res) => {
  const db = getDb();
  const students = db.prepare(`
    SELECT s.*, t.name as teacher_name
    FROM students s
    LEFT JOIN teachers t ON s.teacher_id = t.id
    ORDER BY s.id
  `).all();
  res.json({ code: 0, data: students });
});

app.get('/api/dashboard', (req, res) => {
  const db = getDb();

  const totalRegistrations = db.prepare('SELECT COUNT(*) as cnt FROM registrations').get().cnt;
  const submitted = db.prepare("SELECT COUNT(*) as cnt FROM registrations WHERE registration_status = 'submitted'").get().cnt;
  const approved = db.prepare("SELECT COUNT(*) as cnt FROM registrations WHERE registration_status = 'approved'").get().cnt;
  const returned = db.prepare("SELECT COUNT(*) as cnt FROM registrations WHERE registration_status = 'returned'").get().cnt;
  const unpaid = db.prepare("SELECT COUNT(*) as cnt FROM registrations WHERE payment_status = 'unpaid'").get().cnt;
  const unconfirmed = db.prepare("SELECT COUNT(*) as cnt FROM registrations WHERE teacher_confirmed = 0").get().cnt;
  const pendingDocs = db.prepare("SELECT COUNT(*) as cnt FROM registration_documents WHERE upload_status IN ('pending','rejected')").get().cnt;

  const deadlineApproaching = db.prepare(`
    SELECT r.*, s.name as student_name, s.guardian_phone, es.registration_deadline, es.name as exam_name,
      (SELECT COUNT(*) FROM registration_documents rd WHERE rd.registration_id = r.id AND rd.upload_status IN ('pending','rejected')) as missing_doc_count
    FROM registrations r
    JOIN students s ON r.student_id = s.id
    JOIN exam_sessions es ON r.exam_session_id = es.id
    WHERE es.registration_deadline <= date('now','+7 days','localtime')
      AND r.registration_status NOT IN ('approved')
    ORDER BY es.registration_deadline ASC
  `).all();

  const missingMaterialList = db.prepare(`
    SELECT r.id as registration_id, s.name as student_name, s.guardian_phone, es.name as exam_name,
      GROUP_CONCAT(
        CASE WHEN rd.upload_status = 'pending' THEN rd.document_type
             WHEN rd.upload_status = 'rejected' THEN rd.document_type || '(被退回:' || COALESCE(rd.rejection_reason,'') || ')'
        END, '|'
      ) as missing_items
    FROM registrations r
    JOIN students s ON r.student_id = s.id
    JOIN exam_sessions es ON r.exam_session_id = es.id
    JOIN registration_documents rd ON rd.registration_id = r.id
    WHERE rd.upload_status IN ('pending','rejected')
      AND r.registration_status NOT IN ('approved')
    GROUP BY r.id
    ORDER BY es.registration_deadline ASC
  `).all();

  res.json({
    code: 0,
    data: {
      summary: { totalRegistrations, submitted, approved, returned, unpaid, unconfirmed, pendingDocs },
      deadlineApproaching,
      missingMaterialList
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`考级报名审核服务已启动: http://localhost:${PORT}`);
});

module.exports = app;
