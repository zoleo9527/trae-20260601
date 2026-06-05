import React, { useState, useEffect } from 'react';
import { dashboardAPI, scheduleAPI, riskAPI } from '../api';
import ScheduleModal from '../components/ScheduleModal';
import RiskModal from '../components/RiskModal';

const statusLabels = {
  open: '待处理',
  processing: '处理中',
  scheduled: '已排班',
  pending_review: '待审核',
  confirmed: '已确认',
  pending: '待确认',
  checked_in: '已签到',
  in_progress: '进行中'
};

function Dashboard({ currentRole, currentUser }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadData();
    const handleRoleChange = () => loadData();
    window.addEventListener('roleChange', handleRoleChange);
    return () => window.removeEventListener('roleChange', handleRoleChange);
  }, [currentRole, refreshKey]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await dashboardAPI.getToday();
      setData(result);
    } catch (e) {
      console.error('加载看板失败', e);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = (task) => {
    if (task.type === 'schedule') {
      setSelectedSchedule({ id: task.id, status: task.status });
    } else if (task.type === 'risk') {
      setSelectedRisk({ id: task.id, status: task.status, severity: task.severity });
    }
  };

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
  };

  if (loading) return <div>加载中...</div>;
  if (!data) return <div>暂无数据</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 className="page-title" style={{ margin: 0 }}>今日待办</h1>
        <button className="btn btn-secondary btn-sm" onClick={handleRefresh}>刷新</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">今日预约</div>
          <div className="value">{data.stats.reservations || 0}</div>
        </div>
        <div className="stat-card">
          <div className="label">在岗人员</div>
          <div className="value">{data.stats.staffOnDuty || 0}</div>
        </div>
        <div className="stat-card">
          <div className="label">待处理风险</div>
          <div className="value" style={{ color: data.stats.activeRisks > 0 ? '#e74c3c' : '#27ae60' }}>
            {data.stats.activeRisks || 0}
          </div>
        </div>
        <div className="stat-card">
          <div className="label">待维护线路</div>
          <div className="value">{data.stats.pendingMaintenance || 0}</div>
        </div>
      </div>

      {data.tasks.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <div>今日暂无待办事项</div>
        </div>
      ) : (
        data.tasks.map((section, idx) => (
          <div key={idx} className="tasks-section">
            <h3>
              <span className={`priority-${section.priority}`}>
                {section.priority === 'high' ? '🔴' : section.priority === 'medium' ? '🟡' : '🔵'}
              </span>
              {section.category}
              <span style={{ fontSize: 13, color: '#888', marginLeft: 8 }}>
                ({section.items.length} 项)
              </span>
            </h3>
            {section.items.map(item => (
              <div 
                key={item.id} 
                className={`task-item ${item.severity ? `severity-${item.severity}` : ''}`}
                onClick={() => handleTaskClick(item)}
              >
                <div className="task-info">
                  <div className="task-title">{item.title}</div>
                  <div className="task-subtitle">{item.subtitle}</div>
                </div>
                <span className={`task-status status-${item.status}`}>
                  {statusLabels[item.status] || item.status}
                </span>
              </div>
            ))}
          </div>
        ))
      )}

      {selectedSchedule && (
        <ScheduleModal
          scheduleId={selectedSchedule.id}
          currentRole={currentRole}
          currentUser={currentUser}
          onClose={() => setSelectedSchedule(null)}
          onUpdated={handleRefresh}
        />
      )}

      {selectedRisk && (
        <RiskModal
          riskId={selectedRisk.id}
          currentRole={currentRole}
          currentUser={currentUser}
          onClose={() => setSelectedRisk(null)}
          onUpdated={handleRefresh}
        />
      )}
    </div>
  );
}

export default Dashboard;
