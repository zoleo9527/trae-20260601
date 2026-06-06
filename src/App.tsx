import React, { useState, useEffect } from 'react';

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
