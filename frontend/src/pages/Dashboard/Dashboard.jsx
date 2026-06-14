import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { delegationService } from '../../services/delegationService.js';
import { STATUS_CONFIG } from '../../utils/constants.js';
import './Dashboard.css';

function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    abnormal: 0,
    completed: 0
  });
  const [recentDelegations, setRecentDelegations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await delegationService.getAll({ limit: 100 });
      const delegations = response.data?.delegations || [];

      const statusCounts = {
        total: delegations.length,
        pending: delegations.filter(d => d.status === 'PENDING_ACCEPTANCE').length,
        inProgress: delegations.filter(d => ['ACCEPTANCE_IN_PROGRESS', 'MATERIAL_VERIFICATION', 'QC_REVIEW_PENDING'].includes(d.status)).length,
        abnormal: delegations.filter(d => d.is_abnormal === 1).length,
        completed: delegations.filter(d => d.status === 'COMPLETED').length
      };

      setStats(statusCounts);
      setRecentDelegations(delegations.slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    return STATUS_CONFIG[status]?.label || status;
  };

  const getStatusColor = (status) => {
    return STATUS_CONFIG[status]?.color || '#8c8c8c';
  };

  if (loading) {
    return <div className="loading-container">加载中...</div>;
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1 className="page-title">仪表盘</h1>
        <p className="page-subtitle">查看委托单统计和工作概况</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">总委托单</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">待受理</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <div className="stat-value">{stats.inProgress}</div>
            <div className="stat-label">处理中</div>
          </div>
        </div>

        <div className="stat-card stat-card-warning">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.abnormal}</div>
            <div className="stat-label">异常单</div>
          </div>
        </div>

        <div className="stat-card stat-card-success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-label">已完成</div>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <section className="section">
          <div className="section-header">
            <h2>最新委托单</h2>
            <Link to="/delegations" className="view-more">查看全部</Link>
          </div>

          <div className="delegation-list">
            {recentDelegations.length === 0 ? (
              <div className="empty-state">暂无委托单</div>
            ) : (
              recentDelegations.map((delegation) => (
                <Link
                  key={delegation.id}
                  to={`/delegations/${delegation.id}`}
                  className="delegation-item"
                >
                  <div className="delegation-main">
                    <div className="delegation-number">{delegation.delegation_number}</div>
                    <div className="delegation-applicant">{delegation.applicant_name}</div>
                  </div>
                  <div className="delegation-meta">
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(delegation.status) }}
                    >
                      {getStatusLabel(delegation.status)}
                    </span>
                    {delegation.is_abnormal === 1 && (
                      <span className="abnormal-badge">异常</span>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="section">
          <h2>快速操作</h2>
          <div className="quick-actions">
            <Link to="/delegations/create" className="action-card">
              <div className="action-icon">➕</div>
              <div className="action-label">新建委托单</div>
            </Link>
            <Link to="/delegations?isAbnormal=true" className="action-card">
              <div className="action-icon">⚠️</div>
              <div className="action-label">查看异常单</div>
            </Link>
            <Link to="/audit-logs" className="action-card">
              <div className="action-icon">📝</div>
              <div className="action-label">审计日志</div>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
