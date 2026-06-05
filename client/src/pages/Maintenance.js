import React, { useState, useEffect } from 'react';
import { maintenanceAPI, routeAPI, userAPI } from '../api';

const statusLabels = {
  pending: '待处理',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消'
};

const typeLabels = {
  rebolt: '换点',
  check: '安全检查',
  reset: '换线',
  other: '其他'
};

function Maintenance({ currentRole, currentUser }) {
  const [records, setRecords] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    loadData();
    const handleRoleChange = () => loadData();
    window.addEventListener('roleChange', handleRoleChange);
    return () => window.removeEventListener('roleChange', handleRoleChange);
  }, [currentRole]);

  const loadData = async () => {
    try {
      const [maintData, routeData, userData] = await Promise.all([
        maintenanceAPI.getAll(),
        routeAPI.getAll(),
        userAPI.getAll()
      ]);
      setRecords(maintData);
      setRoutes(routeData);
      setUsers(userData.filter(u => u.role === 'routesetter'));
    } catch (e) {
      console.error('加载数据失败', e);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await maintenanceAPI.updateStatus(id, { 
        status: newStatus,
        maintainer_id: currentRole === 'routesetter' ? currentUser?.id : undefined,
        completed_date: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : undefined
      });
      loadData();
      setSelectedRecord(null);
    } catch (e) {
      console.error('更新失败', e);
    }
  };

  const canEdit = currentRole === 'routesetter' || currentRole === 'manager';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 className="page-title" style={{ margin: 0 }}>线路维护</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div className="stat-card" style={{ borderLeft: '3px solid #f39c12' }}>
          <div className="label">待处理</div>
          <div className="value" style={{ color: '#f39c12' }}>
            {records.filter(r => r.status === 'pending').length}
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid #3498db' }}>
          <div className="label">进行中</div>
          <div className="value" style={{ color: '#3498db' }}>
            {records.filter(r => r.status === 'in_progress').length}
          </div>
        </div>
      </div>

      <h3 style={{ marginBottom: 16 }}>线路状态一览</h3>
      <div className="table-container" style={{ marginBottom: 32 }}>
        <table>
          <thead>
            <tr>
              <th>线路名称</th>
              <th>难度</th>
              <th>颜色</th>
              <th>区域</th>
              <th>状态</th>
              <th>上次维护</th>
            </tr>
          </thead>
          <tbody>
            {routes.map(r => (
              <tr key={r.id}>
                <td style={{ fontWeight: 500 }}>{r.name}</td>
                <td>{r.grade}</td>
                <td>
                  <span style={{ 
                    display: 'inline-block', 
                    width: 16, 
                    height: 16, 
                    borderRadius: '50%',
                    background: r.color === '绿色' ? '#27ae60' : r.color === '蓝色' ? '#3498db' : r.color === '红色' ? '#e74c3c' : '#f39c12',
                    marginRight: 8,
                    verticalAlign: 'middle'
                  }} />
                  {r.color}
                </td>
                <td>{r.wall}</td>
                <td>
                  <span className={`badge ${r.status === 'active' ? 'badge-green' : 'badge-yellow'}`}>
                    {r.status === 'active' ? '正常' : '维护中'}
                  </span>
                </td>
                <td>{r.last_maintenance || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ marginBottom: 16 }}>维护记录</h3>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>线路</th>
              <th>维护类型</th>
              <th>描述</th>
              <th>计划日期</th>
              <th>维护人</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id}>
                <td style={{ fontWeight: 500 }}>{r.route_name} ({r.grade})</td>
                <td>{typeLabels[r.type] || r.type}</td>
                <td>{r.description}</td>
                <td>{r.scheduled_date}</td>
                <td>{r.maintainer_name || '-'}</td>
                <td>
                  <span className={`task-status status-${r.status === 'in_progress' ? 'processing' : r.status}`}>
                    {statusLabels[r.status]}
                  </span>
                </td>
                <td>
                  {canEdit && r.status !== 'completed' && (
                    <>
                      {r.status === 'pending' && (
                        <button className="btn btn-primary btn-sm" onClick={() => handleStatusChange(r.id, 'in_progress')}>
                          开始
                        </button>
                      )}
                      {r.status === 'in_progress' && (
                        <button className="btn btn-success btn-sm" onClick={() => handleStatusChange(r.id, 'completed')}>
                          完成
                        </button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-state">暂无维护记录</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Maintenance;
