import os

base_dir = "/Users/liu/Documents/private/model-test/trae-20260601-4"

# 1. api/db.ts
db_ts = """import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(__dirname, '..', 'data.json');

interface DataStore {
  students: any[];
  users: any[];
  keys_register: any[];
  late_return_records: any[];
  status_logs: any[];
}

let data: DataStore = {
  students: [],
  users: [],
  keys_register: [],
  late_return_records: [],
  status_logs: []
};

let nextRecordId = 1;
let nextLogId = 1;

export function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      data = JSON.parse(raw);
      nextRecordId = Math.max(0, ...data.late_return_records.map(r => r.id)) + 1;
      nextLogId = Math.max(0, ...data.status_logs.map(l => l.id)) + 1;
    }
  } catch (e) {
    console.log('加载数据失败，使用空数据');
  }
}

export function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export function getStudents() { return data.students; }
export function getUsers() { return data.users; }
export function getLateReturns() { return data.late_return_records; }
export function getStatusLogs() { return data.status_logs; }

export function insertStudent(s: any) { data.students.push(s); }
export function insertUser(u: any) { data.users.push(u); }
export function insertKey(k: any) { data.keys_register.push(k); }

export function insertLateReturn(r: any) {
  const id = nextRecordId++;
  const rec = { id, ...r, registered_at: new Date().toISOString() };
  data.late_return_records.push(rec);
  saveData();
  return id;
}

export function updateLateReturn(id: number, updates: any) {
  const i = data.late_return_records.findIndex(r => r.id === id);
  if (i >= 0) {
    data.late_return_records[i] = { ...data.late_return_records[i], ...updates };
    saveData();
  }
}

export function insertStatusLog(l: any) {
  const id = nextLogId++;
  const log = { id, ...l, created_at: new Date().toISOString() };
  data.status_logs.push(log);
  saveData();
  return id;
}

export function resetData() {
  data.late_return_records = [];
  data.status_logs = [];
  nextRecordId = 1;
  nextLogId = 1;
  saveData();
}

loadData();
"""

# 2. api/index.ts
index_ts = """import express from 'express';
import cors from 'cors';
import {
  getStudents, getUsers, getLateReturns, getStatusLogs,
  insertLateReturn, updateLateReturn, insertStatusLog, resetData, loadData
} from './db';

const app = express();
app.use(cors());
app.use(express.json());

loadData();

app.get('/api/students', (req, res) => {
  res.json(getStudents());
});

app.get('/api/users', (req, res) => {
  res.json(getUsers());
});

app.get('/api/late-returns', (req, res) => {
  const students = getStudents();
  const records = getLateReturns().map(r => {
    const s = students.find(s => s.student_id === r.student_id);
    return {
      ...r,
      student_name: s?.name,
      dorm_room: s?.dorm_room,
      counselor: s?.counselor
    };
  });
  res.json(records);
});

app.get('/api/late-returns/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const students = getStudents();
  const record = getLateReturns().find(r => r.id === id);
  if (!record) {
    return res.status(404).json({ error: '记录不存在' });
  }
  const s = students.find(s => s.student_id === record.student_id);
  const logs = getStatusLogs().filter(l => l.record_id === id);
  res.json({
    ...record,
    student_name: s?.name,
    dorm_room: s?.dorm_room,
    counselor: s?.counselor,
    logs
  });
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
    dorm_officer_note: officer_note,
    status: '已登记'
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
  
  const records = getLateReturns();
  const record = records.find(r => r.id === id);
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
  
  const records = getLateReturns();
  const record = records.find(r => r.id === id);
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
"""

