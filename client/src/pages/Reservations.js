import React, { useState, useEffect } from 'react';
import { reservationAPI, memberAPI } from '../api';

const statusLabels = {
  confirmed: '已确认',
  pending: '待确认',
  cancelled: '已取消',
  completed: '已完成'
};

const typeLabels = {
  free: '自由攀',
  course: '课程',
  trial: '体验课'
};

const levelLabels = {
  beginner: '新手',
  intermediate: '进阶',
  advanced: '高手'
};

function Reservations({ currentRole, currentUser }) {
  const [reservations, setReservations] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadData();
    const handleRoleChange = () => loadData();
    window.addEventListener('roleChange', handleRoleChange);
    return () => window.removeEventListener('roleChange', handleRoleChange);
  }, [currentRole, selectedDate]);

  const loadData = async () => {
    try {
      const [resvData, memberData] = await Promise.all([
        reservationAPI.getAll({ date: selectedDate }),
        memberAPI.getAll()
      ]);
      setReservations(resvData);
      setMembers(memberData);
    } catch (e) {
      console.error('加载数据失败', e);
    }
  };

  const trialCount = reservations.filter(r => r.type === 'trial').length;
  const conversionCount = reservations.filter(r => r.type === 'trial' && r.status === 'completed').length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 className="page-title" style={{ margin: 0 }}>会员预约</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <input 
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: 6 }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="stat-card">
          <div className="label">今日预约</div>
          <div className="value">{reservations.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">体验课</div>
          <div className="value">{trialCount}</div>
        </div>
        <div className="stat-card">
          <div className="label">会员总数</div>
          <div className="value">{members.length}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid #e74c3c' }}>
          <div className="label">新手会员</div>
          <div className="value" style={{ color: '#e74c3c' }}>
            {members.filter(m => m.level === 'beginner').length}
          </div>
        </div>
      </div>

      <h3 style={{ marginBottom: 16 }}>预约列表</h3>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>会员</th>
              <th>级别</th>
              <th>时间</th>
              <th>类型</th>
              <th>状态</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map(r => (
              <tr key={r.id}>
                <td style={{ fontWeight: 500 }}>{r.member_name}</td>
                <td>
                  <span className={`badge ${r.level === 'beginner' ? 'badge-yellow' : r.level === 'intermediate' ? 'badge-blue' : 'badge-green'}`}>
                    {levelLabels[r.level] || r.level}
                  </span>
                </td>
                <td>{r.time_slot}</td>
                <td>{typeLabels[r.type] || r.type}</td>
                <td>
                  <span className={`task-status status-${r.status}`}>
                    {statusLabels[r.status]}
                  </span>
                </td>
                <td>{r.notes || '-'}</td>
              </tr>
            ))}
            {reservations.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-state">当日暂无预约</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 32 }}>
        <h3 style={{ marginBottom: 16 }}>会员列表</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>姓名</th>
                <th>电话</th>
                <th>级别</th>
                <th>会员到期</th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 500 }}>{m.name}</td>
                  <td>{m.phone || '-'}</td>
                  <td>
                    <span className={`badge ${m.level === 'beginner' ? 'badge-yellow' : m.level === 'intermediate' ? 'badge-blue' : 'badge-green'}`}>
                      {levelLabels[m.level] || m.level}
                    </span>
                  </td>
                  <td>{m.membership_expire || '非会员'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Reservations;
