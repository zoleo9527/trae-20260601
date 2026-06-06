import express from "express";
import cors from "cors";
import {
  getStudents, getUsers, getLateReturns, getLateReturnById,
  insertLateReturn, updateLateReturn, insertStatusLog, resetData
} from "./db";
import { initDatabase } from "./schema";

const app = express();
app.use(cors());
app.use(express.json());

initDatabase();

app.get('/api/students', (req, res) => {
  res.json(getStudents());
});

app.get('/api/users', (req, res) => {
  res.json(getUsers());
});

app.get('/api/late-returns', (req, res) => {
  res.json(getLateReturns());
});

app.get('/api/late-returns/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const record = getLateReturnById(id);
  if (!record) {
    return res.status(404).json({ error: '记录不存在' });
  }
  res.json(record);
});

app.post('/api/late-returns', (req, res) => {
  const { student_id, late_time, return_time, reason, officer_id, officer_name, officer_note } = req.body;
  
  const recordId = insertLateReturn({
    student_id,
    late_time,
    return_time,
    reason,
    dorm_officer_id: officer_id,
    dorm_officer_name: officer_name,
    dorm_officer_note: officer_note
  });

  insertStatusLog({
    record_id: recordId,
    from_status: null,
    to_status: '已登记',
    operator_id: officer_id,
    operator_name: officer_name,
    operator_role: 'dorm_officer',
    note: officer_note || '宿管员完成晚归登记'
  });

  res.json({ id: recordId, success: true });
});

app.put('/api/late-returns/:id/counselor-follow', (req, res) => {
  const id = parseInt(req.params.id);
  const { counselor_id, counselor_name, counselor_note, repair_needed, repair_note } = req.body;
  
  const record = getLateReturnById(id);
  if (!record) {
    return res.status(404).json({ error: '记录不存在' });
  }

  const newStatus = repair_needed ? '待维修' : '已跟进';
  
  updateLateReturn(id, {
    counselor_id,
    counselor_name,
    counselor_note,
    counselor_followed_at: new Date().toISOString(),
    repair_needed: repair_needed ? 1 : 0,
    repair_note,
    status: newStatus
  });

  insertStatusLog({
    record_id: id,
    from_status: record.status,
    to_status: newStatus,
    operator_id: counselor_id,
    operator_name: counselor_name,
    operator_role: 'counselor',
    note: counselor_note || (repair_needed ? '辅导员跟进，需维修介入' : '辅导员跟进完成')
  });

  res.json({ success: true, status: newStatus });
});

app.put('/api/late-returns/:id/repair-complete', (req, res) => {
  const id = parseInt(req.params.id);
  const { repair_person_id, repair_person_name, repair_note } = req.body;
  
  const record = getLateReturnById(id);
  if (!record) {
    return res.status(404).json({ error: '记录不存在' });
  }

  updateLateReturn(id, {
    repair_person_id,
    repair_person_name,
    repair_completed_at: new Date().toISOString(),
    repair_note: repair_note || record.repair_note,
    status: '已完成'
  });

  insertStatusLog({
    record_id: id,
    from_status: record.status,
    to_status: '已完成',
    operator_id: repair_person_id,
    operator_name: repair_person_name,
    operator_role: 'repair',
    note: repair_note || '维修处理完成'
  });

  res.json({ success: true, status: '已完成' });
});

app.post('/api/reset-data', (req, res) => {
  resetData();
  res.json({ success: true });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