# 3. api/seed.ts
seed_ts = """import { insertStudent, insertUser, insertKey, saveData, resetData } from './db';

resetData();

// 学生数据
insertStudent({ id: 'S001', name: '张三', student_id: '2024001', dorm_room: '3号楼101室', counselor: '李明华', phone: '13800138001' });
insertStudent({ id: 'S002', name: '李四', student_id: '2024002', dorm_room: '3号楼101室', counselor: '李明华', phone: '13800138002' });
insertStudent({ id: 'S003', name: '王五', student_id: '2024003', dorm_room: '3号楼102室', counselor: '李明华', phone: '13800138003' });
insertStudent({ id: 'S004', name: '赵六', student_id: '2024004', dorm_room: '3号楼102室', counselor: '王辅导员', phone: '13800138004' });
insertStudent({ id: 'S005', name: '孙七', student_id: '2024005', dorm_room: '3号楼103室', counselor: '王辅导员', phone: '13800138005' });

// 用户数据
insertUser({ id: 'U001', name: '张建国', role: 'dorm_officer' });
insertUser({ id: 'U002', name: '李明华', role: 'counselor' });
insertUser({ id: 'U003', name: '王师傅', role: 'repair' });

// 钥匙台账
insertKey({ id: 'K001', student_id: '2024001', key_number: 'KEY-101-01', status: '正常', issued_at: '2024-09-01' });
insertKey({ id: 'K002', student_id: '2024002', key_number: 'KEY-101-02', status: '正常', issued_at: '2024-09-01' });
insertKey({ id: 'K003', student_id: '2024003', key_number: 'KEY-102-01', status: '正常', issued_at: '2024-09-01' });
insertKey({ id: 'K004', student_id: '2024004', key_number: 'KEY-102-02', status: '丢失', issued_at: '2024-09-01' });
insertKey({ id: 'K005', student_id: '2024005', key_number: 'KEY-103-01', status: '正常', issued_at: '2024-09-01' });

saveData();
console.log('种子数据写入完成');
"""

# 4. index.html
index_html = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>学生宿舍晚归登记系统</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
"""

# 5. src/main.tsx
main_tsx = """import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
"""

# 6. src/App.tsx
app_tsx = """import React, { useState, useEffect } from 'react';

interface Student { id: string; name: string; student_id: string; dorm_room: string; counselor: string; phone: string; }
interface User { id: string; name: string; role: string; }
interface LateReturn {
  id: number; student_id: string; student_name?: string; dorm_room?: string; counselor?: string;
  late_time: string; return_time: string; reason: string;
  dorm_officer_id: string; dorm_officer_name: string; dorm_officer_note?: string;
  counselor_id?: string; counselor_name?: string; counselor_note?: string; counselor_followed_at?: string;
  repair_needed?: number; repair_note?: string; repair_person_id?: string; repair_person_name?: string;
  repair_completed_at?: string; status: string; registered_at: string;
  logs?: StatusLog[];
}
interface StatusLog {
  id: number; record_id: number; from_status: string | null; to_status: string;
  operator_id: string; operator_name: string; operator_role: string; note?: string; created_at: string;
}

const ROLE_NAMES: Record<string, string> = {
  dorm_officer: '宿管员',
  counselor: '辅导员',
  repair: '维修人员'
};

const STATUS_COLORS: Record<string, string> = {
  '已登记': '#e6f7ff',
  '已跟进': '#f6ffed',
  '待维修': '#fff7e6',
  '已完成': '#f5f5f5'
};

const STATUS_TEXT_COLORS: Record<string, string> = {
  '已登记': '#1890ff',
  '已跟进': '#52c41a',
  '待维修': '#fa8c16',
  '已完成': '#8c8c8c'
};

