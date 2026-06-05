import React, { useState, useEffect } from 'react';
import { scheduleAPI, userAPI } from '../api';
import ScheduleModal from '../components/ScheduleModal';

const statusLabels = {
  draft: '草稿',
  pending_review: '待审核',
  scheduled: '已排班',
  checked_in: '已签到',
  completed: '已完成',
  rejected: '已退回',
  cancelled: '已取消'
};

const shiftLabels = {
  morning: '早班',
  afternoon: '午班',
  evening: '晚班'
};

function Schedules({ currentRole, currentUser }) {
  const [schedules, setSchedules] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    staff_id: '',
    date: new Date().toISOString().split('T')[0],
    shift: 'morning',
    role: 'belayer'
  });

  useEffect(() => {
    loadData();
    const handleRoleChange = () => loadData();
    window.addEventListener('roleChange', handleRoleChange);
    return () => window.removeEventListener('roleChange', handleRoleChange);
  }, [currentRole]);

  const loadData = async () => {
    try {
      const [schedData, userData] = await Promise.all([
        scheduleAPI.getAll(),
        userAPI.getAll()
      ]);
      setSchedules(schedData);
      setUsers(userData.filter(u => u.role === 'belayer' || u.role === 'routesetter'));
    } catch (e) {
      console.error('加载数据失败', e);
    }
  };

  const handleCreate = async () => {
    if (!newSchedule.staff_id) {
      alert('请选择保护员');
      return;
    }
    try {
      await scheduleAPI.create({
        ...newSchedule,
        assigned_by: currentUser?.id
      });
      setShowCreate(false);
      loadData();
    } catch (e) {
      console.error('创建失败', e);
    }
  };

  const filteredSchedules = filterStatus === 'all' 
    ? schedules 
    : schedules.filter(s => s.status === filterStatus);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 className="page-title" style={{ margin: 0 }}>保护员排班</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <select 
            className="role-selector"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="all">全部状态</option>
            {Object.entries(statusLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          {(currentRole === 'frontdesk' || currentRole === 'manager') && (
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              + 新建排班
            </button>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 24, padding: 16, background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>状态流转说明</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 13 }}>
          <span className="badge" style={{ background: '#e2e3e5', color: '#383d41' }}>草稿</span>
          <span>→</span>
          <span className="badge badge-yellow">待审核</span>
          <span>→</span>
          <span className="badge badge-blue">已排班</span>
          <span>→</span>
          <span className="badge badge-blue">已签到</span>
          <span>→</span>
          <span className="badge badge-green">已完成</span>
          <span style={{ margin: '0 8px' }}>|</span>
          <span className="badge badge-yellow">待审核</span>
          <span>→</span>
          <span className="badge badge-red">已退回</span>
          <span>→</span>
          <span className="badge badge-yellow">重新提交</span>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>保护员</th>
              <th>日期</th>
              <th>班次</th>
              <th>状态</th>
              <th>排班人</th>
              <th>审核人</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredSchedules.map(s => (
              <tr key={s.id}>
                <td>{s.staff_name}</td>
                <td>{s.date}</td>
                <td>{shiftLabels[s.shift] || s.shift}</td>
                <td>
                  <span className={`task-status status-${s.status}`}>
                    {statusLabels[s.status]}
                  </span>
                </td>
                <td>{s.assigned_by_name || '-'}</td>
                <td>{s.reviewed_by_name || '-'}</td>
                <td>
                  <button className="btn btn-primary btn-sm" onClick={() => setSelectedId(s.id)}>
                    查看
                  </button>
                </td>
              </tr>
            ))}
            {filteredSchedules.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-state">暂无排班记录</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedId && (
        <ScheduleModal
          scheduleId={selectedId}
          currentRole={currentRole}
          currentUser={currentUser}
          onClose={() => setSelectedId(null)}
          onUpdated={loadData}
        />
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>新建排班</h3>
              <button className="modal-close" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>保护员</label>
                <select 
                  value={newSchedule.staff_id}
                  onChange={e => setNewSchedule({...newSchedule, staff_id: e.target.value})}
                >
                  <option value="">请选择</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>日期</label>
                <input 
                  type="date" 
                  value={newSchedule.date}
                  onChange={e => setNewSchedule({...newSchedule, date: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>班次</label>
                <select 
                  value={newSchedule.shift}
                  onChange={e => setNewSchedule({...newSchedule, shift: e.target.value})}
                >
                  <option value="morning">早班 (09:00-15:00)</option>
                  <option value="afternoon">午班 (14:00-20:00)</option>
                  <option value="evening">晚班 (18:00-22:00)</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleCreate}>创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Schedules;