export default function App() {
  const [currentRole, setCurrentRole] = useState<string>('dorm_officer');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [records, setRecords] = useState<LateReturn[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<LateReturn | null>(null);
  const [activeTab, setActiveTab] = useState<string>('register');

  const [formData, setFormData] = useState({
    student_id: '', late_time: '', return_time: '', reason: '', officer_note: ''
  });

  const [counselorForm, setCounselorForm] = useState({
    counselor_note: '', repair_needed: false, repair_note: ''
  });

  const [repairForm, setRepairForm] = useState({ repair_note: '' });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const user = users.find(u => u.role === currentRole);
    if (user) setCurrentUser(user);
  }, [currentRole, users]);

  async function loadData() {
    try {
      const [sRes, uRes, rRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/users'),
        fetch('/api/late-returns')
      ]);
      const s = await sRes.json();
      const u = await uRes.json();
      const r = await rRes.json();
      setStudents(s);
      setUsers(u);
      setRecords(r);
    } catch (e) {
      console.error('加载数据失败', e);
    }
  }

  async function loadRecordDetail(id: number) {
    try {
      const res = await fetch(`/api/late-returns/${id}`);
      const data = await res.json();
      setSelectedRecord(data);
    } catch (e) {
      console.error('加载详情失败', e);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser || !formData.student_id) return;
    try {
      const res = await fetch('/api/late-returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          officer_id: currentUser.id,
          officer_name: currentUser.name
        })
      });
      if (res.ok) {
        setFormData({ student_id: '', late_time: '', return_time: '', reason: '', officer_note: '' });
        await loadData();
        alert('登记成功');
      }
    } catch (e) {
      console.error('登记失败', e);
    }
  }

  async function handleCounselorFollow() {
    if (!selectedRecord || !currentUser) return;
    try {
      const res = await fetch(`/api/late-returns/${selectedRecord.id}/counselor-follow`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          counselor_id: currentUser.id,
          counselor_name: currentUser.name,
          counselor_note: counselorForm.counselor_note,
          repair_needed: counselorForm.repair_needed,
          repair_note: counselorForm.repair_note
        })
      });
      if (res.ok) {
        setCounselorForm({ counselor_note: '', repair_needed: false, repair_note: '' });
        await loadData();
        await loadRecordDetail(selectedRecord.id);
        alert('跟进完成');
      }
    } catch (e) {
      console.error('跟进失败', e);
    }
  }

  async function handleRepairComplete() {
    if (!selectedRecord || !currentUser) return;
    try {
      const res = await fetch(`/api/late-returns/${selectedRecord.id}/repair-complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repair_person_id: currentUser.id,
          repair_person_name: currentUser.name,
          repair_note: repairForm.repair_note
        })
      });
      if (res.ok) {
        setRepairForm({ repair_note: '' });
        await loadData();
        await loadRecordDetail(selectedRecord.id);
        alert('维修完成');
      }
    } catch (e) {
      console.error('失败', e);
    }
  }

  async function handleResetData() {
    if (!confirm('确定要重置所有晚归记录和流转日志吗？')) return;
    try {
      await fetch('/api/reset-data', { method: 'POST' });
      await loadData();
      setSelectedRecord(null);
      alert('数据已重置');
    } catch (e) {
      console.error('重置失败', e);
    }
  }

  const filteredRecords = records.filter(r => {
    if (currentRole === 'dorm_officer') return true;
    if (currentRole === 'counselor') return r.status !== '已登记' || true;
    if (currentRole === 'repair') return r.status === '待维修' || r.status === '已完成';
    return true;
  });

  const pendingRecords = records.filter(r => {
    if (currentRole === 'counselor') return r.status === '已登记';
    if (currentRole === 'repair') return r.status === '待维修';
    return false;
  });

  return (
    <div className="app">
      <header className="header">
        <h1>学生宿舍晚归登记工作台</h1>
        <div className="header-actions">
          <div className="role-switcher">
            {['dorm_officer', 'counselor', 'repair'].map(role => (
              <button
                key={role}
                className={`role-btn ${currentRole === role ? 'active' : ''}`}
                onClick={() => setCurrentRole(role)}
              >
                {ROLE_NAMES[role]}
              </button>
            ))}
          </div>
          <button className="reset-btn" onClick={handleResetData}>重置数据</button>
        </div>
      </header>

      <div className="workspace">
        <div className="sidebar">
          {currentRole === 'dorm_officer' && (
            <>
              <div className="tabs">
                <button className={`tab ${activeTab === 'register' ? 'active' : ''}`} onClick={() => setActiveTab('register')}>
                  晚归登记
                </button>
                <button className={`tab ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
                  历史记录
                </button>
              </div>
              {activeTab === 'register' && (
                <div className="panel">
                  <h3>宿管员登记</h3>
                  <form onSubmit={handleRegister} className="form">
                    <div className="form-item">
                      <label>学生</label>
                      <select
                        value={formData.student_id}
                        onChange={e => setFormData({...formData, student_id: e.target.value})}
                        required
                      >
                        <option value="">请选择学生</option>
                        {students.map(s => (
                          <option key={s.student_id} value={s.student_id}>
                            {s.name} - {s.dorm_room}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-item">
                      <label>晚归时间</label>
                      <input
                        type="datetime-local"
                        value={formData.late_time}
                        onChange={e => setFormData({...formData, late_time: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-item">
                      <label>回寝时间</label>
                      <input
                        type="datetime-local"
                        value={formData.return_time}
                        onChange={e => setFormData({...formData, return_time: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-item">
                      <label>晚归原因</label>
                      <textarea
                        value={formData.reason}
                        onChange={e => setFormData({...formData, reason: e.target.value})}
                        rows={2}
                        required
                      />
                    </div>
                    <div className="form-item">
                      <label>宿管员备注</label>
                      <textarea
                        value={formData.officer_note}
                        onChange={e => setFormData({...formData, officer_note: e.target.value})}
                        rows={2}
                        placeholder="钥匙状态、学生状态等"
                      />
                    </div>
                    <button type="submit" className="btn btn-primary">提交登记</button>
                  </form>
                </div>
              )}
              {activeTab === 'list' && (
                <div className="panel">
                  <h3>所有记录 ({records.length})</h3>
                  <div className="record-list">
                    {records.map(r => (
                      <div
                        key={r.id}
                        className={`record-item ${selectedRecord?.id === r.id ? 'selected' : ''}`}
                        onClick={() => loadRecordDetail(r.id)}
                      >
                        <div className="record-header">
                          <span className="record-name">{r.student_name}</span>
                          <span className="status-badge" style={{background: STATUS_COLORS[r.status], color: STATUS_TEXT_COLORS[r.status]}}>
                            {r.status}
                          </span>
                        </div>
                        <div className="record-meta">{r.dorm_room} | {r.late_time?.slice(0, 16)}</div>
                      </div>
                    ))}
                    {records.length === 0 && <div className="empty">暂无记录</div>}
                  </div>
                </div>
              )}
            </>
          )}

          {currentRole === 'counselor' && (
            <>
              <div className="tabs">
                <button className={`tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
                  待跟进 ({pendingRecords.length})
                </button>
                <button className={`tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
                  全部记录
                </button>
              </div>
              <div className="panel">
                <h3>{activeTab === 'pending' ? '待跟进记录' : '全部记录'}</h3>
                <div className="record-list">
                  {(activeTab === 'pending' ? pendingRecords : filteredRecords).map(r => (
                    <div
                      key={r.id}
                      className={`record-item ${selectedRecord?.id === r.id ? 'selected' : ''}`}
                      onClick={() => loadRecordDetail(r.id)}
                    >
                      <div className="record-header">
                        <span className="record-name">{r.student_name}</span>
                        <span className="status-badge" style={{background: STATUS_COLORS[r.status], color: STATUS_TEXT_COLORS[r.status]}}>
                          {r.status}
                        </span>
                      </div>
                      <div className="record-meta">{r.dorm_room} | 登记: {r.registered_at?.slice(0, 16)}</div>
                    </div>
                  ))}
                  {(activeTab === 'pending' ? pendingRecords : filteredRecords).length === 0 && <div className="empty">暂无记录</div>}
                </div>
              </div>
            </>
          )}

          {currentRole === 'repair' && (
            <>
              <div className="tabs">
                <button className={`tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
                  待维修 ({pendingRecords.length})
                </button>
                <button className={`tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
                  维修记录
                </button>
              </div>
              <div className="panel">
                <h3>{activeTab === 'pending' ? '待维修任务' : '维修记录'}</h3>
                <div className="record-list">
                  {(activeTab === 'pending' ? pendingRecords : filteredRecords).map(r => (
                    <div
                      key={r.id}
                      className={`record-item ${selectedRecord?.id === r.id ? 'selected' : ''}`}
                      onClick={() => loadRecordDetail(r.id)}
                    >
                      <div className="record-header">
                        <span className="record-name">{r.student_name}</span>
                        <span className="status-badge" style={{background: STATUS_COLORS[r.status], color: STATUS_TEXT_COLORS[r.status]}}>
                          {r.status}
                        </span>
                      </div>
                      <div className="record-meta">{r.dorm_room} | {r.repair_note || '门锁维修'}</div>
                    </div>
                  ))}
                  {(activeTab === 'pending' ? pendingRecords : filteredRecords).length === 0 && <div className="empty">暂无记录</div>}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="detail-panel">
          {selectedRecord ? (
            <div className="detail-content">
              <h2>记录详情 #{selectedRecord.id}</h2>
              
              <div className="section">
                <h3>学生信息</h3>
                <div className="info-grid">
                  <div className="info-item"><label>姓名</label><span>{selectedRecord.student_name}</span></div>
                  <div className="info-item"><label>学号</label><span>{selectedRecord.student_id}</span></div>
                  <div className="info-item"><label>寝室</label><span>{selectedRecord.dorm_room}</span></div>
                  <div className="info-item"><label>辅导员</label><span>{selectedRecord.counselor}</span></div>
                </div>
              </div>

              <div className="section">
                <h3>宿管员登记材料</h3>
                <div className="info-grid">
                  <div className="info-item"><label>晚归时间</label><span>{selectedRecord.late_time?.slice(0, 16)}</span></div>
                  <div className="info-item"><label>回寝时间</label><span>{selectedRecord.return_time?.slice(0, 16)}</span></div>
                  <div className="info-item"><label>宿管员</label><span>{selectedRecord.dorm_officer_name}</span></div>
                  <div className="info-item"><label>登记时间</label><span>{selectedRecord.registered_at?.slice(0, 16)}</span></div>
                </div>
                <div className="info-item full">
                  <label>晚归原因</label>
                  <p>{selectedRecord.reason}</p>
                </div>
                {selectedRecord.dorm_officer_note && (
                  <div className="info-item full">
                    <label>宿管员备注</label>
                    <p>{selectedRecord.dorm_officer_note}</p>
                  </div>
                )}
              </div>

              {selectedRecord.counselor_name && (
                <div className="section">
                  <h3>辅导员跟进结论</h3>
                  <div className="info-grid">
                    <div className="info-item"><label>辅导员</label><span>{selectedRecord.counselor_name}</span></div>
                    <div className="info-item"><label>跟进时间</label><span>{selectedRecord.counselor_followed_at?.slice(0, 16)}</span></div>
                  </div>
                  {selectedRecord.counselor_note && (
                    <div className="info-item full">
                      <label>辅导员备注</label>
                      <p>{selectedRecord.counselor_note}</p>
                    </div>
                  )}
                  {selectedRecord.repair_needed ? (
                    <div className="info-item full">
                      <label>维修需求</label>
                      <p className="warning">需要维修：{selectedRecord.repair_note || '门锁问题'}</p>
                    </div>
                  ) : (
                    <div className="info-item full">
                      <label>处理结果</label>
                      <p>无需维修，跟进完成</p>
                    </div>
                  )}
                </div>
              )}

              {selectedRecord.repair_person_name && (
                <div className="section">
                  <h3>维修处理</h3>
                  <div className="info-grid">
                    <div className="info-item"><label>维修人员</label><span>{selectedRecord.repair_person_name}</span></div>
                    <div className="info-item"><label>完成时间</label><span>{selectedRecord.repair_completed_at?.slice(0, 16)}</span></div>
                  </div>
                  {selectedRecord.repair_note && (
                    <div className="info-item full">
                      <label>维修备注</label>
                      <p>{selectedRecord.repair_note}</p>
                    </div>
                  )}
                </div>
              )}

              {currentRole === 'counselor' && selectedRecord.status === '已登记' && (
                <div className="section action-section">
                  <h3>辅导员跟进操作</h3>
                  <div className="boundary-notice">
                    <strong>责任边界提示：</strong>宿管员负责登记事实，辅导员负责跟进处理和判断是否需要维修。
                  </div>
                  <div className="form">
                    <div className="form-item">
                      <label>辅导员跟进备注</label>
                      <textarea
                        value={counselorForm.counselor_note}
                        onChange={e => setCounselorForm({...counselorForm, counselor_note: e.target.value})}
                        rows={2}
                        placeholder="谈话情况、学生状态等"
                      />
                    </div>
                    <div className="form-item checkbox">
                      <label>
                        <input
                          type="checkbox"
                          checked={counselorForm.repair_needed}
                          onChange={e => setCounselorForm({...counselorForm, repair_needed: e.target.checked})}
                        />
                        需要维修人员介入
                      </label>
                    </div>
                    {counselorForm.repair_needed && (
                      <div className="form-item">
                        <label>维修说明</label>
                        <textarea
                          value={counselorForm.repair_note}
                          onChange={e => setCounselorForm({...counselorForm, repair_note: e.target.value})}
                          rows={2}
                          placeholder="门锁损坏、钥匙丢失等"
                        />
                      </div>
                    )}
                    <button className="btn btn-primary" onClick={handleCounselorFollow}>
                      提交跟进
                    </button>
                  </div>
                </div>
              )}

              {currentRole === 'repair' && selectedRecord.status === '待维修' && (
                <div className="section action-section">
                  <h3>维修处理</h3>
                  <div className="form">
                    <div className="form-item">
                      <label>维修备注</label>
                      <textarea
                        value={repairForm.repair_note}
                        onChange={e => setRepairForm({...repairForm, repair_note: e.target.value})}
                        rows={2}
                        placeholder="维修情况说明"
                      />
                    </div>
                    <button className="btn btn-primary" onClick={handleRepairComplete}>
                      标记完成
                    </button>
                  </div>
                </div>
              )}

              {selectedRecord.logs && selectedRecord.logs.length > 0 && (
                <div className="section">
                  <h3>流转日志</h3>
                  <div className="timeline">
                    {selectedRecord.logs.map(log => (
                      <div key={log.id} className="timeline-item">
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                          <div className="timeline-header">
                            <span className="timeline-operator">{log.operator_name}</span>
                            <span className="timeline-role">({ROLE_NAMES[log.operator_role]})</span>
                            <span className="timeline-time">{log.created_at?.slice(0, 16)}</span>
                          </div>
                          <div className="timeline-status">
                            {log.from_status && <span>{log.from_status} → </span>}
                            <strong>{log.to_status}</strong>
                          </div>
                          {log.note && <div className="timeline-note">{log.note}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <p>请从左侧选择一条记录查看详情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
"""

# 7. src/index.css
index_css = """* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  background: #f0f2f5;
  color: #333;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: #001529;
  color: white;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.header h1 {
  font-size: 20px;
  font-weight: 500;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.role-switcher {
  display: flex;
  gap: 4px;
  background: rgba(255,255,255,0.1);
  padding: 4px;
  border-radius: 6px;
}

.role-btn {
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.7);
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.role-btn.active {
  background: #1890ff;
  color: white;
}

.reset-btn {
  background: #ff4d4f;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.workspace {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 380px;
  background: white;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #e8e8e8;
}

.tab {
  flex: 1;
  background: none;
  border: none;
  padding: 12px 16px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab.active {
  color: #1890ff;
  border-bottom-color: #1890ff;
}

.panel {
  padding: 16px;
  flex: 1;
}

.panel h3 {
  font-size: 16px;
  margin-bottom: 16px;
  color: #262626;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-item label {
  font-size: 13px;
  color: #595959;
  font-weight: 500;
}

.form-item input,
.form-item select,
.form-item textarea {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
}

.form-item input:focus,
.form-item select:focus,
.form-item textarea:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.form-item.checkbox label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: normal;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background: #1890ff;
  color: white;
}

.btn-primary:hover {
  background: #40a9ff;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.record-item {
  padding: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.record-item:hover {
  border-color: #1890ff;
  background: #e6f7ff;
}

.record-item.selected {
  border-color: #1890ff;
  background: #e6f7ff;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.record-name {
  font-weight: 500;
  color: #262626;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.record-meta {
  font-size: 12px;
  color: #8c8c8c;
}

.empty {
  text-align: center;
  padding: 40px 20px;
  color: #bfbfbf;
  font-size: 14px;
}

.detail-panel {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.detail-content {
  max-width: 900px;
  margin: 0 auto;
}

.detail-content h2 {
  font-size: 20px;
  margin-bottom: 24px;
  color: #262626;
  padding-bottom: 12px;
  border-bottom: 2px solid #1890ff;
}

.section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.section h3 {
  font-size: 16px;
  margin-bottom: 16px;
  color: #262626;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item.full {
  grid-column: 1 / -1;
  margin-bottom: 0;
}

.info-item label {
  font-size: 13px;
  color: #8c8c8c;
}

.info-item span,
.info-item p {
  font-size: 14px;
  color: #262626;
}

.info-item p {
  margin: 0;
  line-height: 1.6;
}

.warning {
  color: #fa8c16;
  font-weight: 500;
}

.boundary-notice {
  background: #fff7e6;
  border: 1px solid #ffd591;
  padding: 12px 16px;
  border-radius: 4px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #d46b08;
}

.action-section {
  border: 2px solid #1890ff;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #bfbfbf;
  font-size: 16px;
}

.timeline {
  position: relative;
  padding-left: 24px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 4px;
  bottom: 4px;
  width: 2px;
  background: #e8e8e8;
}

.timeline-item {
  position: relative;
  margin-bottom: 20px;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-dot {
  position: absolute;
  left: -20px;
  top: 4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #1890ff;
  border: 2px solid white;
  box-shadow: 0 0 0 2px #1890ff;
}

.timeline-content {
  background: #fafafa;
  padding: 12px 16px;
  border-radius: 6px;
}

.timeline-header {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 6px;
  font-size: 13px;
}

.timeline-operator {
  font-weight: 500;
  color: #262626;
}

.timeline-role {
  color: #8c8c8c;
}

.timeline-time {
  color: #8c8c8c;
  margin-left: auto;
}

.timeline-status {
  font-size: 14px;
  color: #595959;
  margin-bottom: 4px;
}

.timeline-note {
  font-size: 13px;
  color: #8c8c8c;
  font-style: italic;
}
"""

# 写入所有文件
files = {
    'api/db.ts': db_ts,
    'api/index.ts': index_ts,
    'api/seed.ts': seed_ts,
    'index.html': index_html,
    'src/main.tsx': main_tsx,
    'src/App.tsx': app_tsx,
    'src/index.css': index_css
}

for filepath, content in files.items():
    full_path = os.path.join(base_dir, filepath)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'已生成: {filepath} ({len(content.splitlines())} 行)')

print('\n所有文件生成完成!')
